"use client";

import Link from "next/link";
import { useState } from "react";
import { LuHeart } from "react-icons/lu";
import { LotCard } from "@/components/lots/lot-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { DASHBOARD_LOT_GRID, LotGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useLotsByIds } from "@/hooks/use-lots";
import { useMounted } from "@/hooks/use-mounted";
import { useWatchlist } from "@/stores/watchlist-store";

const PER_PAGE = 8;
type Show = "all" | "live" | "closed";

export function Watchlist() {
  const mounted = useMounted();
  const ids = useWatchlist((s) => s.ids);
  const lots = useLotsByIds(mounted ? ids : []);
  const [show, setShow] = useState<Show>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  if (!mounted || (ids.length > 0 && lots.isPending))
    return <LotGridSkeleton count={4} className={DASHBOARD_LOT_GRID} />;
  if (ids.length === 0) {
    return (
      <EmptyState
        icon={LuHeart}
        title="Your watchlist is empty"
        description="Tap the heart on any lot to keep an eye on it here."
        action={
          <Button asChild>
            <Link href="/lots">Find lots to watch</Link>
          </Button>
        }
      />
    );
  }

  const found = ids.map((id) => lots.byId.get(id)).filter((l) => l !== undefined);
  const live = found.filter((l) => l.status === "LIVE");
  const q = query.trim().toLowerCase();
  const matches = found.filter(
    (l) =>
      (show === "all" || (show === "live" ? l.status === "LIVE" : l.status !== "LIVE")) &&
      (!q || l.title.toLowerCase().includes(q)),
  );
  const totalPages = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<Show>
          label="Filter watched lots"
          value={show}
          onChange={(v) => {
            setShow(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All", count: found.length },
            { value: "live", label: "Live", count: live.length },
            { value: "closed", label: "Closed", count: found.length - live.length },
          ]}
        />
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search watched lots"
          label="Search watched lots"
        />
      </div>
      {lots.missing > 0 && (
        <p className="text-muted-foreground text-sm">
          {lots.missing} watched lot{lots.missing === 1 ? " is" : "s are"} no longer available.
        </p>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={LuHeart} title="No watched lots match" description="Try another filter or search." />
      ) : (
        <div className={DASHBOARD_LOT_GRID}>
          {rows.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
      {matches.length > 0 && (
        <PaginationBar page={current} totalPages={totalPages} total={matches.length} onPage={setPage} label="lots" />
      )}
    </div>
  );
}
