"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuExpand } from "react-icons/lu";
import { LotImage } from "@/components/shared/lot-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Main photo with thumbnails, arrow keys, and a full-screen viewer. */
export function LotGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;
  const go = useCallback((i: number) => setActive((i + count) % Math.max(count, 1)), [count]);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go, zoomed]);

  return (
    <div className="space-y-3">
      <div className="group relative">
        <button
          type="button"
          onClick={() => count && setZoomed(true)}
          className="block w-full cursor-zoom-in overflow-hidden rounded-xl border"
          aria-label="Open photo viewer"
        >
          <LotImage
            src={images[active]}
            alt={`${title}, photo ${active + 1} of ${Math.max(count, 1)}`}
            className="aspect-4/3"
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
          />
        </button>
        {count > 1 && (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => go(active - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <LuChevronLeft />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => go(active + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <LuChevronRight />
            </Button>
          </>
        )}
        {count > 0 && (
          <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-medium text-white text-xs">
            <LuExpand className="size-3.5" aria-hidden /> {active + 1} / {count}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "overflow-hidden rounded-lg border-2 transition",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <LotImage src={src} alt="" className="aspect-square" sizes="120px" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="max-w-[min(96vw,80rem)] gap-0 border-0 bg-black p-0 sm:max-w-[min(96vw,80rem)]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Photo {active + 1} of {count}. Use the arrow keys to move between photos.
          </DialogDescription>
          <div className="relative aspect-4/3 max-h-[85vh] w-full">
            {images[active] && (
              <Image
                src={images[active]}
                alt={`${title}, photo ${active + 1}`}
                fill
                sizes="96vw"
                className="object-contain"
              />
            )}
            {count > 1 && (
              <>
                <Button
                  type="button"
                  size="icon-lg"
                  variant="secondary"
                  onClick={() => go(active - 1)}
                  aria-label="Previous photo"
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full"
                >
                  <LuChevronLeft />
                </Button>
                <Button
                  type="button"
                  size="icon-lg"
                  variant="secondary"
                  onClick={() => go(active + 1)}
                  aria-label="Next photo"
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full"
                >
                  <LuChevronRight />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
