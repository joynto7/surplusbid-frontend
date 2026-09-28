import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../lib/api';
import { shortCode } from '../../lib/format';
import { homeFor } from '../../lib/routes';
import '../../styles/app.css';
import SystemHeader from './SystemHeader';
import './system.css';

const ROLE_NAME: Record<Role, string> = { BUYER: 'Buyer', SELLER: 'Seller', ADMIN: 'Platform operator' };

export default function ForbiddenPage({ required }: { required: Role[] }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const mine = ROLE_NAME[user.role];
  const needed = required.map((r) => ROLE_NAME[r]).join(' or ');

  return (
    <div className="sys-page">
      <SystemHeader />
      <div className="sys-body">
        <div className="sys-inner">
          <div className="sys-code">ERROR 403</div>
          <h1>You don't have access to this page</h1>
          <p>
            You're signed in as <strong>{user.companyName}</strong>, which has {mine.toLowerCase()} access. The page you asked for is for{' '}
            {needed.toLowerCase()} accounts.
          </p>

          <div className="sys-facts">
            <span>
              <span>Requested</span>
              <span>{pathname}</span>
            </span>
            <span>
              <span>Your role</span>
              <span>
                {mine} · {shortCode('ACCT', user.id)}
              </span>
            </span>
            <span>
              <span>Role required</span>
              <span>{needed}</span>
            </span>
          </div>

          <p className="small">Nothing is wrong with your account. Everything you can use is in your dashboard.</p>

          <div className="row-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(homeFor(user))}>
              Go to my dashboard
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
              Back to the previous page
            </button>
          </div>

          <p className="fine" style={{ lineHeight: 1.6 }}>
            Need different access for your work? Write to <a href="mailto:support@surplusbid.com">support@surplusbid.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
