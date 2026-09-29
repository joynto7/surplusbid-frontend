"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuArrowRight, LuLock, LuShieldCheck } from "react-icons/lu";
import { StripeConfirm } from "@/components/payments/stripe-confirm";
import { Countdown } from "@/components/shared/countdown";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { DEPOSIT_PERCENT } from "@/lib/config";
import { formatDateTime, formatMoney, lotCode, shortCode } from "@/lib/format";
import { qk } from "@/lib/queries";
import type { Lot, Payment } from "@/types/api";

/**
 * Two-step checkout: "Continue" asks the backend to capture the deposit and
 * create the balance PaymentIntent, then Stripe's Payment Element confirms
 * it. Stripe redirects to /payment/success (or we navigate there directly
 * when no redirect is needed).
 */
export function Checkout({ payment, lot }: { payment: Payment; lot: Lot | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const initiate = useMutation({
    mutationFn: () => api.initiatePayment(payment.id),
    meta: { errorToast: "Couldn't start the payment" },
  });

  const hammer = lot?.currentHighestBidAmountCents ?? payment.amountCents;
  const depositApplied = Math.max(0, hammer - payment.amountCents);
  const overdue = new Date(payment.dueAt).getTime() < Date.now();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const successUrl = `${origin}/payment/success?payment_id=${payment.id}`;
  const cancelHref = `/payment/cancel?payment_id=${payment.id}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardDescription className="font-mono">{shortCode("INV", payment.id)}</CardDescription>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Link href={`/lots/${payment.lotId}`} className="font-medium hover:text-primary hover:underline">
              {lot?.title ?? "Won lot"}
            </Link>
            <p className="font-mono text-muted-foreground text-xs">{lotCode(payment.lotId)}</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Winning bid</dt>
              <dd className="tabular-nums">{formatMoney(hammer)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Deposit applied ({DEPOSIT_PERCENT}% hold)</dt>
              <dd className="text-success tabular-nums">−{formatMoney(depositApplied)}</dd>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <dt>Balance due</dt>
              <dd className="tabular-nums">{formatMoney(payment.amountCents)}</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Pay within</span>
            <span className="flex items-center gap-2">
              <Countdown endTime={payment.dueAt} className="font-semibold" />
              <span className="text-muted-foreground text-xs">({formatDateTime(payment.dueAt)})</span>
            </span>
          </div>
          <p className="flex gap-2 text-muted-foreground text-xs">
            <LuShieldCheck className="size-4 shrink-0" aria-hidden />
            If the balance isn&apos;t paid by the deadline, the deposit is forfeited and the lot goes to the next
            bidder.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LuLock className="size-4" aria-hidden /> Secure payment
          </CardTitle>
          <CardDescription>Card details are handled by Stripe and never reach SurplusBid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment.status !== "PENDING" ? (
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                This invoice is <StatusBadge status={payment.status} />
              </AlertTitle>
              <AlertDescription>
                {payment.status === "FAILED"
                  ? "Stripe reported the last attempt as failed. Contact support to retry this invoice."
                  : "There's nothing left to pay."}
              </AlertDescription>
            </Alert>
          ) : overdue ? (
            <Alert variant="destructive">
              <AlertTitle>Payment deadline passed</AlertTitle>
              <AlertDescription>This invoice can no longer be paid online.</AlertDescription>
            </Alert>
          ) : initiate.data?.clientSecret ? (
            <StripeConfirm
              clientSecret={initiate.data.clientSecret}
              submitLabel={`Pay ${formatMoney(payment.amountCents)}`}
              returnUrl={successUrl}
              onSucceeded={() => {
                qc.invalidateQueries({ queryKey: qk.myPayments });
                qc.invalidateQueries({ queryKey: qk.payment(payment.id) });
                router.push(`/payment/success?payment_id=${payment.id}`);
              }}
            />
          ) : (
            <div className="space-y-3">
              <ol className="space-y-2 text-muted-foreground text-sm">
                <li>1. We capture your {formatMoney(depositApplied)} deposit hold.</li>
                <li>2. You pay the remaining {formatMoney(payment.amountCents)} by card.</li>
              </ol>
              <Button size="lg" className="w-full" onClick={() => initiate.mutate()} disabled={initiate.isPending}>
                {initiate.isPending ? <Spinner /> : <LuArrowRight />} Continue to payment
              </Button>
              {initiate.isSuccess && !initiate.data.clientSecret && (
                <Alert variant="destructive">
                  <AlertTitle>Stripe didn&apos;t return a payment session</AlertTitle>
                  <AlertDescription>Try again in a moment.</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <Button variant="ghost" className="w-full" asChild>
            <Link href={cancelHref}>Cancel and return later</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
