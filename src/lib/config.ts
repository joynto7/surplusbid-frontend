export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/** Mirrors the backend's DEPOSIT_PERCENT: the hold is this % of the starting price. */
export const DEPOSIT_PERCENT = Number(process.env.NEXT_PUBLIC_DEPOSIT_PERCENT ?? 10);

/** Mirrors the backend's PAYMENT_DEADLINE_HOURS for won lots. */
export const PAYMENT_DEADLINE_HOURS = Number(process.env.NEXT_PUBLIC_PAYMENT_DEADLINE_HOURS ?? 48);

/** Where the client-side fetcher sends requests; the route handler adds the bearer token. */
export const BFF_PREFIX = "/api/backend";

export const depositFor = (startingPriceCents: number) => Math.round(startingPriceCents * (DEPOSIT_PERCENT / 100));

export const SUPPORT_EMAIL = "support@surplusbid.com";
export const SUPPORT_PHONE = "+1 (312) 555-0199";
