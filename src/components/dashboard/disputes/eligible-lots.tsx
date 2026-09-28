"use client";

import { useQuery } from "@tanstack/react-query";
import { useLotsByIds } from "@/hooks/use-lots";
import { toPositions } from "@/lib/buyer";
import { myBidsQuery, myListingsQuery } from "@/lib/queries";
import { useRequiredSession } from "@/providers/session-provider";
import { DisputeForm } from "./dispute-form";

/** Buyers can dispute lots they won. */
export function BuyerDisputeForm() {
  const me = useRequiredSession();
  const bids = useQuery(myBidsQuery());
  const lots = useLotsByIds(bids.data?.items.map((b) => b.lotId) ?? []);
  const won = toPositions(bids.data?.items ?? [], lots.byId, me.id)
    .filter((p) => p.standing === "WON" && p.lot)
    .map((p) => ({ id: p.lotId, title: p.lot?.title ?? "" }));
  return <DisputeForm lots={won} loading={bids.isPending || lots.isPending} />;
}

/** Sellers can dispute their own sold lots (e.g. a buyer who never collected). */
export function SellerDisputeForm() {
  const listings = useQuery(myListingsQuery());
  const sold = (listings.data ?? []).filter((l) => l.status === "SOLD").map((l) => ({ id: l.id, title: l.title }));
  return <DisputeForm lots={sold} loading={listings.isPending} />;
}
