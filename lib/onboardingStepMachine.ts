import { BEAT_ORDER, type BeatId } from '@/constants/onboardingDay';

/**
 * onboardingStepMachine - pure functions over the 6-step onboarding day.
 *
 *   index 0     -> profile (owner + store name)
 *   index 1..4  -> beat, one per BeatId in BEAT_ORDER
 *   index 5     -> ready (CTA persists profile + routes to /(tabs))
 *
 * Side-effect free so the screen stays a thin renderer and tests can
 * exercise navigation without React. Whether a beat is finished lives
 * in the day reducer, not here.
 */

export type Step =
  { kind: 'profile' } | { kind: 'beat'; beat: BeatId } | { kind: 'ready' };

export const TOTAL_STEPS = 6;
export const PROFILE_INDEX = 0;
export const BEAT_START_INDEX = 1;
export const READY_INDEX = 5;

export function indexOf(step: Step): number {
  switch (step.kind) {
    case 'profile':
      return PROFILE_INDEX;
    case 'beat': {
      const i = BEAT_ORDER.indexOf(step.beat);
      return i < 0 ? PROFILE_INDEX : BEAT_START_INDEX + i;
    }
    case 'ready':
      return READY_INDEX;
  }
}

export function stepAt(index: number): Step {
  if (index <= PROFILE_INDEX) return { kind: 'profile' };
  if (index >= READY_INDEX) return { kind: 'ready' };
  const beat = BEAT_ORDER[index - BEAT_START_INDEX] ?? 'cash';
  return { kind: 'beat', beat };
}

export function next(step: Step): Step {
  const i = indexOf(step);
  if (i >= READY_INDEX) return step;
  return stepAt(i + 1);
}

export function back(step: Step): Step {
  const i = indexOf(step);
  if (i <= PROFILE_INDEX) return step;
  return stepAt(i - 1);
}

export function skipToReady(): Step {
  return { kind: 'ready' };
}

/** Jump to an ordinal, never past the furthest step already reached. */
export function jumpTo(index: number, maxReachableIndex: number): Step {
  const clamped = Math.max(PROFILE_INDEX, Math.min(READY_INDEX, index));
  return stepAt(Math.min(clamped, maxReachableIndex));
}

export function canJumpBack(target: number, current: number): boolean {
  return target < current;
}
