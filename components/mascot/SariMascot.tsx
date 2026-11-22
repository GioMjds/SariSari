import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Prof } from '@/utils/perf';
import { memo, startTransition, useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SariBalanceCleared } from './states/SariBalanceCleared';
import { SariCustomers } from './states/SariCustomers';
import { SariDefault } from './states/SariDefault';
import { SariDelete } from './states/SariDelete';
import { SariEmpty } from './states/SariEmpty';
import { SariError } from './states/SariError';
import { SariExit } from './states/SariExit';
import { SariInventory } from './states/SariInventory';
import { SariLoading } from './states/SariLoading';
import { SariLowStock } from './states/SariLowStock';
import { SariOnboarding } from './states/SariOnboarding';
import { SariOutstandingBalance } from './states/SariOutstandingBalance';
import { SariReports } from './states/SariReports';
import { SariSaleRecorded } from './states/SariSaleRecorded';
import { SariSales } from './states/SariSales';
import { SariSettings } from './states/SariSettings';
import { SariUnimplemented } from './states/SariUnimplemented';
import { SariUtang } from './states/SariUtang';
import { SariUtangRecorded } from './states/SariUtangRecorded';
import { useScreenFocused } from './useScreenFocused';

import { Image } from 'expo-image';
import { SARI_STATES, type SariState } from './sariStates';
import { SARI_STILLS } from './sariStills';

export { SARI_STATES, type SariState };

interface SariMascotProps {
  state?: SariState;
  /** Square size in px. Default 120. */
  size?: number;
  /** Set false to render the still pose. Reduced Motion always forces still. */
  animated?: boolean;
  /** Build Sari after first paint in a low-priority render, leaving an empty slot until then. */
  defer?: boolean;
  /** When set, Sari is announced as an image. Otherwise Sari is decorative. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const SariMascot = memo(function SariMascot({
  state = 'default',
  size = 120,
  animated = true,
  defer = false,
  accessibilityLabel,
  style,
}: SariMascotProps) {
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(!defer);

  useEffect(() => {
    if (!ready) startTransition(() => setReady(true));
  }, [ready]);

  const focused = useScreenFocused();
  // A still Sari is a pre-rendered PNG; focus loss keeps the vector so it never remounts on blur.
  const still = !animated || reducedMotion;
  const animate = !still && focused;
  const a11y = accessibilityLabel
    ? ({
        accessible: true,
        accessibilityRole: 'image',
        accessibilityLabel,
      } as const)
    : ({
        accessible: false,
        importantForAccessibility: 'no-hide-descendants',
      } as const);

  return (
    <Prof id={`Sari:${state}:${size}`} min={4}>
      <View
        testID={`sari-mascot-${state}`}
        pointerEvents="none"
        style={[{ width: size, height: size }, style]}
        {...a11y}
      >
        {!ready ? null : still ? (
          <Image
            source={SARI_STILLS[state]}
            style={{ width: size, height: size }}
            priority={'normal'}
            contentFit="contain"
          />
        ) : (
          renderState(state, size, animate)
        )}
      </View>
    </Prof>
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
