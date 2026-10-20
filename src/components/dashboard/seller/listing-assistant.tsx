"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { LuCheck, LuLightbulb, LuSparkles, LuWandSparkles } from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { LotDetailsValues, LotPricingValues } from "@/lib/validation";
import { useLotDraft } from "@/stores/lot-draft-store";
import type { ListingAssistInput, ListingDraft, PriceGuidance } from "@/types/api";

function assistInput(d: Partial<LotDetailsValues>): ListingAssistInput {
  return {
    title: d.title?.trim() ?? "",
    categoryId: d.categoryId || undefined,
    condition: d.condition?.trim() || undefined,
    quantity: d.quantity || undefined,
    location: d.location?.trim() || undefined,
    // Whatever the seller already typed is passed on as notes so the draft builds on it.
    notes: d.description?.trim() || undefined,
  };
}

/**
 * "Write with AI" on the details step: drafts the description and specs from
 * the title and notes, and stores price guidance from comparable sales for the
 * pricing step. Uses Claude when configured, otherwise the built-in writer.
 */
export function ListingAssistant({ form }: { form: UseFormReturn<LotDetailsValues> }) {
  const setPricingHint = useLotDraft((s) => s.setPricingHint);
  // The seller's own notes from the last run, so "Rewrite" doesn't feed the AI draft back in as notes.
  const lastRun = useRef<{ notes?: string; description: string } | null>(null);
  const assist = useMutation({
    mutationFn: (input: ListingAssistInput) => api.aiListingAssist(input),
    meta: { errorToast: "The listing assistant couldn't write a draft" },
  });

  const run = () => {
    const values = form.getValues();
    if (!values.title || values.title.trim().length < 3) {
      form.setError("title", { message: "Add a title first so the assistant knows what you're selling" });
      form.setFocus("title");
      return;
    }
    const typed = values.description?.trim();
    const notes =
      lastRun.current && typed === lastRun.current.description.trim() ? lastRun.current.notes : typed || undefined;
    assist.mutate(
      { ...assistInput(values), notes },
      {
        onSuccess: (draft) => {
          lastRun.current = { notes, description: draft.description };
          form.setValue("description", draft.description, { shouldDirty: true, shouldValidate: true });
          const current = form.getValues("specs") ?? [];
          if (draft.specs.length && current.every((s) => !s.label && !s.value)) {
            form.setValue("specs", draft.specs.slice(0, 12), { shouldDirty: true });
          }
          setPricingHint(draft.pricing);
          toast.success("Draft written", { description: "Review it and make it yours before continuing." });
        },
      },
    );
  };

  const draft: ListingDraft | undefined = assist.data;

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuSparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-sm">Listing assistant</p>
            <p className="text-muted-foreground text-sm">
              Enter a title (and any notes in the description), then let AI write a buyer-ready description and suggest
              a price from similar lots.
            </p>
          </div>
        </div>
        <Button type="button" onClick={run} disabled={assist.isPending}>
          {assist.isPending ? <Spinner /> : <LuWandSparkles />} {draft ? "Rewrite" : "Write with AI"}
        </Button>
      </div>
      {draft && (
        <div className="space-y-2 border-primary/15 border-t pt-3 text-sm" aria-live="polite">
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <LuCheck className="size-3.5 text-success" aria-hidden />
            Description {draft.specs.length ? "and specs " : ""}filled in below ·{" "}
            {draft.mode === "ai" ? "written by Claude" : "written by the built-in assistant"}
          </p>
          {draft.suggestedTitle && draft.suggestedTitle !== form.getValues("title") && (
            <p>
              Suggested title: <span className="font-medium">{draft.suggestedTitle}</span>{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() =>
                  form.setValue("title", draft.suggestedTitle, { shouldDirty: true, shouldValidate: true })
                }
              >
                Use it
              </button>
            </p>
          )}
          {draft.highlights.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {draft.highlights.map((h) => (
                <li key={h} className="rounded-full bg-background px-2.5 py-0.5 text-xs">
                  {h}
                </li>
              ))}
            </ul>
          )}
          {draft.pricing && (
            <p className="text-muted-foreground text-xs">
              Price guidance is ready on the pricing step: similar lots sold for a median of{" "}
              {formatMoney(draft.pricing.medianCents)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Suggested prices on the pricing step, from the assistant or fetched here on demand. */
export function PriceGuidanceCard({ form }: { form: UseFormReturn<LotPricingValues> }) {
  const { details, pricingHint, setPricingHint } = useLotDraft();
  const fetchHint = useMutation({
    mutationFn: () => api.aiListingAssist(assistInput(details)),
    onSuccess: (draft) => {
      setPricingHint(draft.pricing);
      if (!draft.pricing)
        toast.info("No comparable sales yet", { description: "Set a price based on your own costs." });
    },
    meta: { errorToast: "Couldn't load price guidance" },
  });

  const apply = (p: PriceGuidance) => {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    form.setValue("startingPrice", p.suggestedStartingPriceCents / 100, opts);
    form.setValue("reservePrice", p.suggestedReservePriceCents / 100, opts);
    form.setValue("bidIncrement", p.suggestedIncrementCents / 100, opts);
    toast.success("Suggested prices applied", { description: "Adjust them if you know your market better." });
  };

  if (!pricingHint) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4">
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          <LuLightbulb className="size-4 text-warning" aria-hidden /> Not sure what to charge? Get a suggestion from
          similar lots that sold.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fetchHint.mutate()}
          disabled={fetchHint.isPending || !details.title}
        >
          {fetchHint.isPending ? <Spinner /> : <LuSparkles />} Get price guidance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-medium text-sm">
            <LuSparkles className="size-4 text-primary" aria-hidden /> Price guidance
          </p>
          <p className="text-muted-foreground text-sm">{pricingHint.basis}</p>
        </div>
        <Button type="button" onClick={() => apply(pricingHint)}>
          <LuCheck /> Apply suggestion
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Start at", pricingHint.suggestedStartingPriceCents],
          ["Reserve", pricingHint.suggestedReservePriceCents],
          ["Increment", pricingHint.suggestedIncrementCents],
        ].map(([label, cents]) => (
          <div key={label} className="rounded-lg bg-background p-2">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(Number(cents))}</dd>
          </div>
        ))}
      </dl>
      {pricingHint.comparables.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {pricingHint.comparableCount} comparable sale{pricingHint.comparableCount === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1">
            {pricingHint.comparables.map((c) => (
              <li key={c.id} className="flex justify-between gap-3">
                <Link href={`/lots/${c.id}`} target="_blank" className="truncate hover:text-primary hover:underline">
                  {c.title}
                </Link>
                <span className="shrink-0 tabular-nums">{formatMoney(c.priceCents)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
