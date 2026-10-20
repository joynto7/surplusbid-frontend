"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuFilterX, LuMessageSquareQuote, LuPenLine, LuSend, LuTrophy } from "react-icons/lu";
import { toast } from "sonner";
import { TextareaField, TextField } from "@/components/forms/fields";
import { type Column, DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LotImage } from "@/components/shared/lot-image";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { RatingStars } from "@/components/shared/rating-stars";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useUrlState } from "@/hooks/use-url-state";
import { api } from "@/lib/api/client";
import { formatDate, formatMoney } from "@/lib/format";
import { myReviewsQuery, reviewableLotsQuery } from "@/lib/queries";
import { type ReviewValues, reviewSchema } from "@/lib/validation";
import type { Review, ReviewableLot } from "@/types/api";
import { StarInput } from "./star-input";

const DEFAULTS = { rating: "all", q: "" };
const PER_PAGE = 8;

function WriteReviewDialog({ lot, onClose }: { lot: ReviewableLot | null; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { title: "", comment: "" },
    mode: "onTouched",
  });
  const create = useMutation({
    mutationFn: (v: ReviewValues & { lotId: string }) => api.createReview(v),
    onSuccess: () => {
      toast.success("Review published", { description: "Thanks for helping other buyers." });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      form.reset({ title: "", comment: "" });
      onClose();
    },
    meta: { errorToast: "Couldn't publish your review" },
  });

  return (
    <Dialog open={lot !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {lot && (
          <form onSubmit={form.handleSubmit((v) => create.mutate({ ...v, lotId: lot.id }))} noValidate>
            <DialogHeader>
              <DialogTitle>Review {lot.seller.companyName}</DialogTitle>
              <DialogDescription>
                For &ldquo;{lot.title}&rdquo;. Your company name appears with the review.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-5">
              <Controller
                control={form.control}
                name="rating"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Overall rating</FieldLabel>
                    <StarInput
                      name="rating"
                      value={field.value}
                      onChange={field.onChange}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <TextField
                control={form.control}
                name="title"
                label="Title"
                placeholder="e.g. Exactly as described, easy pickup"
              />
              <TextareaField
                control={form.control}
                name="comment"
                label="Your review"
                rows={5}
                placeholder="How accurate was the listing? How did payment and pickup go?"
              />
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? <Spinner /> : <LuSend />} Publish review
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const columns: Column<Review>[] = [
  {
    key: "lot",
    header: "Lot",
    cell: (r) => (
      <div className="min-w-0 max-w-36 sm:max-w-56">
        <Link href={`/lots/${r.lotId}`} className="line-clamp-1 font-medium hover:text-primary hover:underline">
          {r.lot.title}
        </Link>
        <p className="truncate text-muted-foreground text-xs">{r.seller.companyName}</p>
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
        <p className="line-clamp-1 text-muted-foreground text-xs">{r.comment}</p>
      </div>
    ),
  },
  { key: "date", header: "Posted", hideBelow: "sm", cell: (r) => formatDate(r.createdAt) },
];

/** Buyer's review centre: lots waiting for a review, and every review they've written. */
export function BuyerReviews() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const reviewable = useQuery(reviewableLotsQuery());
  const mine = useQuery(
    myReviewsQuery({
      page,
      limit: PER_PAGE,
      rating: values.rating === "all" ? undefined : Number(values.rating),
      q: values.q || undefined,
    }),
  );
  const [writing, setWriting] = useState<ReviewableLot | null>(null);
  const filtered = values.rating !== "all" || values.q !== "";

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Waiting for your review</CardTitle>
          <CardDescription>Lots you won and paid for. Reviews help other buyers choose sellers.</CardDescription>
        </CardHeader>
        <CardContent>
          {reviewable.isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : !reviewable.data?.length ? (
            <EmptyState
              icon={LuTrophy}
              title="You're all caught up"
              description="When you pay for a lot you won, you can review the seller here."
              action={
                <Button variant="outline" asChild>
                  <Link href="/lots">Browse auctions</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {reviewable.data.map((lot) => (
                <li key={lot.id} className="flex gap-3 rounded-lg border p-3">
                  <LotImage src={lot.images[0]} alt="" sizes="80px" className="size-20 shrink-0 rounded-md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 font-medium text-sm leading-snug">{lot.title}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {lot.seller.companyName} · won for {formatMoney(lot.currentHighestBidAmountCents)}
                    </p>
                    <Button size="sm" className="mt-auto w-fit" onClick={() => setWriting(lot)}>
                      <LuPenLine /> Write a review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="my-reviews" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="my-reviews" className="font-semibold text-lg">
            Your reviews
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={values.q}
              onChange={(q) => set({ q })}
              placeholder="Search your reviews"
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
          rows={mine.data?.items}
          loading={mine.isPending}
          dimmed={mine.isPlaceholderData}
          getRowId={(r) => r.id}
          caption="Reviews you've written"
          empty={{
            icon: LuMessageSquareQuote,
            title: filtered ? "No reviews match" : "No reviews yet",
            description: filtered ? "Try a different rating or search." : "Reviews you publish appear here.",
          }}
        />
        {mine.data && (
          <PaginationBar
            page={page}
            totalPages={mine.data.meta.totalPages}
            total={mine.data.meta.total}
            onPage={setPage}
            label="reviews"
          />
        )}
      </section>

      <WriteReviewDialog lot={writing} onClose={() => setWriting(null)} />
    </div>
  );
}
