import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { loadPaymentWithLot, orderCode } from '../../lib/buyer';
import { formatDateTime, formatMoney, lotCode } from '../../lib/format';
import './buyer.css';

const POLL_MS = 3000;
const MAX_POLLS = 20;

export default function PaymentSuccessPage() {
  const { paymentId = '' } = useParams();
  const data = useAsync(() => loadPaymentWithLot(paymentId), [paymentId]);
  const polls = useRef(0);

  // Stripe confirms instantly, but the backend flips the payment to SUCCEEDED
  // only when its webhook arrives. Poll briefly until it does.
  const status = data.data?.payment.status;
  useEffect(() => {
    if (status !== 'PENDING' || polls.current >= MAX_POLLS) return;
    const t = window.setTimeout(() => {
      polls.current += 1;
      data.reload();
    }, POLL_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, data.data]);

  const d = data.data;
  const confirmed = status === 'SUCCEEDED';

  return (
    <AppShell>
      <div className="page-narrow">
        {data.error ? (
          <ErrorBox error={data.error} onRetry={data.reload} />
        ) : !d ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="card result-card">
            <Pill tone={confirmed ? 'ok' : 'warn'} dot>
              {confirmed ? 'Paid in full' : 'Confirming payment'}
            </Pill>
            <h1>{lotCode(d.lot.id)} is yours</h1>
            <p>
              {confirmed ? 'We charged' : "We're confirming the charge of"} <span className="mono">{formatMoney(d.payment.amountCents)}</span> and
              applied your <span className="mono">{formatMoney(d.depositCents)}</span> deposit.{' '}
              {confirmed
                ? 'The seller can now release the lot for pickup.'
                : 'This usually takes a few seconds. You can leave this page; the receipt will be ready when it clears.'}
            </p>

            <div className="facts">
              <div>
                <div className="k">Order</div>
                <div className="v">{orderCode(d.payment)}</div>
              </div>
              <div>
                <div className="k">Paid</div>
                <div className="v">{formatMoney(d.hammerCents)}</div>
              </div>
              <div>
                <div className="k">{confirmed ? 'Paid at' : 'Status'}</div>
                <div className="v">{confirmed ? formatDateTime(d.payment.paidAt) : d.payment.status}</div>
              </div>
            </div>

            <div className="steps-title">What happens next</div>
            <div className="step-list">
              <div className="step-item">
                <span className="num">1</span>
                <span className="body">Contact the seller to book a removal slot for {d.lot.title}</span>
                <span className="when">After payment clears</span>
              </div>
              <div className="step-item">
                <span className="num">2</span>
                <span className="body">Send your rigger the lot details and your order number</span>
                <span className="mono when">{orderCode(d.payment)}</span>
              </div>
              <div className="step-item">
                <span className="num">3</span>
                <span className="body">
                  If anything is wrong on pickup, <Link to={`/buyer/disputes/new?lot=${d.lot.id}`}>file a dispute</Link> before funds release
                </span>
                <span className="when">After pickup</span>
              </div>
            </div>

            <div className="row-actions">
              {confirmed ? (
                <Link to={`/buyer/invoices/${d.payment.id}`} className="btn btn-primary btn-lg">
                  View receipt
                </Link>
              ) : (
                <button className="btn btn-primary btn-lg" disabled>
                  Receipt available once confirmed
                </button>
              )}
              <Link to="/buyer" className="btn btn-secondary btn-lg">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
