import { Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * StepDots — six progress dots that mirror the 7-step onboarding flow
 * (profile + 5 tour tabs + ready = 6 transitions worth of progress).
 *
 * Dots fade through on index change. Visited steps are tappable to jump
 * back; the current step pulses subtly; unvisited steps read as faint
 * surface-warm. Reduce Motion collapses the pulse to a static fill.
 */

type Props = {
	currentIndex: number; // 0..6
	totalSteps: number; // typically 7
	/**
	 * Furthest index the user has reached so far. Tap-to-jump is only
	 * allowed for indices ≤ `maxReachableIndex`. Pass `currentIndex`
	 * to disable jumps entirely.
	 */
	maxReachableIndex: number;
	onJump: (index: number) => void;
};

export function StepDots({
	currentIndex,
	totalSteps,
	maxReachableIndex,
	onJump,
}: Props) {
	const reducedMotion = useReducedMotion();

	return (
		<View
			accessibilityRole="progressbar"
			accessibilityValue={{
				min: 0,
				max: totalSteps - 1,
				now: currentIndex,
			}}
			className="flex-row items-center gap-1.5"
		>
			{Array.from({ length: totalSteps }).map((_, idx) => {
				const isCurrent = idx === currentIndex;
				const isVisited = idx <= maxReachableIndex;
				const isFuture = idx > maxReachableIndex;

				return (
					<Pressable
						key={idx}
						hitSlop={8}
						onPress={() => {
							if (isVisited && !isCurrent) onJump(idx);
						}}
						disabled={isFuture || isCurrent}
						accessibilityRole="button"
						accessibilityLabel={`Step ${idx + 1} of ${totalSteps}${
							isCurrent ? ', current' : isVisited ? ', visited' : ', locked'
						}`}
						className="items-center justify-center"
					>
						<MotiView
							key={`${currentIndex}-${idx}`}
							from={{ opacity: 0.4, scale: reducedMotion ? 1 : 0.85 }}
							animate={{
								opacity: isCurrent ? 1 : isVisited ? 0.85 : 0.35,
								scale: 1,
							}}
							transition={{ type: 'timing', duration: 240 }}
							className={`h-2 rounded-full ${
								isCurrent
									? 'w-6 bg-persimmon-500'
									: 'w-2 bg-ink-300'
							}`}
						/>
					</Pressable>
				);
			})}
		</View>
	);
}
