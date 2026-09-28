import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill, errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { STATUS_LABEL, STATUS_TONE, accountCode, auditFor, findUser, loadPendingUsers } from '../../lib/admin';
import { api, type VerificationStatus } from '../../lib/api';
import { formatDateTime, formatRelative, isUuid } from '../../lib/format';
import NotFoundPage from '../system/NotFoundPage';
import '../buyer/buyer.css';
import './admin.css';

type Decision = 'approve' | 'changes';

const CHECKLIST = [
  { key: 'name', label: 'Legal name matches the registration certificate', detail: 'Exact spelling, including LLC / Inc.' },
  { key: 'ein', label: 'Tax ID matches the document', detail: 'Compare the EIN on the certificate or IRS letter.' },
  { key: 'legible', label: 'Every page is legible', detail: 'Certificate numbers and seals readable at full size.' },
  { key: 'current', label: 'The registration is current', detail: 'Not expired or dissolved in the state registry.' },
];

export default function VerificationDetailPage() {
  const { userId = '' } = useParams();
  const user = useAsync(() => findUser(userId), [userId]);
  const history = useAsync(() => auditFor('User', userId), [userId]);
  const queue = useAsync(() => loadPendingUsers(), []);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [decision, setDecision] = useState<Decision>('approve');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<VerificationStatus>();

  if (!isUuid(userId) || (user.data === undefined && !user.loading && !user.error)) return <NotFoundPage />;

  const u = user.data;
  const status = result ?? u?.verificationStatus;
  const next = queue.data?.users.find((p) => p.id !== userId);
  const allChecked = CHECKLIST.every((c) => checked[c.key]);

  async function submit() {
    if (decision === 'changes' && reason.trim().length < 10) {
      setError('Say exactly what the applicant needs to fix, so they can act on it without replying.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const updated = await api.adminVerifyUser(userId, decision === 'approve' ? 'VERIFIED' : 'REJECTED');
      setResult(updated.verificationStatus);
      history.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const mailto = u
    ? `mailto:${u.email}?subject=${encodeURIComponent('Your SurplusBid verification')}&body=${encodeURIComponent(
        `Hello ${u.companyName},\n\nWe reviewed your business verification and need one change before we can approve it:\n\n${reason.trim()}\n\nYou can update your submission from your SurplusBid account.\n\nSurplusBid operations`
      )}`
    : '#';

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1080 }}>
        <Link to="/admin/verifications" className="back-link">
          ← Back to queue
        </Link>

        {user.error ? (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={user.error} onRetry={user.reload} />
          </div>
        ) : !u ? (
          <p className="muted">Loading account…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginTop: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <span className="mono muted" style={{ fontSize: 12, fontWeight: 600 }}>
                    {accountCode(u.id)}
                  </span>
                  <Pill tone={STATUS_TONE[status!]}>{status === 'PENDING' ? `Pending review · ${formatRelative(u.createdAt).replace(' ago', '')}` : STATUS_LABEL[status!]}</Pill>
                  <Pill>Applied as {u.role === 'SELLER' ? 'seller' : 'buyer'}</Pill>
                </div>
                <h1 className="page-title" style={{ marginTop: 8 }}>
                  {u.companyName}
                </h1>
                <p className="page-lede" style={{ fontSize: 13.5, marginTop: 5 }}>
                  Account created {formatDateTime(u.createdAt)} · {u.email}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
                {next && (
                  <Link to={`/admin/verifications/${next.id}`} className="btn btn-secondary btn-md">
                    Skip to next
                  </Link>
                )}
              </div>
            </div>

            <div className="detail-grid">
              <div className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <div className="card card-flush">
                  <div className="card-head">
                    <span className="card-title">Review checklist</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {CHECKLIST.filter((c) => checked[c.key]).length} / {CHECKLIST.length} confirmed
                    </span>
                  </div>
                  {CHECKLIST.map((c) => (
                    <label className="check-row" key={c.key} style={{ cursor: 'pointer' }}>
                      <span className={`mark ${checked[c.key] ? '' : 'warn'}`}>{checked[c.key] ? '✓' : '?'}</span>
                      <span className="main">
                        <strong>{c.label}</strong>
                        <small>{c.detail}</small>
                      </span>
                      <input type="checkbox" checked={Boolean(checked[c.key])} onChange={(e) => setChecked({ ...checked, [c.key]: e.target.checked })} />
                    </label>
                  ))}
                  <div className="card-empty" style={{ borderTop: '1px solid var(--line)', fontSize: 12 }}>
                    Registry, bank and OCR checks aren't automated yet, so confirm these by hand against the uploaded document.
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="card-title">Submitted document</div>
                  <div className="callout warn" style={{ marginTop: 14 }}>
                    <span className="body" style={{ fontSize: 13 }}>
                      The admin API doesn't return the uploaded file yet. It's stored on the account as{' '}
                      <span className="env-name">verificationDocUrl</span>. Open it from the Cloudinary console until the admin users endpoint
                      includes it.
                    </span>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="card-title">Declared details</div>
                  <table className="declared" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                    <tbody>
                      {[
                        ['Legal name', u.companyName],
                        ['Work email', u.email],
                        ['Role', u.role === 'SELLER' ? 'Seller' : u.role === 'BUYER' ? 'Buyer' : 'Operator'],
                        ['Account ID', accountCode(u.id)],
                        ['Account created', formatDateTime(u.createdAt)],
                      ].map(([k, v]) => (
                        <tr key={k}>
                          <td>{k}</td>
                          <td>{v}</td>
                          <td />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="sticky-aside">
                <div className="card" style={{ padding: 18 }}>
                  <div className="card-title">Decision</div>
                  {result ? (
                    <>
                      <div className={result === 'VERIFIED' ? 'form-ok' : 'form-error'} style={{ marginTop: 14 }}>
                        {result === 'VERIFIED'
                          ? `${u.companyName} is verified. Bidding and listing are unlocked.`
                          : 'Changes requested. The applicant can edit and resubmit from their account.'}
                      </div>
                      {result === 'REJECTED' && reason.trim() && (
                        <a className="btn btn-primary btn-block" style={{ marginTop: 12 }} href={mailto}>
                          Email the applicant
                        </a>
                      )}
                      {next && (
                        <Link to={`/admin/verifications/${next.id}`} className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
                          Next in queue
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gap: 8, marginTop: 14 }} role="radiogroup" aria-label="Decision">
                        {(
                          [
                            ['approve', 'ok', 'Approve', 'Unlocks bidding and listing immediately.'],
                            ['changes', 'bad', 'Request changes', 'Sends the submission back so they can fix it and resubmit.'],
                          ] as const
                        ).map(([key, tone, label, note]) => (
                          <button type="button" key={key} role="radio" aria-checked={decision === key} className={`choice tone-${tone} ${decision === key ? 'active' : ''}`} onClick={() => setDecision(key)}>
                            <span className="row">
                              <span className="dot" />
                              <span className="text">
                                <span className="label">{label}</span>
                                <span className="note">{note}</span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>

                      {decision === 'changes' && (
                        <label style={{ display: 'block', marginTop: 16 }}>
                          <span className="field-label">What do they need to fix?</span>
                          <textarea
                            className="field-input"
                            rows={4}
                            style={{ lineHeight: 1.55, resize: 'vertical' }}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Name the exact document and why"
                          />
                          <span className="field-hint">After you submit, send this to the applicant with the email button.</span>
                        </label>
                      )}
                      {decision === 'approve' && !allChecked && (
                        <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>
                          Tip: tick every checklist item before approving.
                        </p>
                      )}
                      {error && (
                        <div className="form-error" style={{ marginTop: 12 }}>
                          {error}
                        </div>
                      )}
                      <button className={`solid-btn ${decision === 'approve' ? 'ok' : 'bad'}`} onClick={submit} disabled={busy || status !== 'PENDING'}>
                        {busy ? 'Saving…' : decision === 'approve' ? 'Approve account' : 'Request changes'}
                      </button>
                      {status !== 'PENDING' && (
                        <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
                          This account is {STATUS_LABEL[status!].toLowerCase()}, not pending. Change it from User management.
                        </p>
                      )}
                      <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '10px 0 0' }}>
                        Recorded to the audit log against your operator account.
                      </p>
                    </>
                  )}
                </div>

                <div className="card aside-card flat">
                  <div className="t">Account history</div>
                  <div className="timeline">
                    {(history.data ?? []).map((h) => (
                      <span key={h.id}>
                        {formatDateTime(h.createdAt)} · {String(h.metadata?.verificationStatus ?? h.action).toLowerCase()}
                      </span>
                    ))}
                    <span>{formatDateTime(u.createdAt)} · account created</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
