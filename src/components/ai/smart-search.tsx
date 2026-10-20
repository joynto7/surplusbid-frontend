"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { LuArrowRight, LuSearch, LuSparkles, LuTrendingUp, LuX } from "react-icons/lu";
import { CategoryIcon } from "@/components/shared/category-icon";
import { LotImage } from "@/components/shared/lot-image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { qk } from "@/lib/query-keys";
import { intentToParams, looksNatural } from "@/lib/search";
import { cn } from "@/lib/utils";

type Option =
  | { kind: "lot"; id: string; href: string }
  | { kind: "category"; id: string; href: string }
  | { kind: "search"; id: string; text: string }
  | { kind: "intent"; id: string };

/**
 * AI-powered search. As you type it suggests matching lots (typo-tolerant),
 * categories and searches, and previews how a sentence will be read as
 * filters. Enter on a sentence asks the AI to turn it into catalogue filters.
 */
export function SmartSearch({
  variant = "hero",
  autoFocus = false,
  onNavigate,
  placeholder = "Try “forklift under $20k in California”",
}: {
  variant?: "hero" | "dialog" | "page";
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(autoFocus);
  const [active, setActive] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const debounced = useDebounce(query.trim(), 220);

  const suggestions = useQuery({
    queryKey: qk.suggest(debounced),
    queryFn: () => api.aiSuggest(debounced),
    enabled: focused,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    meta: { errorToast: false },
  });
  const data = suggestions.data;
  const open = focused && !!data;

  const options: Option[] = [];
  if (data?.interpretation) options.push({ kind: "intent", id: "intent" });
  for (const l of data?.lots ?? []) options.push({ kind: "lot", id: l.id, href: `/lots/${l.id}` });
  for (const c of data?.categories ?? [])
    options.push({ kind: "category", id: c.id, href: `/lots?categoryId=${c.id}` });
  for (const s of data?.searches ?? []) options.push({ kind: "search", id: s, text: s });

  const go = (href: string) => {
    setFocused(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = async (text = query) => {
    const q = text.trim();
    if (!q) return go("/lots");
    if (!looksNatural(q)) return go(`/lots?q=${encodeURIComponent(q)}`);
    setSubmitting(true);
    try {
      const intent = await api.aiSearchIntent(q);
      go(`/lots?${intentToParams(intent).toString()}`);
    } catch {
      go(`/lots?q=${encodeURIComponent(q)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const choose = (o: Option) => {
    if (o.kind === "lot" || o.kind === "category") go(o.href);
    else if (o.kind === "search") {
      setQuery(o.text);
      void submit(o.text);
    } else if (o.kind === "intent" && data?.interpretation)
      go(`/lots?${intentToParams(data.interpretation).toString()}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = options[active];
      if (active >= 0 && chosen) choose(chosen);
      else void submit();
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const optionProps = (o: Option) => {
    const index = options.findIndex((x) => x.kind === o.kind && x.id === o.id);
    return {
      id: `${listId}-${index}`,
      role: "option" as const,
      "aria-selected": index === active,
      onMouseEnter: () => setActive(index),
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onClick: () => choose(o),
      className: cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm",
        index === active ? "bg-muted" : "hover:bg-muted/60",
      ),
    };
  };

  const big = variant === "hero";

  return (
    <div className={cn("relative w-full", variant === "dialog" && "p-1")}>
      {/* biome-ignore lint/a11y/useSemanticElements: a <search> wrapper would break the dropdown positioning; the role gives the same landmark */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-background/95 shadow-sm transition-shadow focus-within:ring-[3px] focus-within:ring-ring/40",
          big ? "h-14 pr-1.5 pl-4" : "h-11 pr-1 pl-3",
        )}
      >
        <LuSearch className={cn("shrink-0 text-muted-foreground", big ? "size-5" : "size-4")} aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={onKeyDown}
          // biome-ignore lint/a11y/noAutofocus: the search dialog opens to type straight away
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Search auctions"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground",
            big ? "text-base" : "text-sm",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <LuX className="size-4" />
          </button>
        )}
        <Button type="submit" size={big ? "lg" : "sm"} className={cn(big && "h-11 px-5")} disabled={submitting}>
          {submitting ? <Spinner /> : looksNatural(query) ? <LuSparkles /> : <LuSearch />}
          <span className={cn(variant === "dialog" && "sr-only")}>{looksNatural(query) ? "AI search" : "Search"}</span>
        </Button>
      </form>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            "z-50 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl",
            variant === "dialog" ? "relative" : "absolute inset-x-0 top-full",
          )}
        >
          {data.correctedQuery && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery(data.correctedQuery ?? "")}
              className="mb-1 w-full rounded-lg px-2.5 py-2 text-left text-muted-foreground text-sm hover:bg-muted"
            >
              Showing results for <span className="font-medium text-foreground">{data.correctedQuery}</span>
            </button>
          )}

          {data.interpretation && (
            <div {...optionProps({ kind: "intent", id: "intent" })}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LuSparkles className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-muted-foreground text-xs">AI reads this as</span>
                <span className="block truncate font-medium">{data.interpretation.explanation}</span>
              </span>
              <LuArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          )}

          {data.lots.length > 0 && (
            <p className="px-2.5 pt-2 pb-1 font-medium text-muted-foreground text-xs">
              {query.trim() ? "Lots" : "Trending now"}
            </p>
          )}
          {data.lots.map((l) => (
            <div key={l.id} {...optionProps({ kind: "lot", id: l.id, href: `/lots/${l.id}` })}>
              <LotImage src={l.images[0]} alt="" className="size-10 shrink-0 rounded-md" sizes="40px" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{l.title}</span>
                <span className="block truncate text-muted-foreground text-xs">
                  {l.category.name} · {l.status === "LIVE" ? "Live" : l.status.toLowerCase()}
                  {l.reason ? ` · ${l.reason}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-sm tabular-nums">{formatMoney(l.currentPriceCents)}</span>
            </div>
          ))}

          {data.categories.length > 0 && (
            <p className="px-2.5 pt-2 pb-1 font-medium text-muted-foreground text-xs">Categories</p>
          )}
          {data.categories.map((c) => (
            <div key={c.id} {...optionProps({ kind: "category", id: c.id, href: `/lots?categoryId=${c.id}` })}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <CategoryIcon slug={c.slug} className="size-4" />
              </span>
              <span className="flex-1 font-medium">{c.name}</span>
              {typeof c.liveLotCount === "number" && (
                <span className="text-muted-foreground text-xs">{c.liveLotCount} live</span>
              )}
            </div>
          ))}

          {data.searches.length > 0 && (
            <p className="px-2.5 pt-2 pb-1 font-medium text-muted-foreground text-xs">
              {query.trim() ? "Searches" : "Try searching for"}
            </p>
          )}
          {data.searches.map((s) => (
            <div key={s} {...optionProps({ kind: "search", id: s, text: s })}>
              <LuTrendingUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">{s}</span>
            </div>
          ))}

          {!data.lots.length && !data.categories.length && !data.searches.length && !data.interpretation && (
            <p className="px-2.5 py-4 text-center text-muted-foreground text-sm">
              No matches yet. Press Enter to search the whole catalogue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
