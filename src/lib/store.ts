import { useSyncExternalStore } from 'react';

/**
 * A tiny localStorage-backed value with a React hook. Used for state the
 * backend has no endpoint for yet (watchlist, notification read state,
 * preferences), so it lives per browser/device.
 */
export function createStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cached: T | undefined;
  const read = (): T => {
    if (cached !== undefined) return cached;
    try {
      const raw = localStorage.getItem(key);
      cached = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cached = fallback;
    }
    return cached;
  };
  const write = (value: T) => {
    cached = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep the in-memory value */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const useValue = () => useSyncExternalStore(subscribe, read, read);
  return { read, write, useValue };
}
