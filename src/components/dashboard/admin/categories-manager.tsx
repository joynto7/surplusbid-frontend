"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuPlus, LuTags } from "react-icons/lu";
import { TextareaField, TextField } from "@/components/forms/fields";
import { CategoryIcon } from "@/components/shared/category-icon";
import { type Column, DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCategory } from "@/hooks/use-admin";
import { categoriesQuery } from "@/lib/queries";
import { type CategoryValues, categorySchema } from "@/lib/validation";
import type { Category } from "@/types/api";

const PER_PAGE = 6;
const isOptimistic = (c: Category) => c.id.startsWith("optimistic-");

const columns: Column<Category>[] = [
  {
    key: "name",
    header: "Category",
    cell: (c) => (
      <div className="flex items-center gap-3">
        <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {c.imageUrl ? (
            <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <CategoryIcon slug={c.slug} className="size-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className={isOptimistic(c) ? "text-muted-foreground italic" : "font-medium"}>{c.name}</p>
          {c.description && <p className="line-clamp-1 max-w-sm text-muted-foreground text-xs">{c.description}</p>}
        </div>
      </div>
    ),
  },
  { key: "slug", header: "Slug", hideBelow: "md", cell: (c) => <code className="text-xs">{c.slug}</code> },
  {
    key: "live",
    header: "Live lots",
    className: "text-right tabular-nums",
    cell: (c) => c.liveLotCount ?? 0,
  },
  {
    key: "view",
    header: <span className="sr-only">View</span>,
    className: "text-right",
    cell: (c) =>
      isOptimistic(c) ? (
        <Spinner className="ml-auto" />
      ) : (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/lots?categoryId=${c.id}`}>View lots</Link>
        </Button>
      ),
  },
];

export function CategoriesManager() {
  const categories = useQuery(categoriesQuery());
  const create = useCreateCategory();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const list = categories.data ?? [];
  const q = query.trim().toLowerCase();
  const matches = list.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
  );
  const totalPages = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });
  const onSubmit = (v: CategoryValues) => {
    if (list.some((c) => c.name.toLowerCase() === v.name.toLowerCase())) {
      form.setError("name", { message: "A category with this name already exists" });
      return;
    }
    create.mutate({ name: v.name, description: v.description || undefined }, { onSuccess: () => form.reset() });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search categories"
          label="Search categories"
        />
        <DataTable
          columns={columns}
          rows={categories.isPending ? undefined : rows}
          loading={categories.isPending}
          getRowId={(c) => c.id}
          caption="Categories"
          empty={{
            icon: LuTags,
            title: q ? "No categories match" : "No categories yet",
            description: q ? "Try another search." : "Create the first one to let sellers list lots.",
          }}
        />
        {matches.length > 0 && (
          <PaginationBar
            page={current}
            totalPages={totalPages}
            total={matches.length}
            onPage={setPage}
            label="categories"
          />
        )}
      </div>
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
            <TextareaField
              control={form.control}
              name="description"
              label="Description"
              rows={3}
              placeholder="What belongs here, shown on the category card"
              description="Optional, up to 200 characters."
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Spinner /> : <LuPlus />} Add category
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
