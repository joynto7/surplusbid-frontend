import type { Lot } from '../../lib/api';
import { statusLabel } from '../../lib/seller';

export default function StatusTag({ lot, now }: { lot: Lot; now?: number }) {
  const label = statusLabel(lot, now);
  return <span className={`status-tag ${label.replace(/\s+/g, '-')}`}>{label}</span>;
}
