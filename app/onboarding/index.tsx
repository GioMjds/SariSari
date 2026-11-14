import { StyledText } from '@/components/elements';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
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
import {
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>({ kind: 'profile' });
  const [profile, setProfile] = useState<OnboardingProfile>({
    ownerName: '',
    storeName: '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  // Counts failed "continue" presses on the profile step. Above zero,
  // ProfileStep shows inline errors; each bump refocuses the empty field.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // True while the owner is fixing their names from the Ready screen,
  // so continuing returns there instead of replaying the tour.
  const [editingFromReady, setEditingFromReady] = useState(false);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { t } = useTranslation('onboarding');

  const currentIndex = indexOf(step);
  const previousIndex = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const isProfile = step.kind === 'profile';
  const isReady = step.kind === 'ready';
  const isLastTour =
    step.kind === 'tour' && step.tab === TOUR_ORDER[TOUR_ORDER.length - 1];

  const isProfileComplete =
    profile.ownerName.trim().length > 0 && profile.storeName.trim().length > 0;

  const handleBack = () => {
    if (saving) return;
    setStep(back(step));
  };

  // Android hardware back walks the flow instead of leaving it, so typed
  // names are never dropped by a stray back press.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (saving) return true;
        if (step.kind === 'profile') {
          if (!editingFromReady) return false;
          setEditingFromReady(false);
          setStep(skipToReady());
          return true;
        }
        setStep(back(step));
        return true;
      },
    );
    return () => subscription.remove();
  }, [step, saving, editingFromReady]);

  const handleOpenStore = async (href?: string) => {
    if (saving) return;
    const ownerName = profile.ownerName.trim();
    const storeName = profile.storeName.trim();
    if (!ownerName || !storeName) {
      addToast({
        message: t('toastMissingFields'),
        variant: 'danger',
        duration: 3500,
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
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (isProfile && !isProfileComplete) {
      setSubmitAttempt((n) => n + 1);
      return;
    }
    if (isProfile && editingFromReady) {
      setEditingFromReady(false);
      setStep(skipToReady());
      return;
    }
    setStep(next(step));
  };
  const handleSkip = () => {
    if (!isProfileComplete) return;
    setStep(skipToReady());
  };
  const handleEditProfile = () => {
    if (saving) return;
    setEditingFromReady(true);
    setStep({ kind: 'profile' });
  };

  const tourStep =
    step.kind === 'tour'
      ? ONBOARDING_TOUR_STEPS.find((s) => s.tab === step.tab)
      : undefined;

  const showSkip = !isProfile && !isReady && !isLastTour && isProfileComplete;

  const primaryLabel = isReady
    ? t('readyCta')
    : isProfile
      ? t('letsGo')
      : isLastTour
        ? t('finishTour')
        : t('next');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor={ONBOARDING_COLORS.page} />

      <View className="px-6 pt-4">
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
      </View>

      <View className="flex-1">
        <StepTransition stepKey={currentIndex} direction={direction}>
          <KeyboardAwareScrollView
            bottomOffset={24}
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
              <ProfileStep
                profile={profile}
                onChange={setProfile}
                submitAttempt={submitAttempt}
                onSubmit={handleNext}
              />
            )}
            {!!tourStep && <TourCard step={tourStep} />}
            {isReady && (
              <ReadyStep
                profile={profile}
                saving={saving}
                onOpenStore={handleOpenStore}
                onEditProfile={handleEditProfile}
              />
            )}
          </KeyboardAwareScrollView>
        </StepTransition>
      </View>

      <View className="px-6 pb-4 pt-2">
        <View className="flex-row gap-3 items-center">
          {isProfile ? null : (
            <TouchableOpacity
              onPress={handleBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('backA11y')}
              accessibilityState={{ disabled: saving }}
              className={`h-[52px] w-[52px] items-center justify-center rounded-md border border-paper-400 bg-paper-50 press-scale active:bg-paper-100 ${
                saving ? 'opacity-50' : ''
              }`}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={ONBOARDING_COLORS.action}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={isReady ? () => handleOpenStore() : handleNext}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            accessibilityState={{ disabled: saving, busy: saving }}
            className="flex-1 min-h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-persimmon-600 px-4 press-scale active:bg-persimmon-700"
          >
            {saving ? (
              <ActivityIndicator color={ONBOARDING_COLORS.onAction} />
            ) : (
              <>
                <StyledText variant="extrabold" className="text-white text-base">
                  {primaryLabel}
                </StyledText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={ONBOARDING_COLORS.onAction}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {showSkip ? (
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={t('skipA11y')}
            className="mt-1 min-h-[44px] items-center justify-center active:opacity-70"
          >
            <StyledText variant="semibold" className="text-persimmon-700 text-sm">
              {t('skipTour')}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
