import { useCallback, useEffect, useState } from 'react';
import { loadOnboardingState } from '@/lib/onboardingStorage';
import type { OnboardingProfile } from '@/types/onboarding.types';

type ProfileState = {
  profile: OnboardingProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

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
