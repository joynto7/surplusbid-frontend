"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

type Value = string | number | null | undefined;

/**
 * Filters, sorting, search and pagination live in the URL so views can be
 * bookmarked and shared. `set` merges updates into the current query string
 * and resets `page` whenever anything other than the page changes.
 */
export function useUrlState<K extends string>(defaults: Record<K, string>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = useCallback((key: K) => searchParams.get(key) ?? defaults[key], [defaults, searchParams]);

  const set = useCallback(
    (updates: Partial<Record<K | "page", Value>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates) as [K, Value][]) {
        const isDefault = value === undefined || value === null || value === "" || String(value) === defaults[key];
        if (isDefault) next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [defaults, pathname, router, searchParams],
  );

  const values = Object.fromEntries(Object.keys(defaults).map((k) => [k, get(k as K)])) as Record<K, string>;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  return {
    values,
    page,
    set,
    setPage: (p: number) => set({ page: p } as Partial<Record<K | "page", Value>>),
    isPending,
  };
}
