"use client";

import { useState } from "react";
import { LotImage } from "@/components/shared/lot-image";
import { cn } from "@/lib/utils";

export function LotGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <LotImage
        src={images[active]}
        alt={`${title}, photo ${active + 1} of ${Math.max(images.length, 1)}`}
        className="aspect-4/3 rounded-xl border"
        sizes="(min-width: 1024px) 60vw, 100vw"
        priority
      />
      {images.length > 1 && (
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
    </div>
  );
}
