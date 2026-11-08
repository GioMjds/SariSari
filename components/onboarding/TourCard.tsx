import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { SariStage } from '@/components/onboarding/SariStage';
import { SuccessCheck } from '@/components/onboarding/SuccessCheck';
import {
  BubbleParams,
  DEMO_BY_TAB,
} from '@/components/onboarding/demos';
import { TourStepContent } from '@/constants/onboardingTour';
import {
  SARI_STATE_ASSETS,
  SariState,
} from '@/constants/onboardingTour.assets';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * TourCard - one tour step: Sari stage with a speech bubble, a
 * try-it demo widget, then the explanation text. The widget talks to
 * Sari through setPose / say and reports completion through complete.
 * Completing is never required to continue. The parent remounts this
 * component per step, which resets all local state.
 */

type Bubble = { key: string; params?: BubbleParams | undefined };

type Props = {
  step: TourStepContent;
};

export function TourCard({ step }: Props) {
  const { t } = useTranslation('onboarding');
  const reducedMotion = useReducedMotion();
  const [pose, setPose] = useState<SariState>(step.pose);
  const [bubble, setBubble] = useState<Bubble>({ key: step.bubbleKey });
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  const Demo = DEMO_BY_TAB[step.tab];

  const say = useCallback((key: string, params?: BubbleParams) => {
    setBubble({ key, params });
  }, []);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    AccessibilityInfo.announceForAccessibility(t('demoDoneA11y'));
    if (!reducedMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [reducedMotion, t]);

  return (
    <View className="gap-4">
      <SariStage
        source={SARI_STATE_ASSETS[pose]}
        poseKey={pose}
        bubble={t(bubble.key, bubble.params)}
      />

      <View>
        <View className="flex-row items-center justify-between mb-2 min-h-[24px]">
          <StatusPill variant="neutral" size="md">
            {t(step.labelKey)}
          </StatusPill>
          {done ? (
            <SuccessCheck label={t('demoDone')} />
          ) : (
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              {t('demoTryIt')}
            </StyledText>
          )}
        </View>
        <View className="bg-paper-50 border border-paper-300 rounded-3xl p-3">
          <Demo setPose={setPose} say={say} complete={complete} />
        </View>
      </View>

      <View>
        <StyledText variant="extrabold" className="text-ink-900 text-h1">
          {t(step.headlineKey)}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-600 text-body mt-2 leading-5"
        >
          {t(step.whatItDoesKey)}
        </StyledText>
        <View className="mt-3 self-start flex-row flex-wrap items-center gap-2 rounded-2xl bg-paper-100 border border-paper-300 px-3 py-2">
          <StyledText variant="extrabold" className="label-caps text-persimmon-600">
            {t('tourUseItWhen')}
          </StyledText>
          <StyledText variant="medium" className="text-ink-600 text-caption flex-shrink">
            {t(step.whenToUseItKey)}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
