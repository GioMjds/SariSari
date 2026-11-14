import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariCheeks,
  SariEyesHappy,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthOpenSmile,
  SariShadow,
} from '../sariParts';
import { SariArmOpen, SariHeart } from '../sariProps';
import { useSariBreathStyles, useSariClock, useSariHopStyles } from '../useSariMotion';

/**
 * Customers state: Sari welcomes a suki with open arms.
 * Loop (4.5 s): a happy hop with arms flinging wide (0-0.42), a
 * beckoning "come in" swing of both arms (0.44-0.64), then three
 * hearts float up and fade one after another (0.5-0.95).
 */
const CYCLE_MS = 4500;
/** Still pose: arms open, settled, no hearts in flight. */
const REST_POSE = 0.98;

const CLAMP = Extrapolation.CLAMP;

/** Heart spawn points and the window each one floats in. */
const HEARTS = [
  { cx: 46, cy: 50, r: 6, t: [0.5, 0.58, 0.72, 0.8] },
  { cx: 154, cy: 44, r: 7.5, t: [0.58, 0.66, 0.8, 0.88] },
  { cx: 100, cy: 22, r: 5.5, t: [0.66, 0.74, 0.88, 0.95] },
] as const;

interface SariCustomersProps {
  size: number;
  animate: boolean;
}

export function SariCustomers({ size, animate }: SariCustomersProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle } = useSariBreathStyles(breath, unit);
  const { hopStyle, hopShadowStyle } = useSariHopStyles(cycle, unit);

  // Arms fold in during the crouch, fling open at takeoff, then beckon twice.
  const armAngle = (sign: 1 | -1) => {
    'worklet';
    return interpolate(
      cycle.value,
      [0.04, 0.12, 0.2, 0.44, 0.49, 0.54, 0.59, 0.64],
      [0, 22, -10, 0, 18, 0, 18, 0],
      CLAMP,
    ) * sign;
  };

  const leftArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 55%',
    transform: [{ rotate: `${armAngle(-1)}deg` }],
  }));

  const rightArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '71% 55%',
    transform: [{ rotate: `${armAngle(1)}deg` }],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      { translateY: interpolate(cycle.value, [0.2, 0.26, 0.32], [0, -5 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.26, 0.3, 0.34, 0.38], [0, 5, -3, 0], CLAMP)}deg` },
    ],
  }));

  const heart0 = useHeartStyle(cycle, unit, HEARTS[0].t);
  const heart1 = useHeartStyle(cycle, unit, HEARTS[1].t);
  const heart2 = useHeartStyle(cycle, unit, HEARTS[2].t);
  const heartStyles = [heart0, heart1, heart2];

  return (
    <>
      <SariLayer style={hopShadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, hopStyle]}>
          <SariLayer>
            <SariLegs />
          </SariLayer>
          <SariLayer style={leftArmStyle}>
            <SariArmOpen side="left" />
          </SariLayer>
          <SariLayer style={rightArmStyle}>
            <SariArmOpen side="right" />
          </SariLayer>
          <SariLayer>
            <SariJar />
            <SariCheeks />
            <SariEyesHappy />
            <SariMouthOpenSmile />
          </SariLayer>
          <SariLayer style={lidStyle}>
            <SariLid />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
      {HEARTS.map((h, i) => (
        <SariLayer key={`heart-${h.cx}`} style={heartStyles[i]}>
          <SariHeart cx={h.cx} cy={h.cy} r={h.r} />
        </SariLayer>
      ))}
    </>
  );
}

/** Pop in, drift up, fade out over the window `t` = [appear, full, fadeStart, gone]. */
function useHeartStyle(
  cycle: ReturnType<typeof useSariClock>['cycle'],
  unit: number,
  t: readonly [number, number, number, number],
) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(cycle.value, [t[0], t[1], t[2], t[3]], [0, 1, 1, 0], CLAMP),
    transform: [
      { translateY: interpolate(cycle.value, [t[0], t[3]], [6 * unit, -18 * unit], CLAMP) },
      { scale: interpolate(cycle.value, [t[0], t[1]], [0.4, 1], CLAMP) },
    ],
  }));
}
