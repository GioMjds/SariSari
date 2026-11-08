import { useState } from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SARI_FALLBACK_ASSET } from '@/constants/onboardingTour.assets';

/**
 * SariStage - Sari on a warm paper gradient with an optional speech
 * bubble. Changing `poseKey` replays a small spring so pose swaps feel
 * alive. A failed image load falls back to the default Sari.
 */

type Props = {
  source: ImageSourcePropType;
  bubble?: string | undefined;
  poseKey?: string | undefined;
  size?: number;
};

export function SariStage({ source, bubble, poseKey, size = 140 }: Props) {
  const reducedMotion = useReducedMotion();
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | null>(
    null,
  );
  const shown = failedSource === source ? SARI_FALLBACK_ASSET : source;

  return (
    <View className="w-full rounded-3xl overflow-hidden">
      <LinearGradient
        colors={['#F7F6F2', '#FFE0D1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
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
          <Image
            source={shown}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            onError={() => setFailedSource(source)}
            className="w-full h-full"
          />
        </MotiView>

        {bubble ? (
          <View
            accessibilityLiveRegion="polite"
            className="flex-1 ml-3 bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3"
          >
            <StyledText variant="medium" className="text-ink-700 text-sm">
              {bubble}
            </StyledText>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
