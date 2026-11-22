import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ViewMode = 'grid' | 'list';
export type ViewModeScreen = 'pos' | 'inventory';

interface ViewModeState {
  modes: Record<ViewModeScreen, ViewMode>;
  setMode: (screen: ViewModeScreen, mode: ViewMode) => void;
}

// Remembers grid or list per screen across restarts; POS favors photos, Inventory favors data.
export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      modes: { pos: 'grid', inventory: 'list' },
      setMode: (screen, mode) =>
        set((state) => ({ modes: { ...state.modes, [screen]: mode } })),
    }),
    {
      name: 'view_modes_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ modes: state.modes }),
    },
  ),
);
