"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuArrowLeft, LuArrowRight, LuCheck, LuRocket, LuSave } from "react-icons/lu";
import { toast } from "sonner";
import { FileDropzone } from "@/components/forms/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import { api, uploadWithProgress } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { DEPOSIT_PERCENT, depositFor } from "@/lib/config";
import { addHours, localInputToIso, nextQuarterHour, toLocalInput } from "@/lib/datetime";
import { formatDateTime, formatMoney } from "@/lib/format";
import { categoriesQuery, qk } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  type LotDetailsValues,
  type LotPhotosValues,
  type LotPricingValues,
  lotDetailsSchema,
  lotPhotosSchema,
  lotPricingSchema,
  MAX_LOT_IMAGES,
} from "@/lib/validation";
import { useLotDraft } from "@/stores/lot-draft-store";
import { usePreferences } from "@/stores/preferences-store";
import type { Lot } from "@/types/api";
import { LotDetailsFields, LotPricingFields } from "./lot-fields";

const STEPS = [
  { title: "Details", description: "What you're selling" },
  { title: "Photos", description: `Up to ${MAX_LOT_IMAGES} images` },
  { title: "Pricing & schedule", description: "Prices and auction window" },
  { title: "Review", description: "Check and create" },
];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s.title} aria-current={i === step ? "step" : undefined} className="space-y-2">
          <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
          <div className="hidden sm:block">
            <p className={cn("font-medium text-sm", i === step ? "text-foreground" : "text-muted-foreground")}>
              {i < step && <LuCheck className="mr-1 inline size-3.5 text-primary" />}
              {s.title}
            </p>
            <p className="text-muted-foreground text-xs">{s.description}</p>
          </div>
        </li>
      ))}
      <li className="col-span-4 text-muted-foreground text-sm sm:hidden">
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </li>
    </ol>
  );
}

/**
 * Multi-step lot creation. Each step is its own React Hook Form + Zod schema;
 * completed steps are saved to a Zustand store persisted in sessionStorage,
 * so a refresh doesn't lose the draft. `relistFrom` prefills from a closed lot.
 */
export function LotWizard({ relistFrom }: { relistFrom?: Lot | null }) {
  const mounted = useMounted();
  const draft = useLotDraft();
  const sellerDefaults = usePreferences((s) => s.sellerDefaults);
  const [prefilled, setPrefilled] = useState(false);

  // Relisting: seed the store once with the old lot's values and a fresh schedule.
  useEffect(() => {
    if (!mounted || prefilled) return;
    setPrefilled(true);
    if (!relistFrom) return;
    const start = nextQuarterHour(addHours(new Date(), sellerDefaults.startDelayHours));
    draft.prefill(
      {
        title: relistFrom.title,
        categoryId: relistFrom.categoryId,
        condition: relistFrom.condition,
        quantity: relistFrom.quantity,
        description: relistFrom.description,
      },
      {
        startingPrice: relistFrom.startingPriceCents / 100,
        reservePrice: (relistFrom.reservePriceCents ?? relistFrom.startingPriceCents) / 100,
        bidIncrement: relistFrom.bidIncrementCents / 100,
        startTime: toLocalInput(start),
        endTime: toLocalInput(addHours(start, sellerDefaults.durationDays * 24)),
      },
    );
    toast.info("Prefilled from your previous lot", { description: "Add photos and check the new schedule." });
  }, [mounted, prefilled, relistFrom, draft, sellerDefaults]);

  if (!mounted || !prefilled) return <Card className="h-96 animate-pulse" />;

  return (
    <div className="space-y-6">
      <Stepper step={draft.step} />
      {draft.step === 0 && <DetailsStep />}
      {draft.step === 1 && <PhotosStep />}
      {draft.step === 2 && <PricingStep />}
      {draft.step === 3 && <ReviewStep />}
    </div>
  );
}

function StepCard({
  step,
  children,
  onSubmit,
  nextLabel = "Continue",
}: {
  step: number;
  children: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  nextLabel?: string;
}) {
  const setStep = useLotDraft((s) => s.setStep);
  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent className="py-6">{children}</CardContent>
        <CardFooter className="justify-between border-t">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <LuArrowLeft /> Back
          </Button>
          <Button type="submit">
            {nextLabel} <LuArrowRight />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function DetailsStep() {
  const { details, saveDetails, setStep } = useLotDraft();
  const defaults = usePreferences((s) => s.sellerDefaults);
  const form = useForm<LotDetailsValues>({
    resolver: zodResolver(lotDetailsSchema),
    defaultValues: { title: "", description: "", condition: defaults.condition, quantity: 1, ...details },
    mode: "onTouched",
  });
  return (
    <StepCard
      step={0}
      onSubmit={form.handleSubmit((v) => {
        saveDetails(v);
        setStep(1);
      })}
    >
      <LotDetailsFields control={form.control} />
    </StepCard>
  );
}

function PhotosStep() {
  const { images, setImages, setStep } = useLotDraft();
  const form = useForm<LotPhotosValues>({ resolver: zodResolver(lotPhotosSchema), defaultValues: { images } });
  return (
    <StepCard
      step={1}
      onSubmit={form.handleSubmit((v) => {
        setImages(v.images);
        setStep(2);
      })}
    >
      <Controller
        control={form.control}
        name="images"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Lot photos</FieldLabel>
            <FileDropzone
              files={field.value ?? []}
              onChange={(files) => {
                field.onChange(files);
                setImages(files);
              }}
              accept="image/jpeg,image/png,image/webp"
              multiple
              max={MAX_LOT_IMAGES}
              hint={`JPG, PNG or WebP · up to 5 MB each · max ${MAX_LOT_IMAGES}. The first photo is the cover.`}
              invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error, ...(Array.isArray(fieldState.error) ? fieldState.error : [])]} />
            <p className="text-muted-foreground text-xs">
              Photos can only be added now. They can&apos;t be changed after the lot is created.
            </p>
          </Field>
        )}
      />
    </StepCard>
  );
}

function PricingStep() {
  const { pricing, savePricing, setStep } = useLotDraft();
  const defaults = usePreferences((s) => s.sellerDefaults);
  const start = nextQuarterHour(addHours(new Date(), defaults.startDelayHours));
  const form = useForm<LotPricingValues>({
    resolver: zodResolver(lotPricingSchema),
    defaultValues: {
      bidIncrement: defaults.bidIncrement,
      startTime: toLocalInput(start),
      endTime: toLocalInput(addHours(start, defaults.durationDays * 24)),
      ...pricing,
    },
    mode: "onTouched",
  });
  return (
    <StepCard
      step={2}
      nextLabel="Review"
      onSubmit={form.handleSubmit((v) => {
        savePricing(v);
        setStep(3);
      })}
    >
      <LotPricingFields control={form.control} />
    </StepCard>
  );
}

function ReviewStep() {
  const router = useRouter();
  const qc = useQueryClient();
  const { details, pricing, images, setStep, reset } = useLotDraft();
  const categories = useQuery(categoriesQuery());
  const [progress, setProgress] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  const d = details as LotDetailsValues;
  const p = pricing as LotPricingValues;
  const ready = lotDetailsSchema.safeParse(d).success && lotPricingSchema.safeParse(p).success;

  const create = async (publish: boolean) => {
    const form = new FormData();
    const fields: Record<string, string | number> = {
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      condition: d.condition,
      quantity: d.quantity,
      startingPriceCents: Math.round(p.startingPrice * 100),
      reservePriceCents: Math.round(p.reservePrice * 100),
      bidIncrementCents: Math.round(p.bidIncrement * 100),
      startTime: localInputToIso(p.startTime),
      endTime: localInputToIso(p.endTime),
    };
    for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
    for (const img of images) form.append("images", img);

    setProgress(0);
    try {
      const lot = await uploadWithProgress<Lot>("/lots", form, setProgress);
      if (publish) {
        setPublishing(true);
        await api.publishLot(lot.id);
      }
      reset();
      qc.invalidateQueries({ queryKey: qk.myListings });
      toast.success(publish ? "Lot is live" : "Draft saved", {
        description: publish ? "Buyers can now bid on it." : "Publish it from your listings when you're ready.",
      });
      router.push(`/seller/lots/${lot.id}`);
    } catch (error) {
      setProgress(null);
      setPublishing(false);
      toast.error("Couldn't create the lot", { description: errorMessage(error) });
    }
  };

  const busy = progress !== null;
  const categoryName = categories.data?.find((c) => c.id === d.categoryId)?.name ?? "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review</CardTitle>
        <CardDescription>Check everything before creating the lot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!ready && (
          <p className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
            Some steps are incomplete. Go back and fill them in.
          </p>
        )}
        <section className="grid gap-4 md:grid-cols-2">
          <dl className="divide-y rounded-lg border text-sm">
            <ReviewRow label="Title" value={d.title} />
            <ReviewRow label="Category" value={categoryName} />
            <ReviewRow label="Condition" value={d.condition} />
            <ReviewRow label="Quantity" value={d.quantity} />
            <ReviewRow label="Photos" value={`${images.length} attached`} />
          </dl>
          <dl className="divide-y rounded-lg border text-sm">
            <ReviewRow label="Starting price" value={formatMoney(Math.round(p.startingPrice * 100))} />
            <ReviewRow label="Reserve (private)" value={formatMoney(Math.round(p.reservePrice * 100))} />
            <ReviewRow label="Increment" value={formatMoney(Math.round(p.bidIncrement * 100))} />
            <ReviewRow label="Opens" value={p.startTime ? formatDateTime(localInputToIso(p.startTime)) : "—"} />
            <ReviewRow label="Closes" value={p.endTime ? formatDateTime(localInputToIso(p.endTime)) : "—"} />
          </dl>
        </section>
        <p className="text-muted-foreground text-sm">
          Bidders will authorize a {formatMoney(depositFor(Math.round((p.startingPrice ?? 0) * 100)))} deposit hold (
          {DEPOSIT_PERCENT}% of the starting price).
        </p>
        {images.length === 0 && (
          <p className="rounded-md bg-warning/10 p-3 text-sm text-warning">
            No photos attached. Lots with photos get far more bids.
          </p>
        )}
        {busy && (
          <div className="space-y-1.5" aria-live="polite">
            <div className="flex justify-between text-sm">
              <span>{publishing ? "Publishing…" : progress < 100 ? "Uploading photos…" : "Creating lot…"}</span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} aria-label="Upload progress" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2 border-t">
        <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={busy}>
          <LuArrowLeft /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => create(false)} disabled={!ready || busy}>
            {busy && !publishing ? <Spinner /> : <LuSave />} Save as draft
          </Button>
          <Button onClick={() => create(true)} disabled={!ready || busy}>
            {publishing ? <Spinner /> : <LuRocket />} Create & publish
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 p-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
