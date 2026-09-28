import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { serverApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import type { Me } from "@/types/api";
import { ACCESS_COOKIE, accessCookieOptions, REFRESH_COOKIE, readClaims, refreshCookieOptions } from "./tokens";

/** Claims from the access cookie. The proxy refreshes it before pages render. */
export const getClaims = cache(async () => {
  const store = await cookies();
  return readClaims(store.get(ACCESS_COOKIE)?.value);
});

/**
 * The signed-in user's profile, deduplicated per request. Returns null when
 * signed out or when the backend rejects the token.
 */
export const getCurrentUser = cache(async (): Promise<Me | null> => {
  if (!(await getClaims())) return null;
  try {
    return await serverApi.me();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) return null;
    throw error;
  }
});

/** Only callable from Server Actions and Route Handlers (cookies are writable there). */
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, accessCookieOptions(accessToken));
  store.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
