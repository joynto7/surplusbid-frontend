import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft, LuArrowRight, LuClock, LuLightbulb } from "react-icons/lu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type BlogBlock, POSTS, postBySlug } from "@/content/blog";
import { formatDate, initials } from "@/lib/format";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, images: [{ url: post.cover }] },
  };
}

function Block({ block }: { block: BlogBlock }) {
  if (block.type === "h2") return <h2 className="pt-4 font-bold text-2xl tracking-tight">{block.text}</h2>;
  if (block.type === "ul")
    return (
      <ul className="list-disc space-y-2 pl-6 marker:text-primary">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  if (block.type === "tip")
    return (
      <aside className="flex gap-3 rounded-xl border border-highlight/40 bg-highlight/10 p-4 text-base">
        <LuLightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <p>{block.text}</p>
      </aside>
    );
  return <p>{block.text}</p>;
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="pb-16">
      <header className="mx-auto max-w-3xl space-y-5 px-4 pt-12 pb-8 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <LuArrowLeft className="size-4" aria-hidden /> All articles
        </Link>
        <p className="font-medium text-primary text-sm">{post.category}</p>
        <h1 className="font-bold text-4xl leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
        <p className="text-muted-foreground text-xl">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                {initials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            <span>
              <span className="block font-medium">{post.author.name}</span>
              <span className="block text-muted-foreground text-xs">{post.author.role}</span>
            </span>
          </span>
          <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <LuClock className="size-4" aria-hidden /> {post.readMinutes} min read
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border bg-muted">
          <Image
            src={post.cover}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-10 text-lg leading-relaxed sm:px-6">
        {post.body.map((block, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: article blocks are static and ordered
          <Block key={i} block={block} />
        ))}
        <div className="flex flex-wrap gap-2 pt-4">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-sm">
              #{t}
            </span>
          ))}
        </div>
        <Card className="mt-6 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Put it into practice</p>
              <p className="text-muted-foreground text-sm">Browse live lots from verified sellers, or list your own.</p>
            </div>
            <Button asChild>
              <Link href="/lots">
                Explore auctions <LuArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="more-heading" className="mx-auto mt-16 max-w-7xl space-y-6 border-t px-4 pt-12 sm:px-6">
        <h2 id="more-heading" className="font-bold text-2xl tracking-tight">
          Keep reading
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {more.map((p) => (
            <li key={p.slug}>
              <Card className="group relative h-full gap-0 overflow-hidden py-0">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <Image src={p.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
                <CardContent className="space-y-1.5 p-5">
                  <p className="text-muted-foreground text-xs">
                    {p.category} · {p.readMinutes} min read
                  </p>
                  <h3 className="font-semibold leading-snug">
                    <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
                      {p.title}
                    </Link>
                  </h3>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
