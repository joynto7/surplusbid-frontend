import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { ErrorBox, errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useNow } from '../../hooks/useNow';
import { ApiError, api, type Lot } from '../../lib/api';
import { formatRelative, isUuid, lotCode } from '../../lib/format';
import { formToInput, lotToForm, validateLotForm, type LotFormValues } from '../../lib/seller';
import NotFoundPage from '../system/NotFoundPage';
import { DetailsFields, PricingFields, ProceedsAtReserve, ScheduleFields } from './LotFormFields';
import '../buyer/buyer.css';
import './seller.css';

export default function EditDraftPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const flash = location.state as { saved?: boolean; publishError?: string } | null;
  useNow(30_000); // keep "Saved n min ago" fresh

  const lotReq = useAsync(() => (isUuid(id) ? api.lot(id) : Promise.reject(new ApiError(404, 'Lot not found'))), [id]);
  const categories = useAsync(() => api.categories(), []);
  const [lot, setLot] = useState<Lot>();
  const [values, setValues] = useState<LotFormValues>();
  const [savedAt, setSavedAt] = useState<string>();
  const [busy, setBusy] = useState<'save' | 'publish' | 'delete'>();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | undefined>(
    flash?.publishError ? { ok: false, text: `Saved as a draft, but publishing failed: ${flash.publishError}` } : flash?.saved ? { ok: true, text: 'Draft saved.' } : undefined
  );
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!lotReq.data) return;
    setLot(lotReq.data);
    setValues(lotToForm(lotReq.data));
    setSavedAt(lotReq.data.updatedAt ?? lotReq.data.createdAt);
  }, [lotReq.data]);

  const v = useMemo(() => (values ? validateLotForm(values) : undefined), [values]);

  if (lotReq.error instanceof ApiError && (lotReq.error.status === 404 || lotReq.error.status === 403)) return <NotFoundPage />;
  if (lot && lot.status !== 'DRAFT') return <Navigate to={`/seller/lots/${lot.id}`} replace />;

  const set = <K extends keyof LotFormValues>(key: K, value: LotFormValues[K]) => {
    setValues((cur) => (cur ? { ...cur, [key]: value } : cur));
    setMsg(undefined);
  };
  const dirty = lot && values ? JSON.stringify(values) !== JSON.stringify(lotToForm(lot)) : false;

  async function save(): Promise<boolean> {
    if (!values || !v) return false;
    if (!v.ok) {
      setShowErrors(true);
      setMsg({ ok: false, text: 'Fix the highlighted fields before saving.' });
      return false;
    }
    const updated = await api.updateLot(id, formToInput(values));
    setLot({ ...updated, reservePriceCents: formToInput(values).reservePriceCents });
    setSavedAt(new Date().toISOString());
    return true;
  }

  async function run(kind: 'save' | 'publish' | 'delete') {
    setBusy(kind);
    setMsg(undefined);
    try {
      if (kind === 'delete') {
        if (!window.confirm('Delete this draft? This can’t be undone.')) return;
        await api.deleteLot(id);
        navigate('/seller/listings', { replace: true });
        return;
      }
      if (!(await save())) return;
      if (kind === 'publish') {
        await api.publishLot(id);
        navigate(`/seller/lots/${id}`, { replace: true });
        return;
      }
      setMsg({ ok: true, text: 'Draft saved.' });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(undefined);
    }
  }

  const checks = v
    ? [
        { ok: v.sections.details, label: v.sections.details ? 'Title, category and condition report set' : 'Details are incomplete' },
        { ok: (lot?.images.length ?? 0) > 0, label: lot?.images.length ? `${lot.images.length} photo${lot.images.length === 1 ? '' : 's'} attached` : 'No photos attached' },
        { ok: v.sections.pricing, label: v.sections.pricing ? 'Starting price, reserve and increment set' : 'Pricing is incomplete' },
        { ok: v.sections.schedule, label: v.sections.schedule ? 'Open and close times set' : 'Schedule needs attention' },
      ]
    : [];

  return (
    <AppShell>
      <div className="page" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <Link to="/seller/listings" className="back-link">
            ← Back to inventory
          </Link>
          {lot && <span className="pill mono">{lotCode(lot.id).replace('LOT', 'DRAFT')}</span>}
          {savedAt && <span className="muted" style={{ fontSize: 12.5 }}>{dirty ? 'Unsaved changes' : `Saved ${formatRelative(savedAt)}`}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
            <button className="btn btn-secondary btn-md" onClick={() => run('save')} disabled={!lot || !dirty || Boolean(busy)}>
              {busy === 'save' ? 'Saving…' : 'Save draft'}
            </button>
            <button className="btn-ghost-sm danger btn-md" onClick={() => run('delete')} disabled={!lot || Boolean(busy)}>
              Delete draft
            </button>
          </div>
        </div>

        <h1 className="page-title" style={{ marginTop: 14 }}>
          Edit draft lot
        </h1>
        <p className="page-lede" style={{ maxWidth: '64ch' }}>
          This lot hasn't been published, so everything below is editable. Once it goes live, the details, price and schedule lock.
        </p>

        {lotReq.error && !(lotReq.error instanceof ApiError && lotReq.error.status === 404) ? (
          <div style={{ marginTop: 16 }}>
            <ErrorBox error={lotReq.error} onRetry={lotReq.reload} />
          </div>
        ) : !lot || !values || !v ? (
          <p className="muted">Loading draft…</p>
        ) : (
          <>
            {lot.images.length === 0 && (
              <div className="callout warn" style={{ marginTop: 18 }}>
                <span className="body">
                  This draft has no photos. Photos can only be added when a lot is created, so to include some, list it again with photos and
                  delete this draft.
                </span>
                <Link to={`/seller/lots/new?from=${lot.id}`} className="btn btn-warn btn-md">
                  Copy into a new listing
                </Link>
              </div>
            )}

            <div className="draft-grid">
              <div className="stack">
                <div className="card card-pad">
                  <div className="section-title">Details</div>
                  <div style={{ marginTop: 16 }}>
                    <DetailsFields values={values} set={set} errors={v.errors} showErrors={showErrors} categories={categories.data ?? []} labels="plain" />
                  </div>
                </div>

                <div className="card card-pad">
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10 }}>
                    <div className="section-title">Photos</div>
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      The first photo is the catalog thumbnail. Photos are fixed once a lot is created.
                    </span>
                  </div>
                  <div className="photo-grid" style={{ marginTop: 16 }}>
                    {lot.images.length ? (
                      lot.images.map((src, i) => (
                        <div className="photo" key={src}>
                          <img src={src} alt={`Photo ${i + 1}`} className="img-cover" />
                          <span className="lbl">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="photo-add" style={{ cursor: 'default' }}>
                        No photos
                      </div>
                    )}
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="section-title">Price and schedule</div>
                  <div style={{ marginTop: 16 }}>
                    <PricingFields values={values} set={set} errors={v.errors} showErrors={showErrors} labels="plain" />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <ScheduleFields values={values} set={set} errors={v.errors} showErrors={showErrors} labels="plain" />
                  </div>
                </div>

                {msg && <div className={msg.ok ? 'form-ok' : 'form-error'}>{msg.text}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => run('publish')} disabled={Boolean(busy)}>
                    {busy === 'publish' ? 'Publishing…' : 'Publish lot'}
                  </button>
                  <Link to={`/lots/${lot.id}`} className="btn btn-secondary btn-lg">
                    Preview as buyer
                  </Link>
                </div>
              </div>

              <aside className="aside-stack">
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.01em' }}>Before you publish</div>
                  <div className="checks">
                    {checks.map((c) => (
                      <div key={c.label}>
                        <span className={`mark ${c.ok ? '' : 'warn'}`}>{c.ok ? '✓' : '!'}</span>
                        <span style={{ minWidth: 0, flex: 1 }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card aside-card rule">
                  <div className="t">Publishing is immediate</div>
                  <p>The lot goes live and starts taking bids as soon as you publish. There's no review queue.</p>
                </div>
                <div className="card aside-card flat">
                  <div className="t">Projected sale</div>
                  <ProceedsAtReserve values={values} variant="list" />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
