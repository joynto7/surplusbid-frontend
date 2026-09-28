import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { accountCode, caseCode, loadOverview, weeklyHammer } from '../../lib/admin';
import { formatMoney, formatRelative, lotCode } from '../../lib/format';
import '../buyer/buyer.css';
import './admin.css';

const DAY = 24 * 3600 * 1000;

function compact(cents: number) {
  const d = cents / 100;
  if (d >= 1e6) return `$${(d / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (d >= 1e3) return `$${Math.round(d / 1e3)}k`;
  return `$${Math.round(d)}`;
}

function WeeklyChart({ weeks }: { weeks: { start: Date; cents: number }[] }) {
  const L = 56;
  const R = 628;
  const T = 16;
  const B = 142;
  const max = Math.max(1, ...weeks.map((w) => w.cents));
  const slot = (R - L) / weeks.length;
  const bw = slot * 0.72;
  const shades = ['#BFDBFE', '#BFDBFE', '#BFDBFE', '#BFDBFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#2563EB'];
  const last = weeks[weeks.length - 1];
  const label = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return (
    <svg className="chart-svg" viewBox="0 0 640 176" width="100%" height="176" role="img" aria-label={`Hammer value of sold lots by week: ${weeks.map((w) => `${label(w.start)} ${compact(w.cents)}`).join(', ')}`}>
      {[0, 1 / 3, 2 / 3, 1].map((f, i) => {
        const y = B - (B - T) * f;
        return (
          <g key={i}>
            <line x1={L} y1={y} x2={R} y2={y} stroke={i === 0 ? '#CBD5E1' : '#E2E8F0'} strokeWidth={i === 0 ? 1.5 : 1} />
            <text x={L - 8} y={y + 4} textAnchor="end">
              {compact(max * f)}
            </text>
          </g>
        );
      })}
      {weeks.map((w, i) => {
        const h = ((B - T) * w.cents) / max;
        const x = L + slot * i + (slot - bw) / 2;
        return (
          <g key={i}>
            <rect x={x} y={B - h} width={bw} height={Math.max(h, w.cents ? 1 : 0)} fill={shades[Math.max(0, shades.length - weeks.length + i)]}>
              <title>
                Week of {label(w.start)}: {formatMoney(w.cents)}
              </title>
            </rect>
            {(i % 2 === 0 || i === weeks.length - 1) && (
              <text x={x + bw / 2} y={B + 20} textAnchor="middle" className={i === weeks.length - 1 ? 'hl' : undefined}>
                {label(w.start)}
              </text>
            )}
          </g>
        );
      })}
      {last.cents > 0 && (
        <text x={L + slot * (weeks.length - 1) + slot / 2} y={B - ((B - T) * last.cents) / max - 8} textAnchor="middle" className="hl">
          {compact(last.cents)}
        </text>
      )}
    </svg>
  );
}

function Meter({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="meter-row">
      <div className="kv">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="admin-meter">
        <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);

export default function AdminOverviewPage() {
  const now = useNow(60_000);
  const { data: d, error, reload } = useAsync(() => loadOverview(), []);

  const soldLots = d?.sold.items ?? [];
  const weeks = weeklyHammer(soldLots, 8, new Date(now));
  const within30 = soldLots.filter((l) => now - new Date(l.endTime).getTime() < 30 * DAY);
  const catName = new Map((d?.categories ?? []).map((c) => [c.id, c.name]));
  const topCats = [...within30.reduce((m, l) => {
    const cur = m.get(l.categoryId) ?? { lots: 0, cents: 0 };
    m.set(l.categoryId, { lots: cur.lots + 1, cents: cur.cents + (l.currentHighestBidAmountCents ?? 0) });
    return m;
  }, new Map<string, { lots: number; cents: number }>())].sort((a, b) => b[1].cents - a[1].cents).slice(0, 5);

  const closedTotal = (d?.sold.meta.total ?? 0) + (d?.unsold ?? 0);
  const decided = (d?.verified ?? 0) + (d?.rejected ?? 0);
  const withinHour = (d?.closingSoon ?? []).filter((l) => {
    const left = new Date(l.endTime).getTime() - now;
    return left > 0 && left < 3600 * 1000;
  }).length;
  const oldestPending = d?.pending.users[0];

  const queue = [
    ...(d?.disputes ?? []).slice(0, 3).map((c) => ({
      key: c.id,
      kind: 'Dispute',
      tone: 'bad' as const,
      title: `${caseCode(c.id)} · ${c.reason}`,
      meta: `${lotCode(c.lotId)} · opened ${formatRelative(c.createdAt)}`,
      action: 'Resolve',
      to: `/admin/disputes/${c.id}`,
    })),
    ...(d?.pending.users ?? []).slice(0, 4).map((u) => ({
      key: u.id,
      kind: 'Verify',
      tone: 'warn' as const,
      title: `${accountCode(u.id)} · ${u.companyName}`,
      meta: `${u.role === 'SELLER' ? 'Seller' : 'Buyer'} · ${u.email} · joined ${formatRelative(u.createdAt)}`,
      action: 'Review',
      to: `/admin/verifications/${u.id}`,
    })),
  ];

  return (
    <AppShell railNote="Figures are live from the API each time you open the page.">
      <div className="page">
        <h1 className="page-title">Platform overview</h1>
        <p className="page-lede">
          {new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · sales figures cover the most recent 50 sold
          lots.
        </p>

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <div className="label">Active auctions</div>
            <div className="value" style={{ fontSize: 28 }}>
              {d ? d.stats.activeLots.toLocaleString('en-US') : '—'}
            </div>
            <div className="note">{d ? `${withinHour} close within the hour` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">GMV, all time</div>
            <div className="value" style={{ fontSize: 28 }}>
              {d ? compact(d.stats.totalGmvCents) : '—'}
            </div>
            <div className="note">Settled balance payments</div>
          </div>
          <div className={`stat ${d?.pending.total ? 'warn' : ''}`}>
            <div className="label">Pending verifications</div>
            <div className="value" style={{ fontSize: 28 }}>
              {d ? d.pending.total : '—'}
            </div>
            <div className="note">{oldestPending ? `Oldest joined ${formatRelative(oldestPending.createdAt)}` : 'Queue is clear'}</div>
          </div>
          <div className={`stat ${d?.stats.openDisputes ? 'bad' : ''}`}>
            <div className="label">Open disputes</div>
            <div className="value" style={{ fontSize: 28 }}>
              {d ? d.stats.openDisputes : '—'}
            </div>
            <div className="note">{d?.stats.openDisputes ? 'Open or under review' : 'None open'}</div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="stack" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-flush">
              <div className="card-head" style={{ flexWrap: 'wrap' }}>
                <span className="card-title">Hammer value by week</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  Sold lots, 8 weeks
                </span>
              </div>
              <div style={{ padding: '18px 16px 10px' }}>{d ? <WeeklyChart weeks={weeks} /> : <div className="card-empty">Loading…</div>}</div>
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Needs an operator</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  Oldest first
                </span>
              </div>
              {d && d.disputes === null && d.stats.openDisputes > 0 && (
                <div className="queue-row">
                  <Pill tone="bad">Dispute</Pill>
                  <span className="main">
                    <strong>
                      {d.stats.openDisputes} open dispute{d.stats.openDisputes === 1 ? '' : 's'}
                    </strong>
                    <small>The API can't list disputes yet, so they can't be opened from here.</small>
                  </span>
                  <Link to="/admin/disputes" className="btn btn-secondary btn-md">
                    Details
                  </Link>
                </div>
              )}
              {!d ? (
                <div className="card-empty">Loading…</div>
              ) : queue.length === 0 && !(d.disputes === null && d.stats.openDisputes > 0) ? (
                <div className="card-empty">Nothing is waiting. New verifications and disputes will appear here.</div>
              ) : (
                queue.map((q) => (
                  <div className="queue-row" key={q.key}>
                    <Pill tone={q.tone}>{q.kind}</Pill>
                    <span className="main">
                      <strong>{q.title}</strong>
                      <small>{q.meta}</small>
                    </span>
                    <Link to={q.to} className="btn btn-secondary btn-md">
                      {q.action}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dash-side">
            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Health</span>
              </div>
              <div className="health">
                <Meter
                  label="Sell-through rate"
                  value={closedTotal ? `${Math.round(pct(d!.sold.meta.total, closedTotal))}%` : '—'}
                  pct={pct(d?.sold.meta.total ?? 0, closedTotal)}
                  color="var(--blue)"
                />
                <Meter
                  label="Verification approval rate"
                  value={decided ? `${Math.round(pct(d!.verified, decided))}%` : '—'}
                  pct={pct(d?.verified ?? 0, decided)}
                  color="var(--ok)"
                />
                <Meter
                  label="Open disputes per sold lot"
                  value={d?.sold.meta.total ? `${pct(d.stats.openDisputes, d.sold.meta.total).toFixed(1)}%` : '—'}
                  pct={pct(d?.stats.openDisputes ?? 0, d?.sold.meta.total ?? 0) * 10}
                  color="var(--bad)"
                />
              </div>
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Accounts</span>
              </div>
              <div style={{ padding: 16, display: 'grid', gap: 9, fontSize: 12.5 }}>
                <div className="kv">
                  <span>Buyers</span>
                  <span>{d?.buyers ?? '—'}</span>
                </div>
                <div className="kv">
                  <span>Sellers</span>
                  <span>{d?.sellers ?? '—'}</span>
                </div>
                <div className="kv">
                  <span>Verified sellers</span>
                  <span>{d?.stats.verifiedSellers ?? '—'}</span>
                </div>
                <div className="kv">
                  <span>Awaiting verification</span>
                  <span style={{ color: 'var(--warn-deep)' }}>{d?.pending.total ?? '—'}</span>
                </div>
                <div className="kv total">
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Verified accounts</span>
                  <span>{d?.verified ?? '—'}</span>
                </div>
              </div>
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Top categories, 30 days</span>
              </div>
              {topCats.length === 0 ? (
                <div className="card-empty">{d ? 'No lots sold in the last 30 days.' : 'Loading…'}</div>
              ) : (
                topCats.map(([id, c]) => (
                  <div className="list-row" key={id} style={{ padding: '10px 16px' }}>
                    <span className="main" style={{ fontSize: 13 }}>
                      {catName.get(id) ?? 'Uncategorized'}
                    </span>
                    <span className="mono muted" style={{ fontSize: 12 }}>
                      {c.lots} lot{c.lots === 1 ? '' : 's'}
                    </span>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {compact(c.cents)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
