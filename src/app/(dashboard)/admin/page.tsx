import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { AdminOverview } from "@/components/dashboard/admin/admin-overview";
import { serverApi } from "@/lib/api/server";
import { qk } from "@/lib/query-keys";
import { prefetch } from "@/lib/server-query";

export const metadata: Metadata = { title: "Admin overview" };

/**
 * Server prefetch of the stats and analytics; charts hydrate from the same
 * cache on the client. The AI briefing loads client-side because it can take
 * a few seconds when Claude writes it.
 */
export default async function AdminHomePage() {
  const state = await prefetch(
    (c) => c.prefetchQuery({ queryKey: qk.adminStats, queryFn: () => serverApi.adminStats() }),
    (c) => c.prefetchQuery({ queryKey: qk.adminAnalytics, queryFn: () => serverApi.adminAnalytics() }),
    (c) =>
      c.prefetchQuery({
        queryKey: qk.auditLogs({ page: 1, limit: 6 }),
        queryFn: () => serverApi.adminAuditLogs({ page: 1, limit: 6 }),
      }),
  );
  return (
    <HydrationBoundary state={state}>
      <AdminOverview />
    </HydrationBoundary>
  );
}
