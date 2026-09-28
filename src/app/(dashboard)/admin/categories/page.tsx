import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { CategoriesManager } from "@/components/dashboard/admin/categories-manager";
import { PageHeader } from "@/components/shared/page-header";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const state = await prefetch((c) =>
    c.prefetchQuery({ queryKey: qk.categories, queryFn: () => serverApi.categories() }),
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="The taxonomy sellers list under and buyers filter by." />
      <HydrationBoundary state={state}>
        <CategoriesManager />
      </HydrationBoundary>
    </div>
  );
}
