"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LotCard } from "@/components/lots/lot-card";
import { LOT_GRID, LotCardSkeleton } from "@/components/shared/skeletons";
import { recentLotIds } from "@/lib/activity";
import { lotsQuery, recommendationsQuery } from "@/lib/queries";
import { useWatchlist } from "@/stores/watchlist-store";
import { Section } from "./section";

/**
 * AI recommendations. Signals stay in the browser: recently viewed lots and the
 * watchlist are sent as seeds; signed-in buyers also get their bid history.
 * With no signals the API returns trending lots, and the heading says so.
 */
export function RecommendedSection() {
  const watchlist = useWatchlist((s) => s.ids);
  const [seed, setSeed] = useState<string[] | null>(null);

  useEffect(() => {
    const update = () => setSeed([...new Set([...recentLotIds(12), ...watchlist.slice(0, 8)])]);
    update();
    window.addEventListener("surplusbid:activity", update);
    return () => window.removeEventListener("surplusbid:activity", update);
  }, [watchlist]);

  const recs = useQuery({ ...recommendationsQuery(seed ?? []), enabled: seed !== null });
  const personalized = recs.data?.strategy === "personalized";
  // No browsing history yet: the trending row below already covers "popular", so show what's new instead.
  const fresh = useQuery({
    ...lotsQuery({ status: "LIVE", sortBy: "createdAt", sortOrder: "desc", limit: 4 }),
    enabled: recs.isSuccess && !personalized,
  });
  const items = personalized ? (recs.data?.items.slice(0, 4) ?? []) : (fresh.data?.items ?? []);
  const loading = seed === null || recs.isPending || (!personalized && fresh.isPending);

  if (!loading && items.length === 0) return null;

  return (
    <Section
      id="for-you"
      eyebrow={personalized ? "AI recommendations" : "Just listed"}
      title={personalized ? "Picked for you" : "Fresh on the floor"}
      description={
        personalized
          ? "Chosen by our recommendation engine from the lots you've viewed, watched and bid on."
          : "The newest lots from verified sellers. Open a few and this row turns into AI picks for you."
      }
      action={
        personalized
          ? { href: "/lots?sort=popular", label: "More like this" }
          : { href: "/lots?sort=newest", label: "All new lots" }
      }
      muted
    >
      <div className={LOT_GRID}>
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cards
              <LotCardSkeleton key={i} />
            ))
          : items.map((lot) => (
              <LotCard key={lot.id} lot={lot} reason={"reason" in lot ? String(lot.reason) : undefined} />
            ))}
      </div>
    </Section>
  );
}
