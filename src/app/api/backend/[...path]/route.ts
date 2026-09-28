import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCookieOptions, REFRESH_COOKIE, readClaims, refreshAccessToken } from "@/lib/auth/tokens";
import { API_BASE_URL } from "@/lib/config";

/**
 * Backend-for-frontend proxy. Browser code calls /api/backend/<path>; this
 * handler attaches the bearer token from the httpOnly cookie, so tokens are
 * never readable by client JavaScript. An expired access token is refreshed
 * once and the new cookie is sent back with the response.
 */
async function handle(req: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  let refreshed: string | null = null;

  if (refreshToken && !(await readClaims(accessToken))) {
    refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) accessToken = refreshed;
  }

  // Buffer the body so the request can be replayed after a refresh.
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
  const target = `${API_BASE_URL}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const send = (token: string | undefined) => {
    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(target, { method: req.method, headers, body, cache: "no-store" });
  };

  let upstream: Response;
  try {
    upstream = await send(accessToken);
    if (upstream.status === 401 && refreshToken && !refreshed) {
      refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) upstream = await send(refreshed);
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "The SurplusBid API is unreachable. Please try again shortly.", errors: [] },
      { status: 502 },
    );
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
  if (refreshed) res.cookies.set(ACCESS_COOKIE, refreshed, accessCookieOptions(refreshed));
  return res;
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
