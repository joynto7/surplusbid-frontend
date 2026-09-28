import "server-only";

import { dehydrate, QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/** One QueryClient per server request, for prefetching into a HydrationBoundary. */
export const getServerQueryClient = cache(
  () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
);

/**
 * Runs prefetches and returns the dehydrated state. A failed prefetch isn't
 * fatal: the client query retries and the error toast/boundary takes over.
 */
export async function prefetch(...tasks: ((client: QueryClient) => Promise<unknown>)[]) {
  const client = getServerQueryClient();
  await Promise.allSettled(tasks.map((t) => t(client)));
  return dehydrate(client);
}
