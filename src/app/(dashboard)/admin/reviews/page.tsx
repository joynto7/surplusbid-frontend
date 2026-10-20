import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewsModeration } from "@/components/dashboard/admin/reviews-moderation";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Buyer reviews of sellers. Remove reviews that break the review policy."
      />
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <ReviewsModeration />
      </Suspense>
    </div>
  );
}
