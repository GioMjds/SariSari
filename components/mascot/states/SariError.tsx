import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariArmScratch,
  SariBandage,
  SariBrowsWorried,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthSheepish,
  SariShadow,
  SariSweatDrop,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Error state: Sari gets bonked, then laughs it off sheepishly.
 * Loop (5 s): jolt with lid knocked askew (0-0.12), head scratch
 * (0.18-0.50), sweat drop slides and fades (0.14-0.55) then
 * reappears (0.62-0.96), lid straightens (0.88-1).
 */
const CYCLE_MS = 5000;
/** Still pose: lid slightly askew, sweat drop showing, arm resting. */
const REST_POSE = 0.7;

const CLAMP = Extrapolation.CLAMP;

interface SariErrorProps {
  size: number;
  animate: boolean;
}

export function SariError({ size, animate }: SariErrorProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const joltStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92%',
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0, 0.02, 0.04, 0.06, 0.08, 0.1],
          [0, -4 * unit, 4 * unit, -2.5 * unit, 1.5 * unit, 0],
          CLAMP,
        ),
      },
      {
        scaleY: interpolate(cycle.value, [0, 0.02, 0.06], [1, 0.95, 1], CLAMP),
      },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0, 0.03, 0.08, 0.1],
          [0, -9 * unit, 0, -1 * unit],
          CLAMP,
        ),
      },
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.03, 0.07, 0.11, 0.88, 0.94, 1],
          [0, -14, 2, -5, -5, 1, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const armStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 55%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.18, 0.23, 0.28, 0.33, 0.38, 0.43, 0.5],
          [0, -7, 3, -7, 3, -7, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const sweatStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cycle.value,
      [0.12, 0.16, 0.48, 0.55, 0.62, 0.66, 0.96, 1],
      [0, 1, 1, 0, 0, 1, 1, 0],
      CLAMP,
    ),
    transformOrigin: '67% 37%',
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.16, 0.55, 0.58],
          [0, 12 * unit, 0],
          CLAMP,
        ),
      },
      { scale: interpolate(cycle.value, [0.12, 0.16, 0.19], [0.3, 1.15, 1], CLAMP) },
    ],
  }));

  const browsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0, 0.03, 0.12, 0.18],
          [0, -3 * unit, -3 * unit, 0],
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
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, joltStyle]}>
          <SariLayer>
            <SariLegs />
            <SariArmHip side="left" />
          </SariLayer>
          <SariLayer style={armStyle}>
            <SariArmScratch />
          </SariLayer>
          <SariLayer>
            <SariJar />
            <SariBandage />
            <SariCheeks />
            <SariEyesHappy />
            <SariMouthSheepish />
          </SariLayer>
          <SariLayer style={browsStyle}>
            <SariBrowsWorried />
          </SariLayer>
          <SariLayer style={sweatStyle}>
            <SariSweatDrop />
          </SariLayer>
          <SariLayer style={lidStyle}>
            <SariLid />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
