import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { getPasswordStrength, STRENGTH_COLOR } from '../lib/passwordStrength';
import './AuthSplit.css';
import './RegisterPage.css';

type Role = 'BUYER' | 'SELLER';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('BUYER');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError('You must agree to the Terms of Sale and Privacy Policy to continue.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, role, companyName });
      navigate('/verify-business');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-simple-page">
      <div className="auth-simple-page-inner wide">
        <div className="auth-brand">
          Surplus<span className="accent">Bid</span>
        </div>
        <div className="auth-card">
          <h1>Create your business account</h1>
          <p className="auth-subtext">
            You can browse immediately. Bidding and listing open once your business is verified.
          </p>

          <div style={{ marginTop: 22 }}>
            <div className="role-picker-heading">I want to</div>
            <div className="role-picker-grid">
              <button
                type="button"
                className={`role-card ${role === 'BUYER' ? 'selected' : ''}`}
                onClick={() => setRole('BUYER')}
              >
                <span className="row">
                  <span className="dot" />
                  <span className="name">Buy equipment</span>
                </span>
                <span className="description">Bid on lots, place deposits, arrange removal.</span>
              </button>
              <button
                type="button"
                className={`role-card ${role === 'SELLER' ? 'selected' : ''}`}
                onClick={() => setRole('SELLER')}
              >
                <span className="row">
                  <span className="dot" />
                  <span className="name">Sell surplus</span>
                </span>
                <span className="description">List lots, set reserves, get paid on settlement.</span>
              </button>
            </div>
            <p className="role-picker-note">You can do both later from one account.</p>
          </div>

          <form className="auth-form-grid" onSubmit={handleSubmit}>
            <label>
              <span className="field-label">Company name</span>
              <input
                className="field-input"
                required
                minLength={2}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <div className="form-row-2">
              <label>
                <span className="field-label">Your name</span>
                <input className="field-input" required value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </label>
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
            </div>
            <label>
              <span className="field-label">Password</span>
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
              <span className="field-hint">At least 8 characters. 12+ with a number is stronger.</span>
            </label>
            <label className="terms-checkbox-row">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I agree to the <a href="#">Terms of Sale</a> and <a href="#">Privacy Policy</a>, and I understand that
                bids placed on SurplusBid are binding.
              </span>
            </label>
            <button className="btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
            {error && <div className="form-banner-error">{error}</div>}
          </form>
        </div>
        <p className="auth-footer-link">
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
