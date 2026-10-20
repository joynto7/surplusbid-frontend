import type { AdminUserQuery, LotBrowseQuery, LotStatus, ReviewQuery } from "@/types/api";

/**
 * Query keys, shared by server prefetching (HydrationBoundary) and client
 * hooks so both sides address the same cache entries.
 */
export const qk = {
  me: ["me"] as const,
  categories: ["categories"] as const,
  lots: (q: LotBrowseQuery) => ["lots", q] as const,
  lot: (id: string) => ["lot", id] as const,
  related: (id: string) => ["lot", id, "related"] as const,
  bidHistory: (id: string, page: number, limit: number) => ["lot", id, "bids", page, limit] as const,
  myBids: ["my-bids"] as const,
  myListings: ["my-listings"] as const,
  myPayments: ["my-payments"] as const,
  payment: (id: string) => ["payment", id] as const,
  myReviews: (q: ReviewQuery) => ["reviews", "mine", q] as const,
  reviewable: ["reviews", "reviewable"] as const,
  receivedReviews: (q: ReviewQuery) => ["reviews", "received", q] as const,
  sellerReviews: (id: string, q: ReviewQuery) => ["reviews", "seller", id, q] as const,
  myDisputes: (page: number) => ["disputes", "mine", page] as const,
  recommendations: (seed: string[]) => ["ai", "recommendations", seed] as const,
  trending: ["ai", "trending"] as const,
  suggest: (q: string) => ["ai", "suggest", q] as const,
  adminStats: ["admin", "stats"] as const,
  adminAnalytics: ["admin", "analytics"] as const,
  adminInsights: ["admin", "insights"] as const,
  adminUsers: (q: AdminUserQuery) => ["admin", "users", q] as const,
  adminMessages: (q: Record<string, unknown>) => ["admin", "messages", q] as const,
  adminReviews: (q: ReviewQuery) => ["admin", "reviews", q] as const,
  adminDisputes: (q: Record<string, unknown>) => ["admin", "disputes", q] as const,
  auditLogs: (q: { page?: number; limit?: number; entityType?: string }) => ["admin", "audit", q] as const,
};

export const LOT_SORTS = {
  ending: { sortBy: "endTime", sortOrder: "asc", label: "Ending soonest" },
  newest: { sortBy: "createdAt", sortOrder: "desc", label: "Newly listed" },
  price_asc: { sortBy: "currentPriceCents", sortOrder: "asc", label: "Price: low to high" },
  price_desc: { sortBy: "currentPriceCents", sortOrder: "desc", label: "Price: high to low" },
  popular: { sortBy: "popularity", sortOrder: "desc", label: "Most bids" },
} as const;
export type LotSort = keyof typeof LOT_SORTS;

export const BROWSE_STATUSES = ["LIVE", "SOLD", "UNSOLD", "ENDED"] as const satisfies readonly LotStatus[];

/** Condition values sellers use; "Used" matches every used grade. */
export const LOT_CONDITIONS = [
  "New",
  "Refurbished",
  "Used - excellent",
  "Used - good",
  "Used - fair",
  "For parts",
] as const;

/** Every catalogue filter is URL state; prices are whole dollars in the URL. */
export const LOT_BROWSE_DEFAULTS = {
  q: "",
  categoryId: "",
  status: "LIVE",
  sort: "ending",
  minPrice: "",
  maxPrice: "",
  location: "",
  condition: "",
};
export const LOTS_PER_PAGE = 12;

const dollarsToCents = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
};

/** URL search params → API query. Used by the server page and the client browser alike. */
export function toLotQuery(p: Partial<Record<keyof typeof LOT_BROWSE_DEFAULTS | "page", string>>): LotBrowseQuery {
  const sort = LOT_SORTS[(p.sort as LotSort) ?? "ending"] ?? LOT_SORTS.ending;
  const status = BROWSE_STATUSES.find((s) => s === (p.status || LOT_BROWSE_DEFAULTS.status)) ?? "LIVE";
  const min = dollarsToCents(p.minPrice);
  const max = dollarsToCents(p.maxPrice);
  return {
    page: Math.max(1, Number(p.page) || 1),
    limit: LOTS_PER_PAGE,
    q: p.q?.trim() || undefined,
    categoryId: p.categoryId || undefined,
    status,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    minPriceCents: min,
    maxPriceCents: max && max > 0 ? max : undefined,
    location: p.location?.trim() || undefined,
    condition: p.condition || undefined,
  };
}

/** Shared by server prefetch and client queries so both use identical keys. */
export const VERIFICATION_QUEUE_QUERY = { page: 1, limit: 50, verificationStatus: "PENDING" as const };
export const AUDIT_PER_PAGE = 15;
