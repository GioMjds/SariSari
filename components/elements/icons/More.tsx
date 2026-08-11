import Svg, { Circle } from 'react-native-svg';
import type { TabIconProps } from './types';

/**
 * Vertical ellipsis — three filled circles, equal radius, evenly
 * spaced. `strokeWidth` is unused (filled dots) and may still be
 * passed by callers for prop-shape compatibility.
 */
export function More({ size = 24, color = 'currentColor' }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={5.5} r={1.7} fill={color} />
      <Circle cx={12} cy={12} r={1.7} fill={color} />
      <Circle cx={12} cy={18.5} r={1.7} fill={color} />
    </Svg>
  );
}