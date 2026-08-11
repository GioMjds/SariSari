import Svg, { Path } from 'react-native-svg';
import type { TabIconProps } from './types';

/**
 * Bahay — minimal house silhouette.
 * Angular roof pitch (straight lines to a point) + body + centered door.
 * The straight-line peak is the visual anchor that distinguishes this
 * from the curved Sales awning at a glance, even at 20-24px.
 */
export function Home({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Roof — straight pitch, apex at (12,4), eaves at (4,12) and (20,12) */}
      <Path
        d="M4 12 L12 4 L20 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body — rectangle, top edge implied by the roof's eave points */}
      <Path
        d="M4 12 L4 20 L20 20 L20 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Door — centered, open-top rectangle, floor line implied by body */}
      <Path
        d="M10 20 L10 14 L14 14 L14 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
