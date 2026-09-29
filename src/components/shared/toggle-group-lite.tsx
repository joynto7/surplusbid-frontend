"use client";

import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

/** Small segmented control (icon buttons) with radio semantics. */
export function ToggleGroupLite<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: IconType }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border p-0.5">
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: segmented icon control
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
            value === o.value && "bg-muted text-foreground",
          )}
        >
          <o.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
