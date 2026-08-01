import { create } from 'zustand';

interface InventoryModalSignalState {
  adjustRequested: boolean;
  receiveRequested: boolean;
  requestAdjust: () => void;
  requestReceive: () => void;
  clearAdjust: () => void;
  clearReceive: () => void;
}

export const useInventoryModalSignal = create<InventoryModalSignalState>(
  (set) => ({
    adjustRequested: false,
    receiveRequested: false,
    requestAdjust: () => set({ adjustRequested: true }),
    requestReceive: () => set({ receiveRequested: true }),
    clearAdjust: () => set({ adjustRequested: false }),
    clearReceive: () => set({ receiveRequested: false }),
  }),
);
