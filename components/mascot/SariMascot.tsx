import { memo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScreenFocused } from './useScreenFocused';
import { SariDefault } from './states/SariDefault';
import { SariEmpty } from './states/SariEmpty';
import { SariError } from './states/SariError';
import { SariLoading } from './states/SariLoading';
import { SariLowStock } from './states/SariLowStock';
import { SariBalanceCleared } from './states/SariBalanceCleared';
import { SariOutstandingBalance } from './states/SariOutstandingBalance';
import { SariInventory } from './states/SariInventory';
import { SariSales } from './states/SariSales';
import { SariUtang } from './states/SariUtang';
import { SariOnboarding } from './states/SariOnboarding';
import { SariDelete } from './states/SariDelete';
import { SariSettings } from './states/SariSettings';
import { SariReports } from './states/SariReports';
import { SariExit } from './states/SariExit';
import { SariUnimplemented } from './states/SariUnimplemented';
import { SariCustomers } from './states/SariCustomers';
import { SariSaleRecorded } from './states/SariSaleRecorded';
import { SariUtangRecorded } from './states/SariUtangRecorded';

/** Every state Sari can act out. */
export const SARI_STATES = [
  'default',
  'empty',
  'error',
  'loading',
  'low-stock',
  'balance-cleared',
  'outstanding-balance',
  'inventory',
  'sales',
  'utang',
  'onboarding',
  'delete',
  'settings',
  'reports',
  'exit',
  'unimplemented',
  'customers',
  'sale-recorded',
  'utang-recorded',
] as const;

export type SariState = (typeof SARI_STATES)[number];

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
  const focused = useScreenFocused();
  // Loops stop when the screen is hidden (tabs stay mounted) or under Reduce Motion.
  const animate = animated && !reducedMotion && focused;
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
    case 'loading':
      return <SariLoading size={size} animate={animate} />;
    case 'low-stock':
      return <SariLowStock size={size} animate={animate} />;
    case 'balance-cleared':
      return <SariBalanceCleared size={size} animate={animate} />;
    case 'outstanding-balance':
      return <SariOutstandingBalance size={size} animate={animate} />;
    case 'inventory':
      return <SariInventory size={size} animate={animate} />;
    case 'sales':
      return <SariSales size={size} animate={animate} />;
    case 'utang':
      return <SariUtang size={size} animate={animate} />;
    case 'onboarding':
      return <SariOnboarding size={size} animate={animate} />;
    case 'delete':
      return <SariDelete size={size} animate={animate} />;
    case 'settings':
      return <SariSettings size={size} animate={animate} />;
    case 'reports':
      return <SariReports size={size} animate={animate} />;
    case 'exit':
      return <SariExit size={size} animate={animate} />;
    case 'customers':
      return <SariCustomers size={size} animate={animate} />;
    case 'sale-recorded':
      return <SariSaleRecorded size={size} animate={animate} />;
    case 'utang-recorded':
      return <SariUtangRecorded size={size} animate={animate} />;
    case 'unimplemented':
      return <SariUnimplemented size={size} animate={animate} />;
  }
}
