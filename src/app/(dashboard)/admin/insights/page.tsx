import type { Metadata } from "next";
import { AiInsights } from "@/components/dashboard/admin/ai-insights";

export const metadata: Metadata = { title: "AI insights" };

export default function AdminInsightsPage() {
  return <AiInsights />;
}
