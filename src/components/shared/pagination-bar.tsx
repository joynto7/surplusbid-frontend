"use client";

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 1 … 4 5 6 … 12: the first, last and neighbouring pages, with gaps collapsed. */
function pageList(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] ?? p) > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** Page controls for URL-driven lists. `onPage` writes `?page=` via useUrlState. */
export function PaginationBar({
  page,
  totalPages,
  total,
  onPage,
  label = "results",
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (total === 0) return null;
  const pages = Math.max(totalPages, 1);
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 pt-2 text-sm sm:flex-row">
      <p className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {pages} · {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <LuChevronLeft /> <span className="hidden sm:inline">Previous</span>
        </Button>
        {pageList(page, pages).map((p, i) =>
          p === "gap" ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: gaps have no identity
            <span key={`gap-${i}`} className="px-1.5 text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="sm"
              className={cn("min-w-8", p === page && "pointer-events-none")}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => onPage(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span> <LuChevronRight />
        </Button>
      </div>
    </nav>
  );
}
