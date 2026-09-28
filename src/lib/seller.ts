import { useCallback, useEffect, useState } from 'react';
import { api, type BidHistoryItem, type Lot, type LotInput } from './api';
import { currentPrice, depositFor, isOpen } from './buyer';
import { formatMoney, formatRemaining, lotCode } from './format';
import { createStore } from './store';

export interface SellerLot {
  /** Full lot from GET /lots/:id — includes reservePriceCents since we own it. */
  lot: Lot;
  /** Newest-first, at most the latest 50. */
  bids: BidHistoryItem[];
  bidCount: number;
}

export const reserveMet = (lot: Lot) =>
  lot.reservePriceCents !== undefined && lot.currentHighestBidAmountCents !== null && lot.currentHighestBidAmountCents >= lot.reservePriceCents;

/** Human label for a lot's status, matching the inventory log's pills. */
export function statusLabel(lot: Lot, now = Date.now()) {
  if (lot.status === 'LIVE') return isOpen(lot, now) ? 'LIVE' : 'CLOSING';
  if (lot.status === 'UNSOLD') return 'NO SALE';
  return lot.status;
}

/** What a buyer would owe at a given hammer price, and how it's paid. */
export function proceeds(lot: Pick<Lot, 'startingPriceCents'>, hammerCents: number) {
  const deposit = Math.min(depositFor(lot), hammerCents);
  return { hammer: hammerCents, deposit, balance: hammerCents - deposit };
}

export async function loadSellerLot(id: string): Promise<SellerLot> {
  const [lot, history] = await Promise.all([api.lot(id), api.bidHistory(id, 1, 50)]);
  return { lot, bids: history.items, bidCount: history.meta.total };
}

/** Every bid on a lot, newest first (pages through the 50-per-page limit). */
export async function loadAllBids(id: string, maxPages = 10) {
  const first = await api.bidHistory(id, 1, 50);
  const items = [...first.items];
  for (let page = 2; page <= Math.min(first.meta.totalPages, maxPages); page++) {
    items.push(...(await api.bidHistory(id, page, 50)).items);
  }
  return { items, total: first.meta.total };
}

export async function loadInventory(): Promise<SellerLot[]> {
  const listings = await api.myListings();
  const results = await Promise.allSettled(listings.map((l) => loadSellerLot(l.id)));
  return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
}

export function useSellerInventory(enabled = true) {
  const [inventory, setInventory] = useState<SellerLot[]>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setInventory(await loadInventory());
      setError(undefined);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [reload, enabled]);

  return { inventory, error, loading, reload };
}

const DAY = 24 * 3600 * 1000;
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export function summarizeInventory(inv: SellerLot[], now = Date.now()) {
  const lots = inv.map((s) => s.lot);
  const live = inv.filter((s) => s.lot.status === 'LIVE');
  const drafts = inv.filter((s) => s.lot.status === 'DRAFT');
  const sold = inv.filter((s) => s.lot.status === 'SOLD');
  const unsold = inv.filter((s) => s.lot.status === 'UNSOLD');
  const today = new Date(now);

  const soldThisMonth = sold.filter((s) => monthKey(new Date(s.lot.endTime)) === monthKey(today));
  const recent = lots.filter((l) => (l.status === 'SOLD' || l.status === 'UNSOLD') && now - new Date(l.endTime).getTime() < 90 * DAY);
  const sellThrough = recent.length ? recent.filter((l) => l.status === 'SOLD').length / recent.length : null;

  const months = Array.from({ length: 6 }, (_, i) => new Date(today.getFullYear(), today.getMonth() - 5 + i, 1));
  const bars = months.map((m) => ({
    label: m.toLocaleString('en-US', { month: 'short' }),
    cents: sold
      .filter((s) => monthKey(new Date(s.lot.endTime)) === monthKey(m))
      .reduce((sum, s) => sum + (s.lot.currentHighestBidAmountCents ?? 0), 0),
  }));

  return {
    live,
    drafts,
    sold,
    unsold,
    endingSoon: [...live].filter((s) => isOpen(s.lot, now)).sort((a, b) => a.lot.endTime.localeCompare(b.lot.endTime)),
    withinHour: live.filter((s) => isOpen(s.lot, now) && new Date(s.lot.endTime).getTime() - now < 3600 * 1000),
    salesThisMonthCents: soldThisMonth.reduce((sum, s) => sum + (s.lot.currentHighestBidAmountCents ?? 0), 0),
    soldThisMonth,
    sellThrough,
    bars,
  };
}

// ── Notifications, derived from the seller's lots and bids ──
export type SellerNotificationKind = 'bid' | 'reserve' | 'closing' | 'sold' | 'unsold';

export interface SellerNotification {
  id: string;
  kind: SellerNotificationKind;
  tag: string;
  tone: 'ok' | 'bad' | 'warn' | 'info' | '';
  group: 'bid' | 'sale';
  title: string;
  body: string;
  at: string;
  action: string;
  href: string;
}

export const SELLER_NOTIFICATION_PREFS: { kind: SellerNotificationKind; label: string; note: string; locked?: boolean }[] = [
  { kind: 'bid', label: 'New bid on your lot', note: 'The latest bid on each live lot.' },
  { kind: 'reserve', label: 'Reserve met', note: 'The first time a lot crosses its reserve.' },
  { kind: 'closing', label: 'Lot closing soon', note: 'Within 24 hours of close.' },
  { kind: 'sold', label: 'Lot sold', note: 'At close, with the hammer price. Cannot be disabled.', locked: true },
  { kind: 'unsold', label: 'Closed without a sale', note: 'When a lot closes with no bids.' },
];

export function deriveSellerNotifications(inv: SellerLot[], now = Date.now()): SellerNotification[] {
  const out: SellerNotification[] = [];
  for (const { lot, bids, bidCount } of inv) {
    const code = lotCode(lot.id);
    const href = `/seller/lots/${lot.id}`;
    const latest = bids[0];

    if (latest && lot.status === 'LIVE') {
      out.push({
        id: `bid:${latest.id}`,
        kind: 'bid',
        tag: bidCount === 1 ? 'First bid' : 'New bid',
        tone: 'info',
        group: 'bid',
        title: `${bidCount === 1 ? 'First bid' : 'New bid'} on ${code}`,
        body: `${formatMoney(latest.amountCents)} on ${lot.title}.${lot.reservePriceCents !== undefined ? (reserveMet(lot) ? ' Reserve met.' : ` Still below your ${formatMoney(lot.reservePriceCents)} reserve.`) : ''} ${bidCount} bid${bidCount === 1 ? '' : 's'} so far, closing in ${formatRemaining(new Date(lot.endTime).getTime() - now)}.`,
        at: latest.createdAt,
        action: 'View lot',
        href,
      });
    }

    if (lot.reservePriceCents !== undefined) {
      const crossing = [...bids].reverse().find((b) => b.amountCents >= lot.reservePriceCents!);
      if (crossing) {
        out.push({
          id: `reserve:${lot.id}`,
          kind: 'reserve',
          tag: 'Reserve',
          tone: 'ok',
          group: 'bid',
          title: `${code} met its reserve`,
          body: `A ${formatMoney(crossing.amountCents)} bid on ${lot.title} crossed your ${formatMoney(lot.reservePriceCents)} reserve.`,
          at: crossing.createdAt,
          action: 'View lot',
          href,
        });
      }
    }

    const left = new Date(lot.endTime).getTime() - now;
    if (lot.status === 'LIVE' && left > 0 && left < DAY) {
      out.push({
        id: `closing:${lot.id}`,
        kind: 'closing',
        tag: 'Closing',
        tone: 'warn',
        group: 'bid',
        title: `${code} closes in ${formatRemaining(left)}`,
        body: `${lot.title} is at ${formatMoney(currentPrice(lot))}${reserveMet(lot) ? ' with reserve met' : ''}. A bid in the final two minutes extends the close by two minutes.`,
        at: new Date(new Date(lot.endTime).getTime() - DAY).toISOString(),
        action: 'View lot',
        href,
      });
    }

    if (lot.status === 'SOLD') {
      const p = proceeds(lot, lot.currentHighestBidAmountCents ?? 0);
      out.push({
        id: `sold:${lot.id}`,
        kind: 'sold',
        tag: 'Sold',
        tone: 'ok',
        group: 'sale',
        title: `${code} sold for ${formatMoney(p.hammer)}`,
        body: `${lot.title}. The buyer's ${formatMoney(p.deposit)} deposit is applied and ${formatMoney(p.balance)} is due from them.`,
        at: lot.endTime,
        action: 'View sale',
        href,
      });
    }

    if (lot.status === 'UNSOLD') {
      out.push({
        id: `unsold:${lot.id}`,
        kind: 'unsold',
        tag: 'No sale',
        tone: '',
        group: 'sale',
        title: `${code} closed without a sale`,
        body: `${lot.title} received no bids. List it again with a lower starting price.`,
        at: lot.endTime,
        action: 'Relist',
        href: `/seller/lots/new?from=${lot.id}`,
      });
    }
  }
  return out.filter((n) => new Date(n.at).getTime() <= now).sort((a, b) => (a.at < b.at ? 1 : -1));
}

const readStore = createStore<Record<string, true>>('surplusbid.seller.notifications.read', {});
const prefStore = createStore<Partial<Record<SellerNotificationKind, boolean>>>('surplusbid.seller.notifications.prefs', {});

export function useSellerNotificationState() {
  const read = readStore.useValue();
  const prefs = prefStore.useValue();
  return {
    isRead: (id: string) => Boolean(read[id]),
    setRead: (id: string, value: boolean) => {
      const next = { ...readStore.read() };
      if (value) next[id] = true;
      else delete next[id];
      readStore.write(next);
    },
    markAll: (ids: string[]) => {
      const next = { ...readStore.read() };
      ids.forEach((id) => (next[id] = true));
      readStore.write(next);
    },
    prefs,
    setPrefs: (value: Partial<Record<SellerNotificationKind, boolean>>) => prefStore.write(value),
    enabled: (kind: SellerNotificationKind) =>
      SELLER_NOTIFICATION_PREFS.find((p) => p.kind === kind)?.locked ? true : prefs[kind] !== false,
  };
}

// ── Lot form (shared by the creation wizard and the draft editor) ──
export interface LotFormValues {
  title: string;
  categoryId: string;
  condition: string;
  quantity: string;
  description: string;
  startingPrice: string; // dollars
  reservePrice: string; // dollars
  bidIncrement: string; // dollars
  startTime: string; // datetime-local
  endTime: string; // datetime-local
}

export const CONDITIONS = ['Inspected — runs under power', 'Used — good', 'As-is — untested', 'For parts'];
export const INCREMENTS = ['100', '250', '500'];

const pad = (n: number) => String(n).padStart(2, '0');
/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
export function toLocalInput(iso: string | Date) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyLotForm(now = new Date()): LotFormValues {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 7 * DAY);
  end.setHours(14, 0, 0, 0);
  return {
    title: '',
    categoryId: '',
    condition: CONDITIONS[0],
    quantity: '1',
    description: '',
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '250',
    startTime: toLocalInput(start),
    endTime: toLocalInput(end),
  };
}

const dollarsOf = (cents: number) => String(cents / 100);

export function lotToForm(lot: Lot): LotFormValues {
  return {
    title: lot.title,
    categoryId: lot.categoryId,
    condition: lot.condition,
    quantity: String(lot.quantity),
    description: lot.description,
    startingPrice: dollarsOf(lot.startingPriceCents),
    reservePrice: lot.reservePriceCents !== undefined ? dollarsOf(lot.reservePriceCents) : '',
    bidIncrement: dollarsOf(lot.bidIncrementCents),
    startTime: toLocalInput(lot.startTime),
    endTime: toLocalInput(lot.endTime),
  };
}

const cents = (dollars: string) => {
  const n = Number(dollars.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && dollars.trim() !== '' ? Math.round(n * 100) : NaN;
};

export type LotFormSection = 'details' | 'pricing' | 'schedule';
export type LotFormErrors = Partial<Record<keyof LotFormValues, string>>;

/** Mirrors the backend's zod schema (lots.validation.ts) plus a few sanity checks. */
export function validateLotForm(v: LotFormValues, now = Date.now()) {
  const e: LotFormErrors = {};
  if (v.title.trim().length < 3) e.title = 'Give the lot a title of at least 3 characters.';
  if (!v.categoryId) e.categoryId = 'Choose a category.';
  if (v.condition.trim().length < 2) e.condition = 'Describe the condition.';
  const qty = Number(v.quantity);
  if (!Number.isInteger(qty) || qty < 1) e.quantity = 'Quantity must be a whole number, 1 or more.';
  if (v.description.trim().length < 10) e.description = 'Write a condition report of at least 10 characters.';

  const start = cents(v.startingPrice);
  const reserve = cents(v.reservePrice);
  const inc = cents(v.bidIncrement);
  if (!(start > 0)) e.startingPrice = 'Enter a starting price above $0.';
  if (!(reserve > 0)) e.reservePrice = 'Enter a reserve above $0.';
  else if (start > 0 && reserve < start) e.reservePrice = 'The reserve can’t be below the starting price.';
  if (!(inc > 0)) e.bidIncrement = 'Enter a bid increment above $0.';

  const s = new Date(v.startTime).getTime();
  const en = new Date(v.endTime).getTime();
  if (!v.startTime || Number.isNaN(s)) e.startTime = 'Choose when bidding opens.';
  if (!v.endTime || Number.isNaN(en)) e.endTime = 'Choose when bidding closes.';
  else if (!Number.isNaN(s) && en <= s) e.endTime = 'The close must be after the open.';
  else if (en <= now) e.endTime = 'The close must be in the future.';

  const section = (keys: (keyof LotFormValues)[]) => keys.every((k) => !e[k]);
  return {
    errors: e,
    ok: Object.keys(e).length === 0,
    sections: {
      details: section(['title', 'categoryId', 'condition', 'quantity', 'description']),
      pricing: section(['startingPrice', 'reservePrice', 'bidIncrement']),
      schedule: section(['startTime', 'endTime']),
    } satisfies Record<LotFormSection, boolean>,
  };
}

export function formToInput(v: LotFormValues): LotInput {
  return {
    title: v.title.trim(),
    categoryId: v.categoryId,
    condition: v.condition.trim(),
    quantity: Number(v.quantity),
    description: v.description.trim(),
    startingPriceCents: cents(v.startingPrice),
    reservePriceCents: cents(v.reservePrice),
    bidIncrementCents: cents(v.bidIncrement),
    startTime: new Date(v.startTime).toISOString(),
    endTime: new Date(v.endTime).toISOString(),
  };
}

export const MAX_PHOTOS = 5;
