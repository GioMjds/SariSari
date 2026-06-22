import { Toast, ToastVariant } from '@/types/ui/Toast.types';
import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

const timerFor = new WeakMap<Toast, ReturnType<typeof setTimeout>>();

const hapticFor = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    case 'error':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case 'warning':
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      );
    default:
      return Promise.resolve();
  }
};

interface State {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<State>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const variant = toast.variant || 'default';
    const duration = toast.duration ?? 4000;
    const newToast: Toast = { id, variant, duration, ...toast };

    set((s) => ({ toasts: [...s.toasts, newToast] }));
    hapticFor(variant);

    if (duration > 0) {
      const t = setTimeout(() => get().removeToast(id), duration);
      timerFor.set(newToast, t);
    }

    return id;
  },

  removeToast: (id) => {
    set((s) => {
      const t = s.toasts.find((x) => x.id === id);
      if (t) {
        const pending = timerFor.get(t);
        if (pending) {
          clearTimeout(pending);
          timerFor.delete(t);
        }
      }
      return { toasts: s.toasts.filter((x) => x.id !== id) };
    });
  },

  clearToasts: () => {
    for (const t of get().toasts) {
      const pending = timerFor.get(t);
      if (pending) {
        clearTimeout(pending);
        timerFor.delete(t);
      }
    }
    set({ toasts: [] });
  },
}));
