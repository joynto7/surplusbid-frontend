"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LuFilterX,
  LuGavel,
  LuLayoutGrid,
  LuList,
  LuSearch,
  LuSlidersHorizontal,
  LuSparkles,
  LuX,
} from "react-icons/lu";
import { LotCard } from "@/components/lots/lot-card";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { LOT_GRID, LotGridSkeleton } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { ToggleGroupLite } from "@/components/shared/toggle-group-lite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlState } from "@/hooks/use-url-state";
import { api } from "@/lib/api/client";
import { formatMoney, lotCode } from "@/lib/format";
import { categoriesQuery, lotsQuery } from "@/lib/queries";
import { BROWSE_STATUSES, LOT_BROWSE_DEFAULTS, LOT_CONDITIONS, LOT_SORTS, toLotQuery } from "@/lib/query-keys";
import { intentToParams, looksNatural } from "@/lib/search";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/stores/preferences-store";
import type { Lot } from "@/types/api";

const STATUS_LABEL: Record<(typeof BROWSE_STATUSES)[number], string> = {
  LIVE: "Live now",
  SOLD: "Sold",
  UNSOLD: "Unsold",
  ENDED: "Ended",
};

const PRICE_PRESETS = [
  { label: "Under $2,500", min: "", max: "2500" },
  { label: "$2,500–$10k", min: "2500", max: "10000" },
  { label: "$10k–$25k", min: "10000", max: "25000" },
  { label: "$25k and up", min: "25000", max: "" },
];

const BROWSE_KEYS = { ...LOT_BROWSE_DEFAULTS, ai: "" };
type BrowseValues = typeof BROWSE_KEYS;

const usd = (dollars: string) => `$${Number(dollars).toLocaleString("en-US")}`;

/**
 * The catalogue. Search, category, status, price range, location, condition,
 * sort and page all live in the URL, so any view is shareable. A sentence in
 * the search box ("forklift under 20k in texas") is read by the AI into filters.
 */
export function LotBrowser({ basePath = "/lots" }: { basePath?: string }) {
  const { values, page, set, setPage, isPending } = useUrlState(BROWSE_KEYS);
  const query = toLotQuery({ ...values, page: String(page) });
  const lots = useQuery(lotsQuery(query));
  const categories = useQuery(categoriesQuery());
  const mounted = useMounted();
  const view = usePreferences((s) => s.lotView);
  const setView = usePreferences((s) => s.setLotView);
  const effectiveView = mounted ? view : "grid";
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const chips: { key: keyof BrowseValues; label: string }[] = [];
  if (values.q) chips.push({ key: "q", label: `“${values.q}”` });
  if (values.categoryId) chips.push({ key: "categoryId", label: categoryName.get(values.categoryId) ?? "Category" });
  if (values.minPrice && values.maxPrice)
    chips.push({ key: "minPrice", label: `${usd(values.minPrice)}–${usd(values.maxPrice)}` });
  else if (values.minPrice) chips.push({ key: "minPrice", label: `From ${usd(values.minPrice)}` });
  else if (values.maxPrice) chips.push({ key: "maxPrice", label: `Up to ${usd(values.maxPrice)}` });
  if (values.location) chips.push({ key: "location", label: `Near ${values.location}` });
  if (values.condition) chips.push({ key: "condition", label: values.condition });
  if (values.status !== "LIVE")
    chips.push({ key: "status", label: STATUS_LABEL[values.status as keyof typeof STATUS_LABEL] ?? values.status });

  const clearAll = () =>
    set({
      q: "",
      categoryId: "",
      status: "LIVE",
      sort: "ending",
      minPrice: "",
      maxPrice: "",
      location: "",
      condition: "",
      ai: "",
    });
  const removeChip = (key: keyof BrowseValues) => {
    if (key === "minPrice" || key === "maxPrice") set({ minPrice: "", maxPrice: "", ai: "" });
    else set({ [key]: key === "status" ? "LIVE" : "", ai: "" });
  };
  const advancedCount = [values.minPrice || values.maxPrice, values.location, values.condition].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <CatalogSearch value={values.q} onKeyword={(q) => set({ q, ai: "" })} onIntent={(params) => set(params)} />
          <div className="flex flex-wrap gap-2">
            <Select
              value={values.categoryId || "all"}
              onValueChange={(v) => set({ categoryId: v === "all" ? "" : v, ai: "" })}
            >
              <SelectTrigger className="w-44" aria-label="Category">
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
            <Select value={values.status} onValueChange={(status) => set({ status, ai: "" })}>
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
              <SelectTrigger className="w-44" aria-label="Sort by">
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
            <Button variant="outline" onClick={() => setFiltersOpen(true)} aria-label="More filters">
              <LuSlidersHorizontal /> Filters
              {advancedCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 font-semibold text-primary-foreground text-xs">
                  {advancedCount}
                </span>
              )}
            </Button>
          </div>
          <div className="lg:ml-auto">
            <ToggleGroupLite
              label="Layout"
              value={effectiveView}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid view", icon: LuLayoutGrid },
                { value: "list", label: "List view", icon: LuList },
              ]}
            />
          </div>
        </div>

        {values.ai && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
            <LuSparkles className="size-4 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 flex-1">
              <span className="font-medium">AI search:</span> <span className="text-muted-foreground">{values.ai}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2.5 text-sm"
              >
                {c.label}
                <button
                  type="button"
                  onClick={() => removeChip(c.key)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label={`Remove filter ${c.label}`}
                >
                  <LuX className="size-3.5" />
                </button>
              </span>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <LuFilterX /> Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <p aria-live="polite">
          {lots.data ? (
            <>
              <span className="font-medium text-foreground">{lots.data.meta.total}</span>{" "}
              {lots.data.meta.total === 1 ? "lot" : "lots"} found
            </>
          ) : (
            "Loading lots…"
          )}
        </p>
        {(lots.isFetching || isPending) && <Spinner className="size-4" />}
      </div>

      <div
        aria-busy={lots.isFetching || isPending}
        className={cn("transition-opacity", (lots.isPlaceholderData || isPending) && "opacity-60")}
      >
        {lots.isPending ? (
          <LotGridSkeleton />
        ) : lots.isError ? (
          <EmptyState
            icon={LuGavel}
            title="Couldn't load auctions"
            description="The API didn't respond. Check your connection and retry."
            action={<Button onClick={() => lots.refetch()}>Retry</Button>}
          />
        ) : lots.data.items.length === 0 ? (
          <EmptyState
            icon={LuGavel}
            title={values.q ? `No lots match “${values.q}”` : "No lots match these filters"}
            description="Try a wider price range, another location or category, or clear your filters."
            action={
              chips.length ? (
                <Button variant="outline" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : effectiveView === "grid" ? (
          <div className={LOT_GRID}>
            {lots.data.items.map((lot, i) => (
              <LotCard key={lot.id} lot={lot} categoryName={categoryName.get(lot.categoryId)} priority={i < 4} />
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
          onPage={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          label="lots"
        />
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        values={values}
        onApply={(next) => {
          set({ ...next, ai: "" });
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}

/** Keyword search that applies as you type; a sentence waits for Enter and goes to the AI. */
function CatalogSearch({
  value,
  onKeyword,
  onIntent,
}: {
  value: string;
  onKeyword: (q: string) => void;
  onIntent: (params: Partial<Record<keyof BrowseValues, string>>) => void;
}) {
  const [text, setText] = useState(value);
  const [thinking, setThinking] = useState(false);
  const debounced = useDebounce(text, 400);
  const natural = looksNatural(text);

  useEffect(() => setText(value), [value]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: onKeyword and value change every render; only the debounced text should trigger a search
  useEffect(() => {
    if (!looksNatural(debounced) && debounced.trim() !== value) onKeyword(debounced.trim());
  }, [debounced]);

  const askAi = async () => {
    setThinking(true);
    try {
      const intent = await api.aiSearchIntent(text.trim());
      const params = Object.fromEntries(intentToParams(intent));
      onIntent({
        q: params.q ?? "",
        categoryId: params.categoryId ?? "",
        minPrice: params.minPrice ?? "",
        maxPrice: params.maxPrice ?? "",
        location: params.location ?? "",
        condition: params.condition ?? "",
        status: params.status ?? "LIVE",
        sort: params.sort ?? "ending",
        ai: intent.explanation,
      });
    } catch {
      onKeyword(text.trim());
    } finally {
      setThinking(false);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a <search> wrapper would break the flex layout; the role gives the same landmark
    <form
      role="search"
      className="relative min-w-0 flex-1 lg:max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        if (natural) void askAi();
        else onKeyword(text.trim());
      }}
    >
      <LuSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search, or describe it: “laptops under $10k in Texas”"
        aria-label="Search lots"
        className="h-9 pr-24 pl-9"
      />
      {natural && (
        <Button type="submit" size="xs" className="absolute top-1/2 right-1.5 -translate-y-1/2" disabled={thinking}>
          {thinking ? <Spinner /> : <LuSparkles />} AI search
        </Button>
      )}
    </form>
  );
}

function FiltersSheet({
  open,
  onOpenChange,
  values,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: BrowseValues;
  onApply: (next: Pick<BrowseValues, "minPrice" | "maxPrice" | "location" | "condition">) => void;
}) {
  const [draft, setDraft] = useState({
    minPrice: values.minPrice,
    maxPrice: values.maxPrice,
    location: values.location,
    condition: values.condition,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft({
        minPrice: values.minPrice,
        maxPrice: values.maxPrice,
        location: values.location,
        condition: values.condition,
      });
      setError(null);
    }
  }, [open, values.minPrice, values.maxPrice, values.location, values.condition]);

  const apply = () => {
    const min = draft.minPrice ? Number(draft.minPrice) : null;
    const max = draft.maxPrice ? Number(draft.maxPrice) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max <= 0))) {
      setError("Enter prices as whole dollar amounts.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError("The minimum price can't be higher than the maximum.");
      return;
    }
    onApply(draft);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the catalogue by price, location and condition.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 overflow-y-auto px-4">
          <fieldset className="space-y-3">
            <legend className="font-medium text-sm">Current price (USD)</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="min-price" className="text-muted-foreground text-xs">
                  Minimum
                </Label>
                <Input
                  id="min-price"
                  inputMode="numeric"
                  placeholder="0"
                  value={draft.minPrice}
                  aria-invalid={!!error}
                  onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-price" className="text-muted-foreground text-xs">
                  Maximum
                </Label>
                <Input
                  id="max-price"
                  inputMode="numeric"
                  placeholder="Any"
                  value={draft.maxPrice}
                  aria-invalid={!!error}
                  onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, minPrice: p.min, maxPrice: p.max }))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/40",
                    draft.minPrice === p.min && draft.maxPrice === p.max && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="location">Pickup location</Label>
            <Input
              id="location"
              placeholder="City or state code, e.g. Houston or TX"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="font-medium text-sm">Condition</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {["", "Used", ...LOT_CONDITIONS].map((c) => (
                <button
                  key={c || "any"}
                  type="button"
                  aria-pressed={draft.condition === c}
                  onClick={() => setDraft((d) => ({ ...d, condition: c }))}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary/40",
                    draft.condition === c && "border-primary bg-primary/10 font-medium text-primary",
                  )}
                >
                  {c === "" ? "Any condition" : c === "Used" ? "Used (any grade)" : c}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setDraft({ minPrice: "", maxPrice: "", location: "", condition: "" })}
          >
            Reset
          </Button>
          <Button className="flex-1" onClick={apply}>
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
            <TableHead className="hidden lg:table-cell">Location</TableHead>
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
              <TableCell className="hidden md:table-cell">
                {lot.category?.name ?? categoryName.get(lot.categoryId) ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">{lot.location || "—"}</TableCell>
              <TableCell>
                <StatusBadge status={lot.status} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(lot.currentPriceCents)}
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
