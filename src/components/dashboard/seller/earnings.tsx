"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuBanknote, LuDownload, LuPiggyBank, LuReceipt, LuTrendingUp } from "react-icons/lu";
import { BarTrendChart } from "@/components/charts/lazy";
import { type Column, DataTable } from "@/components/shared/data-table";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { axisMoney, perMonth } from "@/lib/analytics";
import { depositFor } from "@/lib/config";
import { formatDate, formatMoney, lotCode } from "@/lib/format";
import { myListingsQuery } from "@/lib/queries";
import { pct, sellerStats } from "@/lib/seller";
import type { LotListItem } from "@/types/api";

const columns: Column<LotListItem>[] = [
  {
    key: "lot",
    header: "Lot",
    cell: (l) => (
      <div>
        <Link href={`/seller/lots/${l.id}`} className="line-clamp-1 font-medium hover:text-primary hover:underline">
          {l.title}
        </Link>
        <span className="font-mono text-muted-foreground text-xs">{lotCode(l.id)}</span>
      </div>
    ),
  },
  { key: "closed", header: "Closed", hideBelow: "sm", cell: (l) => formatDate(l.endTime) },
  { key: "status", header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
  {
    key: "hammer",
    header: "Winning bid",
    className: "text-right tabular-nums",
    cell: (l) => formatMoney(l.currentHighestBidAmountCents),
  },
  {
    key: "deposit",
    header: "Buyer deposit",
    className: "text-right tabular-nums",
    hideBelow: "md",
    cell: (l) => formatMoney(depositFor(l.startingPriceCents)),
  },
  {
    key: "balance",
    header: "Balance from buyer",
    className: "text-right tabular-nums",
    hideBelow: "lg",
    cell: (l) => formatMoney((l.currentHighestBidAmountCents ?? 0) - depositFor(l.startingPriceCents)),
  },
];

function downloadCsv(rows: LotListItem[]) {
  const header = ["lot_code", "title", "closed", "winning_bid_usd", "deposit_usd", "balance_usd"];
  const lines = rows.map((l) => {
    const hammer = (l.currentHighestBidAmountCents ?? 0) / 100;
    const deposit = depositFor(l.startingPriceCents) / 100;
    return [
      lotCode(l.id),
      `"${l.title.replaceAll('"', '""')}"`,
      l.endTime.slice(0, 10),
      hammer,
      deposit,
      hammer - deposit,
    ].join(",");
  });
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "surplusbid-earnings.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

/** Earnings from sold lots. The backend has no payout ledger, so figures come from winning bids. */
export function Earnings() {
  const listings = useQuery(myListingsQuery());
  if (listings.isPending) return <DashboardSkeleton />;

  const s = sellerStats(listings.data ?? []);
  const sold = [...s.sold].sort((a, b) => b.endTime.localeCompare(a.endTime));
  const monthly = perMonth(
    sold,
    (l) => l.endTime,
    6,
    (l) => l.currentHighestBidAmountCents ?? 0,
  );
  const avg = sold.length ? s.hammerCents / sold.length : 0;

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard
          label="Gross sales"
          value={formatMoney(s.hammerCents)}
          icon={LuBanknote}
          tone="success"
          hint={`${sold.length} lots sold`}
        />
        <StatCard
          label="Deposits secured"
          value={formatMoney(s.depositsSecuredCents)}
          icon={LuPiggyBank}
          hint="Captured from winners"
        />
        <StatCard label="Average sale" value={formatMoney(avg)} icon={LuReceipt} tone="warning" />
        <StatCard
          label="Sell-through"
          value={pct(s.sellThrough)}
          icon={LuTrendingUp}
          hint={`${s.closed.length} closed lots`}
        />
      </StatGrid>
      <Card>
        <CardHeader>
          <CardTitle>Monthly sales</CardTitle>
          <CardDescription>Winning bids on lots that closed each month</CardDescription>
        </CardHeader>
        <CardContent>
          <BarTrendChart
            data={monthly}
            xKey="label"
            series={[{ key: "value", label: "Sales", color: "var(--chart-2)" }]}
            valueFormatter={axisMoney}
          />
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Sold lots</h2>
        <Button variant="outline" size="sm" onClick={() => downloadCsv(sold)} disabled={!sold.length}>
          <LuDownload /> Export CSV
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={sold}
        getRowId={(l) => l.id}
        caption="Sold lots"
        empty={{
          icon: LuBanknote,
          title: "No sales yet",
          description: "Sold lots and their proceeds will be listed here.",
        }}
      />
    </div>
  );
}
