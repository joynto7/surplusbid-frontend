import { loadStripe, type Appearance, type Stripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

/** null when VITE_STRIPE_PUBLISHABLE_KEY isn't set; checkout shows a notice instead. */
export const stripePromise: Promise<Stripe | null> | null = key ? loadStripe(key) : null;

export const stripeAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#2563EB',
    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorDanger: '#DC2626',
    colorBackground: '#FFFFFF',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #CBD5E1', boxShadow: 'none' },
    '.Label': { fontSize: '12.5px', fontWeight: '500', color: '#0F172A' },
  },
};

export interface PaymentAttempt {
  at: string;
  amountCents: number;
  message: string;
  code?: string;
}

/** Declines from this browser session, shown in the failed page's attempt log. */
export const attemptLog = {
  key: (paymentId: string) => `surplusbid.attempts.${paymentId}`,
  read(paymentId: string): PaymentAttempt[] {
    try {
      return JSON.parse(sessionStorage.getItem(this.key(paymentId)) ?? '[]') as PaymentAttempt[];
    } catch {
      return [];
    }
  },
  add(paymentId: string, attempt: PaymentAttempt) {
    const list = [attempt, ...this.read(paymentId)].slice(0, 10);
    sessionStorage.setItem(this.key(paymentId), JSON.stringify(list));
  },
};
