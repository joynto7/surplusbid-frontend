import Link from "next/link";
import { LuArrowRight, LuGavel, LuMapPin, LuSparkles } from "react-icons/lu";
import { Countdown } from "@/components/shared/countdown";
import { LotImage } from "@/components/shared/lot-image";
import { RatingStars } from "@/components/shared/rating-stars";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/format";
import type { Lot, LotListItem } from "@/types/api";
import { EndingSoonBadge } from "./ending-soon-badge";
import { WatchButton } from "./watch-button";

export const LOT_CARD_SIZES = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * The catalogue card, identical everywhere: photo, category and location, a
 * two-line title, a two-line summary, price and time left, bids and seller
 * rating, and a View details button. Fixed line counts keep every card in a
 * row the same height. Works in Server and Client Components.
 */
export function LotCard({
  lot,
  categoryName,
  href = `/lots/${lot.id}`,
  priority,
  showWatch = true,
  reason,
}: {
  lot: Lot | LotListItem;
  categoryName?: string;
  href?: string;
  priority?: boolean;
  showWatch?: boolean;
  /** Why an AI section picked this lot, e.g. "Similar to …". */
  reason?: string;
}) {
  const full = "description" in lot ? lot : null;
  const price = lot.currentPriceCents ?? lot.currentHighestBidAmountCents ?? lot.startingPriceCents;
  const bids = lot.bidCount ?? 0;
  const hasBids = bids > 0 || lot.currentHighestBidAmountCents !== null;
  const live = lot.status === "LIVE";
  const category = full?.category?.name ?? categoryName;

  return (
    <Card className="group relative flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <LotImage
          src={lot.images[0]}
          alt={lot.title}
          className="aspect-4/3"
          priority={priority}
          sizes={LOT_CARD_SIZES}
        />
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
          <StatusBadge status={lot.status} className="bg-background/90 backdrop-blur" />
          {live && <EndingSoonBadge endTime={lot.endTime} />}
        </div>
        {showWatch && (
          <div className="absolute top-2 right-2 z-20">
            <WatchButton lotId={lot.id} />
          </div>
        )}
        {lot.images.length > 1 && (
          <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/60 px-1.5 py-0.5 font-medium text-[11px] text-white">
            {lot.images.length} photos
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
        {reason && (
          <p className="flex items-center gap-1 truncate font-medium text-primary text-xs">
            <LuSparkles className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{reason}</span>
          </p>
        )}
        <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
          <span className="truncate">{category ?? "Industrial surplus"}</span>
          {lot.location && (
            <span className="flex shrink-0 items-center gap-1">
              <LuMapPin className="size-3" aria-hidden /> {lot.location}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:z-10 group-hover:text-primary">
            {lot.title}
          </Link>
        </h3>
        <p className="line-clamp-2 min-h-10 text-muted-foreground text-sm">
          {full?.description.split("\n")[0] ?? "Open the lot for photos, specifications and bidding."}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-2.5">
          <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">
              {live ? (hasBids ? "Current bid" : "Starting at") : "Final price"}
            </dt>
            <dd className="truncate font-semibold text-base tabular-nums">{formatMoney(price)}</dd>
          </div>
          <div className="min-w-0 text-right">
            <dt className="text-muted-foreground text-xs">{live ? "Closes in" : "Closed"}</dt>
            <dd className="truncate font-medium text-sm">
              {live ? <Countdown endTime={lot.endTime} /> : formatDate(lot.endTime)}
            </dd>
          </div>
        </dl>
        <div className="flex min-h-5 items-center justify-between gap-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <LuGavel className="size-3.5" aria-hidden /> {bids} {bids === 1 ? "bid" : "bids"}
          </span>
          {full?.sellerRating ? (
            <RatingStars value={full.sellerRating.average} count={full.sellerRating.count} size="xs" />
          ) : (
            <span>{full?.seller?.verificationStatus === "VERIFIED" ? "Verified seller" : "New seller"}</span>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="relative z-20 w-full group-hover:border-primary/40">
          <Link href={href}>
            View details <LuArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
