"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBanknote,
  LuBuilding2,
  LuGavel,
  LuInbox,
  LuNewspaper,
  LuRadio,
  LuScale,
  LuSparkles,
  LuStar,
} from "react-icons/lu";
import { AreaTrendChart, BarTrendChart, DonutChart } from "@/components/charts/lazy";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { axisMoney, dayLabel, monthLabel } from "@/lib/analytics";
import { formatMoney, formatRelative, initials } from "@/lib/format";
import { adminAnalyticsQuery, adminStatsQuery, auditLogsQuery } from "@/lib/queries";
import type { LotStatus } from "@/types/api";
import { AiBriefing } from "./ai-insights";

const STATUS_COLORS: Record<LotStatus, string> = {
  LIVE: "var(--chart-2)",
  SOLD: "var(--chart-1)",
  UNSOLD: "var(--chart-3)",
  ENDED: "var(--chart-4)",
  DRAFT: "var(--muted-foreground)",
  CANCELLED: "var(--chart-5)",
};

const titleCase = (s: string) => s[0] + s.slice(1).toLowerCase().replace("_", " ");

export function AdminOverview() {
  const stats = useQuery(adminStatsQuery());
  const analytics = useQuery(adminAnalyticsQuery());
  const audit = useQuery(auditLogsQuery({ page: 1, limit: 6 }));

  if (stats.isPending || analytics.isPending) return <DashboardSkeleton />;

  const s = stats.data;
  const a = analytics.data;
  const bids30 = a?.bidsPerDay.reduce((sum, d) => sum + d.bids, 0) ?? 0;
  const gmv = (a?.gmvPerMonth ?? []).map((m) => ({ label: monthLabel(m.month), value: m.gmvCents }));
  const bids = (a?.bidsPerDay ?? []).map((d) => ({ label: dayLabel(d.day), value: d.bids }));
  const categories = [...(a?.categories ?? [])].sort((x, y) => y.gmvCents - x.gmvCents);
  const topSales = categories[0]?.gmvCents ?? 0;
  const signups = (a?.signupsPerMonth ?? []).map((m) => ({
    label: monthLabel(m.month),
    buyers: m.buyers,
    sellers: m.sellers,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Marketplace health, revenue, bidding and everything waiting on an operator."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/insights">
                <LuSparkles /> AI insights
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/verifications">
                <LuBadgeCheck /> Review queue{s?.pendingVerifications ? ` (${s.pendingVerifications})` : ""}
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Live lots"
          value={s?.activeLots ?? "—"}
          icon={LuRadio}
          tone="success"
          hint="Open for bidding"
        />
        <StatCard
          label="Gross merchandise value"
          value={formatMoney(s?.totalGmvCents ?? 0)}
          icon={LuBanknote}
          hint="Settled payments, all time"
        />
        <StatCard
          label="Businesses"
          value={s?.totalUsers ?? "—"}
          icon={LuBuilding2}
          tone="warning"
          hint={`${s?.verifiedSellers ?? 0} verified sellers · ${s?.pendingVerifications ?? 0} pending`}
        />
        <StatCard
          label="Open disputes"
          value={s?.openDisputes ?? "—"}
          icon={LuScale}
          tone="danger"
          hint="Open or under review"
        />
      </StatGrid>
      <StatGrid>
        <StatCard
          label="Bids placed"
          value={s?.totalBids ?? "—"}
          icon={LuGavel}
          hint={`${bids30} in the last 30 days`}
        />
        <StatCard
          label="Average seller rating"
          value={s?.reviewCount ? `${s.averageRating.toFixed(1)} / 5` : "—"}
          icon={LuStar}
          tone="warning"
          hint={`${s?.reviewCount ?? 0} reviews`}
        />
        <StatCard
          label="Unread messages"
          value={s?.newMessages ?? "—"}
          icon={LuInbox}
          tone={s?.newMessages ? "danger" : "primary"}
          hint={
            <Link href="/admin/messages" className="hover:text-foreground hover:underline">
              Open the inbox
            </Link>
          }
        />
        <StatCard
          label="Newsletter subscribers"
          value={s?.subscribers ?? "—"}
          icon={LuNewspaper}
          tone="success"
          hint="Opted in from the home page"
        />
      </StatGrid>

      <AiBriefing />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales by month</CardTitle>
            <CardDescription>Settled payments, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={gmv} xKey="label" yKey="value" label="Sales" valueFormatter={axisMoney} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lots by status</CardTitle>
            <CardDescription>Across the whole catalogue</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              centerLabel="lots"
              data={(a?.lotsByStatus ?? []).map((l) => ({
                key: l.status.toLowerCase(),
                label: titleCase(l.status),
                value: l.count,
                color: STATUS_COLORS[l.status],
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bidding activity</CardTitle>
            <CardDescription>Bids placed per day, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart
              data={bids}
              xKey="label"
              series={[{ key: "value", label: "Bids", color: "var(--chart-1)" }]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New businesses</CardTitle>
            <CardDescription>Registrations by role, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart
              data={signups}
              xKey="label"
              stacked
              series={[
                { key: "buyers", label: "Buyers", color: "var(--chart-1)" },
                { key: "sellers", label: "Sellers", color: "var(--chart-3)" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Category performance</CardTitle>
            <CardDescription>Ranked by sales, with sell-through (sold ÷ closed lots) per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {categories.map((c, i) => (
                <li key={c.categoryId} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/lots?categoryId=${c.categoryId}`} className="truncate font-medium hover:text-primary">
                      <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                      {c.name}
                    </Link>
                    <span className="shrink-0 font-semibold tabular-nums">{formatMoney(c.gmvCents)}</span>
                  </div>
                  <Progress
                    value={topSales ? (c.gmvCents / topSales) * 100 : 0}
                    className="h-1.5"
                    aria-label={`${c.name} sales compared with the top category`}
                  />
                  <p className="text-muted-foreground text-xs">
                    {c.liveLots} live · {c.soldLots} sold ·{" "}
                    {c.sellThroughRate === null ? "no closed lots yet" : `${c.sellThroughRate}% sell-through`}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most active buyers</CardTitle>
            <CardDescription>By bids placed in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {a?.topBidders.length ? (
              <ol className="space-y-3">
                {a.topBidders.slice(0, 6).map((b, i) => (
                  <li key={b.buyerId} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-muted-foreground text-xs tabular-nums">{i + 1}</span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
                      {initials(b.companyName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{b.companyName}</p>
                      <p className="text-muted-foreground text-xs">
                        {b.bids} bids on {b.lots} lots
                      </p>
                    </div>
                    <span className="text-right text-xs tabular-nums">{axisMoney(b.volumeCents)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={LuGavel} title="No bids in the last 30 days" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Recent operator activity</CardTitle>
            <CardDescription>Latest audit log entries</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/audit-logs">
              All <LuArrowRight />
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
  );
}
