import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initCashTables,
  runMigrations,
} from '../database';
import {
  getAppSetting,
  setAppSetting,
  UnauthorizedError,
} from '../database/settings';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('app_settings owner authorization and settings validation', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
    try {
      await db.execAsync('DELETE FROM cash_entries;');
      await db.execAsync('DELETE FROM cash_sessions;');
    } catch {}
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA user_version = 0;');
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await initCashTables();
    await runMigrations();
    await AsyncStorage.clear();
  });

  it('rejects void_window_hours read/write when onboarding/owner profile is missing', async () => {
    await AsyncStorage.setItem(
      'onboarding_state_v1',
      JSON.stringify({
        completed: false,
        profile: { ownerName: '', storeName: 'My Store' },
      }),
    );

    await expect(getAppSetting('void_window_hours')).rejects.toThrow(
      UnauthorizedError,
    );
    await expect(setAppSetting('void_window_hours', '48')).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('allows void_window_hours read/write when owner profile exists', async () => {
    await AsyncStorage.setItem(
      'onboarding_state_v1',
      JSON.stringify({
        completed: true,
        profile: { ownerName: 'Aling Maria', storeName: 'Maria Store' },
      }),
    );

    const initial = await getAppSetting('void_window_hours');
    expect(initial).toBe('24'); // Default seeded in migration 19

    await setAppSetting('void_window_hours', '48');
    const updated = await getAppSetting('void_window_hours');
    expect(updated).toBe('48');
  });
});
