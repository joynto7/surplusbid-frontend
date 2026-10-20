import type { Metadata } from "next";
import { Suspense } from "react";
import { LotBrowser } from "@/components/lots/lot-browser";
import { PageHeader } from "@/components/shared/page-header";
import { DASHBOARD_LOT_GRID, LotGridSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Lots" };

export default function AdminLotsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Lots" description="Monitor every lot on the platform by status, category and price." />
      <Suspense fallback={<LotGridSkeleton className={DASHBOARD_LOT_GRID} />}>
        <LotBrowser grid={DASHBOARD_LOT_GRID} />
      </Suspense>
    </div>
  );
}
