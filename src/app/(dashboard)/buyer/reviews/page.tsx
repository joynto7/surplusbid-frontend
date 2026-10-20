import type { Metadata } from "next";
import { Suspense } from "react";
import { BuyerReviews } from "@/components/dashboard/reviews/buyer-reviews";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "My reviews" };

export default function BuyerReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My reviews"
        description="Review the sellers you've bought from, and manage what you've written."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <BuyerReviews />
      </Suspense>
    </div>
  );
}
