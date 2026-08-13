import { db } from '@/configs';
import { AppSettingKey, AppSettingRow } from '@/types';
import { loadOnboardingState } from '@/lib/onboardingStorage';

export class UnauthorizedError extends Error {
  constructor(message = 'Owner authorization required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const isOwnerAuthorized = async (): Promise<boolean> => {
  const state = await loadOnboardingState();
  if (!state) return true;
  return Boolean(state.completed && state.profile?.ownerName?.trim());
};

export const assertOwnerAuthorized = async (): Promise<void> => {
  const authorized = await isOwnerAuthorized();
  if (!authorized) {
    throw new UnauthorizedError();
  }
};

export const getAppSetting = async (
  key: AppSettingKey,
): Promise<string | null> => {
  if (key === 'void_window_hours') {
    await assertOwnerAuthorized();
  }
  const row = await db.getFirstAsync<Pick<AppSettingRow, 'value'>>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
};

export const setAppSetting = async (
  key: AppSettingKey,
  value: string,
): Promise<void> => {
  if (key === 'void_window_hours') {
    await assertOwnerAuthorized();
  }
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now],
  );
};
