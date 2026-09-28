import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  homeForRole,
  PROTECTED_PREFIXES,
  REFRESH_COOKIE,
  readClaims,
  refreshAccessToken,
} from "@/lib/auth/tokens";

const AUTH_PAGES = ["/login", "/register"];
const SIGNED_IN_ONLY = ["/verify-business", "/verification-status", "/payment"];

/**
 * Route protection. Runs before every matched request:
 *  1. refreshes an expired access token from the refresh cookie (so Server
 *     Components always render with a valid token),
 *  2. sends signed-out visitors on protected routes to /login?next=...,
 *  3. sends a signed-in user to their own dashboard when they open another
 *     role's area (role-based route protection), or away from /login.
 * The backend still authorizes every API call; this is the UX layer.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let claims = await readClaims(req.cookies.get(ACCESS_COOKIE)?.value);
  let refreshed: string | null = null;

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!claims && refreshToken) {
    refreshed = await refreshAccessToken(refreshToken);
    claims = await readClaims(refreshed ?? undefined);
    if (refreshed) req.cookies.set(ACCESS_COOKIE, refreshed);
  }

  const withCookies = (res: NextResponse) => {
    if (refreshed) res.cookies.set(ACCESS_COOKIE, refreshed, accessCookieOptions(refreshed));
    if (refreshToken && !claims) res.cookies.delete(REFRESH_COOKIE);
    return res;
  };

  const area = Object.keys(PROTECTED_PREFIXES).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  const needsSession = area || SIGNED_IN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsSession && !claims) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return withCookies(NextResponse.redirect(login));
  }

  if (area && claims && PROTECTED_PREFIXES[area] !== claims.role) {
    const home = new URL(homeForRole(claims.role), req.url);
    home.searchParams.set("denied", area.slice(1));
    return withCookies(NextResponse.redirect(home));
  }

  if (claims && AUTH_PAGES.includes(pathname)) {
    return withCookies(NextResponse.redirect(new URL(homeForRole(claims.role), req.url)));
  }

  // Forward the refreshed cookie to this request's Server Components too.
  return withCookies(NextResponse.next({ request: { headers: req.headers } }));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/buyer/:path*",
    "/login",
    "/register",
    "/verify-business",
    "/verification-status",
    "/payment/:path*",
    "/lots/:path*",
  ],
};
