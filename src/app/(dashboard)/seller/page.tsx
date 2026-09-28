import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { SellerOverview } from "@/components/dashboard/seller/seller-overview";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Seller overview" };

export default async function SellerHomePage() {
  const state = await prefetch((c) =>
    c.prefetchQuery({ queryKey: qk.myListings, queryFn: () => serverApi.myListings() }),
  );
  return (
    <HydrationBoundary state={state}>
      <SellerOverview />
    </HydrationBoundary>
  );
}
