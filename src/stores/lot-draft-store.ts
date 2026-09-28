import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LotDetailsValues, LotPricingValues } from "@/lib/validation";

/**
 * Multi-step lot wizard state. Text fields persist in sessionStorage so a
 * refresh or a detour doesn't lose the seller's work. Photos are File
 * objects and can't be serialized, so they stay in memory only.
 */
interface LotDraftState {
  step: number;
  details: Partial<LotDetailsValues>;
  pricing: Partial<LotPricingValues>;
  images: File[];
  setStep: (step: number) => void;
  saveDetails: (details: LotDetailsValues) => void;
  savePricing: (pricing: LotPricingValues) => void;
  setImages: (images: File[]) => void;
  prefill: (details: Partial<LotDetailsValues>, pricing: Partial<LotPricingValues>) => void;
  reset: () => void;
}

const initial = { step: 0, details: {}, pricing: {}, images: [] as File[] };

export const useLotDraft = create<LotDraftState>()(
  persist(
    (set) => ({
      ...initial,
      setStep: (step) => set({ step }),
      saveDetails: (details) => set({ details }),
      savePricing: (pricing) => set({ pricing }),
      setImages: (images) => set({ images }),
      prefill: (details, pricing) => set({ ...initial, details, pricing }),
      reset: () => set(initial),
    }),
    {
      name: "surplusbid.lot-draft",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ step, details, pricing }) => ({ step, details, pricing }),
    },
  ),
);
