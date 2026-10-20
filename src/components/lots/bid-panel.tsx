"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuChartColumn, LuGavel, LuInfo, LuLock, LuShieldCheck, LuTimer, LuTrophy } from "react-icons/lu";
import { toast } from "sonner";
import { StripeConfirm } from "@/components/payments/stripe-confirm";
import { Countdown } from "@/components/shared/countdown";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuthorizeDeposit, useHasDeposit, usePlaceBid } from "@/hooks/use-bidding";
import { useMounted } from "@/hooks/use-mounted";
import { DEPOSIT_PERCENT, depositFor } from "@/lib/config";
import { formatDateTime, formatMoney } from "@/lib/format";
import { lotQuery } from "@/lib/queries";
import { type BidValues, bidSchema } from "@/lib/validation";
import { useDeposits } from "@/stores/deposit-store";
import type { Lot, LotDetail, Role } from "@/types/api";

export interface Viewer {
  id: string;
  role: Role;
}

/** Live price box + the buyer's deposit → bid flow. Everything else sees a role-appropriate call to action. */
export function BidPanel({ initialLot, viewer }: { initialLot: LotDetail; viewer: Viewer | null }) {
  const { data: lot = initialLot } = useQuery({ ...lotQuery(initialLot.id), initialData: initialLot });
  const live = lot.status === "LIVE" && new Date(lot.endTime).getTime() > Date.now();
  const current = lot.currentHighestBidAmountCents;
  const minimum = (current ?? lot.startingPriceCents) + lot.bidIncrementCents;
  const isOwner = viewer?.id === lot.sellerId;
  const leading = viewer?.role === "BUYER" && lot.currentHighestBidderId === viewer.id;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={lot.status} />
          {live && (
            <span className="flex items-center gap-1.5 text-sm">
              <LuTimer className="size-4 text-muted-foreground" aria-hidden />
              <Countdown endTime={lot.endTime} className="font-semibold" />
            </span>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{current ? "Current bid" : "Starting price"}</p>
          <p className="font-semibold text-4xl tabular-nums tracking-tight" aria-live="polite">
            {formatMoney(current ?? lot.startingPriceCents)}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            Increment {formatMoney(lot.bidIncrementCents)} · {live ? "closes" : "closed"} {formatDateTime(lot.endTime)}
          </p>
        </div>
        {isOwner && lot.reservePriceCents !== undefined && (
          <div className="rounded-md bg-muted p-2.5 text-sm">
            Reserve {formatMoney(lot.reservePriceCents)} ·{" "}
            {(current ?? 0) >= lot.reservePriceCents ? (
              <span className="font-medium text-success">met</span>
            ) : (
              <span className="font-medium text-warning">not met yet</span>
            )}
          </div>
        )}
        {leading && (
          <Alert className="border-success/30 bg-success/5">
            <LuTrophy className="text-success" />
            <AlertTitle>{live ? "You're the highest bidder" : "You won this lot"}</AlertTitle>
            <AlertDescription>
              {live ? "We'll show it here if someone outbids you." : "Pay the balance from your payments page."}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!live ? (
          <ClosedNotice lot={lot} leading={leading} />
        ) : !viewer ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/login?next=/lots/${lot.id}`}>
              <LuLock /> Sign in to bid
            </Link>
          </Button>
        ) : isOwner ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/seller/lots/${lot.id}`}>
              <LuChartColumn /> View lot performance
            </Link>
          </Button>
        ) : viewer.role !== "BUYER" ? (
          <p className="rounded-md border border-dashed p-3 text-center text-muted-foreground text-sm">
            Only buyer accounts can bid. You&apos;re signed in as {viewer.role.toLowerCase()}.
          </p>
        ) : (
          <BuyerBidForm lot={lot} minimum={minimum} />
        )}
        <ul className="space-y-2 text-muted-foreground text-xs">
          <li className="flex gap-2">
            <LuShieldCheck className="size-3.5 shrink-0" aria-hidden /> {DEPOSIT_PERCENT}% refundable deposit hold (
            {formatMoney(depositFor(lot.startingPriceCents))}) required before bidding
          </li>
          <li className="flex gap-2">
            <LuTimer className="size-3.5 shrink-0" aria-hidden /> Bids in the final 2 minutes extend the close by 2
            minutes
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

function ClosedNotice({ lot, leading }: { lot: Lot; leading: boolean }) {
  return (
    <div className="space-y-3">
      <p className="rounded-md bg-muted p-3 text-center text-sm">
        Bidding is closed{lot.status === "SOLD" ? ". This lot has been sold." : "."}
      </p>
      {leading && (
        <Button asChild className="w-full">
          <Link href="/buyer/payments">Go to payments</Link>
        </Button>
      )}
      <Button asChild variant="outline" className="w-full">
        <Link href="/lots">Browse live auctions</Link>
      </Button>
    </div>
  );
}

function BuyerBidForm({ lot, minimum }: { lot: Lot; minimum: number }) {
  const mounted = useMounted();
  const hasDeposit = useHasDeposit(lot.id, true) && mounted;
  const [depositOpen, setDepositOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const placeBid = usePlaceBid(lot.id);

  const form = useForm<BidValues>({
    resolver: zodResolver(bidSchema(minimum)),
    values: { amount: minimum / 100 },
  });

  const submit = (values: BidValues) => {
    const cents = Math.round(values.amount * 100);
    if (!hasDeposit) {
      setPendingAmount(cents);
      setDepositOpen(true);
      return;
    }
    placeBid.mutate(cents, {
      onError: (error) => {
        if (/deposit hold/i.test(error.message)) {
          setPendingAmount(cents);
          setDepositOpen(true);
        }
      },
      // The next minimum arrives via `values` once the lot refetches.
      onSuccess: () => form.reset({ amount: (cents + lot.bidIncrementCents) / 100 }, { keepDefaultValues: false }),
    });
  };

  const quick = [minimum, minimum + lot.bidIncrementCents, minimum + lot.bidIncrementCents * 4];

  return (
    <>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-3">
        <Field data-invalid={!!form.formState.errors.amount}>
          <FieldLabel htmlFor="bid-amount">Your bid (USD)</FieldLabel>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="bid-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              className="h-11 pl-7 font-semibold text-lg tabular-nums"
              aria-invalid={!!form.formState.errors.amount}
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>
          <FieldError errors={[form.formState.errors.amount]} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          {quick.map((c) => (
            <Button
              key={c}
              type="button"
              variant="outline"
              size="sm"
              className="tabular-nums"
              onClick={() => form.setValue("amount", c / 100, { shouldValidate: true })}
            >
              {formatMoney(c).replace(".00", "")}
            </Button>
          ))}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={placeBid.isPending}>
          {placeBid.isPending ? <Spinner /> : <LuGavel />} Place bid
        </Button>
        {!hasDeposit && (
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <LuInfo className="size-3.5" aria-hidden /> You&apos;ll authorize the deposit hold before your first bid.
          </p>
        )}
      </form>
      <DepositDialog
        lot={lot}
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onAuthorized={() => {
          setDepositOpen(false);
          if (pendingAmount) placeBid.mutate(pendingAmount);
        }}
      />
    </>
  );
}

function DepositDialog({
  lot,
  open,
  onOpenChange,
  onAuthorized,
}: {
  lot: Lot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorized: () => void;
}) {
  const deposit = useAuthorizeDeposit(lot.id);
  const markAuthorized = useDeposits((s) => s.markAuthorized);
  const amount = depositFor(lot.startingPriceCents);
  const clientSecret = deposit.data?.clientSecret;

  const authorize = () =>
    deposit.mutate(undefined, {
      onSuccess: (hold) => {
        if (hold?.clientSecret) return; // confirm the card below first
        toast.success("Deposit hold authorized", { description: `${formatMoney(amount)} is on hold, not charged.` });
        onAuthorized();
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authorize a deposit hold</DialogTitle>
          <DialogDescription>
            To bid on this lot, SurplusBid places a refundable hold of {DEPOSIT_PERCENT}% of the starting price on your
            card. It&apos;s released automatically if you don&apos;t win.
          </DialogDescription>
        </DialogHeader>
        <dl className="divide-y rounded-lg border text-sm">
          <div className="flex justify-between p-3">
            <dt className="text-muted-foreground">Starting price</dt>
            <dd className="tabular-nums">{formatMoney(lot.startingPriceCents)}</dd>
          </div>
          <div className="flex justify-between p-3 font-medium">
            <dt>Deposit hold ({DEPOSIT_PERCENT}%)</dt>
            <dd className="tabular-nums">{formatMoney(amount)}</dd>
          </div>
        </dl>
        {clientSecret ? (
          <StripeConfirm
            clientSecret={clientSecret}
            submitLabel={`Authorize ${formatMoney(amount)} hold`}
            returnUrl={`${window.location.origin}/lots/${lot.id}`}
            onSucceeded={() => {
              markAuthorized(lot.id);
              toast.success("Deposit hold authorized");
              onAuthorized();
            }}
          />
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={authorize} disabled={deposit.isPending}>
              {deposit.isPending ? <Spinner /> : <LuShieldCheck />} Authorize {formatMoney(amount)}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
