import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  runMigrations,
} from '@/database';
import { seedDatabase } from '@/database/seed';

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
      await Promise.all([
        initProductsTable(),
        initCreditsTable(),
        initInventoryTable(),
        initSalesTables(),
        initCategoriesTable(),
      ]);
      await runMigrations();
    });

    if (__DEV__) {
      await seedDatabase(); // comment out if building and testing apps from other devices to avoid wiping existing data
    }

    databaseInitialized = true;
  } catch (error) {
    databaseInitialized = false;
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};
