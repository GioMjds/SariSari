import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmCheer,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthBigGrin,
  SariShadow,
  SariSparkles,
} from '../sariParts';
import { useSariClock } from '../useSariMotion';

/**
 * Balance cleared state: Sari cheers with both fists up.
 * Loop (3.2 s): crouches (0.04-0.12), hops with the lid popping
 * (0.12-0.36), lands and settles (0.28-0.42), pumps both fists in
 * turn (0.5-0.84). Sparkles burst on the hop and fade near the end.
 */
const CYCLE_MS = 3200;
/** Still pose: standing, fists up, sparkles showing. */
const REST_POSE = 0.6;

const CLAMP = Extrapolation.CLAMP;

/** Hop keyframes, shared by body and shadow. */
const HOP_T = [0.04, 0.12, 0.2, 0.28, 0.34, 0.42];

interface SariBalanceClearedProps {
  size: number;
  animate: boolean;
}

export function SariBalanceCleared({ size, animate }: SariBalanceClearedProps) {
  const unit = size / 200;
  const { cycle } = useSariClock(animate, CYCLE_MS, REST_POSE);

  const bodyStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92.5%',
    transform: [
      { translateY: interpolate(cycle.value, HOP_T, [0, 2 * unit, -16 * unit, 0, unit, 0], CLAMP) },
      { scaleX: interpolate(cycle.value, HOP_T, [1, 1.06, 0.96, 1.07, 0.99, 1], CLAMP) },
      { scaleY: interpolate(cycle.value, HOP_T, [1, 0.9, 1.06, 0.9, 1.03, 1], CLAMP) },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92.5%',
    opacity: interpolate(cycle.value, HOP_T, [1, 1, 0.6, 1, 1, 1], CLAMP),
    transform: [{ scaleX: interpolate(cycle.value, HOP_T, [1, 1.06, 0.7, 1.08, 1, 1], CLAMP) }],
  }));

  // Arms dip on the crouch, fling up on the hop, then pump in turn.
  const leftArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 55%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.04, 0.12, 0.2, 0.3, 0.5, 0.56, 0.62, 0.68, 0.74],
          [0, -25, 10, 0, 0, 12, -4, 12, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 55%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.04, 0.12, 0.2, 0.3, 0.56, 0.62, 0.68, 0.74, 0.8],
          [0, 25, -10, 0, 0, -12, 4, -12, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      {
        translateY: interpolate(cycle.value, [0.18, 0.24, 0.3, 0.36], [0, -5 * unit, unit, 0], CLAMP),
      },
      {
        rotate: `${interpolate(cycle.value, [0.18, 0.24, 0.3, 0.36], [0, -6, 3, 0], CLAMP)}deg`,
      },
    ],
  }));

  const sparklesAStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 50%',
    opacity: interpolate(cycle.value, [0.2, 0.24, 0.7, 0.8], [0, 1, 1, 0], CLAMP),
    transform: [
      { scale: interpolate(cycle.value, [0.2, 0.28, 0.34, 0.7, 0.8], [0.6, 1.08, 1, 1, 0.9], CLAMP) },
    ],
  }));

  const sparklesBStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 50%',
    opacity: interpolate(cycle.value, [0.28, 0.32, 0.78, 0.88], [0, 1, 1, 0], CLAMP),
    transform: [
      { scale: interpolate(cycle.value, [0.28, 0.36, 0.42, 0.78, 0.88], [0.6, 1.08, 1, 1, 0.9], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <SariLayer style={sparklesAStyle}>
        <SariSparkles set="a" />
      </SariLayer>
      <SariLayer style={sparklesBStyle}>
        <SariSparkles set="b" />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, bodyStyle]}>
        <SariLayer style={leftArmStyle}>
          <SariArmCheer side="left" />
        </SariLayer>
        <SariLayer style={rightArmStyle}>
          <SariArmCheer side="right" />
        </SariLayer>
        <SariLayer>
          <SariLegs />
          <SariJar tone="cleared" />
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthBigGrin />
        </SariLayer>
        <SariLayer style={lidStyle}>
          <SariLid />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
