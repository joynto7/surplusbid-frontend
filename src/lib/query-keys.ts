import type { AdminUserQuery, LotBrowseQuery, LotStatus } from "@/types/api";

/**
 * Query keys, shared by server prefetching (HydrationBoundary) and client
 * hooks so both sides address the same cache entries.
 */
export const qk = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  lots: (q: LotBrowseQuery) => ["lots", q] as const,
  lot: (id: string) => ["lot", id] as const,
  bidHistory: (id: string, page: number, limit: number) => ["lot", id, "bids", page, limit] as const,
  myBids: ["my-bids"] as const,
  myListings: ["my-listings"] as const,
  myPayments: ["my-payments"] as const,
  payment: (id: string) => ["payment", id] as const,
  adminStats: ["admin", "stats"] as const,
  adminUsers: (q: AdminUserQuery) => ["admin", "users", q] as const,
  auditLogs: (q: { page?: number; limit?: number; entityType?: string }) => ["admin", "audit", q] as const,
};

export const LOT_SORTS = {
  ending: { sortBy: "endTime", sortOrder: "asc", label: "Ending soonest" },
  newest: { sortBy: "createdAt", sortOrder: "desc", label: "Newly listed" },
  price_desc: { sortBy: "currentHighestBidAmountCents", sortOrder: "desc", label: "Highest bid" },
  price_asc: { sortBy: "currentHighestBidAmountCents", sortOrder: "asc", label: "Lowest bid" },
} as const;
export type LotSort = keyof typeof LOT_SORTS;

export const BROWSE_STATUSES = ["LIVE", "SOLD", "UNSOLD", "ENDED"] as const satisfies readonly LotStatus[];

export const LOT_BROWSE_DEFAULTS = { q: "", categoryId: "", status: "LIVE", sort: "ending" };
export const LOTS_PER_PAGE = 12;

/** URL search params → API query. Used by the server page and the client browser alike. */
export function toLotQuery(p: Partial<Record<keyof typeof LOT_BROWSE_DEFAULTS | "page", string>>): LotBrowseQuery {
  const sort = LOT_SORTS[(p.sort as LotSort) ?? "ending"] ?? LOT_SORTS.ending;
  const status = BROWSE_STATUSES.find((s) => s === (p.status || LOT_BROWSE_DEFAULTS.status)) ?? "LIVE";
  return {
    page: Math.max(1, Number(p.page) || 1),
    limit: LOTS_PER_PAGE,
    q: p.q?.trim() || undefined,
    categoryId: p.categoryId || undefined,
    status,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  };
}
