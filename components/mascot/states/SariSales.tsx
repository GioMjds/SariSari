import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmWave,
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthOpenSmile,
  SariShadow,
} from '../sariParts';
import { SariArmHoldUp, SariCoin, SariCoinPile } from '../sariProps';
import { useSariClock, useSariHopStyles } from '../useSariMotion';

/**
 * Sales state: Sari hops for joy holding up a coin.
 * Loop (3 s): crouch and hop with the coin spinning (0.04-0.42), the
 * coins in the jar jingle on landing (0.28-0.38), waves with the
 * other hand (0.46-0.86).
 */
const CYCLE_MS = 3000;
/** Still pose: standing, coin up, mid-wave. */
const REST_POSE = 0.6;

const CLAMP = Extrapolation.CLAMP;

interface SariSalesProps {
  size: number;
  animate: boolean;
}

export function SariSales({ size, animate }: SariSalesProps) {
  const unit = size / 200;
  const { cycle } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { hopStyle, hopShadowStyle } = useSariHopStyles(cycle, unit);

  const coinArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 56%',
    transform: [
      {
        rotate: `${interpolate(cycle.value, [0.04, 0.12, 0.2, 0.3], [0, -15, 10, 0], CLAMP)}deg`,
      },
    ],
  }));

  const coinSpinStyle = useAnimatedStyle(() => ({
    transformOrigin: '17% 26%',
    transform: [
      {
        scaleX: interpolate(
          cycle.value,
          [0.12, 0.17, 0.22, 0.27, 0.32, 0.37, 0.42],
          [1, -1, 1, -1, 1, -1, 1],
          CLAMP,
        ),
      },
    ],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transformOrigin: '70% 56%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.46, 0.52, 0.58, 0.64, 0.7, 0.76, 0.86],
          [0, 14, -10, 14, -10, 14, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const pileStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(cycle.value, [0.28, 0.31, 0.34, 0.38], [0, -2.5 * unit, 0.5 * unit, 0], CLAMP) },
    ],
  }));

  return (
    <>
      <SariLayer style={hopShadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, hopStyle]}>
        <SariLayer style={waveStyle}>
          <SariArmWave side="right" />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, coinArmStyle]}>
          <SariLayer style={coinSpinStyle}>
            <SariCoin />
          </SariLayer>
          <SariLayer>
            <SariArmHoldUp />
          </SariLayer>
        </Reanimated.View>
        <SariLayer>
          <SariLegs />
          <SariJar />
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthOpenSmile />
          <SariLid />
        </SariLayer>
        <SariLayer style={pileStyle}>
          <SariCoinPile />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
