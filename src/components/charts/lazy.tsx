"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const loading = () => <Skeleton className="h-60 w-full" />;

/** Code-split chart components: Recharts loads only when a chart actually renders. */
export const BarTrendChart = dynamic(() => import("./charts").then((m) => m.BarTrendChart), { ssr: false, loading });
export const AreaTrendChart = dynamic(() => import("./charts").then((m) => m.AreaTrendChart), { ssr: false, loading });
export const DonutChart = dynamic(() => import("./charts").then((m) => m.DonutChart), { ssr: false, loading });
