"use client";

import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SmartSearch } from "./smart-search";

/** Header search: a button (and ⌘K / Ctrl+K) that opens the AI search in a dialog. */
export function SearchDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Search auctions"
      >
        <LuSearch className="size-4" aria-hidden />
        <span className="hidden xl:inline">Search lots…</span>
        <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] xl:inline">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] translate-y-0 gap-3 p-3 sm:max-w-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Search auctions</DialogTitle>
          <DialogDescription className="sr-only">
            Type a product, or describe what you need, such as forklift under $20k in Texas.
          </DialogDescription>
          <SmartSearch variant="dialog" autoFocus onNavigate={() => setOpen(false)} />
          <p className="px-1 text-muted-foreground text-xs">
            Tip: describe what you need, like “refurbished laptops under $10k in Texas”. The AI turns it into filters.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
