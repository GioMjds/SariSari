import type { ComponentProps, ReactElement } from 'react';
import type Svg from 'react-native-svg';

export interface TabIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export type TabIconComponent = (
  props: TabIconProps,
) => ReactElement<ComponentProps<typeof Svg>>;
