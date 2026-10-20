import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesInbox } from "@/components/dashboard/admin/messages-inbox";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export const metadata: Metadata = { title: "Messages" };

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Questions sent from the contact page. Opening a message marks it as read."
      />
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <MessagesInbox />
      </Suspense>
    </div>
  );
}
