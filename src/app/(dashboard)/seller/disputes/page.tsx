import type { Metadata } from "next";
import { MyDisputes } from "@/components/dashboard/disputes/dispute-form";
import { SellerDisputeForm } from "@/components/dashboard/disputes/eligible-lots";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Disputes" };

export default function SellerDisputesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="Something went wrong with a transaction? File a dispute and a SurplusBid admin will review it."
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <SellerDisputeForm />
        <MyDisputes />
      </div>
    </div>
  );
}
