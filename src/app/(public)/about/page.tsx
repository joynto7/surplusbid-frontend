import { BadgeCheck, Gavel, Recycle, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description:
    "SurplusBid is a B2B auction marketplace that helps companies recover value from idle industrial equipment and materials.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About SurplusBid", url: "/about" },
};

const PRINCIPLES = [
  {
    icon: BadgeCheck,
    title: "Businesses only",
    body: "Every buyer and seller submits a business registration document that an admin reviews before they trade.",
  },
  {
    icon: ShieldCheck,
    title: "Money on the line",
    body: "Bidders authorize a refundable card hold per lot, so winning bids come from serious buyers.",
  },
  {
    icon: Gavel,
    title: "Fair closes",
    body: "A bid in the last two minutes extends the auction by two minutes. The highest real offer wins.",
  },
  {
    icon: Recycle,
    title: "Less waste",
    body: "Surplus that would sit in a warehouse or go for scrap ends up working on someone else's line.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-16 sm:px-6">
      <header className="max-w-3xl space-y-4">
        <p className="font-medium text-primary text-sm">About SurplusBid</p>
        <h1 className="font-semibold text-4xl tracking-tight">Surplus stock is capital sitting idle</h1>
        <p className="text-lg text-muted-foreground">
          Plant closures, line upgrades and over-ordering leave companies with equipment and materials they no longer
          need. Selling it has usually meant brokers, phone calls and weeks of back-and-forth. SurplusBid replaces that
          with transparent, timed auctions between verified businesses.
        </p>
      </header>

      <section aria-labelledby="principles" className="space-y-6">
        <h2 id="principles" className="font-semibold text-2xl tracking-tight">
          How we keep the floor honest
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <Card key={p.title}>
              <CardHeader>
                <p.icon className="mb-2 size-6 text-primary" aria-hidden />
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription>{p.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-xl border bg-muted/30 p-8 md:grid-cols-3" aria-labelledby="roles">
        <h2 id="roles" className="sr-only">
          Who uses SurplusBid
        </h2>
        <div className="space-y-2">
          <h3 className="font-semibold">Buyers</h3>
          <p className="text-muted-foreground text-sm">
            Procurement teams and resellers who bid on lots, track outbids, and pay for won lots by card.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Sellers</h3>
          <p className="text-muted-foreground text-sm">
            Manufacturers and asset-recovery teams who list lots with a reserve, publish them, and watch the bids
            arrive.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Operators</h3>
          <p className="text-muted-foreground text-sm">
            SurplusBid admins who verify businesses, manage categories, resolve disputes and audit activity.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/register">Register your business</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/how-it-works">See how it works</Link>
        </Button>
      </div>
    </div>
  );
}
