import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MyBids } from "@/components/dashboard/buyer/my-bids";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "My bids" };

export default async function MyBidsPage() {
  const state = await prefetch((c) => c.prefetchQuery({ queryKey: qk.myBids, queryFn: () => serverApi.myBids(1, 50) }));
  return (
    <div className="space-y-6">
      <PageHeader title="My bids" description="Every lot you've bid on, with where you stand right now." />
      <HydrationBoundary state={state}>
        <Suspense fallback={<TableSkeleton />}>
          <MyBids />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
