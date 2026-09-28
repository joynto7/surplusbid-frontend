import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lots this browser has authorized a deposit hold for. The backend has no
 * "list my holds" endpoint, so this is combined with "has the buyer bid on
 * this lot" (which implies a hold) to decide whether to ask for a deposit.
 */
interface DepositState {
  lotIds: string[];
  markAuthorized: (lotId: string) => void;
}

export const useDeposits = create<DepositState>()(
  persist(
    (set) => ({
      lotIds: [],
      markAuthorized: (lotId) => set((s) => ({ lotIds: s.lotIds.includes(lotId) ? s.lotIds : [...s.lotIds, lotId] })),
    }),
    { name: "surplusbid.deposits" },
  ),
);
