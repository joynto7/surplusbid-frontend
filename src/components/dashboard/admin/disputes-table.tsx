"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LuEye, LuGavel, LuScale } from "react-icons/lu";
import { TextareaField } from "@/components/forms/fields";
import { type Column, DataTable } from "@/components/shared/data-table";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useResolveDispute } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatRelative, lotCode, shortCode } from "@/lib/format";
import { adminDisputesQuery } from "@/lib/queries";
import { type DisputeDecisionValues, disputeDecisionSchema } from "@/lib/validation";
import type { DisputeListItem, DisputeStatus } from "@/types/api";

const DEFAULTS = { status: "all", q: "" };
const PER_PAGE = 10;
const isOpen = (d: DisputeListItem) => d.status === "OPEN" || d.status === "UNDER_REVIEW";

function DecisionForm({ dispute, onDone }: { dispute: DisputeListItem; onDone: () => void }) {
  const resolve = useResolveDispute();
  const form = useForm<DisputeDecisionValues>({
    resolver: zodResolver(disputeDecisionSchema),
    defaultValues: { status: "RESOLVED", resolutionNote: "" },
    mode: "onTouched",
  });
  const onSubmit = (v: DisputeDecisionValues) => resolve.mutate({ id: dispute.id, ...v }, { onSuccess: onDone });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4 border-t pt-4">
      <Controller
        control={form.control}
        name="status"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Decision</FieldLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-2">
              {(["RESOLVED", "REJECTED"] as const).map((s) => (
                <label
                  key={s}
                  htmlFor={`decision-${s}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`decision-${s}`} value={s} />
                  {s === "RESOLVED" ? "Uphold the claim" : "Reject the claim"}
                </label>
              ))}
            </RadioGroup>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <TextareaField
        control={form.control}
        name="resolutionNote"
        label="Resolution note"
        rows={4}
        placeholder="What was decided and why. Both parties see this note."
      />
      <Button type="submit" disabled={resolve.isPending}>
        {resolve.isPending ? <Spinner /> : <LuGavel />} Record decision
      </Button>
    </form>
  );
}

function DisputeDialog({ dispute, onClose }: { dispute: DisputeListItem | null; onClose: () => void }) {
  return (
    <Dialog open={dispute !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {dispute && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <StatusBadge status={dispute.status} />
                <span className="font-mono text-muted-foreground text-xs">{shortCode("DSP", dispute.id)}</span>
              </div>
              <DialogTitle>{dispute.reason}</DialogTitle>
              <DialogDescription>
                Raised by {dispute.raisedBy.companyName} ({dispute.raisedBy.role.toLowerCase()}) on{" "}
                {formatDateTime(dispute.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 rounded-lg border p-3 text-sm">
              <dt className="text-muted-foreground">Lot</dt>
              <dd>
                <Link href={`/lots/${dispute.lot.id}`} className="font-medium hover:text-primary hover:underline">
                  {dispute.lot.title}
                </Link>{" "}
                <span className="font-mono text-muted-foreground text-xs">{lotCode(dispute.lot.id)}</span>
              </dd>
              <dt className="text-muted-foreground">Seller</dt>
              <dd>{dispute.lot.seller.companyName}</dd>
              <dt className="text-muted-foreground">Raised by</dt>
              <dd>
                {dispute.raisedBy.companyName} ·{" "}
                <a href={`mailto:${dispute.raisedBy.email}`} className="text-primary hover:underline">
                  {dispute.raisedBy.email}
                </a>
              </dd>
            </dl>
            <div className="space-y-1.5">
              <p className="font-medium text-sm">What happened</p>
              <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-muted-foreground text-sm leading-relaxed">
                {dispute.description}
              </p>
            </div>
            {isOpen(dispute) ? (
              <DecisionForm dispute={dispute} onDone={onClose} />
            ) : (
              <div className="space-y-1.5 border-t pt-4">
                <p className="font-medium text-sm">
                  Decision{dispute.resolvedAt ? `, ${formatDateTime(dispute.resolvedAt)}` : ""}
                </p>
                <p className="text-muted-foreground text-sm">{dispute.resolutionNote ?? "No note recorded."}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Every dispute on the platform with status tabs, search and a decision dialog. */
export function DisputesTable() {
  const { values, page, set, setPage } = useUrlState(DEFAULTS);
  const query = {
    page,
    limit: PER_PAGE,
    status: values.status === "all" ? undefined : values.status,
    q: values.q || undefined,
  };
  const disputes = useQuery(adminDisputesQuery(query));
  const [selected, setSelected] = useState<DisputeListItem | null>(null);
  const counts = disputes.data?.counts ?? {};
  const count = (s: DisputeStatus) => counts[s] ?? 0;

  const columns: Column<DisputeListItem>[] = [
    {
      key: "ref",
      header: "Reference",
      hideBelow: "md",
      cell: (d) => (
        <div>
          <p className="font-mono text-xs">{shortCode("DSP", d.id)}</p>
          <p className="text-muted-foreground text-xs">{formatRelative(d.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "lot",
      header: "Lot",
      cell: (d) => (
        <div className="min-w-0 max-w-36 sm:max-w-64">
          <p className="truncate font-medium">{d.lot.title}</p>
          <p className="truncate text-muted-foreground text-xs">Seller: {d.lot.seller.companyName}</p>
        </div>
      ),
    },
    {
      key: "raisedBy",
      header: "Raised by",
      hideBelow: "sm",
      cell: (d) => (
        <div className="flex flex-col items-start gap-1">
          <span className="truncate">{d.raisedBy.companyName}</span>
          <StatusBadge status={d.raisedBy.role} />
        </div>
      ),
    },
    { key: "reason", header: "Reason", hideBelow: "lg", cell: (d) => d.reason },
    { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
    {
      key: "action",
      header: <span className="sr-only">Action</span>,
      className: "text-right",
      cell: (d) =>
        isOpen(d) ? (
          <Button size="sm" onClick={() => setSelected(d)}>
            <LuGavel /> Decide
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
            <LuEye /> View
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterTabs
          label="Filter disputes by status"
          value={values.status}
          onChange={(status) => set({ status })}
          options={[
            {
              value: "all",
              label: "All",
              count: count("OPEN") + count("UNDER_REVIEW") + count("RESOLVED") + count("REJECTED"),
            },
            { value: "OPEN", label: "Open", count: count("OPEN") },
            { value: "UNDER_REVIEW", label: "Under review", count: count("UNDER_REVIEW") },
            { value: "RESOLVED", label: "Resolved", count: count("RESOLVED") },
            { value: "REJECTED", label: "Rejected", count: count("REJECTED") },
          ]}
        />
        <SearchInput
          value={values.q}
          onChange={(q) => set({ q })}
          placeholder="Search lot, company or reason"
          label="Search disputes"
        />
      </div>
      <DataTable
        columns={columns}
        rows={disputes.data?.items}
        loading={disputes.isPending}
        dimmed={disputes.isPlaceholderData}
        getRowId={(d) => d.id}
        caption="Disputes"
        empty={{
          icon: LuScale,
          title: values.q || values.status !== "all" ? "No disputes match" : "No disputes yet",
          description: "Buyers and sellers open disputes from their dashboards after a lot is sold.",
        }}
      />
      {disputes.data && (
        <PaginationBar
          page={page}
          totalPages={disputes.data.meta.totalPages}
          total={disputes.data.meta.total}
          onPage={setPage}
          label="disputes"
        />
      )}
      <DisputeDialog dispute={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
