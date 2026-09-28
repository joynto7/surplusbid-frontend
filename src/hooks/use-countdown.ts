"use client";

import { useSyncExternalStore } from "react";

// One shared 1s ticker for every countdown on the page instead of one interval each.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time, ticking every second. Returns null during SSR to avoid hydration mismatches. */
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}

/** Milliseconds until `iso`, or null before hydration. */
export function useCountdown(iso: string) {
  const current = useNow();
  return current === null ? null : new Date(iso).getTime() - current;
}
