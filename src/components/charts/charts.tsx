"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/**
 * Recharts wrappers on the shadcn chart primitives (theme-aware colours,
 * accessible tooltips). Imported only through ./lazy so Recharts is split
 * into its own chunk and never ships on pages without charts.
 */

type Row = Record<string, string | number>;

export function BarTrendChart({
  data,
  xKey,
  series,
  height = 240,
  valueFormatter,
  stacked = false,
}: {
  data: Row[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  height?: number;
  valueFormatter?: (v: number) => string;
  stacked?: boolean;
}) {
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])) as ChartConfig;
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} accessibilityLayer margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={valueFormatter ? 64 : 32}
          allowDecimals={false}
          tickFormatter={valueFormatter}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={
                valueFormatter ? (v, name) => [valueFormatter(Number(v)), config[String(name)]?.label] : undefined
              }
            />
          }
        />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={`var(--color-${s.key})`}
            radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) : 4}
            stackId={stacked ? "a" : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export function AreaTrendChart({
  data,
  xKey,
  yKey,
  label,
  color = "var(--chart-1)",
  height = 240,
  valueFormatter,
}: {
  data: Row[];
  xKey: string;
  yKey: string;
  label: string;
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const config = { [yKey]: { label, color } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <AreaChart data={data} accessibilityLayer margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id={`fill-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${yKey})`} stopOpacity={0.35} />
            <stop offset="95%" stopColor={`var(--color-${yKey})`} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={valueFormatter} />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={valueFormatter ? (v) => [valueFormatter(Number(v)), label] : undefined} />
          }
        />
        <Area
          dataKey={yKey}
          type="monotone"
          stroke={`var(--color-${yKey})`}
          strokeWidth={2}
          fill={`url(#fill-${yKey})`}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function DonutChart({
  data,
  centerLabel,
  height = 240,
}: {
  data: { key: string; label: string; value: number; color: string }[];
  centerLabel: string;
  height?: number;
}) {
  const config = Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.color }])) as ChartConfig;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ChartContainer config={config} className="mx-auto w-full" style={{ height }}>
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="58%" outerRadius="85%" strokeWidth={3}>
          {data.map((d) => (
            <Cell key={d.key} fill={`var(--color-${d.key})`} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground font-semibold text-2xl">
                    {total}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                    {centerLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} className="flex-wrap" />
      </PieChart>
    </ChartContainer>
  );
}
