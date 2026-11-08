import { StyledText } from '@/components/elements';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { ReadyStep } from '@/components/onboarding/ReadyStep';
import { StepTransition } from '@/components/onboarding/StepTransition';
import { TourCard } from '@/components/onboarding/TourCard';
import { ONBOARDING_TOUR_STEPS, TOUR_ORDER } from '@/constants/onboardingTour';
import { markOnboardingComplete } from '@/lib';
import {
  Step,
  TOTAL_STEPS,
  back,
  indexOf,
  next,
  skipToReady,
} from '@/lib/onboardingStepMachine';
import { useToastStore } from '@/stores';
import { OnboardingProfile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>({ kind: 'profile' });
  const [profile, setProfile] = useState<OnboardingProfile>({
    ownerName: '',
    storeName: '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { t } = useTranslation('onboarding');

  const currentIndex = indexOf(step);
  const previousIndex = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const handleBack = () => setStep(back(step));

  const handleOpenStore = async (href?: string) => {
    const ownerName = profile.ownerName.trim();
    const storeName = profile.storeName.trim();
    if (!ownerName || !storeName) {
      addToast({
        message: t('toastMissingFields'),
        variant: 'danger',
        duration: 1800,
      });
      return;
    }

    try {
      setSaving(true);
      await markOnboardingComplete({ ownerName, storeName });
      addToast({
        message: t('toastWelcome'),
        variant: 'success',
        duration: 1800,
      });
      router.replace('/(tabs)' as Href);
      if (href) router.push(href as Href);
    } catch {
      addToast({
        message: t('toastSaveFailed'),
        variant: 'danger',
        duration: 2000,
      });
    } finally {
      setSaving(false);
    }
  };

  const isProfile = step.kind === 'profile';
  const isReady = step.kind === 'ready';
  const isFirstTour = step.kind === 'tour' && step.tab === TOUR_ORDER[0];
  const isLastTour =
    step.kind === 'tour' && step.tab === TOUR_ORDER[TOUR_ORDER.length - 1];

  const isProfileComplete =
    profile.ownerName.trim().length > 0 && profile.storeName.trim().length > 0;

  const handleNext = () => {
    if (isProfile && !isProfileComplete) return;
    setStep(next(step));
  };
  const handleSkip = () => {
    if (!isProfileComplete) return;
    setStep(skipToReady());
  };

  const tourStep =
    step.kind === 'tour'
      ? ONBOARDING_TOUR_STEPS.find((s) => s.tab === step.tab)
      : undefined;

  const showSkip = !isProfile && !isReady && !isLastTour && isProfileComplete;

  const continueLabel = isProfile
    ? t('letsGo')
    : isLastTour
      ? t('finishTour')
      : t('next');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor="#F7F6F2" />

      <View className="px-6 pt-4 flex-row items-center gap-4">
        <OnboardingProgress
          currentIndex={currentIndex}
          totalSteps={TOTAL_STEPS}
          label={t('progressA11y', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
          counterText={t('progressCount', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
        />
        {showSkip ? (
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('skipA11y')}
            className="active:opacity-70"
          >
            <StyledText variant="medium" className="text-persimmon-600 text-sm">
              {t('skipTour')}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex-1">
        <StepTransition stepKey={currentIndex} direction={direction}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isProfile && (
              <ProfileStep profile={profile} onChange={setProfile} />
            )}
            {!!tourStep && <TourCard step={tourStep} />}
            {isReady && (
              <ReadyStep
                profile={profile}
                saving={saving}
                onOpenStore={handleOpenStore}
              />
            )}
          </ScrollView>
        </StepTransition>
      </View>

      {!isReady && (
        <View className="px-6 pb-6 pt-2 flex-row gap-3 items-center">
          {isProfile || isFirstTour ? null : (
            <TouchableOpacity
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('backA11y')}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-paper-300 bg-paper-50 press-scale active:opacity-70"
            >
              <Ionicons name="chevron-back" size={22} color="#C8460F" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={isProfile && !isProfileComplete}
            accessibilityRole="button"
            accessibilityLabel={t('continueA11y')}
            accessibilityState={{
              disabled: isProfile && !isProfileComplete,
            }}
            className={`flex-1 bg-persimmon-500 rounded-2xl py-3.5 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
              isProfile && !isProfileComplete ? 'opacity-50' : ''
            }`}
          >
            <StyledText variant="semibold" className="text-white">
              {continueLabel}
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
