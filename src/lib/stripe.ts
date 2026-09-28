"use client";

import { type Appearance, loadStripe, type Stripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/config";

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js the first time a payment form mounts (keeps it out of other pages). */
export function getStripe() {
  if (!STRIPE_PUBLISHABLE_KEY) return null;
  stripePromise ??= loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

export const stripeAppearance = (dark: boolean): Appearance => ({
  theme: dark ? "night" : "stripe",
  variables: {
    colorPrimary: dark ? "#3b82f6" : "#2563eb",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "8px",
  },
});
