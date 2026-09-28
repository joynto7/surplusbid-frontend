import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  homeForRole,
  REFRESH_COOKIE,
  readClaims,
  refreshCookieOptions,
} from "@/lib/auth/tokens";

/**
 * Google OAuth landing. The backend redirects here with the token pair in the
 * query string; we move them into httpOnly cookies and strip them from the URL.
 */
export async function GET(req: NextRequest) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");
  const refreshToken = req.nextUrl.searchParams.get("refreshToken");
  const claims = await readClaims(accessToken ?? undefined);

  if (!accessToken || !refreshToken || !claims) {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }

  const res = NextResponse.redirect(new URL(homeForRole(claims.role), req.url));
  res.cookies.set(ACCESS_COOKIE, accessToken, accessCookieOptions(accessToken));
  res.cookies.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
  return res;
}
