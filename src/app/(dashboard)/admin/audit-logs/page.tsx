import type { Metadata } from "next";
import { Suspense } from "react";
import { AuditLogView } from "@/components/dashboard/admin/audit-log";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Audit log & reports" };

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log & reports"
        description="A tamper-evident record of operator decisions, exportable as CSV."
      />
      <Suspense fallback={<DashboardSkeleton stats={false} />}>
        <AuditLogView />
      </Suspense>
    </div>
  );
}
