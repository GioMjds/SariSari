import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initCashTables,
  initSettingsTable,
  initAuthTable,
  initCorrectionsTable,
  initDigitalServicesTables,
  initCashMovementsView,
  runMigrations,
} from '@/database';
import { seedDatabase } from '@/database/seed';
import { seedExpirySamples } from '@/database/seedExpiry';

let databaseInitialized = false;
let markDatabaseReady: () => void = () => {};
const databaseReady = new Promise<void>((resolve) => {
  markDatabaseReady = resolve;
});

// Resolves once the tables exist, so the first screen can wait before routing.
export const whenDatabaseReady = (): Promise<void> => databaseReady;

const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500,
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded for database operation');
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
};

export const initializeDatabases = async () => {
  if (databaseInitialized) {
    console.log('Database already initialized, skipping...');
    return;
  }

  try {
    await executeWithRetry(async () => {
      await initProductsTable();
      await initCreditsTable();
      await initInventoryTable();
      await initSalesTables();
      await initCategoriesTable();
      await initSuppliersTable();
      await initCashTables();
      await initSettingsTable();
      await initAuthTable();
      await initCorrectionsTable();
      await initDigitalServicesTables();
      await runMigrations();
      await initCashMovementsView();
    });

    if (__DEV__) await seedDatabase();
    // Opt in with EXPO_PUBLIC_SEED_EXPIRY=1 to add sample expiry products.
    if (__DEV__ && process.env['EXPO_PUBLIC_SEED_EXPIRY'] === '1') {
      await seedExpirySamples();
    }

    databaseInitialized = true;
    markDatabaseReady();
  } catch (error) {
    databaseInitialized = false;
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};
