import { useState, type FormEvent } from 'react';
import AppShell from '../../components/AppShell';
import { EmptyState, ErrorBox, Pill, errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../lib/api';
import '../buyer/buyer.css';
import './admin.css';

async function loadCategories() {
  const cats = await api.categories();
  const counts = await Promise.all(
    cats.map(async (c) => {
      const [live, sold] = await Promise.all([
        api.browseLots({ categoryId: c.id, status: 'LIVE', limit: 1 }),
        api.browseLots({ categoryId: c.id, status: 'SOLD', limit: 1 }),
      ]);
      return { ...c, live: live.meta.total, sold: sold.meta.total };
    })
  );
  return counts;
}

export default function CategoriesPage() {
  const { data, error, loading, reload } = useAsync(loadCategories, []);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [created, setCreated] = useState<string>();

  async function create(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setFormError('Use at least 2 characters.');
    setBusy(true);
    setFormError(undefined);
    try {
      const c = await api.createCategory(name.trim());
      setCreated(c.name);
      setName('');
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <h1 className="page-title">Category management</h1>
            <p className="page-lede">Buyers filter on these and sellers must pick one for every lot.</p>
          </div>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            New category
          </button>
        </div>

        {created && !open && (
          <div className="form-ok" style={{ marginTop: 16 }}>
            Created “{created}”. It's available to sellers now.
          </div>
        )}

        {open && (
          <form className="card" style={{ padding: 20, marginTop: 16, borderColor: 'var(--blue)' }} onSubmit={create}>
            <div className="card-title">New category</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginTop: 14 }}>
              <label>
                <span className="field-label">Name</span>
                <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Foundry equipment" autoFocus />
              </label>
              <label>
                <span className="field-label">Slug</span>
                <input className="field-input readonly mono" readOnly value={slug || '—'} />
              </label>
            </div>
            {formError && (
              <div className="form-error" style={{ marginTop: 12 }}>
                {formError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create category'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="card card-flush" style={{ marginTop: 16 }}>
          {error ? (
            <div style={{ padding: 16 }}>
              <ErrorBox error={error} onRetry={reload} />
            </div>
          ) : loading && !data ? (
            <div className="card-empty">Loading categories…</div>
          ) : data!.length === 0 ? (
            <EmptyState icon="▦" title="No categories yet">
              Sellers can't list a lot until at least one category exists.
            </EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Live lots</th>
                  <th className="num">Sold lots</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data!.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                        {c.slug}
                      </span>
                    </td>
                    <td className="num">{c.live || '—'}</td>
                    <td className="num">{c.sold || '—'}</td>
                    <td>
                      <Pill tone="ok">Active</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>
          Categories can't be renamed, nested or deleted yet — the API only supports creating them.
        </p>
      </div>
    </AppShell>
  );
}
