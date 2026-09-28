import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Role } from '../lib/api';
import { deriveNotifications, useBuyerActivity, useNotificationState } from '../lib/buyer';
import { deriveSellerNotifications, useSellerInventory, useSellerNotificationState } from '../lib/seller';
import { initials } from '../lib/format';
import '../styles/app.css';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  count?: number;
}

function useUnread(role: Role | undefined) {
  const { activity } = useBuyerActivity(role === 'BUYER');
  const { inventory } = useSellerInventory(role === 'SELLER');
  const buyer = useNotificationState();
  const seller = useSellerNotificationState();
  if (role === 'BUYER' && activity) {
    return deriveNotifications(activity).filter((n) => buyer.enabled(n.kind) && !buyer.isRead(n.id)).length;
  }
  if (role === 'SELLER' && inventory) {
    return deriveSellerNotifications(inventory).filter((n) => seller.enabled(n.kind) && !seller.isRead(n.id)).length;
  }
  return 0;
}

/** Top-bar counts for operators: open disputes and pending verifications. */
function useAdminBadges(enabled: boolean) {
  const [badges, setBadges] = useState<{ disputes: number; pending: number }>();
  useEffect(() => {
    if (!enabled) return;
    Promise.all([api.adminStats(), api.adminUsers({ verificationStatus: 'PENDING', limit: 1 })])
      .then(([stats, pending]) => setBadges({ disputes: stats.openDisputes, pending: pending.meta.total }))
      .catch(() => {});
  }, [enabled]);
  return badges;
}

const ADMIN_NAV = (pending: number): NavItem[] => [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/verifications', label: 'Verifications', count: pending },
  { to: '/admin/users', label: 'User management' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/audit-log', label: 'Audit log' },
  { to: '/admin/settings', label: 'Platform settings' },
];

const BUYER_NAV = (unread: number): NavItem[] => [
  { to: '/buyer', label: 'Dashboard', end: true },
  { to: '/lots', label: 'Browse lots' },
  { to: '/buyer/bids', label: 'My bids & watchlist' },
  { to: '/buyer/notifications', label: 'Notifications', count: unread },
  { to: '/buyer/disputes/new', label: 'File a dispute' },
  { to: '/buyer/settings', label: 'Profile & settings' },
];

const SELLER_NAV = (unread: number): NavItem[] => [
  { to: '/seller', label: 'Dashboard', end: true },
  { to: '/seller/listings', label: 'Inventory' },
  { to: '/seller/lots/new', label: 'List a lot' },
  { to: '/seller/payouts', label: 'Payouts & earnings' },
  { to: '/seller/notifications', label: 'Notifications', count: unread },
  { to: '/seller/settings', label: 'Profile & settings' },
];

function roleLine(role: string, status: string) {
  const who = role === 'SELLER' ? 'seller' : role === 'ADMIN' ? 'admin' : 'buyer';
  if (role === 'ADMIN') return { text: 'Platform operator', tone: '' };
  if (status === 'VERIFIED') return { text: `Verified ${who}`, tone: 'ok' };
  if (status === 'PENDING') return { text: 'Verification pending', tone: 'warn' };
  if (status === 'REJECTED') return { text: 'Changes requested', tone: 'warn' };
  return { text: 'Not verified', tone: 'warn' };
}

export default function AppShell({ children, railNote }: { children: ReactNode; railNote?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const isSeller = user?.role === 'SELLER';
  const isAdmin = user?.role === 'ADMIN';
  const searchPath = isAdmin ? '/admin/users' : isSeller ? '/seller/listings' : '/lots';
  const [query, setQuery] = useState(() => (location.pathname === searchPath ? params.get('q') ?? '' : ''));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = useUnread(user?.role);
  const badges = useAdminBadges(isAdmin);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!user) return null;

  const nav = isAdmin ? ADMIN_NAV(badges?.pending ?? 0) : isSeller ? SELLER_NAV(unread) : BUYER_NAV(unread);
  const base = isAdmin ? '/admin' : isSeller ? '/seller' : '/buyer';
  const searchLabel = isAdmin ? 'Search accounts' : isSeller ? 'Search your lots' : 'Search lots';

  const line = roleLine(user.role, user.verificationStatus);

  function search(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath);
  }

  return (
    <div className="shell">
      <aside className="shell-rail">
        <div className="shell-rail-brand">
          <Link to={base} className="logo">
            Surplus<span className="accent">Bid</span>
          </Link>
          <div className="sub">{isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}</div>
        </div>
        <nav className="shell-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
              {item.count ? <span className="count">{item.count}</span> : null}
            </NavLink>
          ))}
        </nav>
        {railNote && <div className="shell-rail-foot">{railNote}</div>}
      </aside>

      <main className="shell-main">
        <div className="shell-topbar">
          <form className="shell-search" onSubmit={search} role="search">
            <span className="glyph" aria-hidden="true">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
            />
          </form>
          <div className="shell-topbar-actions">
            {isSeller && (
              <Link to="/seller/lots/new" className="btn btn-primary btn-md">
                List a lot
              </Link>
            )}
            {isAdmin ? (
              <>
                {badges && badges.disputes > 0 && (
                  <Link to="/admin/disputes" className="pill bad" style={{ padding: '4px 11px', fontSize: 11.5, textDecoration: 'none' }}>
                    {badges.disputes} dispute{badges.disputes === 1 ? '' : 's'} open
                  </Link>
                )}
                {badges && badges.pending > 0 && (
                  <Link to="/admin/verifications" className="pill warn" style={{ padding: '4px 11px', fontSize: 11.5, textDecoration: 'none' }}>
                    {badges.pending} pending
                  </Link>
                )}
              </>
            ) : (
              <button className="shell-notif-btn" onClick={() => navigate(`${base}/notifications`)}>
                {isSeller ? 'Alerts' : 'Notifications'}
                {unread > 0 && <span className="badge">{unread}</span>}
              </button>
            )}
            <div className="shell-menu" ref={menuRef}>
              <button className="shell-avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
                <span className="avatar">{initials(user.companyName)}</span>
                <span className="who">
                  <span className="name">{user.companyName}</span>
                  <span className={`role ${line.tone}`}>{line.text}</span>
                </span>
                <span className="caret">▾</span>
              </button>
              {menuOpen && (
                <div className="shell-dropdown" role="menu">
                  <Link to={`${base}/settings`}>{isAdmin ? 'Platform settings' : 'Profile & settings'}</Link>
                  {user.verificationStatus !== 'VERIFIED' && <Link to="/verification-status">Verification status</Link>}
                  <hr />
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
