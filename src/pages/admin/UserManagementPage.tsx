import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill, errorMessage } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { ROLE_LABEL, STATUS_LABEL, STATUS_TONE, accountCode } from '../../lib/admin';
import { api, type AdminUser, type Role, type VerificationStatus } from '../../lib/api';
import { formatDate } from '../../lib/format';
import '../buyer/buyer.css';
import './admin.css';

const PAGE_SIZE = 25;
const STATUSES: { key: VerificationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'UNVERIFIED', label: 'Not submitted' },
];

function csv(users: AdminUser[]) {
  const rows = [['Account', 'Company', 'Email', 'Role', 'Status', 'Joined'], ...users.map((u) => [accountCode(u.id), u.companyName, u.email, ROLE_LABEL[u.role], STATUS_LABEL[u.verificationStatus], u.createdAt.slice(0, 10)])];
  const text = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `surplusbid-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UserManagementPage() {
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const role = (['BUYER', 'SELLER', 'ADMIN'].includes(params.get('role') ?? '') ? params.get('role') : undefined) as Role | undefined;
  const status = (STATUSES.some((s) => s.key === params.get('status')) ? params.get('status') : 'all') as VerificationStatus | 'all';
  const q = params.get('q') ?? '';
  const [overrides, setOverrides] = useState<Record<string, VerificationStatus>>({});
  const [busy, setBusy] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const res = useAsync(
    () => api.adminUsers({ page, limit: PAGE_SIZE, role, verificationStatus: status === 'all' ? undefined : status }),
    [page, role, status]
  );

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!('page' in next)) p.delete('page');
    setParams(p, { replace: true });
  }

  async function setStatus(u: AdminUser, to: 'VERIFIED' | 'REJECTED') {
    const verb = to === 'REJECTED' ? 'Revoke verification for' : 'Reinstate';
    if (!window.confirm(`${verb} ${u.companyName}?`)) return;
    setBusy(u.id);
    setActionError(undefined);
    try {
      const updated = await api.adminVerifyUser(u.id, to);
      setOverrides((o) => ({ ...o, [u.id]: updated.verificationStatus }));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(undefined);
    }
  }

  const needle = q.trim().toLowerCase();
  const rows = (res.data?.items ?? []).filter(
    (u) => !needle || u.companyName.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle) || accountCode(u.id).toLowerCase().includes(needle)
  );
  const meta = res.data?.meta;

  return (
    <AppShell>
      <div className="page">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <h1 className="page-title">User management</h1>
            <p className="page-lede">
              {meta ? `${meta.total.toLocaleString('en-US')} account${meta.total === 1 ? '' : 's'}${status !== 'all' || role ? ' match these filters' : ''}.` : 'Loading…'} Revoking verification
              blocks an account until it's reinstated.
            </p>
          </div>
          <button className="btn btn-secondary btn-md" style={{ marginLeft: 'auto' }} disabled={!rows.length} onClick={() => csv(rows)}>
            Export CSV
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <div className="shell-search" style={{ minWidth: 240, maxWidth: 360, background: 'var(--surface)' }}>
            <span className="glyph">⌕</span>
            <input value={q} onChange={(e) => update({ q: e.target.value || null, page: String(page) })} placeholder="Search this page: company, email or account ID" aria-label="Search accounts" />
          </div>
          <select className="field-input" style={{ width: 'auto', padding: '9px 10px' }} value={role ?? ''} onChange={(e) => update({ role: e.target.value || null })} aria-label="Role">
            <option value="">All roles</option>
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="ADMIN">Operator</option>
          </select>
        </div>

        <div className="chips" style={{ marginTop: 12 }}>
          {STATUSES.map((s) => (
            <button key={s.key} className={status === s.key ? 'active' : ''} aria-pressed={status === s.key} onClick={() => update({ status: s.key === 'all' ? null : s.key })}>
              {s.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="form-error" style={{ marginTop: 12 }}>
            {actionError}
          </div>
        )}

        <div className="card card-flush" style={{ marginTop: 12 }}>
          {res.error ? (
            <div style={{ padding: 16 }}>
              <ErrorBox error={res.error} onRetry={res.reload} />
            </div>
          ) : res.loading && !res.data ? (
            <div className="card-empty">Loading accounts…</div>
          ) : rows.length === 0 ? (
            <EmptyState icon="⌕" title="No accounts match">
              {needle ? 'Search only covers the page you’re on. Try another page or clear the search.' : 'Try a different role or status.'}
            </EmptyState>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="num">Joined</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const s = overrides[u.id] ?? u.verificationStatus;
                    const self = u.id === me?.id;
                    return (
                      <tr key={u.id}>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>{u.companyName}</span>
                          <span className="mono muted" style={{ display: 'block', fontSize: 11.5, marginTop: 2 }}>
                            {accountCode(u.id)} · {u.email}
                          </span>
                        </td>
                        <td style={{ color: 'var(--body)' }}>{ROLE_LABEL[u.role]}</td>
                        <td>
                          <Pill tone={STATUS_TONE[s]}>{STATUS_LABEL[s]}</Pill>
                        </td>
                        <td className="num muted" style={{ fontSize: 11.5 }}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {self || u.role === 'ADMIN' ? (
                            <span className="muted" style={{ fontSize: 12 }}>
                              —
                            </span>
                          ) : s === 'PENDING' ? (
                            <Link to={`/admin/verifications/${u.id}`} className="btn btn-primary btn-sm">
                              Review
                            </Link>
                          ) : s === 'VERIFIED' ? (
                            <button className="btn-ghost-sm danger" disabled={busy === u.id} onClick={() => setStatus(u, 'REJECTED')}>
                              Revoke
                            </button>
                          ) : s === 'REJECTED' ? (
                            <button className="btn-ghost-sm" style={{ background: 'var(--ok-tint)', borderColor: 'var(--ok-line)', color: 'var(--ok-deep)', fontWeight: 600 }} disabled={busy === u.id} onClick={() => setStatus(u, 'VERIFIED')}>
                              Reinstate
                            </button>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>
                              Awaiting documents
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {meta && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, padding: '13px 16px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Page {meta.page} of {Math.max(1, meta.totalPages)} · {rows.length} shown · {meta.total.toLocaleString('en-US')} total
              </span>
              <span style={{ display: 'flex', gap: 7 }}>
                <button className="btn-ghost-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
                  Previous
                </button>
                <button className="btn-ghost-sm" disabled={page >= meta.totalPages} onClick={() => update({ page: String(page + 1) })}>
                  Next
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
