import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariArmPoint,
  SariBrowsArched,
  SariCheeks,
  SariEyesOpen,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthPatient,
  SariScaleBase,
  SariScaleBeam,
  SariShadow,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Outstanding balance state: Sari calmly points at a tipped scale.
 * Loop (4.4 s): glances down at the scale (0.05-0.12), taps it twice
 * so the beam wobbles and settles back tipped (0.14-0.42), looks back
 * at the viewer with a gentle head tilt and raised brows (0.46-0.84),
 * blinks (0.88-0.92).
 */
const CYCLE_MS = 4400;
/** Still pose: facing the viewer, head tilted, finger on the scale. */
const REST_POSE = 0.7;

const CLAMP = Extrapolation.CLAMP;

interface SariOutstandingBalanceProps {
  size: number;
  animate: boolean;
}

export function SariOutstandingBalance({ size, animate }: SariOutstandingBalanceProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  // Head tilt toward the viewer-left on the "so..." beat.
  const tiltStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 90%',
    transform: [
      {
        rotate: `${interpolate(cycle.value, [0.46, 0.56, 0.84, 0.94], [0, -3, -3, 0], CLAMP)}deg`,
      },
    ],
  }));

  // Two jabs toward the scale.
  const armStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 55%',
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0.14, 0.18, 0.22, 0.28, 0.32, 0.36],
          [0, 3 * unit, 0, 0, 3 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  // The beam dips on each tap, then rocks back to its tipped rest.
  const beamStyle = useAnimatedStyle(() => ({
    transformOrigin: '53% 68.5%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.17, 0.2, 0.25, 0.31, 0.34, 0.39, 0.44],
          [0, -6, 3, 0, -6, 2.5, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const eyesStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 49%',
    transform: [
      {
        translateX: interpolate(cycle.value, [0.05, 0.12, 0.42, 0.5], [0, 3 * unit, 3 * unit, 0], CLAMP),
      },
      {
        translateY: interpolate(cycle.value, [0.05, 0.12, 0.42, 0.5], [0, 3 * unit, 3 * unit, 0], CLAMP),
      },
      {
        scaleY: interpolate(cycle.value, [0.88, 0.9, 0.92], [1, 0.1, 1], CLAMP),
      },
    ],
  }));

  const browsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.05, 0.12, 0.42, 0.5, 0.54, 0.6, 0.84, 0.94],
          [0, 1.5 * unit, 1.5 * unit, 0, 0, -2.5 * unit, -2.5 * unit, 0],
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
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, tiltStyle]}>
          <SariLayer>
            <SariArmHip side="right" />
            <SariLegs />
            <SariJar />
            <SariCheeks />
            <SariMouthPatient />
            <SariScaleBase />
            <SariLid />
          </SariLayer>
          <SariLayer style={beamStyle}>
            <SariScaleBeam />
          </SariLayer>
          <SariLayer style={eyesStyle}>
            <SariEyesOpen />
          </SariLayer>
          <SariLayer style={browsStyle}>
            <SariBrowsArched />
          </SariLayer>
          <SariLayer style={armStyle}>
            <SariArmPoint />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
