"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuArrowRight, LuBanknote, LuFilePen, LuPackagePlus, LuRadio, LuTrendingUp } from "react-icons/lu";
import { BarTrendChart, DonutChart } from "@/components/charts/lazy";
import { VerificationBanner } from "@/components/dashboard/verification-banner";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { axisMoney, countBy, perMonth } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { myListingsQuery } from "@/lib/queries";
import { pct, sellerStats } from "@/lib/seller";
import { useRequiredSession } from "@/providers/session-provider";
import type { LotStatus } from "@/types/api";

const STATUS_COLORS: Partial<Record<LotStatus, string>> = {
  LIVE: "var(--chart-2)",
  DRAFT: "var(--muted-foreground)",
  SOLD: "var(--chart-1)",
  UNSOLD: "var(--chart-3)",
  ENDED: "var(--chart-4)",
  CANCELLED: "var(--chart-5)",
};

export function SellerOverview() {
  const me = useRequiredSession();
  const listings = useQuery(myListingsQuery());
  if (listings.isPending) return <DashboardSkeleton />;

  const lots = listings.data ?? [];
  const s = sellerStats(lots);
  const byStatus = countBy(lots, (l) => l.status);
  const monthly = perMonth(
    s.sold,
    (l) => l.endTime,
    6,
    (l) => l.currentHighestBidAmountCents ?? 0,
  );
  const closingSoon = [...s.live].sort((a, b) => a.endTime.localeCompare(b.endTime)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={me.companyName}
        description="How your lots are performing."
        actions={
          <Button asChild>
            <Link href="/seller/lots/new">
              <LuPackagePlus /> Create lot
            </Link>
          </Button>
        }
      />
      <VerificationBanner />
      <StatGrid>
        <StatCard
          label="Live lots"
          value={s.live.length}
          icon={LuRadio}
          tone="success"
          hint={`${formatMoney(s.liveBidValue)} in current bids`}
        />
        <StatCard label="Drafts" value={s.drafts.length} icon={LuFilePen} hint="Ready to publish" />
        <StatCard
          label="Gross sales"
          value={formatMoney(s.hammerCents)}
          icon={LuBanknote}
          tone="warning"
          hint={`${s.sold.length} lot(s) sold`}
        />
        <StatCard
          label="Sell-through"
          value={pct(s.sellThrough)}
          icon={LuTrendingUp}
          hint={`Uplift over start ${pct(s.upliftPct)}`}
        />
      </StatGrid>

      {lots.length === 0 ? (
        <EmptyState
          icon={LuPackagePlus}
          title="List your first lot"
          description="The wizard walks you through details, photos, pricing and the auction window."
          action={
            <Button asChild>
              <Link href="/seller/lots/new">Create a lot</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Sales by month</CardTitle>
              <CardDescription>Winning bid totals for sold lots, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <BarTrendChart
                data={monthly}
                xKey="label"
                series={[{ key: "value", label: "Sales", color: "var(--chart-1)" }]}
                valueFormatter={axisMoney}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Listings by status</CardTitle>
              <CardDescription>All {lots.length} lots</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart
                centerLabel="lots"
                data={Object.entries(byStatus).map(([status, value]) => ({
                  key: status.toLowerCase(),
                  label: status[0] + status.slice(1).toLowerCase(),
                  value,
                  color: STATUS_COLORS[status as LotStatus] ?? "var(--chart-4)",
                }))}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Closing soon</CardTitle>
            <CardDescription>Your live lots by time remaining</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/lots?status=LIVE">
              All live <LuArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {closingSoon.length === 0 ? (
            <p className="text-muted-foreground text-sm">No live lots right now. Publish a draft to start bidding.</p>
          ) : (
            <ul className="divide-y">
              {closingSoon.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/seller/lots/${l.id}`} className="line-clamp-1 font-medium hover:text-primary">
                    {l.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="tabular-nums">
                      {formatMoney(l.currentHighestBidAmountCents ?? l.startingPriceCents)}
                    </span>
                    <Countdown endTime={l.endTime} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
