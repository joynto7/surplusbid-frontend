import "server-only";

import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth/tokens";
import { API_BASE_URL } from "@/lib/config";
import { createEndpoints, type Fetcher } from "./endpoints";
import { parseEnvelope } from "./errors";

/**
 * Server-side fetcher for Server Components and Server Actions. Attaches the
 * access token from the httpOnly cookie. Authenticated requests are never
 * cached; public ones can opt into caching through `next.revalidate`.
 */
const serverFetch: Fetcher = async <T>(path: string, init: Parameters<Fetcher>[1] = {}) => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const cacheable = !token && init.next?.revalidate !== undefined;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    ...(cacheable ? {} : { cache: "no-store", next: undefined }),
  });
  return parseEnvelope<T>(res);
};

/** Public, cacheable fetcher (no cookies) for marketing pages and metadata. */
const publicFetch: Fetcher = async <T>(path: string, init: Parameters<Fetcher>[1] = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 60 }, ...init });
  return parseEnvelope<T>(res);
};

export const serverApi = createEndpoints(serverFetch);
export const publicApi = createEndpoints(publicFetch);
