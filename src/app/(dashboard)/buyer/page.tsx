import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { BuyerOverview } from "@/components/dashboard/buyer/buyer-overview";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Buyer overview" };

/** Prefetches bids and payments on the server (loading.tsx shows meanwhile); the client takes over from the cache. */
export default async function BuyerHomePage() {
  const state = await prefetch(
    (c) => c.prefetchQuery({ queryKey: qk.myBids, queryFn: () => serverApi.myBids(1, 50) }),
    (c) => c.prefetchQuery({ queryKey: qk.myPayments, queryFn: () => serverApi.myPayments(1, 50) }),
  );
  return (
    <HydrationBoundary state={state}>
      <BuyerOverview />
    </HydrationBoundary>
  );
}
