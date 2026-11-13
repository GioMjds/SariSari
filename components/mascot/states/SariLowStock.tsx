import { StyleSheet, View } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariAlertMark,
  SariArmHip,
  SariArmPresent,
  SariBrowsWorried,
  SariCheeks,
  SariCrate,
  SariEyesOpen,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthFrown,
  SariShadow,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Low stock state: Sari points out an empty crate, then worries.
 * Loop (4.8 s): looks at the crate and gestures at it twice
 * (0.05-0.45, crate rattles hollow), looks back at the viewer with
 * brows raised while the "!" pops (0.5-0.66), sighs (0.68-0.86),
 * blinks (0.88-0.92).
 */
const CYCLE_MS = 4800;
/** Still pose: facing the viewer, worried, "!" showing, arm out to the crate. */
const REST_POSE = 0.66;

/** Sari stands left of center so the crate fits on the right. */
const SARI_SHIFT_X = -24;

const CLAMP = Extrapolation.CLAMP;

interface SariLowStockProps {
  size: number;
  animate: boolean;
}

export function SariLowStock({ size, animate }: SariLowStockProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const crateStyle = useAnimatedStyle(() => ({
    transformOrigin: '76% 92%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.16, 0.19, 0.22, 0.25, 0.28],
          [0, -2.5, 2, -1, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const armStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 57%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.1, 0.17, 0.24, 0.31, 0.38, 0.45],
          [0, -8, 2, -8, 2, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  // Glance at the crate, back to the viewer, then one blink.
  const eyesStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 49%',
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0, 0.08, 0.46, 0.54],
          [0, 4 * unit, 4 * unit, 0],
          CLAMP,
        ),
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
          [0.52, 0.58, 0.94, 1],
          [0, -3 * unit, -3 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  const alertStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 68%',
    transform: [
      {
        scale: interpolate(
          cycle.value,
          [0.5, 0.54, 0.6, 0.66, 0.76, 0.81, 0.86],
          [1, 0.6, 1.3, 1, 1, 1.12, 1],
          CLAMP,
        ),
      },
    ],
  }));

  const sighStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92%',
    transform: [
      {
        translateY: interpolate(cycle.value, [0.68, 0.76, 0.86], [0, 2 * unit, 0], CLAMP),
      },
      {
        scaleY: interpolate(cycle.value, [0.68, 0.76, 0.86], [1, 0.975, 1], CLAMP),
      },
    ],
  }));

  return (
    <>
      <SariLayer style={crateStyle}>
        <SariCrate />
      </SariLayer>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: SARI_SHIFT_X * unit }] }]}
      >
        <SariLayer style={shadowStyle}>
          <SariShadow />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
          <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, sighStyle]}>
            <SariLayer style={armStyle}>
              <SariArmPresent />
            </SariLayer>
            <SariLayer>
              <SariLegs />
              <SariArmHip side="left" />
              <SariJar />
              <SariCheeks />
              <SariMouthFrown />
              <SariLid />
            </SariLayer>
            <SariLayer style={alertStyle}>
              <SariAlertMark />
            </SariLayer>
            <SariLayer style={eyesStyle}>
              <SariEyesOpen />
            </SariLayer>
            <SariLayer style={browsStyle}>
              <SariBrowsWorried />
            </SariLayer>
          </Reanimated.View>
        </Reanimated.View>
      </View>
    </>
  );
}
