export interface OnboardingProfile {
	ownerName: string;
	storeName: string;
}

export interface OnboardingState {
	completed: boolean;
	profile?: OnboardingProfile;
	completedAt?: string;
}
