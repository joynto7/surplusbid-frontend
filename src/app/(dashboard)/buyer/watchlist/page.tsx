import type { Metadata } from "next";
import { Watchlist } from "@/components/dashboard/buyer/watchlist";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Watchlist" description="Lots you're keeping an eye on. Saved in this browser." />
      <Watchlist />
    </div>
  );
}
