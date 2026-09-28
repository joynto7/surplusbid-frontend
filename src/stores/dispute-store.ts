import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Dispute } from "@/types/api";

/**
 * Disputes filed from this browser. The backend exposes create/resolve but no
 * "list my disputes" endpoint, so the create responses are kept locally.
 */
interface DisputeState {
  filed: Dispute[];
  add: (d: Dispute) => void;
}

export const useFiledDisputes = create<DisputeState>()(
  persist((set) => ({ filed: [], add: (d) => set((s) => ({ filed: [d, ...s.filed].slice(0, 20) })) }), {
    name: "surplusbid.disputes",
  }),
);
