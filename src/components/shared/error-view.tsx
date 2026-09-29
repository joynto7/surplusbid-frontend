"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LuRotateCcw, LuTriangleAlert } from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Body of every error.tsx boundary: explains, toasts, and offers a retry. */
export function ErrorView({
  error,
  reset,
  title = "Something went wrong",
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  homeHref?: string;
}) {
  useEffect(() => {
    toast.error(title, { description: error.message || "An unexpected error occurred." });
    console.error(error);
  }, [error, title]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <LuTriangleAlert className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || "We couldn't load this page."} The API may be waking up; retrying usually helps.
        </p>
        {error.digest && <p className="font-mono text-muted-foreground text-xs">Ref: {error.digest}</p>}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <LuRotateCcw /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href={homeHref}>Go back</Link>
        </Button>
      </div>
    </div>
  );
}
