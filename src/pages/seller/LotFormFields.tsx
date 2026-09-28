import { useEffect, useMemo, useRef } from 'react';
import type { Category } from '../../lib/api';
import { DEPOSIT_PERCENT } from '../../lib/buyer';
import { formatMoney } from '../../lib/format';
import { CONDITIONS, INCREMENTS, MAX_PHOTOS, proceeds, type LotFormErrors, type LotFormValues } from '../../lib/seller';

type Setter = <K extends keyof LotFormValues>(key: K, value: LotFormValues[K]) => void;

interface FieldsProps {
  values: LotFormValues;
  set: Setter;
  errors: LotFormErrors;
  /** Only show an error once the user has tried to move on. */
  showErrors: boolean;
  /** Label style: 'caps' for the wizard (Standard file), 'plain' for the C-section editor. */
  labels?: 'caps' | 'plain';
}

function Label({ text, caps }: { text: string; caps: boolean }) {
  return <span className={caps ? 'cap-label' : 'field-label'}>{text}</span>;
}

function Err({ show, msg }: { show: boolean; msg?: string }) {
  return show && msg ? <span className="field-error">{msg}</span> : null;
}

export function DetailsFields({ values, set, errors, showErrors, categories, labels = 'caps' }: FieldsProps & { categories: Category[] }) {
  const caps = labels === 'caps';
  const conditionOptions = CONDITIONS.includes(values.condition) ? CONDITIONS : [values.condition, ...CONDITIONS];
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <label>
        <Label text="Lot title" caps={caps} />
        <input
          className={`field-input ${showErrors && errors.title ? 'has-error' : ''}`}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Surface grinder, 8 x 18 hydraulic · Okamoto ACC-818"
        />
        <Err show={showErrors} msg={errors.title} />
      </label>
      <div className="grid-3" style={caps ? undefined : { gridTemplateColumns: '1fr 1fr 100px' }}>
        <label>
          <Label text="Category" caps={caps} />
          <select className={`field-input ${showErrors && errors.categoryId ? 'has-error' : ''}`} value={values.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Err show={showErrors} msg={errors.categoryId} />
        </label>
        <label>
          <Label text="Condition" caps={caps} />
          <select className="field-input" value={values.condition} onChange={(e) => set('condition', e.target.value)}>
            {conditionOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <Label text={caps ? 'Quantity' : 'Qty'} caps={caps} />
          <input
            className={`field-input mono ${showErrors && errors.quantity ? 'has-error' : ''}`}
            inputMode="numeric"
            value={values.quantity}
            onChange={(e) => set('quantity', e.target.value)}
          />
          <Err show={showErrors} msg={errors.quantity} />
        </label>
      </div>
      <label>
        <Label text="Condition report" caps={caps} />
        <textarea
          className={`field-input ${showErrors && errors.description ? 'has-error' : ''}`}
          rows={5}
          style={{ lineHeight: 1.55, resize: 'vertical' }}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What you saw at inspection, what's included, and how buyers get it out: dock, clearance, forklift, removal hours."
        />
        <Err show={showErrors} msg={errors.description} />
      </label>
    </div>
  );
}

export function PricingFields({ values, set, errors, showErrors, labels = 'caps' }: FieldsProps) {
  const caps = labels === 'caps';
  const custom = !INCREMENTS.includes(values.bidIncrement);
  return (
    <>
      <div className="grid-2">
        <label>
          <Label text="Starting price" caps={caps} />
          <input
            className={`field-input money-input ${showErrors && errors.startingPrice ? 'has-error' : ''}`}
            inputMode="decimal"
            value={values.startingPrice}
            onChange={(e) => set('startingPrice', e.target.value)}
            placeholder="6,500.00"
          />
          <Err show={showErrors} msg={errors.startingPrice} />
        </label>
        <label>
          <Label text="Reserve (hidden from buyers)" caps={caps} />
          <input
            className={`field-input money-input ${showErrors && errors.reservePrice ? 'has-error' : ''}`}
            inputMode="decimal"
            value={values.reservePrice}
            onChange={(e) => set('reservePrice', e.target.value)}
            placeholder="9,000.00"
          />
          <Err show={showErrors} msg={errors.reservePrice} />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <Label text="Bid increment" caps={caps} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 2 }}>
          <div className="seg seg-mono" role="radiogroup" aria-label="Bid increment">
            {INCREMENTS.map((inc) => (
              <button type="button" key={inc} role="radio" aria-checked={values.bidIncrement === inc} className={values.bidIncrement === inc ? 'on' : ''} onClick={() => set('bidIncrement', inc)}>
                ${inc}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={custom} className={custom ? 'on' : ''} onClick={() => !custom && set('bidIncrement', '')}>
              CUSTOM
            </button>
          </div>
          {custom && (
            <input
              className={`field-input mono ${showErrors && errors.bidIncrement ? 'has-error' : ''}`}
              style={{ width: 130 }}
              inputMode="decimal"
              value={values.bidIncrement}
              onChange={(e) => set('bidIncrement', e.target.value)}
              placeholder="$ amount"
              aria-label="Custom bid increment in dollars"
              autoFocus
            />
          )}
        </div>
        <Err show={showErrors} msg={errors.bidIncrement} />
      </div>
    </>
  );
}

const toCents = (dollars: string) => {
  const n = Number(dollars.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};

/** Hammer / deposit / balance at the reserve, as a 3-column strip (wizard) or a list (editor). */
export function ProceedsAtReserve({ values, variant = 'strip' }: { values: LotFormValues; variant?: 'strip' | 'list' }) {
  const reserve = toCents(values.reservePrice);
  const p = proceeds({ startingPriceCents: toCents(values.startingPrice) }, reserve);
  if (variant === 'list') {
    return (
      <div className="mini-kv">
        <span>
          <span>At reserve</span>
          <span>{formatMoney(p.hammer)}</span>
        </span>
        <span>
          <span>Buyer deposit ({DEPOSIT_PERCENT}% of start)</span>
          <span>{formatMoney(p.deposit)}</span>
        </span>
        <span className="sum">
          <span>Balance the buyer pays</span>
          <span>{formatMoney(p.balance)}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="proceeds-strip">
      <div className="head eyebrow">Projected sale at reserve</div>
      <div className="cols">
        <div>
          <div className="eyebrow">Hammer</div>
          <div className="v">{formatMoney(p.hammer)}</div>
        </div>
        <div>
          <div className="eyebrow">Buyer deposit</div>
          <div className="v">{formatMoney(p.deposit)}</div>
        </div>
        <div>
          <div className="eyebrow">Balance due</div>
          <div className="v" style={{ color: 'var(--ok)' }}>
            {formatMoney(p.balance)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScheduleFields({ values, set, errors, showErrors, labels = 'caps' }: FieldsProps) {
  const caps = labels === 'caps';
  return (
    <>
      <div className="grid-2">
        <label>
          <Label text="Opens" caps={caps} />
          <input
            type="datetime-local"
            className={`field-input mono ${showErrors && errors.startTime ? 'has-error' : ''}`}
            value={values.startTime}
            onChange={(e) => set('startTime', e.target.value)}
          />
          <Err show={showErrors} msg={errors.startTime} />
        </label>
        <label>
          <Label text="Closes" caps={caps} />
          <input
            type="datetime-local"
            className={`field-input mono ${showErrors && errors.endTime ? 'has-error' : ''}`}
            value={values.endTime}
            onChange={(e) => set('endTime', e.target.value)}
          />
          <Err show={showErrors} msg={errors.endTime} />
        </label>
      </div>
      <div style={{ marginTop: 14 }}>
        <label className="radio-card" style={{ cursor: 'default' }}>
          <input type="checkbox" checked disabled />
          <span>
            <span className="t">Extend on late bids</span>
            <span className="n">Always on. Any bid in the last 2 minutes pushes the close out 2 minutes.</span>
          </span>
        </label>
      </div>
    </>
  );
}

/** Up to MAX_PHOTOS images, chosen locally and uploaded when the lot is created. */
export function PhotoPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  function add(list: FileList | null) {
    if (!list) return;
    const images = [...list].filter((f) => f.type.startsWith('image/'));
    onChange([...files, ...images].slice(0, MAX_PHOTOS));
  }

  return (
    <div
      className="photo-grid"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        add(e.dataTransfer.files);
      }}
    >
      {files.map((f, i) => (
        <div className="photo" key={`${f.name}-${i}`}>
          <img src={urls[i]} alt={f.name} className="img-cover" />
          <span className="lbl">
            {String(i + 1).padStart(2, '0')} {i === 0 ? 'THUMBNAIL' : ''}
          </span>
          <button type="button" className="rm" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      {files.length < MAX_PHOTOS && (
        <button type="button" className="photo-add" onClick={() => input.current?.click()}>
          <span>
            <span className="plus">+</span>
            Add photos
          </span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ''))} />
    </div>
  );
}
