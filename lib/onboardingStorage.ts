import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingProfile, OnboardingState } from '@/types/onboarding.types';

const KEY = 'onboarding_state_v1';

export const loadOnboardingState = async (): Promise<OnboardingState | null> => {
	try {
		const raw = await AsyncStorage.getItem(KEY);
		if (!raw) return null;
		return JSON.parse(raw) as OnboardingState;
	} catch (error) {
		console.warn('Failed to load onboarding state', error);
		return null;
	}
};

export const saveOnboardingState = async (
	state: OnboardingState
): Promise<void> => {
	try {
		await AsyncStorage.setItem(KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save onboarding state', error);
		throw error;
	}
};

export const markOnboardingComplete = async (
	profile: OnboardingProfile
): Promise<void> => {
	const next: OnboardingState = {
		completed: true,
		profile,
		completedAt: new Date().toISOString(),
	};
	return saveOnboardingState(next);
};

export const clearOnboardingState = async (): Promise<void> => {
	try {
		await AsyncStorage.removeItem(KEY);
	} catch (error) {
		console.warn('Failed to clear onboarding state', error);
		throw error;
	}
};
