"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useWatchlist } from "@/stores/watchlist-store";

export function WatchButton({ lotId, withLabel = false }: { lotId: string; withLabel?: boolean }) {
  const mounted = useMounted();
  const watching = useWatchlist((s) => s.ids.includes(lotId)) && mounted;
  const toggle = useWatchlist((s) => s.toggle);

  return (
    <Button
      type="button"
      variant={withLabel ? "outline" : "secondary"}
      size={withLabel ? "default" : "icon-sm"}
      aria-pressed={watching}
      aria-label={watching ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(!withLabel && "rounded-full bg-background/90 backdrop-blur")}
      onClick={() => {
        toggle(lotId);
        toast.success(watching ? "Removed from watchlist" : "Added to watchlist");
      }}
    >
      <Heart className={cn(watching && "fill-destructive text-destructive")} />
      {withLabel && (watching ? "Watching" : "Watch")}
    </Button>
  );
}
