import { ReactNode } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * HintRing - pulsing ring that marks the next tap target. Under Reduce
 * Motion it renders a static ring instead of pulsing.
 */

type Props = { active: boolean; children: ReactNode };

export function HintRing({ active, children }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <View className="relative">
      {active ? (
        <MotiView
          pointerEvents="none"
          from={{ opacity: 0.9, scale: 1 }}
          animate={{
            opacity: reducedMotion ? 0.9 : 0,
            scale: reducedMotion ? 1 : 1.1,
          }}
          transition={{ type: 'timing', duration: 1100, loop: !reducedMotion }}
          className="absolute inset-0 rounded-2xl border-2 border-persimmon-400"
        />
      ) : null}
      {children}
    </View>
  );
}
