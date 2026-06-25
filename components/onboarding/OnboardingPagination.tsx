import { StepDots } from '@/components/onboarding/StepDots';

/**
 * OnboardingPagination — thin wrapper around `StepDots` that bakes in
 * the 7-step onboarding shape so the screen can pass a single
 * `currentIndex` (0..6) and a `maxReachableIndex` (the furthest index
 * the user has reached) without re-deriving the total step count.
 *
 * Tap-to-jump-to-visited is handled here by forwarding the tap only
 * when `index ≤ maxReachableIndex`.
 */

type Props = {
	currentIndex: number;
	maxReachableIndex: number;
	onJump: (index: number) => void;
};

export function OnboardingPagination({
	currentIndex,
	maxReachableIndex,
	onJump,
}: Props) {
	return (
		<StepDots
			currentIndex={currentIndex}
			totalSteps={7}
			maxReachableIndex={maxReachableIndex}
			onJump={onJump}
		/>
	);
}
