import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { caseCode, isMissingEndpoint } from '../../lib/admin';
import { api, type DisputeStatus } from '../../lib/api';
import { formatDate, lotCode } from '../../lib/format';
import ConsoleHeader from './ConsoleHeader';
import MissingEndpoint from './MissingEndpoint';
import '../buyer/buyer.css';
import './admin.css';

const DAY = 24 * 3600 * 1000;
const FILTERS: { key: DisputeStatus | 'all'; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export default function DisputeQueuePage() {
  const now = useNow(60_000);
  const [params, setParams] = useSearchParams();
  const filter = (FILTERS.some((f) => f.key === params.get('status')) ? params.get('status') : 'OPEN') as DisputeStatus | 'all';
  const stats = useAsync(() => api.adminStats(), []);
  const list = useAsync(() => api.adminDisputes({ status: filter === 'all' ? undefined : filter, limit: 50 }), [filter]);
  const missing = isMissingEndpoint(list.error);
  const items = [...(list.data?.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const oldest = items.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

  return (
    <AppShell>
      <ConsoleHeader
        eyebrow="Platform / control room"
        title="Dispute console"
        flags={
          stats.data
            ? [
                { text: `■ ${stats.data.openDisputes} DISPUTE${stats.data.openDisputes === 1 ? '' : 'S'} OPEN`, hot: stats.data.openDisputes > 0 },
                ...(oldest ? [{ text: `OLDEST ${Math.max(1, Math.round((now - new Date(oldest.createdAt).getTime()) / DAY))}D` }] : []),
              ]
            : undefined
        }
      />
      <div className="console-body">
        <div className="chips" style={{ marginBottom: 14 }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} aria-pressed={filter === f.key} onClick={() => setParams(f.key === 'OPEN' ? {} : { status: f.key }, { replace: true })}>
              {f.label}
            </button>
          ))}
        </div>

        {missing ? (
          <MissingEndpoint what="Disputes" endpoint="GET /disputes" count={stats.data?.openDisputes} />
        ) : list.error ? (
          <ErrorBox error={list.error} onRetry={list.reload} />
        ) : list.loading && !list.data ? (
          <p className="muted">Loading cases…</p>
        ) : items.length === 0 ? (
          <div className="card">
            <EmptyState icon="⚖" title={filter === 'OPEN' ? 'No open disputes' : 'Nothing here'}>
              Buyers and sellers can open a case on a lot they won or sold. New cases appear here.
            </EmptyState>
          </div>
        ) : (
          <div className="vq-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))' }}>
            {items.map((d) => {
              const days = Math.max(0, Math.floor((now - new Date(d.createdAt).getTime()) / DAY));
              const closed = d.status === 'RESOLVED' || d.status === 'REJECTED';
              return (
                <Link key={d.id} to={`/admin/disputes/${d.id}`} className={`case-card ${closed ? 'fresh' : days >= 5 ? '' : days >= 2 ? 'aging' : 'fresh'}`}>
                  <div className="top">
                    <span className="k">
                      {caseCode(d.id)} · {closed ? d.status : `${days}D OPEN`}
                    </span>
                    <span className="lot">{lotCode(d.lotId)}</span>
                  </div>
                  <div className="t">{d.reason}</div>
                  <p>{d.description}</p>
                  <div className="foot">
                    <span>FILED {formatDate(d.createdAt).toUpperCase()}</span>
                    <span>{closed && d.resolvedAt ? `CLOSED ${formatDate(d.resolvedAt).toUpperCase()}` : 'AWAITING OPERATOR'}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
