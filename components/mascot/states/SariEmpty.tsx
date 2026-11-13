import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariArmHold,
  SariBrowsCurious,
  SariCheeks,
  SariEyeWhites,
  SariJar,
  SariLegs,
  SariLid,
  SariMagnifier,
  SariMouthSmirk,
  SariPupils,
  SariQuestionMark,
  SariShadow,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Empty state: Sari hunts for items with a magnifier.
 * Loop (6 s): sweep and lean while eyes follow the lens (0-0.40),
 * "hmm" beat with lens zoom, raised brows and a "?" (0.42-0.64),
 * idle with one blink (0.80).
 */
const CYCLE_MS = 6000;
/** Still pose: magnifier centered, no "?", eyes open. */
const REST_POSE = 0.7;

const CLAMP = Extrapolation.CLAMP;

interface SariEmptyProps {
  size: number;
  animate: boolean;
}

export function SariEmpty({ size, animate }: SariEmptyProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const leanStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.13, 0.27, 0.4, 0.46, 0.6, 0.66],
          [0, -3, 3, 0, 2, 2, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const magnifierStyle = useAnimatedStyle(() => ({
    transformOrigin: '64% 71.5%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.13, 0.27, 0.4],
          [0, -16, 12, 0],
          CLAMP,
        )}deg`,
      },
      {
        scale: interpolate(
          cycle.value,
          [0.42, 0.48, 0.58, 0.64],
          [1, 1.15, 1.15, 1],
          CLAMP,
        ),
      },
    ],
  }));

  const eyesStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 48.5%',
    transform: [
      { scaleY: interpolate(cycle.value, [0.8, 0.82, 0.84], [1, 0.1, 1], CLAMP) },
    ],
  }));

  const pupilsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0, 0.13, 0.27, 0.4, 0.44, 0.48, 0.6, 0.64],
          [0, -3.5 * unit, 3 * unit, 0, 0, 2.5 * unit, 2.5 * unit, 0],
          CLAMP,
        ),
      },
      {
        translateY: interpolate(
          cycle.value,
          [0, 0.13, 0.27, 0.4],
          [0, -1.5 * unit, 1 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  const browsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.42, 0.46, 0.58, 0.62],
          [0, -4 * unit, -4 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cycle.value, [0.44, 0.48, 0.6, 0.64], [0, 1, 1, 0], CLAMP),
    transformOrigin: '88% 25%',
    transform: [
      { scale: interpolate(cycle.value, [0.44, 0.5, 0.54], [0.4, 1.15, 1], CLAMP) },
      {
        rotate: `${interpolate(cycle.value, [0.5, 0.55, 0.6], [0, 8, 0], CLAMP)}deg`,
      },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, leanStyle]}>
          <SariLayer>
            <SariLegs />
            <SariArmHip side="left" />
            <SariJar />
            <SariCheeks />
            <SariMouthSmirk />
          </SariLayer>
          <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, eyesStyle]}>
            <SariLayer>
              <SariEyeWhites />
            </SariLayer>
            <SariLayer style={pupilsStyle}>
              <SariPupils />
            </SariLayer>
          </Reanimated.View>
          <SariLayer style={browsStyle}>
            <SariBrowsCurious />
          </SariLayer>
          <SariLayer>
            <SariLid />
            <SariArmHold />
          </SariLayer>
          <SariLayer style={magnifierStyle}>
            <SariMagnifier />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
      <SariLayer style={questionStyle}>
        <SariQuestionMark />
      </SariLayer>
    </>
  );
}
