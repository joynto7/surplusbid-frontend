"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, Inbox } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatRelative, initials } from "@/lib/format";
import { adminUsersQuery } from "@/lib/queries";
import { VERIFICATION_QUEUE_QUERY } from "@/lib/query-keys";
import { VerifyActions } from "./users-table";

/** Oldest-first review queue. Approving or rejecting removes the card optimistically. */
export function VerificationQueue() {
  const queue = useQuery(adminUsersQuery(VERIFICATION_QUEUE_QUERY));
  if (queue.isPending) return <TableSkeleton rows={4} cols={3} />;
  const items = [...(queue.data?.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (!items.length) {
    return (
      <EmptyState
        icon={Inbox}
        title="Queue is clear"
        description="No businesses are waiting for verification. New submissions appear here automatically."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="size-4" aria-hidden /> {items.length} waiting · oldest first
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((u) => (
          <li key={u.id}>
            <Card className="py-0">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                    {initials(u.companyName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.companyName}</p>
                    <p className="truncate text-muted-foreground text-sm">{u.email}</p>
                  </div>
                  <StatusBadge status={u.role} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-xs">
                    <BadgeCheck className="mr-1 inline size-3.5" aria-hidden />
                    Registered {formatDate(u.createdAt)} · waiting {formatRelative(u.createdAt).replace(" ago", "")}
                  </p>
                  <VerifyActions user={u} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
