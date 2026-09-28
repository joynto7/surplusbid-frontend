import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Gavel,
  Hourglass,
  Search,
  ShieldCheck,
  Timer,
  Truck,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { LotCard } from "@/components/lots/lot-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publicApi } from "@/lib/api/server";
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from "@/lib/config";
import type { Category, Lot, Paginated } from "@/types/api";

export const metadata: Metadata = {
  title: { absolute: "SurplusBid: B2B industrial surplus auctions" },
  description:
    "Buy and sell industrial surplus in timed auctions. Verified businesses, refundable Stripe deposit holds and anti-sniping on every lot.",
  alternates: { canonical: "/" },
};

// Static page, regenerated at most once a minute (ISR) so live counts stay fresh.
export const revalidate = 60;

async function loadHome() {
  const [closing, categories] = await Promise.allSettled([
    publicApi.browseLots({ status: "LIVE", sortBy: "endTime", sortOrder: "asc", limit: 6 }),
    publicApi.categories(),
  ]);
  return {
    closing: closing.status === "fulfilled" ? closing.value : null,
    categories: categories.status === "fulfilled" ? categories.value : [],
  };
}

const STEPS = [
  {
    icon: BadgeCheck,
    title: "Verify your business",
    body: "Upload a registration document. Our team reviews it before you can bid or list.",
  },
  {
    icon: Wallet,
    title: "Authorize a deposit",
    body: `Place a refundable ${DEPOSIT_PERCENT}% hold on your card per lot. Losing bidders are released automatically.`,
  },
  {
    icon: Gavel,
    title: "Bid in real time",
    body: "Bids inside the final two minutes extend the clock by two minutes, so no one wins by sniping.",
  },
  {
    icon: Truck,
    title: "Pay & collect",
    body: `Winners pay the balance through Stripe within ${PAYMENT_DEADLINE_HOURS} hours, with the deposit already applied.`,
  },
];

export default async function HomePage() {
  const { closing, categories } = await loadHome();
  const categoryName = new Map(categories.map((c: Category) => [c.id, c.name]));

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/12%,transparent_60%)]"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-muted-foreground text-xs">
              <ShieldCheck className="size-3.5 text-success" aria-hidden /> Verified B2B buyers & sellers only
            </p>
            <h1 className="font-semibold text-4xl tracking-tight sm:text-5xl">
              Industrial surplus, sold in <span className="text-primary">timed auctions</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Machinery, electronics, vehicles and raw materials from verified companies. Every bidder has a Stripe
              deposit on the line, so every bid is real.
            </p>
            <Form action="/lots" className="flex max-w-lg gap-2" role="search">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  name="q"
                  aria-label="Search auctions"
                  placeholder="Search CNC, forklifts, servers…"
                  className="h-10 pl-9"
                />
              </div>
              <Button type="submit" size="lg" className="h-10 px-4">
                Search
              </Button>
            </Form>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button key={c.id} variant="outline" size="sm" asChild className="rounded-full">
                  <Link href={`/lots?categoryId=${c.id}`}>{c.name}</Link>
                </Button>
              ))}
            </div>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hourglass className="size-4 text-primary" aria-hidden /> On the floor right now
              </CardTitle>
              <CardDescription>Live figures from the SurplusBid API.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="font-semibold text-3xl tabular-nums">{closing?.meta.total ?? "—"}</p>
                <p className="text-muted-foreground text-sm">Live lots</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-4">
                <p className="font-semibold text-3xl tabular-nums">{categories.length || "—"}</p>
                <p className="text-muted-foreground text-sm">Categories</p>
              </div>
              <div className="col-span-2 flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm">
                <Timer className="size-5 shrink-0 text-warning" aria-hidden />
                <p>
                  <span className="font-medium">Anti-sniping on every lot.</span>{" "}
                  <span className="text-muted-foreground">Late bids add two minutes to the clock.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-16 sm:px-6" aria-labelledby="closing-soon">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="closing-soon" className="font-semibold text-2xl tracking-tight">
              Closing soon
            </h2>
            <p className="text-muted-foreground">Live lots ordered by closing time.</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/lots?status=LIVE&sortBy=endTime&sortOrder=asc">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        <ClosingSoon lots={closing} categoryName={categoryName} />
      </section>

      <section className="border-y bg-muted/30" aria-labelledby="how">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-16 sm:px-6">
          <div className="max-w-2xl space-y-2">
            <h2 id="how" className="font-semibold text-2xl tracking-tight">
              Four steps from surplus to settled
            </h2>
            <p className="text-muted-foreground">No phone calls and no haggling. The same rules apply to every lot.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <CardTitle className="text-base">
                      <span className="mr-1.5 font-mono text-muted-foreground">{i + 1}.</span>
                      {s.title}
                    </CardTitle>
                    <CardDescription>{s.body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Building2 className="mb-2 size-6 text-primary" aria-hidden />
            <CardTitle>For buyers</CardTitle>
            <CardDescription>
              Source equipment below replacement cost. Track your bids, win, and pay securely by card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/register?role=BUYER">Register as a buyer</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Gavel className="mb-2 size-6 text-primary" aria-hidden />
            <CardTitle>For sellers</CardTitle>
            <CardDescription>
              Turn idle inventory into cash. List a lot in minutes with a reserve price and a guaranteed deposit from
              the winner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/register?role=SELLER">Register as a seller</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ClosingSoon({ lots, categoryName }: { lots: Paginated<Lot> | null; categoryName: Map<string, string> }) {
  if (!lots) {
    return (
      <EmptyState
        icon={Hourglass}
        title="Auctions are loading slowly"
        description="The SurplusBid API didn't respond in time. Refresh in a moment, or open the full catalog."
        action={
          <Button variant="outline" asChild>
            <Link href="/lots">Open catalog</Link>
          </Button>
        }
      />
    );
  }
  if (lots.items.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No live auctions right now"
        description="New lots are published by verified sellers every week. Register to get ready for the next one."
        action={
          <Button asChild>
            <Link href="/register">Register your business</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lots.items.map((lot, i) => (
        <LotCard key={lot.id} lot={lot} categoryName={categoryName.get(lot.categoryId)} priority={i < 3} />
      ))}
    </div>
  );
}
