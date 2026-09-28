import type { Lot, MyBid } from "@/types/api";

export type Standing = "WINNING" | "OUTBID" | "WON" | "LOST";

export interface BidPosition {
  lotId: string;
  myTopCents: number;
  bidCount: number;
  lastBidAt: string;
  standing: Standing;
  lot?: Lot;
}

/**
 * Collapses the buyer's raw bid log into one row per lot: their highest bid,
 * how many bids they placed, and where they stand now. When the lot is
 * loaded, the lot's status and highest bidder decide won/lost.
 */
export function toPositions(bids: MyBid[], lots: Map<string, Lot>, buyerId: string): BidPosition[] {
  const byLot = new Map<string, MyBid[]>();
  for (const b of bids) byLot.set(b.lotId, [...(byLot.get(b.lotId) ?? []), b]);

  return [...byLot.entries()]
    .map(([lotId, list]) => {
      const lot = lots.get(lotId);
      const top = Math.max(...list.map((b) => b.amountCents));
      const last = list.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      const leading = lot ? lot.currentHighestBidderId === buyerId : list.some((b) => b.status === "WINNING");
      const closed = lot && lot.status !== "LIVE";
      const standing: Standing = closed
        ? leading && lot.status === "SOLD"
          ? "WON"
          : "LOST"
        : leading
          ? "WINNING"
          : "OUTBID";
      return { lotId, myTopCents: top, bidCount: list.length, lastBidAt: last.createdAt, standing, lot };
    })
    .sort((a, b) => (a.lastBidAt < b.lastBidAt ? 1 : -1));
}
