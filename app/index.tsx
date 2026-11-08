import { StyledText } from '@/components/elements';
import { loadOnboardingState } from '@/lib';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { SARI_READY_ASSET } from '@/constants/onboardingTour.assets';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function EntryGate() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      let target: '/onboarding' | '/home' = '/onboarding';
      try {
        const state = await loadOnboardingState();
        if (
          process.env.EXPO_PUBLIC_FORCE_ONBOARDING !== 'true' &&
          state?.completed
        ) {
          target = '/home';
        }
      } catch {
        // Unreadable onboarding state: fall back to onboarding.
      }
      if (isMounted) router.replace(target);
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-paper-200 justify-between items-center py-12 px-6">
      {/* Top Branding Header */}
      <MotiView
        from={{ opacity: 0, translateY: reducedMotion ? 0 : -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 100 }}
        className="items-center mt-6"
      >
        <StyledText
          variant="black"
          className="text-persimmon-500 text-display tracking-tight text-center"
        >
          SariSari
        </StyledText>
        <StyledText
          variant="semibold"
          className="text-cinnamon-600 text-base mt-1 text-center"
        >
          Ang Iyong Tindahan Assistant!
        </StyledText>
      </MotiView>

      {/* Center Illustration with Floating Effect */}
      <View className="items-center justify-center my-6">
        <MotiView
          from={{ opacity: 0, scale: reducedMotion ? 1 : 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 800,
            delay: 200,
          }}
          style={{ width: 220, height: 220 }}
        >
          <MotiView
            from={{ translateY: reducedMotion ? 0 : -4 }}
            animate={{ translateY: reducedMotion ? 0 : 4 }}
            transition={{
              type: 'timing',
              duration: 1800,
              loop: !reducedMotion,
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <Image
              source={SARI_READY_ASSET}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              className="w-full h-full"
            />
          </MotiView>
        </MotiView>
      </View>

      <View className="mb-8" />
    </SafeAreaView>
  );
}
