import type { Metadata } from "next";
import { DisputeConsole } from "@/components/dashboard/admin/dispute-console";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Disputes" };

export default function AdminDisputesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dispute console" description="Record decisions on disputes raised by buyers and sellers." />
      <DisputeConsole />
    </div>
  );
}
