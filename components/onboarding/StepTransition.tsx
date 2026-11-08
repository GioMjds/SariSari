import { ReactNode } from 'react';
import { MotiView } from 'moti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * StepTransition - enter animation shared by every onboarding step.
 * Forward steps slide in from the right, back steps from the left.
 * Changing `stepKey` remounts the child tree, which also resets any
 * local widget state. Reduce Motion falls back to a fade.
 */

type Props = {
  stepKey: number;
  direction: 1 | -1;
  children: ReactNode;
};

export function StepTransition({ stepKey, direction, children }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <MotiView
      key={stepKey}
      from={{ opacity: 0, translateX: reducedMotion ? 0 : 24 * direction }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      className="flex-1"
    >
      {children}
    </MotiView>
  );
}
