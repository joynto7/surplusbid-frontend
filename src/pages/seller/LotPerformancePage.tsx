import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { ApiError, api, type BidHistoryItem, type Lot } from '../../lib/api';
import { currentPrice, isOpen } from '../../lib/buyer';
import { formatClock, formatDate, formatDateTime, formatMoney, formatRemaining, isUuid, lotCode, shortCode } from '../../lib/format';
import { loadAllBids, proceeds, reserveMet } from '../../lib/seller';
import NotFoundPage from '../system/NotFoundPage';
import '../buyer/buyer.css';
import './seller.css';

const POLL_MS = 10_000;
const HOUR = 3600 * 1000;

function shortMoney(cents: number) {
  const d = cents / 100;
  if (d >= 100_000) return `$${Math.round(d / 1000)}k`;
  return d >= 1000 ? `$${(d / 1000).toFixed(1).replace(/\.0$/, '')}k` : `$${Math.round(d)}`;
}

function BidChart({ lot, bids, now }: { lot: Lot; bids: BidHistoryItem[]; now: number }) {
  const W = 640;
  const H = 220;
  const L = 52;
  const R = 628;
  const T = 12;
  const B = 188;
  const chrono = [...bids].reverse();
  const firstBid = chrono.length ? new Date(chrono[0].createdAt).getTime() : Infinity;
  const lastBid = chrono.length ? new Date(chrono[chrono.length - 1].createdAt).getTime() : -Infinity;
  const t0 = Math.min(new Date(lot.startTime).getTime(), firstBid);
  const t1 = Math.max(Math.min(now, new Date(lot.endTime).getTime()), lastBid, t0 + HOUR);
  const values = [lot.startingPriceCents, ...chrono.map((b) => b.amountCents), ...(lot.reservePriceCents !== undefined ? [lot.reservePriceCents] : [])];
  const lo = Math.min(...values) * 0.95;
  const hi = Math.max(...values) * 1.05;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (R - L);
  const y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
  const pts = [[x(t0), y(lot.startingPriceCents)], ...chrono.map((b) => [x(new Date(b.createdAt).getTime()), y(b.amountCents)])];
  const crossing = lot.reservePriceCents !== undefined ? chrono.find((b) => b.amountCents >= lot.reservePriceCents!) : undefined;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);
  const last = pts[pts.length - 1];
  const closed = now >= new Date(lot.endTime).getTime();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={`Bid history: ${bids.length} bids from ${formatMoney(lot.startingPriceCents)} opening to ${formatMoney(currentPrice(lot))}${crossing ? `, crossing the reserve on ${formatDate(crossing.createdAt)}` : ''}`}
    >
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={L} y1={y(v)} x2={R} y2={y(v)} stroke={i === 0 ? '#CBD5E1' : '#E2E8F0'} strokeWidth={i === 0 ? 1.5 : 1} />
          <text x={L - 8} y={y(v) + 4} textAnchor="end">
            {shortMoney(v)}
          </text>
        </g>
      ))}
      {lot.reservePriceCents !== undefined && (
        <>
          <line x1={L} y1={y(lot.reservePriceCents)} x2={R} y2={y(lot.reservePriceCents)} stroke="#16A34A" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={R - 4} y={y(lot.reservePriceCents) - 6} textAnchor="end" className="reserve">
            Reserve {formatMoney(lot.reservePriceCents).replace(/\.00$/, '')}
          </text>
        </>
      )}
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2563EB" strokeWidth="2" />
      {crossing && <circle cx={x(new Date(crossing.createdAt).getTime())} cy={y(crossing.amountCents)} r="4" fill="#16A34A" />}
      <circle cx={last[0]} cy={last[1]} r="4.5" fill="#2563EB" />
      <text x={L} y={H - 8}>
        {formatDate(lot.startTime).replace(/, \d{4}$/, '')}
      </text>
      {crossing && (
        <text x={x(new Date(crossing.createdAt).getTime())} y={H - 8} textAnchor="middle" style={{ fill: '#15803D' }}>
          {formatDate(crossing.createdAt).replace(/, \d{4}$/, '')} · reserve met
        </text>
      )}
      <text x={R} y={H - 8} textAnchor="end">
        {closed ? 'Close' : 'Now'}
      </text>
    </svg>
  );
}

function logTime(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString('en-US', { hour12: false })
    : `${d.toLocaleString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;
}

export default function LotPerformancePage() {
  const { id = '' } = useParams();
  const now = useNow();
  const [lot, setLot] = useState<Lot>();
  const [bids, setBids] = useState<BidHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<unknown>();

  const load = useCallback(async () => {
    try {
      const [l, b] = await Promise.all([api.lot(id), loadAllBids(id)]);
      setLot(l);
      setBids(b.items);
      setTotal(b.total);
      setError(undefined);
    } catch (err) {
      setError(err);
    }
  }, [id]);

  useEffect(() => {
    if (isUuid(id)) load();
  }, [id, load]);

  const open = lot ? isOpen(lot, now) : false;
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [open, load]);

  if (!isUuid(id) || (error instanceof ApiError && error.status === 404)) return <NotFoundPage />;
  if (lot?.status === 'DRAFT') return <Navigate to={`/seller/lots/${id}/edit`} replace />;

  if (!lot) {
    return (
      <AppShell>
        <div className="page">{error ? <ErrorBox error={error} onRetry={load} /> : <span className="muted">Loading lot…</span>}</div>
      </AppShell>
    );
  }

  const left = new Date(lot.endTime).getTime() - now;
  const met = reserveMet(lot);
  const reserve = lot.reservePriceCents;
  const vsReserve =
    reserve && lot.currentHighestBidAmountCents !== null ? Math.round(((lot.currentHighestBidAmountCents - reserve) / reserve) * 100) : null;
  const crossingId = reserve !== undefined ? [...bids].reverse().find((b) => b.amountCents >= reserve)?.id : undefined;
  const lastHour = bids.filter((b) => now - new Date(b.createdAt).getTime() < HOUR).length;
  const lastDay = bids.filter((b) => now - new Date(b.createdAt).getTime() < 24 * HOUR).length;
  const jumps = bids.slice(0, -1).map((b, i) => b.amountCents - bids[i + 1].amountCents);
  const avgJump = jumps.length ? Math.round(jumps.reduce((a, j) => a + j, 0) / jumps.length) : null;
  const maxJump = jumps.length ? Math.max(...jumps) : null;
  const p = proceeds(lot, currentPrice(lot));
  const statusPill =
    lot.status === 'LIVE' ? (open ? <Pill tone="warn">Live</Pill> : <Pill tone="warn">Closing</Pill>) : lot.status === 'SOLD' ? <Pill tone="ok">Sold</Pill> : lot.status === 'UNSOLD' ? <Pill tone="bad">No sale</Pill> : <Pill>{lot.status}</Pill>;

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1080 }}>
        <Link to="/seller/listings" className="back-link">
          ← Back to inventory
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginTop: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <span className="mono muted" style={{ fontSize: 12, fontWeight: 600 }}>
                {lotCode(lot.id)}
              </span>
              {statusPill}
              {reserve !== undefined && (met ? <Pill tone="ok">Reserve met</Pill> : <Pill>Reserve not met</Pill>)}
            </div>
            <h1 className="page-title" style={{ marginTop: 8 }}>
              {lot.title}
            </h1>
            <p className="page-lede" style={{ fontSize: 13.5, marginTop: 5 }}>
              {lot.condition} · opened {formatDateTime(lot.startTime)} · {left > 0 ? 'closes' : 'closed'} {formatDateTime(lot.endTime)}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
            <Link to={`/lots/${lot.id}`} className="btn btn-secondary btn-md">
              View as buyer
            </Link>
            {lot.status === 'UNSOLD' && (
              <Link to={`/seller/lots/new?from=${lot.id}`} className="btn btn-primary btn-md">
                Relist
              </Link>
            )}
          </div>
        </div>

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <div className="label">{lot.currentHighestBidAmountCents === null ? 'Starting bid' : lot.status === 'SOLD' ? 'Hammer price' : 'Current bid'}</div>
            <div className="value" style={{ fontSize: 24 }}>
              {formatMoney(currentPrice(lot))}
            </div>
            <div className={`note ${vsReserve !== null && vsReserve >= 0 ? 'ok' : ''}`}>
              {vsReserve === null ? 'No bids yet' : vsReserve >= 0 ? `${vsReserve}% over reserve` : `${-vsReserve}% below reserve`}
            </div>
          </div>
          <div className="stat">
            <div className="label">Bids</div>
            <div className="value" style={{ fontSize: 24 }}>
              {total}
            </div>
            <div className="note">{lastDay} in the last 24 hours</div>
          </div>
          <div className="stat">
            <div className="label">Reserve</div>
            <div className="value" style={{ fontSize: 24 }}>
              {formatMoney(reserve)}
            </div>
            <div className="note">Hidden from buyers</div>
          </div>
          <div className="stat" style={left > 0 ? { borderColor: 'var(--warn-line)' } : undefined}>
            <div className="label">{left > 0 ? 'Closes in' : 'Closed'}</div>
            <div className="value" style={{ fontSize: 24, color: left > 0 ? 'var(--warn-deep)' : undefined }}>
              {left > 0 ? (left < 24 * HOUR ? formatClock(left) : formatRemaining(left)) : formatDate(lot.endTime)}
            </div>
            <div className="note" style={left > 0 ? { color: 'var(--warn-deep)' } : undefined}>
              {left > 0 ? 'Anti-sniping is on' : lot.status === 'SOLD' ? 'Awaiting buyer payment' : 'Auction ended'}
            </div>
          </div>
        </div>

        <div className="perf-grid">
          <div className="stack">
            <div className="card card-flush">
              <div className="card-head" style={{ flexWrap: 'wrap' }}>
                <span className="card-title">Bid history</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {formatDate(lot.startTime).replace(/, \d{4}$/, '')} → {left > 0 ? 'now' : 'close'} · reserve marked
                </span>
              </div>
              <div className="chart-wrap">
                {bids.length === 0 ? (
                  <div className="card-empty" style={{ padding: '40px 0', textAlign: 'center' }}>
                    No bids yet. The chart fills in as bids arrive.
                  </div>
                ) : (
                  <BidChart lot={lot} bids={bids} now={now} />
                )}
              </div>
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Bid log</span>
                {total > bids.length && <span className="muted" style={{ fontSize: 12 }}>Latest {bids.length} of {total}</span>}
              </div>
              {bids.length === 0 ? (
                <div className="card-empty">Bids will be listed here, newest first.</div>
              ) : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Bid</th>
                        <th className="num">Amount</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.id}>
                          <td className="mono muted" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                            {logTime(b.createdAt)}
                          </td>
                          <td className="mono" style={{ fontSize: 12 }}>
                            {shortCode('BID', b.id)}
                          </td>
                          <td className="num" style={{ fontWeight: b.status === 'WINNING' ? 600 : 400 }}>
                            {formatMoney(b.amountCents)}
                          </td>
                          <td style={{ color: 'var(--body)' }}>
                            {b.status === 'WINNING' ? (lot.status === 'SOLD' ? 'Winning bid' : 'Current high bid') : b.id === crossingId ? 'Reserve met' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <aside className="aside-stack">
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.01em' }}>Bid pace</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {[
                  { label: 'Bids in the last hour', value: String(lastHour), pct: total ? (lastHour / total) * 100 : 0 },
                  { label: 'Bids in the last 24 hours', value: String(lastDay), pct: total ? (lastDay / total) * 100 : 0 },
                  { label: 'Average raise', value: avgJump === null ? '—' : formatMoney(avgJump), pct: avgJump && maxJump ? (avgJump / maxJump) * 100 : 0 },
                  { label: 'Largest raise', value: maxJump === null ? '—' : formatMoney(maxJump), pct: maxJump ? 100 : 0 },
                ].map((a) => (
                  <div key={a.label}>
                    <div className="kv" style={{ fontSize: 12.5 }}>
                      <span>{a.label}</span>
                      <span style={{ fontWeight: 600 }}>{a.value}</span>
                    </div>
                    <div className="meter">
                      <span style={{ width: `${Math.min(100, a.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card aside-card rule">
              <div className="t">{lot.status === 'SOLD' ? 'Sale proceeds' : 'Projected sale'}</div>
              <div className="mini-kv">
                <span>
                  <span>{lot.status === 'SOLD' ? 'Hammer price' : 'At current bid'}</span>
                  <span>{formatMoney(p.hammer)}</span>
                </span>
                <span>
                  <span>Buyer deposit (held)</span>
                  <span>{formatMoney(p.deposit)}</span>
                </span>
                <span className="sum">
                  <span>Balance the buyer pays</span>
                  <span>{formatMoney(p.balance)}</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
