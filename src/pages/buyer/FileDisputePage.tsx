import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill, errorMessage } from '../../components/ui';
import { api, type Dispute } from '../../lib/api';
import { orderCode, useBuyerActivity } from '../../lib/buyer';
import { lotCode, shortCode } from '../../lib/format';
import './buyer.css';

const REASONS = [
  { key: 'notasdesc', label: 'Item not as described', note: 'Condition, model, quantity or completeness differs from the listing.' },
  { key: 'missing', label: 'Parts missing on pickup', note: 'The lot was incomplete compared with the photos or description.' },
  { key: 'access', label: 'Removal access denied', note: 'The seller would not release the lot or the dock was unavailable.' },
  { key: 'damage', label: 'Damaged after the auction closed', note: 'The lot was damaged between inspection and removal.' },
  { key: 'other', label: 'Something else', note: 'Describe it below and an operator will route the case.' },
];

const MAX = 4000;
const MIN = 10;

export default function FileDisputePage() {
  const [params] = useSearchParams();
  const { activity, error, loading, reload } = useBuyerActivity();
  const won = activity?.rows.filter((r) => r.state === 'WON') ?? [];

  const [lotId, setLotId] = useState(params.get('lot') ?? '');
  const [reason, setReason] = useState('notasdesc');
  const [description, setDescription] = useState('');
  const [attest, setAttest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [filed, setFiled] = useState<Dispute>();

  useEffect(() => {
    if (!lotId && won.length) setLotId(won[0].lot.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won.length]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (description.trim().length < MIN) return setSubmitError(`Describe what happened in at least ${MIN} characters.`);
    setBusy(true);
    setSubmitError(undefined);
    try {
      const label = REASONS.find((r) => r.key === reason)!.label;
      setFiled(await api.createDispute({ lotId, reason: label, description: description.trim() }));
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const selected = won.find((r) => r.lot.id === lotId);

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 880 }}>
        <Link to="/buyer" className="back-link">
          ← Back to dashboard
        </Link>
        <h1 className="page-title">File a dispute</h1>
        <p className="page-lede" style={{ maxWidth: '64ch' }}>
          Open a case if a lot was not as described, access was denied, or something is missing. Funds stay held until an operator decides.
          Most cases are resolved in three business days.
        </p>

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="dispute-grid">
          {filed ? (
            <div className="card result-card" style={{ minWidth: 0 }}>
              <Pill tone="info" dot>
                Case opened
              </Pill>
              <h1 style={{ fontSize: 24 }}>We've opened {shortCode('CASE', filed.id)}</h1>
              <p>
                An operator will review your case on {selected ? lotCode(selected.lot.id) : 'this lot'} and may contact you at your work email for
                photos or documents. Don't scrap, modify or resell the lot until the case closes.
              </p>
              <div className="row-actions">
                <Link to="/buyer" className="btn btn-primary btn-lg">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : loading && !activity ? (
            <div className="card card-pad muted">Loading your orders…</div>
          ) : won.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="⚖"
                title="No orders to dispute"
                actions={
                  <Link to="/buyer/bids" className="btn btn-secondary">
                    View my bids
                  </Link>
                }
              >
                Disputes can be filed on lots you've won. Once you win a lot, it will be listed here.
              </EmptyState>
            </div>
          ) : (
            <form className="card" style={{ padding: 24, minWidth: 0 }} onSubmit={submit}>
              <label>
                <span className="field-label">Which order?</span>
                <select className="field-input" value={lotId} onChange={(e) => setLotId(e.target.value)} required>
                  {won.map((r) => (
                    <option key={r.lot.id} value={r.lot.id}>
                      {r.payment ? `${orderCode(r.payment)} · ` : ''}
                      {lotCode(r.lot.id)} · {r.lot.title}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ marginTop: 18 }} role="radiogroup" aria-label="What went wrong?">
                <div className="field-label" style={{ marginBottom: 8 }}>
                  What went wrong?
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {REASONS.map((r) => (
                    <button
                      type="button"
                      key={r.key}
                      role="radio"
                      aria-checked={reason === r.key}
                      className={`choice ${reason === r.key ? 'active' : ''}`}
                      onClick={() => setReason(r.key)}
                    >
                      <span className="row">
                        <span className="dot" />
                        <span className="text">
                          <span className="label">{r.label}</span>
                          <span className="note">{r.note}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'block', marginTop: 18 }}>
                <span className="field-label">What happened?</span>
                <textarea
                  className="field-input"
                  rows={6}
                  maxLength={MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ lineHeight: 1.55, resize: 'vertical' }}
                  required
                />
                <span className="counter-row">
                  <span className="muted" style={{ fontSize: 12 }}>
                    Dates, names and what you want to happen all help.
                  </span>
                  <span className="mono muted" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                    {description.length} / {MAX}
                  </span>
                </span>
              </label>

              <label className="check-line">
                <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
                Everything I've described is accurate, and I understand that filing a knowingly false dispute can suspend my account.
              </label>

              {submitError && (
                <div className="form-error" style={{ marginTop: 14 }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                <button className="btn-primary btn btn-lg" type="submit" disabled={!attest || !lotId || busy}>
                  {busy ? 'Submitting…' : 'Submit dispute'}
                </button>
                <Link to="/buyer" className="btn-link">
                  Cancel
                </Link>
              </div>
            </form>
          )}

          <aside className="aside-stack">
            <div className="card aside-card rule">
              <div className="t">While a case is open</div>
              <p>The seller's payout stays held. Don't scrap, modify or resell the lot until the case closes.</p>
            </div>
            <div className="card aside-card">
              <div className="t">What operators look for</div>
              <div className="check-list">
                <div>
                  <span className="tick">✓</span>Photos taken before the lot moved
                </div>
                <div>
                  <span className="tick">✓</span>The listing text or condition report you relied on
                </div>
                <div>
                  <span className="tick">✓</span>Written messages with the seller
                </div>
              </div>
              <p>Keep these ready — the operator will ask for them by email after you file.</p>
            </div>
            <div className="card aside-card flat">
              <div className="t">Deadline</div>
              <p>Disputes must be filed within 7 days of removal, or 14 days of payment if the lot was never released.</p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
