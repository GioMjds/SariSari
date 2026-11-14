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
import { TabKey, TourStepContent } from '@/constants/onboardingTour';
import { SariState } from '@/constants/onboardingTour.assets';
import type { SariState as MascotState } from '@/components/mascot';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Tour poses mapped to the animated Sari states. */
const TOUR_MASCOT: Record<SariState, MascotState> = {
  default: 'default',
  sales: 'sales',
  inventory: 'inventory',
  lowStock: 'low-stock',
  utang: 'utang',
  balanceCleared: 'balance-cleared',
  reports: 'reports',
};

/**
 * Real bottom-tab titles, so the pill on each step reads exactly like
 * the tab the owner will look for afterwards, in either language.
 */
const TAB_TITLE_KEY: Record<TabKey, string> = {
  home: 'common:homeTitle',
  sales: 'common:salesTitle',
  inventory: 'common:inventoryTitle',
  customers: 'common:customersTitle',
  more: 'common:moreTitle',
};

/**
 * TourCard - one tour step: headline, Sari stage with a speech bubble,
 * a try-it demo widget, then the explanation text. The widget talks to
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
      <StyledText variant="extrabold" className="text-ink-900 text-h1">
        {t(step.headlineKey)}
      </StyledText>

      <SariStage
        mascot={TOUR_MASCOT[pose]}
        poseKey={pose}
        bubble={t(bubble.key, bubble.params ?? {})}
      />

      <View>
        <View className="flex-row items-center justify-between mb-2 min-h-[24px]">
          <StatusPill variant="neutral" size="md">
            {t(TAB_TITLE_KEY[step.tab])}
          </StatusPill>
          {done ? (
            <SuccessCheck label={t('demoDone')} />
          ) : (
            <StyledText variant="medium" className="text-ink-600 text-caption">
              {t('demoTryIt')}
            </StyledText>
          )}
        </View>
        <View className="bg-paper-50 border border-paper-400 rounded-card p-3">
          <Demo setPose={setPose} say={say} complete={complete} />
        </View>
      </View>

      <View>
        <StyledText variant="regular" className="text-ink-900 text-body">
          {t(step.whatItDoesKey)}
        </StyledText>
        <StyledText variant="regular" className="text-ink-600 text-body mt-2">
          <StyledText variant="semibold" className="text-ink-900">
            {t('tourUseItWhen')}:{' '}
          </StyledText>
          {t(step.whenToUseItKey)}
        </StyledText>
      </View>
    </View>
  );
}
