import type { SearchIntent } from "@/types/api";

/**
 * True when a query reads like a sentence ("forklift under 15k in texas")
 * rather than a product name, so it's worth asking the AI to read it.
 * Mirrors looksNatural() in the backend.
 */
export function looksNatural(query: string) {
  const q = query.toLowerCase();
  return (
    q.split(/\s+/).length >= 3 &&
    /\b(under|below|over|above|between|near|in|cheap|cheapest|ending|closing|newest|less than|more than|around|for parts|like new|refurbished|used|sold)\b|\$|\d+k\b/.test(
      q,
    )
  );
}

/** A parsed search → the catalogue's URL filters (prices in whole dollars). */
export function intentToParams(intent: SearchIntent) {
  const params = new URLSearchParams();
  if (intent.q) params.set("q", intent.q);
  if (intent.categoryId) params.set("categoryId", intent.categoryId);
  if (intent.minPriceCents !== undefined) params.set("minPrice", String(Math.round(intent.minPriceCents / 100)));
  if (intent.maxPriceCents !== undefined) params.set("maxPrice", String(Math.round(intent.maxPriceCents / 100)));
  if (intent.location) params.set("location", intent.location);
  if (intent.condition) params.set("condition", intent.condition);
  if (intent.status && intent.status !== "LIVE") params.set("status", intent.status);
  if (intent.sort) params.set("sort", intent.sort);
  if (intent.explanation) params.set("ai", intent.explanation);
  return params;
}
