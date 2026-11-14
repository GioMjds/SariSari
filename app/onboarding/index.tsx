import { StyledText } from '@/components/elements';
import { BeatScene } from '@/components/onboarding/BeatScene';
import { DayClock } from '@/components/onboarding/DayClock';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { ReadyStep } from '@/components/onboarding/ReadyStep';
import { HomeCloseReplica } from '@/components/onboarding/replicas/HomeCloseReplica';
import { InventoryReplica } from '@/components/onboarding/replicas/InventoryReplica';
import { PosReplica } from '@/components/onboarding/replicas/PosReplica';
import { StepTransition } from '@/components/onboarding/StepTransition';
import { BEAT_COPY, BEAT_ORDER, type BeatId } from '@/constants/onboardingDay';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { markOnboardingComplete } from '@/lib';
import {
  createDaySeed,
  dayReducer,
  outcomeParams,
  scriptFor,
} from '@/lib/onboardingDay';
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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Delay between Show me taps when motion is allowed. */
const AUTOPLAY_STEP_MS = 400;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>({ kind: 'profile' });
  const [profile, setProfile] = useState<OnboardingProfile>({
    ownerName: '',
    storeName: '',
  });
  const [day, dispatch] = useReducer(dayReducer, undefined, createDaySeed);
  const [saving, setSaving] = useState<boolean>(false);
  // Counts failed "continue" presses on the profile step. Above zero,
  // ProfileStep shows inline errors; each bump refocuses the empty field.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // True while the owner is fixing their names from the Ready screen,
  // so continuing returns there instead of replaying the day.
  const [editingFromReady, setEditingFromReady] = useState(false);
  const [autoplayingBeat, setAutoplayingBeat] = useState<BeatId | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation('onboarding');

  const currentIndex = indexOf(step);
  const previousIndex = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const beat = step.kind === 'beat' ? step.beat : null;
  const isProfile = step.kind === 'profile';
  const isReady = step.kind === 'ready';
  const isLastBeat = beat === BEAT_ORDER[BEAT_ORDER.length - 1];
  const beatLocked = beat !== null && !day.beatDone[beat];

  const isProfileComplete =
    profile.ownerName.trim().length > 0 && profile.storeName.trim().length > 0;

  const cancelAutoplay = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAutoplayingBeat(null);
  }, []);

  // Leaving a step, or unmounting, drops any queued Show me taps.
  useEffect(() => cancelAutoplay, [currentIndex, cancelAutoplay]);

  // Fire the outcome toast once, when a beat flips to done.
  const doneBefore = useRef(day.beatDone);
  useEffect(() => {
    for (const id of BEAT_ORDER) {
      if (day.beatDone[id] && !doneBefore.current[id]) {
        const message = t(BEAT_COPY[id].outcomeKey, outcomeParams(id, day));
        addToast({ message, variant: 'success', duration: 2200 });
        AccessibilityInfo.announceForAccessibility(message);
      }
    }
    doneBefore.current = day.beatDone;
  }, [day, addToast, t]);

  const handleShowMe = (target: BeatId) => {
    if (day.beatDone[target] || autoplayingBeat !== null) return;
    if (reducedMotion) {
      dispatch({ type: 'autoplay', beat: target });
      return;
    }
    setAutoplayingBeat(target);
    const script = scriptFor(target);
    script.forEach((action, i) => {
      timers.current.push(
        setTimeout(() => dispatch(action), AUTOPLAY_STEP_MS * (i + 1)),
      );
    });
    // Safety net: a stray tap mid-playback cannot leave the beat stuck.
    timers.current.push(
      setTimeout(
        () => {
          dispatch({ type: 'autoplay', beat: target });
          timers.current = [];
          setAutoplayingBeat(null);
        },
        AUTOPLAY_STEP_MS * (script.length + 1),
      ),
    );
  };

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

  const handleOpenStore = async () => {
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
    if (beatLocked) return;
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

  const showSkip = beat !== null && isProfileComplete;

  const primaryLabel = isReady
    ? t('readyCta')
    : isProfile
      ? t('letsGo')
      : isLastBeat
        ? t('finishDay')
        : t('next');
  const primaryDisabled = saving || beatLocked;

  const timeLabel =
    beat !== null
      ? t(BEAT_COPY[beat].clockKey)
      : isReady
        ? t('clockClosed')
        : t('clockBeforeOpen');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor={ONBOARDING_COLORS.page} />

      <View className="px-6 pt-4">
        <DayClock
          currentIndex={currentIndex}
          totalSteps={TOTAL_STEPS}
          timeLabel={timeLabel}
          counterText={t('progressCount', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
          label={t('clockA11y', {
            time: timeLabel,
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
            {beat !== null && (
              <BeatScene
                beat={beat}
                state={day}
                storeName={profile.storeName.trim()}
                autoplaying={autoplayingBeat === beat}
                onShowMe={() => handleShowMe(beat)}
              >
                {beat === 'cash' || beat === 'utang' ? (
                  <PosReplica mode={beat} state={day} dispatch={dispatch} />
                ) : beat === 'restock' ? (
                  <InventoryReplica state={day} dispatch={dispatch} />
                ) : (
                  <HomeCloseReplica state={day} dispatch={dispatch} />
                )}
              </BeatScene>
            )}
            {isReady && (
              <ReadyStep
                profile={profile}
                saving={saving}
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
            disabled={primaryDisabled}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            accessibilityHint={beatLocked ? t('continueLockedHint') : undefined}
            accessibilityState={{ disabled: primaryDisabled, busy: saving }}
            className={`flex-1 min-h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-persimmon-600 px-4 press-scale active:bg-persimmon-700 ${
              beatLocked ? 'opacity-50' : ''
            }`}
          >
            {saving ? (
              <ActivityIndicator color={ONBOARDING_COLORS.onAction} />
            ) : (
              <>
                <StyledText
                  variant="extrabold"
                  className="text-white text-base"
                >
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
            <StyledText
              variant="semibold"
              className="text-persimmon-700 text-sm"
            >
              {t('skipTour')}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
