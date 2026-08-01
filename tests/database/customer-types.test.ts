import {
  initCreditsTable,
  insertCustomer,
  updateCustomer,
  getCustomer,
} from '../../database/credits';
import { initProductsTable } from '../../database/products';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import type {
  Customer,
  NewCustomer,
  LoyaltyTier,
  CustomerTimelineItem,
  CustomerInsights,
  ExtendedCreditFilter,
} from '../../types/credits.types';
import { CUSTOMERS_SUB_TABS, CustomersSubTab } from '../../constants/tabs';

describe('Customer CRM Types and Database Schema Migration', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await runMigrations();
  });

  test('CUSTOMERS_SUB_TABS defines sub-tab swipe routes correctly', () => {
    expect(CUSTOMERS_SUB_TABS).toEqual(['all', 'credit', 'insights']);
    const currentTab: CustomersSubTab = 'credit';
    expect(currentTab).toBe('credit');
  });

  test('validates Customer, NewCustomer, and CRM type interfaces', () => {
    const tier: LoyaltyTier = 'loyal';
    const filter: ExtendedCreditFilter = 'with_balance';
    const newCustomer: NewCustomer = {
      name: 'Maria Clara',
      phone: '09171234567',
      birthday: '1995-12-25',
      photo_uri: 'file:///path/to/avatar.jpg',
      notes: 'Suki buyer',
      credit_limit: 5000,
    };
    const timelineItem: CustomerTimelineItem = {
      id: 'credit-1',
      type: 'credit',
      amount: 150,
      date: '2026-07-27',
      description: 'Added Credit',
      details: 'Sardines 2x',
    };

    expect(tier).toBe('loyal');
    expect(filter).toBe('with_balance');
    expect(newCustomer.birthday).toBe('1995-12-25');
    expect(timelineItem.amount).toBe(150);
  });

  test('insertCustomer and updateCustomer save and read back birthday and photo_uri', async () => {
    const newCustomer: NewCustomer = {
      name: 'Juan Dela Cruz',
      phone: '09988776655',
      address: 'Barangay 1, Calauan',
      birthday: '1990-05-15',
      photo_uri: 'file:///avatars/juan.jpg',
      notes: 'Good payer',
      credit_limit: 10000,
    };

    const customerId = await insertCustomer(newCustomer);
    expect(customerId).toBeGreaterThan(0);

    let customer = await getCustomer(customerId);
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe('Juan Dela Cruz');
    expect(customer?.birthday).toBe('1990-05-15');
    expect(customer?.photo_uri).toBe('file:///avatars/juan.jpg');
    expect(customer?.credit_limit).toBe(10000);

    const updatedData: NewCustomer = {
      ...newCustomer,
      name: 'Juan Dela Cruz Jr.',
      birthday: '1990-05-16',
      photo_uri: 'file:///avatars/juan_new.jpg',
    };

    await updateCustomer(customerId, updatedData);
    customer = await getCustomer(customerId);
    expect(customer?.name).toBe('Juan Dela Cruz Jr.');
    expect(customer?.birthday).toBe('1990-05-16');
    expect(customer?.photo_uri).toBe('file:///avatars/juan_new.jpg');
  });
});
