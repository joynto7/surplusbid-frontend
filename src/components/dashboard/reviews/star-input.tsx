"use client";

import { useState } from "react";
import { LuStar } from "react-icons/lu";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Keyboard-accessible 1–5 star picker built on native radio inputs. */
export function StarInput({
  value,
  onChange,
  name,
  invalid,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  name: string;
  invalid?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value || 0;

  return (
    <fieldset className="flex items-center gap-1" onMouseLeave={() => setHover(0)} aria-invalid={invalid}>
      <legend className="sr-only">Rating</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer rounded-md p-0.5" onMouseEnter={() => setHover(n)}>
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="peer sr-only"
          />
          <LuStar
            aria-hidden
            className={cn(
              "size-7 rounded-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              n <= shown ? "fill-highlight text-highlight" : "text-muted-foreground/40",
            )}
          />
          <span className="sr-only">
            {n} star{n === 1 ? "" : "s"}, {LABELS[n]}
          </span>
        </label>
      ))}
      <span className="ml-2 min-w-20 text-muted-foreground text-sm" aria-hidden>
        {LABELS[shown]}
      </span>
    </fieldset>
  );
}
