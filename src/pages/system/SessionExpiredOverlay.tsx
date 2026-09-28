import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GoogleIcon from '../../components/GoogleIcon';
import { errorMessage } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { SESSION_EXPIRED_EVENT, api } from '../../lib/api';
import { returnTo } from '../../lib/routes';
import './system.css';

const PAGE_NAMES: [RegExp, string][] = [
  [/^\/buyer\/checkout\//, 'Checkout'],
  [/^\/buyer\/invoices\//, 'Invoice'],
  [/^\/buyer\/bids/, 'My bids & watchlist'],
  [/^\/buyer\/notifications/, 'Notifications'],
  [/^\/buyer\/disputes/, 'File a dispute'],
  [/^\/buyer\/settings/, 'Profile & settings'],
  [/^\/buyer/, 'Dashboard'],
  [/^\/lots\//, 'Lot detail'],
  [/^\/lots/, 'Browse lots'],
];

/**
 * Shown over the current page when the refresh token is rejected, so the page
 * underneath is preserved and signing in lands back on it.
 */
export default function SessionExpiredOverlay() {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, show);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, show);
  }, []);

  useEffect(() => {
    if (open && user) setEmail(user.email);
  }, [open, user]);

  if (!open) return null;

  const here = location.pathname + location.search;
  const pageName = PAGE_NAMES.find(([re]) => re.test(location.pathname))?.[1] ?? 'The page you were on';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await login(email, password);
      // Re-run the page's requests with the new session.
      window.location.reload();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="expired-backdrop">
      <div className="expired-card" role="dialog" aria-modal="true" aria-labelledby="expired-title">
        <div className="inner">
          <span className="status-banner warn">
            <span className="dot" />
            Session expired
          </span>
          <h1 id="expired-title">Sign in again to continue</h1>
          <p>Your session timed out, so we signed you out to protect your account. Nothing was lost.</p>

          <div className="return-box">
            <div className="k">You'll come back to</div>
            <div className="v">
              {pageName} · {here}
            </div>
            <div className="n">Anything you'd typed on this page may need re-entering. Bids, deposits and deadlines are untouched.</div>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gap: 13, marginTop: 18 }}>
            <label>
              <span className="field-label">Work email</span>
              <input className="field-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span className="field-label" style={{ margin: 0 }}>
                  Password
                </span>
                <a href="/forgot-password" style={{ fontSize: 12.5, fontWeight: 500 }}>
                  Forgot password?
                </a>
              </span>
              <input
                className="field-input"
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="btn-primary btn btn-lg btn-block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : `Sign in and continue to ${pageName.toLowerCase()}`}
            </button>
          </form>

          <div className="or-line">or</div>
          <a className="google-btn" href={api.googleAuthUrl()} onClick={() => returnTo.set(here)}>
            <GoogleIcon />
            Continue with Google
          </a>
        </div>
        <div className="foot">
          <button
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/login');
            }}
          >
            Sign in as a different account
          </button>
        </div>
      </div>
    </div>
  );
}
