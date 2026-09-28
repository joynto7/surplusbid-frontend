import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { currentPrice } from '../../lib/buyer';
import { formatDate, formatMoney, formatRemaining, lotCode } from '../../lib/format';
import { reserveMet, summarizeInventory, useSellerInventory } from '../../lib/seller';
import '../buyer/buyer.css';
import './seller.css';

const wholeDollars = (cents: number) => formatMoney(cents).replace(/\.\d\d$/, '');

export default function SellerDashboardPage() {
  const now = useNow();
  const navigate = useNavigate();
  const { inventory, error, loading, reload } = useSellerInventory();
  const s = inventory ? summarizeInventory(inventory, now) : undefined;

  let lede = 'Loading your lots…';
  if (s) {
    const parts = [
      s.live.length ? `${s.live.length} lot${s.live.length === 1 ? ' is' : 's are'} live` : 'You have no live lots',
      s.withinHour.length ? `${s.withinHour.length} close${s.withinHour.length === 1 ? 's' : ''} within the hour` : null,
      s.drafts.length ? `${s.drafts.length} draft${s.drafts.length === 1 ? ' is' : 's are'} waiting to be published` : null,
    ].filter(Boolean);
    lede = parts.length > 1 ? `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.` : `${parts[0]}.`;
  }
  const maxBar = Math.max(1, ...(s?.bars.map((b) => b.cents) ?? [1]));
  const firstDraft = s?.drafts[0];

  return (
    <AppShell railNote="Bid counts and reserve status update when you open the page.">
      <div className="page">
        <h1 className="page-title">Seller dashboard</h1>
        <p className="page-lede">{lede}</p>

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <div className="label">Active listings</div>
            <div className="value">{s ? s.live.length : '—'}</div>
            <div className="note">{s ? `Plus ${s.drafts.length} draft${s.drafts.length === 1 ? '' : 's'}` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">Sales this month</div>
            <div className="value">{s ? wholeDollars(s.salesThisMonthCents) : '—'}</div>
            <div className="note">{s ? `${s.soldThisMonth.length} lot${s.soldThisMonth.length === 1 ? '' : 's'} sold, hammer total` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">Lots sold</div>
            <div className="value">{s ? s.sold.length : '—'}</div>
            <div className="note">{s ? `${s.unsold.length} closed without a sale` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">Sell-through rate</div>
            <div className="value">{s ? (s.sellThrough === null ? '—' : `${Math.round(s.sellThrough * 100)}%`) : '—'}</div>
            <div className="note">Last 90 days</div>
          </div>
        </div>

        {firstDraft && (
          <div className="callout warn" style={{ marginTop: 16 }}>
            <span className="body">
              <strong>
                {s!.drafts.length === 1 ? 'One lot is' : `${s!.drafts.length} lots are`} still in draft
              </strong>
              <span>
                {lotCode(firstDraft.lot.id)} · {firstDraft.lot.title} isn't visible to buyers until you publish it.
              </span>
            </span>
            <Link to={`/seller/lots/${firstDraft.lot.id}/edit`} className="btn btn-warn btn-lg">
              Finish draft
            </Link>
          </div>
        )}

        <div className="seller-grid">
          <div className="card card-flush" style={{ minWidth: 0 }}>
            <div className="card-head">
              <span className="card-title">Active listings</span>
              <Link to="/seller/listings">Full inventory</Link>
            </div>
            {loading && !inventory ? (
              <div className="card-empty">Loading…</div>
            ) : s && s.live.length === 0 ? (
              <EmptyState
                icon="＋"
                title="No lots are live"
                actions={
                  <Link to="/seller/lots/new" className="btn btn-primary">
                    List a lot
                  </Link>
                }
              >
                List equipment to start taking bids. Lots go live as soon as you publish them.
              </EmptyState>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lot</th>
                      <th className="num">Bids</th>
                      <th className="num">Current</th>
                      <th>Reserve</th>
                      <th className="num">Closes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s?.live.map(({ lot, bidCount }) => {
                      const left = new Date(lot.endTime).getTime() - now;
                      return (
                        <tr key={lot.id} className="clickable" onClick={() => navigate(`/seller/lots/${lot.id}`)}>
                          <td>
                            <span className="code">{lotCode(lot.id)}</span>
                            <span className="desc">{lot.title}</span>
                          </td>
                          <td className="num">{bidCount}</td>
                          <td className="num">{lot.currentHighestBidAmountCents === null ? '—' : formatMoney(lot.currentHighestBidAmountCents)}</td>
                          <td>{reserveMet(lot) ? <Pill tone="ok">Met</Pill> : <Pill tone="bad">Not met</Pill>}</td>
                          <td className={`num ${left > 0 && left < 3600 * 1000 ? 'clock-soon' : 'muted'}`} style={{ fontSize: 12 }}>
                            {formatRemaining(left)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dash-side">
            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Ending soon</span>
                <Pill tone="warn">{s ? `${s.withinHour.length} within the hour` : '…'}</Pill>
              </div>
              {s && s.endingSoon.length === 0 ? (
                <div className="card-empty">Nothing is closing right now.</div>
              ) : (
                s?.endingSoon.slice(0, 4).map(({ lot, bidCount }) => (
                  <Link key={lot.id} to={`/seller/lots/${lot.id}`} className="list-row">
                    <span className="main">
                      <span className="t">{lot.title}</span>
                      <span className="s">
                        {formatMoney(currentPrice(lot))} · {bidCount} bids · {reserveMet(lot) ? 'Reserve met' : 'Below reserve'}
                      </span>
                    </span>
                    <Pill tone="warn">{formatRemaining(new Date(lot.endTime).getTime() - now)}</Pill>
                  </Link>
                ))
              )}
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Recently sold</span>
              </div>
              {s && s.sold.length === 0 ? (
                <div className="card-empty">Sold lots appear here once their auctions close.</div>
              ) : (
                [...(s?.sold ?? [])]
                  .sort((a, b) => b.lot.endTime.localeCompare(a.lot.endTime))
                  .slice(0, 3)
                  .map(({ lot }) => (
                    <Link key={lot.id} to={`/seller/lots/${lot.id}`} className="list-row">
                      <span className="main">
                        <span className="t">
                          {lotCode(lot.id)} · {lot.title}
                        </span>
                        <span className="s">
                          {formatMoney(lot.currentHighestBidAmountCents)} hammer · closed {formatDate(lot.endTime)}
                        </span>
                      </span>
                      <Pill tone="ok">Sold</Pill>
                    </Link>
                  ))
              )}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                <Link to="/seller/payouts" style={{ fontSize: 12.5, fontWeight: 500 }}>
                  All sales
                </Link>
              </div>
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Sales, last 6 months</span>
              </div>
              <div style={{ padding: 16 }}>
                <div className="bars" role="img" aria-label={s ? s.bars.map((b) => `${b.label} ${formatMoney(b.cents)}`).join(', ') : 'Loading'}>
                  {s?.bars.map((b, i) => (
                    <span key={b.label} title={formatMoney(b.cents)}>
                      <span className={`bar ${i === s.bars.length - 1 ? 'now' : ''}`} style={{ height: `${(b.cents / maxBar) * 100}%` }} />
                      <span className="lbl">{b.label}</span>
                    </span>
                  ))}
                </div>
                <div className="total-line">
                  <span>6-month total</span>
                  <span>{s ? wholeDollars(s.bars.reduce((sum, b) => sum + b.cents, 0)) : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
