"use client";

import { ErrorView } from "@/components/shared/error-view";

/** Catches errors thrown while rendering any route without its own boundary. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex-1 px-4">
      <ErrorView error={error} reset={reset} />
    </main>
  );
}
