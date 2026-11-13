import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariArmHip,
  SariCandy,
  SariCheeks,
  SariEyeWhites,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthOoh,
  SariPupils,
  SariShadow,
  type SariCandyColor,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Loading state: Sari fills up with candies.
 * Loop (2.8 s): lid lifts (0-0.12), three candies drop in and bounce
 * (staggered from 0.10), lid closes (0.74-0.84), candies fade (0.88-0.98).
 */
const CYCLE_MS = 2800;
/** Still pose: lid closed, all candies settled. */
const REST_POSE = 0.86;

const CLAMP = Extrapolation.CLAMP;

/** Candy drops start above the jar mouth (y ~ 8). */
const DROP_FROM_Y = 8;

interface CandySpec {
  cx: number;
  cy: number;
  color: SariCandyColor;
  start: number;
}

const CANDIES: readonly CandySpec[] = [
  { cx: 86, cy: 148, color: 'red', start: 0.1 },
  { cx: 116, cy: 146, color: 'yellow', start: 0.24 },
  { cx: 101, cy: 136, color: 'green', start: 0.38 },
];
const FALL = 0.16;
/** Plain number array so the landing worklet avoids iterating objects. */
const LANDS = CANDIES.map((c) => c.start + FALL);

interface SariLoadingProps {
  size: number;
  animate: boolean;
}

export function SariLoading({ size, animate }: SariLoadingProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '30% 26%',
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0, 0.1, 0.74, 0.82, 0.86],
          [0, -10 * unit, -10 * unit, 1 * unit, 0],
          CLAMP,
        ),
      },
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.1, 0.74, 0.82, 0.86],
          [0, -10, -10, 2, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  // Eyes look up while the lid opens, then track the candies down.
  const pupilsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0, 0.08, 0.2, 0.3, 0.44, 0.56, 0.7],
          [0, -3 * unit, 2.5 * unit, -2 * unit, 2.5 * unit, 2.5 * unit, 0],
          CLAMP,
        ),
      },
    ],
  }));

  // Tiny squash each time a candy lands.
  const landStyle = useAnimatedStyle(() => {
    let dip = 0;
    for (let i = 0; i < LANDS.length; i++) {
      const land = LANDS[i] ?? 0;
      dip = Math.max(
        dip,
        interpolate(cycle.value, [land, land + 0.02, land + 0.06], [0, 1, 0], CLAMP),
      );
    }
    return {
      transformOrigin: '50% 92%',
      transform: [{ scaleY: 1 - 0.03 * dip }, { scaleX: 1 + 0.015 * dip }],
    };
  });

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, landStyle]}>
          <SariLayer>
            <SariLegs />
            <SariArmHip side="left" />
            <SariArmHip />
            <SariJar />
          </SariLayer>
          {CANDIES.map((c) => (
            <CandyLayer key={c.color} spec={c} cycle={cycle} unit={unit} />
          ))}
          <SariLayer>
            <SariCheeks />
            <SariMouthOoh />
            <SariEyeWhites />
          </SariLayer>
          <SariLayer style={pupilsStyle}>
            <SariPupils />
          </SariLayer>
          <SariLayer style={lidStyle}>
            <SariLid />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}

interface CandyLayerProps {
  spec: CandySpec;
  cycle: SharedValue<number>;
  unit: number;
}

function CandyLayer({ spec, cycle, unit }: CandyLayerProps) {
  const { cx, cy, color, start } = spec;
  const land = start + FALL;
  const dist = (cy - DROP_FROM_Y) * unit;
  // Pivot in px. React Native's string parser rejects fractional
  // percentages ("50.5% 68%"), so the origin is passed as numbers.
  const originX = cx * unit;
  const originY = cy * unit;

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      cycle.value,
      [start - 0.01, start, 0.88, 0.98],
      [0, 1, 1, 0],
      CLAMP,
    ),
    transformOrigin: [originX, originY, 0],
    transform: [
      {
        // Ease-in fall (quarter distance at half time), then a small bounce.
        translateY: interpolate(
          cycle.value,
          [start, start + FALL / 2, land, land + 0.03, land + 0.06],
          [-dist, -dist * 0.75, 0, -6 * unit, 0],
          CLAMP,
        ),
      },
      {
        rotate: `${interpolate(cycle.value, [start, land], [-120, 0], CLAMP)}deg`,
      },
    ],
  }));

  return (
    <SariLayer style={style}>
      <SariCandy cx={cx} cy={cy} color={color} />
    </SariLayer>
  );
}
