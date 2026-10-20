"use client";

import { LuFlame } from "react-icons/lu";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

/** Amber "Ending soon" tag for live lots closing within a day (client-only, so the time is always current). */
export function EndingSoonBadge({ endTime, className }: { endTime: string; className?: string }) {
  const ms = useCountdown(endTime);
  if (ms === null || ms <= 0 || ms > 24 * 3_600_000) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full bg-highlight px-2 font-semibold text-highlight-foreground text-xs",
        className,
      )}
    >
      <LuFlame className="size-3" aria-hidden />
      {ms < 3_600_000 ? "Final hour" : "Ending soon"}
    </span>
  );
}
