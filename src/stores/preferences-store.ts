import { create } from "zustand";
import { persist } from "zustand/middleware";

type LotView = "grid" | "list";

/** UI preferences that should survive reloads but don't belong in the URL. */
interface PreferencesState {
  lotView: LotView;
  setLotView: (view: LotView) => void;
  dismissedBanners: string[];
  dismissBanner: (id: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lotView: "grid",
      setLotView: (lotView) => set({ lotView }),
      dismissedBanners: [],
      dismissBanner: (id) => set((s) => ({ dismissedBanners: [...new Set([...s.dismissedBanners, id])] })),
    }),
    { name: "surplusbid.preferences" },
  ),
);
