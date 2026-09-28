import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LotBrowser } from "@/components/lots/lot-browser";
import { LotGridSkeleton } from "@/components/shared/skeletons";
import { publicApi } from "@/lib/api/server";
import { qk, toLotQuery } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = {
  title: "Live auctions",
  description:
    "Browse live SurplusBid auctions for machinery, electronics, vehicles, furniture and raw materials. Filter by category and sort by closing time or price.",
  alternates: { canonical: "/lots" },
  openGraph: { title: "Live industrial surplus auctions", url: "/lots" },
};

/**
 * Server Component: reads the URL, prefetches that exact page of results on
 * the server, and hands the cache to the client browser component, so the
 * first paint has data and later filter changes are client-side fetches.
 */
export default async function LotsPage({ searchParams }: PageProps<"/lots">) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = toLotQuery(flat);

  const state = await prefetch(
    (c) => c.prefetchQuery({ queryKey: qk.lots(query), queryFn: () => publicApi.browseLots(query) }),
    (c) => c.prefetchQuery({ queryKey: qk.categories, queryFn: () => publicApi.categories() }),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="font-semibold text-3xl tracking-tight">Auctions</h1>
        <p className="text-muted-foreground">
          Every lot is listed by a verified seller. Bidding requires a verified buyer account and a deposit hold.
        </p>
      </header>
      <HydrationBoundary state={state}>
        <Suspense fallback={<LotGridSkeleton />}>
          <LotBrowser />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
