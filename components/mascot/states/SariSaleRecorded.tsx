import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmCheer,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthBigGrin,
  SariShadow,
  SariSparkles,
} from '../sariParts';
import { SariCoin, SariCoinPile } from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Sale recorded state: a coin flips into Sari's jar and Sari cheers.
 * Loop (3.4 s): the lid pops open (0.08-0.16), a spinning coin arcs in
 * from the left (0.08-0.34), the lid shuts and the pile jingles
 * (0.34-0.44), sparkles burst (0.4-0.88), both fists pump (0.5-0.8).
 */
const CYCLE_MS = 3400;
/** Still pose: coin inside, lid shut, fists up, sparkles showing. */
const REST_POSE = 0.6;

const CLAMP = Extrapolation.CLAMP;

interface SariSaleRecordedProps {
  size: number;
  animate: boolean;
}

export function SariSaleRecorded({ size, animate }: SariSaleRecordedProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  // Coin starts at its held spot (34, 52) and lands in the jar mouth (100, 56).
  const coinPathStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cycle.value, [0.06, 0.1, 0.3, 0.34], [0, 1, 1, 0], CLAMP),
    transform: [
      { translateX: interpolate(cycle.value, [0.1, 0.22, 0.3], [0, 33 * unit, 66 * unit], CLAMP) },
      {
        translateY: interpolate(
          cycle.value,
          [0.1, 0.22, 0.3, 0.34],
          [0, -36 * unit, -14 * unit, 4 * unit],
          CLAMP,
        ),
      },
    ],
  }));

  const coinSpinStyle = useAnimatedStyle(() => ({
    transformOrigin: '17% 26%',
    transform: [
      {
        scaleX: interpolate(
          cycle.value,
          [0.1, 0.14, 0.18, 0.22, 0.26, 0.3],
          [1, -1, 1, -1, 1, -1],
          CLAMP,
        ),
      },
      { scale: interpolate(cycle.value, [0.28, 0.34], [1, 0.5], CLAMP) },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '70% 26%',
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.08, 0.16, 0.32, 0.36, 0.4],
          [0, -16 * unit, -16 * unit, unit, 0],
          CLAMP,
        ),
      },
      {
        rotate: `${interpolate(cycle.value, [0.08, 0.16, 0.32, 0.36, 0.4], [0, 14, 14, -2, 0], CLAMP)}deg`,
      },
    ],
  }));

  const pileStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.36, 0.39, 0.42, 0.45],
          [0, -2.5 * unit, 0.5 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  // Arms rise as the coin lands, then pump in turn.
  const leftArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 55%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.36, 0.42, 0.5, 0.56, 0.62, 0.68],
          [-30, 0, 0, 12, -4, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 55%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.36, 0.42, 0.62, 0.68, 0.74, 0.8],
          [30, 0, 0, -12, 4, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const sparklesAStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 50%',
    opacity: interpolate(cycle.value, [0.4, 0.44, 0.78, 0.86], [0, 1, 1, 0], CLAMP),
    transform: [
      { scale: interpolate(cycle.value, [0.4, 0.46, 0.52], [0.6, 1.08, 1], CLAMP) },
    ],
  }));

  const sparklesBStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 50%',
    opacity: interpolate(cycle.value, [0.46, 0.5, 0.82, 0.9], [0, 1, 1, 0], CLAMP),
    transform: [
      { scale: interpolate(cycle.value, [0.46, 0.52, 0.58], [0.6, 1.08, 1], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <SariLayer style={sparklesAStyle}>
        <SariSparkles set="a" />
      </SariLayer>
      <SariLayer style={sparklesBStyle}>
        <SariSparkles set="b" />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <SariLayer style={leftArmStyle}>
          <SariArmCheer side="left" />
        </SariLayer>
        <SariLayer style={rightArmStyle}>
          <SariArmCheer side="right" />
        </SariLayer>
        <SariLayer>
          <SariLegs />
          <SariJar />
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthBigGrin />
        </SariLayer>
        <SariLayer style={pileStyle}>
          <SariCoinPile />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, coinPathStyle]}>
          <SariLayer style={coinSpinStyle}>
            <SariCoin />
          </SariLayer>
        </Reanimated.View>
        <SariLayer style={lidStyle}>
          <SariLid />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
