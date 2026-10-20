import type { Metadata } from "next";
import { Suspense } from "react";
import { SellerReviews } from "@/components/dashboard/reviews/seller-reviews";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Reviews" };

export default function SellerReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="What buyers say about you. Your average rating appears on every lot you list."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <SellerReviews />
      </Suspense>
    </div>
  );
}
