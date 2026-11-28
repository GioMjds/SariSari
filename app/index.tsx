import { withProf } from '@/utils/perf';
import { SplashWordmark } from '@/components/splash/SplashWordmark';
import { loadOnboardingState } from '@/lib';
import { whenDatabaseReady } from '@/configs/startup';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

type Target = '/onboarding' | '/home';

const FORCE_ONBOARDING = process.env.EXPO_PUBLIC_FORCE_ONBOARDING === 'true';

async function resolveEntryTarget(): Promise<Target> {
  const [state] = await Promise.all([
    loadOnboardingState(),
    whenDatabaseReady(),
  ]);
  return !FORCE_ONBOARDING && state?.completed ? '/home' : '/onboarding';
}

function EntryGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const targetRef = useRef<Target>('/onboarding');

  useEffect(() => {
    let cancelled = false;

    resolveEntryTarget()
      .then((target) => {
        if (cancelled) return;
        targetRef.current = target;
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (__DEV__) console.warn('Failed to resolve entry target', error);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDone = useCallback(() => {
    router.replace(targetRef.current);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-paper-200">
      <SplashWordmark ready={ready} onDone={handleDone} />
    </View>
  );
}

export default withProf(EntryGate, 'index');
