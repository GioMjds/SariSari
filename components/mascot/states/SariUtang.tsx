import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import { SariCheeks, SariEyesHappy, SariJar, SariLegs, SariLid, SariShadow } from '../sariParts';
import { SariArmsLedger, SariBarAxis, SariBarChart, SariMouthSmile } from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Utang state: Sari hugs the credit ledger, content and organised.
 * Loop (4 s): a slow side-to-side sway the whole time, a fond squeeze
 * of the ledger (0.36-0.56), the chart bars dip and regrow (0.6-0.8).
 */
const CYCLE_MS = 4000;
/** Still pose: upright, ledger held, bars full. */
const REST_POSE = 0.5;

const CLAMP = Extrapolation.CLAMP;

interface SariUtangProps {
  size: number;
  animate: boolean;
}

export function SariUtang({ size, animate }: SariUtangProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const swayStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 92%',
    transform: [
      { rotate: `${interpolate(cycle.value, [0, 0.25, 0.5, 0.75, 1], [0, 2.5, 0, -2.5, 0], CLAMP)}deg` },
    ],
  }));

  const ledgerStyle = useAnimatedStyle(() => ({
    transformOrigin: '56% 66%',
    transform: [
      { translateY: interpolate(cycle.value, [0.36, 0.44, 0.56], [0, -2 * unit, 0], CLAMP) },
      { scale: interpolate(cycle.value, [0.36, 0.44, 0.56], [1, 1.04, 1], CLAMP) },
    ],
  }));

  const barsStyle = useAnimatedStyle(() => ({
    transformOrigin: [76 * unit, 159 * unit, 0],
    transform: [
      { scaleY: interpolate(cycle.value, [0.6, 0.66, 0.74, 0.8], [1, 0.3, 1.1, 1], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, swayStyle]}>
          <SariLayer>
            <SariLegs />
            <SariJar />
            <SariBarAxis />
            <SariCheeks />
            <SariEyesHappy />
            <SariMouthSmile />
            <SariLid />
          </SariLayer>
          <SariLayer style={barsStyle}>
            <SariBarChart />
          </SariLayer>
          <SariLayer style={ledgerStyle}>
            <SariArmsLedger />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
