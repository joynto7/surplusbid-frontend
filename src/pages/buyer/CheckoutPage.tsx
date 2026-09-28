import { useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, errorMessage } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { ApiError, api } from '../../lib/api';
import { PAYMENT_DEADLINE_HOURS, loadPaymentWithLot } from '../../lib/buyer';
import { formatClock, formatDateTime, formatMoney, lotCode } from '../../lib/format';
import { attemptLog, stripeAppearance, stripePromise } from '../../lib/stripe';
import './buyer.css';

type Removal = 'self' | 'quote';

function PayForm({ paymentId, amountCents }: { paymentId: string; amountCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(undefined);

    // Validate the card form before touching the backend: /payments/initiate
    // captures the deposit hold, so only call it once the buyer is ready to pay.
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setBusy(false);
      return;
    }

    let clientSecret: string | null;
    try {
      ({ clientSecret } = await api.initiatePayment(paymentId));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'This payment has already been processed. Refresh the page to see its status.'
          : errorMessage(err)
      );
      setBusy(false);
      return;
    }
    if (!clientSecret) {
      setError('The payment provider did not return a checkout session. Try again in a moment.');
      setBusy(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}/buyer/checkout/${paymentId}/success` },
    });

    if (result.error) {
      // Card declines etc. go to the failed page; form-level problems stay here.
      if (result.error.type === 'card_error' || result.error.type === 'invalid_request_error') {
        attemptLog.add(paymentId, {
          at: new Date().toISOString(),
          amountCents,
          message: result.error.message ?? 'Payment declined',
          code: result.error.decline_code ?? result.error.code,
        });
        navigate(`/buyer/checkout/${paymentId}/failed`);
      } else {
        setError(result.error.message);
        setBusy(false);
      }
      return;
    }
    navigate(`/buyer/checkout/${paymentId}/success`);
  }

  return (
    <form id="pay-form" onSubmit={pay}>
      <div className="stripe-slot">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <div className="form-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn-primary btn btn-lg btn-block" style={{ marginTop: 16 }} disabled={!stripe || busy}>
        {busy ? 'Processing…' : `Pay ${formatMoney(amountCents)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { paymentId = '' } = useParams();
  const { user } = useAuth();
  const now = useNow();
  const [removal, setRemoval] = useState<Removal>('self');
  const data = useAsync(() => loadPaymentWithLot(paymentId), [paymentId]);

  if (data.error instanceof ApiError && data.error.status === 404) return <Navigate to="/buyer/bids?tab=won" replace />;
  if (data.data?.payment.status === 'SUCCEEDED') return <Navigate to={`/buyer/checkout/${paymentId}/success`} replace />;

  const d = data.data;
  const left = d ? new Date(d.payment.dueAt).getTime() - now : 0;
  const expired = d ? left <= 0 : false;

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1040 }}>
        <Link to="/buyer" className="back-link">
          ← Back to dashboard
        </Link>
        {data.error ? (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={data.error} onRetry={data.reload} />
          </div>
        ) : !d ? (
          <p className="muted" style={{ fontSize: 13 }}>
            Loading order…
          </p>
        ) : (
          <>
            <h1 className="page-title">Pay the balance on {lotCode(d.lot.id)}</h1>
            <p className="page-lede">
              {d.lot.title} · {d.lot.condition} · qty {d.lot.quantity}
            </p>

            <div className={`callout ${expired ? 'bad' : 'warn'}`} style={{ marginTop: 18 }}>
              <span className="body">
                {expired
                  ? 'The payment deadline has passed. The lot may already have been re-offered and your deposit kept.'
                  : `Payment is due within ${PAYMENT_DEADLINE_HOURS} hours of close. If it isn't received by ${formatDateTime(d.payment.dueAt)}, the lot forfeits to the next bidder and your deposit is kept.`}
              </span>
              <span className="clock">
                <span className="k">Time remaining</span>
                <span className="v">{formatClock(left)}</span>
              </span>
            </div>

            {d.payment.status === 'FAILED' && (
              <div className="callout bad" style={{ marginTop: 12 }}>
                <span className="body">
                  An earlier charge for this order failed. If paying again is refused, write to{' '}
                  <a href="mailto:billing@surplusbid.com">billing@surplusbid.com</a> with reference {lotCode(d.lot.id)}.
                </span>
              </div>
            )}

            <div className="checkout-grid">
              <div className="card card-pad" style={{ minWidth: 0 }}>
                <div className="section-title">Payment method</div>
                {stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      mode: 'payment',
                      amount: d.payment.amountCents,
                      currency: 'usd',
                      appearance: stripeAppearance,
                      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }],
                    }}
                  >
                    <PayForm paymentId={d.payment.id} amountCents={d.payment.amountCents} />
                  </Elements>
                ) : (
                  <div className="form-error" style={{ marginTop: 14 }}>
                    Card payments aren't configured on this deployment. Set <span className="mono">VITE_STRIPE_PUBLISHABLE_KEY</span> to enable
                    checkout.
                  </div>
                )}
                <label className="field-label" style={{ marginTop: 16 }}>
                  Billing entity
                  <input className="field-input readonly" readOnly value={user?.companyName ?? ''} style={{ marginTop: 6 }} />
                </label>

                <div className="section-title divider-title">Removal</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  <label className="radio-card">
                    <input type="radio" name="removal" checked={removal === 'self'} onChange={() => setRemoval('self')} />
                    <span>
                      <span className="t">I'll arrange my own rigging and pickup</span>
                      <span className="n">Coordinate a slot with the seller after payment clears.</span>
                    </span>
                  </label>
                  <label className="radio-card">
                    <input type="radio" name="removal" checked={removal === 'quote'} onChange={() => setRemoval('quote')} />
                    <span>
                      <span className="t">Request a rigging quote</span>
                      <span className="n">
                        Write to <a href="mailto:logistics@surplusbid.com">logistics@surplusbid.com</a> with {lotCode(d.lot.id)} after paying.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <aside className="card card-flush summary">
                <div className="card-head">
                  <span className="card-title">Order summary</span>
                </div>
                <div className="summary-body">
                  <div className="kv">
                    <span>Hammer price</span>
                    <span>{formatMoney(d.hammerCents)}</span>
                  </div>
                  <div className="kv total">
                    <span>Order total</span>
                    <span>{formatMoney(d.hammerCents)}</span>
                  </div>
                  <div className="kv ok">
                    <span>Deposit applied</span>
                    <span>−{formatMoney(d.depositCents)}</span>
                  </div>
                  <div className="kv grand">
                    <span>Balance due now</span>
                    <span>{formatMoney(d.payment.amountCents)}</span>
                  </div>
                  <p className="fine" style={{ margin: '4px 0 0', fontSize: 11.5 }}>
                    Pay with the button under the payment form. Funds are held by SurplusBid and released to the seller once the lot is
                    removed.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
