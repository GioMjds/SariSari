import type { SariState } from './sariStates';

// Rest-pose PNGs rendered from the vector states by scripts/mascot-stills/render.tsx; rerun it after editing any state.
export const SARI_STILLS: Record<SariState, number> = {
  default: require('@/assets/images/sari-stills/default.png'),
  empty: require('@/assets/images/sari-stills/empty.png'),
  error: require('@/assets/images/sari-stills/error.png'),
  loading: require('@/assets/images/sari-stills/loading.png'),
  'low-stock': require('@/assets/images/sari-stills/low-stock.png'),
  'balance-cleared': require('@/assets/images/sari-stills/balance-cleared.png'),
  'outstanding-balance': require('@/assets/images/sari-stills/outstanding-balance.png'),
  inventory: require('@/assets/images/sari-stills/inventory.png'),
  sales: require('@/assets/images/sari-stills/sales.png'),
  utang: require('@/assets/images/sari-stills/utang.png'),
  onboarding: require('@/assets/images/sari-stills/onboarding.png'),
  delete: require('@/assets/images/sari-stills/delete.png'),
  settings: require('@/assets/images/sari-stills/settings.png'),
  reports: require('@/assets/images/sari-stills/reports.png'),
  exit: require('@/assets/images/sari-stills/exit.png'),
  unimplemented: require('@/assets/images/sari-stills/unimplemented.png'),
  customers: require('@/assets/images/sari-stills/customers.png'),
  'sale-recorded': require('@/assets/images/sari-stills/sale-recorded.png'),
  'utang-recorded': require('@/assets/images/sari-stills/utang-recorded.png'),
};
