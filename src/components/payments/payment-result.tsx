"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuCircleCheck, LuCircleX, LuClock, LuReceipt } from "react-icons/lu";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney, shortCode } from "@/lib/format";
import { paymentQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Stripe has confirmed the card, but the backend marks the invoice paid only
 * when its webhook arrives, so poll every 2s (for up to ~40s) until it does.
 */
export function PaymentSuccess({ paymentId }: { paymentId: string }) {
  const [startedAt] = useState(() => Date.now());
  const payment = useQuery({
    ...paymentQuery(paymentId),
    refetchInterval: (q) => (q.state.data?.status === "PENDING" && q.state.dataUpdateCount < 20 ? 2000 : false),
  });

  if (payment.isPending) return <Skeleton className="h-80 w-full rounded-xl" />;
  const p = payment.data;
  const settled = p?.status === "SUCCEEDED";
  const waiting = p?.status === "PENDING" && payment.dataUpdatedAt - startedAt < 40_000;

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span
          className={cn(
            "mx-auto mb-2 flex size-14 items-center justify-center rounded-full",
            settled ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
          )}
        >
          {settled ? <LuCircleCheck className="size-7" /> : <LuClock className="size-7" />}
        </span>
        <CardTitle className="text-2xl">{settled ? "Payment received" : "Payment processing"}</CardTitle>
        <CardDescription>
          {settled
            ? "Thanks! The lot is yours. The seller will be in touch about collection."
            : waiting
              ? "Stripe accepted your card. We're waiting for confirmation, which usually takes a few seconds."
              : "Stripe accepted your card, but confirmation is taking longer than usual. Check your payments page shortly."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {p && (
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex justify-between p-3">
              <dt className="text-muted-foreground">Invoice</dt>
              <dd className="font-mono">{shortCode("INV", p.id)}</dd>
            </div>
            <div className="flex justify-between p-3">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium tabular-nums">{formatMoney(p.amountCents)}</dd>
            </div>
            <div className="flex justify-between p-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={p.status} />
              </dd>
            </div>
            {p.paidAt && (
              <div className="flex justify-between p-3">
                <dt className="text-muted-foreground">Paid</dt>
                <dd>{formatDateTime(p.paidAt)}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link href="/buyer/payments">
              <LuReceipt /> View payments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/lots">Keep browsing</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentCancelled({ paymentId, reason }: { paymentId?: string; reason?: string }) {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <LuCircleX className="size-7" />
        </span>
        <CardTitle className="text-2xl">Payment not completed</CardTitle>
        <CardDescription>
          {reason ?? "You left checkout before paying. Nothing was charged for the balance."} You can return any time
          before the deadline.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {paymentId && (
          <Button asChild>
            <Link href={`/buyer/checkout/${paymentId}`}>Return to checkout</Link>
          </Button>
        )}
        <Button variant="outline" asChild className={cn(!paymentId && "sm:col-span-2")}>
          <Link href="/buyer/payments">View payments</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
