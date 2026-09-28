"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Copy, Eye, MoreHorizontal, Package, PackagePlus, Pencil, Rocket, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Countdown } from "@/components/shared/countdown";
import { type Column, DataTable } from "@/components/shared/data-table";
import { LotImage } from "@/components/shared/lot-image";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteLot, usePublishLot } from "@/hooks/use-seller-lots";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatMoney, lotCode } from "@/lib/format";
import { categoriesQuery, myListingsQuery } from "@/lib/queries";
import type { LotListItem, LotStatus } from "@/types/api";

const DEFAULTS = { status: "all", q: "", sort: "newest" };
const TABS: ("all" | LotStatus)[] = ["all", "LIVE", "DRAFT", "SOLD", "UNSOLD", "ENDED"];
const PER_PAGE = 10;

export function ListingsTable() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const listings = useQuery(myListingsQuery());
  const categories = useQuery(categoriesQuery());
  const publish = usePublishLot();
  const remove = useDeleteLot();
  const [confirmDelete, setConfirmDelete] = useState<LotListItem | null>(null);

  const all = listings.data ?? [];
  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const filtered = all
    .filter((l) => values.status === "all" || l.status === values.status)
    .filter((l) => !values.q || l.title.toLowerCase().includes(values.q.toLowerCase()))
    .sort((a, b) =>
      values.sort === "ending"
        ? a.endTime.localeCompare(b.endTime)
        : values.sort === "price"
          ? (b.currentHighestBidAmountCents ?? 0) - (a.currentHighestBidAmountCents ?? 0)
          : 0,
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const columns: Column<LotListItem>[] = [
    {
      key: "lot",
      header: "Lot",
      cell: (l) => (
        <div className="flex min-w-0 items-center gap-3">
          <LotImage src={l.images[0]} alt="" className="size-10 shrink-0 rounded-md" sizes="40px" />
          <div className="min-w-0">
            <Link href={`/seller/lots/${l.id}`} className="line-clamp-1 font-medium hover:text-primary hover:underline">
              {l.title}
            </Link>
            <p className="font-mono text-muted-foreground text-xs">
              {lotCode(l.id)} · {categoryName.get(l.categoryId) ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
    {
      key: "price",
      header: "High bid",
      className: "text-right tabular-nums",
      cell: (l) =>
        l.currentHighestBidAmountCents ? (
          formatMoney(l.currentHighestBidAmountCents)
        ) : (
          <span className="text-muted-foreground">from {formatMoney(l.startingPriceCents)}</span>
        ),
    },
    {
      key: "ends",
      header: "Ends",
      hideBelow: "md",
      cell: (l) => (l.status === "LIVE" ? <Countdown endTime={l.endTime} /> : formatDateTime(l.endTime)),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (l) => (
        <div className="flex items-center justify-end gap-1">
          {l.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => publish.mutate(l.id)}
              disabled={publish.isPending && publish.variables === l.id}
            >
              <Rocket /> Publish
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${l.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/seller/lots/${l.id}`}>
                  <BarChart3 /> Performance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/lots/${l.id}`}>
                  <Eye /> Preview as buyer
                </Link>
              </DropdownMenuItem>
              {l.status === "DRAFT" && (
                <DropdownMenuItem asChild>
                  <Link href={`/seller/lots/${l.id}/edit`}>
                    <Pencil /> Edit draft
                  </Link>
                </DropdownMenuItem>
              )}
              {["SOLD", "UNSOLD", "ENDED", "CANCELLED"].includes(l.status) && (
                <DropdownMenuItem asChild>
                  <Link href={`/seller/lots/new?from=${l.id}`}>
                    <Copy /> Relist
                  </Link>
                </DropdownMenuItem>
              )}
              {l.status === "DRAFT" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(l)}>
                    <Trash2 /> Delete draft
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={values.status} onValueChange={(status) => set({ status })}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t === "all" ? "All" : t[0] + t.slice(1).toLowerCase()}
                <span className="ml-1 rounded bg-muted px-1.5 text-muted-foreground text-xs tabular-nums">
                  {t === "all" ? all.length : all.filter((l) => l.status === t).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <SearchInput value={values.q} onChange={(q) => set({ q })} placeholder="Search your lots…" />
          <Tabs value={values.sort} onValueChange={(sort) => set({ sort })}>
            <TabsList aria-label="Sort">
              <TabsTrigger value="newest">Newest</TabsTrigger>
              <TabsTrigger value="ending">Ending</TabsTrigger>
              <TabsTrigger value="price">Price</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={listings.isPending ? undefined : rows}
        loading={listings.isPending}
        getRowId={(l) => l.id}
        caption="Your listings"
        empty={{
          icon: all.length ? Package : PackagePlus,
          title: all.length ? "No lots in this view" : "No listings yet",
          description: all.length
            ? "Try another status or clear the search."
            : "Create your first lot to start selling.",
          action: !all.length ? (
            <Button asChild>
              <Link href="/seller/lots/new">Create a lot</Link>
            </Button>
          ) : undefined,
        }}
      />
      <PaginationBar page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} label="lots" />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirmDelete?.title}” will be removed from your listings. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
            >
              Delete draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
