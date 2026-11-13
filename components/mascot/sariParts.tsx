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

/**
 * Arm raised in a wave. Defaults to the viewer-left arm, pivot
 * shoulder (60, 112) -> '30% 56%'. `right` mirrors it, pivot '70% 56%'.
 */
export function SariArmWave({ side = 'left' }: { side?: 'left' | 'right' }) {
  return (
    <G {...(side === 'right' ? { transform: 'translate(200 0) scale(-1 1)' } : {})}>
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

/** Jar body. `cleared` tints the glass green with a soft inner glow. */
export function SariJar({ tone = 'clear' }: { tone?: 'clear' | 'cleared' }) {
  const cleared = tone === 'cleared';
  return (
    <G>
      <Path d={JAR} fill={cleared ? C.glassCleared : C.glass} stroke={C.outline} strokeWidth={OUTLINE} strokeLinejoin="round" />
      {cleared ? <Ellipse cx={100} cy={112} rx={30} ry={32} fill={C.glassClearedGlow} opacity={0.7} /> : null}
      <Path d="M134 92 L134 146" stroke={cleared ? C.glassClearedShade : C.glassShade} strokeWidth={6} strokeLinecap="round" />
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

/** Small round "o" mouth, anticipating. */
export function SariMouthOoh() {
  return <Ellipse cx={100} cy={119} rx={4} ry={5} fill={C.outline} />;
}

export type SariCandyColor = 'red' | 'green' | 'yellow';

const CANDY_FILL: Record<SariCandyColor, string> = {
  red: C.candyRed,
  green: C.candyGreen,
  yellow: C.candyYellow,
};

/** Wrapped candy centered at (cx, cy). */
export function SariCandy({ cx, cy, color }: { cx: number; cy: number; color: SariCandyColor }) {
  const fill = CANDY_FILL[color];
  return (
    <G>
      <Path
        d={`M${cx - 6} ${cy} L${cx - 13} ${cy - 5} L${cx - 13} ${cy + 5} Z M${cx + 6} ${cy} L${cx + 13} ${cy - 5} L${cx + 13} ${cy + 5} Z`}
        fill={fill}
        stroke={C.outline}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={cx} cy={cy} r={7} fill={fill} stroke={C.outline} strokeWidth={2.5} />
      <Path d={`M${cx - 3} ${cy - 3} Q${cx - 1} ${cy - 5} ${cx + 2} ${cy - 4}`} stroke={C.highlight} strokeWidth={1.8} strokeLinecap="round" fill="none" />
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

/** Open frown with tongue, dismayed. */
export function SariMouthFrown() {
  return (
    <G>
      <Path d="M91 121 Q100 107 109 121 Z" fill={C.outline} stroke={C.outline} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M95 121 Q100 116 105 121 Z" fill={C.tongue} />
    </G>
  );
}

/** "!" printed on the jar below the mouth. Pivot: (100, 136) -> '50% 68%'. */
export function SariAlertMark() {
  return (
    <G>
      <Path d="M100 129 L100 137.5" stroke={C.alert} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={100} cy={144.5} r={2.9} fill={C.alert} />
    </G>
  );
}

const PRESENT_ARM = 'M142 114 Q160 124 172 116';
const PALM_FINGERS = ['M176 113 L189 111', 'M176 113 L188 105', 'M176 113 L184 100', 'M176 113 L175 101'];

/**
 * Viewer-right arm held out palm-up, presenting something to its right.
 * Pivot: shoulder (142, 114) -> '71% 57%'.
 */
export function SariArmPresent() {
  return (
    <G>
      <Path d={PRESENT_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      {PALM_FINGERS.map((d) => (
        <Path key={`po-${d}`} d={d} stroke={C.outline} strokeWidth={8.5} strokeLinecap="round" />
      ))}
      <Circle cx={175} cy={114} r={10} fill={C.outline} />
      <Path d={PRESENT_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      {PALM_FINGERS.map((d) => (
        <Path key={`pi-${d}`} d={d} stroke={C.limb} strokeWidth={3.2} strokeLinecap="round" />
      ))}
      <Circle cx={175} cy={114} r={6.5} fill={C.limb} />
    </G>
  );
}

/**
 * Empty wooden crate, open on top. Drawn in final viewBox coordinates
 * (not shifted with Sari). Front face spans x 124-180, y 132-184.
 * Pivot for a rattle: bottom center (152, 184) -> '76% 92%'.
 */
export function SariCrate() {
  return (
    <G>
      <Ellipse cx={160} cy={186} rx={36} ry={5} fill={C.shadow} opacity={0.55} />
      {/* Side face */}
      <Path d="M180 132 L196 120 L196 172 L180 184 Z" fill={C.crateSide} stroke={C.outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M188 130 L188 172" stroke={C.outline} strokeWidth={1.5} strokeLinecap="round" />
      {/* Top rim, with the empty inside showing */}
      <Path d="M124 132 L140 120 L196 120 L180 132 Z" fill={C.crate} stroke={C.outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M132 129.5 L143 122.5 L189 122.5 L177 129.5 Z" fill={C.crateInside} />
      {/* Front face with planks */}
      <Rect x={124} y={132} width={56} height={52} rx={2} fill={C.crate} stroke={C.outline} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={130} y={138} width={44} height={40} fill="none" stroke={C.outline} strokeWidth={2} />
      <Path d="M130 138 L174 178" stroke={C.outline} strokeWidth={2.2} />
      <Path d="M140 160 L140 176 M164 140 L164 156" stroke={C.crateInside} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M150 146 Q154 150 151 155" stroke={C.crateInside} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Wide open grin with tongue, cheering. */
export function SariMouthBigGrin() {
  return (
    <G>
      <Path d="M84 113 Q100 117 116 113 Q100 138 84 113 Z" fill={C.outline} stroke={C.outline} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M92 122 Q100 117 108 122 Q100 127 92 122 Z" fill={C.tongue} />
    </G>
  );
}

const CHEER_ARM = 'M58 110 Q40 100 36 74';

/**
 * Arm raised with a clenched fist. `left` is the viewer-left arm;
 * `right` mirrors it. Pivots: left shoulder (58, 110) -> '29% 55%',
 * right shoulder (142, 110) -> '71% 55%'.
 */
export function SariArmCheer({ side }: { side: 'left' | 'right' }) {
  return (
    <G {...(side === 'right' ? { transform: 'translate(200 0) scale(-1 1)' } : {})}>
      <Path d={CHEER_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Circle cx={36} cy={64} r={11.5} fill={C.outline} />
      <Path d={CHEER_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx={36} cy={64} r={8} fill={C.limb} />
      <Path d="M30 61 Q34 57 39 60" stroke={C.outline} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <Path d="M33 67 Q37 64 41 66" stroke={C.outline} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Four-point sparkle centered at (cx, cy). */
export function sparklePath(cx: number, cy: number, r: number) {
  return `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r} Z`;
}

const SPARKLES = {
  a: [
    { cx: 18, cy: 34, r: 8, fill: C.candyYellow },
    { cx: 184, cy: 96, r: 6, fill: C.sparkleSage },
    { cx: 100, cy: 12, r: 6, fill: C.candyYellow },
  ],
  b: [
    { cx: 182, cy: 32, r: 8, fill: C.candyYellow },
    { cx: 16, cy: 98, r: 6, fill: C.sparkleSage },
  ],
} as const;

/** Celebration sparkles, split into two sets that twinkle out of phase. */
export function SariSparkles({ set }: { set: 'a' | 'b' }) {
  return (
    <G>
      {SPARKLES[set].map((s) => (
        <Path
          key={`${s.cx}-${s.cy}`}
          d={sparklePath(s.cx, s.cy, s.r)}
          fill={s.fill}
          stroke={C.outline}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

/** Small closed patient smile. */
export function SariMouthPatient() {
  return <Path d="M93 117 Q100 121 107 117" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />;
}

/** Gently arched brows, a calm "just a reminder" look. */
export function SariBrowsArched() {
  return (
    <G>
      <Path d="M77 85 Q83 79 91 82" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M109 82 Q117 79 123 85" stroke={C.outline} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** Fulcrum of the balance scale printed on the jar. Sits under SariScaleBeam. */
export function SariScaleBase() {
  return <Path d="M106 137 L99 148 L113 148 Z" fill={C.alert} />;
}

/**
 * Balance beam with one pan, tipped toward the pan (money still owed).
 * Pivot: fulcrum tip (106, 137) -> '53% 68.5%'.
 */
export function SariScaleBeam() {
  return (
    <G transform="rotate(12 106 137)">
      <Path d="M82 137 L130 137" stroke={C.alert} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M118 126 L132 126 Q132 134 125 134 Q118 134 118 126 Z" fill={C.alert} />
    </G>
  );
}

const POINT_ARM = 'M58 110 Q42 128 64 132';
const POINT_FINGERS = ['M68 130 L80 131', 'M66 127 L68 120'];

/**
 * Viewer-left arm folded across the jar, index finger pointing at the
 * scale. Pivot: shoulder (58, 110) -> '29% 55%'.
 */
export function SariArmPoint() {
  return (
    <G>
      <Path d={POINT_ARM} stroke={C.outline} strokeWidth={12} strokeLinecap="round" fill="none" />
      {POINT_FINGERS.map((d) => (
        <Path key={`no-${d}`} d={d} stroke={C.outline} strokeWidth={8.5} strokeLinecap="round" />
      ))}
      <Circle cx={66} cy={132} r={9.5} fill={C.outline} />
      <Path d={POINT_ARM} stroke={C.limb} strokeWidth={6} strokeLinecap="round" fill="none" />
      {POINT_FINGERS.map((d) => (
        <Path key={`ni-${d}`} d={d} stroke={C.limb} strokeWidth={3.2} strokeLinecap="round" />
      ))}
      <Circle cx={66} cy={132} r={6} fill={C.limb} />
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
