import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { SARI_COLORS as C } from './sariPalette';
import { sparklePath } from './sariParts';

/**
 * Arms, faces and props for the screen-themed Sari states (inventory,
 * sales, utang, onboarding, delete, settings, reports, exit,
 * unimplemented). Same 200 x 200 viewBox and two-pass limb style as
 * `sariParts.tsx`.
 */

type Point = readonly [number, number];

const MIRROR = { transform: 'translate(200 0) scale(-1 1)' } as const;

interface LimbProps {
  d: string;
  /** Hand center. Omit for an arm whose hand is drawn on another layer. */
  hand?: Point;
  /** Finger strokes, drawn from the hand outward. */
  fingers?: readonly string[];
}

/** Two-pass limb: dark silhouette first, then the light fill on top. */
function Limb({ d, hand, fingers = [] }: LimbProps) {
  return (
    <G>
      <Path
        d={d}
        stroke={C.outline}
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
      {fingers.map((f) => (
        <Path
          key={`fo-${f}`}
          d={f}
          stroke={C.outline}
          strokeWidth={8.5}
          strokeLinecap="round"
        />
      ))}
      {hand ? (
        <Circle cx={hand[0]} cy={hand[1]} r={9.5} fill={C.outline} />
      ) : null}
      <Path
        d={d}
        stroke={C.limb}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      {fingers.map((f) => (
        <Path
          key={`fi-${f}`}
          d={f}
          stroke={C.limb}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      ))}
      {hand ? <Circle cx={hand[0]} cy={hand[1]} r={6} fill={C.limb} /> : null}
    </G>
  );
}

/** A lone hand, for grips drawn above the thing being held. */
export function SariHand({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={9.5} fill={C.outline} />
      <Circle cx={cx} cy={cy} r={6} fill={C.limb} />
      <Path
        d={`M${cx - 4} ${cy - 2} Q${cx} ${cy - 5} ${cx + 4} ${cy - 2}`}
        stroke={C.outline}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Shared faces                                                        */
/* ------------------------------------------------------------------ */

/** Closed, soft smile. */
export function SariMouthSmile() {
  return (
    <Path
      d="M90 115 Q100 124 110 115"
      stroke={C.outline}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** Brows raised high and relaxed. */
export function SariBrowsHigh() {
  return (
    <G>
      <Path
        d="M77 82 Q84 77 91 80"
        stroke={C.outline}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M109 80 Q116 77 123 82"
        stroke={C.outline}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/** Hand on the hip. Viewer-right by default; `left` mirrors it. */
export function SariArmAkimbo({ side = 'right' }: { side?: 'left' | 'right' }) {
  return (
    <G {...(side === 'left' ? MIRROR : {})}>
      <Limb d="M142 110 Q168 122 147 140" hand={[146, 141]} />
    </G>
  );
}

/**
 * Viewer-left arm raised with the hand at (38, 70), for holding up a
 * coin or a flag. Pivot: shoulder (58, 112) -> '29% 56%'.
 */
export function SariArmHoldUp() {
  return <Limb d="M58 112 Q40 106 38 78" hand={[38, 70]} />;
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

const BOXES: readonly (readonly [number, number, string])[] = [
  [76, 148, C.boxCream],
  [89, 148, C.boxOrange],
  [102, 148, C.boxCream],
  [115, 148, C.boxOrange],
  [89, 135, C.boxCream],
  [102, 135, C.boxOrange],
  [115, 135, C.boxCream],
  [115, 122, C.boxOrange],
];

/** Stacked stock boxes inside the jar. */
export function SariBoxes() {
  return (
    <G>
      {BOXES.map(([x, y, fill]) => (
        <G key={`box-${x}-${y}`}>
          <Rect
            x={x}
            y={y}
            width={13}
            height={13}
            rx={1.5}
            fill={fill}
            stroke={C.outline}
            strokeWidth={2}
          />
          <Path
            d={`M${x + 3} ${y + 3.5} L${x + 10} ${y + 3.5}`}
            stroke={C.highlight}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.8}
          />
        </G>
      ))}
    </G>
  );
}

/** Round reading glasses over the eyes. */
export function SariGlasses() {
  return (
    <G>
      <Rect
        x={74}
        y={90}
        width={20}
        height={16}
        rx={5}
        fill={C.highlight}
        fillOpacity={0.25}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Rect
        x={106}
        y={90}
        width={20}
        height={16}
        rx={5}
        fill={C.highlight}
        fillOpacity={0.25}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Path
        d="M94 97 Q100 94 106 97"
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M74 96 L68 94 M126 96 L132 94"
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </G>
  );
}

/** Small pursed "hmm" mouth. */
export function SariMouthHmm() {
  return (
    <Path
      d="M94 117 Q101 114 107 117"
      stroke={C.outline}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

const CLIPBOARD_TILT = 'rotate(-12 60 128)';

/**
 * Viewer-left arm hugging a clipboard. Pivot: shoulder (58, 112) -> '29% 56%'.
 */
export function SariArmClipboard() {
  return (
    <G>
      <G transform={CLIPBOARD_TILT}>
        <Rect
          x={46}
          y={110}
          width={28}
          height={36}
          rx={3}
          fill={C.wood}
          stroke={C.outline}
          strokeWidth={2.5}
        />
        <Rect x={50} y={116} width={20} height={26} fill={C.paper} />
        <Path
          d="M53 122 L67 122 M53 128 L67 128 M53 134 L63 134"
          stroke={C.paperLine}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Rect
          x={55}
          y={106}
          width={10}
          height={6}
          rx={2}
          fill={C.steel}
          stroke={C.outline}
          strokeWidth={2}
        />
      </G>
      <Limb d="M58 112 Q40 136 62 140" hand={[64, 138]} />
    </G>
  );
}

/** Check mark on the clipboard. Pivot: (59, 124) -> '29.5% 62%'. */
export function SariClipboardCheck() {
  return (
    <G transform={CLIPBOARD_TILT}>
      <Path
        d="M53 124 L57 128 L65 118"
        stroke={C.sparkleSage}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </G>
  );
}

/**
 * Viewer-right arm with a finger on the chin, thinking.
 * Pivot: shoulder (142, 114) -> '71% 57%'.
 */
export function SariArmChin() {
  return (
    <Limb
      d="M142 114 Q158 140 120 132"
      hand={[116, 130]}
      fingers={['M114 126 L110 121']}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Sales                                                               */
/* ------------------------------------------------------------------ */

/** Gold coin held up. Spin with scaleX around (34, 52) -> '17% 26%'. */
export function SariCoin() {
  return (
    <G>
      <Circle
        cx={31.5}
        cy={53}
        r={13}
        fill={C.coinEdge}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Circle
        cx={34}
        cy={52}
        r={13}
        fill={C.candyYellow}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Circle
        cx={34}
        cy={52}
        r={8.5}
        fill="none"
        stroke={C.coinEdge}
        strokeWidth={1.6}
      />
      <Path
        d="M28 47 Q30 44 34 43.5"
        stroke={C.highlight}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

const PILE: readonly Point[] = [
  [94, 144],
  [112, 141],
  [82, 152],
  [122, 150],
  [104, 155],
];

/** Coins piled at the bottom of the jar. */
export function SariCoinPile() {
  return (
    <G>
      {PILE.map(([cx, cy]) => (
        <G key={`coin-${cx}-${cy}`}>
          <Path
            d={`M${cx - 11} ${cy} L${cx - 11} ${cy + 3.5} A11 4.5 0 0 0 ${cx + 11} ${cy + 3.5} L${cx + 11} ${cy} Z`}
            fill={C.coinEdge}
            stroke={C.outline}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Ellipse
            cx={cx}
            cy={cy}
            rx={11}
            ry={4.5}
            fill={C.candyYellow}
            stroke={C.outline}
            strokeWidth={2}
          />
        </G>
      ))}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Utang                                                               */
/* ------------------------------------------------------------------ */

const BARS: readonly (readonly [number, number, string])[] = [
  [66, 10, C.candyRed],
  [72.5, 6, C.candyYellow],
  [79, 13, C.barBlue],
  [85.5, 9, C.barGreen],
];

/**
 * Small bar chart printed low on the jar, under the hugging arm.
 * Grow from the base: pivot (76, 159).
 */
export function SariBarChart() {
  return (
    <G>
      {BARS.map(([x, h, fill]) => (
        <Rect
          key={`bar-${x}`}
          x={x}
          y={158 - h}
          width={5}
          height={h}
          fill={fill}
        />
      ))}
    </G>
  );
}

/** Chart axis, kept still while the bars grow. */
export function SariBarAxis() {
  return (
    <Path
      d="M63 143 L63 159 L92 159"
      stroke={C.outline}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

/**
 * Both arms hugging a ledger book. Pivot: book center (112, 132) -> '56% 66%'.
 */
export function SariArmsLedger() {
  return (
    <G>
      <Limb d="M142 112 Q158 136 132 140" />
      <G transform="rotate(8 112 132)">
        <Path
          d="M128 110 L131 112 L131 154 L128 152 Z"
          fill={C.paper}
          stroke={C.outline}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Rect
          x={96}
          y={108}
          width={32}
          height={44}
          rx={2}
          fill={C.book}
          stroke={C.outline}
          strokeWidth={2.5}
        />
        <Rect
          x={96}
          y={108}
          width={5}
          height={44}
          fill={C.bookSpine}
          stroke={C.outline}
          strokeWidth={2}
        />
        <Path
          d="M106 120 L122 120"
          stroke={C.outline}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d="M106 126 L120 126"
          stroke={C.outline}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </G>
      <Limb d="M58 112 Q48 142 92 138" hand={[96, 136]} />
      <SariHand cx={131} cy={140} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Onboarding                                                          */
/* ------------------------------------------------------------------ */

/**
 * Arm flung wide open in welcome. Left side by default, pivot
 * (58, 110) -> '29% 55%'; `right` mirrors it, pivot '71% 55%'.
 */
export function SariArmOpen({ side }: { side: 'left' | 'right' }) {
  return (
    <G {...(side === 'right' ? MIRROR : {})}>
      <Limb
        d="M58 110 Q40 102 27 87"
        hand={[24, 82]}
        fingers={[
          'M24 80 L12 76',
          'M24 80 L13 68',
          'M24 80 L20 63',
          'M24 80 L29 66',
        ]}
      />
    </G>
  );
}

/** Little sari-sari store inside the jar. Pop from its base (100, 156) -> '50% 78%'. */
export function SariShop() {
  return (
    <G>
      <Rect
        x={78}
        y={134}
        width={44}
        height={22}
        fill={C.shopWall}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Rect
        x={104}
        y={134}
        width={18}
        height={22}
        fill={C.sparkleSage}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Rect
        x={108}
        y={140}
        width={10}
        height={16}
        fill={C.wood}
        stroke={C.outline}
        strokeWidth={2}
      />
      <Circle cx={116} cy={148.5} r={1} fill={C.cardGold} />
      <Rect
        x={83}
        y={139}
        width={15}
        height={10}
        fill={C.shopWindow}
        stroke={C.outline}
        strokeWidth={2}
      />
      <Path
        d="M90.5 139 L90.5 149 M83 144 L98 144"
        stroke={C.outline}
        strokeWidth={1.3}
      />
      <Path
        d="M73 135 L84 122 L116 122 L127 135 Z"
        fill={C.lid}
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M80 128.5 L120 128.5"
        stroke={C.outline}
        strokeWidth={1.2}
        opacity={0.6}
      />
      <Rect
        x={89}
        y={124}
        width={22}
        height={6.5}
        rx={1.2}
        fill={C.paper}
        stroke={C.outline}
        strokeWidth={1.5}
      />
    </G>
  );
}

/** Name plaque on the lid front. */
export function SariLidPlaque() {
  return (
    <G>
      <Rect
        x={88}
        y={39}
        width={24}
        height={9}
        rx={2}
        fill={C.candyYellow}
        stroke={C.outline}
        strokeWidth={2}
      />
      <Path
        d="M93 43.5 L107 43.5"
        stroke={C.outline}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Delete                                                              */
/* ------------------------------------------------------------------ */

/** Warning triangle printed on the jar. Pulse around (100, 140) -> '50% 70%'. */
export function SariWarning() {
  return (
    <G>
      <Path
        d="M100 125 L114 150 L86 150 Z"
        fill={C.alert}
        stroke={C.alert}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M100 133 L100 141"
        stroke={C.highlight}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Circle cx={100} cy={146} r={1.9} fill={C.highlight} />
    </G>
  );
}

/** Stern brows, slightly furrowed. */
export function SariBrowsStern() {
  return (
    <G>
      <Path
        d="M77 84 Q84 80 91 85"
        stroke={C.outline}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M109 85 Q116 80 123 84"
        stroke={C.outline}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/** Flat, serious mouth. */
export function SariMouthFlat() {
  return (
    <Path
      d="M92 118 L108 117"
      stroke={C.outline}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

/** Viewer-left fist pressed to the chest. */
export function SariArmFistChest() {
  return (
    <G>
      <Limb d="M58 112 Q42 136 74 134" hand={[78, 132]} />
      <Path
        d="M74 130 Q78 127 82 130"
        stroke={C.outline}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/** Viewer-right arm holding up a shield. Pivot: shield center (132, 130) -> '66% 65%'. */
export function SariArmShield() {
  return (
    <G>
      <Limb d="M142 112 Q160 122 146 132" />
      <Path
        d="M132 102 Q142 108 152 106 L152 126 Q152 146 132 156 Q112 146 112 126 L112 106 Q122 108 132 102 Z"
        fill={C.shield}
        stroke={C.outline}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M132 108 L132 150"
        stroke={C.shieldShade}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M118 112 Q118 124 119 132"
        stroke={C.highlight}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/** Hard hat perched on the lid. Pivot: brim center (100, 28) -> '50% 14%'. */
export function SariHardHat() {
  return (
    <G>
      <Path
        d="M84 26 Q84 8 100 8 Q116 8 116 26 Z"
        fill={C.lid}
        stroke={C.outline}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M100 9 L100 24"
        stroke={C.outline}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M90 14 Q92 11 95 10"
        stroke={C.highlight}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <Path
        d="M77 25 L123 25 Q125 29 121 30 L79 30 Q75 29 77 25 Z"
        fill={C.lidTop}
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </G>
  );
}

/** Viewer-left arm raised for the wrench, hand drawn by SariWrench. */
export function SariArmWrench() {
  return <Limb d="M58 112 Q38 112 38 94" />;
}

/** Wrench gripped at (38, 90). Pivot: the grip -> '19% 45%'. */
export function SariWrench() {
  return (
    <G>
      <Path
        d="M38 106 L36 62"
        stroke={C.outline}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Path
        d="M38 106 L36 62"
        stroke={C.steel}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Circle
        cx={36}
        cy={56}
        r={9}
        fill={C.steel}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Rect x={33} y={46} width={6} height={9} fill={C.outline} />
      <Circle cx={38} cy={104} r={1.6} fill={C.steelDark} />
      <SariHand cx={38} cy={90} />
    </G>
  );
}

function gearPath(cx: number, cy: number, r: number, teeth: number) {
  const inner = r * 0.76;
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const corners: readonly Point[] = [
      [a - step * 0.27, inner],
      [a - step * 0.13, r],
      [a + step * 0.13, r],
      [a + step * 0.27, inner],
    ];
    for (const [ang, rad] of corners) {
      pts.push(
        `${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`,
      );
    }
  }
  return `M${pts.join(' L')} Z`;
}

/**
 * Gears inside the jar. Each gear sits on its own layer and spins
 * around its own center (see SARI_GEARS).
 */
export const SARI_GEARS = [
  { cx: 84, cy: 142, r: 12, teeth: 8 },
  { cx: 104, cy: 150, r: 9, teeth: 7 },
  { cx: 120, cy: 136, r: 11, teeth: 8 },
] as const;

export function SariGear({ index }: { index: 0 | 1 | 2 }) {
  const g = SARI_GEARS[index];
  return (
    <G>
      <Path
        d={gearPath(g.cx, g.cy, g.r, g.teeth)}
        fill={C.steel}
        stroke={C.outline}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle
        cx={g.cx}
        cy={g.cy}
        r={g.r * 0.36}
        fill={C.glass}
        stroke={C.outline}
        strokeWidth={2}
      />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

const HAT_APEX: Point = [136, 1];
const HAT_LEFT: Point = [112, 28];
const HAT_RIGHT: Point = [140, 26];

function along(p: Point, t: number): string {
  return `${HAT_APEX[0] + (p[0] - HAT_APEX[0]) * t} ${HAT_APEX[1] + (p[1] - HAT_APEX[1]) * t}`;
}

function hatBand(t1: number, t2: number) {
  return `M${along(HAT_LEFT, t1)} L${along(HAT_RIGHT, t1)} L${along(HAT_RIGHT, t2)} L${along(HAT_LEFT, t2)} Z`;
}

/** Striped party hat on the lid. Pivot: base center (126, 27) -> '63% 13.5%'. */
export function SariPartyHat() {
  return (
    <G>
      <Path
        d={`M${along(HAT_LEFT, 1)} L${HAT_APEX[0]} ${HAT_APEX[1]} L${along(HAT_RIGHT, 1)} Z`}
        fill={C.barBlue}
      />
      <Path d={hatBand(0.32, 0.46)} fill={C.candyRed} />
      <Path d={hatBand(0.62, 0.76)} fill={C.candyYellow} />
      <Path
        d={`M${along(HAT_LEFT, 1)} L${HAT_APEX[0]} ${HAT_APEX[1]} L${along(HAT_RIGHT, 1)} Z`}
        fill="none"
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Circle
        cx={HAT_APEX[0]}
        cy={HAT_APEX[1] + 1}
        r={4.5}
        fill={C.candyYellow}
        stroke={C.outline}
        strokeWidth={2}
      />
    </G>
  );
}

/** Flag stick, drawn under the raised hand. */
export function SariFlagStick() {
  return (
    <Path
      d="M33 86 L50 26"
      stroke={C.wood}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

/** Flag cloth. Flutter with scaleX around the stick (48, 34) -> '24% 17%'. */
export function SariFlag() {
  return (
    <G>
      <Path
        d="M50 27 Q38 21 22 28 Q24 36 22 43 Q34 37 46 42 Z"
        fill={C.paper}
        stroke={C.outline}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path
        d="M47 30.5 Q37 26 26 31"
        stroke={C.candyRed}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M29 36 Q36 33 43 36"
        stroke={C.barBlue}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

/** Chart card printed on the jar. The arrow sits on its own layer. */
export function SariChartCard() {
  return (
    <G>
      <Rect
        x={76}
        y={122}
        width={48}
        height={32}
        rx={3}
        fill={C.paper}
        fillOpacity={0.9}
        stroke={C.outline}
        strokeWidth={2}
      />
      <Path
        d="M81 127 L81 149 L119 149"
        stroke={C.outline}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M88 149 L88 144 M96 149 L96 141 M104 149 L104 145 M112 149 L112 139"
        stroke={C.paperLine}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </G>
  );
}

/** Rising green arrow. Pivot: (100, 138) -> '50% 69%'. */
export function SariChartArrow() {
  const d = 'M84 146 L93 136 L101 142 L113 130';
  return (
    <G>
      <Path
        d={d}
        stroke={C.outline}
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d={d}
        stroke={C.arrowGreen}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M108 128 L118 125 L115 135 Z"
        fill={C.arrowGreen}
        stroke={C.outline}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </G>
  );
}

type Confetto = {
  x: number;
  y: number;
  kind: 'dot' | 'chip' | 'star';
  fill: string;
};

const CONFETTI: Record<'a' | 'b', readonly Confetto[]> = {
  a: [
    { x: 30, y: 96, kind: 'dot', fill: C.barBlue },
    { x: 168, y: 42, kind: 'chip', fill: C.candyRed },
    { x: 178, y: 98, kind: 'star', fill: C.candyYellow },
    { x: 154, y: 12, kind: 'dot', fill: C.barGreen },
    { x: 18, y: 134, kind: 'chip', fill: C.barGreen },
  ],
  b: [
    { x: 64, y: 14, kind: 'star', fill: C.candyYellow },
    { x: 186, y: 66, kind: 'dot', fill: C.barBlue },
    { x: 12, y: 62, kind: 'chip', fill: C.candyYellow },
    { x: 174, y: 140, kind: 'chip', fill: C.barGreen },
    { x: 88, y: 6, kind: 'dot', fill: C.candyRed },
  ],
};

/** Party confetti, in two sets that fall out of phase. */
export function SariConfetti({ set }: { set: 'a' | 'b' }) {
  return (
    <G>
      {CONFETTI[set].map((c) => {
        const key = `${c.x}-${c.y}`;
        if (c.kind === 'dot')
          return <Circle key={key} cx={c.x} cy={c.y} r={3} fill={c.fill} />;
        if (c.kind === 'chip') {
          return (
            <Rect
              key={key}
              x={c.x - 3}
              y={c.y - 3}
              width={6}
              height={6}
              fill={c.fill}
              transform={`rotate(25 ${c.x} ${c.y})`}
            />
          );
        }
        return <Path key={key} d={sparklePath(c.x, c.y, 5)} fill={c.fill} />;
      })}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Exit                                                                */
/* ------------------------------------------------------------------ */

const BEANS: readonly (readonly [number, number, number, string])[] = [
  [80, 142, -15, C.candyRed],
  [97, 134, 10, C.barBlue],
  [100, 148, -8, C.candyYellow],
  [116, 137, 20, C.barGreen],
  [120, 151, -20, C.candyRed],
];

/** Jelly beans at the bottom of the jar. */
export function SariBeans() {
  return (
    <G>
      {BEANS.map(([cx, cy, rot, fill]) => (
        <G key={`bean-${cx}-${cy}`} transform={`rotate(${rot} ${cx} ${cy})`}>
          <Ellipse
            cx={cx}
            cy={cy}
            rx={7}
            ry={4.5}
            fill={fill}
            stroke={C.outline}
            strokeWidth={2}
          />
          <Ellipse
            cx={cx - 2}
            cy={cy - 1.5}
            rx={2}
            ry={1}
            fill={C.highlight}
            opacity={0.8}
          />
        </G>
      ))}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Unimplemented                                                       */
/* ------------------------------------------------------------------ */

/** Viewer-left arm reaching up to the lid. Hand drawn by SariHand at (60, 42). */
export function SariArmLift() {
  return <Limb d="M58 116 Q34 100 56 48" />;
}

/** Dark jar opening, hidden by the lid until it lifts. */
export function SariJarMouth() {
  return <Ellipse cx={100} cy={48} rx={37} ry={4} fill={C.jarMouth} />;
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(
      `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`,
    );
  }
  return `M${pts.join(' L')} Z`;
}

/** Golden "coming soon" card peeking out of the jar. Pivot: (100, 44) -> '50% 22%'. */
export function SariStarCard() {
  return (
    <G transform="rotate(-18 100 44)">
      <Rect
        x={88}
        y={30}
        width={24}
        height={28}
        rx={4}
        fill={C.cardGold}
        stroke={C.outline}
        strokeWidth={2.5}
      />
      <Rect x={92} y={34} width={16} height={20} rx={2} fill={C.cardLight} />
      <Path
        d={starPath(100, 44, 6, 2.6)}
        fill={C.cardGold}
        stroke={C.outline}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </G>
  );
}

/** Sparkles over the open jar. */
export function SariPeekSparkles() {
  return (
    <G>
      {[
        [150, 22, 7],
        [164, 42, 5],
        [138, 8, 4.5],
      ].map(([x = 0, y = 0, r = 0]) => (
        <Path
          key={`ps-${x}`}
          d={sparklePath(x, y, r)}
          fill={C.candyYellow}
          stroke={C.outline}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

/** Small outlined heart centered on (cx, cy). Float it from its own center. */
export function SariHeart({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  const d = `M${cx} ${cy + r}
    C${cx - r * 1.6} ${cy - r * 0.1} ${cx - r * 0.9} ${cy - r * 1.5} ${cx} ${cy - r * 0.55}
    C${cx + r * 0.9} ${cy - r * 1.5} ${cx + r * 1.6} ${cy - r * 0.1} ${cx} ${cy + r} Z`;
  return (
    <Path
      d={d}
      fill={C.candyRed}
      stroke={C.outline}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  );
}
