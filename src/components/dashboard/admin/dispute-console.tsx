"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Scale } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { TextareaField, TextField } from "@/components/forms/fields";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useResolveDispute } from "@/hooks/use-admin";
import { formatDateTime } from "@/lib/format";
import { adminStatsQuery, auditLogsQuery } from "@/lib/queries";
import { type ResolveDisputeValues, resolveDisputeSchema } from "@/lib/validation";

/**
 * The backend can resolve a dispute by id but has no list endpoint, so the
 * console pairs a resolve form (id from the buyer's/seller's reference or
 * support ticket) with the history of past decisions from the audit log.
 */
export function DisputeConsole() {
  const stats = useQuery(adminStatsQuery());
  const history = useQuery(auditLogsQuery({ page: 1, limit: 20, entityType: "Dispute" }));
  const resolve = useResolveDispute();
  const form = useForm<ResolveDisputeValues>({
    resolver: zodResolver(resolveDisputeSchema),
    defaultValues: { disputeId: "", status: "RESOLVED", resolutionNote: "" },
    mode: "onTouched",
  });

  const onSubmit = (v: ResolveDisputeValues) =>
    resolve.mutate(
      { id: v.disputeId, status: v.status, resolutionNote: v.resolutionNote },
      { onSuccess: () => form.reset({ disputeId: "", status: "RESOLVED", resolutionNote: "" }) },
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <StatCard
          label="Open disputes"
          value={stats.data?.openDisputes ?? "—"}
          icon={Scale}
          tone="danger"
          hint="Open or under review"
        />
        <Card>
          <CardHeader>
            <CardTitle>Record a decision</CardTitle>
            <CardDescription>The decision and note are saved to the audit log.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
              <TextField
                control={form.control}
                name="disputeId"
                label="Dispute ID"
                placeholder="e.g. 3f9a2c1e-…"
                className="font-mono"
                description="The full ID from the dispute notification."
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Decision</FieldLabel>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                      {(["RESOLVED", "REJECTED"] as const).map((s) => (
                        <label
                          key={s}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-data-[state=checked]:border-primary"
                        >
                          <RadioGroupItem value={s} />
                          {s === "RESOLVED" ? "Resolve in claimant's favour" : "Reject claim"}
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
                placeholder="What was decided and why. Both parties can see this."
              />
              <Button type="submit" disabled={resolve.isPending}>
                {resolve.isPending ? <Spinner /> : <Gavel />} Record decision
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Decision history</CardTitle>
          <CardDescription>Most recent dispute decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {history.isPending ? (
            <Spinner />
          ) : !history.data?.items.length ? (
            <EmptyState
              icon={Scale}
              title="No decisions yet"
              description="Resolved and rejected disputes appear here."
            />
          ) : (
            <ol className="space-y-3">
              {history.data.items.map((log) => (
                <li key={log.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs">{log.entityId}</code>
                    {typeof log.metadata?.status === "string" && (
                      <StatusBadge status={log.metadata.status as "RESOLVED" | "REJECTED"} />
                    )}
                  </div>
                  {typeof log.metadata?.resolutionNote === "string" && (
                    <p className="mt-2 text-muted-foreground">{log.metadata.resolutionNote}</p>
                  )}
                  <p className="mt-2 text-muted-foreground text-xs">{formatDateTime(log.createdAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
