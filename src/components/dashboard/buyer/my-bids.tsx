"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuGavel } from "react-icons/lu";
import { Countdown } from "@/components/shared/countdown";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLotsByIds } from "@/hooks/use-lots";
import { useUrlState } from "@/hooks/use-url-state";
import { type BidPosition, type Standing, toPositions } from "@/lib/buyer";
import { formatMoney, formatRelative, lotCode } from "@/lib/format";
import { myBidsQuery } from "@/lib/queries";
import { useRequiredSession } from "@/providers/session-provider";

const TABS: { value: "all" | Standing; label: string }[] = [
  { value: "all", label: "All" },
  { value: "WINNING", label: "Leading" },
  { value: "OUTBID", label: "Outbid" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];
const DEFAULTS = { tab: "all", q: "" };
const PER_PAGE = 10;

const columns: Column<BidPosition>[] = [
  {
    key: "lot",
    header: "Lot",
    cell: (p) => (
      <div className="min-w-0 max-w-80">
        <Link href={`/lots/${p.lotId}`} className="line-clamp-1 font-medium hover:text-primary hover:underline">
          {p.lot?.title ?? "Loading…"}
        </Link>
        <span className="font-mono text-muted-foreground text-xs">{lotCode(p.lotId)}</span>
      </div>
    ),
  },
  { key: "standing", header: "Standing", cell: (p) => <StatusBadge status={p.standing} /> },
  {
    key: "mine",
    header: "Your top bid",
    className: "text-right tabular-nums",
    cell: (p) => formatMoney(p.myTopCents),
  },
  {
    key: "current",
    header: "Current",
    className: "text-right tabular-nums",
    hideBelow: "sm",
    cell: (p) => formatMoney(p.lot?.currentHighestBidAmountCents),
  },
  {
    key: "time",
    header: "Closes",
    hideBelow: "md",
    cell: (p) => (p.lot?.status === "LIVE" ? <Countdown endTime={p.lot.endTime} /> : "Closed"),
  },
  {
    key: "last",
    header: "Last bid",
    hideBelow: "lg",
    cell: (p) => (
      <span className="text-muted-foreground">
        {formatRelative(p.lastBidAt)} · {p.bidCount} bid{p.bidCount > 1 ? "s" : ""}
      </span>
    ),
  },
  {
    key: "action",
    header: <span className="sr-only">Action</span>,
    className: "text-right",
    cell: (p) =>
      p.standing === "OUTBID" ? (
        <Button size="sm" asChild>
          <Link href={`/lots/${p.lotId}`}>Re-bid</Link>
        </Button>
      ) : p.standing === "WON" ? (
        <Button size="sm" variant="outline" asChild>
          <Link href="/buyer/payments">Pay</Link>
        </Button>
      ) : null,
  },
];

/** One row per lot the buyer bid on. Tab, search and page are URL state (?tab=OUTBID&q=cnc&page=2). */
export function MyBids() {
  const me = useRequiredSession();
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const bids = useQuery(myBidsQuery());
  const lots = useLotsByIds(bids.data?.items.map((b) => b.lotId) ?? []);

  const all = toPositions(bids.data?.items ?? [], lots.byId, me.id);
  const counts = Object.fromEntries(
    TABS.map((t) => [t.value, t.value === "all" ? all.length : all.filter((p) => p.standing === t.value).length]),
  );
  const filtered = all
    .filter((p) => values.tab === "all" || p.standing === values.tab)
    .filter((p) => !values.q || p.lot?.title.toLowerCase().includes(values.q.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={values.tab} onValueChange={(tab) => set({ tab })}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="ml-1 rounded bg-muted px-1.5 text-muted-foreground text-xs tabular-nums">
                  {counts[t.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <SearchInput value={values.q} onChange={(q) => set({ q })} placeholder="Filter by lot title…" />
      </div>
      <DataTable
        columns={columns}
        rows={bids.isPending ? undefined : rows}
        getRowId={(p) => p.lotId}
        loading={bids.isPending}
        caption="Your bids by lot"
        empty={{
          icon: LuGavel,
          title: values.tab === "all" && !values.q ? "You haven't bid yet" : "Nothing in this view",
          description:
            values.tab === "all" && !values.q
              ? "Browse live auctions to place your first bid."
              : "Try another tab or clear the search.",
          action: (
            <Button asChild>
              <Link href="/lots">Browse auctions</Link>
            </Button>
          ),
        }}
      />
      <PaginationBar page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} label="lots" />
    </div>
  );
}
