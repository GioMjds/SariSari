import { Image, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { OnboardingProfile } from '@/types/onboarding.types';
import { SARI_PROFILE_ASSET } from '@/constants/onboardingTour.assets';

/**
 * ProfileStep — first screen of onboarding. Asks for the owner's name
 * and store name up front so Sari can address them by name later (on
 * the ready screen only). Sari introduces herself in a small speech
 * bubble above the form to set the "character is the app's voice"
 * tone for the rest of the tour.
 *
 * Validation lives in the parent (`handleSave` in `app/onboarding/index.tsx`)
 * so this component stays purely presentational.
 */

type Props = {
	profile: OnboardingProfile;
	onChange: (next: OnboardingProfile) => void;
};

export function ProfileStep({ profile, onChange }: Props) {
	const reducedMotion = useReducedMotion();

	return (
		<MotiView
			from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: 'timing', duration: 480, delay: 80 }}
			className="flex-1"
		>
			<View className="items-center" style={{ height: 220 }}>
				<Image
					source={SARI_PROFILE_ASSET}
					resizeMode="contain"
					accessibilityIgnoresInvertColors
					className="w-full h-full"
				/>
			</View>

			<View className="bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3 mt-2 mb-6 self-start w-full">
				<StyledText variant="medium" className="text-ink-700 text-sm">
					Hi! I&apos;m Sari, your store helper. What should I call you?
				</StyledText>
			</View>

			<View className="space-y-4">
				<View>
					<StyledText
						variant="medium"
						className="text-ink-700 mb-2 text-sm"
					>
						Your name
					</StyledText>
					<TextInput
						value={profile.ownerName}
						onChangeText={(text) =>
							onChange({ ...profile, ownerName: text })
						}
						placeholder="e.g. Aling Nena"
						placeholderTextColor="#A89F90"
						autoCapitalize="words"
						autoCorrect={false}
						className="bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3 text-ink-900"
					/>
				</View>

				<View>
					<StyledText
						variant="medium"
						className="text-ink-700 mb-2 text-sm"
					>
						And what&apos;s your store called?
					</StyledText>
					<TextInput
						value={profile.storeName}
						onChangeText={(text) =>
							onChange({ ...profile, storeName: text })
						}
						placeholder="e.g. Nena Sari-Sari"
						placeholderTextColor="#A89F90"
						autoCapitalize="words"
						className="bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3 text-ink-900"
					/>
				</View>
			</View>
		</MotiView>
	);
}
