"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Clock, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { AreaTrendChart } from "@/components/charts/lazy";
import { type Column, DataTable } from "@/components/shared/data-table";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLotsByIds } from "@/hooks/use-lots";
import { useUrlState } from "@/hooks/use-url-state";
import { axisMoney, perMonth } from "@/lib/analytics";
import { formatDate, formatDateTime, formatMoney, shortCode } from "@/lib/format";
import { myPaymentsQuery } from "@/lib/queries";
import type { Lot, Payment, PaymentStatus } from "@/types/api";

const DEFAULTS = { status: "all" };
const STATUSES: (PaymentStatus | "all")[] = ["all", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];

function columns(lots: Map<string, Lot>): Column<Payment>[] {
  return [
    {
      key: "id",
      header: "Invoice",
      cell: (p) => <span className="font-mono text-xs">{shortCode("INV", p.id)}</span>,
    },
    {
      key: "lot",
      header: "Lot",
      cell: (p) => (
        <Link href={`/lots/${p.lotId}`} className="line-clamp-1 max-w-64 hover:text-primary hover:underline">
          {lots.get(p.lotId)?.title ?? "Lot"}
        </Link>
      ),
    },
    { key: "amount", header: "Balance", className: "text-right tabular-nums", cell: (p) => formatMoney(p.amountCents) },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: "date",
      header: "Due / paid",
      hideBelow: "md",
      cell: (p) => (p.paidAt ? `Paid ${formatDate(p.paidAt)}` : `Due ${formatDateTime(p.dueAt)}`),
    },
    {
      key: "action",
      header: <span className="sr-only">Action</span>,
      className: "text-right",
      cell: (p) =>
        p.status === "PENDING" && new Date(p.dueAt) > new Date() ? (
          <Button size="sm" asChild>
            <Link href={`/buyer/checkout/${p.id}`}>Pay now</Link>
          </Button>
        ) : null,
    },
  ];
}

export function PaymentsList() {
  const { values, set } = useUrlState(DEFAULTS);
  const payments = useQuery(myPaymentsQuery());
  const items = payments.data?.items ?? [];
  const lots = useLotsByIds(items.map((p) => p.lotId));
  const rows = items.filter((p) => values.status === "all" || p.status === values.status);

  const paid = items.filter((p) => p.status === "SUCCEEDED");
  const pending = items.filter((p) => p.status === "PENDING");
  const monthly = perMonth(
    paid,
    (p) => p.paidAt ?? p.createdAt,
    6,
    (p) => p.amountCents,
  );

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard
          label="Total paid"
          value={formatMoney(paid.reduce((s, p) => s + p.amountCents, 0))}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(pending.reduce((s, p) => s + p.amountCents, 0))}
          icon={Clock}
          tone="warning"
          hint={`${pending.length} invoice(s)`}
        />
        <StatCard label="Invoices" value={items.length} icon={Receipt} />
        <StatCard
          label="Failed"
          value={items.filter((p) => p.status === "FAILED").length}
          icon={Wallet}
          tone="danger"
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Spend by month</CardTitle>
          <CardDescription>Settled balances, last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            data={monthly}
            xKey="label"
            yKey="value"
            label="Paid"
            valueFormatter={axisMoney}
            height={200}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Invoices</h2>
        <Select value={values.status} onValueChange={(status) => set({ status })}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s[0] + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns(lots.byId)}
        rows={payments.isPending ? undefined : rows}
        loading={payments.isPending}
        getRowId={(p) => p.id}
        caption="Your invoices"
        empty={{
          icon: Receipt,
          title: values.status === "all" ? "No payments yet" : "No payments with this status",
          description: "When you win a lot, its invoice appears here with a Pay now button.",
        }}
      />
    </div>
  );
}
