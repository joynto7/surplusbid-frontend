"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LuBadgeCheck, LuClock, LuInbox } from "react-icons/lu";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton } from "@/components/shared/skeletons";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatRelative, initials } from "@/lib/format";
import { adminUsersQuery } from "@/lib/queries";
import { VERIFICATION_QUEUE_QUERY } from "@/lib/query-keys";
import { VerifyActions } from "./users-table";

const PER_PAGE = 6;
type RoleFilter = "all" | "BUYER" | "SELLER";

/** Oldest-first review queue with role filter, search and paging. Decisions remove the card optimistically. */
export function VerificationQueue() {
  const queue = useQuery(adminUsersQuery(VERIFICATION_QUEUE_QUERY));
  const [role, setRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  if (queue.isPending) return <TableSkeleton rows={4} cols={3} />;

  const all = [...(queue.data?.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!all.length) {
    return (
      <EmptyState
        icon={LuInbox}
        title="Queue is clear"
        description="No businesses are waiting for verification. New submissions appear here automatically."
      />
    );
  }

  const q = query.trim().toLowerCase();
  const matches = all.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!q || u.companyName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );
  const totalPages = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const items = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const count = (r: RoleFilter) => all.filter((u) => r === "all" || u.role === r).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs<RoleFilter>
          label="Filter by role"
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All", count: count("all") },
            { value: "BUYER", label: "Buyers", count: count("BUYER") },
            { value: "SELLER", label: "Sellers", count: count("SELLER") },
          ]}
        />
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search company or email"
          label="Search the queue"
        />
      </div>
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <LuClock className="size-4" aria-hidden /> {matches.length} waiting · oldest first
      </p>
      {items.length === 0 ? (
        <EmptyState icon={LuInbox} title="No businesses match" description="Try another role or search term." />
      ) : (
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
                      <LuBadgeCheck className="mr-1 inline size-3.5" aria-hidden />
                      Registered {formatDate(u.createdAt)} · waiting {formatRelative(u.createdAt).replace(" ago", "")}
                    </p>
                    <VerifyActions user={u} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {matches.length > 0 && (
        <PaginationBar
          page={current}
          totalPages={totalPages}
          total={matches.length}
          onPage={setPage}
          label="businesses"
        />
      )}
    </div>
  );
}
