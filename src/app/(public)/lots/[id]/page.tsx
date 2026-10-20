import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LuBadgeCheck, LuCalendarClock, LuEye, LuGavel, LuLayers, LuMapPin, LuPackage, LuWrench } from "react-icons/lu";
import { BidHistory } from "@/components/lots/bid-history";
import { BidPanel } from "@/components/lots/bid-panel";
import { LotCard } from "@/components/lots/lot-card";
import { AskAiButton, LotViewTracker } from "@/components/lots/lot-extras";
import { LotGallery } from "@/components/lots/lot-gallery";
import { LotReviews } from "@/components/lots/lot-reviews";
import { WatchButton } from "@/components/lots/watch-button";
import { RatingStars } from "@/components/shared/rating-stars";
import { LOT_GRID } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import { publicApi, serverApi } from "@/lib/api/server";
import { getClaims } from "@/lib/auth/session";
import { formatDate, formatDateTime, formatMoney, initials, isUuid, lotCode } from "@/lib/format";

/** Deduplicated between generateMetadata and the page within one request. */
const loadLot = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  try {
    return await serverApi.lot(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/lots/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lot = await loadLot(id);
  if (!lot) return { title: "Lot not found" };
  const price = formatMoney(lot.currentPriceCents);
  const description = `${lot.condition} · qty ${lot.quantity} · ${lot.location} · ${price}. ${lot.description.slice(0, 140)}`;
  return {
    title: lot.title,
    description,
    alternates: { canonical: `/lots/${lot.id}` },
    openGraph: {
      title: `${lot.title} · ${price}`,
      description,
      url: `/lots/${lot.id}`,
      images: lot.images[0] ? [{ url: lot.images[0], alt: lot.title }] : undefined,
    },
  };
}

export default async function LotDetailPage({ params }: PageProps<"/lots/[id]">) {
  const { id } = await params;
  const [lot, claims] = await Promise.all([loadLot(id), getClaims()]);
  if (!lot || (lot.status === "DRAFT" && claims?.id !== lot.sellerId)) notFound();
  const related = await publicApi.relatedLots(lot.id, 4).catch(() => []);

  const facts = [
    { icon: LuWrench, label: "Condition", value: lot.condition },
    { icon: LuLayers, label: "Quantity", value: lot.quantity.toLocaleString() },
    { icon: LuMapPin, label: "Pickup", value: lot.location || "See description" },
    { icon: LuPackage, label: "Lot code", value: lotCode(lot.id) },
  ];
  const specRows: [string, string][] = [
    ...lot.specs.map((s) => [s.label, s.value] as [string, string]),
    ["Category", lot.category.name],
    ["Condition", lot.condition],
    ["Quantity", lot.quantity.toLocaleString()],
    ["Pickup location", lot.location || "—"],
    ["Starting price", formatMoney(lot.startingPriceCents)],
    ["Bid increment", formatMoney(lot.bidIncrementCents)],
    ["Bidding opens", formatDateTime(lot.startTime)],
    ["Bidding closes", formatDateTime(lot.endTime)],
  ];
  const seller = lot.seller;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <LotViewTracker lotId={lot.id} categoryId={lot.categoryId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/lots">Explore</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/lots?categoryId=${lot.categoryId}`}>{lot.category.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="hidden max-w-72 sm:block">
              <BreadcrumbPage className="truncate">{lot.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {(!claims || claims.role === "BUYER") && <WatchButton lotId={lot.id} withLabel />}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-8">
          <LotGallery images={lot.images} title={lot.title} />

          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <StatusBadge status={lot.status} />
              <span className="font-mono">{lotCode(lot.id)}</span>
              <span aria-hidden>·</span>
              <Link href={`/lots?categoryId=${lot.categoryId}`} className="hover:text-foreground">
                {lot.category.name}
              </Link>
            </div>
            <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">{lot.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5">
                <LuGavel className="size-4" aria-hidden /> {lot.bidCount} {lot.bidCount === 1 ? "bid" : "bids"}
              </span>
              <span className="flex items-center gap-1.5">
                <LuEye className="size-4" aria-hidden /> {lot.viewCount ?? 0} views
              </span>
              <span className="flex items-center gap-1.5">
                <LuCalendarClock className="size-4" aria-hidden /> {lot.status === "LIVE" ? "Closes" : "Closed"}{" "}
                {formatDateTime(lot.endTime)}
              </span>
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <s.icon className="size-3.5" aria-hidden /> {s.label}
                </dt>
                <dd className="mt-1 truncate font-medium text-sm">{s.value}</dd>
              </div>
            ))}
          </dl>

          <Card id="overview">
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
              <CardDescription>The seller&apos;s description of the lot.</CardDescription>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {lot.description}
            </CardContent>
          </Card>

          <Card id="specifications">
            <CardHeader>
              <CardTitle className="text-lg">Specifications</CardTitle>
              <CardDescription>Key information and the auction schedule.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y rounded-lg border">
                {specRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[minmax(8rem,40%)_1fr] gap-3 px-4 py-2.5 text-sm odd:bg-muted/30"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card id="seller">
            <CardHeader>
              <CardTitle className="text-lg">About the seller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="size-14 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-lg text-primary">
                    {initials(seller.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-center gap-1.5 font-semibold text-lg">
                    {seller.companyName}
                    {seller.verificationStatus === "VERIFIED" && (
                      <LuBadgeCheck className="size-5 text-success" aria-label="Verified business" />
                    )}
                  </p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                    {seller.location && (
                      <span className="flex items-center gap-1">
                        <LuMapPin className="size-3.5" aria-hidden /> {seller.location}
                      </span>
                    )}
                    <span>Member since {formatDate(seller.createdAt)}</span>
                  </p>
                  {seller.rating ? (
                    <RatingStars value={seller.rating.average} count={seller.rating.count} />
                  ) : (
                    <p className="text-muted-foreground text-sm">No reviews yet</p>
                  )}
                </div>
              </div>
              {seller.bio && <p className="text-muted-foreground text-sm leading-relaxed">{seller.bio}</p>}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="font-bold text-xl tabular-nums">{seller.lotsSold}</p>
                  <p className="text-muted-foreground text-xs">Lots sold</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="font-bold text-xl tabular-nums">{seller.liveLots}</p>
                  <p className="text-muted-foreground text-xs">Live now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="reviews">
            <CardHeader>
              <CardTitle className="text-lg">Reviews & ratings</CardTitle>
              <CardDescription>Written by buyers who won and paid for a lot from this seller.</CardDescription>
            </CardHeader>
            <CardContent>
              <LotReviews sellerId={seller.id} sellerName={seller.companyName} lotId={lot.id} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <div className="space-y-3 lg:sticky lg:top-20">
            <BidPanel initialLot={lot} viewer={claims ? { id: claims.id, role: claims.role } : null} />
            <AskAiButton title={lot.title} />
          </div>
          <BidHistory lotId={lot.id} live={lot.status === "LIVE"} />
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-5 border-t pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="related-heading" className="font-bold text-2xl tracking-tight">
                You may also like
              </h2>
              <p className="text-muted-foreground">Live lots in {lot.category.name} and similar price ranges.</p>
            </div>
            <Link
              href={`/lots?categoryId=${lot.categoryId}`}
              className="font-medium text-primary text-sm hover:underline"
            >
              More in {lot.category.name}
            </Link>
          </div>
          <div className={LOT_GRID}>
            {related.map((r) => (
              <LotCard key={r.id} lot={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
