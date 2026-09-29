"use client";

import { useQuery } from "@tanstack/react-query";
import { LuHistory } from "react-icons/lu";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney, formatRelative, shortCode } from "@/lib/format";
import { bidHistoryQuery } from "@/lib/queries";

/** Public bid log (amounts and times only). Polls every 15s while the lot is open. */
export function BidHistory({ lotId, live }: { lotId: string; live: boolean }) {
  const { data, isPending } = useQuery({ ...bidHistoryQuery(lotId), refetchInterval: live ? 15_000 : false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LuHistory className="size-4" aria-hidden /> Bid history
        </CardTitle>
        <CardDescription>
          {data ? `${data.meta.total} bid${data.meta.total === 1 ? "" : "s"}` : "Loading…"}
          {live && " · updates automatically"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <EmptyState icon={LuHistory} title="No bids yet" description="Be the first to bid on this lot." />
        ) : (
          <ol className="divide-y" aria-live="polite">
            {data.items.map((bid) => (
              <li key={bid.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium tabular-nums">{formatMoney(bid.amountCents)}</p>
                  <p className="text-muted-foreground text-xs">
                    <span className="font-mono">{shortCode("BID", bid.id)}</span> ·{" "}
                    <time dateTime={bid.createdAt} title={formatDateTime(bid.createdAt)}>
                      {formatRelative(bid.createdAt)}
                    </time>
                  </p>
                </div>
                <StatusBadge status={bid.status} />
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
