import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariArmWave,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariShadow,
} from '../sariParts';
import { SariBeans, SariMouthSmile } from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Exit state: Sari waves goodbye.
 * Loop (4.4 s): leans into a slow, wide wave (0-0.62), then tips the
 * lid like a hat (0.68-0.88) before straightening up.
 */
const CYCLE_MS = 4400;
/** Still pose: leaning, hand up mid-wave. */
const REST_POSE = 0.4;

const CLAMP = Extrapolation.CLAMP;

interface SariExitProps {
  size: number;
  animate: boolean;
}

export function SariExit({ size, animate }: SariExitProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const leanStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92%',
    transform: [
      { rotate: `${interpolate(cycle.value, [0, 0.08, 0.56, 0.66], [0, -3, -3, 0], CLAMP)}deg` },
    ],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transformOrigin: '30% 56%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.62],
          [0, -16, 10, -16, 10, -16, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      { translateY: interpolate(cycle.value, [0.68, 0.73, 0.82, 0.88], [0, -5 * unit, -5 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.68, 0.73, 0.82, 0.88], [0, -12, -12, 0], CLAMP)}deg` },
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
            <SariArmHip />
          </SariLayer>
          <SariLayer style={waveStyle}>
            <SariArmWave />
          </SariLayer>
          <SariLayer>
            <SariJar />
            <SariBeans />
            <SariCheeks />
            <SariEyesHappy />
            <SariMouthSmile />
          </SariLayer>
          <SariLayer style={lidStyle}>
            <SariLid />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
