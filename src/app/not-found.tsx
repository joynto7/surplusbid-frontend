import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Logo />
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <p className="font-mono text-muted-foreground text-sm">404</p>
        <h1 className="font-semibold text-3xl tracking-tight">This lot has left the floor</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, was removed, or the link is mistyped.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/lots">Browse live auctions</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
