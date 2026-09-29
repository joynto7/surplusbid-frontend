"use client";

import { useQuery } from "@tanstack/react-query";
import { LuDownload, LuScrollText } from "react-icons/lu";
import { DonutChart } from "@/components/charts/lazy";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/use-url-state";
import { countBy } from "@/lib/analytics";
import { formatDateTime } from "@/lib/format";
import { auditLogsQuery } from "@/lib/queries";
import { AUDIT_PER_PAGE } from "@/lib/query-keys";
import type { AuditLog } from "@/types/api";

const DEFAULTS = { entityType: "all" };

function Outcome({ log }: { log: AuditLog }) {
  const status = log.metadata?.verificationStatus ?? log.metadata?.status;
  return typeof status === "string" ? (
    <StatusBadge status={status as "VERIFIED"} />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

const columns: Column<AuditLog>[] = [
  {
    key: "when",
    header: "When",
    cell: (l) => <span className="whitespace-nowrap">{formatDateTime(l.createdAt)}</span>,
  },
  { key: "action", header: "Action", cell: (l) => <code className="text-xs">{l.action}</code> },
  {
    key: "entity",
    header: "Entity",
    cell: (l) => (
      <span className="text-sm">
        {l.entityType} <span className="font-mono text-muted-foreground text-xs">{l.entityId.slice(0, 8)}</span>
      </span>
    ),
  },
  { key: "outcome", header: "Outcome", cell: (l) => <Outcome log={l} /> },
  {
    key: "note",
    header: "Note",
    hideBelow: "lg",
    cell: (l) => (
      <span className="line-clamp-1 max-w-64 text-muted-foreground text-xs">
        {typeof l.metadata?.resolutionNote === "string" ? l.metadata.resolutionNote : "—"}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    hideBelow: "md",
    cell: (l) => <span className="font-mono text-muted-foreground text-xs">{l.actorId?.slice(0, 8) ?? "system"}</span>,
  },
];

/** Paginated audit trail with an entity filter (?entityType=User&page=2) and CSV export. */
export function AuditLogView() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const entityType = values.entityType === "all" ? undefined : values.entityType;
  const logs = useQuery(auditLogsQuery({ page, limit: AUDIT_PER_PAGE, entityType }));
  const sample = useQuery(auditLogsQuery({ page: 1, limit: 200 }));
  const byAction = countBy(sample.data?.items ?? [], (l) => l.action);

  const exportCsv = () => {
    const rows = logs.data?.items ?? [];
    const csv = [
      "created_at,action,entity_type,entity_id,actor_id,metadata",
      ...rows.map((l) =>
        [
          l.createdAt,
          l.action,
          l.entityType,
          l.entityId,
          l.actorId ?? "",
          `"${JSON.stringify(l.metadata ?? {}).replaceAll('"', '""')}"`,
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `surplusbid-audit-p${page}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Actions breakdown</CardTitle>
            <CardDescription>Last {sample.data?.items.length ?? 0} entries</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(byAction).length ? (
              <DonutChart
                centerLabel="events"
                height={220}
                data={Object.entries(byAction).map(([action, value], i) => ({
                  key: action.toLowerCase(),
                  label: action.replaceAll("_", " ").toLowerCase(),
                  value,
                  color: `var(--chart-${(i % 5) + 1})`,
                }))}
              />
            ) : (
              <p className="py-10 text-center text-muted-foreground text-sm">No events yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What gets logged</CardTitle>
            <CardDescription>Every operator decision is recorded with who made it and when.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <code className="text-xs">VERIFY_USER</code>
              <p className="mt-1 text-muted-foreground">
                A business was verified, rejected or had verification revoked.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <code className="text-xs">RESOLVE_DISPUTE</code>
              <p className="mt-1 text-muted-foreground">
                A dispute was resolved or rejected, with the operator&apos;s note.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={values.entityType} onValueChange={(v) => set({ entityType: v })}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="User">Users</TabsTrigger>
            <TabsTrigger value="Dispute">Disputes</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" onClick={exportCsv} disabled={!logs.data?.items.length}>
          <LuDownload /> Export CSV
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={logs.data?.items}
        loading={logs.isPending}
        dimmed={logs.isPlaceholderData}
        getRowId={(l) => l.id}
        caption="Audit log"
        empty={{
          icon: LuScrollText,
          title: "No audit entries",
          description: "Operator actions will be recorded here.",
        }}
      />
      {logs.data && (
        <PaginationBar
          page={page}
          totalPages={logs.data.meta.totalPages}
          total={logs.data.meta.total}
          onPage={setPage}
          label="entries"
        />
      )}
    </div>
  );
}
