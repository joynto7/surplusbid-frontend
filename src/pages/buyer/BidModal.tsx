import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../components/ui';
import { ApiError, api, type Bid, type Lot } from '../../lib/api';
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS, depositFor, holds } from '../../lib/buyer';
import { formatMoney, lotCode, shortCode } from '../../lib/format';

type Step = 'deposit' | 'review' | 'placed';

const STEPS: { key: Step; label: string }[] = [
  { key: 'deposit', label: '1 DEPOSIT' },
  { key: 'review', label: '2 REVIEW' },
  { key: 'placed', label: '3 PLACED' },
];

/**
 * Deposit → review → placed. The design has a separate card-entry step, but
 * POST /lots/:id/deposit authorizes the hold server-side without taking card
 * details from the client, so that step is folded into "Authorize deposit".
 */
export default function BidModal({
  lot,
  amountCents,
  onClose,
  onPlaced,
}: {
  lot: Lot;
  amountCents: number;
  onClose: () => void;
  onPlaced: (bid: Bid) => void;
}) {
  const [step, setStep] = useState<Step>(() => (holds.has(lot.id) ? 'review' : 'deposit'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [bid, setBid] = useState<Bid>();
  const deposit = depositFor(lot);
  const code = lotCode(lot.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function authorize() {
    setBusy(true);
    setError(undefined);
    try {
      await api.authorizeDeposit(lot.id);
      holds.add(lot.id);
      setStep('review');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && /already exists/i.test(err.message)) {
        holds.add(lot.id);
        setStep('review');
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  async function place() {
    setBusy(true);
    setError(undefined);
    try {
      const placed = await api.placeBid(lot.id, amountCents);
      setBid(placed);
      setStep('placed');
      onPlaced(placed);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && /deposit/i.test(err.message)) {
        setStep('deposit');
        setError('We need a deposit hold on this lot before your bid can be recorded.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError("You're bidding too quickly. Wait a few seconds and try again.");
      } else {
        const msg = errorMessage(err);
        const min = /at least (\d+) cents/.exec(msg);
        setError(min ? `Someone bid first. The minimum is now ${formatMoney(Number(min[1]))}.` : msg);
      }
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="bid-modal-title">
        <div className="modal-bar">
          <button className="x" onClick={onClose} disabled={busy} aria-label="Close">
            ×
          </button>
          <span className="eyebrow" style={{ marginLeft: 'auto' }}>
            Deposit authorization · {code}
          </span>
        </div>
        <div className="modal-steps">
          {STEPS.map((s, i) => (
            <span key={s.key} className={i === stepIndex ? 'on' : i < stepIndex ? 'done' : ''}>
              {s.label}
            </span>
          ))}
        </div>

        {step === 'deposit' && (
          <div className="modal-body">
            <h2 id="bid-modal-title">Authorize your deposit</h2>
            <p>
              This holds <strong className="mono">{formatMoney(deposit)}</strong> against your account. It's applied to the price if you win,
              and released if the lot closes to another bidder.
            </p>
            <div className="receipt">
              <div>
                <span>Lot</span>
                <span>
                  {code} · {lot.title}
                </span>
              </div>
              <div>
                <span>Your bid</span>
                <span>{formatMoney(amountCents)}</span>
              </div>
              <div>
                <span>Deposit rate</span>
                <span>{DEPOSIT_PERCENT}% of starting bid</span>
              </div>
              <div className="hl">
                <span className="eyebrow" style={{ alignSelf: 'center' }}>
                  Hold amount
                </span>
                <span>{formatMoney(deposit)}</span>
              </div>
            </div>
            {error && <div className="bid-error">{error}</div>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={authorize} disabled={busy}>
                {busy ? 'Authorizing…' : 'Authorize deposit'}
              </button>
              <button className="btn-secondary" onClick={onClose} disabled={busy}>
                BACK TO LOT
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="modal-body">
            <h2 id="bid-modal-title">Confirm bid and hold</h2>
            <div className="receipt" style={{ marginTop: 14 }}>
              <div>
                <span>BID</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{formatMoney(amountCents)}</span>
              </div>
              <div>
                <span>HOLD</span>
                <span>{formatMoney(deposit)} · authorized</span>
              </div>
              <div>
                <span>DUE IF WON</span>
                <span>{formatMoney(amountCents - deposit)} after deposit</span>
              </div>
            </div>
            <div className="form-error" style={{ marginTop: 12 }}>
              Your bid is binding. If you win and don't pay within {PAYMENT_DEADLINE_HOURS} hours, the deposit is forfeited and the lot
              is re-offered.
            </div>
            {error && <div className="bid-error">{error}</div>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={place} disabled={busy}>
                {busy ? 'Placing bid…' : `Place bid — ${formatMoney(amountCents)}`}
              </button>
              <button className="btn-secondary" onClick={onClose} disabled={busy}>
                CANCEL
              </button>
            </div>
          </div>
        )}

        {step === 'placed' && bid && (
          <div className="modal-body" style={{ textAlign: 'center' }}>
            <div className="stamp">RECORDED</div>
            <h2 id="bid-modal-title" style={{ fontSize: 20, marginTop: 20 }}>
              You're the high bidder
            </h2>
            <p style={{ maxWidth: '38ch', margin: '9px auto 0' }}>
              {formatMoney(deposit)} is held for {code}. Check My bids to see if you're outbid; the hold is released if you don't win.
            </p>
            <div className="receipt" style={{ marginTop: 18, textAlign: 'left' }}>
              <div>
                <span>BID RECORDED</span>
                <span>{new Date(bid.createdAt).toLocaleString('en-US', { hour12: false })}</span>
              </div>
              <div>
                <span>RECEIPT</span>
                <span>{shortCode('BID', bid.id)}</span>
              </div>
              <div>
                <span>STATUS</span>
                <span style={{ color: 'var(--warn)', fontWeight: 600 }}>WINNING</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={onClose} style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.03em', padding: '11px 0' }}>
                BACK TO LOT
              </button>
              <Link to="/buyer/bids" className="btn-secondary" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                VIEW MY BIDS
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
