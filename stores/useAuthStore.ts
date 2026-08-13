import { create } from 'zustand';

interface AuthState {
  isPinConfigured: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  setIsPinConfigured: (status: boolean) => void;
  registerFailedAttempt: () => void;
  resetFailedAttempts: () => void;
  isLockedOut: () => boolean;
  getLockoutSecondsRemaining: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isPinConfigured: false,
  failedAttempts: 0,
  lockoutUntil: null,
  setIsPinConfigured: (status: boolean) => set({ isPinConfigured: status }),
  registerFailedAttempt: () => {
    const nextAttempts = get().failedAttempts + 1;
    if (nextAttempts >= 3) {
      set({
        failedAttempts: nextAttempts,
        lockoutUntil: Date.now() + 60_000,
      });
    } else {
      set({ failedAttempts: nextAttempts });
    }
  },
  resetFailedAttempts: () => set({ failedAttempts: 0, lockoutUntil: null }),
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
}));
