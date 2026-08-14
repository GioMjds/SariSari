import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initSettingsTable,
  initAuthTable,
  runMigrations,
} from '@/database';
import { seedDatabase, seedProductCatalog } from '@/database/seed';

let databaseInitialized = false;

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
      await initSettingsTable();
      await initAuthTable();
      await runMigrations();
    });


    await seedProductCatalog();

    if (__DEV__) await seedDatabase();

    databaseInitialized = true;
  } catch (error) {
    databaseInitialized = false;
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};
