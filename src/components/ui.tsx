import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import type { BidState } from '../lib/buyer';

export type Tone = 'ok' | 'bad' | 'warn' | 'info' | '';

export function Pill({ tone = '', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={`pill ${tone} ${dot ? 'pill-dot' : ''}`}>{children}</span>;
}

const BID_TONE: Record<BidState, Tone> = { WINNING: 'ok', OUTBID: 'bad', WON: 'ok', LOST: '' };
const BID_LABEL: Record<BidState, string> = { WINNING: 'Winning', OUTBID: 'Outbid', WON: 'Won', LOST: 'Lost' };

export function BidStatePill({ state }: { state: BidState }) {
  return <Pill tone={BID_TONE[state]}>{BID_LABEL[state]}</Pill>;
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="icon" aria-hidden="true">
        {icon}
      </div>
      <div className="title">{title}</div>
      {children && <p>{children}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.errors.length ? `${err.message}: ${err.errors.join(', ')}` : err.message;
  return 'Something went wrong. Please try again.';
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="form-error" role="alert" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span style={{ flex: 1 }}>{errorMessage(error)}</span>
      {onRetry && (
        <button className="btn-ghost-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Lot photo, or the striped placeholder the mockups use when there's none. */
export function LotThumb({ src, className, style }: { src?: string; className?: string; style?: React.CSSProperties }) {
  return src ? (
    <img src={src} alt="" className={`img-cover ${className ?? ''}`} style={style} />
  ) : (
    <span className={`img-ph ${className ?? ''}`} style={{ display: 'block', ...style }} />
  );
}
