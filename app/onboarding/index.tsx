import { StyledText } from '@/components/elements';
import { OnboardingPagination } from '@/components/onboarding/OnboardingPagination';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { ReadyStep } from '@/components/onboarding/ReadyStep';
import { TourCard } from '@/components/onboarding/TourCard';
import { ONBOARDING_TOUR_STEPS, TOUR_ORDER } from '@/constants/onboardingTour';
import { markOnboardingComplete } from '@/lib';
import {
	PROFILE_INDEX,
	Step,
	back,
	indexOf,
	jumpTo,
	next,
	skipToReady,
} from '@/lib/onboardingStepMachine';
import { useToastStore } from '@/stores';
import { OnboardingProfile } from '@/types';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * OnboardingPage — 7-step first-run flow:
 *
 *   profile → tour (dashboard → sell → inventory → utang → reports) → ready
 *
 * Step state is a discriminated union held in `useState`; ordinal
 * conversion lives in `lib/onboardingStepMachine.ts`. Profile state
 * is local until the user taps "Open my store" on the ready screen —
 * nothing is persisted mid-tour, so a kill-and-reopen returns the user
 * to the start. The `maxReachableIndex` tracks the furthest step
 * reached so the dot pagination can offer a back-step shortcut.
 *
 * The header title, button labels, toasts, and accessibility strings
 * are translated through the `onboarding` namespace. The first-step
 * language picker lives inside `ProfileStep` so it can switch language
 * live and immediately re-render every translated string below it.
 */
export default function OnboardingPage() {
	const [step, setStep] = useState<Step>({ kind: 'profile' });
	const [maxIndex, setMaxIndex] = useState<number>(0);
	const [profile, setProfile] = useState<OnboardingProfile>({
		ownerName: '',
		storeName: '',
	});
	const [saving, setSaving] = useState<boolean>(false);

	const router = useRouter();
	const addToast = useToastStore((state) => state.addToast);
	const { t } = useTranslation('onboarding');

	const currentIndex = indexOf(step);

	const advance = (nextStep: Step) => {
		const nextIndex = indexOf(nextStep);
		setStep(nextStep);
		setMaxIndex((prev) => (nextIndex > prev ? nextIndex : prev));
	};

	const handleBack = () => setStep(back(step));

	const handleOpenStore = async () => {
		const ownerName = profile.ownerName.trim();
		const storeName = profile.storeName.trim();
		if (!ownerName || !storeName) {
			addToast({
				message: t('toastMissingFields'),
				variant: 'danger',
				duration: 1800,
			});
			return;
		}

		try {
			setSaving(true);
			await markOnboardingComplete({ ownerName, storeName });
			addToast({
				message: t('toastWelcome'),
				variant: 'success',
				duration: 1800,
			});
			router.replace('/(tabs)');
		} catch {
			addToast({
				message: t('toastSaveFailed'),
				variant: 'danger',
				duration: 2000,
			});
		} finally {
			setSaving(false);
		}
	};

	const isProfile = step.kind === 'profile';
	const isReady = step.kind === 'ready';
	const isFirstTour = step.kind === 'tour' && step.tab === TOUR_ORDER[0];
	const isLastTour = step.kind === 'tour' && step.tab === TOUR_ORDER[TOUR_ORDER.length - 1];

	// Names are required before the user can leave the profile step.
	const isProfileComplete =
		profile.ownerName.trim().length > 0 &&
		profile.storeName.trim().length > 0;

	const handleNext = () => {
		if (isProfile && !isProfileComplete) return;
		advance(next(step));
	};
	const handleSkip = () => {
		// Skip tour can never bypass the profile gate.
		if (!isProfileComplete) return;
		advance(skipToReady());
	};
	const handleJump = (target: number) => {
		// Until names are filled, only the profile dot is reachable.
		const effectiveMax = isProfileComplete ? maxIndex : PROFILE_INDEX;
		setStep(jumpTo(target, effectiveMax));
	};

	const tourStep =
		step.kind === 'tour'
			? ONBOARDING_TOUR_STEPS.find((s) => s.tab === step.tab)
			: undefined;

	const continueLabel = isProfile
		? t('letsGo')
		: isLastTour
			? t('finishTour')
			: t('next');

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/*
			 * Route-scoped StatusBar — overrides the cinnamon default from
			 * `_layout.tsx` while onboarding is mounted, so the system bar
			 * matches the cream paper background (`background` / paper-200,
			 * #EFE6D2) and reads dark glyphs (`style="dark"`) instead of
			 * the inverted light glyphs used on dark surfaces elsewhere.
			 */}
			<StatusBar style="dark" backgroundColor="#EFE6D2" />
			<View className="px-6 pt-4">
				<View className="flex-row justify-between items-center">
					<StyledText variant="extrabold" className="text-2xl text-primary">
						{t('headerTitle')}
					</StyledText>
					<OnboardingPagination
						currentIndex={currentIndex}
						maxReachableIndex={
							isProfileComplete ? maxIndex : PROFILE_INDEX
						}
						onJump={handleJump}
					/>
				</View>
			</View>

			<View className="flex-1 px-6 pt-6 pb-4">
				{isProfile && (
					<ProfileStep profile={profile} onChange={setProfile} />
				)}

				{!!tourStep && (
					<TourCard step={tourStep} stepKey={currentIndex} />
				)}

				{isReady && (
					<ReadyStep
						profile={profile}
						saving={saving}
						onOpenStore={handleOpenStore}
					/>
				)}
			</View>

			{!isReady && (
				<View className="px-6 pb-6 pt-2 flex-row gap-3 items-center">
					{isProfile || isFirstTour ? (
						<View className="flex-1" />
					) : (
						<TouchableOpacity
							onPress={handleBack}
							accessibilityRole="button"
							accessibilityLabel={t('backA11y')}
							className="flex-1 border border-persimmon-500 rounded-2xl py-3 items-center press-scale active:opacity-70"
						>
							<StyledText variant="semibold" className="text-persimmon-600">
								{t('back')}
							</StyledText>
						</TouchableOpacity>
					)}

					{!isLastTour && !isProfile && isProfileComplete && (
						<TouchableOpacity
							onPress={handleSkip}
							accessibilityRole="button"
							accessibilityLabel={t('skipA11y')}
							className="px-4 py-3 press-scale active:opacity-70"
						>
							<StyledText variant="medium" className="text-persimmon-600">
								{t('skipTour')}
							</StyledText>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						onPress={handleNext}
						disabled={isProfile && !isProfileComplete}
						accessibilityRole="button"
						accessibilityLabel={t('continueA11y')}
						accessibilityState={{
							disabled: isProfile && !isProfileComplete,
						}}
						className={`flex-1 bg-persimmon-500 rounded-2xl py-3 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
							isProfile && !isProfileComplete ? 'opacity-50' : ''
						}`}
					>
						<StyledText variant="semibold" className="text-white">
							{continueLabel}
						</StyledText>
					</TouchableOpacity>
				</View>
			)}
		</SafeAreaView>
	);
}