import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariShadow,
} from '../sariParts';
import {
  SariArmClipboard,
  SariClipboardCheck,
  SariHeart,
  SariMouthSmile,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Utang recorded state: Sari notes the credit on the ledger, trusting the suki.
 * Loop (4 s): the clipboard lifts (0.14-0.22), a check pops on it
 * (0.22-0.3), Sari gives a warm nod (0.32-0.44), a heart floats up
 * from the lid and fades (0.44-0.9).
 */
const CYCLE_MS = 4000;
/** Still pose: check on the clipboard, heart showing. */
const REST_POSE = 0.6;

const CLAMP = Extrapolation.CLAMP;

interface SariUtangRecordedProps {
  size: number;
  animate: boolean;
}

export function SariUtangRecorded({ size, animate }: SariUtangRecordedProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const nodStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.32, 0.36, 0.4, 0.44],
          [0, 2.5 * unit, -0.5 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  const clipboardStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 56%',
    transform: [
      { translateY: interpolate(cycle.value, [0.14, 0.2, 0.86, 0.94], [0, -3 * unit, -3 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.14, 0.2, 0.86, 0.94], [0, -5, -5, 0], CLAMP)}deg` },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transformOrigin: [59 * unit, 124 * unit, 0],
    opacity: interpolate(cycle.value, [0.22, 0.25, 0.9, 0.95], [0, 1, 1, 0], CLAMP),
    transform: [{ scale: interpolate(cycle.value, [0.22, 0.26, 0.3], [0.4, 1.25, 1], CLAMP) }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transformOrigin: [150 * unit, 40 * unit, 0],
    opacity: interpolate(cycle.value, [0.44, 0.5, 0.8, 0.9], [0, 1, 1, 0], CLAMP),
    transform: [
      { translateY: interpolate(cycle.value, [0.44, 0.9], [6 * unit, -14 * unit], CLAMP) },
      { scale: interpolate(cycle.value, [0.44, 0.5, 0.56], [0.5, 1.15, 1], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <SariLayer>
          <SariArmHip side="right" />
          <SariLegs />
          <SariJar />
          <SariLid />
        </SariLayer>
        <SariLayer style={nodStyle}>
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthSmile />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, clipboardStyle]}>
          <SariLayer>
            <SariArmClipboard />
          </SariLayer>
          <SariLayer style={checkStyle}>
            <SariClipboardCheck />
          </SariLayer>
        </Reanimated.View>
        <SariLayer style={heartStyle}>
          <SariHeart cx={150} cy={40} r={8} />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
