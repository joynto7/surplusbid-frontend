import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../lib/routes';
import '../../styles/app.css';
import SystemHeader from './SystemHeader';
import './system.css';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const isLot = pathname.startsWith('/lots/');

  const links = [
    { title: 'Open auctions', note: 'Every lot currently accepting bids', action: 'Browse', to: '/lots', primary: true },
    ...(user?.role === 'BUYER' ? [{ title: 'Your bids and watchlist', note: 'Active bids, won lots and lots you watch', action: 'Open', to: '/buyer/bids' }] : []),
    ...(user ? [{ title: 'Your dashboard', note: 'Where you usually start', action: 'Go', to: homeFor(user) }] : []),
  ];

  function search(e: FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/lots?q=${encodeURIComponent(q.trim())}` : '/lots');
  }

  return (
    <div className="sys-page">
      <SystemHeader />
      <div className="sys-body">
        <div className="sys-inner">
          <div className="sys-code">ERROR 404</div>
          <h1>{isLot ? "We can't find that lot" : "We can't find that page"}</h1>
          <p>
            The address <span className="path-chip">{pathname}</span> doesn't match {isLot ? 'a lot' : 'a page'} on SurplusBid.{' '}
            {isLot ? 'The lot may have been withdrawn by the seller, or the link is mistyped.' : 'An old link or bookmark may have brought you here.'}
          </p>

          <div className="card card-flush sys-links">
            <div className="card-head" style={{ borderBottom: 0 }}>
              <span className="card-title">Try one of these</span>
            </div>
            {links.map((l) => (
              <div className="row" key={l.to}>
                <span className="main">
                  <strong>{l.title}</strong>
                  <small>{l.note}</small>
                </span>
                <Link to={l.to} className={`btn btn-md ${l.primary ? 'btn-primary' : 'btn-secondary'}`}>
                  {l.action}
                </Link>
              </div>
            ))}
          </div>

          <form className="sys-search" onSubmit={search} role="search">
            <span className="mono muted" style={{ fontSize: 12 }}>
              ⌕
            </span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for the equipment you were after" aria-label="Search lots" />
            <button type="submit" className="btn btn-primary btn-md" style={{ margin: '6px 0' }}>
              Search
            </button>
          </form>

          <p className="fine">
            Certain something should be here? Send us the link at <a href="mailto:support@surplusbid.com">support@surplusbid.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
