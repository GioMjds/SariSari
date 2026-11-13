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
  SariEyesOpen,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthOpenSmile,
  SariShadow,
} from '../sariParts';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/** One full loop: wave with happy eyes, lid hop, then idle with two blinks. */
const CYCLE_MS = 5000;
/** Cycle position used for the still pose (arm raised, eyes open, no blink). */
const REST_POSE = 0.5;

const CLAMP = Extrapolation.CLAMP;

interface SariDefaultProps {
  /** Rendered size in px. Used to scale pixel translations. */
  size: number;
  animate: boolean;
}

export function SariDefault({ size, animate }: SariDefaultProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const armStyle = useAnimatedStyle(() => ({
    transformOrigin: '30% 56%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0, 0.04, 0.09, 0.14, 0.19, 0.24, 0.3],
          [0, -16, 12, -16, 12, -16, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const happyEyesStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cycle.value, [0, 0.03, 0.3, 0.34], [0, 1, 1, 0], CLAMP),
  }));

  const openEyesStyle = useAnimatedStyle(() => {
    const happy = interpolate(cycle.value, [0, 0.03, 0.3, 0.34], [0, 1, 1, 0], CLAMP);
    const blinkA = interpolate(cycle.value, [0.6, 0.62, 0.64], [1, 0.1, 1], CLAMP);
    const blinkB = interpolate(cycle.value, [0.85, 0.87, 0.89], [1, 0.1, 1], CLAMP);
    return {
      opacity: 1 - happy,
      transformOrigin: '50% 49%',
      transform: [{ scaleY: Math.min(blinkA, blinkB) }],
    };
  });

  const lidStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 26%',
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          [0.3, 0.34, 0.4],
          [0, -5 * unit, 0],
          CLAMP,
        ),
      },
      {
        rotate: `${interpolate(
          cycle.value,
          [0.3, 0.34, 0.38, 0.42, 0.46],
          [0, -6, 4, -2, 0],
          CLAMP,
        )}deg`,
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
        </SariLayer>
        <SariLayer style={armStyle}>
          <SariArmWave />
        </SariLayer>
        <SariLayer>
          <SariJar />
          <SariCheeks />
          <SariMouthOpenSmile />
        </SariLayer>
        <SariLayer style={openEyesStyle}>
          <SariEyesOpen />
        </SariLayer>
        <SariLayer style={happyEyesStyle}>
          <SariEyesHappy />
        </SariLayer>
        <SariLayer style={lidStyle}>
          <SariLid />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
