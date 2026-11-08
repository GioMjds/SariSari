import { ImageSourcePropType } from 'react-native';

export type SariState =
  | 'default'
  | 'sales'
  | 'inventory'
  | 'lowStock'
  | 'utang'
  | 'balanceCleared'
  | 'reports';

export const SARI_STATE_ASSETS: Record<SariState, ImageSourcePropType> = {
  default: require('@/assets/images/sari-emotions/sari-default-state.png'),
  sales: require('@/assets/images/sari-emotions/sari-sales-state.png'),
  inventory: require('@/assets/images/sari-emotions/sari-inventory-state.png'),
  lowStock: require('@/assets/images/sari-emotions/sari-low-stock-state.png'),
  utang: require('@/assets/images/sari-emotions/sari-utang-state.png'),
  balanceCleared: require('@/assets/images/sari-emotions/sari-balance-cleared-state.png'),
  reports: require('@/assets/images/sari-emotions/sari-reports-state.png'),
};

export const SARI_FALLBACK_ASSET = SARI_STATE_ASSETS.default;

// The three files below start as copies of sari-default-state.png.
// Overwrite them with the real art (see docs/superpowers/sari-art-prompts.md).
export const SARI_WELCOME_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-welcome-state.png');
export const SARI_CELEBRATE_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-celebrate-state.png');
export const SARI_POINTING_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-pointing-state.png');

// Still imported by app/index.tsx.
export const SARI_READY_ASSET: ImageSourcePropType = SARI_STATE_ASSETS.default;
