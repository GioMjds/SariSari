import { useEffect, useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
import { SariStage } from '@/components/onboarding/SariStage';
import { OnboardingProfile } from '@/types/onboarding.types';
import { useTranslation } from 'react-i18next';
import {
	changeAppLanguage,
	SupportedLanguage,
} from '@/lib/i18n';

/**
 * ProfileStep — first screen of onboarding. Asks for the owner's name
 * and store name up front so Sari can address them by name later (on
 * the ready screen only). Sari introduces herself in a speech bubble
 * right above the form to set the "character is the app's voice" tone
 * for the rest of the tour.
 *
 * The parent owns validation: it bumps `submitAttempt` when the owner
 * tries to continue with a blank field. This component then shows an
 * inline message under each blank field and focuses the first one.
 *
 * Language picker: two options at the very top let the owner pick
 * English or Tagalog *before* reading anything else. Tapping one flips
 * the whole app's language live so the Profile form, the tour cards,
 * and the Ready screen all reflect the choice immediately.
 */

const NAME_MAX_LENGTH = 40;
const STORE_MAX_LENGTH = 60;

type Props = {
	profile: OnboardingProfile;
	onChange: (next: OnboardingProfile) => void;
	/** Number of failed attempts to continue. Above zero, errors show. */
	submitAttempt: number;
	/** Fired by the keyboard "done" key on the last field. */
	onSubmit: () => void;
};

export function ProfileStep({
	profile,
	onChange,
	submitAttempt,
	onSubmit,
}: Props) {
	const { t, i18n } = useTranslation();
	// Reactive: i18n.language from the hook re-renders when changeAppLanguage() fires
	const activeLang = i18n.language as SupportedLanguage;
	const nameRef = useRef<TextInput>(null);
	const storeRef = useRef<TextInput>(null);

	const nameMissing = profile.ownerName.trim().length === 0;
	const storeMissing = profile.storeName.trim().length === 0;
	const showNameError = submitAttempt > 0 && nameMissing;
	const showStoreError = submitAttempt > 0 && storeMissing;

	// Each failed attempt moves focus to the first blank field. Field
	// values are read at attempt time on purpose, not on every keystroke.
	useEffect(() => {
		if (submitAttempt === 0) return;
		// `focus?.()`: the jest host component exposes no focus method.
		if (nameMissing) nameRef.current?.focus?.();
		else if (storeMissing) storeRef.current?.focus?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [submitAttempt]);

	const handleSelectLanguage = async (lang: SupportedLanguage) => {
		if (lang === activeLang) return;
		await changeAppLanguage(lang);
	};

	return (
		<View className="flex-1">
			<View className="mb-5">
				<StyledText variant="medium" className="text-ink-700 text-sm mb-2">
					{t('onboarding:langPickerPrompt')}
				</StyledText>
				<View accessibilityRole="radiogroup" className="flex-row gap-2">
					<LanguageOption
						label={t('common:languageEnglish')}
						active={activeLang === 'en'}
						onPress={() => handleSelectLanguage('en')}
					/>
					<LanguageOption
						label={t('common:languageTagalog')}
						active={activeLang === 'tl'}
						onPress={() => handleSelectLanguage('tl')}
					/>
				</View>
			</View>

			<StyledText variant="extrabold" className="text-ink-900 text-h2">
				{t('onboarding:profileHeroTitle')}
			</StyledText>
			<StyledText variant="regular" className="text-ink-900 text-body mt-1 mb-4">
				{t('onboarding:profileHeroSub')}
			</StyledText>

			<SariStage
				mascot="onboarding"
				bubble={t('onboarding:profileIntro')}
				size={88}
			/>

			<View className="gap-4 mt-5">
				<View>
					<StyledText variant="medium" className="text-ink-700 mb-2 text-sm">
						{t('onboarding:profileNameLabel')}
					</StyledText>
					<TextInput
						ref={nameRef}
						value={profile.ownerName}
						onChangeText={(text) =>
							onChange({ ...profile, ownerName: text })
						}
						placeholder={t('onboarding:profileNamePlaceholder')}
						placeholderTextColor={ONBOARDING_COLORS.muted}
						autoCapitalize="words"
						autoCorrect={false}
						maxLength={NAME_MAX_LENGTH}
						returnKeyType="next"
						submitBehavior="submit"
						onSubmitEditing={() => storeRef.current?.focus()}
						accessibilityLabel={t('onboarding:profileNameLabel')}
						className={`min-h-[48px] bg-paper-50 border rounded-md px-4 py-3 text-ink-900 text-base ${
							showNameError ? 'border-semantic-danger' : 'border-paper-400'
						}`}
					/>
					{showNameError ? (
						<FieldError message={t('onboarding:profileNameError')} />
					) : null}
				</View>

				<View>
					<StyledText variant="medium" className="text-ink-700 mb-2 text-sm">
						{t('onboarding:profileStoreLabel')}
					</StyledText>
					<TextInput
						ref={storeRef}
						value={profile.storeName}
						onChangeText={(text) =>
							onChange({ ...profile, storeName: text })
						}
						placeholder={t('onboarding:profileStorePlaceholder')}
						placeholderTextColor={ONBOARDING_COLORS.muted}
						autoCapitalize="words"
						maxLength={STORE_MAX_LENGTH}
						returnKeyType="done"
						onSubmitEditing={onSubmit}
						accessibilityLabel={t('onboarding:profileStoreLabel')}
						className={`min-h-[48px] bg-paper-50 border rounded-md px-4 py-3 text-ink-900 text-base ${
							showStoreError ? 'border-semantic-danger' : 'border-paper-400'
						}`}
					/>
					{showStoreError ? (
						<FieldError message={t('onboarding:profileStoreError')} />
					) : null}
				</View>
			</View>
		</View>
	);
}

function FieldError({ message }: { message: string }) {
	return (
		<StyledText
			variant="medium"
			accessibilityLiveRegion="polite"
			className="text-semantic-danger text-caption mt-1.5"
		>
			{message}
		</StyledText>
	);
}

function LanguageOption({
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
			accessibilityRole="radio"
			accessibilityState={{ selected: active, checked: active }}
			className={`flex-1 min-h-[48px] rounded-md items-center justify-center border ${
				active
					? 'bg-cinnamon-500 border-cinnamon-500'
					: 'bg-paper-50 border-paper-400 active:bg-paper-100'
			}`}
		>
			<StyledText
				variant={active ? 'extrabold' : 'medium'}
				className={`text-sm ${active ? 'text-paper-50' : 'text-ink-900'}`}
			>
				{label}
			</StyledText>
		</Pressable>
	);
}
