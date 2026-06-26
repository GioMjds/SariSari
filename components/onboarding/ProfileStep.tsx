import { Image, Pressable, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { OnboardingProfile } from '@/types/onboarding.types';
import { SARI_PROFILE_ASSET } from '@/constants/onboardingTour.assets';
import { useTranslation } from 'react-i18next';
import {
	changeAppLanguage,
	getCurrentLanguage,
	SupportedLanguage,
} from '@/lib/i18n';

/**
 * ProfileStep — first screen of onboarding. Asks for the owner's name
 * and store name up front so Sari can address them by name later (on
 * the ready screen only). Sari introduces herself in a small speech
 * bubble above the form to set the "character is the app's voice"
 * tone for the rest of the tour.
 *
 * Validation lives in the parent (`handleSave` in `app/onboarding/index.tsx`)
 * so this component stays purely presentational.
 *
 * Language picker: two horizontal pill buttons at the top let the owner
 * pick English or Tagalog *before* the rest of the onboarding copy
 * renders. Tapping a pill flips the whole app's language live so the
 * Profile form, the tour cards, and the Ready screen all reflect the
 * choice immediately.
 */

type Props = {
	profile: OnboardingProfile;
	onChange: (next: OnboardingProfile) => void;
};

export function ProfileStep({ profile, onChange }: Props) {
	const reducedMotion = useReducedMotion();
	const { t } = useTranslation();

	const activeLang: SupportedLanguage = getCurrentLanguage();

	const handleSelectLanguage = async (lang: SupportedLanguage) => {
		if (lang === activeLang) return;
		await changeAppLanguage(lang);
	};

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

			{/* Language picker — sits at the top of the form so the rest
			    of the onboarding copy swaps language as soon as the user
			    taps. */}
			<View className="mb-5">
				<StyledText
					variant="extrabold"
					className="label-caps text-ink-400 mb-2"
				>
					{t('onboarding:langPickerPrompt')}
				</StyledText>
				<View className="flex-row gap-2">
					<LanguagePill
						label={t('common:languageEnglish')}
						active={activeLang === 'en'}
						onPress={() => handleSelectLanguage('en')}
					/>
					<LanguagePill
						label={t('common:languageTagalog')}
						active={activeLang === 'tl'}
						onPress={() => handleSelectLanguage('tl')}
					/>
				</View>
			</View>

			<View className="bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3 mt-2 mb-6 self-start w-full">
				<StyledText variant="medium" className="text-ink-700 text-sm">
					{t('onboarding:profileIntro')}
				</StyledText>
			</View>

			<View className="gap-4">
				<View>
					<StyledText
						variant="medium"
						className="text-ink-700 mb-2 text-sm"
					>
						{t('onboarding:profileNameLabel')}
					</StyledText>
					<TextInput
						value={profile.ownerName}
						onChangeText={(text) =>
							onChange({ ...profile, ownerName: text })
						}
						placeholder={t('onboarding:profileNamePlaceholder')}
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
						{t('onboarding:profileStoreLabel')}
					</StyledText>
					<TextInput
						value={profile.storeName}
						onChangeText={(text) =>
							onChange({ ...profile, storeName: text })
						}
						placeholder={t('onboarding:profileStorePlaceholder')}
						placeholderTextColor="#A89F90"
						autoCapitalize="words"
						className="bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3 text-ink-900"
					/>
				</View>
			</View>
		</MotiView>
	);
}

function LanguagePill({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityState={{ selected: active }}
			className={`flex-1 py-3 rounded-2xl items-center border ${
				active
					? 'bg-persimmon-500 border-persimmon-500'
					: 'bg-paper-100 border-paper-300'
			}`}
			style={{
				shadowColor: active ? '#E85A1F' : 'transparent',
				shadowOffset: { width: 0, height: 3 },
				shadowOpacity: active ? 0.25 : 0,
				shadowRadius: 8,
				elevation: active ? 3 : 0,
			}}
		>
			<StyledText
				variant={active ? 'extrabold' : 'medium'}
				className={`text-sm ${active ? 'text-paper-50' : 'text-cinnamon-700'}`}
			>
				{label}
			</StyledText>
		</Pressable>
	);
}