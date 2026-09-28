/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_DEPOSIT_PERCENT?: string;
  readonly VITE_PAYMENT_DEADLINE_HOURS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
