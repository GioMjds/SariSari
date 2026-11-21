/** Every state Sari can act out. */
export const SARI_STATES = [
  'default',
  'empty',
  'error',
  'loading',
  'low-stock',
  'balance-cleared',
  'outstanding-balance',
  'inventory',
  'sales',
  'utang',
  'onboarding',
  'delete',
  'settings',
  'reports',
  'exit',
  'unimplemented',
  'customers',
  'sale-recorded',
  'utang-recorded',
] as const;

export type SariState = (typeof SARI_STATES)[number];
