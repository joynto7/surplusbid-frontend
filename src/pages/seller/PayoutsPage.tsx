import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill } from '../../components/ui';
import { formatDate, formatMoney, lotCode } from '../../lib/format';
import { proceeds, useSellerInventory } from '../../lib/seller';
import '../buyer/buyer.css';
import './seller.css';

type Filter = 'all' | 'SOLD' | 'UNSOLD';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'UNSOLD', label: 'No sale' },
];

const whole = (cents: number) => formatMoney(cents).replace(/\.\d\d$/, '');

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PayoutsPage() {
  const navigate = useNavigate();
  const { inventory, error, loading, reload } = useSellerInventory();
  const [filter, setFilter] = useState<Filter>('all');

  const closed = (inventory ?? [])
    .filter(({ lot }) => lot.status === 'SOLD' || lot.status === 'UNSOLD')
    .sort((a, b) => b.lot.endTime.localeCompare(a.lot.endTime));
  const sold = closed.filter(({ lot }) => lot.status === 'SOLD');
  const year = new Date().getFullYear();
  const ytd = sold.filter(({ lot }) => new Date(lot.endTime).getFullYear() === year);
  const sums = sold.reduce(
    (acc, { lot }) => {
      const p = proceeds(lot, lot.currentHighestBidAmountCents ?? 0);
      return { hammer: acc.hammer + p.hammer, deposit: acc.deposit + p.deposit, balance: acc.balance + p.balance };
    },
    { hammer: 0, deposit: 0, balance: 0 }
  );
  const rows = closed.filter(({ lot }) => filter === 'all' || lot.status === filter);
  const shownTotal = rows.reduce((sum, { lot }) => sum + (lot.status === 'SOLD' ? lot.currentHighestBidAmountCents ?? 0 : 0), 0);

  function exportCsv() {
    downloadCsv(
      [
        ['Lot', 'Title', 'Status', 'Hammer (USD)', 'Buyer deposit (USD)', 'Buyer balance (USD)', 'Closed'],
        ...rows.map(({ lot }) => {
          const p = proceeds(lot, lot.status === 'SOLD' ? lot.currentHighestBidAmountCents ?? 0 : 0);
          return [lotCode(lot.id), lot.title, lot.status === 'SOLD' ? 'Sold' : 'No sale', (p.hammer / 100).toFixed(2), (p.deposit / 100).toFixed(2), (p.balance / 100).toFixed(2), lot.endTime.slice(0, 10)];
        }),
      ],
      `surplusbid-sales-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1080 }}>
        <h1 className="page-title">Payouts and earnings</h1>
        <p className="page-lede">Every lot that has closed, with what the buyer owes. Balances are due within 48 hours of close.</p>

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={error} onRetry={reload} />
          </div>
        )}

        <div className="stat-row" style={{ marginTop: 20 }}>
          <div className="stat">
            <div className="label">Sold, year to date</div>
            <div className="value">{inventory ? whole(ytd.reduce((s, { lot }) => s + (lot.currentHighestBidAmountCents ?? 0), 0)) : '—'}</div>
            <div className="note">{inventory ? `${ytd.length} lot${ytd.length === 1 ? '' : 's'}` : ' '}</div>
          </div>
          <div className="stat">
            <div className="label">Buyer deposits applied</div>
            <div className="value">{inventory ? whole(sums.deposit) : '—'}</div>
            <div className="note">Held from winning bidders</div>
          </div>
          <div className="stat">
            <div className="label">Balances from buyers</div>
            <div className="value">{inventory ? whole(sums.balance) : '—'}</div>
            <div className="note">Hammer minus deposit</div>
          </div>
          <div className="stat">
            <div className="label">Closed without a sale</div>
            <div className="value">{inventory ? closed.length - sold.length : '—'}</div>
            <div className="note">No bids at close</div>
          </div>
        </div>

        <div className="callout info" style={{ marginTop: 16, boxShadow: 'var(--sh)' }}>
          <span className="body">
            <strong>Payouts are arranged by SurplusBid billing</strong>
            <span style={{ color: 'var(--body)' }}>
              Automatic bank transfers aren't set up yet. Once a buyer pays, billing sends your proceeds. Questions:{' '}
              <a href="mailto:billing@surplusbid.com">billing@surplusbid.com</a>.
            </span>
          </span>
        </div>

        <div className="chips" style={{ marginTop: 20, alignItems: 'center' }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
              {f.label}
            </button>
          ))}
          <button className="btn btn-secondary btn-md" style={{ marginLeft: 'auto', borderRadius: 6 }} onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        </div>

        <div className="card card-flush" style={{ marginTop: 12 }}>
          {loading && !inventory ? (
            <div className="card-empty">Loading sales…</div>
          ) : rows.length === 0 ? (
            <EmptyState icon="$" title="No closed lots yet">
              When one of your auctions closes, the sale shows up here with the hammer price and what the buyer owes.
            </EmptyState>
          ) : (
            <>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sale</th>
                      <th className="num">Hammer</th>
                      <th className="num">Deposit</th>
                      <th className="num">Balance</th>
                      <th>Status</th>
                      <th className="num">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ lot }) => {
                      const isSold = lot.status === 'SOLD';
                      const p = proceeds(lot, isSold ? lot.currentHighestBidAmountCents ?? 0 : 0);
                      return (
                        <tr key={lot.id} className="clickable" onClick={() => navigate(`/seller/lots/${lot.id}`)}>
                          <td style={{ padding: '10px 16px' }}>
                            <span className="code">{lotCode(lot.id)}</span>
                            <span className="desc">{lot.title}</span>
                          </td>
                          <td className="num">{isSold ? formatMoney(p.hammer) : '—'}</td>
                          <td className="num">{isSold ? formatMoney(p.deposit) : '—'}</td>
                          <td className="num" style={{ fontWeight: 600, fontSize: 13 }}>
                            {isSold ? formatMoney(p.balance) : '—'}
                          </td>
                          <td>{isSold ? <Pill tone="ok">Sold</Pill> : <Pill tone="bad">No sale</Pill>}</td>
                          <td className="num muted" style={{ fontSize: 11.5 }}>
                            {formatDate(lot.endTime)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, padding: '13px 16px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {rows.length} of {closed.length} closed lots
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--body)' }}>
                  Hammer shown: <span className="mono" style={{ fontWeight: 600 }}>{formatMoney(shownTotal)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
