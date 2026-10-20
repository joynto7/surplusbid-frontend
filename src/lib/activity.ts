/**
 * Browsing signals kept in this browser only: an anonymous viewer id (so a
 * page view counts once) and the lots recently opened. They feed the AI
 * recommendations and the personalized hero; nothing here identifies a person.
 */

const VIEWER_KEY = "surplusbid.viewer";
const RECENT_KEY = "surplusbid.recent";
const MAX_RECENT = 20;

interface RecentView {
  id: string;
  categoryId: string;
  at: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: signals are a nicety, never required */
  }
}

export function viewerId(): string {
  let id = read<string | null>(VIEWER_KEY, null);
  if (!id) {
    id = crypto.randomUUID();
    write(VIEWER_KEY, id);
  }
  return id;
}

export function rememberLotView(lot: { id: string; categoryId: string }) {
  const recent = read<RecentView[]>(RECENT_KEY, []).filter((r) => r.id !== lot.id);
  write(RECENT_KEY, [{ id: lot.id, categoryId: lot.categoryId, at: Date.now() }, ...recent].slice(0, MAX_RECENT));
  window.dispatchEvent(new Event("surplusbid:activity"));
}

export function recentLotIds(limit = MAX_RECENT): string[] {
  return read<RecentView[]>(RECENT_KEY, [])
    .slice(0, limit)
    .map((r) => r.id);
}

/** The category this browser looks at most, weighting recent views higher. */
export function favoriteCategoryId(): string | null {
  const recent = read<RecentView[]>(RECENT_KEY, []);
  if (recent.length < 2) return null;
  const scores = new Map<string, number>();
  for (const [i, r] of recent.entries()) scores.set(r.categoryId, (scores.get(r.categoryId) ?? 0) + 1 / (1 + i * 0.25));
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
