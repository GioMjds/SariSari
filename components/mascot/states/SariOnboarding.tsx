import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthBigGrin,
  SariShadow,
} from '../sariParts';
import { SariArmOpen, SariLidPlaque, SariShop } from '../sariProps';
import { useSariClock, useSariHopStyles } from '../useSariMotion';

/**
 * Onboarding state: Sari leaps to welcome the owner to their shop.
 * Loop (3.2 s): crouch and hop with arms flung wide (0.04-0.42), the
 * lid pops (0.18-0.36), the little store inside bounces on landing
 * (0.26-0.42), two open-armed welcome sweeps (0.5-0.86).
 */
const CYCLE_MS = 3200;
/** Still pose: standing, arms wide open. */
const REST_POSE = 0.6;

const CLAMP = Extrapolation.CLAMP;

const ARM_T = [0.04, 0.12, 0.2, 0.3, 0.5, 0.59, 0.68, 0.77, 0.86];
const ARM_DEG = [0, -22, 12, 0, 0, 10, -4, 10, 0];

interface SariOnboardingProps {
  size: number;
  animate: boolean;
}

export function SariOnboarding({ size, animate }: SariOnboardingProps) {
  const unit = size / 200;
  const { cycle } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { hopStyle, hopShadowStyle } = useSariHopStyles(cycle, unit);

  // Positive rotation lifts the viewer-left arm; the right arm mirrors it.
  const leftArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 55%',
    transform: [{ rotate: `${interpolate(cycle.value, ARM_T, ARM_DEG, CLAMP)}deg` }],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 55%',
    transform: [{ rotate: `${-interpolate(cycle.value, ARM_T, ARM_DEG, CLAMP)}deg` }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      { translateY: interpolate(cycle.value, [0.18, 0.24, 0.3, 0.36], [0, -5 * unit, unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.18, 0.24, 0.3, 0.36], [0, 6, -3, 0], CLAMP)}deg` },
    ],
  }));

  const shopStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 78%',
    transform: [
      { scaleY: interpolate(cycle.value, [0.26, 0.3, 0.36, 0.42], [1, 0.86, 1.1, 1], CLAMP) },
      { scaleX: interpolate(cycle.value, [0.26, 0.3, 0.36, 0.42], [1, 1.06, 0.96, 1], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={hopShadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, hopStyle]}>
        <SariLayer style={leftArmStyle}>
          <SariArmOpen side="left" />
        </SariLayer>
        <SariLayer style={rightArmStyle}>
          <SariArmOpen side="right" />
        </SariLayer>
        <SariLayer>
          <SariLegs />
          <SariJar />
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthBigGrin />
        </SariLayer>
        <SariLayer style={shopStyle}>
          <SariShop />
        </SariLayer>
        <SariLayer style={lidStyle}>
          <SariLid />
          <SariLidPlaque />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
