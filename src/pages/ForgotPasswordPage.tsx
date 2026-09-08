import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './AuthSplit.css';

// NOTE: surplusbid-backend does not yet expose a password-reset endpoint
// (only /auth/register, /auth/login, /auth/refresh-token, /auth/logout, and
// the Google OAuth routes exist). This screen is wired for the UI flow only;
// swap the setTimeout below for a real POST /auth/forgot-password call once
// that endpoint exists.
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'form' | 'sent'>('form');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('sent');
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
            <h1>Reset your password</h1>
            <p className="auth-subtext">
              Enter the work email on your account and we'll send a reset link. The link expires in 30 minutes.
            </p>
            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <label>
                <span className="field-label">Work email</span>
                <input
                  className="field-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button className="btn-primary btn-block" type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </div>
        )}

        {step === 'sent' && (
          <div className="auth-card">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'var(--blue-tint)',
                border: '1px solid #BFDBFE',
                display: 'grid',
                placeItems: 'center',
                fontSize: 17,
              }}
            >
              ✉
            </div>
            <h1 style={{ marginTop: 16 }}>Check your email</h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)', margin: '8px 0 0' }}>
              We sent a reset link to <strong className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{email}</strong>. It
              expires in 30 minutes.
            </p>
            <div
              style={{
                marginTop: 16,
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--paper)',
                padding: '13px 14px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Didn't get it?</div>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--body)', margin: '5px 0 0' }}>
                Check spam, and confirm your company allows mail from surplusbid.com. If the address isn't on an
                account, no email is sent. That is deliberate.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <Link to="/reset-password" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '11px 0', fontSize: 13.5 }}>
                Open reset link
              </Link>
              <button className="btn-secondary" style={{ padding: '11px 16px', fontSize: 13.5 }} onClick={() => setStep('sent')}>
                Resend
              </button>
            </div>
          </div>
        )}

        <p className="auth-footer-link">
          <Link to="/login" style={{ fontWeight: 600 }}>
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
