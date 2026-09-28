import { StatCardSkeleton, StatGrid } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        {Array.from({ length: rows }, (_, r) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <div key={r} className="flex gap-4 border-t pt-3">
            {Array.from({ length: cols }, (_, c) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cells
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LotGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton cards
        <Card key={i} className="overflow-hidden pt-0">
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/** Default skeleton for dashboard pages: header, stat row, chart and table. */
export function DashboardSkeleton({ stats = true }: { stats?: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {stats && (
        <StatGrid>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </StatGrid>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <Card>
        <CardContent className="space-y-5">
          {Array.from({ length: fields }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton fields
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
