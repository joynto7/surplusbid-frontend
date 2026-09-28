import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersTable } from "@/components/dashboard/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Every registered business. Filter by role or status, and verify or revoke access."
      />
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <UsersTable />
      </Suspense>
    </div>
  );
}
