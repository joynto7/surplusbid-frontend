import type {
  AdminInsights,
  AdminUser,
  AdminUserQuery,
  Analytics,
  AssistantReply,
  AuditLog,
  Bid,
  BidHistoryItem,
  Category,
  ChatTurn,
  ContactMessage,
  DashboardStats,
  DepositHold,
  Dispute,
  DisputeListItem,
  ListingAssistInput,
  ListingDraft,
  Lot,
  LotBrowseQuery,
  LotDetail,
  LotInput,
  LotListItem,
  Me,
  MessageStatus,
  MyBid,
  Paginated,
  Payment,
  ProfileInput,
  PublicStats,
  Recommendations,
  Review,
  ReviewableLot,
  ReviewQuery,
  ScoredLot,
  SearchIntent,
  SellerProfile,
  SellerReviews,
  Suggestions,
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
    updateProfile: (input: ProfileInput) => f<Me>("/users/me", { method: "PATCH", ...json(input) }),

    // Categories
    categories: () => f<Category[]>("/categories", { next: { revalidate: 300, tags: ["categories"] } }),
    createCategory: (input: { name: string; description?: string; imageUrl?: string }) =>
      f<Category>("/categories", { method: "POST", ...json(input) }),

    // Lots
    browseLots: (query: LotBrowseQuery = {}) => f<Paginated<Lot>>(`/lots${qs({ ...query })}`),
    lot: (id: string) => f<LotDetail>(`/lots/${id}`),
    relatedLots: (id: string, limit = 4) => f<Lot[]>(`/lots/${id}/related${qs({ limit })}`),
    recordView: (id: string, viewerId?: string) =>
      f<{ counted: boolean }>(`/lots/${id}/view`, { method: "POST", ...json(viewerId ? { viewerId } : {}) }),
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
    myDisputes: (page = 1, limit = 10) => f<Paginated<DisputeListItem>>(`/disputes/mine${qs({ page, limit })}`),
    adminDisputes: (query: { page?: number; limit?: number; status?: string; q?: string } = {}) =>
      f<Paginated<DisputeListItem> & { counts: Record<string, number> }>(`/disputes${qs({ ...query })}`),

    // Reviews and sellers
    createReview: (input: { lotId: string; rating: number; title: string; comment: string }) =>
      f<Review>("/reviews", { method: "POST", ...json(input) }),
    myReviews: (query: ReviewQuery = {}) => f<Paginated<Review>>(`/reviews/mine${qs({ ...query })}`),
    reviewableLots: () => f<ReviewableLot[]>("/reviews/reviewable"),
    receivedReviews: (query: ReviewQuery = {}) => f<SellerReviews>(`/reviews/received${qs({ ...query })}`),
    latestReviews: (limit = 6) => f<Review[]>(`/reviews/latest${qs({ limit })}`, { next: { revalidate: 300 } }),
    sellerReviews: (sellerId: string, query: ReviewQuery = {}) =>
      f<SellerReviews>(`/sellers/${sellerId}/reviews${qs({ ...query })}`),
    topSellers: (limit = 6) => f<SellerProfile[]>(`/sellers/top${qs({ limit })}`, { next: { revalidate: 300 } }),
    seller: (id: string) => f<SellerProfile>(`/sellers/${id}`),

    // Public figures, contact and newsletter
    stats: () => f<PublicStats>("/stats", { next: { revalidate: 60 } }),
    sendContact: (input: { name: string; email: string; topic: string; message: string }) =>
      f<{ id: string; createdAt: string }>("/contact", { method: "POST", ...json(input) }),
    subscribe: (email: string) => f<{ email: string }>("/newsletter", { method: "POST", ...json({ email }) }),

    // AI
    aiChat: (messages: ChatTurn[], lotId?: string) =>
      f<AssistantReply>("/ai/chat", { method: "POST", ...json({ messages, ...(lotId ? { lotId } : {}) }) }),
    aiSuggest: (q: string) => f<Suggestions>(`/ai/suggest${qs({ q })}`),
    aiSearchIntent: (q: string) => f<SearchIntent>("/ai/search-intent", { method: "POST", ...json({ q }) }),
    aiRecommendations: (seed: string[], limit = 8) =>
      f<Recommendations>(`/ai/recommendations${qs({ seed: seed.join(",") || undefined, limit })}`),
    aiTrending: (limit = 8) => f<ScoredLot[]>(`/ai/trending${qs({ limit })}`, { next: { revalidate: 60 } }),
    aiListingAssist: (input: ListingAssistInput) =>
      f<ListingDraft>("/ai/listing-assist", { method: "POST", ...json(input) }),

    // Admin
    adminUsers: (query: AdminUserQuery = {}) => f<Paginated<AdminUser>>(`/admin/users${qs({ ...query })}`),
    adminVerifyUser: (id: string, verificationStatus: "VERIFIED" | "REJECTED") =>
      f<AdminUser>(`/admin/users/${id}/verify`, { method: "PATCH", ...json({ verificationStatus }) }),
    adminStats: () => f<DashboardStats>("/admin/dashboard-stats"),
    adminAnalytics: () => f<Analytics>("/admin/analytics"),
    adminInsights: () => f<AdminInsights>("/admin/ai-insights"),
    adminAuditLogs: (query: { page?: number; limit?: number; entityType?: string } = {}) =>
      f<Paginated<AuditLog>>(`/admin/audit-logs${qs({ ...query })}`),
    adminMessages: (query: { page?: number; limit?: number; status?: MessageStatus; q?: string } = {}) =>
      f<Paginated<ContactMessage> & { counts: Partial<Record<MessageStatus, number>> }>(
        `/admin/messages${qs({ ...query })}`,
      ),
    adminUpdateMessage: (id: string, status: MessageStatus) =>
      f<ContactMessage>(`/admin/messages/${id}`, { method: "PATCH", ...json({ status }) }),
    adminReviews: (query: ReviewQuery = {}) => f<Paginated<Review>>(`/admin/reviews${qs({ ...query })}`),
    adminDeleteReview: (id: string) => f<Record<string, never>>(`/admin/reviews/${id}`, { method: "DELETE" }),
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
