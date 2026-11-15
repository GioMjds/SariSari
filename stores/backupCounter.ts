import { create } from 'zustand';

interface State {
  count: number;
  bump: () => void;
  reset: () => void;
}

export const useBackupCounter = create<State>((set) => ({
  count: 0,
  bump: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));
