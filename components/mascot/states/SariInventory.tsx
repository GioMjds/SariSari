import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import { SariCheeks, SariEyesOpen, SariJar, SariLegs, SariLid, SariShadow } from '../sariParts';
import {
  SariArmChin,
  SariArmClipboard,
  SariBoxes,
  SariBrowsHigh,
  SariClipboardCheck,
  SariGlasses,
  SariMouthHmm,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Inventory state: Sari takes stock with glasses and a clipboard.
 * Loop (4.8 s): eyes count across the boxes with a small nod per
 * column (0.08-0.5), the clipboard lifts and a check pops (0.5-0.6),
 * a thoughtful chin tap (0.6-0.72), blink (0.88-0.92).
 */
const CYCLE_MS = 4800;
/** Still pose: check on the clipboard, eyes on the viewer. */
const REST_POSE = 0.7;

const CLAMP = Extrapolation.CLAMP;

interface SariInventoryProps {
  size: number;
  animate: boolean;
}

export function SariInventory({ size, animate }: SariInventoryProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  // Face bobs once per counted column.
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.16, 0.19, 0.22, 0.28, 0.31, 0.34, 0.4, 0.43, 0.46],
          [0, 1.5 * unit, 0, 0, 1.5 * unit, 0, 0, 1.5 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  const eyesStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 49%',
    transform: [
      {
        translateX: interpolate(
          cycle.value,
          [0.08, 0.12, 0.24, 0.27, 0.36, 0.39, 0.48, 0.54],
          [0, -2 * unit, -2 * unit, unit, unit, 3 * unit, 3 * unit, 0],
          CLAMP,
        ),
      },
      {
        translateY: interpolate(cycle.value, [0.08, 0.12, 0.48, 0.54], [0, 2.5 * unit, 2.5 * unit, 0], CLAMP),
      },
      { scaleY: interpolate(cycle.value, [0.88, 0.9, 0.92], [1, 0.1, 1], CLAMP) },
    ],
  }));

  const clipboardStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 56%',
    transform: [
      { translateY: interpolate(cycle.value, [0.48, 0.53, 0.82, 0.88], [0, -2 * unit, -2 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.48, 0.53, 0.82, 0.88], [0, -4, -4, 0], CLAMP)}deg` },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transformOrigin: [59 * unit, 124 * unit, 0],
    opacity: interpolate(cycle.value, [0.52, 0.55, 0.93, 0.97], [0, 1, 1, 0], CLAMP),
    transform: [{ scale: interpolate(cycle.value, [0.52, 0.56, 0.6], [0.4, 1.25, 1], CLAMP) }],
  }));

  const chinStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 57%',
    transform: [
      {
        rotate: `${interpolate(cycle.value, [0.6, 0.63, 0.66, 0.69, 0.72], [0, -4, 0, -4, 0], CLAMP)}deg`,
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
          <SariBoxes />
          <SariCheeks />
          <SariMouthHmm />
          <SariBrowsHigh />
          <SariLid />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, faceStyle]}>
          <SariLayer style={eyesStyle}>
            <SariEyesOpen />
          </SariLayer>
          <SariLayer>
            <SariGlasses />
          </SariLayer>
        </Reanimated.View>
        <SariLayer style={chinStyle}>
          <SariArmChin />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, clipboardStyle]}>
          <SariLayer>
            <SariArmClipboard />
          </SariLayer>
          <SariLayer style={checkStyle}>
            <SariClipboardCheck />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
