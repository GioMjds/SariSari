import { ImageSourcePropType } from 'react-native';
import { TabKey } from './onboardingTour';

export function sariAssetFor(tab: TabKey): ImageSourcePropType {
  // TL;DR: The onboarding tour here are planned to be replaced with a new design, so we are not adding new assets for now.
  switch (tab) {
    case 'home':
      return require('@/assets/images/sari-emotions/sari-default-state.png');
    case 'sales':
      return require('@/assets/images/sari-emotions/sari-sales-state.png');
    case 'inventory':
      return require('@/assets/images/sari-emotions/sari-inventory-state.png');
    case 'customers':
      return require('@/assets/images/sari-emotions/sari-utang-state.png');
    case 'more':
      return require('@/assets/images/sari-emotions/sari-reports-state.png');
  }
}

export const SARI_PROFILE_ASSET = require('@/assets/images/sari-emotions/sari-onboarding-state.png');
export const SARI_READY_ASSET = require('@/assets/images/sari-emotions/sari-default-state.png');
