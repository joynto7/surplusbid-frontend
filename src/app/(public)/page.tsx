import type { Metadata } from "next";
import { type HeroSlide, HeroSlider } from "@/components/home/hero-slider";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { RecommendedSection } from "@/components/home/recommended-section";
import {
  BlogSection,
  CategoriesSection,
  CtaSection,
  FaqSection,
  FeaturesSection,
  HowItWorksSection,
  LotRowSection,
  RecentlySoldSection,
  StatsStrip,
  TestimonialsSection,
  TopSellersSection,
} from "@/components/home/sections";
import { unsplash } from "@/content/blog";
import { publicApi } from "@/lib/api/server";
import type { Category } from "@/types/api";

export const metadata: Metadata = {
  title: { absolute: "SurplusBid: B2B industrial surplus auctions" },
  description:
    "Buy and sell industrial surplus in timed auctions. Verified businesses, refundable Stripe deposit holds, anti-sniping and an AI assistant on every lot.",
  alternates: { canonical: "/" },
};

// Static page, regenerated at most once a minute (ISR) so live figures stay fresh.
export const revalidate = 60;

const SPOTLIGHTS: Omit<HeroSlide, "categoryId" | "liveLots">[] = [
  {
    slug: "machinery",
    label: "Machinery",
    title: "Production machinery from working plants",
    body: "CNC centers, lasers and compressors from line consolidations, inspected and documented by the seller.",
    image: unsplash("1647427060118-4911c9821b82", 2000),
  },
  {
    slug: "vehicles",
    label: "Vehicles",
    title: "Forklifts, trucks and fleet equipment",
    body: "Retired fleet units with service records, sold by the companies that ran them.",
    image: unsplash("1740914994657-f1cdffdc418e", 2000),
  },
  {
    slug: "electronics",
    label: "Electronics",
    title: "Data center hardware, wiped to NIST 800-88",
    body: "Servers, switches and laptops with certificates of data destruction.",
    image: unsplash("1584169417032-d34e8d805e8b", 2000),
  },
  {
    slug: "restaurant-equipment",
    label: "Restaurant",
    title: "Commercial kitchens at a fraction of new",
    body: "Combi ovens, refrigeration and complete hot lines from restaurant refits and closures.",
    image: unsplash("1790156591384-dbb7c31b0062", 2000),
  },
];

async function loadHome() {
  const settled = await Promise.allSettled([
    publicApi.stats(),
    publicApi.categories(),
    publicApi.browseLots({ status: "LIVE", sortBy: "endTime", sortOrder: "asc", limit: 8 }),
    publicApi.aiTrending(4),
    publicApi.browseLots({ status: "SOLD", sortBy: "endTime", sortOrder: "desc", limit: 4 }),
    publicApi.topSellers(6),
    publicApi.latestReviews(6),
  ]);
  const value = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);
  const [stats, categories, closing, trending, sold, sellers, reviews] = settled;
  return {
    stats: value(stats),
    categories: (value(categories) ?? []) as Category[],
    closing: value(closing)?.items ?? null,
    trending: value(trending),
    sold: value(sold)?.items ?? null,
    sellers: value(sellers),
    reviews: value(reviews),
  };
}

export default async function HomePage() {
  const data = await loadHome();
  const bySlug = new Map(data.categories.map((c) => [c.slug, c]));
  const slides: HeroSlide[] = SPOTLIGHTS.map((s) => ({
    ...s,
    categoryId: bySlug.get(s.slug)?.id ?? null,
    liveLots: bySlug.get(s.slug)?.liveLotCount ?? 0,
  }));

  return (
    <>
      <HeroSlider slides={slides} liveLots={data.stats?.liveLots ?? 0} />
      <StatsStrip stats={data.stats} />
      <CategoriesSection categories={data.categories} />
      <LotRowSection
        id="closing-soon"
        eyebrow="Closing soon"
        title="Last chance to bid"
        description="Live lots ordered by closing time. Late bids extend the clock, so there's still time."
        action={{ href: "/lots?sort=ending", label: "View all" }}
        lots={data.closing?.slice(0, 4) ?? null}
        empty={{
          title: "No live auctions right now",
          description: "New lots are published by verified sellers every week.",
        }}
      />
      <RecommendedSection />
      <LotRowSection
        id="trending"
        eyebrow="Trending · AI ranked"
        title="Where the bidding is hottest"
        description="Ranked by bids, distinct bidders and views in the last 24 hours."
        action={{ href: "/lots?sort=popular", label: "Most popular" }}
        lots={data.trending}
        empty={{ title: "Bidding is quiet right now", description: "Check back soon, or browse every live lot." }}
      />
      <HowItWorksSection />
      <FeaturesSection />
      <RecentlySoldSection lots={data.sold} />
      <TopSellersSection sellers={data.sellers} />
      <TestimonialsSection reviews={data.reviews} />
      <BlogSection />
      <FaqSection />
      <NewsletterSection />
      <CtaSection />
    </>
  );
}
