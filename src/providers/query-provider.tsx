"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, errorMessage } from "@/lib/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { errorToast?: string | false };
    mutationMeta: { errorToast?: string | false };
  }
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't hammer the API on 4xx; retry network blips and 5xx once.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
      },
    },
    // One place for API-failure toasts. Components opt out with meta.errorToast = false.
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.errorToast === false || (error instanceof ApiError && error.status === 401)) return;
        toast.error(query.meta?.errorToast ?? "Couldn't load data", { description: errorMessage(error) });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.errorToast === false) return;
        toast.error(mutation.meta?.errorToast ?? "Action failed", { description: errorMessage(error) });
      },
    }),
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
