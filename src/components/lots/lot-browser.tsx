"use client";

import { useQuery } from "@tanstack/react-query";
import { FilterX, Gavel, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { LotCard } from "@/components/lots/lot-card";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { LotGridSkeleton } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroupLite } from "@/components/shared/toggle-group-lite";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlState } from "@/hooks/use-url-state";
import { formatMoney, lotCode } from "@/lib/format";
import { categoriesQuery, lotsQuery } from "@/lib/queries";
import { BROWSE_STATUSES, LOT_BROWSE_DEFAULTS, LOT_SORTS, toLotQuery } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences-store";
import type { Lot } from "@/types/api";

const STATUS_LABEL: Record<(typeof BROWSE_STATUSES)[number], string> = {
  LIVE: "Live now",
  SOLD: "Sold",
  UNSOLD: "Unsold",
  ENDED: "Ended",
};

/**
 * Catalog with search, category, status, sort and page all mirrored in the
 * URL (?q=&categoryId=&status=&sort=&page=), so any view is shareable.
 * The first page arrives prefetched from the server via HydrationBoundary.
 */
export function LotBrowser({ basePath = "/lots" }: { basePath?: string }) {
  const { values, page, set, setPage, isPending } = useUrlState(LOT_BROWSE_DEFAULTS);
  const query = toLotQuery({ ...values, page: String(page) });
  const lots = useQuery(lotsQuery(query));
  const categories = useQuery(categoriesQuery());
  const mounted = useMounted();
  const view = usePreferences((s) => s.lotView);
  const setView = usePreferences((s) => s.setLotView);
  const effectiveView = mounted ? view : "grid";

  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const filtered = values.q || values.categoryId || values.status !== "LIVE" || values.sort !== "ending";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={values.q}
          onChange={(q) => set({ q })}
          placeholder="Search lot titles…"
          label="Search lots"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={values.categoryId || "all"} onValueChange={(v) => set({ categoryId: v === "all" ? "" : v })}>
            <SelectTrigger className="w-40" aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={values.status} onValueChange={(status) => set({ status })}>
            <SelectTrigger className="w-32" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BROWSE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={values.sort} onValueChange={(sort) => set({ sort })}>
            <SelectTrigger className="w-40" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOT_SORTS).map(([key, s]) => (
                <SelectItem key={key} value={key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              onClick={() => set({ q: "", categoryId: "", status: "LIVE", sort: "ending" })}
              aria-label="Clear filters"
            >
              <FilterX /> Clear
            </Button>
          )}
        </div>
        <div className="lg:ml-auto">
          <ToggleGroupLite
            label="Layout"
            value={effectiveView}
            onChange={setView}
            options={[
              { value: "grid", label: "Grid view", icon: LayoutGrid },
              { value: "list", label: "List view", icon: List },
            ]}
          />
        </div>
      </div>

      <div
        aria-busy={lots.isFetching || isPending}
        className={cn("transition-opacity", (lots.isPlaceholderData || isPending) && "opacity-60")}
      >
        {lots.isPending ? (
          <LotGridSkeleton />
        ) : lots.isError ? (
          <EmptyState
            icon={Gavel}
            title="Couldn't load auctions"
            description="The API didn't respond. Check your connection and retry."
            action={<Button onClick={() => lots.refetch()}>Retry</Button>}
          />
        ) : lots.data.items.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title={values.q ? `No lots match “${values.q}”` : "No lots found"}
            description="Try a different category or status, or clear your filters."
            action={
              filtered ? (
                <Button
                  variant="outline"
                  onClick={() => set({ q: "", categoryId: "", status: "LIVE", sort: "ending" })}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : effectiveView === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lots.data.items.map((lot, i) => (
              <LotCard key={lot.id} lot={lot} categoryName={categoryName.get(lot.categoryId)} priority={i < 3} />
            ))}
          </div>
        ) : (
          <LotTable lots={lots.data.items} categoryName={categoryName} basePath={basePath} />
        )}
      </div>

      {lots.data && (
        <PaginationBar
          page={page}
          totalPages={lots.data.meta.totalPages}
          total={lots.data.meta.total}
          onPage={setPage}
          label="lots"
        />
      )}
    </div>
  );
}

function LotTable({
  lots,
  categoryName,
  basePath,
}: {
  lots: Lot[];
  categoryName: Map<string, string>;
  basePath: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lot</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Time left</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot) => (
            <TableRow key={lot.id}>
              <TableCell className="max-w-72">
                <Link href={`${basePath}/${lot.id}`} className="font-medium hover:text-primary hover:underline">
                  <span className="line-clamp-1">{lot.title}</span>
                </Link>
                <span className="font-mono text-muted-foreground text-xs">{lotCode(lot.id)}</span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{categoryName.get(lot.categoryId) ?? "—"}</TableCell>
              <TableCell>
                <StatusBadge status={lot.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(lot.currentHighestBidAmountCents ?? lot.startingPriceCents)}
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                {lot.status === "LIVE" ? <Countdown endTime={lot.endTime} /> : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
