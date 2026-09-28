"use client";

import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/queries";
import type { Lot } from "@/types/api";

/**
 * Fetches several lots by id in parallel, sharing cache entries with the lot
 * detail page. The backend has no batch endpoint, so this fans out one
 * request per unique id (deduplicated and cached by TanStack Query).
 */
export function useLotsByIds(ids: string[]) {
  const unique = [...new Set(ids)];
  return useQueries({
    queries: unique.map((id) => ({
      queryKey: qk.lot(id),
      queryFn: () => api.lot(id),
      staleTime: 60_000,
      meta: { errorToast: false as const },
    })),
    combine: (results) => {
      const byId = new Map<string, Lot>();
      results.forEach((r, i) => {
        if (r.data) byId.set(unique[i], r.data);
      });
      return { byId, isPending: results.some((r) => r.isPending), missing: results.filter((r) => r.isError).length };
    },
  });
}
