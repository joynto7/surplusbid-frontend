import { Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Lot photo via next/image (Cloudinary URLs are optimized and lazy-loaded).
 * Lots without photos show a neutral icon tile rather than a stock image.
 */
export function LotImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Package className="size-8" aria-hidden />
          <span className="sr-only">No photo provided</span>
        </div>
      )}
    </div>
  );
}
