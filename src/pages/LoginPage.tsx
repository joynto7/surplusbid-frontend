import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import GoogleIcon from '../components/GoogleIcon';
import './AuthSplit.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(email, password);
      if (me.verificationStatus === 'UNVERIFIED') {
        navigate('/verify-business');
      } else {
        navigate('/verification-status');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-split-form">
        <div className="auth-split-form-inner">
          <div className="auth-brand">
            Surplus<span className="accent">Bid</span>
          </div>
          <div className="auth-card">
            <h1>Log in to your account</h1>
            <p className="auth-subtext">Bidding requires a verified business account.</p>

            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <label>
                <span className="field-label">Work email</span>
                <input
                  className="field-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                <div className="auth-field-row">
                  <span className="field-label">Password</span>
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
                <input
                  className="field-input"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="auth-checkbox-row">
                <input type="checkbox" checked={keepLoggedIn} onChange={(e) => setKeepLoggedIn(e.target.checked)} />
                Keep me logged in on this device
              </label>
              <button className="btn-primary btn-block" type="submit" disabled={submitting}>
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
              {error && <div className="form-banner-error">{error}</div>}
            </form>

            <div className="auth-divider">
              <span className="line" />
              <span className="or">or</span>
              <span className="line" />
            </div>
            <a className="btn-google" href={api.googleAuthUrl()}>
              <GoogleIcon />
              Continue with Google
            </a>
          </div>
          <p className="auth-footer-link">
            New to SurplusBid? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>

      <div className="auth-split-panel">
        <div className="headline">1,284 lots are open for bidding, from single machines to whole plant teardowns.</div>
        <div className="checklist">
          <div className="checklist-item">
            <span className="check">✓</span>
            <span className="text">Deposits held in escrow, released in three business days</span>
          </div>
          <div className="checklist-item">
            <span className="check">✓</span>
            <span className="text">Condition reports and inspection windows on every lot</span>
          </div>
          <div className="checklist-item">
            <span className="check">✓</span>
            <span className="text">Verified businesses on both sides of the sale</span>
          </div>
        </div>
      </div>
    </div>
  );
}
