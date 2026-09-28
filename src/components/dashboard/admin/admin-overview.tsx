"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Banknote, Radio, Scale } from "lucide-react";
import Link from "next/link";
import { BarTrendChart, DonutChart } from "@/components/charts/lazy";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { countBy, perMonth } from "@/lib/analytics";
import { formatMoney, formatRelative } from "@/lib/format";
import { adminStatsQuery, adminUsersQuery, auditLogsQuery, qk } from "@/lib/queries";
import { ADMIN_USERS_SAMPLE } from "@/lib/query-keys";
import type { LotStatus } from "@/types/api";

const LOT_STATUSES: LotStatus[] = ["LIVE", "SOLD", "UNSOLD", "ENDED", "DRAFT"];

export function AdminOverview() {
  const stats = useQuery(adminStatsQuery());
  const users = useQuery(adminUsersQuery(ADMIN_USERS_SAMPLE));
  const audit = useQuery(auditLogsQuery({ page: 1, limit: 6 }));
  // Per-status lot totals: one tiny request each (limit=1) and only the meta.total is used.
  const lotTotals = useQueries({
    queries: LOT_STATUSES.map((status) => ({
      queryKey: qk.lots({ status, limit: 1 }),
      queryFn: () => api.browseLots({ status, limit: 1 }),
      staleTime: 60_000,
    })),
  });

  if (stats.isPending || users.isPending) return <DashboardSkeleton />;

  const s = stats.data;
  const all = users.data?.items ?? [];
  const pending = all.filter((u) => u.verificationStatus === "PENDING").length;
  const signups = perMonth(
    all.filter((u) => u.role === "BUYER"),
    (u) => u.createdAt,
    6,
  );
  const sellerSignups = perMonth(
    all.filter((u) => u.role === "SELLER"),
    (u) => u.createdAt,
    6,
  );
  const growth = signups.map((b, i) => ({ label: b.label, buyers: b.value, sellers: sellerSignups[i].value }));
  const verification = countBy(
    all.filter((u) => u.role !== "ADMIN"),
    (u) => u.verificationStatus,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Marketplace health, verification backlog and recent operator activity."
        actions={
          <Button asChild>
            <Link href="/admin/verifications">
              <BadgeCheck /> Review queue{pending ? ` (${pending})` : ""}
            </Link>
          </Button>
        }
      />
      <StatGrid>
        <StatCard label="Live lots" value={s?.activeLots ?? "—"} icon={Radio} tone="success" />
        <StatCard
          label="Gross merchandise value"
          value={formatMoney(s?.totalGmvCents ?? 0)}
          icon={Banknote}
          hint="Settled payments"
        />
        <StatCard
          label="Verified sellers"
          value={s?.verifiedSellers ?? "—"}
          icon={BadgeCheck}
          tone="warning"
          hint={`${pending} awaiting review`}
        />
        <StatCard label="Open disputes" value={s?.openDisputes ?? "—"} icon={Scale} tone="danger" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New businesses</CardTitle>
            <CardDescription>Registrations by role, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart
              data={growth}
              xKey="label"
              stacked
              series={[
                { key: "buyers", label: "Buyers", color: "var(--chart-1)" },
                { key: "sellers", label: "Sellers", color: "var(--chart-3)" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verification status</CardTitle>
            <CardDescription>Buyers and sellers</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              centerLabel="accounts"
              data={[
                { key: "verified", label: "Verified", value: verification.VERIFIED ?? 0, color: "var(--chart-2)" },
                { key: "pending", label: "Pending", value: verification.PENDING ?? 0, color: "var(--chart-3)" },
                { key: "rejected", label: "Rejected", value: verification.REJECTED ?? 0, color: "var(--chart-5)" },
                {
                  key: "unverified",
                  label: "Unverified",
                  value: verification.UNVERIFIED ?? 0,
                  color: "var(--muted-foreground)",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lots by status</CardTitle>
            <CardDescription>Across the whole catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart
              height={220}
              data={LOT_STATUSES.map((status, i) => ({
                label: status[0] + status.slice(1).toLowerCase(),
                value: lotTotals[i].data?.meta.total ?? 0,
              }))}
              xKey="label"
              series={[{ key: "value", label: "Lots", color: "var(--chart-2)" }]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest audit log entries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/audit-logs">
                All <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {audit.data?.items.length ? (
              <ul className="divide-y">
                {audit.data.items.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono text-xs">{log.action}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {log.entityType} · {log.entityId.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {typeof log.metadata?.verificationStatus === "string" && (
                        <StatusBadge status={log.metadata.verificationStatus as "VERIFIED" | "REJECTED"} />
                      )}
                      {typeof log.metadata?.status === "string" && (
                        <StatusBadge status={log.metadata.status as "RESOLVED" | "REJECTED"} />
                      )}
                      <span className="text-muted-foreground text-xs">{formatRelative(log.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-muted-foreground text-sm">No operator activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
