import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Buyer watchlist. The backend has no watchlist endpoint, so this is global
 * client state persisted per browser.
 */
interface WatchlistState {
  ids: string[];
  toggle: (lotId: string) => void;
  has: (lotId: string) => boolean;
}

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (lotId) =>
        set((s) => ({ ids: s.ids.includes(lotId) ? s.ids.filter((id) => id !== lotId) : [lotId, ...s.ids] })),
      has: (lotId) => get().ids.includes(lotId),
    }),
    { name: "surplusbid.watchlist" },
  ),
);
