import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { accountCode, loadPendingUsers } from '../../lib/admin';
import { api } from '../../lib/api';
import { formatDate, formatRelative } from '../../lib/format';
import ConsoleHeader from './ConsoleHeader';
import '../buyer/buyer.css';
import './admin.css';

export default function VerificationQueuePage() {
  const { data, error, loading, reload } = useAsync(() => loadPendingUsers(), []);
  const [done, setDone] = useState<Record<string, 'VERIFIED' | 'REJECTED'>>({});
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  async function decide(id: string, status: 'VERIFIED' | 'REJECTED') {
    if (status === 'REJECTED' && !window.confirm('Request changes from this applicant? Their account goes back to them to fix and resubmit.')) return;
    setBusy(id);
    setActionError(undefined);
    try {
      await api.adminVerifyUser(id, status);
      setDone((d) => ({ ...d, [id]: status }));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(undefined);
    }
  }

  const remaining = (data?.users ?? []).filter((u) => !done[u.id]).length;

  return (
    <AppShell>
      <ConsoleHeader
        eyebrow="Platform / control room"
        title="Verification queue"
        flags={data ? [{ text: `${remaining} PENDING`, hot: remaining > 0 }, { text: `${Object.keys(done).length} DECIDED THIS SESSION` }] : undefined}
      />
      <div className="console-body">
        <div className="section-bar">
          <h2>Pending accounts</h2>
          <span className="meta">Oldest first</span>
        </div>
        {actionError && (
          <div className="form-error" style={{ marginBottom: 12 }}>
            {actionError}
          </div>
        )}
        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <p className="muted">Loading queue…</p>
        ) : data!.users.length === 0 ? (
          <div className="card">
            <EmptyState icon="✓" title="The queue is clear">
              New business verifications appear here as soon as an applicant uploads their documents.
            </EmptyState>
          </div>
        ) : (
          <div className="vq-grid">
            {data!.users.map((u) => {
              const decided = done[u.id];
              return (
                <div className="vq-card" key={u.id} style={decided ? { opacity: 0.6 } : undefined}>
                  <div className="top">
                    <span className="id">{accountCode(u.id)}</span>
                    <span className="age">{formatRelative(u.createdAt)}</span>
                  </div>
                  <div className="name">{u.companyName}</div>
                  <div className="lines">
                    ■ {u.role === 'SELLER' ? 'Seller' : 'Buyer'} application
                    <br />■ Document uploaded
                    <br />
                    <span className="warn">▲ Joined {formatDate(u.createdAt)} · {u.email}</span>
                  </div>
                  <div className="actions">
                    {decided ? (
                      <span className="mono" style={{ fontSize: 11, color: decided === 'VERIFIED' ? 'var(--ok-deep)' : 'var(--warn-deep)', padding: '6px 0' }}>
                        {decided === 'VERIFIED' ? '■ VERIFIED' : '▲ CHANGES REQUESTED'}
                      </span>
                    ) : (
                      <>
                        <button className="caps-btn ok" style={{ flex: 1 }} disabled={busy === u.id} onClick={() => decide(u.id, 'VERIFIED')}>
                          {busy === u.id ? 'SAVING…' : 'VERIFY ACCOUNT'}
                        </button>
                        <button className="caps-btn danger" disabled={busy === u.id} onClick={() => decide(u.id, 'REJECTED')}>
                          REQUEST CHANGES
                        </button>
                        <Link to={`/admin/verifications/${u.id}`} className="caps-btn">
                          REVIEW
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {data && data.total > data.users.length && (
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Showing the oldest {data.users.length} of {data.total}. Decide these to see the rest.
          </p>
        )}
      </div>
    </AppShell>
  );
}
