// stores/backupCounter.ts
// Integer counter that tracks how many sales have happened since the
// last successful local snapshot. When it crosses the 20-sale threshold
// the scheduler triggers a snapshot and calls `reset()`.
//
// This store is UI-side Zustand state, NOT business data. It is the one
// allowed cross-layer call from `database/sales.ts` per spec §2: the
// `insertSale` COMMIT handler bumps this counter fire-and-forget so a
// failed bump can never affect the sale. The bump is fire-and-forget
// because backup is best-effort — the user's sale is the source of truth.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md` §3.6
// for the 20-sale / 24h trigger rules.

import { create } from 'zustand';

interface State {
  /** Sales recorded since the last snapshot. */
  count: number;
  /** Called from `database/sales.ts` after each successful sale COMMIT. */
  bump: () => void;
  /** Called by the scheduler after a snapshot completes successfully. */
  reset: () => void;
}

export const useBackupCounter = create<State>((set) => ({
  count: 0,
  bump: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}));
