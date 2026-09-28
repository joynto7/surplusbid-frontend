import { create } from "zustand";
import { persist } from "zustand/middleware";

type LotView = "grid" | "list";

/** Defaults the lot wizard starts from; edited on the seller profile page. */
export interface SellerDefaults {
  durationDays: number;
  bidIncrement: number;
  condition: string;
  startDelayHours: number;
}

export const DEFAULT_SELLER_DEFAULTS: SellerDefaults = {
  durationDays: 7,
  bidIncrement: 50,
  condition: "Used - good",
  startDelayHours: 1,
};

/** UI preferences that should survive reloads but don't belong in the URL. */
interface PreferencesState {
  lotView: LotView;
  setLotView: (view: LotView) => void;
  dismissedBanners: string[];
  dismissBanner: (id: string) => void;
  sellerDefaults: SellerDefaults;
  setSellerDefaults: (d: SellerDefaults) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      lotView: "grid",
      setLotView: (lotView) => set({ lotView }),
      dismissedBanners: [],
      dismissBanner: (id) => set((s) => ({ dismissedBanners: [...new Set([...s.dismissedBanners, id])] })),
      sellerDefaults: DEFAULT_SELLER_DEFAULTS,
      setSellerDefaults: (sellerDefaults) => set({ sellerDefaults }),
    }),
    { name: "surplusbid.preferences" },
  ),
);
