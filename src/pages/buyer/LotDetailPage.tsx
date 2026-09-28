import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { ApiError, api, type BidHistoryItem, type Lot } from '../../lib/api';
import {
  DEPOSIT_PERCENT,
  PAYMENT_DEADLINE_HOURS,
  currentPrice,
  depositFor,
  getLot,
  holds,
  isOpen,
  nextMinimum,
  useWatchlist,
} from '../../lib/buyer';
import { formatDate, formatDateTime, formatMoney, isUuid, lotCode, parseMoneyToCents, shortCode } from '../../lib/format';
import NotFoundPage from '../system/NotFoundPage';
import BidModal from './BidModal';
import './buyer.css';

const POLL_MS = 5000;

function clockGroups(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return d > 0
    ? [
        { v: pad(d), label: 'DAYS' },
        { v: pad(h), label: 'HRS' },
        { v: pad(m), label: 'MIN' },
      ]
    : [
        { v: pad(h), label: 'HRS' },
        { v: pad(m), label: 'MIN' },
        { v: pad(sec), label: 'SEC' },
      ];
}

const dollars = (cents: number) => (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LotDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const now = useNow();
  const watch = useWatchlist();

  const [lot, setLot] = useState<Lot>();
  const [loadError, setLoadError] = useState<unknown>();
  const [history, setHistory] = useState<BidHistoryItem[]>([]);
  const [totalBids, setTotalBids] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string>();
  const [modalAmount, setModalAmount] = useState<number>();
  const seen = useRef(new Set<string>());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  const isBuyer = user?.role === 'BUYER';
  const mine = useAsync(() => (isBuyer ? api.myBids(1, 50) : Promise.resolve(null)), [isBuyer]);
  const myBidIds = useMemo(() => new Set((mine.data?.items ?? []).filter((b) => b.lotId === id).map((b) => b.id)), [mine.data, id]);
  const categories = useAsync(() => api.categories(), []);
  const category = categories.data?.find((c) => c.id === lot?.categoryId)?.name;

  async function refresh(first = false) {
    try {
      const [l, h] = await Promise.all([getLot(id, !first), api.bidHistory(id, 1, 20)]);
      setLot(l);
      setHistory(h.items);
      setTotalBids(h.meta.total);
      if (first) {
        h.items.forEach((b) => seen.current.add(b.id));
      } else {
        const added = h.items.filter((b) => !seen.current.has(b.id)).map((b) => b.id);
        added.forEach((b) => seen.current.add(b));
        if (added.length) setFresh(new Set(added));
      }
      setLoadError(undefined);
    } catch (err) {
      if (first) setLoadError(err);
    }
  }

  useEffect(() => {
    seen.current = new Set();
    setLot(undefined);
    if (isUuid(id)) refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const open = lot ? isOpen(lot, now) : false;
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => refresh(), POLL_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  // Default the bid box to the next valid bid (or ?bid= from My bids), and
  // bump it up if someone else's bid makes the current value too low.
  const min = lot ? nextMinimum(lot) : 0;
  useEffect(() => {
    if (!lot) return;
    const requested = Number(params.get('bid'));
    const current = parseMoneyToCents(input);
    if (!input) setInput(dollars(Math.max(min, Number.isFinite(requested) ? requested : 0)));
    else if (!Number.isNaN(current) && current < min && modalAmount === undefined) setInput(dollars(min));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min]);

  if (!isUuid(id) || (loadError instanceof ApiError && loadError.status === 404)) return <NotFoundPage />;

  if (!lot) {
    return (
      <AppShell>
        <div className="page">{loadError ? <ErrorBox error={loadError} onRetry={() => refresh(true)} /> : <span className="muted">Loading lot…</span>}</div>
      </AppShell>
    );
  }

  const code = lotCode(lot.id);
  const left = new Date(lot.endTime).getTime() - now;
  const started = new Date(lot.startTime).getTime() <= now;
  const watching = watch.has(lot.id);
  const hasHold = holds.has(lot.id);
  const leaderIsMe = history.some((b) => b.status === 'WINNING' && myBidIds.has(b.id));

  function bump(cents: number) {
    const cur = parseMoneyToCents(input);
    setInput(dollars(Math.max(min, (Number.isNaN(cur) ? min : cur) + cents)));
    setInputError(undefined);
  }

  function startBid() {
    const cents = parseMoneyToCents(input);
    if (Number.isNaN(cents) || cents <= 0) return setInputError('Enter a bid amount in dollars.');
    if (cents < min) return setInputError(`The minimum bid is ${formatMoney(min)}.`);
    setInputError(undefined);
    setModalAmount(cents);
  }

  return (
    <AppShell>
      <div className="lot-crumb">
        <Link to="/lots" className="crumb-btn">
          ← CATALOG
        </Link>
        <span className="eyebrow">
          {code}
          {category ? ` · ${category}` : ''} · {lot.condition}
        </span>
        <button className={`crumb-btn ${watching ? 'on' : ''}`} style={{ marginLeft: 'auto' }} onClick={() => watch.toggle(lot.id)} aria-pressed={watching}>
          {watching ? '★ WATCHING' : '☆ WATCH'}
        </button>
      </div>

      <div className="lot-layout">
        <div className="lot-main">
          <div className="eyebrow">{code}</div>
          <h1>{lot.title}</h1>

          <div className="lot-hero">
            {lot.images[imageIndex] && <img src={lot.images[imageIndex]} alt={`${lot.title}, photo ${imageIndex + 1}`} className="img-cover" />}
            <div className="tags">
              <span>
                IMG {lot.images.length ? `${String(imageIndex + 1).padStart(2, '0')}/${String(lot.images.length).padStart(2, '0')}` : 'NONE'}
              </span>
              <span>LISTED {formatDate(lot.createdAt).toUpperCase()}</span>
            </div>
          </div>
          {lot.images.length > 1 && (
            <div className="lot-thumbs">
              {lot.images.map((src, i) => (
                <button key={src} className={i === imageIndex ? 'on' : ''} onClick={() => setImageIndex(i)} aria-label={`Show photo ${i + 1}`}>
                  <img src={src} alt="" className="img-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="spec-grid">
            <div>
              <div className="eyebrow">Specification</div>
              <div className="rows">
                <span>Category</span>
                <span>{category ?? '—'}</span>
                <span>Condition</span>
                <span>{lot.condition}</span>
                <span>Quantity</span>
                <span>{lot.quantity.toLocaleString('en-US')}</span>
                <span>Lot ID</span>
                <span>{code}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow">Auction &amp; terms</div>
              <div className="rows">
                <span>Opens</span>
                <span>{formatDateTime(lot.startTime)}</span>
                <span>Closes</span>
                <span>{formatDateTime(lot.endTime)}</span>
                <span>Starting bid</span>
                <span>{formatMoney(lot.startingPriceCents)}</span>
                <span>Bid increment</span>
                <span>{formatMoney(lot.bidIncrementCents)}</span>
                <span>Deposit</span>
                <span>
                  {formatMoney(depositFor(lot))} ({DEPOSIT_PERCENT}%)
                </span>
                <span>Payment due</span>
                <span>{PAYMENT_DEADLINE_HOURS}h after close</span>
              </div>
            </div>
          </div>

          <div className="lot-desc">
            <div className="eyebrow">Description &amp; condition report</div>
            <p>{lot.description}</p>
          </div>
        </div>

        <aside className="terminal">
          <div className="terminal-sec terminal-head">
            <span className="eyebrow">Bid terminal</span>
            <span className={`live-dot ${open ? '' : 'closed'}`}>{open ? 'LIVE' : lot.status === 'LIVE' ? 'CLOSING' : lot.status}</span>
          </div>

          <div className="terminal-sec" style={{ paddingTop: 16 }}>
            <div className="eyebrow">{lot.currentHighestBidAmountCents === null ? 'Starting bid' : 'Current high bid'}</div>
            <div className="big">{formatMoney(currentPrice(lot))}</div>
            <div className="meta">
              {leaderIsMe ? <span className="square-tag ok">YOU'RE LEADING</span> : totalBids === 0 ? <span className="square-tag dim">NO BIDS YET</span> : null}
              <span className="m">
                {totalBids} bid{totalBids === 1 ? '' : 's'}
                {open ? ` · next min ${formatMoney(min)}` : ''}
              </span>
            </div>
          </div>

          <div className="terminal-sec">
            <div className="eyebrow">{open ? 'Time remaining' : started ? 'Auction closed' : 'Opens in'}</div>
            {open || !started ? (
              <div className="digits">
                {clockGroups(open ? left : new Date(lot.startTime).getTime() - now).map((g, i) => (
                  <div key={g.label} style={{ display: 'contents' }}>
                    {i > 0 && <span className="colon">:</span>}
                    <div className="grp">
                      <div className="row">
                        {g.v.split('').map((c, j) => (
                          <span key={j} className="d">
                            {c}
                          </span>
                        ))}
                      </div>
                      <div className="lbl">{g.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mono" style={{ fontSize: 14, marginTop: 8 }}>
                Closed {formatDateTime(lot.endTime)}
              </div>
            )}
          </div>

          {open && isBuyer && (
            <div className="terminal-sec">
              <div className="eyebrow">Your bid</div>
              <div className="bid-input">
                <span className="cur">$</span>
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInputError(undefined);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && startBid()}
                  inputMode="decimal"
                  aria-label="Bid amount in dollars"
                />
                <div className="steppers">
                  <button onClick={() => bump(lot.bidIncrementCents)} aria-label="Raise by one increment">
                    ▲
                  </button>
                  <button onClick={() => bump(-lot.bidIncrementCents)} aria-label="Lower by one increment">
                    ▼
                  </button>
                </div>
              </div>
              <div className="bumps">
                {[1, 2, 4].map((n) => (
                  <button key={n} onClick={() => bump(lot.bidIncrementCents * n)}>
                    +{(lot.bidIncrementCents * n / 100).toLocaleString('en-US')}
                  </button>
                ))}
              </div>
              {inputError && <div className="bid-error">{inputError}</div>}
              <button className="btn-primary place-bid" onClick={startBid}>
                Place bid
              </button>
              <div className="hold-line">
                <span>HOLD: {formatMoney(depositFor(lot))}</span>
                <span className={hasHold ? 'ok' : ''}>{hasHold ? 'AUTHORIZED' : 'REQUIRED TO BID'}</span>
              </div>
              <div className="fine">Bidding is binding. A bid in the final two minutes extends the close by two minutes.</div>
            </div>
          )}
          {!isBuyer && (
            <div className="terminal-sec fine" style={{ marginTop: 0 }}>
              {lot.sellerId === user?.id ? (
                <>
                  This is how buyers see your lot.{' '}
                  <Link to={lot.status === 'DRAFT' ? `/seller/lots/${lot.id}/edit` : `/seller/lots/${lot.id}`}>
                    {lot.status === 'DRAFT' ? 'Back to the draft' : 'View performance'}
                  </Link>
                </>
              ) : (
                `Only buyer accounts can bid. You're viewing this lot as a ${user?.role.toLowerCase()}.`
              )}
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="bidlog-head">
              <span className="eyebrow">Bid log</span>
              <span className="mono" style={{ fontSize: 9.5, color: '#94A3B8' }}>
                NEWEST FIRST
              </span>
            </div>
            <div className="bidlog">
              {history.length === 0 ? (
                <div className="card-empty">No bids yet. The first valid bid is {formatMoney(min)}.</div>
              ) : (
                history.map((b) => (
                  <div key={b.id} className={`bidlog-row ${fresh.has(b.id) ? 'fresh' : ''}`}>
                    <span className="t">{new Date(b.createdAt).toLocaleTimeString('en-US', { hour12: false })}</span>
                    <span className="w">{myBidIds.has(b.id) ? 'YOU' : shortCode('BID', b.id)}</span>
                    <span className={`a ${b.status === 'WINNING' ? 'lead' : ''}`}>{formatMoney(b.amountCents)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {modalAmount !== undefined && (
        <BidModal
          lot={lot}
          amountCents={modalAmount}
          onClose={() => setModalAmount(undefined)}
          onPlaced={() => {
            setInput(''); // refilled with the new minimum once the lot refreshes
            mine.reload();
            refresh();
          }}
        />
      )}
    </AppShell>
  );
}
