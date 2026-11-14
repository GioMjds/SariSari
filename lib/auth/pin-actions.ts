import type { AppSettingKey } from '@/types/settings.types';

export type PinActionRisk = 'low' | 'high' | 'locked';

export interface PinAction {
  id: string;
  labelKey: string;
  risk: PinActionRisk;
  defaultEnabled: boolean;
}

// Generic id keeps the literal type so PinActionId is a real union.
const action = <I extends string>(
  id: I,
  risk: PinActionRisk,
  defaultEnabled = true,
) => ({
  id,
  labelKey: `pin_policy.actions.${id}`,
  risk,
  defaultEnabled,
});

export const PIN_ACTIONS = [
  action('sale_void', 'high'),
  action('sale_refund', 'high'),
  action('sale_price_correction', 'high'),
  action('stock_adjustment', 'low'),
  action('delivery_receipt_void', 'high'),
  action('credit_limit_override', 'high'),
  action('backup_restore', 'locked'),
  action('drive_unlink', 'locked'),
  action('pin_change', 'locked'),
  action('pin_policy_change', 'locked'),
  action('biometric_enable', 'locked'),
] as const satisfies readonly PinAction[];

export type PinActionId = (typeof PIN_ACTIONS)[number]['id'];

export const PIN_ACTION_KEY_PREFIX = 'owner_pin_action.';

export const pinActionKey = (id: PinActionId): AppSettingKey =>
  `${PIN_ACTION_KEY_PREFIX}${id}`;

export const getPinAction = (id: string): PinAction | undefined =>
  PIN_ACTIONS.find((a) => a.id === id);

export type PinSettingReader = (key: AppSettingKey) => Promise<string | null>;

// Fails closed: locked, unknown, or unreadable policy always requires the PIN.
export const isPinRequired = async (
  id: string,
  read: PinSettingReader,
): Promise<boolean> => {
  const def = getPinAction(id);
  if (!def || def.risk === 'locked') return true;
  try {
    const raw = await read(`${PIN_ACTION_KEY_PREFIX}${id}`);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return def.defaultEnabled;
  } catch {
    return true;
  }
};

// Keeps only rows for known, non-locked actions with a 0 or 1 value.
export const parsePinOverrides = (
  rows: { key: string; value: string }[],
): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  for (const row of rows) {
    if (!row.key.startsWith(PIN_ACTION_KEY_PREFIX)) continue;
    const id = row.key.slice(PIN_ACTION_KEY_PREFIX.length);
    const def = getPinAction(id);
    if (!def || def.risk === 'locked') continue;
    if (row.value === '1') out[id] = true;
    else if (row.value === '0') out[id] = false;
  }
  return out;
};
