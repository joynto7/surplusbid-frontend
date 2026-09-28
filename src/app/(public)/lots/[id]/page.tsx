import { ChevronLeft, Layers, Package, Tag, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BidHistory } from "@/components/lots/bid-history";
import { BidPanel } from "@/components/lots/bid-panel";
import { LotGallery } from "@/components/lots/lot-gallery";
import { WatchButton } from "@/components/lots/watch-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import { publicApi, serverApi } from "@/lib/api/server";
import { getClaims } from "@/lib/auth/session";
import { formatDateTime, formatMoney, lotCode } from "@/lib/format";
import { isUuid } from "@/lib/format";

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
  const price = formatMoney(lot.currentHighestBidAmountCents ?? lot.startingPriceCents);
  const description = `${lot.condition} · qty ${lot.quantity} · ${price}. ${lot.description.slice(0, 140)}`;
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
  const [lot, claims, categories] = await Promise.all([
    loadLot(id),
    getClaims(),
    publicApi.categories().catch(() => []),
  ]);
  if (!lot || (lot.status === "DRAFT" && claims?.id !== lot.sellerId)) notFound();

  const category = categories.find((c) => c.id === lot.categoryId);
  const specs = [
    { icon: Tag, label: "Category", value: category?.name ?? "—" },
    { icon: Wrench, label: "Condition", value: lot.condition },
    { icon: Layers, label: "Quantity", value: lot.quantity.toLocaleString() },
    { icon: Package, label: "Lot code", value: lotCode(lot.id) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-2">
        <Link href="/lots" className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground">
          <ChevronLeft className="size-4" /> All auctions
        </Link>
        {(!claims || claims.role === "BUYER") && <WatchButton lotId={lot.id} withLabel />}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <LotGallery images={lot.images} title={lot.title} />
          <header className="space-y-2">
            <p className="font-mono text-muted-foreground text-sm">
              {lotCode(lot.id)} · {category?.name}
            </p>
            <h1 className="font-semibold text-3xl tracking-tight">{lot.title}</h1>
          </header>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="rounded-lg border p-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <s.icon className="size-3.5" aria-hidden /> {s.label}
                </dt>
                <dd className="mt-1 truncate font-medium text-sm">{s.value}</dd>
              </div>
            ))}
          </dl>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
              {lot.description}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auction schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Opened</dt>
                  <dd className="font-medium">{formatDateTime(lot.startTime)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Closes</dt>
                  <dd className="font-medium">{formatDateTime(lot.endTime)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Starting price</dt>
                  <dd className="font-medium">{formatMoney(lot.startingPriceCents)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <BidPanel initialLot={lot} viewer={claims ? { id: claims.id, role: claims.role } : null} />
          <BidHistory lotId={lot.id} live={lot.status === "LIVE"} />
        </aside>
      </div>
    </div>
  );
}
