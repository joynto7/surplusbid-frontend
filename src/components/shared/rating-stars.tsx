import { LuStar } from "react-icons/lu";
import { cn } from "@/lib/utils";

/** Read-only star rating, e.g. ★★★★☆ 4.5 (12). Partial stars are drawn by clipping a filled star. */
export function RatingStars({
  value,
  count,
  size = "sm",
  showValue = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const px = size === "xs" ? "size-3" : size === "sm" ? "size-3.5" : "size-4.5";
  const label = `${value.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} review${count === 1 ? "" : "s"}` : ""}`;
  return (
    <span className={cn("inline-flex items-center gap-1", className)} title={label}>
      <span className="sr-only">{label}</span>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)));
          return (
            <span key={i} className={cn("relative inline-block", px)}>
              <LuStar className={cn("absolute inset-0 text-muted-foreground/40", px)} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <LuStar className={cn("fill-highlight text-highlight", px)} />
              </span>
            </span>
          );
        })}
      </span>
      {showValue && (
        <span aria-hidden className="font-medium text-foreground tabular-nums">
          {value.toFixed(1)}
          {count !== undefined && <span className="font-normal text-muted-foreground"> ({count})</span>}
        </span>
      )}
    </span>
  );
}
