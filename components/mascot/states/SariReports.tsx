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
  SariMouthBigGrin,
  SariShadow,
} from '../sariParts';
import {
  SariArmAkimbo,
  SariArmHoldUp,
  SariChartArrow,
  SariChartCard,
  SariConfetti,
  SariFlag,
  SariFlagStick,
  SariPartyHat,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Reports state: Sari throws a party for good numbers.
 * Loop (3.6 s): waves the flag (0.05-0.55) while the cloth flutters
 * the whole time, the chart arrow jumps up (0.55-0.72), the party hat
 * wobbles (0.6-0.78). Confetti falls in two staggered sets.
 */
const CYCLE_MS = 3600;
/** Still pose: flag up, both confetti sets showing. */
const REST_POSE = 0.3;

const CLAMP = Extrapolation.CLAMP;

const FLUTTER_T = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const FLUTTER = [1, 0.84, 1, 0.84, 1, 0.84, 1, 0.84, 1, 0.84, 1];

interface SariReportsProps {
  size: number;
  animate: boolean;
}

export function SariReports({ size, animate }: SariReportsProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const flagArmStyle = useAnimatedStyle(() => ({
    transformOrigin: '29% 56%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.05, 0.15, 0.25, 0.35, 0.45, 0.55],
          [0, -10, 8, -10, 8, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const flagStyle = useAnimatedStyle(() => ({
    transformOrigin: '24% 17%',
    transform: [{ scaleX: interpolate(cycle.value, FLUTTER_T, FLUTTER, CLAMP) }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 69%',
    transform: [
      { translateY: interpolate(cycle.value, [0.55, 0.6, 0.66, 0.72], [0, 2 * unit, -4 * unit, 0], CLAMP) },
      { scale: interpolate(cycle.value, [0.55, 0.6, 0.66, 0.72], [1, 0.94, 1.1, 1], CLAMP) },
    ],
  }));

  const hatStyle = useAnimatedStyle(() => ({
    transformOrigin: [126 * unit, 27 * unit, 0],
    transform: [
      { rotate: `${interpolate(cycle.value, [0.6, 0.66, 0.72, 0.78], [0, -7, 4, 0], CLAMP)}deg` },
    ],
  }));

  // Each set drifts down and fades; set B runs half a loop behind set A.
  const confettiAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cycle.value, [0, 0.12, 0.82, 1], [0, 1, 1, 0], CLAMP),
    transform: [{ translateY: interpolate(cycle.value, [0, 1], [-6 * unit, 10 * unit], CLAMP) }],
  }));

  const confettiBStyle = useAnimatedStyle(() => {
    const t = (cycle.value + 0.5) % 1;
    return {
      opacity: interpolate(t, [0, 0.12, 0.82, 1], [0, 1, 1, 0], CLAMP),
      transform: [{ translateY: interpolate(t, [0, 1], [-6 * unit, 10 * unit], CLAMP) }],
    };
  });

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <SariLayer style={confettiAStyle}>
        <SariConfetti set="a" />
      </SariLayer>
      <SariLayer style={confettiBStyle}>
        <SariConfetti set="b" />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <SariLayer>
          <SariLegs />
          <SariArmAkimbo side="right" />
          <SariJar />
          <SariCheeks />
          <SariEyesHappy />
          <SariMouthBigGrin />
          <SariChartCard />
          <SariLid />
        </SariLayer>
        <SariLayer style={arrowStyle}>
          <SariChartArrow />
        </SariLayer>
        <SariLayer style={hatStyle}>
          <SariPartyHat />
        </SariLayer>
        <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, flagArmStyle]}>
          <SariLayer style={flagStyle}>
            <SariFlag />
          </SariLayer>
          <SariLayer>
            <SariFlagStick />
            <SariArmHoldUp />
          </SariLayer>
        </Reanimated.View>
      </Reanimated.View>
    </>
  );
}
