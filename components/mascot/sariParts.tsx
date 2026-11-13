import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { SARI_COLORS as C } from './sariPalette';

/**
 * Static SVG pieces of Sari, drawn in a 200 x 200 viewBox.
 * Limbs use a two-pass silhouette (thick dark stroke, then thinner
 * light stroke) so joints merge without inner seams.
 *
 * Pivot points (used as transformOrigin by animated layers):
 *   wave arm shoulder  (60, 112)  -> '30% 56%'
 *   lid base           (100, 52)  -> '50% 26%'
 *   eyes center        (100, 98)  -> '50% 49%'
 *   ground contact     (100, 185) -> '50% 92.5%'
 */

const OUTLINE = 3.5;

export function SariShadow() {
  return <Ellipse cx={100} cy={185} rx={58} ry={9} fill={C.shadow} />;
}

export function SariLegs() {
  const legs = [84, 116];
  return (
    <G>
      {legs.map((x) => (
        <Path key={`lo-${x}`} d={`M${x} 158 L${x} 176`} stroke={C.outline} strokeWidth={13} strokeLinecap="round" />
      ))}
      {legs.map((x) => (
        <Path key={`li-${x}`} d={`M${x} 158 L${x} 176`} stroke={C.limb} strokeWidth={7} strokeLinecap="round" />
      ))}
      <Ellipse cx={80} cy={180} rx={11} ry={6} fill={C.limb} stroke={C.outline} strokeWidth={3} />
      <Ellipse cx={120} cy={180} rx={11} ry={6} fill={C.limb} stroke={C.outline} strokeWidth={3} />
    </G>
  );
}

const HIP_ARM = 'M140 108 Q160 116 159 142';

/** Arm hanging relaxed, hand at the side. `left` mirrors it to the viewer-left side. */
export function SariArmHip({ side = 'right' }: { side?: 'left' | 'right' }) {
  return (
    <G {...(side === 'left' ? { transform: 'translate(200 0) scale(-1 1)' } : {})}>
      <Path d={HIP_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Circle cx={158} cy={147} r={9.5} fill={C.outline} />
      <Path d={HIP_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={158} cy={147} r={6} fill={C.limb} />
    </G>
  );
}

const HOLD_ARM = 'M143 110 Q170 128 132 143';

/** Viewer-right arm reaching across the jar to hold the magnifier. */
export function SariArmHold() {
  return (
    <G>
      <Path d={HOLD_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d={HOLD_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
    </G>
  );
}

/**
 * Magnifying glass gripped by a hand. Pivot: hand (128, 143) -> '64% 71.5%'.
 * Lens center sits at (152, 102).
 */
export function SariMagnifier() {
  return (
    <G>
      <Path d="M126 148 L142 117" stroke={C.outline} strokeWidth={9} strokeLinecap="round" />
      <Path d="M126 148 L142 117" stroke={C.wood} strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={152} cy={102} r={16} fill={C.lens} fillOpacity={0.55} stroke={C.outline} strokeWidth={9} />
      <Circle cx={152} cy={102} r={16} fill="none" stroke={C.wood} strokeWidth={4.5} />
      <Path d="M143 98 Q145 91 151 90" stroke={C.highlight} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Circle cx={128} cy={143} r={9.5} fill={C.outline} />
      <Circle cx={128} cy={143} r={6} fill={C.limb} />
    </G>
  );
}

const WAVE_ARM = 'M62 112 Q40 106 36 78';
const FINGERS = ['M36 68 L24 60', 'M36 68 L28 52', 'M36 68 L37 49', 'M36 68 L45 54'];

/** Viewer-left arm raised in a wave. Pivot: shoulder (60, 112). */
export function SariArmWave() {
  return (
    <G>
      <Path d={WAVE_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      {FINGERS.map((d) => (
        <Path key={`fo-${d}`} d={d} stroke={C.outline} strokeWidth={9} strokeLinecap="round" />
      ))}
      <Circle cx={36} cy={69} r={11} fill={C.outline} />
      <Path d={WAVE_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      {FINGERS.map((d) => (
        <Path key={`fi-${d}`} d={d} stroke={C.limb} strokeWidth={3.5} strokeLinecap="round" />
      ))}
      <Circle cx={36} cy={69} r={7.5} fill={C.limb} />
    </G>
  );
}

const JAR =
  'M70 50 L130 50 Q144 52 144 68 L144 150 Q144 168 126 168 L74 168 Q56 168 56 150 L56 68 Q56 52 70 50 Z';

export function SariJar() {
  return (
    <G>
      <Path d={JAR} fill={C.glass} stroke={C.outline} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <Path d="M134 92 L134 146" stroke={C.glassShade} strokeWidth={6} strokeLinecap="round" />
      <Path d="M68 76 Q66 96 67 118" stroke={C.highlight} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d="M67 128 L67 136" stroke={C.highlight} strokeWidth={5} strokeLinecap="round" />
      <Path d="M64 154 Q100 146 136 156" stroke={C.outline} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function SariCheeks() {
  return (
    <G opacity={0.7}>
      <Ellipse cx={74} cy={111} rx={6} ry={3.5} fill={C.blush} />
      <Ellipse cx={126} cy={111} rx={6} ry={3.5} fill={C.blush} />
    </G>
  );
}

/** Open oval eyes with glints. Blink by scaling Y around (100, 98). */
export function SariEyesOpen() {
  return (
    <G>
      <Ellipse cx={84} cy={98} rx={5} ry={7} fill={C.outline} />
      <Ellipse cx={116} cy={98} rx={5} ry={7} fill={C.outline} />
      <Circle cx={85.8} cy={95.5} r={1.8} fill={C.highlight} />
      <Circle cx={117.8} cy={95.5} r={1.8} fill={C.highlight} />
    </G>
  );
}

/** Closed "^ ^" eyes, matching the static default art. */
export function SariEyesHappy() {
  return (
    <G>
      <Path d="M78 101 Q84 91 90 101" stroke={C.outline} strokeWidth={OUTLINE} strokeLinecap="round" fill="none" />
      <Path d="M110 101 Q116 91 122 101" stroke={C.outline} strokeWidth={OUTLINE} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Big curious eye whites. Pair with SariPupils on a separate layer. */
export function SariEyeWhites() {
  return (
    <G>
      <Ellipse cx={84} cy={97} rx={8} ry={10} fill={C.highlight} stroke={C.outline} strokeWidth={3} />
      <Ellipse cx={116} cy={97} rx={8} ry={10} fill={C.highlight} stroke={C.outline} strokeWidth={3} />
    </G>
  );
}

/** Pupils looking slightly right. Slide with translateX to look around. */
export function SariPupils() {
  return (
    <G>
      <Circle cx={86} cy={99} r={4.5} fill={C.outline} />
      <Circle cx={118} cy={99} r={4.5} fill={C.outline} />
      <Circle cx={87.5} cy={97.3} r={1.5} fill={C.highlight} />
      <Circle cx={119.5} cy={97.3} r={1.5} fill={C.highlight} />
    </G>
  );
}

/** Curious brows, right one cocked higher. */
export function SariBrowsCurious() {
  return (
    <G>
      <Path d="M76 81 Q84 75 92 80" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M108 78 Q116 71 124 76" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function SariMouthSmirk() {
  return <Path d="M92 119 Q101 126 110 116" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />;
}

/** Worried brows, inner ends raised. */
export function SariBrowsWorried() {
  return (
    <G>
      <Path d="M77 86 Q83 80 91 80" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M109 80 Q117 80 123 86" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

export function SariMouthSheepish() {
  return <Path d="M92 116 Q100 123 108 116" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />;
}

/** Bandage stuck diagonally on the lower-left of the jar. */
export function SariBandage() {
  return (
    <G transform="rotate(-40 88 140)">
      <Rect x={72} y={134.5} width={32} height={11} rx={5.5} fill={C.bandage} stroke={C.outline} strokeWidth={2.5} />
      <Rect x={83.5} y={136.5} width={9} height={7} rx={1.5} fill={C.bandagePad} stroke={C.outline} strokeWidth={1.5} />
    </G>
  );
}

/** Sweat drop on the upper-right of the jar. Slide with translateY. */
export function SariSweatDrop() {
  return (
    <G>
      <Path
        d="M134 64 Q141 74 140 78 Q138 84 133 84 Q128 84 127 78 Q127 74 134 64 Z"
        fill={C.sweat}
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path d="M131 76 Q131 79 133 80" stroke={C.highlight} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </G>
  );
}

const SCRATCH_ARM = 'M142 110 Q168 106 164 78';

/** Viewer-right arm raised, fist by the lid. Pivot: shoulder (142, 110) -> '71% 55%'. */
export function SariArmScratch() {
  return (
    <G>
      <Path d={SCRATCH_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Circle cx={163} cy={71} r={10} fill={C.outline} />
      <Path d={SCRATCH_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={163} cy={71} r={6.5} fill={C.limb} />
      <Path d="M158 69 Q161 66 165 67" stroke={C.outline} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Floating "?" above the viewer-right shoulder. Pivot: (176, 50) -> '88% 25%'. */
export function SariQuestionMark() {
  return (
    <G>
      <Path
        d="M167 32 Q167 22 176 22 Q185 22 185 31 Q185 38 177 41 L176 48"
        stroke={C.lid}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={176} cy={57} r={3.2} fill={C.lid} />
    </G>
  );
}

export function SariMouthOpenSmile() {
  return (
    <G>
      <Path d="M90 111 Q100 127 110 111 Z" fill={C.outline} stroke={C.outline} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M94 119 Q100 114.5 106 119 Q100 124 94 119 Z" fill={C.tongue} />
    </G>
  );
}

/** Lid. Pivot: base center (100, 52). */
export function SariLid() {
  return (
    <G>
      <Rect x={60} y={30} width={80} height={22} rx={7} fill={C.lid} stroke={C.outline} strokeWidth={OUTLINE} />
      <Ellipse cx={100} cy={31} rx={40} ry={7} fill={C.lidTop} stroke={C.outline} strokeWidth={OUTLINE} />
    </G>
  );
}
