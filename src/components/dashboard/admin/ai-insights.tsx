"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuActivity,
  LuArrowRight,
  LuCircleCheck,
  LuInfo,
  LuOctagonAlert,
  LuRefreshCw,
  LuSparkles,
  LuTrendingUp,
  LuTriangleAlert,
} from "react-icons/lu";
import { BarTrendChart } from "@/components/charts/lazy";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dayLabel } from "@/lib/analytics";
import { formatRelative } from "@/lib/format";
import { adminInsightsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { AdminInsights, AiMode, InsightSeverity } from "@/types/api";

const SEVERITY: Record<InsightSeverity, { icon: IconType; tone: string; label: string }> = {
  positive: { icon: LuTrendingUp, tone: "bg-success/10 text-success", label: "Good news" },
  info: { icon: LuInfo, tone: "bg-primary/10 text-primary", label: "For your information" },
  warning: { icon: LuTriangleAlert, tone: "bg-warning/10 text-warning", label: "Needs attention" },
  critical: { icon: LuOctagonAlert, tone: "bg-destructive/10 text-destructive", label: "Urgent" },
};

function ModeBadge({ mode }: { mode: AiMode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-medium text-xs"
      title={
        mode === "ai"
          ? "Written by Claude from this week's marketplace data"
          : "Written by the built-in analysis engine. Claude writes it when an Anthropic API key is configured."
      }
    >
      <LuSparkles className="size-3 text-primary" aria-hidden />
      {mode === "ai" ? "Written by Claude" : "Built-in analysis"}
    </span>
  );
}

function SeverityIcon({ severity, className }: { severity: InsightSeverity; className?: string }) {
  const { icon: Icon, tone, label } = SEVERITY[severity];
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", tone, className)} title={label}>
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Compact briefing for the admin overview: the AI summary plus the three most important insights. */
export function AiBriefing() {
  const insights = useQuery(adminInsightsQuery());
  const data = insights.data;
  const order: InsightSeverity[] = ["critical", "warning", "positive", "info"];
  const top = [...(data?.insights ?? [])]
    .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
    .slice(0, 3);

  return (
    <Card className="relative overflow-hidden border-primary/30">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-chart-4 to-highlight"
      />
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <LuSparkles className="size-4 text-primary" aria-hidden /> AI briefing
          </CardTitle>
          <CardDescription>What changed on the marketplace, and what needs you.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {data && <ModeBadge mode={data.summaryMode} />}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/insights">
              All insights <LuArrowRight />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <div className="grid gap-3 pt-2 md:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ) : !data ? (
          <p className="text-muted-foreground text-sm">The briefing couldn&apos;t be generated right now.</p>
        ) : (
          <>
            <p className="text-pretty text-base leading-relaxed">{data.summary}</p>
            <ul className="grid gap-3 md:grid-cols-3">
              {top.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                  <SeverityIcon severity={i.severity} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-sm leading-snug">{i.title}</p>
                    {i.metric && <p className="font-semibold text-lg tabular-nums">{i.metric}</p>}
                    {i.action && (
                      <Link href={i.action.href} className="text-primary text-xs hover:underline">
                        {i.action.label}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function AnomalyPanel({ data }: { data: AdminInsights }) {
  const series = data.bidSeries.map((d) => ({
    label: dayLabel(d.day),
    normal: d.anomaly ? 0 : d.bids,
    unusual: d.anomaly ? d.bids : 0,
  }));
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Bidding activity and anomalies</CardTitle>
          <CardDescription>
            Bids per day for the last 30 days. Days far above the usual level (z-score over 2) are flagged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarTrendChart
            data={series}
            xKey="label"
            stacked
            height={260}
            series={[
              { key: "normal", label: "Bids", color: "var(--chart-1)" },
              { key: "unusual", label: "Unusual day", color: "var(--chart-3)" },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LuActivity className="size-4 text-primary" aria-hidden /> Anomaly detection
          </CardTitle>
          <CardDescription>
            Bid spikes, sudden jumps, rapid-fire bidding, stalled lots and late payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.anomalies.length === 0 ? (
            <EmptyState
              icon={LuCircleCheck}
              title="Nothing unusual"
              description="Every signal is within its normal range."
            />
          ) : (
            <ul className="space-y-3">
              {data.anomalies.map((a) => (
                <li key={a.id} className="flex gap-3 rounded-lg border p-3">
                  <SeverityIcon severity={a.severity} />
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-muted-foreground">{a.detail}</p>
                    {a.href && (
                      <Link href={a.href} className="text-primary text-xs hover:underline">
                        Investigate
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Full AI insights page: narrative summary, ranked insight cards and anomaly detection. */
export function AiInsights() {
  const insights = useQuery(adminInsightsQuery());
  const data = insights.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI insights"
        description="An automatic read of sales, bidding, verification and support activity, refreshed on demand."
        actions={
          <Button variant="outline" onClick={() => insights.refetch()} disabled={insights.isFetching}>
            <LuRefreshCw className={cn(insights.isFetching && "animate-spin")} /> Refresh
          </Button>
        }
      />
      {insights.isPending ? (
        <InsightsSkeleton />
      ) : !data ? (
        <EmptyState
          icon={LuSparkles}
          title="Insights are unavailable"
          description="The analysis couldn't run. Try refreshing in a moment."
          action={<Button onClick={() => insights.refetch()}>Try again</Button>}
        />
      ) : (
        <>
          <Card className="relative overflow-hidden border-primary/30 bg-primary/[0.03]">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-chart-4 to-highlight"
            />
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <LuSparkles className="size-4 text-primary" aria-hidden /> Summary
              </CardTitle>
              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                <ModeBadge mode={data.summaryMode} />
                <span>Generated {formatRelative(data.generatedAt)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="max-w-4xl text-pretty text-lg leading-relaxed">{data.summary}</p>
            </CardContent>
          </Card>

          <section aria-labelledby="insights-heading" className="space-y-3">
            <h2 id="insights-heading" className="font-semibold text-lg">
              Insights
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.insights.map((i) => (
                <li key={i.id}>
                  <Card className="h-full gap-3">
                    <CardHeader className="flex flex-row items-start gap-3">
                      <SeverityIcon severity={i.severity} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="text-base leading-snug">{i.title}</CardTitle>
                        <p className="text-muted-foreground text-xs">{SEVERITY[i.severity].label}</p>
                      </div>
                      {i.metric && <span className="font-semibold text-xl tabular-nums">{i.metric}</span>}
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-3">
                      <p className="text-muted-foreground text-sm">{i.detail}</p>
                      {i.action && (
                        <Button variant="outline" size="sm" className="w-fit" asChild>
                          <Link href={i.action.href}>
                            {i.action.label} <LuArrowRight />
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <AnomalyPanel data={data} />
        </>
      )}
    </div>
  );
}
