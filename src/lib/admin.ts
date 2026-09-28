import { ApiError, api, type AdminUser, type AuditLog, type Dispute, type Lot, type Role, type VerificationStatus } from './api';
import { shortCode } from './format';

export const accountCode = (id: string) => shortCode('ACCT', id);
export const caseCode = (id: string) => shortCode('CASE', id);

/**
 * True when the route itself doesn't exist (Express's default HTML 404), as
 * opposed to a JSON "Dispute not found". Used for endpoints the backend
 * hasn't added yet (see api.adminDisputes).
 */
export function isMissingEndpoint(err: unknown) {
  return err instanceof ApiError && err.status === 404 && err.message.startsWith('Request failed with status');
}

export const ROLE_LABEL: Record<Role, string> = { BUYER: 'Buyer', SELLER: 'Seller', ADMIN: 'Operator' };
export const STATUS_LABEL: Record<VerificationStatus, string> = {
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  UNVERIFIED: 'Not submitted',
};
export const STATUS_TONE: Record<VerificationStatus, 'ok' | 'warn' | 'bad' | ''> = {
  VERIFIED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad',
  UNVERIFIED: '',
};

const total = (p: Promise<{ meta: { total: number } }>) => p.then((r) => r.meta.total);

/** Open disputes, or null when the backend has no list endpoint yet. */
export async function loadOpenDisputes(): Promise<Dispute[] | null> {
  try {
    const [open, review] = await Promise.all([
      api.adminDisputes({ status: 'OPEN', limit: 50 }),
      api.adminDisputes({ status: 'UNDER_REVIEW', limit: 50 }),
    ]);
    return [...open.items, ...review.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch (err) {
    if (isMissingEndpoint(err)) return null;
    throw err;
  }
}

/** Oldest first, which is the order the queue should be worked in. */
export async function loadPendingUsers() {
  const res = await api.adminUsers({ verificationStatus: 'PENDING', limit: 50 });
  return { users: [...res.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), total: res.meta.total };
}

const DAY = 24 * 3600 * 1000;

export async function loadOverview() {
  const [stats, pending, verified, rejected, buyers, sellers, sold, unsold, categories, disputes] = await Promise.all([
    api.adminStats(),
    loadPendingUsers(),
    total(api.adminUsers({ verificationStatus: 'VERIFIED', limit: 1 })),
    total(api.adminUsers({ verificationStatus: 'REJECTED', limit: 1 })),
    total(api.adminUsers({ role: 'BUYER', limit: 1 })),
    total(api.adminUsers({ role: 'SELLER', limit: 1 })),
    api.browseLots({ status: 'SOLD', sortBy: 'endTime', sortOrder: 'desc', limit: 50 }),
    total(api.browseLots({ status: 'UNSOLD', limit: 1 })),
    api.categories(),
    loadOpenDisputes(),
  ]);
  const closingSoon = await api.browseLots({ status: 'LIVE', sortBy: 'endTime', sortOrder: 'asc', limit: 50 });
  return { stats, pending, verified, rejected, buyers, sellers, sold, unsold, categories, disputes, closingSoon: closingSoon.items };
}

/** Hammer value of sold lots per week, oldest first (last `weeks` weeks). */
export function weeklyHammer(lots: Lot[], weeks = 8, now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(monday.getTime() - (weeks - 1 - i) * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const cents = lots
      .filter((l) => {
        const t = new Date(l.endTime).getTime();
        return t >= start.getTime() && t < end.getTime();
      })
      .reduce((s, l) => s + (l.currentHighestBidAmountCents ?? 0), 0);
    return { start, cents };
  });
}

/** The backend has no GET /admin/users/:id, so page through the list. */
export async function findUser(id: string): Promise<AdminUser | undefined> {
  for (let page = 1; page <= 20; page++) {
    const res = await api.adminUsers({ page, limit: 50 });
    const hit = res.items.find((u) => u.id === id);
    if (hit || page >= res.meta.totalPages) return hit;
  }
  return undefined;
}

/** Audit entries about one entity (the API only filters by type). */
export async function auditFor(entityType: string, entityId: string, maxPages = 5) {
  const out: AuditLog[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await api.adminAuditLogs({ page, limit: 50, entityType });
    out.push(...res.items.filter((l) => l.entityId === entityId));
    if (page >= res.meta.totalPages) break;
  }
  return out;
}

const ACTION_TONE: Record<string, string> = {
  VERIFY_USER: '#16A34A',
  RESOLVE_DISPUTE: '#2563EB',
  LOT_SOLD: '#16A34A',
  LOT_UNSOLD: '#64748B',
  LOT_ROLLED_OVER: '#D97706',
  PAYMENT_DEADLINE_FORFEITED: '#DC2626',
};

/** A log row in the Standard file's "terminal" style: time, tag, key=value message. */
export function auditLine(log: AuditLog) {
  const meta = Object.entries(log.metadata ?? {})
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' ');
  const entity = log.entityType === 'Lot' ? shortCode('LOT', log.entityId) : log.entityType === 'User' ? accountCode(log.entityId) : log.entityType === 'Dispute' ? caseCode(log.entityId) : `${log.entityType.toLowerCase()}=${log.entityId.slice(0, 8)}`;
  let tone = ACTION_TONE[log.action] ?? '#94A3B8';
  if (log.action === 'VERIFY_USER' && log.metadata?.verificationStatus === 'REJECTED') tone = '#D97706';
  if (log.action === 'RESOLVE_DISPUTE' && log.metadata?.status === 'REJECTED') tone = '#D97706';
  return {
    tag: log.action.replace(/_/g, '.').slice(0, 16).padEnd(16, ' '),
    msg: `${entity}${meta ? ' ' + meta : ''}${log.actorId ? ` operator=${accountCode(log.actorId)}` : ' by=system'}`,
    tone,
  };
}
