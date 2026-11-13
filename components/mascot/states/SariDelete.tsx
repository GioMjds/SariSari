import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import { SariEyesOpen, SariJar, SariLegs, SariLid, SariShadow } from '../sariParts';
import {
  SariArmFistChest,
  SariArmShield,
  SariBrowsStern,
  SariMouthFlat,
  SariWarning,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Delete state: Sari stands guard before something is removed.
 * Loop (4.4 s): glances left then right, wary (0.05-0.52), braces the
 * shield forward while the warning pulses twice (0.55-0.86), blinks
 * (0.9-0.94).
 */
const CYCLE_MS = 4400;
/** Still pose: shield braced, warning showing, eyes on the viewer. */
const REST_POSE = 0.7;

const CLAMP = Extrapolation.CLAMP;

interface SariDeleteProps {
  size: number;
  animate: boolean;
}

export function SariDelete({ size, animate }: SariDeleteProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const eyesStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 49%',
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0.05, 0.1, 0.24, 0.31, 0.45, 0.52],
          [0, -3.5 * unit, -3.5 * unit, 3.5 * unit, 3.5 * unit, 0],
          CLAMP,
        ),
      },
      { scaleY: interpolate(cycle.value, [0.9, 0.92, 0.94], [1, 0.1, 1], CLAMP) },
    ],
  }));

  const shieldStyle = useAnimatedStyle(() => ({
    transformOrigin: '66% 65%',
    transform: [
      { translateX: interpolate(cycle.value, [0.55, 0.6, 0.8, 0.86], [0, -3 * unit, -3 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.55, 0.6, 0.8, 0.86], [0, -5, -5, 0], CLAMP)}deg` },
      { scale: interpolate(cycle.value, [0.55, 0.6, 0.8, 0.86], [1, 1.05, 1.05, 1], CLAMP) },
    ],
  }));

  const warningStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 70%',
    transform: [
      {
        scale: interpolate(
          cycle.value,
          [0.58, 0.62, 0.66, 0.7, 0.74],
          [1, 1.14, 1, 1.14, 1],
          CLAMP,
        ),
      },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <SariLayer>
          <SariLegs />
          <SariJar />
          <SariBrowsStern />
          <SariMouthFlat />
          <SariLid />
        </SariLayer>
        <SariLayer style={warningStyle}>
          <SariWarning />
        </SariLayer>
        <SariLayer style={eyesStyle}>
          <SariEyesOpen />
        </SariLayer>
        <SariLayer>
          <SariArmFistChest />
        </SariLayer>
        <SariLayer style={shieldStyle}>
          <SariArmShield />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
