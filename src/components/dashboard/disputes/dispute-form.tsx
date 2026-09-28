"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Scale, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SelectField, TextareaField } from "@/components/forms/fields";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import { api } from "@/lib/api/client";
import { formatRelative, lotCode, shortCode } from "@/lib/format";
import { type DisputeValues, disputeSchema } from "@/lib/validation";
import { useFiledDisputes } from "@/stores/dispute-store";

const REASONS = [
  "Item not as described",
  "Item not received",
  "Missing items or quantity",
  "Damaged in removal",
  "Buyer didn't collect",
  "Other",
].map((r) => ({ value: r, label: r }));

/**
 * File a dispute on a lot the user is party to (winning buyer or seller).
 * `lots` is computed by the page from the user's wins or sold listings.
 */
export function DisputeForm({ lots, loading }: { lots: { id: string; title: string }[]; loading?: boolean }) {
  const add = useFiledDisputes((s) => s.add);
  const form = useForm<DisputeValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { description: "" },
    mode: "onTouched",
  });

  const create = useMutation({
    mutationFn: api.createDispute,
    onSuccess: (d) => {
      add(d);
      form.reset({ description: "" });
      toast.success("Dispute filed", { description: `Reference ${shortCode("DSP", d.id)}. An admin will review it.` });
    },
    meta: { errorToast: "Couldn't file the dispute" },
  });

  if (!loading && lots.length === 0) {
    return (
      <EmptyState
        icon={Scale}
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
              options={REASONS}
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
              {create.isPending ? <Spinner /> : <Send />} Submit dispute
            </Button>
          </FieldGroup>
        </CardContent>
      </form>
    </Card>
  );
}

export function FiledDisputes() {
  const mounted = useMounted();
  const filed = useFiledDisputes((s) => s.filed);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently filed</CardTitle>
        <CardDescription>Disputes submitted from this browser.</CardDescription>
      </CardHeader>
      <CardContent>
        {!mounted || filed.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing filed yet.</p>
        ) : (
          <ul className="divide-y">
            {filed.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{d.reason}</p>
                  <p className="text-muted-foreground text-xs">
                    <span className="font-mono">{shortCode("DSP", d.id)}</span> · {lotCode(d.lotId)} ·{" "}
                    {formatRelative(d.createdAt)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
