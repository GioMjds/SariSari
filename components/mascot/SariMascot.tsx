import { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SariDefault } from './states/SariDefault';
import { SariEmpty } from './states/SariEmpty';
import { SariError } from './states/SariError';

/**
 * States Sari can act out. Add one entry per state as each animation lands.
 */
export type SariState = 'default' | 'empty' | 'error';

interface SariMascotProps {
  state?: SariState;
  /** Square size in px. Default 120. */
  size?: number;
  /** Set false to render the still pose. Reduced Motion always forces still. */
  animated?: boolean;
  /** When set, Sari is announced as an image. Otherwise Sari is decorative. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animated vector Sari. Usage:
 *   <SariMascot state="default" size={120} />
 */
export const SariMascot = memo(function SariMascot({
  state = 'default',
  size = 120,
  animated = true,
  accessibilityLabel,
  style,
}: SariMascotProps) {
  const reducedMotion = useReducedMotion();
  const animate = animated && !reducedMotion;
  const a11y = accessibilityLabel
    ? ({ accessible: true, accessibilityRole: 'image', accessibilityLabel } as const)
    : ({ accessible: false, importantForAccessibility: 'no-hide-descendants' } as const);

  return (
    <View
      testID={`sari-mascot-${state}`}
      pointerEvents="none"
      style={[{ width: size, height: size }, style]}
      {...a11y}
    >
      {renderState(state, size, animate)}
    </View>
  );
});

function renderState(state: SariState, size: number, animate: boolean) {
  switch (state) {
    case 'default':
      return <SariDefault size={size} animate={animate} />;
    case 'empty':
      return <SariEmpty size={size} animate={animate} />;
    case 'error':
      return <SariError size={size} animate={animate} />;
  }
}
