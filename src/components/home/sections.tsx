import Image from "next/image";
import Link from "next/link";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBot,
  LuBuilding2,
  LuCreditCard,
  LuGavel,
  LuMapPin,
  LuQuote,
  LuScrollText,
  LuShieldCheck,
  LuSparkles,
  LuTimer,
  LuTruck,
  LuWallet,
} from "react-icons/lu";
import { LotCard } from "@/components/lots/lot-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { LotImage } from "@/components/shared/lot-image";
import { RatingStars } from "@/components/shared/rating-stars";
import { LOT_GRID } from "@/components/shared/skeletons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { POSTS } from "@/content/blog";
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from "@/lib/config";
import { formatDate, formatMoney, initials } from "@/lib/format";
import type { Category, Lot, PublicStats, Review, ScoredLot, SellerProfile } from "@/types/api";
import { Section } from "./section";

const compactMoney = (cents: number) => {
  const d = cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;
  if (d >= 1_000) return `$${Math.round(d / 1_000)}k`;
  return `$${Math.round(d)}`;
};

/** Right below the hero: live marketplace figures. */
export function StatsStrip({ stats }: { stats: PublicStats | null }) {
  const items = [
    { label: "Live auctions", value: stats ? String(stats.liveLots) : "—", icon: LuGavel },
    { label: "Sold through SurplusBid", value: stats ? compactMoney(stats.gmvCents) : "—", icon: LuWallet },
    { label: "Verified businesses", value: stats ? String(stats.verifiedBusinesses) : "—", icon: LuBadgeCheck },
    {
      label: "Average seller rating",
      value: stats?.reviewCount ? `${stats.averageRating.toFixed(1)} / 5` : "—",
      icon: LuShieldCheck,
    },
  ];
  return (
    <section aria-label="Marketplace at a glance" className="border-b bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex items-center gap-3 bg-card px-4 py-6 sm:px-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-2xl tabular-nums tracking-tight">{s.value}</p>
              <p className="truncate text-muted-foreground text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <Section
      id="categories"
      eyebrow="Browse"
      title="Shop by category"
      description="Eight categories of surplus from manufacturers, fleets, hospitals, restaurants and distribution centers."
      action={{ href: "/lots", label: "All auctions" }}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/lots?categoryId=${c.id}`}
            className="group relative isolate flex aspect-4/3 flex-col justify-end overflow-hidden rounded-xl border p-4 text-white"
          >
            {c.imageUrl && (
              <Image
                src={c.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="-z-20 object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"
            />
            <span className="mb-auto flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <CategoryIcon slug={c.slug} className="size-4" />
            </span>
            <span className="font-semibold text-base sm:text-lg">{c.name}</span>
            <span className="text-sm text-white/75">
              {c.liveLotCount ?? 0} live {c.liveLotCount === 1 ? "lot" : "lots"}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export function LotRowSection({
  id,
  eyebrow,
  title,
  description,
  action,
  lots,
  muted,
  empty,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  action: { href: string; label: string };
  lots: (Lot | ScoredLot)[] | null;
  muted?: boolean;
  empty: { title: string; description: string };
}) {
  return (
    <Section id={id} eyebrow={eyebrow} title={title} description={description} action={action} muted={muted}>
      {lots?.length ? (
        <div className={LOT_GRID}>
          {lots.map((lot, i) => (
            <LotCard key={lot.id} lot={lot} priority={i < 2} reason={"reason" in lot ? lot.reason : undefined} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LuGavel}
          title={lots ? empty.title : "Auctions are loading slowly"}
          description={lots ? empty.description : "The SurplusBid API didn't respond in time. Refresh in a moment."}
          action={
            <Button variant="outline" asChild>
              <Link href="/lots">Open the catalogue</Link>
            </Button>
          }
        />
      )}
    </Section>
  );
}

const STEPS = [
  {
    icon: LuBadgeCheck,
    title: "Verify your business",
    body: "Upload a registration document. Our team reviews it, usually within one business day.",
  },
  {
    icon: LuWallet,
    title: "Authorize a deposit",
    body: `Place a refundable ${DEPOSIT_PERCENT}% hold per lot. Losing bidders are released automatically.`,
  },
  {
    icon: LuGavel,
    title: "Bid in real time",
    body: "Bids in the final two minutes extend the clock by two minutes, so nobody wins by sniping.",
  },
  {
    icon: LuTruck,
    title: "Pay and collect",
    body: `Winners pay the balance through Stripe within ${PAYMENT_DEADLINE_HOURS} hours, with the deposit applied.`,
  },
];

export function HowItWorksSection() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Four steps from surplus to settled"
      description="No phone calls and no haggling. The same rules apply to every lot."
      action={{ href: "/how-it-works", label: "Read the full guide" }}
      muted
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Card className="h-full">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-bold text-4xl text-muted-foreground/30 tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const FEATURES = [
  {
    icon: LuBadgeCheck,
    title: "Verified businesses only",
    body: "Every buyer and seller passes a document check before they can bid or list.",
  },
  {
    icon: LuCreditCard,
    title: "Stripe-secured deposits",
    body: "Holds are authorized, not charged, and released automatically if you don't win.",
  },
  {
    icon: LuTimer,
    title: "Anti-sniping on every lot",
    body: "Late bids extend the close, so the final price reflects real demand.",
  },
  {
    icon: LuBot,
    title: "AI assistant and search",
    body: "Describe what you need in plain English, and the AI turns it into filters and answers questions.",
  },
  {
    icon: LuScrollText,
    title: "Full audit trail",
    body: "Verifications, closes and dispute decisions are logged with who made them and when.",
  },
  {
    icon: LuShieldCheck,
    title: "Fair dispute resolution",
    body: "If a lot isn't as described, an admin reviews both sides and records a resolution.",
  },
];

export function FeaturesSection() {
  return (
    <Section
      id="why-surplusbid"
      eyebrow="Why SurplusBid"
      title="Built for business-to-business trust"
      description="Industrial buyers need certainty. These are the guarantees on every lot."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <f.icon className="size-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function RecentlySoldSection({ lots }: { lots: Lot[] | null }) {
  if (!lots?.length) return null;
  return (
    <Section
      id="results"
      eyebrow="Market results"
      title="Recently sold"
      description="Final prices from closed auctions: a real-time benchmark for what surplus sells for."
      action={{ href: "/lots?status=SOLD", label: "All results" }}
      muted
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lots.map((lot) => {
          const uplift = Math.round(((lot.currentPriceCents - lot.startingPriceCents) / lot.startingPriceCents) * 100);
          return (
            <li key={lot.id}>
              <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
                <LotImage
                  src={lot.images[0]}
                  alt={lot.title}
                  className="aspect-video"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
                <CardContent className="space-y-2 p-4">
                  <p className="text-muted-foreground text-xs">
                    {lot.category?.name} · closed {formatDate(lot.endTime)}
                  </p>
                  <h3 className="line-clamp-2 min-h-10 font-medium text-sm leading-snug">
                    <Link href={`/lots/${lot.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
                      {lot.title}
                    </Link>
                  </h3>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs">Sold for</p>
                      <p className="font-semibold text-lg tabular-nums">{formatMoney(lot.currentPriceCents)}</p>
                    </div>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success text-xs">
                      +{uplift}% over start · {lot.bidCount ?? 0} bids
                    </span>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function TopSellersSection({ sellers }: { sellers: SellerProfile[] | null }) {
  if (!sellers?.length) return null;
  return (
    <Section
      id="sellers"
      eyebrow="Top sellers"
      title="Trusted by the companies behind the lots"
      description="Ranked by buyer reviews and completed sales."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((s) => (
          <li key={s.id}>
            <Card className="h-full">
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-12 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">
                      {initials(s.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-1.5 truncate font-semibold">
                      {s.companyName}
                      <LuBadgeCheck className="size-4 shrink-0 text-success" aria-label="Verified" />
                    </h3>
                    {s.location && (
                      <p className="flex items-center gap-1 text-muted-foreground text-sm">
                        <LuMapPin className="size-3.5" aria-hidden /> {s.location}
                      </p>
                    )}
                  </div>
                </div>
                {s.bio && <p className="line-clamp-2 text-muted-foreground text-sm">{s.bio}</p>}
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  {s.rating.count ? (
                    <RatingStars value={s.rating.average} count={s.rating.count} />
                  ) : (
                    <span className="text-muted-foreground">No reviews yet</span>
                  )}
                  <span className="text-muted-foreground">
                    {s.lotsSold} sold · {s.liveLots} live
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TestimonialsSection({ reviews }: { reviews: Review[] | null }) {
  if (!reviews?.length) return null;
  return (
    <Section
      id="testimonials"
      eyebrow="Reviews"
      title="What winning buyers say"
      description="Every review is written by the business that won the lot, after the sale."
      muted
    >
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((r) => (
          <li key={r.id}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <RatingStars value={r.rating} showValue={false} size="md" />
                  <LuQuote className="size-6 text-primary/30" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-muted-foreground text-sm">{r.comment}</p>
                </div>
                <div className="mt-auto flex items-center gap-3 border-t pt-4">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-success/10 font-medium text-success text-xs">
                      {initials(r.author.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{r.author.companyName}</p>
                    <p className="truncate text-muted-foreground text-xs">Bought from {r.seller.companyName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function BlogSection() {
  return (
    <Section
      id="blog"
      eyebrow="From the blog"
      title="Guides for buying and selling surplus"
      action={{ href: "/blog", label: "All articles" }}
    >
      <ul className="grid gap-5 md:grid-cols-3">
        {POSTS.slice(0, 3).map((p) => (
          <li key={p.slug}>
            <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image
                  src={p.cover}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="space-y-2 p-5">
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium text-primary">{p.category}</span> · {p.readMinutes} min read
                </p>
                <h3 className="line-clamp-2 font-semibold text-lg leading-snug">
                  <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
                    {p.title}
                  </Link>
                </h3>
                <p className="line-clamp-2 text-muted-foreground text-sm">{p.excerpt}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const FAQ = [
  {
    q: "Who can buy and sell on SurplusBid?",
    a: "Registered businesses only. After you sign up, an admin checks your registration document before you can bid or list. It usually takes one business day.",
  },
  {
    q: "How much is the deposit, and when do I get it back?",
    a: `${DEPOSIT_PERCENT}% of the lot's starting price, authorized on your card before your first bid. If you don't win, it's released automatically when the lot closes.`,
  },
  {
    q: "What happens if someone bids at the last second?",
    a: "Any bid in the final two minutes pushes the close back by two minutes, so there's always time to respond.",
  },
  {
    q: "How do I pay for a lot I win?",
    a: `Your deposit is applied, and you pay the balance by card through Stripe within ${PAYMENT_DEADLINE_HOURS} hours of the close.`,
  },
  {
    q: "How does the AI assistant help?",
    a: "It answers questions about bidding, deposits and payments, searches live lots from a plain-English description, and helps sellers write listings and price them from comparable sales.",
  },
];

export function FaqSection() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions buyers ask first"
      action={{ href: "/faq", label: "All answers" }}
      muted
    >
      <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl rounded-xl border bg-card px-5">
        {FAQ.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,white/15%,transparent_45%),radial-gradient(circle_at_90%_85%,black/25%,transparent_50%)]"
        />
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <h2 id="cta-heading" className="font-bold text-3xl tracking-tight sm:text-4xl">
              Have idle equipment? Turn it into cash this month.
            </h2>
            <p className="max-w-xl text-lg text-primary-foreground/85">
              List a lot in minutes with the AI listing assistant, set a private reserve, and get paid through Stripe
              when it sells.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Button size="lg" variant="secondary" asChild className="h-12">
              <Link href="/register?role=SELLER">
                <LuBuilding2 /> Register as a seller
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/register?role=BUYER">
                <LuSparkles /> Start bidding <LuArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
