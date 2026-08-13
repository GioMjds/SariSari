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
import { getAppSetting, setAppSetting } from '../database/settings';
import { isOwnerPinConfigured, setupOwnerPin, verifyOwnerPin } from '../database/auth';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Owner PIN Gating & Threshold Settings', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
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
    await AsyncStorage.setItem(
      'onboarding_state_v1',
      JSON.stringify({
        completed: true,
        profile: { ownerName: 'Maria', storeName: 'Maria Store' },
      }),
    );
  });

  it('seeds default discount thresholds during v20 migration', async () => {
    const pesoLimit = await getAppSetting('owner_pin_discount_threshold_pesos' as any);
    const percentLimit = await getAppSetting('owner_pin_discount_threshold_percent' as any);

    expect(pesoLimit).toBe('50');
    expect(percentLimit).toBe('10');
  });

  it('updates discount thresholds in app_settings', async () => {
    await setAppSetting('owner_pin_discount_threshold_pesos' as any, '100');
    await setAppSetting('owner_pin_discount_threshold_percent' as any, '20');

    const updatedPesos = await getAppSetting('owner_pin_discount_threshold_pesos' as any);
    const updatedPercent = await getAppSetting('owner_pin_discount_threshold_percent' as any);

    expect(updatedPesos).toBe('100');
    expect(updatedPercent).toBe('20');
  });

  it('verifies owner PIN requirement state when unconfigured vs configured', async () => {
    expect(await isOwnerPinConfigured()).toBe(false);

    const { recoveryCode } = await setupOwnerPin('4321');
    expect(recoveryCode).toBeTruthy();
    expect(await isOwnerPinConfigured()).toBe(true);

    expect(await verifyOwnerPin('4321')).toBe(true);
    expect(await verifyOwnerPin('0000')).toBe(false);
  });
});
