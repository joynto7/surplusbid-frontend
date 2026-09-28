import { useCallback, useEffect, useState } from 'react';
import { ApiError, api, type Lot, type MyBid, type Payment } from './api';
import { createStore } from './store';
import { formatMoney, formatRemaining, isUuid, lotCode, shortCode } from './format';

/**
 * Mirrors surplusbid-backend's DEPOSIT_PERCENT / PAYMENT_DEADLINE_HOURS (defaults 10 / 48).
 * The API doesn't expose either, so keep these in sync with the backend's env.
 */
export const DEPOSIT_PERCENT = Number(import.meta.env.VITE_DEPOSIT_PERCENT ?? 10);
export const PAYMENT_DEADLINE_HOURS = Number(import.meta.env.VITE_PAYMENT_DEADLINE_HOURS ?? 48);

/** Deposit hold the backend authorizes before the first bid on a lot. */
export const depositFor = (lot: Pick<Lot, 'startingPriceCents'>) =>
  Math.round(lot.startingPriceCents * (DEPOSIT_PERCENT / 100));

export const currentPrice = (lot: Pick<Lot, 'currentHighestBidAmountCents' | 'startingPriceCents'>) =>
  lot.currentHighestBidAmountCents ?? lot.startingPriceCents;

/** Smallest bid the backend will accept right now. */
export const nextMinimum = (lot: Lot) => currentPrice(lot) + lot.bidIncrementCents;

export const isOpen = (lot: Lot, now = Date.now()) => lot.status === 'LIVE' && new Date(lot.endTime).getTime() > now;

export const orderCode = (payment: Payment) => shortCode('ORD', payment.id);
export const invoiceCode = (payment: Payment) => shortCode('INV', payment.id);

// ── Lot cache ──
// Bids and payments only carry a lotId, so most buyer screens fan out to
// GET /lots/:id. Cache those per page load so the dashboard, my-bids and
// notifications don't refetch the same lot.
const lotCache = new Map<string, Promise<Lot>>();

export function getLot(id: string, fresh = false) {
  if (fresh || !lotCache.has(id)) {
    const p = api.lot(id);
    lotCache.set(id, p);
    p.catch(() => lotCache.delete(id));
  }
  return lotCache.get(id)!;
}

export function primeLot(lot: Lot) {
  lotCache.set(lot.id, Promise.resolve(lot));
}

async function getLots(ids: string[]) {
  const results = await Promise.allSettled(ids.map((id) => getLot(id)));
  const map = new Map<string, Lot>();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(ids[i], r.value);
  });
  return map;
}

// ── Browser-only state ──
// The backend has no watchlist, hold lookup or notification-read endpoints.
const watchStore = createStore<string[]>('surplusbid.watchlist', []);
const holdStore = createStore<string[]>('surplusbid.holds', []);
const readStore = createStore<Record<string, true>>('surplusbid.notifications.read', {});
const prefStore = createStore<Record<NotificationKind, boolean>>('surplusbid.notifications.prefs', {
  outbid: true,
  closing: true,
  won: true,
  payment: true,
  deposit: true,
  dispute: true,
});

export function useWatchlist() {
  const ids = watchStore.useValue();
  const toggle = useCallback((lotId: string) => {
    const cur = watchStore.read();
    watchStore.write(cur.includes(lotId) ? cur.filter((id) => id !== lotId) : [lotId, ...cur]);
  }, []);
  return { ids, has: (lotId: string) => ids.includes(lotId), toggle };
}

/** Lots this browser has authorized a deposit hold on. */
export const holds = {
  has: (lotId: string) => holdStore.read().includes(lotId),
  add: (lotId: string) => {
    if (!holdStore.read().includes(lotId)) holdStore.write([...holdStore.read(), lotId]);
  },
};

// ── Buyer activity: bids + payments rolled up per lot ──
export type BidState = 'WINNING' | 'OUTBID' | 'WON' | 'LOST';

export interface ActivityRow {
  lot: Lot;
  /** Buyer's highest bid on this lot. */
  myBidCents: number;
  myBidCount: number;
  lastBidAt: string;
  state: BidState;
  payment?: Payment;
}

export interface BuyerActivity {
  rows: ActivityRow[];
  payments: Payment[];
  lots: Map<string, Lot>;
}

function rollUp(bids: MyBid[], payments: Payment[], lots: Map<string, Lot>): ActivityRow[] {
  const byLot = new Map<string, MyBid[]>();
  for (const bid of bids) {
    const list = byLot.get(bid.lotId) ?? [];
    list.push(bid);
    byLot.set(bid.lotId, list);
  }
  const paymentByLot = new Map(payments.map((p) => [p.lotId, p]));
  const rows: ActivityRow[] = [];
  for (const [lotId, list] of byLot) {
    const lot = lots.get(lotId);
    if (!lot) continue;
    const top = list.reduce((a, b) => (b.amountCents > a.amountCents ? b : a));
    const payment = paymentByLot.get(lotId);
    const leading = top.status === 'WINNING';
    let state: BidState;
    if (isOpen(lot)) state = leading ? 'WINNING' : 'OUTBID';
    else state = payment || (leading && lot.status === 'SOLD') ? 'WON' : 'LOST';
    rows.push({
      lot,
      myBidCents: top.amountCents,
      myBidCount: list.length,
      lastBidAt: list.reduce((a, b) => (b.createdAt > a ? b.createdAt : a), list[0].createdAt),
      state,
      payment,
    });
  }
  return rows.sort((a, b) => new Date(a.lot.endTime).getTime() - new Date(b.lot.endTime).getTime());
}

export async function loadBuyerActivity(): Promise<BuyerActivity> {
  const [bids, payments] = await Promise.all([api.myBids(1, 50), api.myPayments(1, 50)]);
  const ids = [...new Set([...bids.items.map((b) => b.lotId), ...payments.items.map((p) => p.lotId)])];
  const lots = await getLots(ids);
  return { rows: rollUp(bids.items, payments.items, lots), payments: payments.items, lots };
}

export async function loadWatchedLots(ids: string[]) {
  const lots = await getLots(ids);
  return ids.map((id) => lots.get(id)).filter((l): l is Lot => Boolean(l));
}

/** Dashboard / my-bids summary numbers. */
export function summarize(activity: BuyerActivity, now = Date.now()) {
  const active = activity.rows.filter((r) => r.state === 'WINNING' || r.state === 'OUTBID');
  const due = activity.payments.filter((p) => p.status === 'PENDING' || p.status === 'FAILED');
  const soonest = due.reduce<Payment | undefined>((a, p) => (!a || p.dueAt < a.dueAt ? p : a), undefined);
  return {
    active,
    winning: active.filter((r) => r.state === 'WINNING'),
    won: activity.rows.filter((r) => r.state === 'WON'),
    lost: activity.rows.filter((r) => r.state === 'LOST'),
    // A hold is authorized per lot bid on; it's released when the lot closes to someone else.
    depositsHeldCents: active.reduce((sum, r) => sum + depositFor(r.lot), 0),
    exposureCents: active.reduce((sum, r) => sum + r.myBidCents, 0),
    closingToday: active.filter((r) => new Date(r.lot.endTime).getTime() - now < 24 * 3600 * 1000),
    balanceDueCents: due.reduce((sum, p) => sum + p.amountCents, 0),
    due,
    soonestDue: soonest,
  };
}

// ── Notifications, derived from real bid/payment/lot state ──
export type NotificationKind = 'outbid' | 'closing' | 'won' | 'payment' | 'deposit' | 'dispute';

export interface BuyerNotification {
  id: string;
  kind: NotificationKind;
  tag: string;
  tone: 'ok' | 'bad' | 'warn' | 'info';
  group: 'bids' | 'pay';
  title: string;
  body: string;
  at: string;
  action: string;
  href: string;
}

export const NOTIFICATION_PREFS: { kind: NotificationKind; label: string; note: string; locked?: boolean }[] = [
  { kind: 'outbid', label: 'Outbid on a lot', note: 'Shown as soon as someone outbids you. Cannot be disabled.', locked: true },
  { kind: 'closing', label: 'Auction ending soon', note: 'Within 24 hours of close on lots you bid on.' },
  { kind: 'won', label: 'You won a lot', note: 'With the balance due and the payment deadline.' },
  { kind: 'payment', label: 'Payment reminders', note: 'While a balance is unpaid or a charge failed. Cannot be disabled.', locked: true },
  { kind: 'deposit', label: 'Deposit released', note: 'When a lot closes to another bidder and your hold is let go.' },
];

export function deriveNotifications(activity: BuyerActivity, now = Date.now()): BuyerNotification[] {
  const out: BuyerNotification[] = [];
  const paymentsByLot = new Map(activity.payments.map((p) => [p.lotId, p]));

  for (const row of activity.rows) {
    const { lot } = row;
    const code = lotCode(lot.id);
    const left = new Date(lot.endTime).getTime() - now;

    if (row.state === 'OUTBID') {
      out.push({
        id: `outbid:${lot.id}:${lot.currentHighestBidAmountCents}`,
        kind: 'outbid',
        tag: 'Outbid',
        tone: 'bad',
        group: 'bids',
        title: `You were outbid on ${code}`,
        body: `${lot.title} is now at ${formatMoney(lot.currentHighestBidAmountCents)}, above your ${formatMoney(row.myBidCents)} bid. The next valid bid is ${formatMoney(nextMinimum(lot))}, and it closes in ${formatRemaining(left)}.`,
        at: row.lastBidAt,
        action: 'Bid again',
        href: `/lots/${lot.id}`,
      });
    }
    if (row.state === 'WINNING' && left < 24 * 3600 * 1000) {
      out.push({
        id: `closing:${lot.id}`,
        kind: 'closing',
        tag: 'Closing',
        tone: 'warn',
        group: 'bids',
        title: `${code} closes in ${formatRemaining(left)}`,
        body: `You're the high bidder at ${formatMoney(row.myBidCents)} on ${lot.title}. A bid in the last two minutes extends the close by two minutes.`,
        at: new Date(Math.max(new Date(row.lastBidAt).getTime(), new Date(lot.endTime).getTime() - 24 * 3600 * 1000)).toISOString(),
        action: 'View lot',
        href: `/lots/${lot.id}`,
      });
    }
    if (row.state === 'WON') {
      const payment = paymentsByLot.get(lot.id);
      out.push({
        id: `won:${lot.id}`,
        kind: 'won',
        tag: 'Won',
        tone: 'ok',
        group: 'pay',
        title: `You won ${code}`,
        body: payment
          ? `${lot.title} at ${formatMoney(lot.currentHighestBidAmountCents)}. ${formatMoney(payment.amountCents)} is due after your deposit is applied.`
          : `${lot.title} at ${formatMoney(lot.currentHighestBidAmountCents)}. Your invoice will appear here shortly.`,
        at: lot.endTime,
        action: payment && payment.status !== 'SUCCEEDED' ? 'Pay balance' : 'View',
        href: payment ? (payment.status === 'SUCCEEDED' ? `/buyer/invoices/${payment.id}` : `/buyer/checkout/${payment.id}`) : '/buyer/bids',
      });
    }
    if (row.state === 'LOST') {
      out.push({
        id: `deposit:${lot.id}`,
        kind: 'deposit',
        tag: 'Deposit',
        tone: 'info',
        group: 'pay',
        title: `Deposit released on ${code}`,
        body: `${formatMoney(depositFor(lot))} was released after ${lot.title} closed to another bidder.`,
        at: lot.endTime,
        action: 'View',
        href: `/lots/${lot.id}`,
      });
    }
  }

  for (const p of activity.payments) {
    if (p.status !== 'PENDING' && p.status !== 'FAILED') continue;
    const lot = activity.lots.get(p.lotId);
    const failed = p.status === 'FAILED';
    out.push({
      id: `payment:${p.id}:${p.status}`,
      kind: 'payment',
      tag: 'Payment',
      tone: failed ? 'bad' : 'warn',
      group: 'pay',
      title: failed ? `Payment failed on ${orderCode(p)}` : `Payment due on ${orderCode(p)}`,
      body: `${formatMoney(p.amountCents)} for ${lot ? lot.title : lotCode(p.lotId)}. The lot forfeits if payment isn't received in ${formatRemaining(new Date(p.dueAt).getTime() - now)}.`,
      at: p.createdAt,
      action: failed ? 'Fix payment' : 'Pay now',
      href: `/buyer/checkout/${p.id}`,
    });
  }

  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function useNotificationState() {
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
    setPrefs: (value: Record<NotificationKind, boolean>) => prefStore.write(value),
    enabled: (kind: NotificationKind) =>
      NOTIFICATION_PREFS.find((p) => p.kind === kind)?.locked ? true : prefs[kind] !== false,
  };
}

/**
 * Shared buyer activity for the shell's unread badge and the pages. Refetches
 * on mount; pages that mutate (bid, pay) call `reload`.
 */
export function useBuyerActivity(enabled = true) {
  const [activity, setActivity] = useState<BuyerActivity>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setActivity(await loadBuyerActivity());
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

  return { activity, error, loading, reload };
}

/** A payment plus the lot it's for; used by checkout, result and invoice pages. */
export async function loadPaymentWithLot(paymentId: string) {
  if (!isUuid(paymentId)) throw new ApiError(404, 'Payment not found');
  const payment = await api.payment(paymentId);
  const lot = await getLot(payment.lotId);
  const hammerCents = lot.currentHighestBidAmountCents ?? payment.amountCents;
  // The backend stores only the balance; the deposit is whatever the hammer price exceeds it by.
  return { payment, lot, hammerCents, depositCents: Math.max(0, hammerCents - payment.amountCents) };
}
