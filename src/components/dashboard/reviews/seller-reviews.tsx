"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuFilterX, LuMapPin, LuMessageSquareQuote } from "react-icons/lu";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { RatingStars } from "@/components/shared/rating-stars";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import { receivedReviewsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { RatingBreakdown, Review } from "@/types/api";

const DEFAULTS = { rating: "all", q: "" };
const PER_PAGE = 8;

const columns: Column<Review>[] = [
  {
    key: "buyer",
    header: "Buyer",
    cell: (r) => (
      <div className="min-w-0 max-w-36 sm:max-w-56">
        <p className="truncate font-medium">{r.author.companyName}</p>
        {r.author.location && (
          <p className="flex items-center gap-1 truncate text-muted-foreground text-xs">
            <LuMapPin className="size-3" aria-hidden /> {r.author.location}
          </p>
        )}
      </div>
    ),
  },
  { key: "rating", header: "Rating", cell: (r) => <RatingStars value={r.rating} size="xs" /> },
  {
    key: "review",
    header: "Review",
    hideBelow: "md",
    cell: (r) => (
      <div className="min-w-0 max-w-md">
        <p className="truncate font-medium">{r.title}</p>
        <p className="line-clamp-2 text-muted-foreground text-xs">{r.comment}</p>
      </div>
    ),
  },
  {
    key: "lot",
    header: "Lot",
    hideBelow: "lg",
    cell: (r) => (
      <Link href={`/lots/${r.lotId}`} className="line-clamp-1 max-w-48 hover:text-primary hover:underline">
        {r.lot.title}
      </Link>
    ),
  },
  { key: "date", header: "Posted", hideBelow: "sm", cell: (r) => formatDate(r.createdAt) },
];

function RatingSummary({
  summary,
  active,
  onPick,
}: {
  summary: RatingBreakdown;
  active: string;
  onPick: (rating: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your rating</CardTitle>
        <CardDescription>From buyers who won and paid for your lots</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="text-center sm:pr-6">
          <p className="font-bold text-5xl tabular-nums tracking-tight">
            {summary.count ? summary.average.toFixed(1) : "—"}
          </p>
          <RatingStars value={summary.average} showValue={false} size="md" className="mt-2" />
          <p className="mt-1 text-muted-foreground text-sm">
            {summary.count} review{summary.count === 1 ? "" : "s"}
          </p>
        </div>
        <ul className="space-y-1.5">
          {(["5", "4", "3", "2", "1"] as const).map((star) => {
            const n = summary.distribution[star] ?? 0;
            const pct = summary.count ? (n / summary.count) * 100 : 0;
            return (
              <li key={star}>
                <button
                  type="button"
                  onClick={() => onPick(active === star ? "all" : star)}
                  aria-pressed={active === star}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1 text-sm hover:bg-muted",
                    active === star && "bg-muted",
                  )}
                >
                  <span className="w-12 shrink-0 text-left text-muted-foreground">{star} star</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-highlight" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 text-right tabular-nums">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Seller's reviews: rating breakdown (click a bar to filter) and every review with search and paging. */
export function SellerReviews() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const reviews = useQuery(
    receivedReviewsQuery({
      page,
      limit: PER_PAGE,
      rating: values.rating === "all" ? undefined : Number(values.rating),
      q: values.q || undefined,
    }),
  );
  const filtered = values.rating !== "all" || values.q !== "";

  return (
    <div className="space-y-6">
      {reviews.data ? (
        <RatingSummary summary={reviews.data.summary} active={values.rating} onPick={(rating) => set({ rating })} />
      ) : (
        <Skeleton className="h-52 w-full rounded-xl" />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-lg">All reviews</h2>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={values.q}
            onChange={(q) => set({ q })}
            placeholder="Search reviews or buyers"
            className="sm:w-60"
          />
          <Select value={values.rating} onValueChange={(rating) => set({ rating })}>
            <SelectTrigger className="w-36" aria-label="Filter by rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any rating</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} star{n === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button variant="ghost" size="sm" onClick={() => set({ rating: "all", q: "" })}>
              <LuFilterX /> Clear
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={reviews.data?.items}
        loading={reviews.isPending}
        dimmed={reviews.isPlaceholderData}
        getRowId={(r) => r.id}
        caption="Reviews of your company"
        empty={{
          icon: LuMessageSquareQuote,
          title: filtered ? "No reviews match" : "No reviews yet",
          description: filtered
            ? "Try a different rating or search."
            : "Buyers can review you after they pay for a lot they won from you.",
        }}
      />
      {reviews.data && (
        <PaginationBar
          page={page}
          totalPages={reviews.data.meta.totalPages}
          total={reviews.data.meta.total}
          onPage={setPage}
          label="reviews"
        />
      )}
    </div>
  );
}
