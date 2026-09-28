"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { formatRemaining } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Live time-left label. Turns amber under an hour and red under 5 minutes. */
export function Countdown({ endTime, className }: { endTime: string; className?: string }) {
  const ms = useCountdown(endTime);
  const urgent = ms !== null && ms > 0 && ms < 5 * 60_000;
  const soon = ms !== null && ms > 0 && ms < 60 * 60_000;
  return (
    <time
      dateTime={endTime}
      suppressHydrationWarning
      className={cn(
        "font-mono tabular-nums",
        urgent ? "text-destructive" : soon ? "text-warning" : undefined,
        className,
      )}
    >
      {ms === null ? "—" : formatRemaining(ms)}
    </time>
  );
}
