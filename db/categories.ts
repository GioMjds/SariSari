import { Category, CategoryWithCount } from '@/types/categories.types';
import { db } from '../configs/sqlite';

export const initCategoriesTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const insertCategory = async (name: string) => {
  const result = await db.runAsync(
    'INSERT INTO categories (name) VALUES (?)',
    [name]
  );
  return result.lastInsertRowId;
};

export const updateCategory = async (id: number, name: string) => {
  await db.runAsync(
    'UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, id]
  );
};

export const deleteCategory = async (id: number) => {
  // First, remove category from all products
  await db.runAsync('UPDATE products SET category = NULL WHERE category = (SELECT name FROM categories WHERE id = ?)', [id]);
  // Then delete the category
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};

export const getCategory = async (id: number): Promise<Category | null> => {
  const result = await db.getFirstAsync<Category>('SELECT id, name, created_at, updated_at FROM categories WHERE id = ?', [id]);
  return result || null;
};

export const getAllCategories = async (): Promise<Category[]> => {
  return await db.getAllAsync<Category>('SELECT id, name, created_at, updated_at FROM categories ORDER BY name');
};

export const getCategoriesWithCount = async (): Promise<CategoryWithCount[]> => {
  return await db.getAllAsync<CategoryWithCount>(`
    SELECT 
      c.id,
      c.name,
      c.created_at,
      c.updated_at,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category = c.name
    GROUP BY c.id, c.name, c.created_at, c.updated_at
    ORDER BY c.name
  `);
};

export const getCategoryByName = async (name: string): Promise<Category | null> => {
  const result = await db.getFirstAsync<Category>('SELECT id, name, created_at, updated_at FROM categories WHERE name = ?', [name]);
  return result || null;
};
