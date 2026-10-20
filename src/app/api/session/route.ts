import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverApi } from "@/lib/api/server";
import { ACCESS_COOKIE, homeForRole, REFRESH_COOKIE, readClaims } from "@/lib/auth/tokens";

/**
 * Tiny session probe for the public header. Keeps marketing pages static:
 * they don't read cookies at render time, the header asks here instead.
 * Signed in, it also returns the name and email for the profile menu.
 */
export async function GET() {
  const store = await cookies();
  const claims = await readClaims(store.get(ACCESS_COOKIE)?.value);
  if (claims) {
    const me = await serverApi.me().catch(() => null);
    return NextResponse.json({
      role: claims.role,
      home: homeForRole(claims.role),
      user: me ? { companyName: me.companyName, email: me.email, verificationStatus: me.verificationStatus } : null,
    });
  }
  // Access token expired but refresh is still there: the proxy will refresh on the next protected page.
  if (store.get(REFRESH_COOKIE)) return NextResponse.json({ role: null, home: null, user: null, refreshable: true });
  return NextResponse.json({ role: null, home: null, user: null });
}
