import { TabKey, TOUR_ORDER } from '../constants/onboardingTour';

/**
 * onboardingStepMachine — pure functions over a 7-step onboarding flow.
 *
 *   index 0 → profile (collects owner + store name)
 *   index 1..5 → tour, one per TabKey in TOUR_ORDER
 *   index 6 → ready (CTA persists profile + routes to /(tabs))
 *
 * Kept side-effect free so the screen component stays a thin renderer
 * and the unit tests can exercise the navigation logic without React.
 *
 * The "max reachable index" lives outside the step value: it tracks
 * the furthest step the user has reached, so tap-to-jump on the dot
 * pagination can offer a back-step shortcut without ever letting the
 * user skip ahead of where they've been.
 */

export type Step =
	| { kind: 'profile' }
	| { kind: 'tour'; tab: TabKey }
	| { kind: 'ready' };

export const TOTAL_STEPS = 7;
export const PROFILE_INDEX = 0;
export const TOUR_START_INDEX = 1;
export const TOUR_END_INDEX = 5; // index of the last tour step (TOUR_ORDER[4])
export const READY_INDEX = 6;

/** Convert a step into its 0..6 ordinal. */
export function indexOf(step: Step): number {
	switch (step.kind) {
		case 'profile':
			return PROFILE_INDEX;
		case 'tour': {
			const i = TOUR_ORDER.indexOf(step.tab);
			return i < 0 ? PROFILE_INDEX : TOUR_START_INDEX + i;
		}
		case 'ready':
			return READY_INDEX;
	}
}

/** Convert a 0..6 ordinal into its step. Out-of-range → profile. */
export function stepAt(index: number): Step {
	if (index <= PROFILE_INDEX) return { kind: 'profile' };
	if (index >= READY_INDEX) return { kind: 'ready' };
	const tourIndex = index - TOUR_START_INDEX;
	const tab = TOUR_ORDER[tourIndex] ?? TOUR_ORDER[0];
	return { kind: 'tour', tab };
}

/** Clamp + advance one step. Returns the same step if already at end. */
export function next(step: Step): Step {
	const i = indexOf(step);
	if (i >= READY_INDEX) return step;
	return stepAt(i + 1);
}

/** Clamp + go back one step. Returns the same step if already at start. */
export function back(step: Step): Step {
	const i = indexOf(step);
	if (i <= PROFILE_INDEX) return step;
	return stepAt(i - 1);
}

/** Jump straight to ready from anywhere. */
export function skipToReady(): Step {
	return { kind: 'ready' };
}

/**
 * Jump to a specific ordinal. Refuses to advance past the furthest
 * step the user has already reached — this is what makes the dot
 * pagination a back-step shortcut rather than a free scroll bar.
 */
export function jumpTo(index: number, maxReachableIndex: number): Step {
	const clamped = Math.max(PROFILE_INDEX, Math.min(READY_INDEX, index));
	const target = Math.min(clamped, maxReachableIndex);
	return stepAt(target);
}

/** True if `target` is strictly before `current` (a back-step shortcut). */
export function canJumpBack(target: number, current: number): boolean {
	return target < current;
}
