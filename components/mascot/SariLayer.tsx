import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { SARI_VIEWBOX } from './sariPalette';

interface SariLayerProps {
  children: ReactNode;
  /** Animated style. Set `transformOrigin` to the part's pivot in percent. */
  style?: StyleProp<ViewStyle>;
}

/**
 * One animatable layer of the mascot. Each moving part gets its own
 * full-size Svg inside a Reanimated.View, so transforms run on the UI
 * thread as plain view transforms instead of animated SVG props.
 */
export function SariLayer({ children, style }: SariLayerProps) {
  return (
    <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${SARI_VIEWBOX} ${SARI_VIEWBOX}`}>
        {children}
      </Svg>
    </Reanimated.View>
  );
}
