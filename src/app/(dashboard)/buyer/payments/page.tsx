import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentsList } from "@/components/dashboard/buyer/payments-list";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const state = await prefetch((c) =>
    c.prefetchQuery({ queryKey: qk.myPayments, queryFn: () => serverApi.myPayments(1, 50) }),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Invoices for lots you've won. Balances are paid securely through Stripe."
      />
      <HydrationBoundary state={state}>
        <Suspense fallback={<DashboardSkeleton stats={false} />}>
          <PaymentsList />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
