import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { loadPaymentWithLot, orderCode } from '../../lib/buyer';
import { formatClock, formatDateTime, formatMoney, lotCode } from '../../lib/format';
import { attemptLog } from '../../lib/stripe';
import './buyer.css';

export default function PaymentFailedPage() {
  const { paymentId = '' } = useParams();
  const now = useNow();
  const data = useAsync(() => loadPaymentWithLot(paymentId), [paymentId]);
  const attempts = attemptLog.read(paymentId);
  const last = attempts[0];
  const d = data.data;

  return (
    <AppShell>
      <div className="page-narrow">
        {data.error ? (
          <ErrorBox error={data.error} onRetry={data.reload} />
        ) : !d ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="card result-card">
            <Pill tone="bad" dot>
              Payment declined
            </Pill>
            <h1>The {formatMoney(d.payment.amountCents)} charge didn't go through</h1>
            <p>
              {last ? (
                <>
                  Your payment provider returned <strong>{last.message.replace(/\.$/, '')}</strong>.{' '}
                </>
              ) : null}
              Nothing was charged for the balance, and your {formatMoney(d.depositCents)} deposit is still applied. {lotCode(d.lot.id)} is still
              yours as long as payment arrives before the deadline.
            </p>

            <div className="callout bad" style={{ marginTop: 20 }}>
              <span className="body">
                If payment isn't received by <span className="mono">{formatDateTime(d.payment.dueAt)}</span>, the lot forfeits to the next
                bidder and your {formatMoney(d.depositCents)} deposit is kept.
              </span>
              <span className="clock">
                <span className="k">Time remaining</span>
                <span className="v">{formatClock(new Date(d.payment.dueAt).getTime() - now)}</span>
              </span>
            </div>

            <div className="steps-title">How to fix it</div>
            <div className="step-list">
              <div className="step-item">
                <span className="body">
                  <strong>Ask your bank to raise the limit, then retry</strong>
                  <small>Most commercial cards lift a single-charge cap by phone in minutes.</small>
                </span>
                <Link to={`/buyer/checkout/${d.payment.id}`} className="btn btn-primary btn-md">
                  Retry payment
                </Link>
              </div>
              <div className="step-item">
                <span className="body">
                  <strong>Use a different card or account</strong>
                  <small>Enter a new payment method on the checkout page.</small>
                </span>
                <Link to={`/buyer/checkout/${d.payment.id}`} className="btn btn-secondary btn-md">
                  Change method
                </Link>
              </div>
            </div>

            {attempts.length > 0 && (
              <div className="attempt-log">
                <div style={{ fontSize: 13, fontWeight: 600 }}>Attempt log</div>
                <div className="lines">
                  {attempts.map((a) => (
                    <span key={a.at}>
                      {new Date(a.at).toLocaleTimeString('en-US', { hour12: false })} · {formatMoney(a.amountCents)} · declined
                      {a.code ? ` · ${a.code}` : ''}
                    </span>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
                  Reference this log if you contact support: <span className="mono">{orderCode(d.payment)}</span>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
