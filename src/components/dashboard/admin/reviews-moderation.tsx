"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuFilterX, LuMessageSquareQuote, LuStar, LuThumbsUp, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { RatingStars } from "@/components/shared/rating-stars";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteReview } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/format";
import { adminReviewsQuery, adminStatsQuery } from "@/lib/queries";
import type { Review } from "@/types/api";

const DEFAULTS = { rating: "all", q: "" };
const PER_PAGE = 10;

function RemoveReview({ review }: { review: Review }) {
  const remove = useDeleteReview();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          aria-label="Remove review"
        >
          <LuTrash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this review?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{review.title}&rdquo; by {review.author.companyName} will be deleted and {review.seller.companyName}
            &apos;s rating recalculated. The removal is recorded in the audit log. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep review</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => remove.mutate(review.id)}
          >
            Remove review
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const columns: Column<Review>[] = [
  {
    key: "review",
    header: "Review",
    cell: (r) => (
      <div className="min-w-56 max-w-sm space-y-1 whitespace-normal">
        <RatingStars value={r.rating} size="xs" showValue={false} />
        <p className="truncate font-medium">{r.title}</p>
        <p className="line-clamp-2 text-muted-foreground text-xs">{r.comment}</p>
      </div>
    ),
  },
  {
    key: "lot",
    header: "Lot",
    hideBelow: "xl",
    cell: (r) => (
      <Link
        href={`/lots/${r.lotId}`}
        className="line-clamp-2 max-w-48 whitespace-normal hover:text-primary hover:underline"
      >
        {r.lot.title}
      </Link>
    ),
  },
  { key: "seller", header: "Seller", hideBelow: "md", cell: (r) => r.seller.companyName },
  { key: "author", header: "Buyer", hideBelow: "sm", cell: (r) => r.author.companyName },
  { key: "date", header: "Posted", hideBelow: "md", cell: (r) => formatDate(r.createdAt) },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (r) => <RemoveReview review={r} />,
  },
];

/** Every buyer review on the platform, filterable by rating and text, with removal for abuse. */
export function ReviewsModeration() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const query = {
    page,
    limit: PER_PAGE,
    rating: values.rating === "all" ? undefined : Number(values.rating),
    q: values.q || undefined,
  };
  const reviews = useQuery(adminReviewsQuery(query));
  const stats = useQuery(adminStatsQuery());
  // Only meta.total is used from these two.
  const fiveStar = useQuery(adminReviewsQuery({ page: 1, limit: 1, rating: 5 }));
  const oneStar = useQuery(adminReviewsQuery({ page: 1, limit: 1, rating: 1 }));
  const filtered = values.rating !== "all" || values.q !== "";

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard label="Reviews" value={stats.data?.reviewCount ?? "—"} icon={LuMessageSquareQuote} />
        <StatCard
          label="Average rating"
          value={stats.data?.reviewCount ? `${stats.data.averageRating.toFixed(1)} / 5` : "—"}
          icon={LuStar}
          tone="warning"
        />
        <StatCard label="5-star reviews" value={fiveStar.data?.meta.total ?? "—"} icon={LuThumbsUp} tone="success" />
        <StatCard
          label="1-star reviews"
          value={oneStar.data?.meta.total ?? "—"}
          icon={LuTriangleAlert}
          tone="danger"
          hint="Check these first"
        />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={values.rating} onValueChange={(rating) => set({ rating })}>
          <SelectTrigger className="w-40" aria-label="Filter by rating">
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
        <SearchInput
          value={values.q}
          className="sm:w-60"
          onChange={(q) => set({ q })}
          placeholder="Search text, lot or company"
          label="Search reviews"
        />
        {filtered && (
          <Button variant="ghost" onClick={() => set({ rating: "all", q: "" })}>
            <LuFilterX /> Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={reviews.data?.items}
        loading={reviews.isPending}
        dimmed={reviews.isPlaceholderData}
        getRowId={(r) => r.id}
        caption="Buyer reviews"
        empty={{
          icon: LuMessageSquareQuote,
          title: filtered ? "No reviews match" : "No reviews yet",
          description: filtered
            ? "Try a different rating or search term."
            : "Buyers can review a seller after paying for a lot they won.",
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
