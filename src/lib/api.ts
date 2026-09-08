export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api/v1';

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

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

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  return parseResponse<T>(res);
}

export const api = {
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
};
