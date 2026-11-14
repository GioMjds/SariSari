import { ReactNode, useEffect } from 'react';
import { AccessibilityInfo, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariStage } from '@/components/onboarding/SariStage';
import { SuccessCheck } from '@/components/onboarding/SuccessCheck';
import { BEAT_COPY, isSaleBeat, type BeatId } from '@/constants/onboardingDay';
import {
  cartHasExtras,
  outcomeParams,
  type DayState,
} from '@/lib/onboardingDay';

/**
 * BeatScene - one moment of the onboarding day. Sari sets the scene in
 * her bubble, nudges if the cart has extras, and states the outcome
 * once the beat is done. The replica for the beat is passed as
 * children. "Show me" asks the screen to play the beat.
 */

type Props = {
  beat: BeatId;
  state: DayState;
  storeName: string;
  autoplaying: boolean;
  onShowMe: () => void;
  children: ReactNode;
};

export function BeatScene({
  beat,
  state,
  storeName,
  autoplaying,
  onShowMe,
  children,
}: Props) {
  const { t } = useTranslation('onboarding');
  const copy = BEAT_COPY[beat];
  const done = state.beatDone[beat];
  const scene = t(copy.sceneKey, { store: storeName });
  const nudging =
    !done &&
    copy.nudgeKey !== null &&
    isSaleBeat(beat) &&
    cartHasExtras(state.cart, beat);

  const bubble = done
    ? t(copy.outcomeKey, outcomeParams(beat, state))
    : nudging && copy.nudgeKey !== null
      ? t(copy.nudgeKey)
      : scene;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(scene);
  }, [scene]);

  return (
    <View className="gap-4">
      <SariStage
        mascot={done ? copy.donePose : copy.pose}
        poseKey={done ? 'done' : 'start'}
        bubble={bubble}
        size={88}
      />
      <View className="rounded-3xl border border-paper-400 bg-paper-50 p-3">
        {children}
      </View>
      <View className="min-h-[44px] flex-row items-center justify-center">
        {done ? (
          <SuccessCheck label={t('beatDone')} />
        ) : (
          <TouchableOpacity
            onPress={onShowMe}
            disabled={autoplaying}
            accessibilityRole="button"
            accessibilityLabel={t('showMeA11y')}
            accessibilityState={{ disabled: autoplaying }}
            className={`min-h-[44px] justify-center px-4 active:opacity-70 ${
              autoplaying ? 'opacity-50' : ''
            }`}
          >
            <StyledText
              variant="semibold"
              className="text-persimmon-700 text-sm underline"
            >
              {t('showMe')}
            </StyledText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
