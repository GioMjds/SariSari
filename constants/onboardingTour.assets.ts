/**
 * onboardingTour.assets — image `require()` handles for the tour and
 * the two non-tour onboarding steps. Lives in a sibling file from
 * `onboardingTour.ts` so the data-only file stays importable from
 * Jest unit tests without dragging React Native's image resolver into
 * Node.
 *
 * Components import `sariAssetFor(tab)` (and the two named constants
 * for profile + ready) — never `require()` images directly.
 */

import { ImageSourcePropType } from 'react-native';
import { TabKey } from './onboardingTour';

/** One-shot resolver: maps a TabKey to its matching Sari emotion PNG. */
export function sariAssetFor(tab: TabKey): ImageSourcePropType {
	switch (tab) {
		case 'dashboard':
			return require('@/assets/images/sari-emotions/sari-dashboard-state.png');
		case 'sell':
			return require('@/assets/images/sari-emotions/sari-sales-state.png');
		case 'inventory':
			return require('@/assets/images/sari-emotions/sari-inventory-state.png');
		case 'utang':
			return require('@/assets/images/sari-emotions/sari-utang-state.png');
		case 'reports':
			return require('@/assets/images/sari-emotions/sari-reports-state.png');
	}
}

export const SARI_PROFILE_ASSET = require('@/assets/images/sari-emotions/sari-onboarding-state.png');
export const SARI_READY_ASSET = require('@/assets/images/sari-emotions/sari-default-state.png');
