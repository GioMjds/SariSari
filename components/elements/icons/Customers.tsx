import Svg, { Path, Circle } from 'react-native-svg';
import type { TabIconProps } from './types';

/**
 * Mga suki — two identical customers standing side by side, not
 * overlapping. Reads unambiguously as "plural customers" with no
 * occlusion geometry to get wrong, and stays distinct from a future
 * single-person "My Account" icon elsewhere in the app.
 */
export function Customers({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left customer — head */}
      <Circle
        cx={7.5}
        cy={8}
        r={2.4}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Left customer — shoulders */}
      <Path
        d="M4 19 C4 15.7 5.5 13.6 7.5 13.6 C9.5 13.6 11 15.7 11 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right customer — head */}
      <Circle
        cx={16.5}
        cy={8}
        r={2.4}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Right customer — shoulders */}
      <Path
        d="M13 19 C13 15.7 14.5 13.6 16.5 13.6 C18.5 13.6 20 15.7 20 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
