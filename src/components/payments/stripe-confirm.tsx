"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { useState } from "react";
import { LuLock } from "react-icons/lu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getStripe, stripeAppearance } from "@/lib/stripe";

interface ConfirmProps {
  /** Label on the submit button, e.g. "Pay $1,200.00". */
  submitLabel: string;
  /** Absolute URL Stripe returns to after 3-D Secure or redirect-based methods. */
  returnUrl: string;
  onSucceeded: (paymentIntentId: string) => void;
  onFailed?: (message: string) => void;
}

function ConfirmForm({ submitLabel, returnUrl, onSucceeded, onFailed }: ConfirmProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    setBusy(false);
    if (stripeError) {
      const message = stripeError.message ?? "Your card was declined.";
      setError(message);
      onFailed?.(message);
      return;
    }
    if (paymentIntent && ["succeeded", "requires_capture", "processing"].includes(paymentIntent.status)) {
      onSucceeded(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment not completed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || busy}>
        {busy ? <Spinner /> : <LuLock />} {submitLabel}
      </Button>
      <p className="text-center text-muted-foreground text-xs">
        Test mode: use card 4242 4242 4242 4242, any future date and any CVC.
      </p>
    </form>
  );
}

/** Stripe Payment Element bound to a PaymentIntent client secret created by the backend. */
export function StripeConfirm({ clientSecret, ...props }: ConfirmProps & { clientSecret: string }) {
  const { resolvedTheme } = useTheme();
  const stripe = getStripe();
  if (!stripe) {
    return (
      <Alert>
        <AlertTitle>Stripe isn&apos;t configured</AlertTitle>
        <AlertDescription>
          Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to a pk_test_ key from the same Stripe account as the backend.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Elements stripe={stripe} options={{ clientSecret, appearance: stripeAppearance(resolvedTheme === "dark") }}>
      <ConfirmForm {...props} />
    </Elements>
  );
}
