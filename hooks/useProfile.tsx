// useProfile — surfaces the onboarding profile (store name + owner name)
// stored in AsyncStorage. The Settings screen renders these as read-only
// labels — there is no edit flow today, and inventing one would expand
// the surface area past what the app actually does.
import { useCallback, useEffect, useState } from 'react';
import { loadOnboardingState } from '@/lib/onboardingStorage';
import type { OnboardingProfile } from '@/types/onboarding.types';

type ProfileState = {
  profile: OnboardingProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Read the cached onboarding profile (owner name + store name) from
 * AsyncStorage. The hook re-reads on focus so the Settings screen
 * reflects changes made during the same session (e.g. if a future
 * edit-profile flow is added).
 */
export const useProfile = (): ProfileState => {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const state = await loadOnboardingState();
      setProfile(state?.profile ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadOnboardingState().then((state) => {
      if (!active) return;
      setProfile(state?.profile ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { profile, loading, refresh };
};
