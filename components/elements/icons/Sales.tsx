import Svg, { Path } from 'react-native-svg';
import type { TabIconProps } from './types';

/**
 * Bilihan — minimal shopping bag silhouette.
 * Arched handle + tapered body, no roofline and no box shape, so this
 * reads as a completely different object from Home rather than a
 * variation on the same "peak + rectangle" theme.
 */
export function Sales({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Handle — arch above the bag opening, feet at (9,9) and (15,9) */}
      <Path
        d="M9 9 V6.5 Q9 4 12 4 Q15 4 15 6.5 V9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body — trapezoid, slightly narrower at the base */}
      <Path
        d="M6 9 L18 9 L17 20 L7 20 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
