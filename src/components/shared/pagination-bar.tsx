"use client";

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";

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
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2 text-sm">
      <p className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {Math.max(totalPages, 1)} · {total} {label}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <LuChevronLeft /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <LuChevronRight />
        </Button>
      </div>
    </nav>
  );
}
