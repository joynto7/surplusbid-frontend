import { depositFor } from "@/lib/config";
import type { LotListItem } from "@/types/api";

/** Seller KPIs derived from GET /lots/my-listings (the backend has no seller analytics endpoint). */
export function sellerStats(lots: LotListItem[]) {
  const live = lots.filter((l) => l.status === "LIVE");
  const drafts = lots.filter((l) => l.status === "DRAFT");
  const sold = lots.filter((l) => l.status === "SOLD");
  const closed = lots.filter((l) => ["SOLD", "UNSOLD", "ENDED"].includes(l.status));
  const hammerCents = sold.reduce((s, l) => s + (l.currentHighestBidAmountCents ?? 0), 0);
  const startingCents = sold.reduce((s, l) => s + l.startingPriceCents, 0);
  const liveBidValue = live.reduce((s, l) => s + (l.currentHighestBidAmountCents ?? 0), 0);
  return {
    live,
    drafts,
    sold,
    closed,
    hammerCents,
    liveBidValue,
    depositsSecuredCents: sold.reduce((s, l) => s + depositFor(l.startingPriceCents), 0),
    sellThrough: closed.length ? sold.length / closed.length : null,
    upliftPct: startingCents ? (hammerCents - startingCents) / startingCents : null,
  };
}

export const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
