import { db } from '@/configs/sqlite';
import { setAppSetting } from '@/database/settings';
import {
  PIN_ACTION_KEY_PREFIX,
  parsePinOverrides,
  pinActionKey,
  type PinActionId,
} from '@/lib/auth/pin-actions';

export const getPinPolicyOverrides = async (): Promise<
  Record<string, boolean>
> => {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings WHERE key GLOB ?',
    [`${PIN_ACTION_KEY_PREFIX}*`],
  );
  return parsePinOverrides(rows);
};

export const setPinPolicyOverride = (
  id: PinActionId,
  enabled: boolean,
): Promise<void> => setAppSetting(pinActionKey(id), enabled ? '1' : '0');
