"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/queries";
import type { LotInput, LotListItem } from "@/types/api";

/** Publish a draft with an optimistic status flip in the listings table. */
export function usePublishLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.publishLot(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.myListings });
      const prev = qc.getQueryData<LotListItem[]>(qk.myListings);
      qc.setQueryData<LotListItem[]>(qk.myListings, (list) =>
        list?.map((l) => (l.id === id ? { ...l, status: "LIVE" } : l)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(qk.myListings, ctx.prev),
    onSuccess: (lot) => {
      toast.success("Lot published", { description: `${lot.title} is now live for bidding.` });
      qc.setQueryData(qk.lot(lot.id), lot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.myListings }),
    meta: { errorToast: "Couldn't publish the lot" },
  });
}

/** Soft-delete a draft, removing it from the table immediately. */
export function useDeleteLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteLot(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.myListings });
      const prev = qc.getQueryData<LotListItem[]>(qk.myListings);
      qc.setQueryData<LotListItem[]>(qk.myListings, (list) => list?.filter((l) => l.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(qk.myListings, ctx.prev),
    onSuccess: () => toast.success("Draft deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.myListings }),
    meta: { errorToast: "Couldn't delete the lot" },
  });
}

export function useUpdateLot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<LotInput>) => api.updateLot(id, input),
    onSuccess: (lot) => {
      qc.setQueryData(qk.lot(id), lot);
      qc.invalidateQueries({ queryKey: qk.myListings });
      toast.success("Draft updated");
    },
    meta: { errorToast: "Couldn't save the draft" },
  });
}
