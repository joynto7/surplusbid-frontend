"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { myBidsQuery, qk } from "@/lib/queries";
import { useDeposits } from "@/stores/deposit-store";
import type { BidHistoryItem, Lot, Paginated } from "@/types/api";

/** True when this buyer already holds a deposit on the lot (bid before, or authorized in this browser). */
export function useHasDeposit(lotId: string, enabled: boolean) {
  const local = useDeposits((s) => s.lotIds.includes(lotId));
  const bids = useQuery({ ...myBidsQuery(), enabled });
  return local || !!bids.data?.items.some((b) => b.lotId === lotId);
}

export function useAuthorizeDeposit(lotId: string) {
  const markAuthorized = useDeposits((s) => s.markAuthorized);
  return useMutation({
    mutationFn: async () => {
      try {
        return await api.authorizeDeposit(lotId);
      } catch (error) {
        // A hold from an earlier session still counts. The backend returns 409 for duplicates.
        if (error instanceof ApiError && error.status === 409 && /already exists/i.test(error.message)) return null;
        throw error;
      }
    },
    onSuccess: (hold) => {
      if (!hold?.clientSecret) markAuthorized(lotId);
    },
    meta: { errorToast: "Couldn't authorize the deposit" },
  });
}

/**
 * Places a bid with an optimistic update: the lot's current price and the bid
 * history change immediately, and roll back if the API rejects the bid.
 */
export function usePlaceBid(lotId: string) {
  const qc = useQueryClient();
  const historyKey = qk.bidHistory(lotId, 1, 20);

  return useMutation({
    mutationFn: (amountCents: number) => api.placeBid(lotId, amountCents),
    onMutate: async (amountCents) => {
      await Promise.all([qc.cancelQueries({ queryKey: qk.lot(lotId) }), qc.cancelQueries({ queryKey: historyKey })]);
      const prevLot = qc.getQueryData<Lot>(qk.lot(lotId));
      const prevHistory = qc.getQueryData<Paginated<BidHistoryItem>>(historyKey);

      qc.setQueryData<Lot>(qk.lot(lotId), (lot) => lot && { ...lot, currentHighestBidAmountCents: amountCents });
      qc.setQueryData<Paginated<BidHistoryItem>>(historyKey, (h) =>
        h
          ? {
              ...h,
              items: [
                { id: `optimistic-${Date.now()}`, amountCents, status: "WINNING", createdAt: new Date().toISOString() },
                ...h.items.map((b) => (b.status === "WINNING" ? { ...b, status: "OUTBID" as const } : b)),
              ],
              meta: { ...h.meta, total: h.meta.total + 1 },
            }
          : h,
      );
      return { prevLot, prevHistory };
    },
    onError: (_error, _amount, ctx) => {
      if (ctx?.prevLot) qc.setQueryData(qk.lot(lotId), ctx.prevLot);
      if (ctx?.prevHistory) qc.setQueryData(historyKey, ctx.prevHistory);
    },
    onSuccess: (bid) =>
      toast.success(`Bid placed: ${formatMoney(bid.amountCents)}`, { description: "You're the highest bidder." }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.lot(lotId) });
      qc.invalidateQueries({ queryKey: ["lot", lotId, "bids"] });
      qc.invalidateQueries({ queryKey: qk.myBids });
    },
    meta: { errorToast: "Bid rejected" },
  });
}
