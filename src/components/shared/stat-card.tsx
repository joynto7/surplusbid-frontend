import type { IconType } from "react-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: IconType;
  hint?: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "danger";
}

const ICON_TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="truncate font-semibold text-2xl tabular-nums tracking-tight">{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", ICON_TONES[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
