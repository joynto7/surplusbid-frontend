"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Plus, Tags } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/forms/fields";
import { type Column, DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCategory } from "@/hooks/use-admin";
import { api } from "@/lib/api/client";
import { categoriesQuery, qk } from "@/lib/queries";
import { type CategoryValues, categorySchema } from "@/lib/validation";
import type { Category } from "@/types/api";

export function CategoriesManager() {
  const categories = useQuery(categoriesQuery());
  const create = useCreateCategory();
  const list = categories.data ?? [];
  // Live-lot count per category (limit=1, reads meta.total).
  const counts = useQueries({
    queries: list
      .filter((c) => !c.id.startsWith("optimistic-"))
      .map((c) => ({
        queryKey: qk.lots({ categoryId: c.id, status: "LIVE", limit: 1 }),
        queryFn: () => api.browseLots({ categoryId: c.id, status: "LIVE", limit: 1 }),
        staleTime: 60_000,
      })),
    combine: (results) => results.map((r) => r.data?.meta.total),
  });
  const liveCount = new Map(list.filter((c) => !c.id.startsWith("optimistic-")).map((c, i) => [c.id, counts[i]]));

  const form = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: "" } });
  const onSubmit = (v: CategoryValues) => {
    if (list.some((c) => c.name.toLowerCase() === v.name.toLowerCase())) {
      form.setError("name", { message: "A category with this name already exists" });
      return;
    }
    create.mutate(v.name, { onSuccess: () => form.reset() });
  };

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => (
        <span className={c.id.startsWith("optimistic-") ? "text-muted-foreground italic" : "font-medium"}>
          {c.name}
        </span>
      ),
    },
    { key: "slug", header: "Slug", hideBelow: "sm", cell: (c) => <code className="text-xs">{c.slug}</code> },
    {
      key: "live",
      header: "Live lots",
      className: "text-right tabular-nums",
      cell: (c) => liveCount.get(c.id) ?? "…",
    },
    {
      key: "view",
      header: <span className="sr-only">View</span>,
      className: "text-right",
      cell: (c) =>
        c.id.startsWith("optimistic-") ? (
          <Spinner className="ml-auto" />
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/lots?categoryId=${c.id}`}>View lots</Link>
          </Button>
        ),
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <DataTable
        columns={columns}
        rows={categories.data}
        loading={categories.isPending}
        getRowId={(c) => c.id}
        caption="Categories"
        empty={{
          icon: Tags,
          title: "No categories yet",
          description: "Create the first one to let sellers list lots.",
        }}
      />
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>New category</CardTitle>
          <CardDescription>Sellers choose from these when creating a lot. Names must be unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <TextField
              control={form.control}
              name="name"
              label="Category name"
              placeholder="e.g. Packaging equipment"
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : <Plus />} Add category
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
