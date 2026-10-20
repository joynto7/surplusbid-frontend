"use client";

import { cn } from "@/lib/utils";

/** Segmented status filter with optional counts, e.g. All · New 3 · Read · Archived. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-lg border bg-muted/40 p-0.5 [scrollbar-width:none]"
    >
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: segmented control styled as tabs
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground",
            value === o.value && "bg-background text-foreground shadow-sm",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                value === o.value ? "bg-primary/10 text-primary" : "bg-muted",
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
