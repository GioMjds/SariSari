import { router } from 'expo-router';

/**
 * Safe navigation utility to prevent "Couldn't find a navigation context" errors
 * when navigating from global overlays, toasts, modals, or async background events.
 */
export const safeNavigate = {
  push: (href: any) => {
    try {
      router.push(href);
    } catch (error) {
      console.warn('Navigation context not available yet for push:', href, error);
    }
  },
  replace: (href: any) => {
    try {
      router.replace(href);
    } catch (error) {
      console.warn('Navigation context not available yet for replace:', href, error);
    }
  },
  back: () => {
    try {
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.warn('Navigation context not available for back:', error);
    }
  },
};
