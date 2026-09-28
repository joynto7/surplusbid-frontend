/** Types mirroring surplusbid-backend's Prisma models and response shapes. */

export type Role = "BUYER" | "SELLER" | "ADMIN";
export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
export type LotStatus = "DRAFT" | "LIVE" | "ENDED" | "SOLD" | "UNSOLD" | "CANCELLED";
export type BidStatus = "ACTIVE" | "OUTBID" | "WINNING";
export type HoldStatus = "AUTHORIZED" | "CAPTURED" | "RELEASED" | "FAILED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: string[];
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface Me {
  id: string;
  email: string;
  role: Role;
  companyName: string;
  taxId: string | null;
  verificationStatus: VerificationStatus;
  authProvider: "LOCAL" | "GOOGLE";
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

/** Shape returned by GET /lots (browse) and GET /lots/:id. */
export interface Lot {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  quantity: number;
  categoryId: string;
  sellerId: string;
  status: LotStatus;
  startingPriceCents: number;
  bidIncrementCents: number;
  currentHighestBidAmountCents: number | null;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt?: string;
  /** Only present on GET /lots/:id when the requester is the seller. */
  reservePriceCents?: number;
  currentHighestBidderId?: string | null;
}

/** Slimmer shape returned by GET /lots/my-listings. */
export interface LotListItem {
  id: string;
  title: string;
  images: string[];
  categoryId: string;
  status: LotStatus;
  startingPriceCents: number;
  currentHighestBidAmountCents: number | null;
  endTime: string;
}

export interface LotInput {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  quantity: number;
  startingPriceCents: number;
  reservePriceCents: number;
  bidIncrementCents: number;
  startTime: string;
  endTime: string;
}

export type LotSortBy = "createdAt" | "endTime" | "currentHighestBidAmountCents";

export interface LotBrowseQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: LotStatus;
  sortBy?: LotSortBy;
  sortOrder?: "asc" | "desc";
  q?: string;
}

export interface BidHistoryItem {
  id: string;
  amountCents: number;
  status: BidStatus;
  createdAt: string;
}

export interface MyBid extends BidHistoryItem {
  lotId: string;
}

export interface Bid extends MyBid {
  buyerId: string;
}

export interface DepositHold {
  id: string;
  lotId: string;
  buyerId: string;
  stripePaymentIntentId: string;
  amountCents: number;
  status: HoldStatus;
  createdAt: string;
  /** Returned when the backend asks the buyer to confirm the card authorization. */
  clientSecret?: string | null;
}

export interface Payment {
  id: string;
  lotId: string;
  buyerId: string;
  stripePaymentIntentId: string | null;
  amountCents: number;
  status: PaymentStatus;
  dueAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  lotId: string;
  raisedById: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolutionNote: string | null;
  resolvedById: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  companyName: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  verificationStatus?: VerificationStatus;
  role?: Role;
}

export interface DashboardStats {
  activeLots: number;
  openDisputes: number;
  verifiedSellers: number;
  totalGmvCents: number;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
