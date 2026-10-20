"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LuNewspaper, LuSearch } from "react-icons/lu";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BlogPost } from "@/content/blog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Filterable article grid: category chips plus a title/excerpt search. */
export function BlogList({ posts }: { posts: BlogPost[] }) {
  const categories = ["All", ...new Set(posts.map((p) => p.category))];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = posts.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))),
  );
  const [featured, ...rest] = visible;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap gap-2" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                category === c ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </fieldset>
        <div className="relative sm:w-72">
          <LuSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles"
            aria-label="Search articles"
            className="pl-9"
          />
        </div>
      </div>

      {!featured ? (
        <EmptyState icon={LuNewspaper} title="No articles match" description="Try another category or search term." />
      ) : (
        <>
          <Card className="group relative gap-0 overflow-hidden py-0 md:grid md:grid-cols-2">
            <div className="relative aspect-video overflow-hidden bg-muted md:aspect-auto md:min-h-80">
              <Image
                src={featured.cover}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <CardContent className="flex flex-col justify-center gap-3 p-6 md:p-10">
              <p className="text-muted-foreground text-sm">
                <span className="font-medium text-primary">{featured.category}</span> ·{" "}
                {formatDate(featured.publishedAt)} · {featured.readMinutes} min read
              </p>
              <h2 className="font-bold text-2xl leading-tight tracking-tight sm:text-3xl">
                <Link href={`/blog/${featured.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
                  {featured.title}
                </Link>
              </h2>
              <p className="text-muted-foreground">{featured.excerpt}</p>
              <p className="text-sm">
                {featured.author.name} · <span className="text-muted-foreground">{featured.author.role}</span>
              </p>
            </CardContent>
          </Card>

          {rest.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <li key={p.slug}>
                  <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <Image
                        src={p.cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="space-y-2 p-5">
                      <p className="text-muted-foreground text-xs">
                        <span className="font-medium text-primary">{p.category}</span> · {formatDate(p.publishedAt)} ·{" "}
                        {p.readMinutes} min
                      </p>
                      <h3 className="line-clamp-2 font-semibold text-lg leading-snug">
                        <Link
                          href={`/blog/${p.slug}`}
                          className="after:absolute after:inset-0 group-hover:text-primary"
                        >
                          {p.title}
                        </Link>
                      </h3>
                      <p className="line-clamp-3 text-muted-foreground text-sm">{p.excerpt}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
