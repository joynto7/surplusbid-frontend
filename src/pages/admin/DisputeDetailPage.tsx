import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill, errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { accountCode, auditFor, caseCode, isMissingEndpoint } from '../../lib/admin';
import { ApiError, api, type Dispute } from '../../lib/api';
import { currentPrice } from '../../lib/buyer';
import { formatDateTime, formatMoney, isUuid, lotCode } from '../../lib/format';
import NotFoundPage from '../system/NotFoundPage';
import MissingEndpoint from './MissingEndpoint';
import '../buyer/buyer.css';
import './admin.css';

const DAY = 24 * 3600 * 1000;
type Outcome = 'RESOLVED' | 'REJECTED';

async function loadCase(id: string) {
  const dispute = await api.dispute(id);
  const lot = await api.lot(dispute.lotId).catch(() => undefined);
  return { dispute, lot };
}

export default function DisputeDetailPage() {
  const { id = '' } = useParams();
  const now = useNow(60_000);
  const data = useAsync(() => loadCase(id), [id]);
  const timeline = useAsync(() => auditFor('Dispute', id), [id]);
  const [outcome, setOutcome] = useState<Outcome>('RESOLVED');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [resolved, setResolved] = useState<Dispute>();

  if (!isUuid(id) || (data.error instanceof ApiError && data.error.status === 404 && !isMissingEndpoint(data.error))) return <NotFoundPage />;

  async function submit() {
    if (note.trim().length < 3) return setError('Write decision notes both parties can read cold.');
    setBusy(true);
    setError(undefined);
    try {
      setResolved(await api.resolveDispute(id, { status: outcome, resolutionNote: note.trim() }));
      timeline.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const d = resolved ?? data.data?.dispute;
  const lot = data.data?.lot;
  const closed = d && (d.status === 'RESOLVED' || d.status === 'REJECTED');
  const filedBySeller = d && lot && d.raisedById === lot.sellerId;
  const days = d ? Math.max(0, Math.floor((now - new Date(d.createdAt).getTime()) / DAY)) : 0;
  const filer = filedBySeller ? 'seller' : 'buyer';

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1120 }}>
        <Link to="/admin/disputes" className="back-link">
          ← Back to dispute queue
        </Link>

        {isMissingEndpoint(data.error) ? (
          <div style={{ marginTop: 16 }}>
            <MissingEndpoint what="This dispute" endpoint="GET /disputes/:id" />
          </div>
        ) : data.error ? (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={data.error} onRetry={data.reload} />
          </div>
        ) : !d ? (
          <p className="muted">Loading case…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginTop: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <span className="mono muted" style={{ fontSize: 12, fontWeight: 600 }}>
                    {caseCode(d.id)}
                  </span>
                  {closed ? (
                    <Pill tone={d.status === 'RESOLVED' ? 'ok' : ''}>{d.status === 'RESOLVED' ? 'Resolved' : 'Rejected'}</Pill>
                  ) : (
                    <Pill tone="bad">
                      Open {days} day{days === 1 ? '' : 's'}
                    </Pill>
                  )}
                  <Pill tone="info">Filed by the {filer}</Pill>
                </div>
                <h1 className="page-title" style={{ marginTop: 8 }}>
                  {d.reason} · {lotCode(d.lotId)}
                </h1>
                <p className="page-lede" style={{ fontSize: 13.5, marginTop: 5 }}>
                  {lot ? `${lot.title} · ${formatMoney(currentPrice(lot))} ${lot.status === 'SOLD' ? 'hammer' : 'current'} · ${lot.status.toLowerCase()}` : 'Lot details unavailable'}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  Filed
                </div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--warn-deep)' }}>
                  {formatDateTime(d.createdAt)}
                </div>
              </div>
            </div>

            <div className="case-grid">
              <div className="card card-flush party">
                <div>
                  <div className="role">{filedBySeller ? 'Seller · filed the case' : 'Buyer · filed the case'}</div>
                  <div className="who">{accountCode(d.raisedById)}</div>
                  <div className="sub">{filedBySeller ? 'Listed this lot' : 'Winning bidder on this lot'}</div>
                </div>
                <div>
                  <div className="k">Filed {formatDateTime(d.createdAt)}</div>
                  <p>{d.description}</p>
                </div>
                <div>
                  <div className="k">Evidence</div>
                  <p className="muted" style={{ fontSize: 12.5 }}>
                    Disputes can't carry attachments yet. Ask the {filer} to email photos or documents to support@surplusbid.com with{' '}
                    <span className="mono">{caseCode(d.id)}</span>.
                  </p>
                </div>
              </div>

              <div className="card card-flush party seller">
                <div>
                  <div className="role">{filedBySeller ? 'Listing' : 'Seller'}</div>
                  <div className="who">{lot ? accountCode(lot.sellerId) : '—'}</div>
                  <div className="sub">{lot ? `${lotCode(lot.id)} · ${lot.condition}` : ''}</div>
                </div>
                <div>
                  <div className="k">Listing text as published</div>
                  <p>{lot ? `“${lot.description}”` : 'The lot could not be loaded.'}</p>
                </div>
                <div>
                  <div className="k">Listing photos · {lot?.images.length ?? 0} files</div>
                  {lot && lot.images.length > 0 ? (
                    <div className="thumbs">
                      {lot.images.slice(0, 6).map((src) => (
                        <a key={src} href={src} target="_blank" rel="noreferrer">
                          <img src={src} alt="" className="img-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ fontSize: 12.5 }}>
                      No photos on this listing.
                    </p>
                  )}
                  {lot && (
                    <Link to={`/lots/${lot.id}`} style={{ fontSize: 12.5, fontWeight: 500, display: 'inline-block', marginTop: 10 }}>
                      Open the lot page
                    </Link>
                  )}
                </div>
              </div>

              <aside className="sticky-aside">
                <div className="card" style={{ padding: 18 }}>
                  <div className="card-title">Resolution</div>
                  {closed ? (
                    <>
                      <div className={d.status === 'RESOLVED' ? 'form-ok' : 'form-error'} style={{ marginTop: 14 }}>
                        {d.status === 'RESOLVED' ? `Resolved in the ${filer}'s favour` : 'Rejected as unsubstantiated'}
                        {d.resolvedAt ? ` on ${formatDateTime(d.resolvedAt)}` : ''}.
                      </div>
                      {d.resolutionNote && (
                        <>
                          <div className="field-label" style={{ marginTop: 14 }}>
                            Decision notes
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--body)', margin: 0, whiteSpace: 'pre-line' }}>{d.resolutionNote}</p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gap: 8, marginTop: 14 }} role="radiogroup" aria-label="Resolution">
                        {(
                          [
                            ['RESOLVED', 'ok', `Resolve in the ${filer}'s favour`, 'Upholds the case. Arrange any refund or return with billing.'],
                            ['REJECTED', 'bad', 'Reject as unsubstantiated', 'Closes the case with no change. The sale stands.'],
                          ] as const
                        ).map(([key, tone, label, text]) => (
                          <button type="button" key={key} role="radio" aria-checked={outcome === key} className={`choice tone-${tone} ${outcome === key ? 'active' : ''}`} onClick={() => setOutcome(key)}>
                            <span className="row">
                              <span className="dot" />
                              <span className="text">
                                <span className="label">{label}</span>
                                <span className="note">{text}</span>
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                      <label style={{ display: 'block', marginTop: 14 }}>
                        <span className="field-label">Decision notes</span>
                        <textarea className="field-input" rows={5} style={{ lineHeight: 1.55, resize: 'vertical' }} value={note} onChange={(e) => setNote(e.target.value)} />
                        <span className="field-hint">Stored with the case. Write for someone reading it cold.</span>
                      </label>
                      {error && (
                        <div className="form-error" style={{ marginTop: 12 }}>
                          {error}
                        </div>
                      )}
                      <button className={`solid-btn ${outcome === 'RESOLVED' ? 'ok' : 'neutral'}`} onClick={submit} disabled={busy}>
                        {busy ? 'Saving…' : outcome === 'RESOLVED' ? 'Resolve the case' : 'Reject the dispute'}
                      </button>
                      <p className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '10px 0 0' }}>
                        Recorded to the audit log against your operator account. No funds move automatically.
                      </p>
                    </>
                  )}
                </div>

                <div className="card aside-card flat">
                  <div className="t">Case timeline</div>
                  <div className="timeline">
                    <span>{formatDateTime(d.createdAt)} · {filer} filed</span>
                    {(timeline.data ?? [])
                      .slice()
                      .reverse()
                      .map((t) => (
                        <span key={t.id}>
                          {formatDateTime(t.createdAt)} · {String(t.metadata?.status ?? t.action).toLowerCase()} by {t.actorId ? accountCode(t.actorId) : 'system'}
                        </span>
                      ))}
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
