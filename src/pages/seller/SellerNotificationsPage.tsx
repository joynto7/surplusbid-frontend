import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill } from '../../components/ui';
import { formatRelative } from '../../lib/format';
import { deriveSellerNotifications, useSellerInventory, useSellerNotificationState } from '../../lib/seller';
import '../buyer/buyer.css';
import './seller.css';

type Filter = 'all' | 'unread' | 'bid' | 'sale';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'bid', label: 'Bids' },
  { key: 'sale', label: 'Sales' },
];

export default function SellerNotificationsPage() {
  const navigate = useNavigate();
  const { inventory, error, loading, reload } = useSellerInventory();
  const state = useSellerNotificationState();
  const [filter, setFilter] = useState<Filter>('all');

  const all = inventory ? deriveSellerNotifications(inventory).filter((n) => state.enabled(n.kind)) : [];
  const unread = all.filter((n) => !state.isRead(n.id)).length;
  const visible = all.filter((n) => (filter === 'unread' ? !state.isRead(n.id) : filter === 'all' ? true : n.group === filter));

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 840 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <h1 className="page-title">Seller notifications</h1>
            <p className="page-lede">{!inventory ? 'Loading…' : unread === 0 ? 'Everything is read.' : `${unread} unread of ${all.length}.`}</p>
          </div>
          <button className="btn btn-secondary btn-md" style={{ marginLeft: 'auto' }} disabled={unread === 0} onClick={() => state.markAll(all.map((n) => n.id))}>
            Mark all as read
          </button>
        </div>

        <div className="chips" style={{ marginTop: 16 }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 14 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="card card-flush" style={{ marginTop: 14 }}>
          {loading && !inventory ? (
            <div className="card-empty">Loading…</div>
          ) : visible.length === 0 ? (
            <EmptyState icon="✓" title={filter === 'unread' ? "You're all caught up" : 'No notifications'}>
              New bids, reserves met, closing reminders and sales on your lots appear here.
            </EmptyState>
          ) : (
            visible.map((n) => {
              const read = state.isRead(n.id);
              return (
                <div
                  key={n.id}
                  className={`notif-row ${read ? '' : 'unread'}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.title}, ${read ? 'read' : 'unread'}. Toggle read state`}
                  onClick={() => state.setRead(n.id, !read)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), state.setRead(n.id, !read))}
                >
                  <span className="notif-dot" />
                  <span className="main">
                    <span className="head">
                      <Pill tone={n.tone}>{n.tag}</Pill>
                      <span className="title">{n.title}</span>
                    </span>
                    <span className="body">{n.body}</span>
                  </span>
                  <span className="side">
                    <span className="time">{formatRelative(n.at)}</span>
                    <a
                      href={n.href}
                      className="cta"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        state.setRead(n.id, true);
                        navigate(n.href);
                      }}
                    >
                      {n.action}
                    </a>
                  </span>
                </div>
              );
            })
          )}
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>
          Click a row to toggle its read state. Notifications reflect the current state of your lots.
        </p>
      </div>
    </AppShell>
  );
}
