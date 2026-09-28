"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, CreditCard, Gavel, Receipt, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { BarTrendChart, DonutChart } from "@/components/charts/lazy";
import { VerificationBanner } from "@/components/dashboard/verification-banner";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLotsByIds } from "@/hooks/use-lots";
import { perDay } from "@/lib/analytics";
import { toPositions } from "@/lib/buyer";
import { formatDateTime, formatMoney } from "@/lib/format";
import { myBidsQuery, myPaymentsQuery } from "@/lib/queries";
import { useRequiredSession } from "@/providers/session-provider";

export function BuyerOverview() {
  const me = useRequiredSession();
  const bids = useQuery(myBidsQuery());
  const payments = useQuery(myPaymentsQuery());
  const lots = useLotsByIds(bids.data?.items.map((b) => b.lotId) ?? []);

  if (bids.isPending || payments.isPending) return <DashboardSkeleton />;

  const bidItems = bids.data?.items ?? [];
  const paymentItems = payments.data?.items ?? [];
  const positions = toPositions(bidItems, lots.byId, me.id);
  const winning = positions.filter((p) => p.standing === "WINNING");
  const outbid = positions.filter((p) => p.standing === "OUTBID");
  const won = positions.filter((p) => p.standing === "WON");
  const due = paymentItems.filter((p) => p.status === "PENDING");
  const paidCents = paymentItems.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amountCents, 0);
  const activity = perDay(bidItems, (b) => b.createdAt, 14);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${me.companyName}`}
        description="Your bids, wins and payments at a glance."
        actions={
          <Button asChild>
            <Link href="/lots">
              <Gavel /> Browse auctions
            </Link>
          </Button>
        }
      />
      <VerificationBanner />

      {due.map((p) => (
        <Alert key={p.id} className="border-primary/40 bg-primary/5">
          <CreditCard className="text-primary" />
          <AlertTitle>Payment due: {formatMoney(p.amountCents)}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              You won {lots.byId.get(p.lotId)?.title ?? "a lot"}. Pay before {formatDateTime(p.dueAt)} to keep it.
            </span>
            <Button size="sm" asChild>
              <Link href={`/buyer/checkout/${p.id}`}>Pay now</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      <StatGrid>
        <StatCard
          label="Leading"
          value={winning.length}
          icon={TrendingUp}
          tone="success"
          hint="Live lots you're winning"
        />
        <StatCard label="Outbid" value={outbid.length} icon={AlertCircle} tone="danger" hint="Live lots to re-bid on" />
        <StatCard label="Lots won" value={won.length} icon={Trophy} tone="warning" hint="All time" />
        <StatCard
          label="Paid to date"
          value={formatMoney(paidCents)}
          icon={Receipt}
          hint={`${due.length} payment(s) due`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bidding activity</CardTitle>
            <CardDescription>Bids you placed per day, last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart
              data={activity}
              xKey="label"
              series={[{ key: "value", label: "Bids", color: "var(--chart-1)" }]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where you stand</CardTitle>
            <CardDescription>Across every lot you&apos;ve bid on</CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length ? (
              <DonutChart
                centerLabel="lots"
                data={[
                  { key: "winning", label: "Leading", value: winning.length, color: "var(--chart-2)" },
                  { key: "outbid", label: "Outbid", value: outbid.length, color: "var(--chart-5)" },
                  { key: "won", label: "Won", value: won.length, color: "var(--chart-3)" },
                  {
                    key: "lost",
                    label: "Lost",
                    value: positions.filter((p) => p.standing === "LOST").length,
                    color: "var(--muted-foreground)",
                  },
                ]}
              />
            ) : (
              <EmptyState icon={Gavel} title="No bids yet" description="Your positions will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>Live lots you&apos;re in</CardTitle>
            <CardDescription>Sorted by your most recent bid</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/buyer/bids">
              All bids <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {[...winning, ...outbid].length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="You're not in any live auctions"
              description="Find a lot, authorize the deposit and place your first bid."
              action={
                <Button asChild>
                  <Link href="/lots">Browse auctions</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y">
              {[...outbid, ...winning].slice(0, 6).map((p) => (
                <li key={p.lotId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/lots/${p.lotId}`} className="line-clamp-1 font-medium hover:text-primary">
                      {p.lot?.title ?? "Loading lot…"}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      Your top bid {formatMoney(p.myTopCents)} · current{" "}
                      {formatMoney(p.lot?.currentHighestBidAmountCents)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.lot && <Countdown endTime={p.lot.endTime} className="text-sm" />}
                    <StatusBadge status={p.standing} />
                    {p.standing === "OUTBID" && (
                      <Button size="sm" asChild>
                        <Link href={`/lots/${p.lotId}`}>Re-bid</Link>
                      </Button>
                    )}
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
