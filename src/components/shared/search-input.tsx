"use client";

import { useEffect, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

/** Debounced search box; commits to the URL only after the user pauses typing. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebounce(draft);

  // Keep in sync when the URL changes elsewhere (back button, "clear filters").
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
  }, [debounced, onChange, value]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <LuSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pr-8 pl-8"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <LuX className="size-3.5" />
        </button>
      )}
    </div>
  );
}
