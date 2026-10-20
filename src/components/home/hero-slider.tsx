"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LuArrowRight, LuChevronDown, LuChevronLeft, LuChevronRight, LuShieldCheck, LuSparkles } from "react-icons/lu";
import { SmartSearch } from "@/components/ai/smart-search";
import { Button } from "@/components/ui/button";
import { favoriteCategoryId } from "@/lib/activity";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  slug: string;
  categoryId: string | null;
  label: string;
  title: string;
  body: string;
  image: string;
  liveLots: number;
}

const INTERVAL_MS = 6500;

/**
 * Hero: a rotating set of category spotlights behind a fixed headline and the
 * AI search. The slide order is personalized: the category this browser has
 * looked at most comes first (marked "Picked for you").
 */
export function HeroSlider({ slides: initial, liveLots }: { slides: HeroSlide[]; liveLots: number }) {
  const [slides, setSlides] = useState(initial);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [personalized, setPersonalized] = useState<string | null>(null);

  useEffect(() => {
    const favorite = favoriteCategoryId();
    const pos = initial.findIndex((s) => s.categoryId && s.categoryId === favorite);
    const picked = initial[pos];
    if (!picked) return;
    if (pos > 0) setSlides([picked, ...initial.filter((_, i) => i !== pos)]);
    setPersonalized(picked.slug);
  }, [initial]);

  const go = useCallback((next: number) => setIndex((next + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [go, index, paused, slides.length]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured categories"
      className="relative isolate z-20 flex h-[68svh] max-h-[760px] min-h-96 w-full items-center bg-slate-950 sm:h-[65svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.slug}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 -z-20 overflow-hidden transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={s.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn("object-cover", i === index && "animate-kenburns")}
          />
        </div>
      ))}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/25"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-slate-950/80 to-transparent"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-2 pb-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pb-12">
        <div className="space-y-4 text-white sm:space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur sm:text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            {liveLots} live auctions from verified businesses
          </p>
          <h1 className="max-w-2xl font-bold text-[2rem] leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Industrial surplus, sold in <span className="text-highlight">timed auctions</span>.
          </h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg [@media(max-height:720px)]:hidden">
            Machinery, vehicles, IT hardware and materials from companies that ran them. Every bidder has a deposit on
            the line, so every bid is real.
          </p>
          <div className="max-w-xl">
            <SmartSearch variant="hero" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild className="h-11 px-5">
              <Link href="/lots">
                Explore auctions <LuArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 border-white/30 bg-white/10 px-5 text-white backdrop-blur hover:bg-white/20 hover:text-white"
            >
              <Link href="/register?role=SELLER">Start selling</Link>
            </Button>
            <span className="hidden items-center gap-1.5 text-sm text-white/70 sm:flex">
              <LuShieldCheck className="size-4 text-emerald-400" aria-hidden /> Stripe-secured deposits
            </span>
          </div>
        </div>

        {/* The rotating spotlight card */}
        <div className="hidden justify-self-end lg:block">
          <div
            key={slide.slug}
            aria-live="polite"
            className="w-[22rem] animate-in fade-in slide-in-from-right-4 space-y-3 rounded-2xl border border-white/15 bg-slate-950/55 p-6 text-white shadow-2xl backdrop-blur-md duration-700"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-highlight text-sm uppercase tracking-wider">{slide.label}</span>
              {personalized === slide.slug && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 font-medium text-primary-foreground text-xs">
                  <LuSparkles className="size-3" aria-hidden /> Picked for you
                </span>
              )}
            </div>
            <p className="font-semibold text-2xl leading-snug">{slide.title}</p>
            <p className="text-sm text-white/75">{slide.body}</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-white/70">{slide.liveLots} live lots</span>
              <Link
                href={slide.categoryId ? `/lots?categoryId=${slide.categoryId}` : "/lots"}
                className="inline-flex items-center gap-1 font-medium text-sm hover:underline"
              >
                Browse {slide.label.toLowerCase()} <LuArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-6 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${s.label}`}
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </div>
        <a
          href="#categories"
          className="hidden items-center gap-1 text-sm text-white/70 hover:text-white sm:flex"
          aria-label="Scroll to categories"
        >
          Scroll to explore <LuChevronDown className="size-4 animate-float-hint" aria-hidden />
        </a>
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <LuChevronLeft />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="rounded-full border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <LuChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
