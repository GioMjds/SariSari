import { Image, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TourStepContent } from '@/constants/onboardingTour';
import { sariAssetFor } from '@/constants/onboardingTour.assets';

/**
 * TourCard — one illustration in the 5-step feature tour. Sari renders
 * full-bleed in a fixed 280pt area so the character stays anchored
 * across pages; below the image, a TAB label pill sits above a
 * display-weight headline and a two-line "what it does" / "when to use
 * it" pair.
 *
 * The whole card mounts with the Moti envelope used elsewhere in the
 * app (opacity + translateY + brief image scale). When the user has
 * Reduce Motion enabled, translate/scale collapse to opacity-only fades.
 */

type Props = {
	step: TourStepContent;
	/** Monotonically increasing key — change it to re-trigger the envelope. */
	stepKey: number | string;
};

export function TourCard({ step, stepKey }: Props) {
	const reducedMotion = useReducedMotion();

	return (
		<MotiView
			key={String(stepKey)}
			from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: 'timing', duration: 480, delay: 80 }}
			className="flex-1 items-center justify-center"
		>
			<MotiView
				from={{ scale: reducedMotion ? 1 : 0.96 }}
				animate={{ scale: 1 }}
				transition={{ type: 'timing', duration: 520, delay: 120 }}
				className="w-full items-center justify-center"
				style={{ height: 280 }}
			>
				<Image
					source={sariAssetFor(step.tab)}
					resizeMode="contain"
					accessibilityIgnoresInvertColors
					className="w-full h-full"
				/>
			</MotiView>

			<View className="w-full mt-6 items-center">
				<StatusPill variant="neutral" size="md">
					{step.label}
				</StatusPill>

				<StyledText
					variant="extrabold"
					className="text-ink-900 text-h1 text-center mt-4"
				>
					{step.headline}
				</StyledText>

				<StyledText
					variant="regular"
					className="text-ink-600 text-body text-center mt-2 px-2 leading-5"
				>
					{step.whatItDoes}
				</StyledText>

				<StyledText
					variant="medium"
					className="text-ink-500 text-caption italic text-center mt-3 px-2"
				>
					{step.whenToUseIt}
				</StyledText>
			</View>
		</MotiView>
	);
}
