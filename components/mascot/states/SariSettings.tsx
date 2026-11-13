import { StyleSheet } from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SariLayer } from '../SariLayer';
import {
  SariBrowsCurious,
  SariCheeks,
  SariEyesOpen,
  SariJar,
  SariLegs,
  SariLid,
  SariMouthSmirk,
  SariShadow,
} from '../sariParts';
import {
  SARI_GEARS,
  SariArmAkimbo,
  SariArmWrench,
  SariGear,
  SariHardHat,
  SariWrench,
} from '../sariProps';
import { useSariBreathStyles, useSariClock } from '../useSariMotion';

/**
 * Settings state: Sari the handyman, wrench in hand, gears turning.
 * Loop (4 s): gears spin the whole time (alternate directions), two
 * wrench twists (0.15-0.5), tips the hard hat (0.62-0.82).
 */
const CYCLE_MS = 4000;
/** Still pose: wrench up, hat on. */
const REST_POSE = 0.55;

const CLAMP = Extrapolation.CLAMP;

/** Transform origin for a gear, in percent of the 200 viewBox. */
function gearOrigin(index: 0 | 1 | 2) {
  const g = SARI_GEARS[index];
  return `${g.cx / 2}% ${g.cy / 2}%`;
}

interface SariSettingsProps {
  size: number;
  animate: boolean;
}

export function SariSettings({ size, animate }: SariSettingsProps) {
  const unit = size / 200;
  const { cycle, breath } = useSariClock(animate, CYCLE_MS, REST_POSE);
  const { breathStyle, shadowStyle } = useSariBreathStyles(breath, unit);

  const origin0 = gearOrigin(0);
  const origin1 = gearOrigin(1);
  const origin2 = gearOrigin(2);

  // One full turn per loop, so the wrap from 1 back to 0 is seamless.
  const gear0Style = useAnimatedStyle(() => ({
    transformOrigin: origin0,
    transform: [{ rotate: `${cycle.value * 360}deg` }],
  }));
  const gear1Style = useAnimatedStyle(() => ({
    transformOrigin: origin1,
    transform: [{ rotate: `${-cycle.value * 360}deg` }],
  }));
  const gear2Style = useAnimatedStyle(() => ({
    transformOrigin: origin2,
    transform: [{ rotate: `${-cycle.value * 360}deg` }],
  }));

  const wrenchStyle = useAnimatedStyle(() => ({
    transformOrigin: '19% 45%',
    transform: [
      {
        rotate: `${interpolate(
          cycle.value,
          [0.15, 0.22, 0.29, 0.36, 0.43, 0.5],
          [0, -18, 6, -18, 6, 0],
          CLAMP,
        )}deg`,
      },
    ],
  }));

  const hatStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 14%',
    transform: [
      { translateY: interpolate(cycle.value, [0.62, 0.67, 0.76, 0.82], [0, -3 * unit, -3 * unit, 0], CLAMP) },
      { rotate: `${interpolate(cycle.value, [0.62, 0.67, 0.76, 0.82], [0, -10, -10, 0], CLAMP)}deg` },
    ],
  }));

  return (
    <>
      <SariLayer style={shadowStyle}>
        <SariShadow />
      </SariLayer>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, breathStyle]}>
        <SariLayer>
          <SariArmWrench />
          <SariLegs />
          <SariJar />
          <SariCheeks />
          <SariEyesOpen />
          <SariBrowsCurious />
          <SariMouthSmirk />
          <SariLid />
        </SariLayer>
        <SariLayer style={gear0Style}>
          <SariGear index={0} />
        </SariLayer>
        <SariLayer style={gear1Style}>
          <SariGear index={1} />
        </SariLayer>
        <SariLayer style={gear2Style}>
          <SariGear index={2} />
        </SariLayer>
        <SariLayer>
          <SariArmAkimbo side="right" />
        </SariLayer>
        <SariLayer style={wrenchStyle}>
          <SariWrench />
        </SariLayer>
        <SariLayer style={hatStyle}>
          <SariHardHat />
        </SariLayer>
      </Reanimated.View>
    </>
  );
}
