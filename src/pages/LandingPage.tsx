import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const STEPS = [
  {
    n: 1,
    title: 'Sellers list the lot',
    body: 'Photos, condition report, location and removal deadline. The reserve price stays hidden from buyers.',
  },
  {
    n: 2,
    title: 'Buyers bid with a deposit',
    body: 'A 3% hold is authorized on your card when you bid. Nothing is charged unless you win.',
  },
  {
    n: 3,
    title: 'The auction closes',
    body: 'Any bid in the final three minutes extends the close by three, so a last-second bid never decides a lot alone.',
  },
  {
    n: 4,
    title: 'Pay and remove',
    body: 'The balance is due 48 hours after close, with your deposit applied to it. Then arrange rigging and pickup.',
  },
];

const TRUST = [
  {
    tone: '',
    title: 'Verified businesses only',
    body: 'Every account is checked against its tax ID and bank record before it can bid or list. No anonymous accounts.',
  },
  {
    tone: 'blue',
    title: 'Deposits held in escrow',
    body: 'Bid deposits sit in escrow, not with the seller. Losing bidders are released within three business days.',
  },
  {
    tone: 'warn',
    title: 'Disputes reviewed by people',
    body: 'If a lot is not as described, open a case with evidence. Funds stay held until an operator decides.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-brand">
          Surplus<span className="accent">Bid</span>
        </div>
        <nav className="landing-nav">
          <a href="#how-it-works">Browse lots</a>
          <a href="#how-it-works">How it works</a>
          <a href="#how-it-works">Sell with us</a>
          <a href="#how-it-works">Pricing</a>
        </nav>
        <div className="landing-header-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>
            Log in
          </button>
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Create account
          </button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="status-banner ok">
            <span className="dot" />
            Verified businesses only
          </div>
          <h1>Buy and sell industrial surplus without the phone calls.</h1>
          <p className="lede">
            Time-limited auctions for used equipment and excess inventory. Every buyer and seller is a verified
            business, every bid is backed by a deposit held in escrow, and removal terms are on the lot before you
            bid.
          </p>
          <div className="landing-hero-ctas">
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Register as a buyer
            </button>
            <button className="btn-secondary" onClick={() => navigate('/register')}>
              Register as a seller
            </button>
          </div>
          <div className="landing-stats">
            <div>
              <div className="stat-value mono">1,284</div>
              <div className="stat-label">Lots open right now</div>
            </div>
            <div>
              <div className="stat-value mono">$41.2M</div>
              <div className="stat-label">Sold in the last 12 months</div>
            </div>
            <div>
              <div className="stat-value mono">96.4%</div>
              <div className="stat-label">Settled without dispute</div>
            </div>
          </div>
        </div>

        <div className="landing-preview-card">
          <div className="preview-head">
            <span className="label">Closing soon</span>
            <span className="live">
              <span className="dot" />
              Live
            </span>
          </div>
          <div className="landing-preview-photo">
            <div className="placeholder">Equipment photo</div>
            <span className="closing-badge">Closes in 41m</span>
          </div>
          <div className="landing-preview-body">
            <div className="row-top">
              <span className="lot-id">LOT-04821</span>
              <span className="lot-location">Cleveland, OH</span>
            </div>
            <div className="lot-title">CNC vertical machining center</div>
            <div className="lot-figures">
              <div>
                <div className="figure-label">Current bid</div>
                <div className="figure-value">$14,250.00</div>
              </div>
              <div className="right">
                <div className="figure-label">Bids</div>
                <div className="figure-value">23</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section tint">
        <div className="landing-section-inner">
          <div className="landing-eyebrow">How it works</div>
          <h2>Four steps, no negotiation</h2>
          <div className="landing-steps-grid">
            {STEPS.map((step) => (
              <div className="landing-step-card" key={step.n}>
                <div className="step-number mono">{step.n}</div>
                <div className="step-title">{step.title}</div>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-trust-grid">
          {TRUST.map((item) => (
            <div className={`landing-trust-card ${item.tone}`} key={item.title}>
              <div className="title">{item.title}</div>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner">
          <div className="landing-cta-copy">
            <h2>Ready to bid on your first lot?</h2>
            <p>Verification takes about a day. Browsing is open to anyone.</p>
          </div>
          <div className="landing-cta-actions">
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Create account
            </button>
            <button className="btn-outline-dark">Browse lots first</button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} SurplusBid, Inc.</span>
        <Link to="#">Terms</Link>
        <Link to="#">Privacy</Link>
        <Link to="#">Buyer premium schedule</Link>
        <Link to="#">Contact</Link>
      </footer>
    </div>
  );
}
