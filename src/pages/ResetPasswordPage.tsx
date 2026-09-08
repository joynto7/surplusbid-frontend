import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getPasswordStrength, STRENGTH_COLOR } from '../lib/passwordStrength';
import './AuthSplit.css';
import './RegisterPage.css';

// NOTE: surplusbid-backend has no /auth/reset-password endpoint yet. This
// screen validates and transitions state locally; wire handleSubmit to a real
// POST once the backend exposes one (it will need the token from the query
// string this page already reads via useSearchParams).
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? 'your account email';

  const [step, setStep] = useState<'form' | 'done'>('form');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mismatch || password.length < 8) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('done');
    }, 400);
  }

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-page-inner">
        <div className="auth-brand">
          Surplus<span className="accent">Bid</span>
        </div>

        {step === 'form' && (
          <div className="auth-card">
            <h1>Choose a new password</h1>
            <p className="auth-subtext">
              Resetting for <strong className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{email}</strong>.
            </p>
            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <label>
                <span className="field-label">New password</span>
                <input
                  className="field-input"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (
                  <div className="password-meter-row">
                    <span className="password-meter-track">
                      <span
                        className="password-meter-fill"
                        style={{ width: `${strength.percent}%`, background: STRENGTH_COLOR[strength.level].bar }}
                      />
                    </span>
                    <span className="password-meter-label" style={{ color: STRENGTH_COLOR[strength.level].text }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </label>
              <label>
                <span className="field-label">Confirm new password</span>
                <input
                  className={`field-input ${mismatch ? 'has-error' : ''}`}
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {mismatch && <span className="field-error">Both passwords must match. Retype the confirmation.</span>}
              </label>
              <button className="btn-primary btn-block" type="submit" disabled={submitting || mismatch}>
                {submitting ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="auth-card">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'var(--ok-tint)',
                border: '1px solid var(--ok-line)',
                color: 'var(--ok-deep)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 18,
              }}
            >
              ✓
            </div>
            <h1 style={{ marginTop: 16 }}>Password updated</h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)', margin: '8px 0 0' }}>
              You're signed out on every other device. Your active bids and deposits are unaffected.
            </p>
            <div
              style={{
                marginTop: 16,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--paper)',
                padding: '12px 14px',
                fontSize: 12.5,
                color: 'var(--body)',
                lineHeight: 1.55,
              }}
            >
              Changed at{' '}
              <span className="mono" style={{ whiteSpace: 'nowrap' }}>
                {new Date().toLocaleString()}
              </span>
              . If this wasn't you, <a href="#">contact support</a> now.
            </div>
            <button className="btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => navigate('/login')}>
              Log in
            </button>
          </div>
        )}

        {step === 'form' && (
          <p className="auth-footer-link">
            <Link to="/login" style={{ fontWeight: 600 }}>
              Back to log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
