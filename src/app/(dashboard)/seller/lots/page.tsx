import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LuPackagePlus } from "react-icons/lu";
import { ListingsTable } from "@/components/dashboard/seller/listings-table";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "My listings" };

export default async function ListingsPage() {
  const state = await prefetch(
    (c) => c.prefetchQuery({ queryKey: qk.myListings, queryFn: () => serverApi.myListings() }),
    (c) => c.prefetchQuery({ queryKey: qk.categories, queryFn: () => serverApi.categories() }),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="My listings"
        description="Drafts, live auctions and closed lots. Publish, edit, preview or relist."
        actions={
          <Button asChild>
            <Link href="/seller/lots/new">
              <LuPackagePlus /> Create lot
            </Link>
          </Button>
        }
      />
      <HydrationBoundary state={state}>
        <Suspense fallback={<TableSkeleton />}>
          <ListingsTable />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
