"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, Gavel, Pencil, Rocket, Target, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AreaTrendChart } from "@/components/charts/lazy";
import { BidHistory } from "@/components/lots/bid-history";
import { Countdown } from "@/components/shared/countdown";
import { LotImage } from "@/components/shared/lot-image";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { usePublishLot } from "@/hooks/use-seller-lots";
import { axisMoney } from "@/lib/analytics";
import { formatDateTime, formatMoney, lotCode } from "@/lib/format";
import { bidHistoryQuery, lotQuery } from "@/lib/queries";
import type { Lot } from "@/types/api";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function LotPerformance({ initialLot }: { initialLot: Lot }) {
  const { data: lot = initialLot } = useQuery({ ...lotQuery(initialLot.id), initialData: initialLot });
  const history = useQuery(bidHistoryQuery(lot.id, 1, 50));
  const publish = usePublishLot();

  const bids = history.data?.items ?? [];
  const current = lot.currentHighestBidAmountCents;
  const reserve = lot.reservePriceCents ?? 0;
  const reserveProgress = reserve ? Math.min(100, Math.round(((current ?? 0) / reserve) * 100)) : 0;
  const series = [...bids]
    .reverse()
    .map((b) => ({ label: timeFmt.format(new Date(b.createdAt)), value: b.amountCents }));
  const closed = lot.status !== "LIVE" && lot.status !== "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <LotImage
          src={lot.images[0]}
          alt={lot.title}
          className="aspect-4/3 w-full shrink-0 rounded-lg border sm:w-40"
          sizes="160px"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lot.status} />
            <span className="font-mono text-muted-foreground text-xs">{lotCode(lot.id)}</span>
          </div>
          <h1 className="font-semibold text-2xl tracking-tight">{lot.title}</h1>
          <p className="text-muted-foreground text-sm">
            {formatDateTime(lot.startTime)} → {formatDateTime(lot.endTime)} · {lot.condition} · qty {lot.quantity}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lot.status === "DRAFT" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/seller/lots/${lot.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
              <Button onClick={() => publish.mutate(lot.id)} disabled={publish.isPending}>
                {publish.isPending ? <Spinner /> : <Rocket />} Publish
              </Button>
            </>
          )}
          {closed && (
            <Button variant="outline" asChild>
              <Link href={`/seller/lots/new?from=${lot.id}`}>
                <Copy /> Relist
              </Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href={`/lots/${lot.id}`}>
              <Eye /> Preview
            </Link>
          </Button>
        </div>
      </div>

      <StatGrid>
        <StatCard
          label="Current bid"
          value={formatMoney(current)}
          icon={TrendingUp}
          hint={`Started at ${formatMoney(lot.startingPriceCents)}`}
        />
        <StatCard
          label="Bids"
          value={history.data?.meta.total ?? "—"}
          icon={Gavel}
          tone="success"
          hint={`Increment ${formatMoney(lot.bidIncrementCents)}`}
        />
        <StatCard
          label="Reserve"
          value={formatMoney(reserve)}
          icon={Target}
          tone={(current ?? 0) >= reserve ? "success" : "warning"}
          hint={(current ?? 0) >= reserve ? "Reserve met" : `${reserveProgress}% of reserve`}
        />
        <StatCard
          label={lot.status === "LIVE" ? "Time left" : "Closed"}
          value={lot.status === "LIVE" ? <Countdown endTime={lot.endTime} /> : formatDateTime(lot.endTime)}
          icon={Timer}
          tone="danger"
        />
      </StatGrid>

      {reserve > 0 && lot.status === "LIVE" && (
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to reserve</span>
              <span className="tabular-nums">
                {formatMoney(current ?? 0)} / {formatMoney(reserve)}
              </span>
            </div>
            <Progress value={reserveProgress} aria-label="Progress to reserve price" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Price over time</CardTitle>
            <CardDescription>Each point is a bid (last 50)</CardDescription>
          </CardHeader>
          <CardContent>
            {series.length ? (
              <AreaTrendChart data={series} xKey="label" yKey="value" label="Bid" valueFormatter={axisMoney} />
            ) : (
              <p className="py-16 text-center text-muted-foreground text-sm">
                {lot.status === "DRAFT" ? "Publish the lot to start receiving bids." : "No bids yet."}
              </p>
            )}
          </CardContent>
        </Card>
        <BidHistory lotId={lot.id} live={lot.status === "LIVE"} />
      </div>
    </div>
  );
}
