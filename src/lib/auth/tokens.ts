import { decodeJwt, jwtVerify } from "jose";
import { API_BASE_URL } from "@/lib/config";
import type { Role } from "@/types/api";

/**
 * Token helpers shared by the proxy, route handlers and server actions.
 * No `server-only` import here because proxy.ts runs outside React's
 * server graph; nothing in this file is ever imported by client code.
 */

export const ACCESS_COOKIE = "sb_at";
export const REFRESH_COOKIE = "sb_rt";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // backend default JWT_REFRESH_EXPIRES_IN=7d

export interface TokenClaims {
  id: string;
  role: Role;
  exp: number;
}

const secret = process.env.JWT_ACCESS_SECRET ? new TextEncoder().encode(process.env.JWT_ACCESS_SECRET) : null;

/**
 * Reads the access token's claims. When JWT_ACCESS_SECRET is configured the
 * signature is verified; otherwise the payload is only decoded and the
 * backend remains the authority (every API call re-verifies the token).
 * Returns null for missing, malformed or expired tokens.
 */
export async function readClaims(token: string | undefined): Promise<TokenClaims | null> {
  if (!token) return null;
  try {
    const payload = secret ? (await jwtVerify(token, secret)).payload : decodeJwt(token);
    const { id, role, exp } = payload as Partial<TokenClaims>;
    if (!id || !role || !exp) return null;
    if (exp * 1000 <= Date.now() + 5_000) return null;
    return { id, role, exp };
  } catch {
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { accessToken?: string } };
    return body.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function accessCookieOptions(token: string) {
  const exp = decodeJwt(token).exp;
  const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 15 * 60;
  return { ...base, maxAge };
}

export const refreshCookieOptions = { ...base, maxAge: REFRESH_MAX_AGE };

export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "SELLER") return "/seller";
  return "/buyer";
}

/** Route prefix → role allowed to open it. Used by proxy.ts and the sidebar. */
export const PROTECTED_PREFIXES: Record<string, Role> = {
  "/admin": "ADMIN",
  "/seller": "SELLER",
  "/buyer": "BUYER",
};

/** Only same-origin relative paths are accepted as a post-login destination. */
export function safeNext(next: string | null | undefined) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : null;
}
