const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** 123456 → "$1,234.56" */
export function formatMoney(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "—";
  return usd.format(cents / 100);
}

/** "$1,234.56" / "1234.56" → 123456. Returns NaN for unparseable input. */
export function parseMoneyToCents(input: string) {
  const n = Number(input.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/**
 * The backend uses UUIDs; the design shows short human codes like LOT-04799.
 * Derived deterministically from the id so the same lot always shows the same code.
 */
export function shortCode(prefix: string, id: string) {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
export const lotCode = (id: string) => shortCode("LOT", id);

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
}

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "Sep 5, 14:00" */
export function formatDateTime(iso: string | null | undefined) {
  return iso ? dateTimeFmt.format(new Date(iso)) : "—";
}

/** "Sep 5, 2026" */
export function formatDate(iso: string | null | undefined) {
  return iso ? dateFmt.format(new Date(iso)) : "—";
}

/** Milliseconds → "2d 04h", "3h 12m", "04:59", "Closed". */
export function formatRemaining(ms: number) {
  if (ms <= 0) return "Closed";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${pad(m)}:${pad(sec)}`;
}

/** "3 min ago", "2 h ago", "Sep 5" */
export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return formatDate(iso);
}

/** Milliseconds → "41:00:00" (hours not wrapped into days). */
export function formatClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
