/** Pure helpers that turn API lists into chart series. */

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });

/** Buckets items into the last `days` calendar days (oldest first), zero-filled. */
export function perDay<T>(
  items: T[],
  getDate: (item: T) => string,
  days = 14,
  getValue: (item: T) => number = () => 1,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { key: d.getTime(), label: dayFmt.format(d), value: 0 };
  });
  const start = buckets[0].key;
  for (const item of items) {
    const d = new Date(getDate(item));
    d.setHours(0, 0, 0, 0);
    const idx = Math.round((d.getTime() - start) / 86_400_000);
    if (idx >= 0 && idx < days) buckets[idx].value += getValue(item);
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

/** Buckets items into the last `months` calendar months, zero-filled. */
export function perMonth<T>(
  items: T[],
  getDate: (item: T) => string,
  months = 6,
  getValue: (item: T) => number = () => 1,
) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return { y: d.getFullYear(), m: d.getMonth(), label: monthFmt.format(d), value: 0 };
  });
  for (const item of items) {
    const d = new Date(getDate(item));
    const b = buckets.find((x) => x.y === d.getFullYear() && x.m === d.getMonth());
    if (b) b.value += getValue(item);
  }
  return buckets.map(({ label, value }) => ({ label, value }));
}

export function countBy<T, K extends string>(items: T[], getKey: (item: T) => K) {
  const out = {} as Record<K, number>;
  for (const item of items) {
    const k = getKey(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Compact currency for chart axes: 123456 cents → "$1.2k". */
export const axisMoney = (cents: number) => {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (Math.abs(dollars) >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return `$${Math.round(dollars)}`;
};
