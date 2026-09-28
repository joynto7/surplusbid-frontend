export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api/v1';

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type LotStatus = 'DRAFT' | 'LIVE' | 'ENDED' | 'SOLD' | 'UNSOLD' | 'CANCELLED';
export type BidStatus = 'ACTIVE' | 'OUTBID' | 'WINNING';
export type HoldStatus = 'AUTHORIZED' | 'CAPTURED' | 'RELEASED' | 'FAILED';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface Me {
  id: string;
  email: string;
  role: Role;
  companyName: string;
  taxId: string | null;
  verificationStatus: VerificationStatus;
  authProvider: 'LOCAL' | 'GOOGLE';
  createdAt: string;
}

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
  errors?: string[];
}

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const ACCESS_TOKEN_KEY = 'surplusbid.accessToken';
const REFRESH_TOKEN_KEY = 'surplusbid.refreshToken';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!res.ok || !body || body.success === false) {
    const message = body && 'message' in body ? body.message : `Request failed with status ${res.status}`;
    const errors = body && 'errors' in body && body.errors ? body.errors : [];
    throw new ApiError(res.status, message, errors);
  }
  return body.data;
}

/** Fired when the access token can't be refreshed; App routes to /session-expired. */
export const SESSION_EXPIRED_EVENT = 'surplusbid:session-expired';

let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return Promise.resolve(false);
  refreshInFlight ??= fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then((res) => parseResponse<{ accessToken: string }>(res))
    .then(({ accessToken }) => {
      tokenStorage.setTokens(accessToken, refreshToken);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const send = () => {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData) && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (auth) {
      const token = tokenStorage.getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  };

  let res = await send();
  if (res.status === 401 && auth && tokenStorage.getAccessToken()) {
    if (await refreshAccessToken()) {
      res = await send();
    } else {
      tokenStorage.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }
  return parseResponse<T>(res);
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
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
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
}

export interface LotBrowseQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: LotStatus;
  sortBy?: 'createdAt' | 'endTime' | 'currentHighestBidAmountCents';
  sortOrder?: 'asc' | 'desc';
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

function lotForm(input: Partial<LotInput>, images: File[] = []) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) form.append(key, String(value));
  }
  images.forEach((file) => form.append('images', file));
  return form;
}

export const api = {
  // ── Auth & profile ──
  register: (input: { email: string; password: string; role: 'BUYER' | 'SELLER'; companyName: string }) =>
    request<{ user: AuthUser; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    request<{ user: AuthUser; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<Record<string, never>>('/auth/logout', { method: 'POST' }),

  me: () => request<Me>('/users/me', { method: 'GET' }, true),

  updateProfile: (input: { companyName?: string; taxId?: string }) =>
    request<Me>('/users/me', { method: 'PATCH', body: JSON.stringify(input) }, true),

  submitVerification: (document: File) => {
    const form = new FormData();
    form.append('document', document);
    return request<Me>('/users/verify', { method: 'POST', body: form }, true);
  },

  googleAuthUrl: () => `${API_BASE_URL}/auth/google`,

  // ── Categories ──
  categories: () => request<Category[]>('/categories'),
  createCategory: (name: string) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }, true),

  // ── Lots ──
  browseLots: (query: LotBrowseQuery = {}) => request<Paginated<Lot>>(`/lots${qs({ ...query })}`),
  lot: (id: string) => request<Lot>(`/lots/${id}`, { method: 'GET' }, true),
  myListings: () => request<LotListItem[]>('/lots/my-listings', { method: 'GET' }, true),
  /** Creates the lot as a DRAFT. Up to 5 images. */
  createLot: (input: LotInput, images: File[] = []) =>
    request<Lot>('/lots', { method: 'POST', body: lotForm(input, images) }, true),
  /** Only DRAFT lots can be edited. Images can't be changed after creation. */
  updateLot: (id: string, input: Partial<LotInput>) =>
    request<Lot>(`/lots/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, true),
  deleteLot: (id: string) => request<Record<string, never>>(`/lots/${id}`, { method: 'DELETE' }, true),
  publishLot: (id: string) => request<Lot>(`/lots/${id}/publish`, { method: 'PATCH' }, true),

  // ── Bids & deposits ──
  authorizeDeposit: (lotId: string) =>
    request<DepositHold>(`/lots/${lotId}/deposit`, { method: 'POST' }, true),
  placeBid: (lotId: string, amountCents: number) =>
    request<Bid>(`/lots/${lotId}/bids`, { method: 'POST', body: JSON.stringify({ amountCents }) }, true),
  bidHistory: (lotId: string, page = 1, limit = 20) =>
    request<Paginated<BidHistoryItem>>(`/lots/${lotId}/bids${qs({ page, limit })}`),
  myBids: (page = 1, limit = 50) =>
    request<Paginated<MyBid>>(`/bids/my-bids${qs({ page, limit })}`, { method: 'GET' }, true),

  // ── Payments ──
  myPayments: (page = 1, limit = 50) =>
    request<Paginated<Payment>>(`/payments/my-payments${qs({ page, limit })}`, { method: 'GET' }, true),
  payment: (id: string) => request<Payment>(`/payments/${id}`, { method: 'GET' }, true),
  /** Captures the deposit and returns a Stripe clientSecret for the balance charge. */
  initiatePayment: (paymentId: string) =>
    request<Payment & { clientSecret: string | null }>(
      '/payments/initiate',
      { method: 'POST', body: JSON.stringify({ paymentId }) },
      true
    ),

  // ── Disputes ──
  createDispute: (input: { lotId: string; reason: string; description: string }) =>
    request<Dispute>('/disputes', { method: 'POST', body: JSON.stringify(input) }, true),
  /**
   * NOT IN THE BACKEND YET: surplusbid-backend only has POST /disputes and
   * PATCH /disputes/:id/resolve. The admin dispute screens call these and show
   * a notice when they 404. Proposed shape: admin-only, same Dispute rows.
   */
  adminDisputes: (query: { page?: number; limit?: number; status?: DisputeStatus } = {}) =>
    request<Paginated<Dispute>>(`/disputes${qs({ ...query })}`, { method: 'GET' }, true),
  dispute: (id: string) => request<Dispute>(`/disputes/${id}`, { method: 'GET' }, true),
  resolveDispute: (id: string, input: { status: 'RESOLVED' | 'REJECTED'; resolutionNote: string }) =>
    request<Dispute>(`/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(input) }, true),

  // ── Admin ──
  adminUsers: (query: { page?: number; limit?: number; verificationStatus?: VerificationStatus; role?: Role } = {}) =>
    request<Paginated<AdminUser>>(`/admin/users${qs({ ...query })}`, { method: 'GET' }, true),
  adminVerifyUser: (id: string, verificationStatus: 'VERIFIED' | 'REJECTED') =>
    request<AdminUser>(
      `/admin/users/${id}/verify`,
      { method: 'PATCH', body: JSON.stringify({ verificationStatus }) },
      true
    ),
  adminStats: () => request<DashboardStats>('/admin/dashboard-stats', { method: 'GET' }, true),
  adminAuditLogs: (query: { page?: number; limit?: number; entityType?: string } = {}) =>
    request<Paginated<AuditLog>>(`/admin/audit-logs${qs({ ...query })}`, { method: 'GET' }, true),
};
