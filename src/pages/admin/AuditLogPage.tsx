import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { auditLine } from '../../lib/admin';
import { api } from '../../lib/api';
import ConsoleHeader from './ConsoleHeader';
import '../buyer/buyer.css';
import './admin.css';

const TYPES = ['all', 'User', 'Dispute', 'Lot', 'Payment'] as const;
const PAGE_SIZE = 50;
const REFRESH_MS = 15_000;

function stamp(iso: string) {
  const d = new Date(iso);
  const today = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString('en-US', { hour12: false });
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (today ? time : `${md} ${time}`).padStart(14, ' ');
}

export default function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const type = (TYPES as readonly string[]).includes(params.get('type') ?? '') ? (params.get('type') as (typeof TYPES)[number]) : 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const res = useAsync(() => api.adminAuditLogs({ page, limit: PAGE_SIZE, entityType: type === 'all' ? undefined : type }), [type, page]);

  // Tail the newest page like a live log.
  useEffect(() => {
    if (page !== 1) return;
    const t = window.setInterval(() => res.reload(), REFRESH_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type]);

  const meta = res.data?.meta;
  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  return (
    <AppShell>
      <ConsoleHeader
        eyebrow="Platform / control room"
        title="Audit log"
        flags={meta ? [{ text: `${meta.total.toLocaleString('en-US')} EVENTS` }, { text: page === 1 ? 'TAILING · 15S' : `PAGE ${page}`, hot: page === 1 }] : undefined}
      />
      <div className="console-body">
        <div className="section-bar">
          <div className="chips">
            {TYPES.map((t) => (
              <button key={t} className={type === t ? 'active' : ''} aria-pressed={type === t} onClick={() => set({ type: t === 'all' ? null : t, page: null })}>
                {t === 'all' ? 'All events' : t}
              </button>
            ))}
          </div>
          <span className="meta">Newest first</span>
        </div>

        {res.error ? (
          <ErrorBox error={res.error} onRetry={res.reload} />
        ) : (
          <div className="terminal-log" role="log" aria-live="polite">
            {!res.data ? (
              <div className="empty">loading…</div>
            ) : res.data.items.length === 0 ? (
              <div className="empty">no events{type !== 'all' ? ` for ${type}` : ''} yet</div>
            ) : (
              res.data.items.map((log) => {
                const l = auditLine(log);
                return (
                  <div className="line" key={log.id}>
                    <span className="t">{stamp(log.createdAt)}</span>
                    {'  '}
                    <span style={{ color: l.tone }}>{l.tag}</span>
                    {'  '}
                    <span className="m">{l.msg}</span>
                  </div>
                );
              })
            )}
            {page === 1 && <div className="cursor">▌</div>}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span className="muted" style={{ fontSize: 12.5 }}>
              Page {meta.page} of {meta.totalPages}
            </span>
            <span style={{ display: 'flex', gap: 7 }}>
              <button className="btn-ghost-sm" disabled={page <= 1} onClick={() => set({ page: page - 1 > 1 ? String(page - 1) : null })}>
                Newer
              </button>
              <button className="btn-ghost-sm" disabled={page >= meta.totalPages} onClick={() => set({ page: String(page + 1) })}>
                Older
              </button>
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
