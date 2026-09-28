import { Check, CreditCard, FileCheck2, Gavel, ListPlus, Radio, Timer, Undo2, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from "@/lib/config";

export const metadata: Metadata = {
  title: "How it works",
  description: `How buying and selling on SurplusBid works: business verification, ${DEPOSIT_PERCENT}% deposit holds, anti-sniping and Stripe settlement.`,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How SurplusBid works", url: "/how-it-works" },
};

const BUYER_STEPS = [
  {
    icon: FileCheck2,
    title: "Register & verify",
    body: "Create a buyer account and upload your business registration.",
  },
  {
    icon: Wallet,
    title: "Authorize a deposit",
    body: `Before your first bid on a lot, place a ${DEPOSIT_PERCENT}% hold on your card, based on the starting price. It isn't charged unless you win.`,
  },
  {
    icon: Gavel,
    title: "Bid",
    body: "Each bid must beat the current price by at least the lot's bid increment. You'll see when you're outbid.",
  },
  {
    icon: CreditCard,
    title: "Win & pay",
    body: `The deposit is captured and applied. Pay the balance through Stripe within ${PAYMENT_DEADLINE_HOURS} hours.`,
  },
];

const SELLER_STEPS = [
  { icon: FileCheck2, title: "Register & verify", body: "Create a seller account and get your business approved." },
  {
    icon: ListPlus,
    title: "Create a lot",
    body: "A guided wizard covers details, photos, pricing (starting, reserve, increment) and the auction window.",
  },
  {
    icon: Radio,
    title: "Publish",
    body: "Drafts can be edited freely. Publishing puts the lot live for verified buyers.",
  },
  {
    icon: Check,
    title: "Settle",
    body: "When the clock runs out the highest bidder wins, and their deposit guarantees they follow through.",
  },
];

const RULES = [
  {
    icon: Timer,
    title: "Anti-sniping",
    body: "A bid placed in the final 2 minutes extends the close by 2 minutes.",
  },
  {
    icon: Undo2,
    title: "Automatic releases",
    body: "When a lot closes, every losing bidder's deposit hold is released automatically.",
  },
  {
    icon: CreditCard,
    title: "Missed payments",
    body: `If the winner doesn't pay within ${PAYMENT_DEADLINE_HOURS} hours, their deposit is forfeited and the lot goes to the next-highest bidder.`,
  },
];

function Steps({ steps }: { steps: typeof BUYER_STEPS }) {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-xl border p-5">
          <span className="absolute top-4 right-4 font-mono text-muted-foreground text-xs">0{i + 1}</span>
          <s.icon className="mb-3 size-6 text-primary" aria-hidden />
          <h3 className="font-medium">{s.title}</h3>
          <p className="mt-1 text-muted-foreground text-sm">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-16 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-semibold text-4xl tracking-tight">How SurplusBid works</h1>
        <p className="text-lg text-muted-foreground">
          The same process for every lot, enforced by the platform instead of by negotiation.
        </p>
      </header>

      <Tabs defaultValue="buyers" className="gap-6">
        <TabsList>
          <TabsTrigger value="buyers">For buyers</TabsTrigger>
          <TabsTrigger value="sellers">For sellers</TabsTrigger>
        </TabsList>
        <TabsContent value="buyers">
          <Steps steps={BUYER_STEPS} />
        </TabsContent>
        <TabsContent value="sellers">
          <Steps steps={SELLER_STEPS} />
        </TabsContent>
      </Tabs>

      <section aria-labelledby="rules" className="space-y-6">
        <h2 id="rules" className="font-semibold text-2xl tracking-tight">
          Rules the platform enforces
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {RULES.map((r) => (
            <Card key={r.title}>
              <CardHeader>
                <r.icon className="size-5 text-primary" aria-hidden />
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{r.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-start gap-4 rounded-xl bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-xl">Ready to put surplus to work?</h2>
          <p className="text-primary-foreground/80">
            Browsing is open to everyone. Bidding and listing need verification.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/lots">Browse lots</Link>
          </Button>
          <Button variant="outline" className="border-primary-foreground/30 bg-transparent" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
