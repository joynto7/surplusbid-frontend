import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './VerificationStatusPage.css';

function initials(companyName: string) {
  const parts = companyName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—';
}

export default function VerificationStatusPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const approved = user.verificationStatus === 'VERIFIED';
  const rejected = user.verificationStatus === 'REJECTED';
  const accountCode = `ACCT-${user.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  const roleLabel = user.role === 'SELLER' ? 'Verified seller' : 'Verified buyer';

  return (
    <div className="vstatus-page">
      <div className="vstatus-topbar">
        <div className="auth-brand" style={{ fontSize: 15.5 }}>
          Surplus<span className="accent">Bid</span>
        </div>
        <div className="vstatus-topbar-actions">
          <span className={`status-banner ${approved ? 'ok' : 'warn'}`} style={{ borderRadius: 999 }}>
            {approved ? roleLabel : rejected ? 'Verification rejected' : 'Verification pending'}
          </span>
          <button
            className="vstatus-avatar-btn"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <span className="avatar">{initials(user.companyName)}</span>
            <span className="name">{user.companyName}</span>
            <span className="caret">▾</span>
          </button>
        </div>
      </div>

      <div className="vstatus-content">
        {!approved && (
          <div>
            <div className="vstatus-card">
              <div className={`status-banner ${rejected ? '' : 'warn'}`} style={rejected ? { background: 'var(--bad-tint)', border: '1px solid var(--bad-line)', color: 'var(--bad-deep)' } : undefined}>
                <span className="dot" style={rejected ? { background: 'var(--bad)' } : undefined} />
                {rejected ? 'Changes requested' : 'Under review'}
              </div>
              <h1>{rejected ? 'Your submission needs changes' : 'Your account is under review'}</h1>
              <p>
                {rejected
                  ? `A reviewer found an issue with your submission. Update your details and documents, then resubmit.`
                  : <>Most businesses are verified within four hours. We'll email <strong className="mono" style={{ fontSize: 13.5 }}>{user.email}</strong> the moment a reviewer decides.</>}
              </p>

              <div className="vstatus-timeline">
                <div className="vstatus-timeline-row">
                  <span className="marker done">✓</span>
                  <span className="body">
                    <span className="title">Account created</span>
                    <span className="subtitle">{user.companyName}</span>
                  </span>
                </div>
                <div className="vstatus-timeline-row">
                  <span className="marker done">✓</span>
                  <span className="body">
                    <span className="title">Documents submitted</span>
                    <span className="subtitle">Registration certificate on file</span>
                  </span>
                </div>
                {!rejected ? (
                  <div className="vstatus-timeline-row active">
                    <span className="marker active">◔</span>
                    <span className="body">
                      <span className="title">Reviewer check in progress</span>
                      <span className="subtitle">An operator is reading your registration certificate</span>
                    </span>
                    <span className="when">now</span>
                  </div>
                ) : (
                  <div className="vstatus-timeline-row">
                    <span className="marker" style={{ background: 'var(--bad-tint)', border: '1px solid var(--bad-line)', color: 'var(--bad-deep)' }}>!</span>
                    <span className="body">
                      <span className="title">Reviewer requested changes</span>
                      <span className="subtitle">See the email we sent for details</span>
                    </span>
                  </div>
                )}
                <div className="vstatus-timeline-row todo">
                  <span className="marker todo">·</span>
                  <span className="body">
                    <span className="title">Bidding unlocked</span>
                    <span className="subtitle">Deposits and bids become available</span>
                  </span>
                  <span className="when">pending</span>
                </div>
              </div>

              <div className="vstatus-actions">
                <Link to="/" className="btn-primary">
                  Browse lots while you wait
                </Link>
                <button className="btn-secondary" onClick={() => navigate('/verify-business')}>
                  Edit submission
                </button>
              </div>
            </div>

            <div className="vstatus-info-grid">
              <div className="vstatus-info-card">
                <div className="title">What you can do now</div>
                <p>Browse every open lot, save lots to a watchlist, and book inspection slots. Bidding stays locked.</p>
              </div>
              <div className="vstatus-info-card">
                <div className="title">If something is missing</div>
                <p>A reviewer will email you naming the exact document, and your submission reopens for editing.</p>
              </div>
              <div className="vstatus-info-card">
                <div className="title">Questions</div>
                <p>
                  Reference <span className="mono">{accountCode}</span> and write to <a href="mailto:verify@surplusbid.com">verify@surplusbid.com</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {approved && (
          <div className="vstatus-card">
            <div className="status-banner ok">
              <span className="dot" />
              {roleLabel}
            </div>
            <h1>{user.companyName} is verified</h1>
            <p>
              You can bid on any open lot. {user.role === 'SELLER' ? 'Buyers' : 'Sellers'} now see a verified badge on
              your {user.role === 'SELLER' ? 'lots' : 'bids'}.
            </p>

            <div className="vstatus-summary-grid">
              <div className="vstatus-summary-cell">
                <div className="label">Account</div>
                <div className="value">{accountCode}</div>
              </div>
              <div className="vstatus-summary-cell">
                <div className="label">Role</div>
                <div className="value">{user.role === 'SELLER' ? 'Seller' : 'Buyer'}</div>
              </div>
              <div className="vstatus-summary-cell">
                <div className="label">Member since</div>
                <div className="value">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="vstatus-next-steps">Next steps</div>
            <div className="vstatus-next-list">
              <div className="vstatus-next-item">
                <span className="num">1</span>
                <span className="text">Add a card so deposits authorize instantly when you bid</span>
                <button className="btn-secondary" disabled title="Coming soon">
                  Add card
                </button>
              </div>
              <div className="vstatus-next-item">
                <span className="num">2</span>
                <span className="text">Set alerts for the categories and regions you buy in</span>
                <button className="btn-secondary" disabled title="Coming soon">
                  Set alerts
                </button>
              </div>
              <div className="vstatus-next-item">
                <span className="num">3</span>
                <span className="text">Browse open lots and place your first bid</span>
                <Link to="/" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                  View lots
                </Link>
              </div>
            </div>

            <button className="btn-primary" style={{ marginTop: 22, padding: '12px 22px', fontSize: 14 }} disabled title="Dashboard not built in this milestone">
              Go to my dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
