import type {
  AdminUser,
  AdminUserQuery,
  AuditLog,
  Bid,
  BidHistoryItem,
  Category,
  DashboardStats,
  DepositHold,
  Dispute,
  Lot,
  LotBrowseQuery,
  LotInput,
  LotListItem,
  Me,
  MyBid,
  Paginated,
  Payment,
} from "@/types/api";

/**
 * A fetcher resolves a backend path (e.g. "/lots?page=2") to the unwrapped
 * `data` of the response envelope. The server fetcher calls the backend with
 * the cookie's bearer token; the browser fetcher goes through /api/backend.
 */
export type Fetcher = <T>(path: string, init?: RequestInit & { next?: NextFetchRequestConfig }) => Promise<T>;

type Query = Record<string, string | number | undefined | null>;

export function qs(params: Query) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

const json = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
});

export function createEndpoints(f: Fetcher) {
  return {
    // Profile
    me: () => f<Me>("/users/me"),
    updateProfile: (input: { companyName?: string; taxId?: string }) =>
      f<Me>("/users/me", { method: "PATCH", ...json(input) }),

    // Categories
    categories: () => f<Category[]>("/categories", { next: { revalidate: 300, tags: ["categories"] } }),
    createCategory: (name: string) => f<Category>("/categories", { method: "POST", ...json({ name }) }),

    // Lots
    browseLots: (query: LotBrowseQuery = {}) => f<Paginated<Lot>>(`/lots${qs({ ...query })}`),
    lot: (id: string) => f<Lot>(`/lots/${id}`),
    myListings: () => f<LotListItem[]>("/lots/my-listings"),
    updateLot: (id: string, input: Partial<LotInput>) => f<Lot>(`/lots/${id}`, { method: "PATCH", ...json(input) }),
    deleteLot: (id: string) => f<Record<string, never>>(`/lots/${id}`, { method: "DELETE" }),
    publishLot: (id: string) => f<Lot>(`/lots/${id}/publish`, { method: "PATCH" }),

    // Bids & deposits
    authorizeDeposit: (lotId: string) => f<DepositHold>(`/lots/${lotId}/deposit`, { method: "POST" }),
    placeBid: (lotId: string, amountCents: number) =>
      f<Bid>(`/lots/${lotId}/bids`, { method: "POST", ...json({ amountCents }) }),
    bidHistory: (lotId: string, page = 1, limit = 20) =>
      f<Paginated<BidHistoryItem>>(`/lots/${lotId}/bids${qs({ page, limit })}`),
    myBids: (page = 1, limit = 50) => f<Paginated<MyBid>>(`/bids/my-bids${qs({ page, limit })}`),

    // Payments
    myPayments: (page = 1, limit = 50) => f<Paginated<Payment>>(`/payments/my-payments${qs({ page, limit })}`),
    payment: (id: string) => f<Payment>(`/payments/${id}`),
    /** Captures the deposit and returns a Stripe clientSecret for the balance charge. */
    initiatePayment: (paymentId: string) =>
      f<Payment & { clientSecret: string | null }>("/payments/initiate", { method: "POST", ...json({ paymentId }) }),

    // Disputes
    createDispute: (input: { lotId: string; reason: string; description: string }) =>
      f<Dispute>("/disputes", { method: "POST", ...json(input) }),
    resolveDispute: (id: string, input: { status: "RESOLVED" | "REJECTED"; resolutionNote: string }) =>
      f<Dispute>(`/disputes/${id}/resolve`, { method: "PATCH", ...json(input) }),

    // Admin
    adminUsers: (query: AdminUserQuery = {}) => f<Paginated<AdminUser>>(`/admin/users${qs({ ...query })}`),
    adminVerifyUser: (id: string, verificationStatus: "VERIFIED" | "REJECTED") =>
      f<AdminUser>(`/admin/users/${id}/verify`, { method: "PATCH", ...json({ verificationStatus }) }),
    adminStats: () => f<DashboardStats>("/admin/dashboard-stats"),
    adminAuditLogs: (query: { page?: number; limit?: number; entityType?: string } = {}) =>
      f<Paginated<AuditLog>>(`/admin/audit-logs${qs({ ...query })}`),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
