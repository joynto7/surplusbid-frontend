"use client";

import { useQuery } from "@tanstack/react-query";
import { LuCheck, LuDownload, LuFilterX, LuUsers, LuUserX, LuX } from "react-icons/lu";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVerifyUser } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate, initials } from "@/lib/format";
import { adminUsersQuery } from "@/lib/queries";
import type { AdminUser, Role, VerificationStatus } from "@/types/api";

const DEFAULTS = { role: "all", status: "all" };
const PER_PAGE = 10;

function toCsv(rows: AdminUser[]) {
  const lines = rows.map((u) => [u.companyName, u.email, u.role, u.verificationStatus, u.createdAt.slice(0, 10)]);
  return [["company", "email", "role", "verification", "joined"], ...lines]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function VerifyActions({ user, compact }: { user: AdminUser; compact?: boolean }) {
  const verify = useVerifyUser();
  const busy = verify.isPending && verify.variables?.id === user.id;
  if (user.role === "ADMIN") return null;
  return (
    <div className="flex justify-end gap-1.5">
      {user.verificationStatus !== "VERIFIED" && (
        <Button size="sm" disabled={busy} onClick={() => verify.mutate({ id: user.id, status: "VERIFIED" })}>
          <LuCheck /> {compact ? "" : "Verify"}
        </Button>
      )}
      {user.verificationStatus !== "REJECTED" && (
        <Button
          size="sm"
          variant={user.verificationStatus === "VERIFIED" ? "outline" : "destructive"}
          disabled={busy}
          onClick={() => verify.mutate({ id: user.id, status: "REJECTED" })}
        >
          {user.verificationStatus === "VERIFIED" ? <LuUserX /> : <LuX />}{" "}
          {compact ? "" : user.verificationStatus === "VERIFIED" ? "Revoke" : "Reject"}
        </Button>
      )}
    </div>
  );
}

export const userColumns: Column<AdminUser>[] = [
  {
    key: "company",
    header: "Business",
    cell: (u) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
          {initials(u.companyName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{u.companyName}</p>
          <p className="truncate text-muted-foreground text-xs">{u.email}</p>
        </div>
      </div>
    ),
  },
  { key: "role", header: "Role", cell: (u) => <StatusBadge status={u.role} /> },
  { key: "status", header: "Verification", cell: (u) => <StatusBadge status={u.verificationStatus} /> },
  { key: "joined", header: "Joined", hideBelow: "md", cell: (u) => formatDate(u.createdAt) },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (u) => <VerifyActions user={u} />,
  },
];

/** Server-side paginated user directory; role, status and page live in the URL. */
export function UsersTable() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const query = {
    page,
    limit: PER_PAGE,
    role: values.role === "all" ? undefined : (values.role as Role),
    verificationStatus: values.status === "all" ? undefined : (values.status as VerificationStatus),
  };
  const users = useQuery(adminUsersQuery(query));
  const filtered = values.role !== "all" || values.status !== "all";

  const exportCsv = () => {
    if (!users.data) return;
    const url = URL.createObjectURL(new Blob([toCsv(users.data.items)], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `surplusbid-users-p${page}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={values.role} onValueChange={(role) => set({ role })}>
          <SelectTrigger className="w-36" aria-label="Role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="BUYER">Buyers</SelectItem>
            <SelectItem value="SELLER">Sellers</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={values.status} onValueChange={(status) => set({ status })}>
          <SelectTrigger className="w-40" aria-label="Verification status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="UNVERIFIED">Unverified</SelectItem>
          </SelectContent>
        </Select>
        {filtered && (
          <Button variant="ghost" onClick={() => set({ role: "all", status: "all" })}>
            <LuFilterX /> Clear
          </Button>
        )}
        <Button variant="outline" className="ml-auto" onClick={exportCsv} disabled={!users.data?.items.length}>
          <LuDownload /> Export page
        </Button>
      </div>
      <DataTable
        columns={userColumns}
        rows={users.data?.items}
        loading={users.isPending}
        dimmed={users.isPlaceholderData}
        getRowId={(u) => u.id}
        caption="Registered businesses"
        empty={{ icon: LuUsers, title: "No users match these filters", description: "Try a different role or status." }}
      />
      {users.data && (
        <PaginationBar
          page={page}
          totalPages={users.data.meta.totalPages}
          total={users.data.meta.total}
          onPage={setPage}
          label="users"
        />
      )}
    </div>
  );
}
