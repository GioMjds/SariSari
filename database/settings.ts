import { db } from '@/configs';
import { AppSettingKey, AppSettingRow } from '@/types';

export const getAppSetting = async (
  key: AppSettingKey,
): Promise<string | null> => {
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
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    [key, value, now],
  );
};
