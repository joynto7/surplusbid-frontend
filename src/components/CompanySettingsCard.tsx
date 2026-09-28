import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { Pill, errorMessage } from './ui';

export default function CompanySettingsCard({ note }: { note?: string }) {
  const { user, refreshUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName ?? '');
  const [taxId, setTaxId] = useState(user?.taxId ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  if (!user) return null;

  const dirty = companyName !== user.companyName || taxId !== (user.taxId ?? '');
  const verified = user.verificationStatus === 'VERIFIED';

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(undefined);
    try {
      await api.updateProfile({ companyName: companyName.trim(), taxId: taxId.trim() || undefined });
      await refreshUser();
      setMsg({ ok: true, text: 'Saved.' });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" style={{ padding: 24, marginTop: 18 }} onSubmit={save}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div className="section-title">Company information</div>
        {verified ? (
          <Pill tone="ok">Verified</Pill>
        ) : (
          <Link to="/verification-status">
            <Pill tone="warn">{user.verificationStatus === 'PENDING' ? 'Verification pending' : 'Not verified'}</Pill>
          </Link>
        )}
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
        {note ?? 'This is the entity invoices are billed to.'} Account opened {formatDate(user.createdAt)}.
      </p>
      <div className="form-grid">
        <div className="two">
          <label>
            <span className="field-label">Legal company name</span>
            <input className="field-input" required minLength={2} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label>
            <span className="field-label">Tax ID (EIN)</span>
            <input className="field-input mono" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="12-3456789" />
          </label>
        </div>
        <label>
          <span className="field-label">Work email</span>
          <input className="field-input readonly" readOnly value={user.email} />
          <span className="field-hint">Your sign-in email can't be changed here. Write to support@surplusbid.com.</span>
        </label>
      </div>
      {msg && (
        <div className={msg.ok ? 'form-ok' : 'form-error'} style={{ marginTop: 16 }}>
          {msg.text}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn-primary btn" type="submit" disabled={!dirty || busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          className="btn-secondary btn"
          type="button"
          disabled={!dirty || busy}
          onClick={() => {
            setCompanyName(user.companyName);
            setTaxId(user.taxId ?? '');
            setMsg(undefined);
          }}
        >
          Discard
        </button>
      </div>
    </form>
  );
}
