"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during SSR and hydration, true afterwards. Use it to gate values read
 * from persisted client stores (localStorage) so server and client markup match.
 */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
