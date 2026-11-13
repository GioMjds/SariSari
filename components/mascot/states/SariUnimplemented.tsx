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
  SariMouthOpenSmile,
  SariShadow,
} from '../sariParts';
import {
  SariArmLift,
  SariHand,
  SariJarMouth,
  SariPeekSparkles,
  SariStarCard,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Unimplemented ("coming soon") state: Sari peeks a surprise.
 * Loop (4.4 s): lifts the lid (0.08-0.2), a golden card rises out of
 * the jar and wiggles while sparkles twinkle (0.18-0.7), the card
 * sinks back (0.66-0.76), the lid shuts with a small bounce (0.74-0.9).
 */
const CYCLE_MS = 4400;
/** Still pose: lid up, card out, sparkles showing. */
const REST_POSE = 0.45;

const CLAMP = Extrapolation.CLAMP;

const OPEN_T = [0.08, 0.2, 0.74, 0.84];
const OPEN = [0, 1, 1, 0];

/** Where the hand ends up when the lid is fully open, relative to closed. */
const GRIP_DX = -12.8;
const GRIP_DY = -17.4;

interface SariUnimplementedProps {
  size: number;
  animate: boolean;
}

export function SariUnimplemented({ size, animate }: SariUnimplementedProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  // The arm reaches up by swinging out and stretching from the shoulder
  // (58, 116). That carries the hand from (60, 42) by GRIP_DX, GRIP_DY;
  // the hand and lid follow by the same offset.
  const armStyle = useAnimatedStyle(() => {
    const open = interpolate(cycle.value, OPEN_T, OPEN, CLAMP);
    return {
      transformOrigin: [58 * unit, 116 * unit, 0],
      transform: [{ rotate: `${-8 * open}deg` }, { scaleY: 1 + 0.243 * open }],
    };
  });

  const handStyle = useAnimatedStyle(() => {
    const open = interpolate(cycle.value, OPEN_T, OPEN, CLAMP);
    return {
      transform: [{ translateX: GRIP_DX * unit * open }, { translateY: GRIP_DY * unit * open }],
    };
  });

  // The lid tilts open around the grip and rides up with the hand.
  const lidStyle = useAnimatedStyle(() => {
    const open = interpolate(cycle.value, OPEN_T, OPEN, CLAMP);
    const bounce = interpolate(cycle.value, [0.84, 0.87, 0.9], [0, -2.5 * unit, 0], CLAMP);
    return {
      transformOrigin: [62 * unit, 40 * unit, 0],
      transform: [
        { translateX: GRIP_DX * unit * open },
        { translateY: GRIP_DY * unit * open + bounce },
        { rotate: `${-12 * open}deg` },
      ],
    };
  });

  const cardStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 22%',
    transform: [
      { translateY: interpolate(cycle.value, [0.18, 0.3, 0.66, 0.76], [26 * unit, 0, 0, 26 * unit], CLAMP) },
      {
        rotate: `${interpolate(cycle.value, [0.3, 0.38, 0.46, 0.54], [0, -7, 7, 0], CLAMP)}deg`,
      },
    ],
  }));

  const sparklesStyle = useAnimatedStyle(() => ({
    transformOrigin: '75% 12%',
    opacity: interpolate(cycle.value, [0.28, 0.34, 0.62, 0.7], [0, 1, 1, 0], CLAMP),
    transform: [
      {
        scale: interpolate(cycle.value, [0.28, 0.34, 0.4, 0.48, 0.56], [0.5, 1.15, 0.9, 1.1, 1], CLAMP),
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
          <SariArmHip />
          <SariJarMouth />
        </SariLayer>
        <SariLayer style={armStyle}>
          <SariArmLift />
        </SariLayer>
        <SariLayer style={cardStyle}>
          <SariStarCard />
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
        <SariLayer style={handStyle}>
          <SariHand cx={60} cy={42} />
        </SariLayer>
        <SariLayer style={sparklesStyle}>
          <SariPeekSparkles />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
