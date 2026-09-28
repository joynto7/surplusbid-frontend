import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { BidStatePill, EmptyState, ErrorBox, LotThumb, Pill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { api } from '../../lib/api';
import {
  currentPrice,
  deriveNotifications,
  loadWatchedLots,
  summarize,
  useBuyerActivity,
  useNotificationState,
  useWatchlist,
} from '../../lib/buyer';
import { formatDateTime, formatMoney, formatRelative, formatRemaining, lotCode } from '../../lib/format';
import './buyer.css';

function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const now = useNow();
  const { activity, error, loading, reload } = useBuyerActivity();
  const watch = useWatchlist();
  const notifState = useNotificationState();

  const soon = useAsync(() => api.browseLots({ status: 'LIVE', sortBy: 'endTime', sortOrder: 'asc', limit: 50 }), []);
  const watched = useAsync(() => loadWatchedLots(watch.ids.slice(0, 3)), [watch.ids.join(',')]);

  const s = activity ? summarize(activity, now) : undefined;
  const closingToday = (soon.data?.items ?? []).filter((l) => new Date(l.endTime).getTime() - now < 24 * 3600 * 1000);
  const recent = activity
    ? deriveNotifications(activity, now)
        .filter((n) => notifState.enabled(n.kind))
        .slice(0, 4)
    : [];
  const due = s?.soonestDue;
  const dueLot = due ? activity?.lots.get(due.lotId) : undefined;

  let lede = 'Loading your activity…';
  if (s) {
    const n = s.closingToday.length;
    lede = n
      ? `${n} of your lots ${n === 1 ? 'closes' : 'close'} within 24 hours`
      : s.active.length
        ? `You're bidding on ${s.active.length} lot${s.active.length === 1 ? '' : 's'}`
        : 'You have no bids in play';
    lede += s.due.length ? `, and ${s.due.length} order${s.due.length === 1 ? ' needs' : 's need'} payment.` : '.';
  }

  return (
    <AppShell railNote="Bids, deposits and payments update when you open the page.">
      <div className="page">
        <h1 className="page-title">
          {greeting()}, {user?.companyName}
        </h1>
        <p className="page-lede">{lede}</p>

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <div className="label">Active bids</div>
            <div className="value">{s ? s.active.length : '—'}</div>
            <div className={`note ${s?.winning.length ? 'ok' : ''}`}>
              {s ? (s.winning.length ? `Winning ${s.winning.length} of them` : 'None leading') : ' '}
            </div>
          </div>
          <div className="stat">
            <div className="label">Deposits held</div>
            <div className="value">{s ? formatMoney(s.depositsHeldCents) : '—'}</div>
            <div className="note">{s ? `Across ${s.active.length} lot${s.active.length === 1 ? '' : 's'}` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">Exposure if all won</div>
            <div className="value">{s ? formatMoney(s.exposureCents) : '—'}</div>
            <div className="note">Sum of your top bids</div>
          </div>
          <div className={`stat ${s?.balanceDueCents ? 'bad' : ''}`}>
            <div className="label">Balance due</div>
            <div className="value">{s ? formatMoney(s.balanceDueCents) : '—'}</div>
            <div className="note">
              {due ? `Due in ${formatRemaining(new Date(due.dueAt).getTime() - now)}` : 'Nothing owed'}
            </div>
          </div>
        </div>

        {due && (
          <div className="callout bad" style={{ marginTop: 16 }}>
            <span className="body">
              <strong>
                {due.status === 'FAILED' ? 'Payment failed on' : 'You won'} {lotCode(due.lotId)} — payment is due
              </strong>
              <span>
                {dueLot?.title ?? 'Your lot'}. {formatMoney(due.amountCents)} remaining after your deposit is applied. Pay by{' '}
                {formatDateTime(due.dueAt)} or the lot forfeits to the next bidder.
              </span>
            </span>
            <Link to={`/buyer/checkout/${due.id}`} className="btn btn-danger btn-lg">
              Pay now
            </Link>
          </div>
        )}

        <div className="dash-grid">
          <div className="card card-flush" style={{ minWidth: 0 }}>
            <div className="card-head">
              <span className="card-title">Your active bids</span>
              <Link to="/buyer/bids">View all</Link>
            </div>
            {loading && !activity ? (
              <div className="card-empty">Loading bids…</div>
            ) : s && s.active.length === 0 ? (
              <EmptyState
                icon="⊘"
                title="You have no bids in play"
                actions={
                  <Link to="/lots" className="btn btn-primary">
                    Browse open lots
                  </Link>
                }
              >
                Nothing is at stake and no deposits are held, so nothing needs your attention today.
              </EmptyState>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lot</th>
                      <th className="num">Your bid</th>
                      <th className="num">Current</th>
                      <th className="num">Closes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s?.active.map((r) => {
                      const left = new Date(r.lot.endTime).getTime() - now;
                      return (
                        <tr key={r.lot.id}>
                          <td>
                            <Link to={`/lots/${r.lot.id}`} className="code">
                              {lotCode(r.lot.id)}
                            </Link>
                            <span className="desc">{r.lot.title}</span>
                          </td>
                          <td className="num">{formatMoney(r.myBidCents)}</td>
                          <td className="num">{formatMoney(currentPrice(r.lot))}</td>
                          <td className={`num ${left < 3600 * 1000 ? 'clock-soon' : 'muted'}`} style={{ fontSize: 12 }}>
                            {formatRemaining(left)}
                          </td>
                          <td>
                            <BidStatePill state={r.state} />
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
                <span className="card-title">Closing soon</span>
                <Pill tone="warn">{closingToday.length} today</Pill>
              </div>
              {soon.error ? (
                <div className="card-empty">
                  <ErrorBox error={soon.error} onRetry={soon.reload} />
                </div>
              ) : soon.loading && !soon.data ? (
                <div className="card-empty">Loading…</div>
              ) : closingToday.length === 0 ? (
                <div className="card-empty">No open lots close in the next 24 hours.</div>
              ) : (
                closingToday.slice(0, 4).map((lot) => (
                  <Link key={lot.id} to={`/lots/${lot.id}`} className="list-row">
                    <LotThumb src={lot.images[0]} className="thumb" />
                    <span className="main">
                      <span className="t">{lot.title}</span>
                      <span className="s">
                        {formatMoney(currentPrice(lot))} · {lot.currentHighestBidAmountCents === null ? 'no bids yet' : 'current bid'}
                      </span>
                    </span>
                    <Pill tone="warn">{formatRemaining(new Date(lot.endTime).getTime() - now)}</Pill>
                  </Link>
                ))
              )}
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Watchlist</span>
                <Link to="/buyer/bids?tab=watching">All {watch.ids.length}</Link>
              </div>
              {watch.ids.length === 0 ? (
                <div className="card-empty">
                  Watch a lot from its page to keep it here without committing a deposit.
                </div>
              ) : (
                watched.data?.map((lot) => (
                  <div key={lot.id} className="list-row">
                    <span className="main">
                      <span className="t">{lot.title}</span>
                      <span className="s">
                        {formatMoney(currentPrice(lot))} · closes {formatDateTime(lot.endTime)}
                      </span>
                    </span>
                    <Link to={`/lots/${lot.id}`} className="btn btn-secondary btn-sm">
                      Bid
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="card card-flush">
              <div className="card-head">
                <span className="card-title">Recent notifications</span>
                <Link to="/buyer/notifications">Open</Link>
              </div>
              {recent.length === 0 ? (
                <div className="card-empty">{activity ? 'Nothing new.' : 'Loading…'}</div>
              ) : (
                recent.map((n) => (
                  <Link
                    key={n.id}
                    to={n.href}
                    className={`notif-mini ${notifState.isRead(n.id) ? '' : 'unread'}`}
                    onClick={() => notifState.setRead(n.id, true)}
                  >
                    <span className="notif-dot" />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span className="text">{n.title}</span>
                      <span className="time">{formatRelative(n.at)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
