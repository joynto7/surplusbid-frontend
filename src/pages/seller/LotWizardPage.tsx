import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { errorMessage } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../lib/api';
import { formatDateTime, formatMoney } from '../../lib/format';
import {
  MAX_PHOTOS,
  emptyLotForm,
  formToInput,
  lotToForm,
  validateLotForm,
  type LotFormSection,
  type LotFormValues,
} from '../../lib/seller';
import { DetailsFields, PhotoPicker, PricingFields, ProceedsAtReserve, ScheduleFields } from './LotFormFields';
import '../buyer/buyer.css';
import './seller.css';

type Step = 0 | 1 | 2 | 3 | 4;
const SECTION_OF: (LotFormSection | 'photos' | 'review')[] = ['details', 'photos', 'pricing', 'schedule', 'review'];

export default function LotWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [values, setValues] = useState<LotFormValues>(() => emptyLotForm());
  const [photos, setPhotos] = useState<File[]>([]);
  const [step, setStep] = useState<Step>(0);
  const [tried, setTried] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<'draft' | 'publish'>();
  const [error, setError] = useState<string>();
  const categories = useAsync(() => api.categories(), []);

  // "Relist" from a closed lot: copy its details and pricing, but not the schedule.
  const from = params.get('from');
  useEffect(() => {
    if (!from) return;
    api
      .lot(from)
      .then((lot) => {
        const fresh = emptyLotForm();
        setValues({ ...lotToForm(lot), startTime: fresh.startTime, endTime: fresh.endTime });
      })
      .catch(() => {});
  }, [from]);

  const v = useMemo(() => validateLotForm(values), [values]);
  const thumbUrl = useMemo(() => (photos[0] ? URL.createObjectURL(photos[0]) : undefined), [photos]);
  useEffect(
    () => () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    },
    [thumbUrl]
  );
  const set = <K extends keyof LotFormValues>(key: K, value: LotFormValues[K]) => setValues((cur) => ({ ...cur, [key]: value }));
  const categoryName = categories.data?.find((c) => c.id === values.categoryId)?.name;
  const dirty = JSON.stringify(values) !== JSON.stringify(emptyLotForm()) || photos.length > 0;

  const done = [v.sections.details, photos.length > 0, v.sections.pricing, v.sections.schedule, false];
  const notes = [
    values.title ? values.title.slice(0, 28) : 'Title · category · condition',
    `${photos.length} of ${MAX_PHOTOS} attached`,
    values.startingPrice ? `Open ${formatMoney(Math.round(Number(values.startingPrice.replace(/[$,]/g, '')) * 100) || 0).replace(/\.00$/, '')}` : 'Starting price · reserve',
    v.sections.schedule ? `Closes ${formatDateTime(new Date(values.endTime).toISOString())}` : 'Open and close times',
    'Publish or save as draft',
  ];
  const titles = ['Details', 'Photos', 'Price & reserve', 'Schedule', 'Review & submit'];

  function next() {
    const section = SECTION_OF[step];
    setTried((t) => new Set(t).add(step));
    if (section === 'details' || section === 'pricing' || section === 'schedule') {
      if (!v.sections[section]) return;
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  }

  async function create(publish: boolean) {
    if (!v.ok) {
      setTried(new Set([0, 2, 3]));
      setStep(!v.sections.details ? 0 : !v.sections.pricing ? 2 : 3);
      setError('Some details are missing. Fix the highlighted fields, then save again.');
      return;
    }
    setBusy(publish ? 'publish' : 'draft');
    setError(undefined);
    let lotId: string | undefined;
    try {
      const lot = await api.createLot(formToInput(values), photos);
      lotId = lot.id;
      if (publish) {
        await api.publishLot(lot.id);
        navigate(`/seller/lots/${lot.id}`, { replace: true });
      } else {
        navigate(`/seller/lots/${lot.id}/edit`, { replace: true, state: { saved: true } });
      }
    } catch (err) {
      if (lotId) {
        // Created but not published: land on the draft so nothing is lost.
        navigate(`/seller/lots/${lotId}/edit`, { replace: true, state: { publishError: errorMessage(err) } });
      } else {
        setError(errorMessage(err));
        setBusy(undefined);
      }
    }
  }

  const show = (s: number) => tried.has(s);

  return (
    <AppShell>
      <header className="wiz-head">
        <div>
          <div className="eyebrow">Seller / new listing</div>
          <h1>List a lot</h1>
        </div>
        <div className="actions">
          <button className="btn-secondary small-caps-btn" onClick={() => create(false)} disabled={Boolean(busy)} title={v.ok ? undefined : 'Complete every step to save a draft'}>
            {busy === 'draft' ? 'SAVING…' : 'SAVE DRAFT'}
          </button>
          <button
            className="btn-secondary small-caps-btn"
            disabled={Boolean(busy)}
            onClick={() => {
              if (!dirty || window.confirm('Discard this listing? Nothing has been saved yet.')) navigate('/seller/listings');
            }}
          >
            DISCARD
          </button>
        </div>
      </header>

      <div className="wiz-layout">
        <aside className="wiz-steps">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Manifest checklist
          </div>
          <div className="list">
            {titles.map((t, i) => (
              <button key={t} className={`wiz-step ${i === step ? 'on' : done[i] ? 'done' : ''}`} onClick={() => setStep(i as Step)} aria-current={i === step ? 'step' : undefined}>
                <span className="mk">{done[i] && i !== step ? '✓' : i + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{t}</span>
                  <span className="n">{notes[i]}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="wiz-meta">
            <div>
              <span>STAMPED</span>
              <span>{done.filter(Boolean).length} / 4</span>
            </div>
            <div>
              <span>PHOTOS</span>
              <span>UP TO {MAX_PHOTOS}</span>
            </div>
            <div>
              <span>GOES LIVE</span>
              <span>ON PUBLISH</span>
            </div>
          </div>
        </aside>

        <div className="wiz-body">
          {error && (
            <div className="form-error panel" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}
          {step === 0 && (
            <div className="panel">
              <h2>01 · Details</h2>
              <p className="hint">Buyers filter on category first. Be specific — vague titles get fewer bids.</p>
              <DetailsFields values={values} set={set} errors={v.errors} showErrors={show(0)} categories={categories.data ?? []} />
              <div className="wiz-actions" style={{ marginTop: 20 }}>
                <button className="btn-primary wiz-next" style={{ flex: 'none' }} onClick={next}>
                  Stamp details · next
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="panel">
              <h2>02 · Photos</h2>
              <p className="hint">
                Up to {MAX_PHOTOS}: full machine, nameplate, control panel, wear points and any damage. The first photo is the catalog thumbnail.
                Photos can't be changed after the lot is created.
              </p>
              <PhotoPicker files={photos} onChange={setPhotos} />
              {photos.length === 0 && (
                <div className="callout warn" style={{ marginTop: 12, padding: '10px 12px' }}>
                  <span className="body" style={{ fontSize: 12.5 }}>
                    Lots without photos can still be published, but buyers rarely bid on them. Add at least a full-machine shot and the nameplate.
                  </span>
                </div>
              )}
              <div className="wiz-actions" style={{ marginTop: 20 }}>
                <button className="btn-primary wiz-next" style={{ flex: 'none' }} onClick={next}>
                  Stamp photos · next
                </button>
                <button className="btn-secondary" onClick={() => setStep(0)}>
                  BACK
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="panel">
              <h2>03 · Price &amp; reserve</h2>
              <p className="hint">The reserve is never shown to buyers. Pick an increment that's about 2–5% of what you expect the lot to fetch.</p>
              <PricingFields values={values} set={set} errors={v.errors} showErrors={show(2)} />
              <ProceedsAtReserve values={values} />
              <div className="wiz-actions" style={{ marginTop: 20 }}>
                <button className="btn-primary wiz-next" style={{ flex: 'none' }} onClick={next}>
                  Stamp pricing · next
                </button>
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  BACK
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="panel">
              <h2>04 · Schedule</h2>
              <p className="hint">Lots closing Tuesday–Thursday afternoons draw the most late bidding. Times are in your local timezone.</p>
              <ScheduleFields values={values} set={set} errors={v.errors} showErrors={show(3)} />
              <div className="wiz-actions" style={{ marginTop: 20 }}>
                <button className="btn-primary wiz-next" style={{ flex: 'none' }} onClick={next}>
                  Stamp schedule · next
                </button>
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  BACK
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="panel">
              <h2>05 · Review &amp; submit</h2>
              <p className="hint">This is the card buyers will see. Publishing puts it live straight away; a draft stays private until you publish it.</p>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <article className="lot-card" style={{ width: 258 }}>
                  <div className="lot-card-img">
                    {thumbUrl ? <img src={thumbUrl} alt="" className="img-cover" /> : <span className="img-ph" style={{ display: 'block', width: '100%', height: '100%', border: 0 }} />}
                    <div className="cond">{values.condition}</div>
                  </div>
                  <div className="lot-card-body">
                    <span className="code">NEW LISTING</span>
                    <h3>{values.title || 'Untitled lot'}</h3>
                    {categoryName && <div className="cat-tag">{categoryName}</div>}
                    <div className="lot-card-foot">
                      <div>
                        <div className="eyebrow">Opening bid</div>
                        <div className="bid">{v.sections.pricing ? formatMoney(formToInput(values).startingPriceCents) : '—'}</div>
                      </div>
                    </div>
                  </div>
                </article>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div className="review-rows">
                    {[
                      ['DETAILS', v.sections.details],
                      ['PHOTOS', photos.length > 0, `${photos.length} OF ${MAX_PHOTOS}`],
                      ['PRICING', v.sections.pricing],
                      ['SCHEDULE', v.sections.schedule],
                    ].map(([k, ok, custom]) => (
                      <div key={k as string}>
                        <span className="k">{k as string}</span>
                        <span className={ok ? 'ok' : k === 'PHOTOS' ? 'warn' : 'bad'}>
                          {custom ? `${ok ? '■' : '▲'} ${custom}` : ok ? '■ COMPLETE' : '▲ INCOMPLETE'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="wiz-actions" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                    <button className="btn-primary wiz-next" style={{ flex: 'none' }} onClick={() => create(true)} disabled={Boolean(busy)}>
                      {busy === 'publish' ? 'Publishing…' : 'Publish lot'}
                    </button>
                    <button className="btn-secondary" onClick={() => create(false)} disabled={Boolean(busy)}>
                      {busy === 'draft' ? 'SAVING…' : 'SAVE AS DRAFT'}
                    </button>
                    <button className="btn-secondary" onClick={() => setStep(3)} disabled={Boolean(busy)}>
                      BACK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
