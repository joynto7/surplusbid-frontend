import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Earnings } from "@/components/dashboard/seller/earnings";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const state = await prefetch((c) =>
    c.prefetchQuery({ queryKey: qk.myListings, queryFn: () => serverApi.myListings() }),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Proceeds from sold lots, based on winning bids and captured deposits."
      />
      <HydrationBoundary state={state}>
        <Suspense fallback={<DashboardSkeleton stats={false} />}>
          <Earnings />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
