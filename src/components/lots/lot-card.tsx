import Link from "next/link";
import { LuClock } from "react-icons/lu";
import { Countdown } from "@/components/shared/countdown";
import { LotImage } from "@/components/shared/lot-image";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, lotCode } from "@/lib/format";
import type { Lot, LotListItem } from "@/types/api";
import { WatchButton } from "./watch-button";

/** Works in Server and Client Components; the countdown and watch toggle are client islands. */
export function LotCard({
  lot,
  categoryName,
  href = `/lots/${lot.id}`,
  priority,
  showWatch = true,
}: {
  lot: Lot | LotListItem;
  categoryName?: string;
  href?: string;
  priority?: boolean;
  showWatch?: boolean;
}) {
  const current = lot.currentHighestBidAmountCents;
  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={href} className="absolute inset-0 z-10" aria-label={`View ${lot.title}`} />
      <LotImage src={lot.images[0]} alt={lot.title} className="aspect-4/3" priority={priority} />
      <div className="absolute top-2 left-2 z-20 flex gap-1.5">
        <StatusBadge status={lot.status} className="bg-background/90 backdrop-blur" />
      </div>
      {showWatch && (
        <div className="absolute top-2 right-2 z-20">
          <WatchButton lotId={lot.id} />
        </div>
      )}
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="font-mono text-muted-foreground text-xs">
            {lotCode(lot.id)}
            {categoryName ? ` · ${categoryName}` : ""}
          </p>
          <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-primary">{lot.title}</h3>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-xs">{current ? "Current bid" : "Starting at"}</p>
            <p className="font-semibold text-lg tabular-nums">{formatMoney(current ?? lot.startingPriceCents)}</p>
          </div>
          {lot.status === "LIVE" && (
            <p className="flex items-center gap-1 text-muted-foreground text-sm">
              <LuClock className="size-3.5" aria-hidden />
              <Countdown endTime={lot.endTime} />
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
