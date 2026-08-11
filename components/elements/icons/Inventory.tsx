import Svg, { Path } from 'react-native-svg';
import type { TabIconProps } from './types';

/**
 * Kahon — minimal isometric box/package outline.
 * Top rhombus + two side edges meeting at a front-bottom point, with
 * the shared seam line doubling as the box's front corner. Standard
 * "package" glyph shape — reads clearly at any size without needing
 * product silhouettes inside it.
 */
export function Inventory({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top face — rhombus: apex 12,4 / right 19,7.5 / front 12,11 / left 5,7.5 */}
      <Path
        d="M12 4 L19 7.5 L12 11 L5 7.5 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left face edge — down from top-left corner to front-bottom point */}
      <Path
        d="M5 7.5 L5 15.5 L12 19 L12 11"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right face edge — down from top-right corner to front-bottom point */}
      <Path
        d="M19 7.5 L19 15.5 L12 19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
