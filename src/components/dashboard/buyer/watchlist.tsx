"use client";

import Link from "next/link";
import { LuHeart } from "react-icons/lu";
import { LotCard } from "@/components/lots/lot-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LotGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useLotsByIds } from "@/hooks/use-lots";
import { useMounted } from "@/hooks/use-mounted";
import { useWatchlist } from "@/stores/watchlist-store";

export function Watchlist() {
  const mounted = useMounted();
  const ids = useWatchlist((s) => s.ids);
  const lots = useLotsByIds(mounted ? ids : []);

  if (!mounted || (ids.length > 0 && lots.isPending)) return <LotGridSkeleton count={3} />;
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
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {found.length} watched lot{found.length === 1 ? "" : "s"}
        {lots.missing > 0 && ` · ${lots.missing} no longer available`}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {found.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </div>
    </div>
  );
}
