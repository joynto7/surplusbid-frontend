import type { IconType } from "react-icons";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide below this breakpoint to keep tables readable on phones. */
  hideBelow?: "sm" | "md" | "lg";
}

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

/** Typed table with built-in loading skeleton and empty state; used by every list view. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  empty,
  dimmed,
  caption,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  loading?: boolean;
  empty: { icon: IconType; title: string; description?: string; action?: React.ReactNode };
  /** True while showing previous-page data during a refetch. */
  dimmed?: boolean;
  caption?: string;
}) {
  if (!loading && rows && rows.length === 0) return <EmptyState {...empty} />;

  return (
    <div className={cn("overflow-hidden rounded-lg border transition-opacity", dimmed && "opacity-60")}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((c) => (
              <TableHead key={c.key} className={cn(c.hideBelow && HIDE[c.hideBelow], c.className)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading || !rows
            ? Array.from({ length: 5 }, (_, r) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                <TableRow key={r}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.hideBelow && HIDE[c.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.hideBelow && HIDE[c.hideBelow], c.className)}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
