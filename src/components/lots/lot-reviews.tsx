"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuBadgeCheck, LuMessageSquare } from "react-icons/lu";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { RatingStars } from "@/components/shared/rating-stars";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, initials } from "@/lib/format";
import { sellerReviewsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const PER_PAGE = 4;

/** The seller's rating breakdown and reviews from winning buyers, filterable by stars. */
export function LotReviews({ sellerId, sellerName, lotId }: { sellerId: string; sellerName: string; lotId: string }) {
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const reviews = useQuery(sellerReviewsQuery(sellerId, { page, limit: PER_PAGE, ...(rating ? { rating } : {}) }));
  const summary = reviews.data?.summary;

  if (reviews.isPending) {
    return (
      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        <Skeleton className="h-40 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!summary?.count) {
    return (
      <EmptyState
        icon={LuMessageSquare}
        title={`${sellerName} has no reviews yet`}
        description="Reviews come from buyers who won and paid for a lot from this seller."
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <div className="space-y-3">
        <div>
          <p className="font-bold text-4xl tabular-nums">{summary.average.toFixed(1)}</p>
          <RatingStars value={summary.average} showValue={false} size="md" />
          <p className="mt-1 text-muted-foreground text-sm">
            {summary.count} review{summary.count === 1 ? "" : "s"} of {sellerName}
          </p>
        </div>
        <ul className="space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const n = summary.distribution[String(stars) as "1" | "2" | "3" | "4" | "5"] ?? 0;
            const selected = rating === stars;
            return (
              <li key={stars}>
                <button
                  type="button"
                  disabled={n === 0}
                  onClick={() => {
                    setRating(selected ? undefined : stars);
                    setPage(1);
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors enabled:hover:bg-muted disabled:opacity-50",
                    selected && "bg-muted",
                  )}
                >
                  <span className="w-8 shrink-0 text-left tabular-nums">{stars} ★</span>
                  <Progress value={(n / summary.count) * 100} className="h-2 flex-1" />
                  <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {rating && (
          <button type="button" onClick={() => setRating(undefined)} className="text-primary text-sm hover:underline">
            Show all ratings
          </button>
        )}
      </div>

      <div className="space-y-4">
        <ul className={cn("space-y-4 transition-opacity", reviews.isPlaceholderData && "opacity-60")}>
          {reviews.data?.items.map((r) => (
            <li key={r.id} className="space-y-2 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                      {initials(r.author.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{r.author.companyName}</p>
                    <p className="flex items-center gap-1 text-muted-foreground text-xs">
                      <LuBadgeCheck className="size-3.5 text-success" aria-hidden /> Verified winning buyer ·{" "}
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>
                <RatingStars value={r.rating} showValue={false} />
              </div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{r.comment}</p>
              <p className="text-muted-foreground text-xs">
                {r.lotId === lotId ? "Review of this lot" : `Purchased: ${r.lot.title}`}
              </p>
            </li>
          ))}
        </ul>
        {reviews.data && reviews.data.meta.totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={reviews.data.meta.totalPages}
            total={reviews.data.meta.total}
            onPage={setPage}
            label="reviews"
          />
        )}
      </div>
    </div>
  );
}
