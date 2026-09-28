import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import CompanySettingsCard from '../../components/CompanySettingsCard';
import { EmptyState } from '../../components/ui';
import { SELLER_NOTIFICATION_PREFS, useSellerNotificationState, type SellerNotificationKind } from '../../lib/seller';
import '../buyer/buyer.css';
import './seller.css';

type Tab = 'company' | 'bank' | 'notify';
const TABS: { key: Tab; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'bank', label: 'Payout account' },
  { key: 'notify', label: 'Notifications' },
];

function NotifyTab() {
  const { prefs, setPrefs } = useSellerNotificationState();
  const [draft, setDraft] = useState(prefs);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(prefs), [prefs]);

  return (
    <div className="card card-flush" style={{ marginTop: 18 }}>
      <div style={{ padding: '20px 24px 14px' }}>
        <div className="section-title">Notification preferences</div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          Sale alerts can't be turned off — they affect money and deadlines. Preferences are saved on this device.
        </p>
      </div>
      <table className="table pref-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>In-app</th>
          </tr>
        </thead>
        <tbody>
          {SELLER_NOTIFICATION_PREFS.map((p) => (
            <tr key={p.kind}>
              <td>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>{p.label}</span>
                <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                  {p.note}
                </span>
              </td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`${p.label} in-app`}
                  checked={p.locked ? true : draft[p.kind] !== false}
                  disabled={p.locked}
                  onChange={(e) => {
                    setSaved(false);
                    setDraft({ ...draft, [p.kind as SellerNotificationKind]: e.target.checked });
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          className="btn-primary btn"
          onClick={() => {
            setPrefs(draft);
            setSaved(true);
          }}
        >
          Save preferences
        </button>
        {saved && <span style={{ fontSize: 12.5, color: 'var(--ok-deep)' }}>Saved.</span>}
      </div>
    </div>
  );
}

export default function SellerSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'company') as Tab;

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 920 }}>
        <h1 className="page-title">Seller profile and settings</h1>
        <div className="tabs" role="tablist" style={{ marginTop: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setParams(t.key === 'company' ? {} : { tab: t.key }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'company' && <CompanySettingsCard note="Buyers see your company name on every lot you list." />}
        {tab === 'bank' && (
          <div className="card" style={{ padding: 24, marginTop: 18 }}>
            <div className="section-title">Payout account</div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              Proceeds go to a bank account in the company's legal name.
            </p>
            <div className="card" style={{ marginTop: 16, boxShadow: 'none' }}>
              <EmptyState
                icon="⌂"
                title="No payout account on file"
                actions={
                  <a href="mailto:billing@surplusbid.com?subject=Seller%20payout%20account" className="btn btn-secondary">
                    Email billing
                  </a>
                }
              >
                Payout accounts are set up with SurplusBid billing for now. Send them your bank details and a voided check from the company's
                account.
              </EmptyState>
            </div>
          </div>
        )}
        {tab === 'notify' && <NotifyTab />}
      </div>
    </AppShell>
  );
}
