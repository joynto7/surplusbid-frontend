import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../lib/format';
import { homeFor } from '../../lib/routes';

export default function SystemHeader() {
  const { user } = useAuth();
  return (
    <header className="sys-header">
      <Link to={user ? homeFor(user) : '/'} className="logo">
        Surplus<span className="accent">Bid</span>
      </Link>
      <div className="right">
        <Link to="/lots">Browse lots</Link>
        {user ? (
          <Link to={homeFor(user)} className="shell-avatar-btn" style={{ textDecoration: 'none' }}>
            <span className="avatar" style={{ width: 26, height: 26 }}>
              {initials(user.companyName)}
            </span>
            <span className="name" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>
              {user.companyName}
            </span>
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-md">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
