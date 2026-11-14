import { SplashWordmark } from '@/components/splash/SplashWordmark';
import { loadOnboardingState } from '@/lib';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

type Target = '/onboarding' | '/home';

export default function EntryGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const targetRef = useRef<Target>('/onboarding');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const state = await loadOnboardingState();
        if (
          process.env.EXPO_PUBLIC_FORCE_ONBOARDING !== 'true' &&
          state?.completed
        ) {
          targetRef.current = '/home';
        }
      } catch {
        // Unreadable onboarding state: fall back to onboarding.
      }
      if (isMounted) setReady(true);
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  // Splash finished its exit: hand off to the first real screen.
  const handleDone = useCallback(() => {
    router.replace(targetRef.current);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-paper-200">
      <SplashWordmark ready={ready} onDone={handleDone} />
    </View>
  );
}
