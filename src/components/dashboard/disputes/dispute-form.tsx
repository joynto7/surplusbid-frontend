"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuScale, LuSend } from "react-icons/lu";
import { toast } from "sonner";
import { SelectField, TextareaField } from "@/components/forms/fields";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { formatDateTime, formatRelative, lotCode, shortCode } from "@/lib/format";
import { myDisputesQuery } from "@/lib/queries";
import { type DisputeValues, disputeSchema } from "@/lib/validation";
import { useRequiredSession } from "@/providers/session-provider";

const toOptions = (reasons: string[]) => reasons.map((r) => ({ value: r, label: r }));
const REASONS = {
  BUYER: toOptions([
    "Item not as described",
    "Item not received",
    "Missing items or quantity",
    "Damaged in removal",
    "Other",
  ]),
  SELLER: toOptions(["Buyer didn't collect", "Buyer didn't pay the balance", "Damage during removal", "Other"]),
};

/**
 * File a dispute on a lot the user is party to (winning buyer or seller).
 * `lots` is computed by the page from the user's wins or sold listings.
 */
export function DisputeForm({ lots, loading }: { lots: { id: string; title: string }[]; loading?: boolean }) {
  const me = useRequiredSession();
  const qc = useQueryClient();
  const form = useForm<DisputeValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { description: "" },
    mode: "onTouched",
  });

  const create = useMutation({
    mutationFn: api.createDispute,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["disputes", "mine"] });
      form.reset({ description: "" });
      toast.success("Dispute filed", { description: `Reference ${shortCode("DSP", d.id)}. An admin will review it.` });
    },
    meta: { errorToast: "Couldn't file the dispute" },
  });

  if (!loading && lots.length === 0) {
    return (
      <EmptyState
        icon={LuScale}
        title="No eligible lots"
        description="Disputes can be filed on lots you've won (buyers) or sold (sellers)."
      />
    );
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle>File a dispute</CardTitle>
          <CardDescription>
            Describe the problem clearly. Both parties and the admin see the description.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <FieldGroup>
            <SelectField
              control={form.control}
              name="lotId"
              label="Lot"
              placeholder={loading ? "Loading your lots…" : "Choose a lot"}
              options={lots.map((l) => ({ value: l.id, label: `${lotCode(l.id)} · ${l.title}` }))}
            />
            <SelectField
              control={form.control}
              name="reason"
              label="Reason"
              options={me.role === "SELLER" ? REASONS.SELLER : REASONS.BUYER}
              placeholder="Choose a reason"
            />
            <TextareaField
              control={form.control}
              name="description"
              label="What happened?"
              rows={5}
              placeholder="Include dates, what was agreed, and what you'd like as a resolution."
              description="At least 10 characters."
            />
            <Button type="submit" className="w-fit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : <LuSend />} Submit dispute
            </Button>
          </FieldGroup>
        </CardContent>
      </form>
    </Card>
  );
}

/** Disputes the user raised or that concern their lots, newest first, with any admin decision. */
export function MyDisputes() {
  const [page, setPage] = useState(1);
  const disputes = useQuery(myDisputesQuery(page));

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Your disputes</CardTitle>
        <CardDescription>Raised by you or about your lots. Decisions appear here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disputes.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : !disputes.data?.items.length ? (
          <p className="text-muted-foreground text-sm">No disputes so far.</p>
        ) : (
          <ul className="divide-y">
            {disputes.data.items.map((d) => (
              <li key={d.id} className="space-y-1.5 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{d.reason}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      <span className="font-mono">{shortCode("DSP", d.id)}</span> · {d.lot.title}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-muted-foreground text-xs">
                  Opened {formatRelative(d.createdAt)} by {d.raisedBy.companyName}
                </p>
                {d.resolutionNote && (
                  <p className="rounded-md bg-muted/50 p-2 text-xs">
                    <span className="font-medium">
                      Decision{d.resolvedAt ? ` (${formatDateTime(d.resolvedAt)})` : ""}:
                    </span>{" "}
                    {d.resolutionNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {disputes.data && disputes.data.meta.totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={disputes.data.meta.totalPages}
            total={disputes.data.meta.total}
            onPage={setPage}
            label="disputes"
          />
        )}
      </CardContent>
    </Card>
  );
}
