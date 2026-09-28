import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useNow } from '../../hooks/useNow';
import { formatMoney, formatRemaining, lotCode, shortCode } from '../../lib/format';
import { reserveMet, summarizeInventory, useSellerInventory, type SellerLot } from '../../lib/seller';
import StatusTag from './StatusTag';
import '../buyer/buyer.css';
import './seller.css';

type Filter = 'all' | 'LIVE' | 'DRAFT' | 'SOLD' | 'UNSOLD';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'LIVE', label: 'LIVE' },
  { key: 'DRAFT', label: 'DRAFTS' },
  { key: 'SOLD', label: 'SOLD' },
  { key: 'UNSOLD', label: 'NO SALE' },
];

const WEEK = 7 * 24 * 3600 * 1000;

/** Price path over the last 7 days, as SVG points in a 120×24 box. */
function sparkPoints({ lot, bids }: SellerLot, now: number) {
  const from = now - WEEK;
  const inWindow = bids.filter((b) => new Date(b.createdAt).getTime() >= from).reverse();
  const before = bids.find((b) => new Date(b.createdAt).getTime() < from);
  let price = before?.amountCents ?? lot.startingPriceCents;
  const pts: [number, number][] = [[0, price]];
  for (const b of inWindow) {
    const x = ((new Date(b.createdAt).getTime() - from) / WEEK) * 120;
    pts.push([x, price], [x, b.amountCents]);
    price = b.amountCents;
  }
  pts.push([120, price]);
  const lo = Math.min(...pts.map((p) => p[1]));
  const hi = Math.max(...pts.map((p) => p[1]));
  const y = (v: number) => (hi === lo ? 18 : 22 - ((v - lo) / (hi - lo)) * 20);
  return {
    points: pts.map(([x, v]) => `${x.toFixed(1)},${y(v).toFixed(1)}`).join(' '),
    active: inWindow.length > 0,
  };
}

export default function InventoryPage() {
  const now = useNow();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').toLowerCase();
  const filter = (FILTERS.some((f) => f.key === params.get('status')) ? params.get('status') : 'all') as Filter;
  const { inventory, error, loading, reload } = useSellerInventory();
  const s = inventory ? summarizeInventory(inventory, now) : undefined;

  const rows = (inventory ?? []).filter(
    ({ lot }) => (filter === 'all' || lot.status === filter) && (!q || lot.title.toLowerCase().includes(q) || lotCode(lot.id).toLowerCase().includes(q))
  );

  function setFilter(next: Filter) {
    const p = new URLSearchParams(params);
    if (next === 'all') p.delete('status');
    else p.set('status', next);
    setParams(p, { replace: true });
  }

  return (
    <AppShell>
      <header className="inv-head">
        <div>
          <div className="eyebrow">
            Seller / {user?.companyName} · {user ? shortCode('ACCT', user.id) : ''}
          </div>
          <h1>Inventory log</h1>
        </div>
        <div className="stat-strip">
          <div>
            <div className="eyebrow">Live</div>
            <div className="v warn">{s ? s.live.length : '—'}</div>
          </div>
          <div>
            <div className="eyebrow">Drafts</div>
            <div className="v">{s ? s.drafts.length : '—'}</div>
          </div>
          <div>
            <div className="eyebrow">Sold MTD</div>
            <div className="v" style={{ color: 'var(--ok)' }}>
              {s ? formatMoney(s.salesThisMonthCents).replace(/\.\d\d$/, '') : '—'}
            </div>
          </div>
          <div>
            <div className="eyebrow">Sell-through</div>
            <div className="v">{s?.sellThrough != null ? `${Math.round(s.sellThrough * 100)}%` : '—'}</div>
          </div>
        </div>
        <Link to="/seller/lots/new" className="btn btn-primary wiz-next">
          List a lot
        </Link>
      </header>

      <div style={{ padding: '18px 24px 40px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <div className="seg" role="tablist">
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={filter === f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          {q && (
            <button
              className="filter-chip"
              onClick={() => {
                const p = new URLSearchParams(params);
                p.delete('q');
                setParams(p, { replace: true });
              }}
            >
              “{params.get('q')}” ×
            </button>
          )}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !inventory ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Loading inventory…
          </p>
        ) : rows.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="▤"
              title={inventory?.length ? 'No lots match' : 'You haven’t listed anything yet'}
              actions={
                <Link to="/seller/lots/new" className="btn btn-primary">
                  List a lot
                </Link>
              }
            >
              {inventory?.length ? 'Try another status or clear the search.' : 'Create a draft, add photos and pricing, then publish it to start taking bids.'}
            </EmptyState>
          </div>
        ) : (
          <div className="card card-flush table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>LOT</th>
                  <th>DESCRIPTION</th>
                  <th>STATUS</th>
                  <th>BID ACTIVITY · 7D</th>
                  <th className="num">BIDS</th>
                  <th className="num">CURRENT</th>
                  <th className="num">RESERVE</th>
                  <th className="num">CLOSES</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const { lot, bidCount } = row;
                  const left = new Date(lot.endTime).getTime() - now;
                  const draft = lot.status === 'DRAFT';
                  const spark = sparkPoints(row, now);
                  const met = reserveMet(lot);
                  return (
                    <tr key={lot.id} className="clickable" onClick={() => navigate(draft ? `/seller/lots/${lot.id}/edit` : `/seller/lots/${lot.id}`)}>
                      <td>
                        <span className="code">{lotCode(lot.id)}</span>
                      </td>
                      <td>{lot.title}</td>
                      <td>
                        <StatusTag lot={lot} now={now} />
                      </td>
                      <td>
                        <svg viewBox="0 0 120 24" width="120" height="24" preserveAspectRatio="none" aria-hidden="true">
                          <polyline points={spark.points} fill="none" stroke={spark.active ? 'var(--blue)' : 'var(--line2)'} strokeWidth="1.5" />
                        </svg>
                      </td>
                      <td className="num">{draft ? '—' : bidCount}</td>
                      <td className="num">{lot.currentHighestBidAmountCents === null ? '—' : formatMoney(lot.currentHighestBidAmountCents)}</td>
                      <td className="num" style={{ color: draft ? undefined : met ? 'var(--ok-deep)' : 'var(--bad-deep)' }}>
                        {draft ? formatMoney(lot.reservePriceCents).replace(/\.00$/, '') : met ? 'MET' : 'NOT MET'}
                      </td>
                      <td className={`num ${lot.status === 'LIVE' && left > 0 && left < 3600 * 1000 ? 'clock-soon' : 'muted'}`}>
                        {draft ? 'NOT PUBLISHED' : lot.status === 'LIVE' && left > 0 ? formatRemaining(left) : 'CLOSED'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="legend eyebrow">
          <span>DRAFT — NOT YET PUBLISHED</span>
          <span>LIVE — ACCEPTING BIDS</span>
          <span>SOLD — CLOSED WITH A WINNING BID</span>
          <span>NO SALE — CLOSED WITH NO BIDS</span>
        </div>
      </div>
    </AppShell>
  );
}
