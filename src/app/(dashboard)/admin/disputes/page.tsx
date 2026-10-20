import type { Metadata } from "next";
import { Suspense } from "react";
import { DisputesTable } from "@/components/dashboard/admin/disputes-table";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Disputes" };

export default function AdminDisputesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Claims raised by buyers and sellers. Review the details and record a decision both parties can see."
      />
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <DisputesTable />
      </Suspense>
    </div>
  );
}
