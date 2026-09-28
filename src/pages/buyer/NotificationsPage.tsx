import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill } from '../../components/ui';
import { deriveNotifications, useBuyerActivity, useNotificationState } from '../../lib/buyer';
import { formatRelative } from '../../lib/format';
import './buyer.css';

type Filter = 'all' | 'unread' | 'bids' | 'pay';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'bids', label: 'Bids' },
  { key: 'pay', label: 'Payments' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { activity, error, loading, reload } = useBuyerActivity();
  const state = useNotificationState();
  const [filter, setFilter] = useState<Filter>('all');

  const all = activity ? deriveNotifications(activity).filter((n) => state.enabled(n.kind)) : [];
  const unread = all.filter((n) => !state.isRead(n.id)).length;
  const visible = all.filter((n) => {
    if (filter === 'unread') return !state.isRead(n.id);
    if (filter === 'bids' || filter === 'pay') return n.group === filter;
    return true;
  });

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 840 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-lede">
              {!activity ? 'Loading…' : unread === 0 ? 'Everything is read.' : `${unread} unread of ${all.length}.`}
            </p>
          </div>
          <button
            className="btn btn-secondary btn-md"
            style={{ marginLeft: 'auto' }}
            disabled={unread === 0}
            onClick={() => state.markAll(all.map((n) => n.id))}
          >
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
          {loading && !activity ? (
            <div className="card-empty">Loading…</div>
          ) : visible.length === 0 ? (
            <EmptyState icon="✓" title={filter === 'unread' ? "You're all caught up" : 'No notifications'}>
              Outbid alerts, closing reminders, wins and payment reminders for your lots appear here.
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
          Click a row to toggle its read state. Notifications reflect the current state of your bids and orders.
        </p>
      </div>
    </AppShell>
  );
}
