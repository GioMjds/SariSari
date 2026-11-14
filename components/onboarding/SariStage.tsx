import { useState } from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { SariMascot, type SariState as MascotState } from '@/components/mascot';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SARI_FALLBACK_ASSET } from '@/constants/onboardingTour.assets';

/**
 * SariStage - Sari on a flat paper panel with an optional speech
 * bubble. Changing `poseKey` replays a small spring so pose swaps feel
 * alive. Pass `mascot` for the animated vector Sari, or `source` for a
 * still image; a failed image load falls back to the default Sari.
 */

type Props = {
  source?: ImageSourcePropType | undefined;
  mascot?: MascotState | undefined;
  bubble?: string | undefined;
  poseKey?: string | undefined;
  size?: number;
};

export function SariStage({ source, mascot, bubble, poseKey, size = 120 }: Props) {
  const reducedMotion = useReducedMotion();
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | null>(
    null,
  );
  const shown =
    source == null || failedSource === source ? SARI_FALLBACK_ASSET : source;

  return (
    <View className="w-full flex-row items-center rounded-card bg-paper-100 px-4 py-3">
      <MotiView
        key={poseKey ?? 'static'}
        from={{
          scale: reducedMotion ? 1 : 0.9,
          translateY: reducedMotion ? 0 : 6,
        }}
        animate={{ scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        style={{ width: size, height: size }}
      >
        {mascot ? (
          <SariMascot state={mascot} size={size} />
        ) : (
          <Image
            source={shown}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            onError={() => setFailedSource(source ?? null)}
            className="w-full h-full"
          />
        )}
      </MotiView>

      {bubble ? (
        <View
          accessibilityLiveRegion="polite"
          className="flex-1 ml-3 bg-paper-50 border border-paper-400 rounded-lg px-4 py-3"
        >
          <StyledText variant="medium" className="text-ink-900 text-sm">
            {bubble}
          </StyledText>
        </View>
      ) : null}
    </View>
  );
}
