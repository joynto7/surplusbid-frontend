import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import CompanySettingsCard from '../../components/CompanySettingsCard';
import GoogleIcon from '../../components/GoogleIcon';
import { EmptyState, Pill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { NOTIFICATION_PREFS, useNotificationState, type NotificationKind } from '../../lib/buyer';
import './buyer.css';

type Tab = 'company' | 'pay' | 'notify' | 'security';
const TABS: { key: Tab; label: string }[] = [
  { key: 'company', label: 'Company' },
  { key: 'pay', label: 'Payment methods' },
  { key: 'notify', label: 'Notifications' },
  { key: 'security', label: 'Security' },
];

function PaymentTab() {
  return (
    <div className="card" style={{ padding: 24, marginTop: 18 }}>
      <div className="section-title">Saved payment methods</div>
      <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
        Deposits are authorized per lot when you first bid. Final balances are paid at checkout.
      </p>
      <div className="card" style={{ marginTop: 16, boxShadow: 'none' }}>
        <EmptyState
          icon="▭"
          title="No saved methods"
          actions={
            <Link to="/buyer/bids?tab=won" className="btn btn-secondary">
              See orders awaiting payment
            </Link>
          }
        >
          SurplusBid doesn't store cards yet. You enter a card or bank account securely at checkout each time you pay a balance.
        </EmptyState>
      </div>
    </div>
  );
}

function NotifyTab() {
  const { prefs, setPrefs } = useNotificationState();
  const [draft, setDraft] = useState(prefs);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(prefs), [prefs]);

  return (
    <div className="card card-flush" style={{ marginTop: 18 }}>
      <div style={{ padding: '20px 24px 14px' }}>
        <div className="section-title">Notification preferences</div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          Outbid and payment alerts can't be turned off — they affect money you have committed. Preferences are saved on this device.
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
          {NOTIFICATION_PREFS.map((p) => (
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
                    setDraft({ ...draft, [p.kind]: e.target.checked } as Record<NotificationKind, boolean>);
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

function SecurityTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const google = user.authProvider === 'GOOGLE';

  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="section-title">Password</div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          {google
            ? 'You sign in with Google, so there is no SurplusBid password on this account.'
            : 'To change your password, request a reset link. It is sent to your work email.'}
        </p>
        {!google && (
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 16 }}>
            Send a reset link
          </Link>
        )}
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="section-title">Connected accounts</div>
        <div className="method-row" style={{ marginTop: 14 }}>
          <GoogleIcon />
          <span className="main">
            <strong>Google</strong>
            <small>{google ? user.email : 'Not connected'}</small>
          </span>
          {google ? <Pill tone="ok">Connected</Pill> : <Pill>Not connected</Pill>}
        </div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="section-title">This session</div>
        <div className="method-row" style={{ marginTop: 14 }}>
          <span className="main">
            <strong>{navigator.userAgent.includes('Mac') ? 'This Mac' : 'This device'}</strong>
            <small>Signed in as {user.email}</small>
          </span>
          <button
            className="btn-ghost-sm danger"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'company') as Tab;

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 920 }}>
        <h1 className="page-title">Profile and settings</h1>
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
        {tab === 'company' && <CompanySettingsCard />}
        {tab === 'pay' && <PaymentTab />}
        {tab === 'notify' && <NotifyTab />}
        {tab === 'security' && <SecurityTab />}
      </div>
    </AppShell>
  );
}
