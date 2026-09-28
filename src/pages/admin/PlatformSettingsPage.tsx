import AppShell from '../../components/AppShell';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../lib/api';
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from '../../lib/buyer';
import { formatMoney } from '../../lib/format';
import '../buyer/buyer.css';
import './admin.css';

function Setting({ label, value, unit, env, hint }: { label: string; value: string; unit: string; env: string; hint: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="field-label">{label}</span>
      <span className="unit-input">
        <span className="val">{value}</span>
        <span className="unit">{unit}</span>
      </span>
      <span className="field-hint">
        {hint} Set by <span className="env-name">{env}</span>.
      </span>
    </label>
  );
}

function Fixed({ title, text }: { title: string; text: string }) {
  return (
    <label className="radio-card" style={{ cursor: 'default' }}>
      <input type="checkbox" checked disabled />
      <span>
        <span className="t">{title}</span>
        <span className="n">{text}</span>
      </span>
    </label>
  );
}

export default function PlatformSettingsPage() {
  const stats = useAsync(() => api.adminStats(), []);
  const example = 1_000_000; // $10,000 hammer
  const deposit = Math.round(example * (DEPOSIT_PERCENT / 100));

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 880 }}>
        <h1 className="page-title">Platform settings</h1>
        <p className="page-lede" style={{ maxWidth: '64ch' }}>
          The terms every lot runs under. They're set in the backend's environment, so this page shows the current values rather than editing
          them.
        </p>

        <div className="callout warn" style={{ marginTop: 18 }}>
          <span className="body">
            {stats.data ? `${stats.data.activeLots.toLocaleString('en-US')} auctions are live. ` : ''}To change a value, update the environment variable
            on the API server and restart it. Changes apply to every lot straight away, including live ones.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div className="card card-pad">
            <div className="section-title">Deposits</div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              Authorized when a buyer first bids on a lot. Applied to the balance if they win, released if they don't.
            </p>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 260px))', gap: 12, marginTop: 16 }}>
              <Setting label="Deposit rate" value={DEPOSIT_PERCENT.toFixed(1)} unit="%" env="DEPOSIT_PERCENT" hint="Of the lot's starting price." />
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-title">Payment deadlines</div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              How long a winning buyer has to pay the balance before the lot forfeits.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 260px))', gap: 12, marginTop: 16 }}>
              <Setting label="Payment window" value={String(PAYMENT_DEADLINE_HOURS)} unit="hours" env="PAYMENT_DEADLINE_HOURS" hint="From the auction close." />
            </div>
            <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
              <Fixed title="Forfeit the deposit on non-payment" text="Always on. The overdue-payment job captures the deposit and rolls the lot over." />
              <Fixed title="Anti-sniping extension" text="Always on. A bid in the final 2 minutes pushes the close out 2 minutes." />
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-title">Fees</div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              The backend doesn't charge a platform fee or buyer premium yet. Buyers pay the hammer price and sellers receive it in full.
            </p>
            <div className="card aside-card flat" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Worked example on a {formatMoney(example)} hammer price</div>
              <div className="mini-kv">
                <span>
                  <span>Buyer's deposit ({DEPOSIT_PERCENT}% of a {formatMoney(example)} start)</span>
                  <span>{formatMoney(deposit)}</span>
                </span>
                <span>
                  <span>Balance the buyer pays at checkout</span>
                  <span>{formatMoney(example - deposit)}</span>
                </span>
                <span className="sum">
                  <span>Seller receives</span>
                  <span>{formatMoney(example)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
          Values shown come from this frontend's <span className="env-name">VITE_DEPOSIT_PERCENT</span> /{' '}
          <span className="env-name">VITE_PAYMENT_DEADLINE_HOURS</span>, which should mirror the API server's settings.
        </p>
      </div>
    </AppShell>
  );
}
