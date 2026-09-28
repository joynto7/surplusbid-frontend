"use client";

import { ErrorView } from "@/components/shared/error-view";

export default function SellerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} title="This page failed to load" homeHref="/seller" />;
}
