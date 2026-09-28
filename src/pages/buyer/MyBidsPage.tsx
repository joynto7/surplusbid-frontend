import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { BidStatePill, EmptyState, ErrorBox, Pill } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { currentPrice, loadWatchedLots, nextMinimum, summarize, useBuyerActivity, useWatchlist, type ActivityRow } from '../../lib/buyer';
import { formatDateTime, formatMoney, formatRemaining, lotCode } from '../../lib/format';
import './buyer.css';

type Tab = 'active' | 'won' | 'lost' | 'watching';

function RowAction({ row }: { row: ActivityRow }) {
  const { lot, state, payment } = row;
  if (state === 'OUTBID') {
    const next = nextMinimum(lot);
    return (
      <Link to={`/lots/${lot.id}?bid=${next}`} className="btn btn-primary btn-sm">
        Bid {formatMoney(next).replace(/\.00$/, '')}
      </Link>
    );
  }
  if (state === 'WINNING') {
    return (
      <Link to={`/lots/${lot.id}`} className="btn-ghost-sm">
        Raise bid
      </Link>
    );
  }
  if (state === 'WON' && payment) {
    if (payment.status === 'FAILED')
      return (
        <Link to={`/buyer/checkout/${payment.id}`} className="btn btn-danger btn-sm">
          Fix payment
        </Link>
      );
    if (payment.status === 'PENDING')
      return (
        <Link to={`/buyer/checkout/${payment.id}`} className="btn btn-primary btn-sm">
          Pay {formatMoney(payment.amountCents).replace(/\.00$/, '')}
        </Link>
      );
    return (
      <Link to={`/buyer/invoices/${payment.id}`} className="btn-ghost-sm">
        Receipt
      </Link>
    );
  }
  return (
    <Link to={`/lots/${lot.id}`} className="btn-ghost-sm">
      View lot
    </Link>
  );
}

export default function MyBidsPage() {
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const tab = (['active', 'won', 'lost', 'watching'].includes(params.get('tab') ?? '') ? params.get('tab') : 'active') as Tab;
  const { activity, error, loading, reload } = useBuyerActivity();
  const watch = useWatchlist();
  const watched = useAsync(() => loadWatchedLots(watch.ids), [watch.ids.join(',')]);

  const s = activity ? summarize(activity, now) : undefined;
  const rows = s ? { active: s.active, won: s.won, lost: s.lost }[tab as Exclude<Tab, 'watching'>] ?? [] : [];
  const failed = s?.won.find((r) => r.payment?.status === 'FAILED');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'active', label: 'ACTIVE', count: s?.active.length },
    { key: 'won', label: 'WON', count: s?.won.length },
    { key: 'lost', label: 'LOST', count: s?.lost.length },
    { key: 'watching', label: 'WATCHING', count: watch.ids.length },
  ];

  return (
    <AppShell>
      <header className="mine-head">
        <div className="eyebrow">Buyer / activity</div>
        <h1>My bids &amp; watchlist</h1>
        <div className="seg" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'on' : ''}
              onClick={() => setParams(t.key === 'active' ? {} : { tab: t.key }, { replace: true })}
            >
              {t.label}
              {t.count !== undefined ? ` · ${t.count}` : ''}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: '18px 24px 40px' }}>
        {error && (
          <div style={{ marginBottom: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="stat-strip">
          <div>
            <div className="eyebrow">Deposits held</div>
            <div className="v">{s ? formatMoney(s.depositsHeldCents) : '—'}</div>
          </div>
          <div>
            <div className="eyebrow">Exposure if all won</div>
            <div className="v">{s ? formatMoney(s.exposureCents) : '—'}</div>
          </div>
          <div>
            <div className="eyebrow">Closing within 24h</div>
            <div className="v warn">{s ? s.closingToday.length : '—'}</div>
          </div>
        </div>

        {tab === 'watching' ? (
          <div className="card card-flush">
            {watch.ids.length === 0 ? (
              <EmptyState
                icon="☆"
                title="Nothing on your watchlist yet"
                actions={
                  <Link to="/lots" className="btn btn-primary">
                    Browse open lots
                  </Link>
                }
              >
                Watch a lot to keep it here without committing a deposit. Your watchlist is saved on this device.
              </EmptyState>
            ) : watched.loading && !watched.data ? (
              <div className="card-empty">Loading…</div>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>LOT</th>
                      <th>DESCRIPTION</th>
                      <th className="num">CURRENT</th>
                      <th className="num">CLOSES</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watched.data?.map((lot) => {
                      const left = new Date(lot.endTime).getTime() - now;
                      const open = lot.status === 'LIVE' && left > 0;
                      return (
                        <tr key={lot.id}>
                          <td>
                        <span className="code">{lotCode(lot.id)}</span>
                      </td>
                          <td>{lot.title}</td>
                          <td className="num">{formatMoney(currentPrice(lot))}</td>
                          <td className={`num ${open && left < 3600 * 1000 ? 'clock-soon' : 'muted'}`}>{open ? formatRemaining(left) : 'CLOSED'}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button className="btn-ghost-sm danger" onClick={() => watch.toggle(lot.id)} style={{ marginRight: 6 }}>
                              Unwatch
                            </button>
                            <Link to={`/lots/${lot.id}`} className={open ? 'btn btn-primary btn-sm' : 'btn-ghost-sm'}>
                              {open ? 'Bid' : 'View'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : loading && !activity ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Loading your bids…
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            {tab === 'active' ? (
              <EmptyState
                icon="⊘"
                title="You have no bids in play"
                actions={
                  <>
                    <Link to="/lots?sort=ending" className="btn btn-primary">
                      Browse lots closing soon
                    </Link>
                    {s && s.won.length > 0 && (
                      <Link to="/buyer/bids?tab=won" className="btn btn-secondary">
                        See what you won
                      </Link>
                    )}
                  </>
                }
              >
                Nothing is at stake and no deposits are held, so nothing needs your attention today.
              </EmptyState>
            ) : (
              <EmptyState icon={tab === 'won' ? '✓' : '—'} title={tab === 'won' ? 'No won lots yet' : 'No lost lots'}>
                {tab === 'won' ? 'Lots you win show up here with their payment status.' : 'Lots that closed to another bidder show up here.'}
              </EmptyState>
            )}
          </div>
        ) : (
          <div className="card card-flush table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>LOT</th>
                  <th>DESCRIPTION</th>
                  <th className="num">YOUR BID</th>
                  <th className="num">CURRENT</th>
                  <th className="num">CLOSES</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const left = new Date(r.lot.endTime).getTime() - now;
                  const payFailed = r.payment?.status === 'FAILED';
                  return (
                    <tr key={r.lot.id} className={payFailed ? 'row-bad' : ''}>
                      <td>
                        <Link to={`/lots/${r.lot.id}`} className="code">
                          {lotCode(r.lot.id)}
                        </Link>
                      </td>
                      <td>{r.lot.title}</td>
                      <td className="num">{formatMoney(r.myBidCents)}</td>
                      <td className="num">{formatMoney(currentPrice(r.lot))}</td>
                      <td className={`num ${left > 0 && left < 3600 * 1000 ? 'clock-soon' : left <= 0 ? 'muted' : ''}`} style={{ fontSize: 11.5 }}>
                        {left > 0 ? formatRemaining(left) : 'CLOSED'}
                      </td>
                      <td>
                        {payFailed ? (
                          <Pill tone="bad">Payment failed</Pill>
                        ) : r.payment?.status === 'SUCCEEDED' ? (
                          <Pill tone="ok">Paid</Pill>
                        ) : (
                          <BidStatePill state={r.state} />
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <RowAction row={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {failed?.payment && (
          <div className="action-needed">
            <span className="square-tag">ACTION NEEDED</span>
            <p>
              The {formatMoney(failed.payment.amountCents)} charge on {lotCode(failed.lot.id)} failed. Retry with another card or bank account
              before {formatDateTime(failed.payment.dueAt)} to keep the lot. After that it's re-offered and your deposit is forfeited.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
