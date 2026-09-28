import { Link, Navigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, Pill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { invoiceCode, loadPaymentWithLot, orderCode } from '../../lib/buyer';
import { formatDate, formatDateTime, formatMoney, lotCode, shortCode } from '../../lib/format';
import './buyer.css';

const isoDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

export default function InvoicePage() {
  const { paymentId = '' } = useParams();
  const { user } = useAuth();
  const data = useAsync(() => loadPaymentWithLot(paymentId), [paymentId]);
  const d = data.data;

  if (d && d.payment.status !== 'SUCCEEDED' && d.payment.status !== 'REFUNDED') {
    return <Navigate to={`/buyer/checkout/${paymentId}`} replace />;
  }

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 800 }}>
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <Link to="/buyer" className="back-link">
            ← Back to dashboard
          </Link>
          {d && (
            <button className="btn btn-primary btn-md" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
              Download PDF
            </button>
          )}
        </div>

        {data.error ? (
          <div style={{ marginTop: 14 }}>
            <ErrorBox error={data.error} onRetry={data.reload} />
          </div>
        ) : !d ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="card card-flush invoice" style={{ marginTop: 14 }}>
            <div className="invoice-top">
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.015em' }}>
                  Surplus<span style={{ color: 'var(--blue)' }}>Bid</span>
                </div>
                <div className="addr">
                  SurplusBid, Inc.
                  <br />
                  1200 W 9th Street, Suite 400
                  <br />
                  Cleveland, OH 44113
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.018em' }}>Invoice</div>
                <div className="meta">
                  <span>{invoiceCode(d.payment)}</span>
                  <span>Issued {isoDate(d.payment.createdAt)}</span>
                  <span>Order {orderCode(d.payment)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Pill tone={d.payment.status === 'REFUNDED' ? 'warn' : 'ok'}>{d.payment.status === 'REFUNDED' ? 'Refunded' : 'Paid in full'}</Pill>
                </div>
              </div>
            </div>

            <div className="invoice-parties">
              <div>
                <div className="eyebrow">Billed to</div>
                <div className="v">
                  {user?.companyName}
                  <br />
                  {user?.email}
                  {user?.taxId && (
                    <>
                      <br />
                      <span className="mono" style={{ fontSize: 12.5 }}>
                        Tax ID {user.taxId}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="eyebrow">Seller</div>
                <div className="v">
                  Verified SurplusBid seller
                  <br />
                  <span className="mono" style={{ fontSize: 12.5 }}>
                    Account {shortCode('SELL', d.lot.sellerId)}
                  </span>
                </div>
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="num">Qty</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>
                      {lotCode(d.lot.id)} · {d.lot.title}
                    </span>
                    <span className="muted" style={{ display: 'block', fontSize: 12.5, marginTop: 2 }}>
                      Hammer price, auction closed {formatDateTime(d.lot.endTime)}
                    </span>
                  </td>
                  <td className="num">{d.lot.quantity}</td>
                  <td className="num" style={{ fontSize: 13 }}>
                    {formatMoney(d.hammerCents)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-totals">
              <div>
                <div className="kv">
                  <span>Subtotal</span>
                  <span>{formatMoney(d.hammerCents)}</span>
                </div>
                <div className="kv">
                  <span>Deposit applied</span>
                  <span style={{ color: 'var(--ok-deep)' }}>−{formatMoney(d.depositCents)}</span>
                </div>
                <div className="kv">
                  <span>Final payment {isoDate(d.payment.paidAt)}</span>
                  <span style={{ color: 'var(--ok-deep)' }}>−{formatMoney(d.payment.amountCents)}</span>
                </div>
                <div className="kv grand">
                  <span>Balance</span>
                  <span style={{ fontSize: 22 }}>{formatMoney(0)}</span>
                </div>
              </div>
            </div>

            <div className="invoice-fine">
              Sold as-is, where-is with no warranty expressed or implied. Paid {formatDate(d.payment.paidAt)}. Payments processed by SurplusBid,
              Inc. Questions: <a href="mailto:billing@surplusbid.com">billing@surplusbid.com</a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
