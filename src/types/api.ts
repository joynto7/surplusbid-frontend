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
  contactName: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
}

export interface ProfileInput {
  companyName?: string;
  taxId?: string;
  contactName?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Live lots in this category (GET /categories). */
  liveLotCount?: number;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface LotSpec {
  label: string;
  value: string;
}

export interface LotSellerSummary {
  id: string;
  companyName: string;
  location: string | null;
  verificationStatus: VerificationStatus;
}

/** Shape returned by GET /lots (browse), GET /lots/:id/related and the AI lot lists. */
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
  /** What a buyer would pay now: the highest bid, or the starting price. */
  currentPriceCents: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt?: string;
  location: string;
  viewCount?: number;
  bidCount?: number;
  specs?: LotSpec[];
  category?: { id: string; name: string; slug: string };
  seller?: LotSellerSummary;
  sellerRating?: RatingSummary | null;
  /** Only present on GET /lots/:id when the requester is the seller. */
  reservePriceCents?: number;
  reserveMet?: boolean;
  currentHighestBidderId?: string | null;
}

/** GET /lots/:id adds the seller's public profile. */
export interface LotDetail extends Lot {
  specs: LotSpec[];
  bidCount: number;
  category: { id: string; name: string; slug: string };
  seller: LotSellerSummary & {
    bio: string | null;
    createdAt: string;
    rating: RatingSummary | null;
    lotsSold: number;
    liveLots: number;
  };
}

/** An AI-picked lot: trending or recommended, with the reason it was picked. */
export interface ScoredLot extends Lot {
  reason: string;
  score: number;
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
  currentPriceCents?: number;
  endTime: string;
  location?: string;
  viewCount?: number;
  bidCount?: number;
  createdAt?: string;
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
  location?: string;
  specs?: LotSpec[];
}

export type LotSortBy = "createdAt" | "endTime" | "currentHighestBidAmountCents" | "currentPriceCents" | "popularity";

export interface LotBrowseQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: LotStatus;
  sortBy?: LotSortBy;
  sortOrder?: "asc" | "desc";
  q?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  location?: string;
  condition?: string;
  sellerId?: string;
  /** Comma-separated ids. */
  ids?: string;
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

export interface DisputeListItem extends Dispute {
  lot: { id: string; title: string; images: string[]; sellerId: string; seller: { companyName: string } };
  raisedBy: { id: string; companyName: string; email: string; role: Role };
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  companyName: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  location?: string | null;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  verificationStatus?: VerificationStatus;
  role?: Role;
  q?: string;
}

export interface DashboardStats {
  activeLots: number;
  openDisputes: number;
  verifiedSellers: number;
  totalGmvCents: number;
  soldGmvCents: number;
  totalUsers: number;
  totalBids: number;
  newMessages: number;
  pendingVerifications: number;
  reviewCount: number;
  averageRating: number;
  subscribers: number;
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

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  lotId: string;
  sellerId: string;
  authorId: string;
  lot: { id: string; title: string; images: string[] };
  author: { id: string; companyName: string; location: string | null };
  seller: { id: string; companyName: string };
}

export interface RatingBreakdown extends RatingSummary {
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface SellerReviews extends Paginated<Review> {
  summary: RatingBreakdown;
}

export interface ReviewableLot {
  id: string;
  title: string;
  images: string[];
  endTime: string;
  currentHighestBidAmountCents: number | null;
  seller: { id: string; companyName: string };
}

export interface ReviewQuery {
  page?: number;
  limit?: number;
  rating?: number;
  q?: string;
}

// ── Sellers & public stats ───────────────────────────────────────────────────

export interface SellerProfile {
  id: string;
  companyName: string;
  location: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  rating: RatingSummary;
  lotsSold: number;
  liveLots: number;
}

export interface PublicStats {
  liveLots: number;
  soldLots: number;
  verifiedBusinesses: number;
  totalBids: number;
  categories: number;
  gmvCents: number;
  sellThroughRate: number;
  averageRating: number;
  reviewCount: number;
}

// ── Contact ──────────────────────────────────────────────────────────────────

export type MessageStatus = "NEW" | "READ" | "ARCHIVED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

// ── Admin analytics ──────────────────────────────────────────────────────────

export interface Analytics {
  bidsPerDay: { day: string; bids: number; volumeCents: number; bidders: number }[];
  gmvPerMonth: { month: string; gmvCents: number; lotsSold: number }[];
  signupsPerMonth: { month: string; buyers: number; sellers: number }[];
  categories: {
    categoryId: string;
    name: string;
    liveLots: number;
    soldLots: number;
    gmvCents: number;
    sellThroughRate: number | null;
  }[];
  lotsByStatus: { status: LotStatus; count: number }[];
  topBidders: { buyerId: string; companyName: string; bids: number; lots: number; volumeCents: number }[];
}

// ── AI ───────────────────────────────────────────────────────────────────────

/** "ai" when Claude produced the result, "smart" when the built-in engines did. */
export type AiMode = "ai" | "smart";

export type SearchSort = "ending" | "newest" | "price_asc" | "price_desc" | "popular";

export interface SearchIntent {
  q: string;
  categoryId?: string;
  categoryName?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  location?: string;
  condition?: string;
  status?: "LIVE" | "SOLD";
  sort?: SearchSort;
  explanation: string;
  mode: AiMode;
}

export interface SuggestLot {
  id: string;
  title: string;
  images: string[];
  status: LotStatus;
  currentPriceCents: number;
  endTime: string;
  category: { name: string };
  reason?: string;
}

export interface Suggestions {
  query: string;
  correctedQuery: string | null;
  interpretation: SearchIntent | null;
  lots: SuggestLot[];
  categories: (Category & { liveLotCount?: number })[];
  searches: string[];
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantLot {
  id: string;
  title: string;
  image: string | null;
  currentPriceCents: number;
  status: LotStatus;
  endTime: string;
  location: string;
  category: string;
}

export interface AssistantReply {
  reply: string;
  lots: AssistantLot[];
  suggestions: string[];
  mode: AiMode;
}

export interface Recommendations {
  strategy: "personalized" | "trending";
  items: ScoredLot[];
}

export interface ListingAssistInput {
  title: string;
  categoryId?: string;
  condition?: string;
  quantity?: number;
  location?: string;
  notes?: string;
}

export interface PriceGuidance {
  suggestedStartingPriceCents: number;
  suggestedReservePriceCents: number;
  suggestedIncrementCents: number;
  medianCents: number;
  comparableCount: number;
  basis: string;
  comparables: { id: string; title: string; priceCents: number }[];
}

export interface ListingDraft {
  suggestedTitle: string;
  description: string;
  highlights: string[];
  specs: LotSpec[];
  pricing: PriceGuidance | null;
  mode: AiMode;
}

export type InsightSeverity = "positive" | "info" | "warning" | "critical";

export interface Insight {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  metric?: string;
  action?: { label: string; href: string };
}

export interface Anomaly {
  id: string;
  kind: "bid-volume" | "bid-jump" | "rapid-bidding" | "stalled-lot" | "overdue-payment";
  title: string;
  detail: string;
  severity: InsightSeverity;
  at?: string;
  href?: string;
}

export interface AdminInsights {
  generatedAt: string;
  summary: string;
  summaryMode: AiMode;
  insights: Insight[];
  anomalies: Anomaly[];
  bidSeries: { day: string; bids: number; volumeCents: number; bidders: number; anomaly: boolean }[];
}
