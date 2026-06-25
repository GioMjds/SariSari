import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { StatusStamp } from '@/components/ui/StatusStamp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SARI_READY_ASSET } from '@/constants/onboardingTour.assets';
import { OnboardingProfile } from '@/types/onboarding.types';

/**
 * ReadyStep — final onboarding screen. A persimmon "READY" stamp sits
 * in the top-right of the Sari portrait, the headline interpolates the
 * owner's name (collected in ProfileStep), and the CTA persists the
 * profile + routes to the bottom-tab group.
 *
 * Profile interpolation is the only place the owner's name appears —
 * tour cards stay neutral so it doesn't read as saccharine.
 */

type Props = {
	profile: OnboardingProfile;
	saving: boolean;
	onOpenStore: () => void;
};

export function ReadyStep({ profile, saving, onOpenStore }: Props) {
	const reducedMotion = useReducedMotion();
	const trimmedName = profile.ownerName.trim();
	const trimmedStore = profile.storeName.trim();
	const canOpen =
		!saving && trimmedName.length > 0 && trimmedStore.length > 0;

	return (
		<MotiView
			from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: 'timing', duration: 480, delay: 80 }}
			className="flex-1"
		>
			<View className="items-center relative" style={{ height: 280 }}>
				<Image
					source={SARI_READY_ASSET}
					resizeMode="contain"
					accessibilityIgnoresInvertColors
					className="w-full h-full"
				/>
				<View className="absolute top-2 right-2">
					<StatusStamp label="READY" tone="persimmon" rotate={-8} />
				</View>
			</View>

			<View className="items-center mt-6 px-4">
				<StyledText
					variant="extrabold"
					className="text-ink-900 text-h1 text-center"
				>
					{trimmedName
						? `Nice to meet you, ${trimmedName}.`
						: 'Nice to meet you.'}
				</StyledText>

				<StyledText
					variant="regular"
					className="text-ink-600 text-body text-center mt-2"
				>
					{trimmedStore
						? `${trimmedStore} is ready to go.`
						: 'Your store is ready to go.'}
				</StyledText>
			</View>

			<View className="mt-8">
				<TouchableOpacity
					onPress={onOpenStore}
					disabled={!canOpen}
					accessibilityRole="button"
					accessibilityLabel="Open my store"
					accessibilityState={{ disabled: !canOpen }}
					className={`bg-persimmon-500 rounded-2xl py-4 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
						!canOpen ? 'opacity-50' : ''
					}`}
				>
					{saving ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<StyledText
							variant="semibold"
							className="text-white text-base"
						>
							Open my store →
						</StyledText>
					)}
				</TouchableOpacity>
			</View>
		</MotiView>
	);
}
