import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, LotThumb } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { api, type Lot, type LotBrowseQuery } from '../../lib/api';
import { currentPrice, primeLot, useWatchlist } from '../../lib/buyer';
import { formatMoney, formatRemaining, lotCode } from '../../lib/format';
import './buyer.css';

type Sort = 'ending' | 'priceAsc' | 'priceDesc' | 'newest';

const SORTS: Record<Sort, { label: string; query: Pick<LotBrowseQuery, 'sortBy' | 'sortOrder'> }> = {
  ending: { label: 'Time remaining', query: { sortBy: 'endTime', sortOrder: 'asc' } },
  priceAsc: { label: 'Current bid, low to high', query: { sortBy: 'currentHighestBidAmountCents', sortOrder: 'asc' } },
  priceDesc: { label: 'Current bid, high to low', query: { sortBy: 'currentHighestBidAmountCents', sortOrder: 'desc' } },
  newest: { label: 'Newest listed', query: { sortBy: 'createdAt', sortOrder: 'desc' } },
};

const PAGE_SIZE = 24;
const HOUR = 3600 * 1000;

export function clockTone(ms: number) {
  if (ms <= 0) return '';
  if (ms < 15 * 60 * 1000) return 'urgent';
  if (ms < HOUR) return 'soon';
  return '';
}

function LotCard({ lot, category, now }: { lot: Lot; category?: string; now: number }) {
  const watch = useWatchlist();
  const left = new Date(lot.endTime).getTime() - now;
  const watching = watch.has(lot.id);
  return (
    <Link to={`/lots/${lot.id}`} className="lot-card" onClick={() => primeLot(lot)}>
      <div className="lot-card-img">
        <LotThumb src={lot.images[0]} />
        {!lot.images[0] && <div className="ph-frame" />}
        <button
          className={`watch ${watching ? 'on' : ''}`}
          aria-label={watching ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-pressed={watching}
          onClick={(e) => {
            e.preventDefault();
            watch.toggle(lot.id);
          }}
        >
          {watching ? '★' : '☆'}
        </button>
        <div className="shot">
          IMG {lot.images.length ? `01/${String(lot.images.length).padStart(2, '0')}` : '—'} · QTY {lot.quantity}
        </div>
        <div className="cond">{lot.condition}</div>
      </div>
      <div className="lot-card-body">
        <span className="code">{lotCode(lot.id)}</span>
        <h3>{lot.title}</h3>
        {category && <div className="cat-tag">{category}</div>}
        <div className="lot-card-foot">
          <div>
            <div className="eyebrow">{lot.currentHighestBidAmountCents === null ? 'Starting bid' : 'Current bid'}</div>
            <div className="bid">{formatMoney(currentPrice(lot))}</div>
            <div className="sub">+{formatMoney(lot.bidIncrementCents)} increment</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">{lot.status === 'LIVE' ? 'Closes in' : 'Status'}</div>
            <div className={`clock-pill ${clockTone(left)}`}>{lot.status === 'LIVE' ? formatRemaining(left) : lot.status}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LotBrowsePage() {
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const categoryId = params.get('category') ?? '';
  const sort = (params.get('sort') as Sort) in SORTS ? (params.get('sort') as Sort) : 'ending';
  const soonOnly = params.get('soon') === '1';

  const [pages, setPages] = useState(1);
  const [extra, setExtra] = useState<Lot[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = useAsync(() => api.categories(), []);
  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data]
  );

  const query: LotBrowseQuery = { status: 'LIVE', q: q || undefined, categoryId: categoryId || undefined, limit: PAGE_SIZE, ...SORTS[sort].query };
  const key = JSON.stringify(query);
  const result = useAsync(() => api.browseLots(query), [key]);
  // Header stats: total open lots, and how many close within the hour.
  const ending = useAsync(() => api.browseLots({ status: 'LIVE', sortBy: 'endTime', sortOrder: 'asc', limit: 50 }), []);

  useEffect(() => {
    setPages(1);
    setExtra([]);
  }, [key]);

  function update(next: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = await api.browseLots({ ...query, page: pages + 1 });
      setExtra((e) => [...e, ...next.items]);
      setPages((n) => n + 1);
    } finally {
      setLoadingMore(false);
    }
  }

  const all = [...(result.data?.items ?? []), ...extra];
  const lots = soonOnly ? all.filter((l) => new Date(l.endTime).getTime() - now < HOUR) : all;
  const closingHour = (ending.data?.items ?? []).filter((l) => {
    const left = new Date(l.endTime).getTime() - now;
    return left > 0 && left < HOUR;
  }).length;
  const hasMore = result.data ? pages < result.data.meta.totalPages : false;
  const filtered = Boolean(q || categoryId || soonOnly);

  return (
    <AppShell>
      <header className="browse-head">
        <div className="browse-head-top">
          <div>
            <div className="eyebrow">Catalog / open auctions</div>
            <h1>Surplus lots</h1>
          </div>
          <div className="browse-stats">
            <div>
              <div className="eyebrow">Open</div>
              <div className="v">{ending.data ? ending.data.meta.total.toLocaleString('en-US') : '—'}</div>
            </div>
            <div>
              <div className="eyebrow">Closing &lt;1h</div>
              <div className="v warn">{ending.data ? closingHour : '—'}</div>
            </div>
          </div>
        </div>

        <div className="browse-filters">
          <span className="eyebrow" style={{ paddingRight: 4 }}>
            Filter
          </span>
          <select value={categoryId} onChange={(e) => update({ category: e.target.value || null })} aria-label="Category">
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className={`soon-toggle ${soonOnly ? 'on' : ''}`} onClick={() => update({ soon: soonOnly ? null : '1' })} aria-pressed={soonOnly}>
            CLOSING SOON ONLY
          </button>
          {q && (
            <button className="filter-chip" onClick={() => update({ q: null })}>
              “{q}” ×
            </button>
          )}
          <span className="eyebrow sep">Sort</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value === 'ending' ? null : e.target.value })} aria-label="Sort">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <div className="browse-count">
            {result.data ? `${lots.length} OF ${result.data.meta.total} SHOWN` : ''}
          </div>
        </div>
      </header>

      <div style={{ padding: '22px 24px 40px' }}>
        {result.error ? (
          <ErrorBox error={result.error} onRetry={result.reload} />
        ) : result.loading && !result.data ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Loading lots…
          </div>
        ) : lots.length === 0 ? (
          <div className="card browse-empty-wrap">
            <EmptyState
              icon="⌕"
              title={filtered ? 'No lots match these filters' : 'No auctions are open right now'}
              actions={
                filtered ? (
                  <button className="btn btn-primary" onClick={() => setParams({}, { replace: true })}>
                    Clear all filters
                  </button>
                ) : (
                  <Link to="/buyer" className="btn btn-secondary">
                    Back to dashboard
                  </Link>
                )
              }
            >
              {filtered
                ? `Nothing open matches${q ? ` “${q}”` : ''}${categoryId ? ` in ${categoryName.get(categoryId) ?? 'this category'}` : ''}${soonOnly ? ' closing within the hour' : ''}. Widen the search to see more.`
                : 'New lots are listed every day. Check back soon.'}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="lot-grid">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} category={categoryName.get(lot.categoryId)} now={now} />
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more lots'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
