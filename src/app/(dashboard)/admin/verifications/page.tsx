import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { VerificationQueue } from "@/components/dashboard/admin/verification-queue";
import { PageHeader } from "@/components/shared/page-header";
import { serverApi } from "@/lib/api/server";
import { qk, VERIFICATION_QUEUE_QUERY } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Verification queue" };

export default async function VerificationsPage() {
  const state = await prefetch((c) =>
    c.prefetchQuery({
      queryKey: qk.adminUsers(VERIFICATION_QUEUE_QUERY),
      queryFn: () => serverApi.adminUsers(VERIFICATION_QUEUE_QUERY),
    }),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification queue"
        description="Businesses waiting for review. Approve to unlock bidding or listing, or reject to ask for a new document."
      />
      <HydrationBoundary state={state}>
        <VerificationQueue />
      </HydrationBoundary>
    </div>
  );
}
