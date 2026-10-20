import type { Metadata } from "next";
import { BlogList } from "@/components/blog/blog-list";
import { POSTS } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blog: guides for buying and selling surplus",
  description:
    "Practical guides from the SurplusBid team: inspecting used machinery, deposit holds, anti-sniping, pricing forklifts, selling idle equipment and shipping heavy items.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "SurplusBid blog", url: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-14 sm:px-6">
      <header className="max-w-2xl space-y-3">
        <p className="font-semibold text-primary text-sm uppercase tracking-wider">The SurplusBid blog</p>
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">Guides for buying and selling surplus</h1>
        <p className="text-lg text-muted-foreground">
          What to check before you bid, how payments work, and how to get the best price for idle equipment. Written by
          our marketplace team.
        </p>
      </header>
      <BlogList posts={POSTS} />
    </div>
  );
}
