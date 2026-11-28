import { create } from 'zustand';
import { getAppSetting, setAppSetting } from '@/database/settings';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60_000;

// Persists so killing the app does not reset the failed-attempt lockout.
const saveLockout = (failedAttempts: number, lockoutUntil: number | null) =>
  void setAppSetting(
    'owner_pin_lockout',
    JSON.stringify({ failedAttempts, lockoutUntil }),
  ).catch(() => {});

interface AuthState {
  isPinConfigured: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  isAppUnlocked: boolean;
  lastBackgroundedAt: number | null;
  setIsPinConfigured: (status: boolean) => void;
  hydrateLockout: () => Promise<void>;
  registerFailedAttempt: () => void;
  resetFailedAttempts: () => void;
  clearExpiredLockout: () => void;
  isLockedOut: () => boolean;
  getLockoutSecondsRemaining: () => number;
  markUnlocked: () => void;
  markBackgrounded: () => void;
  requireUnlock: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isPinConfigured: false,
  failedAttempts: 0,
  lockoutUntil: null,
  isAppUnlocked: false,
  lastBackgroundedAt: null,
  setIsPinConfigured: (status: boolean) => set({ isPinConfigured: status }),
  hydrateLockout: async () => {
    try {
      const raw = await getAppSetting('owner_pin_lockout');
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        failedAttempts?: number;
        lockoutUntil?: number | null;
      };
      set({
        failedAttempts: Number(saved.failedAttempts) || 0,
        lockoutUntil:
          typeof saved.lockoutUntil === 'number' ? saved.lockoutUntil : null,
      });
    } catch {
      // Unreadable row: keep the in-memory defaults.
    }
  },
  registerFailedAttempt: () => {
    const failedAttempts = get().failedAttempts + 1;
    const lockoutUntil =
      failedAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : get().lockoutUntil;
    set({ failedAttempts, lockoutUntil });
    saveLockout(failedAttempts, lockoutUntil);
  },
  resetFailedAttempts: () => {
    set({ failedAttempts: 0, lockoutUntil: null });
    saveLockout(0, null);
  },
  clearExpiredLockout: () => {
    const lockoutUntil = get().lockoutUntil;
    if (lockoutUntil && Date.now() > lockoutUntil) {
      set({ lockoutUntil: null, failedAttempts: 0 });
      saveLockout(0, null);
    }
  },
  isLockedOut: () => {
    const lockoutUntil = get().lockoutUntil;
    if (!lockoutUntil) return false;
    if (Date.now() > lockoutUntil) {
      set({ lockoutUntil: null });
      return false;
    }
    return true;
  },
  getLockoutSecondsRemaining: () => {
    const lockoutUntil = get().lockoutUntil;
    if (!lockoutUntil) return 0;
    const remainingMs = lockoutUntil - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  },
  markUnlocked: () => set({ isAppUnlocked: true, lastBackgroundedAt: null }),
  markBackgrounded: () => set({ lastBackgroundedAt: Date.now() }),
  requireUnlock: () => set({ isAppUnlocked: false }),
}));
