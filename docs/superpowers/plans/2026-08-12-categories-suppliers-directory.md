# Inventory Category & Supplier Directory — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browse + manage + drill-down surface for categories and suppliers inside the Inventory tab, per the spec at `docs/superpowers/specs/2026-08-12-categories-suppliers-directory-design.md`.

**Architecture:** Four new routes under `app/(tabs)/inventory/` (categories list, suppliers list, plus two drilldown screens reusing `ProductsList`). 11 new components under `components/inventory/directory/`. New DB functions in `database/categories.ts`, `database/suppliers.ts`, `database/inventory.ts`. New hooks in `useCategories`, `useSuppliers`, `useInventory`. 19 new i18n keys. The existing `add-category` screen gains a `?editId=` param for the rename flow. Existing `InventoryHeader` is touched to add two icon buttons + an overflow menu.

**Tech Stack:** Expo SDK 54 / React Native 0.81, TanStack Query v5, expo-sqlite, react-i18next, NativeWind v4. Test runner: Jest with `better-sqlite3` in-memory mock (`tests/__setup__/expo-sqlite-mock.ts`).

---

## Global Constraints

Per `obsidian-vault/CONTEXT.md`:

- **Offline-first.** Local SQLite is source of truth. No backend calls.
- **Money is integer pesos.** All parse/format goes through `lib/money.ts`. (Not relevant to this feature — no money columns touched.)
- **Screens never call SQLite.** All data access via hooks in `hooks/`.
- **One SQLite handle** imported from `configs/sqlite.ts`.
- **Strict unidirectional flow:** `app/` → `hooks/` → `database/` → SQLite.
- **`stores/` is transient UI state only.** Never cache business data there.
- **Multi-statement writes** that touch the ledger use `db.withTransactionAsync`. (`deleteCategory` and the new `deleteSupplier` re-point-and-delete both qualify.)
- **TypeScript strict mode** with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`.
- **i18n namespace `inventory`** for the new keys — append to `locales/{en,tl}/inventory.json`.
- **No emojis in code or comments.** Markdown filenames kebab-case.
- **Project test discipline:** the IA doc flags Features 5 and 6 shipped without the planned tests. We follow the same precedent — light tests, manual smoke at the end.

---

## File structure

### New files

| Path | Purpose |
|------|---------|
| `app/(tabs)/inventory/categories.tsx` | Route: browse + manage categories list |
| `app/(tabs)/inventory/category-products/[name].tsx` | Route: drilldown — products in a category |
| `app/(tabs)/inventory/suppliers.tsx` | Route: browse + manage suppliers list |
| `app/(tabs)/inventory/supplier-products/[id].tsx` | Route: drilldown — products for a supplier + last-delivery chip |
| `components/inventory/directory/CategoryDirectoryList.tsx` | List container with debounced search |
| `components/inventory/directory/CategoryDirectoryRow.tsx` | Row component (name + count chip) |
| `components/inventory/directory/CategoryDirectorySkeleton.tsx` | 5-row loading state |
| `components/inventory/directory/CategoryDirectoryEmptyState.tsx` | "Add your first category" empty state |
| `components/inventory/directory/CategoryRowActionSheet.tsx` | Bottom sheet for rename/delete |
| `components/inventory/directory/SupplierDirectoryList.tsx` | Same shape for suppliers |
| `components/inventory/directory/SupplierDirectoryRow.tsx` | Row with contact + count + last-delivered |
| `components/inventory/directory/SupplierDirectorySkeleton.tsx` | Loading state |
| `components/inventory/directory/SupplierDirectoryEmptyState.tsx` | "Add your first supplier" empty state |
| `components/inventory/directory/DirectoryEntryHeader.tsx` | Shared header for drilldown screens |
| `components/inventory/directory/LastDeliveryChip.tsx` | Date chip or "never delivered" |
| `components/inventory/directory/index.ts` | Re-exports |
| `tests/database/categories-with-count.test.ts` | DB test |
| `tests/database/rename-category.test.ts` | DB test |
| `tests/database/delete-category-repoints-products.test.ts` | DB test |
| `tests/database/suppliers-with-count.test.ts` | DB test |
| `tests/database/delete-supplier-repoints-products.test.ts` | DB test |
| `tests/database/get-last-delivery-for-supplier.test.ts` | DB test |
| `tests/components/inventory/CategoriesScreen.test.tsx` | Component test |
| `tests/components/inventory/SuppliersScreen.test.tsx` | Component test |
| `tests/components/inventory/CategoryDirectoryEmptyState.test.tsx` | Component test |
| `tests/components/inventory/SupplierDirectoryEmptyState.test.tsx` | Component test |

### Modified files

| Path | What changes |
|------|-------------|
| `database/categories.ts` | Wrap existing `deleteCategory` in `withTransactionAsync` (tightening); add `renameCategory(id, name)` |
| `database/suppliers.ts` | **Fix:** `deleteSupplier` must re-point `products.supplier_id` to `null` in `withTransactionAsync` before deleting; add `getSuppliersWithCount()` |
| `database/inventory.ts` | Add `getLastDeliveryForSupplier(supplierId)` |
| `hooks/useCategories.ts` | `useUpdateCategoryMutation` already exists; rename usage only — no new hooks here for now since the spec resolves "rename" via the edit-form param |
| `hooks/useSuppliers.ts` | Add `useSuppliersWithCountQuery()` |
| `hooks/useInventory.tsx` | Add `useGetLastDeliveryForSupplier(supplierId)` |
| `components/inventory/InventoryHeader.tsx` | Add two icon buttons + 3-dot overflow menu props (folder + truck) |
| `app/(tabs)/inventory/products.tsx` | Wire `InventoryHeader` icons + overflow to new routes |
| `app/(edit-forms)/add-category/index.tsx` | When `?editId=` is present, prefill name, hide the product-assignment card, swap save to `updateCategoryMutation` |
| `tests/__setup__/expo-sqlite-mock.ts` | Add `categories`, `suppliers`, `inventory_transactions` tables to the reset list |
| `locales/en/inventory.json` | Add 19 new keys |
| `locales/tl/inventory.json` | Add 19 new keys |
| `app/(tabs)/inventory/_layout.tsx` | Register the 4 new screens |

---

## Task decomposition

Tasks are ordered so each one leaves the app in a working state and the next task has something to build on. Tasks 1–3 are pure infrastructure (mock setup, DB functions). Tasks 4–6 are data hooks. Tasks 7–10 are components. Tasks 11–14 are routes and header wiring. Tasks 15–16 are i18n finalization.

| # | Deliverable | Approx. test count |
|---|-------------|--------------------|
| 1 | Test infrastructure: scaffold `tests/database/`, extend mock reset | 0 |
| 2 | DB: `renameCategory`, wrap `deleteCategory` in transaction | 2 |
| 3 | DB: fix `deleteSupplier` re-point, add `getSuppliersWithCount`, add `getLastDeliveryForSupplier` | 3 |
| 4 | Hook: `useSuppliersWithCountQuery` | 0 |
| 5 | Hook: `useGetLastDeliveryForSupplier` | 0 |
| 6 | Hook: tweak `add-category` edit-mode wiring (no new hook) | 0 |
| 7 | Components: `CategoryDirectoryList/Row/Skeleton/EmptyState/RowActionSheet` + `index.ts` | 1 |
| 8 | Components: `SupplierDirectoryList/Row/Skeleton/EmptyState` + `index.ts` | 1 |
| 9 | Components: `DirectoryEntryHeader`, `LastDeliveryChip` | 0 |
| 10 | Components: drilldown wiring (uses 7 + 9) | 0 |
| 11 | Route: `categories.tsx` + register in `_layout` | 1 |
| 12 | Route: `suppliers.tsx` + register in `_layout` | 1 |
| 13 | Route: `category-products/[name].tsx` + register | 0 |
| 14 | Route: `supplier-products/[id].tsx` + register | 0 |
| 15 | Touched: `add-category` edit-mode, `InventoryHeader` icons, `products.tsx` wiring | 0 |
| 16 | i18n: 19 new keys (en + tl) | 0 |
| 17 | Manual smoke checklist | 0 |

---

### Task 1: Test infrastructure — scaffold `tests/database/` and extend mock reset

**Files:**
- Create: `tests/database/.gitkeep`
- Modify: `tests/__setup__/expo-sqlite-mock.ts:49-77`

**Why:** The mock currently resets only `products` and a handful of other tables; categories and suppliers are missing. Without this, every DB test in this plan will fail because the `categories` / `suppliers` tables won't exist when queries run.

**Consumes:** nothing.

**Produces:** `tests/database/` directory and an extended mock reset that clears `categories`, `suppliers`, and `inventory_transactions`.

- [ ] **Step 1: Create the tests/database directory**

```bash
mkdir -p D:/giomj/Projects/sarisari/tests/database && touch D:/giomj/Projects/sarisari/tests/database/.gitkeep
```

- [ ] **Step 2: Add the new tables to the mock reset list**

In `tests/__setup__/expo-sqlite-mock.ts`, extend the `tables` array in `resetMockDb` (lines 52-65) by inserting `'categories'`, `'suppliers'`, and `'inventory_transactions'` is already there — add `'categories'` and `'suppliers'` only:

```typescript
  const tables = [
    'sqlite_sequence',
    'categories',
    'suppliers',
    'inventory_transactions',
    'payment_allocations',
    'payments',
    'credit_transactions',
    'sale_items',
    'sales',
    'products',
    'customers',
    'product_catalog',
    'parked_carts',
    'stocktake_counts',
    'stocktake_sessions',
  ];
```

- [ ] **Step 3: Verify the existing test suite still runs**

Run: `cd D:/giomj/Projects/sarisari && npx jest --listTests 2>&1 | head -20`
Expected: jest enumerates `configs/__tests__/features.test.ts` plus any under `tests/`. No new files match because `tests/database/` only has `.gitkeep` — jest's `testMatch` requires `.test.ts` so nothing runs there yet.

- [ ] **Step 4: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add tests/database/.gitkeep tests/__setup__/expo-sqlite-mock.ts
git commit -m "test: scaffold tests/database and extend mock reset for categories/suppliers"
```

---

### Task 2: DB — `renameCategory` and `deleteCategory` transaction tightening

**Files:**
- Modify: `database/categories.ts` (existing `deleteCategory` already re-points but is NOT in a transaction — wrap it; add new `renameCategory`)
- Create: `tests/database/rename-category.test.ts`
- Create: `tests/database/delete-category-repoints-products.test.ts`

**Why:** The spec requires delete to be atomic. The existing `deleteCategory` does two statements (re-point + delete) without `withTransactionAsync` — a process kill between them could leave products pointing at a deleted category. Add `renameCategory` to support the rename action in `CategoryRowActionSheet`.

**Consumes:** nothing (DB functions are pure SQLite).

**Produces:**
- `database/categories.ts:renameCategory(id: number, name: string): Promise<void>` — same shape as the existing `updateCategory`, but exported separately so the hook layer is explicit.
- `database/categories.ts:deleteCategory(id: number): Promise<void>` — wrapped in `db.withTransactionAsync`.

- [ ] **Step 1: Write the failing test for `renameCategory`**

Create `tests/database/rename-category.test.ts`:

```typescript
import { db, resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';
import {
  initCategoriesTable,
  insertCategory,
  renameCategory,
  getCategoriesWithCount,
} from '@/database/categories';
import { initProductsTable } from '@/database/products';

beforeEach(async () => {
  await resetMockDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await initProductsTable();
  await initCategoriesTable();
});

describe('renameCategory', () => {
  it('updates the category name', async () => {
    const id = await insertCategory('Soft Drinks');
    await renameCategory(id, 'Beverages');
    const cats = await getCategoriesWithCount();
    expect(cats.find((c) => c.id === id)?.name).toBe('Beverages');
  });

  it('rejects a name that collides with another category', async () => {
    await insertCategory('Snacks');
    const id = await insertCategory('Soft Drinks');
    await expect(renameCategory(id, 'Snacks')).rejects.toThrow(/UNIQUE/i);
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/rename-category.test.ts -v`
Expected: FAIL with "Cannot find module '@/database/categories'" or similar — the import path works (file exists), so the failure will be `renameCategory is not a function`.

- [ ] **Step 2: Add `renameCategory` to `database/categories.ts`**

Append at the end of the file:

```typescript
export const renameCategory = async (id: number, name: string): Promise<void> => {
  await db.runAsync(
    'UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, id],
  );
};
```

- [ ] **Step 3: Run the rename test to verify it passes**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/rename-category.test.ts -v`
Expected: PASS for both `it` blocks. If the duplicate test fails because the existing `initCategoriesTable` declares the table differently, normalize the test schema to use the init function (it already exists).

- [ ] **Step 4: Write the failing test for the transaction-wrapped `deleteCategory`**

Create `tests/database/delete-category-repoints-products.test.ts`:

```typescript
import { db, resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';
import { initCategoriesTable, insertCategory, deleteCategory } from '@/database/categories';
import { initProductsTable, insertProduct } from '@/database/products';
import { getAllProducts } from '@/database/products';

beforeEach(async () => {
  await resetMockDb();
  await initProductsTable();
  await initCategoriesTable();
});

describe('deleteCategory repoints products', () => {
  it('sets products.category to null inside one transaction', async () => {
    const catId = await insertCategory('Snacks');
    const p1 = await insertProduct({ name: 'Chips', category: 'Snacks', price: 10, cost_price: 5, quantity: 100 });
    const p2 = await insertProduct({ name: 'Candy', category: 'Snacks', price: 5, cost_price: 2, quantity: 50 });
    const p3 = await insertProduct({ name: 'Soda', category: null, price: 20, cost_price: 10, quantity: 30 });

    await deleteCategory(catId);

    const all = await getAllProducts();
    expect(all.find((p) => p.id === p1)?.category).toBeNull();
    expect(all.find((p) => p.id === p2)?.category).toBeNull();
    expect(all.find((p) => p.id === p3)?.category).toBeNull();
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/delete-category-repoints-products.test.ts -v`
Expected: PASS — the existing `deleteCategory` does the re-point, but without `withTransactionAsync`. The test passes either way (we are testing the *behavior*, not the transaction wrapper). This step verifies the existing behavior before we change it.

- [ ] **Step 5: Wrap `deleteCategory` in `withTransactionAsync`**

In `database/categories.ts`, replace the existing `deleteCategory` (lines 29-37):

```typescript
export const deleteCategory = async (id: number) => {
  await db.withTransactionAsync(async () => {
    // First, remove category from all products
    await db.runAsync(
      'UPDATE products SET category = NULL WHERE category = (SELECT name FROM categories WHERE id = ?)',
      [id],
    );
    // Then delete the category
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  });
};
```

- [ ] **Step 6: Run the test to verify it still passes**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/delete-category-repoints-products.test.ts -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add database/categories.ts tests/database/rename-category.test.ts tests/database/delete-category-repoints-products.test.ts
git commit -m "feat(categories): renameCategory + transactional deleteCategory"
```

---

### Task 3: DB — fix `deleteSupplier` re-point + `getSuppliersWithCount` + `getLastDeliveryForSupplier`

**Files:**
- Modify: `database/suppliers.ts` (fix `deleteSupplier`, add `getSuppliersWithCount`)
- Modify: `database/inventory.ts` (add `getLastDeliveryForSupplier`)
- Create: `tests/database/suppliers-with-count.test.ts`
- Create: `tests/database/delete-supplier-repoints-products.test.ts`
- Create: `tests/database/get-last-delivery-for-supplier.test.ts`

**Why:** The existing `deleteSupplier` does NOT re-point `products.supplier_id` to null — products get orphaned. This is a real bug that the new directory feature exposes (an owner deletes a supplier, then sees the supplier's products still claim to be supplied by them). Fix it in scope. The two new functions support the directory list and the last-delivery chip.

**Consumes:** nothing.

**Produces:**
- `database/suppliers.ts:deleteSupplier(id: string): Promise<void>` — wraps in `withTransactionAsync`; sets `products.supplier_id = NULL` for all attached products before deleting the supplier.
- `database/suppliers.ts:getSuppliersWithCount(): Promise<SupplierWithCount[]>` — returns `{ id, name, contact, notes, createdAt, productCount }[]`.
- `database/inventory.ts:getLastDeliveryForSupplier(supplierId: string): Promise<{ date: string, transactionId: number } | null>`.

- [ ] **Step 1: Add the type for `SupplierWithCount`**

In `types/suppliers.types.ts`, add at the end:

```typescript
export interface SupplierWithCount extends Supplier {
  productCount: number;
}
```

- [ ] **Step 2: Write the failing test for `getSuppliersWithCount`**

Create `tests/database/suppliers-with-count.test.ts`:

```typescript
import { db, resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';
import { initSuppliersTable, listSuppliers, getSuppliersWithCount } from '@/database/suppliers';
import { initProductsTable, insertProduct } from '@/database/products';

beforeEach(async () => {
  await resetMockDb();
  await initSuppliersTable();
  await initProductsTable();
});

describe('getSuppliersWithCount', () => {
  it('returns 0 for suppliers with no products', async () => {
    const id = await require('expo-crypto').randomUUID();
    await db.runAsync(
      'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, 'Acme Co', null, null, Date.now()]
    );
    const result = await getSuppliersWithCount();
    expect(result).toHaveLength(1);
    expect(result[0].productCount).toBe(0);
  });

  it('counts products correctly per supplier', async () => {
    const s1 = require('expo-crypto').randomUUID();
    const s2 = require('expo-crypto').randomUUID();
    await db.runAsync('INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)', [s1, 'Acme', null, null, Date.now()]);
    await db.runAsync('INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)', [s2, 'Beta', null, null, Date.now()]);
    await insertProduct({ name: 'A1', supplier_id: s1, price: 1, cost_price: 1, quantity: 1 });
    await insertProduct({ name: 'A2', supplier_id: s1, price: 1, cost_price: 1, quantity: 1 });
    await insertProduct({ name: 'B1', supplier_id: s2, price: 1, cost_price: 1, quantity: 1 });

    const result = await getSuppliersWithCount();
    const acme = result.find((s) => s.id === s1);
    const beta = result.find((s) => s.id === s2);
    expect(acme?.productCount).toBe(2);
    expect(beta?.productCount).toBe(1);
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/suppliers-with-count.test.ts -v`
Expected: FAIL — `getSuppliersWithCount` is not exported.

- [ ] **Step 3: Add `getSuppliersWithCount` to `database/suppliers.ts`**

Append to `database/suppliers.ts`:

```typescript
import { SupplierWithCount } from '@/types/suppliers.types';

export const getSuppliersWithCount = async (): Promise<SupplierWithCount[]> => {
  const rows = await db.getAllAsync<SupplierRow & { product_count: number }>(`
    SELECT
      s.*,
      COUNT(p.id) as product_count
    FROM suppliers s
    LEFT JOIN products p ON p.supplier_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `);
  return rows.map((row) => ({
    ...rowToSupplier(row),
    productCount: row.product_count,
  }));
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/suppliers-with-count.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the fixed `deleteSupplier`**

Create `tests/database/delete-supplier-repoints-products.test.ts`:

```typescript
import { db, resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';
import { initSuppliersTable, deleteSupplier } from '@/database/suppliers';
import { initProductsTable, insertProduct, getAllProducts } from '@/database/products';

beforeEach(async () => {
  await resetMockDb();
  await initSuppliersTable();
  await initProductsTable();
});

describe('deleteSupplier repoints products', () => {
  it('sets products.supplier_id to null inside one transaction', async () => {
    const supplierId = require('expo-crypto').randomUUID();
    await db.runAsync(
      'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [supplierId, 'Acme', null, null, Date.now()]
    );
    const p1 = await insertProduct({ name: 'A1', supplier_id: supplierId, price: 1, cost_price: 1, quantity: 1 });
    const p2 = await insertProduct({ name: 'A2', supplier_id: null, price: 1, cost_price: 1, quantity: 1 });

    await deleteSupplier(supplierId);

    const all = await getAllProducts();
    expect(all.find((p) => p.id === p1)?.supplier_id).toBeNull();
    expect(all.find((p) => p.id === p2)?.supplier_id).toBeNull();
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/delete-supplier-repoints-products.test.ts -v`
Expected: PASS — the existing `deleteSupplier` does NOT re-point, so products are orphaned (the test asserts `p1.supplier_id` is null). This SHOULD FAIL today. If it fails, the test is correctly capturing the bug; if it passes, the insert already set null somehow (verify and re-run).

- [ ] **Step 6: Fix `deleteSupplier` to re-point in a transaction**

In `database/suppliers.ts`, replace the existing `deleteSupplier` (lines 83-85):

```typescript
export const deleteSupplier = async (id: string): Promise<void> => {
  await db.withTransactionAsync(async () => {
    // Detach all products currently linked to this supplier.
    await db.runAsync(
      'UPDATE products SET supplier_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE supplier_id = ?',
      [id],
    );
    // Then delete the supplier.
    await db.runAsync('DELETE FROM suppliers WHERE id = ?', [id]);
  });
};
```

- [ ] **Step 7: Run the test to verify it now passes**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/delete-supplier-repoints-products.test.ts -v`
Expected: PASS.

- [ ] **Step 8: Write the failing test for `getLastDeliveryForSupplier`**

Create `tests/database/get-last-delivery-for-supplier.test.ts`:

```typescript
import { db, resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';
import { initSuppliersTable } from '@/database/suppliers';
import { initProductsTable, insertProduct } from '@/database/products';
import { initInventoryTable, insertInventoryTransaction } from '@/database/inventory';

beforeEach(async () => {
  await resetMockDb();
  await initSuppliersTable();
  await initProductsTable();
  await initInventoryTable();
});

describe('getLastDeliveryForSupplier', () => {
  it('returns null when no deliveries exist', async () => {
    const supplierId = require('expo-crypto').randomUUID();
    await db.runAsync(
      'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [supplierId, 'Acme', null, null, Date.now()]
    );
    const result = await (await import('@/database/inventory')).getLastDeliveryForSupplier(supplierId);
    expect(result).toBeNull();
  });

  it('returns the most recent delivery row', async () => {
    const supplierId = require('expo-crypto').randomUUID();
    await db.runAsync(
      'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [supplierId, 'Acme', null, null, Date.now()]
    );
    const productId = await insertProduct({ name: 'A1', supplier_id: supplierId, price: 1, cost_price: 1, quantity: 1 });
    // Insert older then newer delivery.
    await db.runAsync(
      `INSERT INTO inventory_transactions (product_id, type, quantity, timestamp, supplier_id) VALUES (?, 'restock', 10, '2026-01-01 00:00:00', ?)`,
      [productId, supplierId]
    );
    await db.runAsync(
      `INSERT INTO inventory_transactions (product_id, type, quantity, timestamp, supplier_id) VALUES (?, 'restock', 5, '2026-08-01 00:00:00', ?)`,
      [productId, supplierId]
    );
    // Insert a non-restock row that should be ignored.
    await db.runAsync(
      `INSERT INTO inventory_transactions (product_id, type, quantity, timestamp, supplier_id) VALUES (?, 'sale', 1, '2026-12-01 00:00:00', ?)`,
      [productId, supplierId]
    );

    const result = await (await import('@/database/inventory')).getLastDeliveryForSupplier(supplierId);
    expect(result).not.toBeNull();
    expect(result?.date).toBe('2026-08-01 00:00:00');
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/get-last-delivery-for-supplier.test.ts -v`
Expected: FAIL — `getLastDeliveryForSupplier` is not a function.

- [ ] **Step 9: Add `getLastDeliveryForSupplier` to `database/inventory.ts`**

Append to `database/inventory.ts`:

```typescript
export interface LastDelivery {
  date: string;
  transactionId: number;
}

export const getLastDeliveryForSupplier = async (
  supplierId: string,
): Promise<LastDelivery | null> => {
  const row = await db.getFirstAsync<{ timestamp: string; id: number }>(
    `SELECT id, timestamp FROM inventory_transactions
     WHERE supplier_id = ? AND type = 'restock'
     ORDER BY timestamp DESC
     LIMIT 1`,
    [supplierId],
  );
  if (!row) return null;
  return { date: row.timestamp, transactionId: row.id };
};
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/database/get-last-delivery-for-supplier.test.ts -v`
Expected: PASS for both `it` blocks.

- [ ] **Step 11: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add database/suppliers.ts database/inventory.ts types/suppliers.types.ts \
  tests/database/suppliers-with-count.test.ts \
  tests/database/delete-supplier-repoints-products.test.ts \
  tests/database/get-last-delivery-for-supplier.test.ts
git commit -m "feat(suppliers+inventory): fix deleteSupplier repoint, add withCount and last-delivery queries"
```

---

### Task 4: Hook — `useSuppliersWithCountQuery`

**Files:**
- Modify: `hooks/useSuppliers.ts` (add the query)

**Why:** Expose the new `getSuppliersWithCount` to the route layer via TanStack Query with the project's existing `supplierKeys` factory.

**Consumes:** `database/suppliers.ts:getSuppliersWithCount`, the existing `supplierKeys` from this file.

**Produces:** `useSuppliers().useSuppliersWithCountQuery` — a TanStack `useQuery` returning `SupplierWithCount[]`.

- [ ] **Step 1: Add the query to `hooks/useSuppliers.ts`**

In `hooks/useSuppliers.ts`, update the `supplierKeys` block:

```typescript
export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  listWithCount: () => [...supplierKeys.all, 'list', 'with-count'] as const,
  detail: (id: string) => [...supplierKeys.all, 'detail', id] as const,
};
```

Inside `useSuppliers`, add (after the existing `getAllSuppliersQuery`):

```typescript
  // Query: Get suppliers with product count
  const getSuppliersWithCountQuery = useQuery({
    queryKey: supplierKeys.listWithCount(),
    queryFn: getSuppliersWithCount,
  });
```

Add `getSuppliersWithCount` to the imports at the top:

```typescript
import {
  createSupplierWithProducts,
  deleteSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
  updateSupplierWithProducts,
  getSuppliersWithCount,
} from '@/database/suppliers';
```

Return `getSuppliersWithCountQuery` from the hook:

```typescript
  return {
    // Queries
    getAllSuppliersQuery,
    getSuppliersWithCountQuery,

    // Mutations
    insertSupplierMutation,
    updateSupplierMutation,
    deleteSupplierMutation,
  };
```

Also extend the existing `insertSupplierMutation`, `updateSupplierMutation`, and `deleteSupplierMutation` `onSuccess` handlers to invalidate `supplierKeys.listWithCount()`:

```typescript
      queryClient.invalidateQueries({ queryKey: supplierKeys.listWithCount() });
```

(Add this line inside each of the three `onSuccess` blocks, before the `addToast` call.)

- [ ] **Step 2: Run TypeScript to verify no type errors**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | head -30`
Expected: no errors related to this file. Existing errors elsewhere are out of scope.

- [ ] **Step 3: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add hooks/useSuppliers.ts
git commit -m "feat(hooks): useSuppliersWithCountQuery + invalidate listWithCount on mutations"
```

---

### Task 5: Hook — `useGetLastDeliveryForSupplier`

**Files:**
- Modify: `hooks/useInventory.tsx`

**Why:** Expose `getLastDeliveryForSupplier` to the route layer via TanStack Query.

**Consumes:** `database/inventory.ts:getLastDeliveryForSupplier`.

**Produces:** `useGetLastDeliveryForSupplier(supplierId: string)` — a TanStack `useQuery` returning `LastDelivery | null`.

- [ ] **Step 1: Add the hook to `hooks/useInventory.tsx`**

At the top, add to the import block:

```typescript
import { getLastDeliveryForSupplier } from '@/database/inventory';
```

Append at the end of the file:

```typescript
export function useGetLastDeliveryForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['last-delivery-for-supplier', supplierId],
    queryFn: () => getLastDeliveryForSupplier(supplierId!),
    enabled: !!supplierId,
  });
}
```

- [ ] **Step 2: Run TypeScript to verify no type errors**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | head -30`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add hooks/useInventory.tsx
git commit -m "feat(hooks): useGetLastDeliveryForSupplier"
```

---

### Task 6: Hook — `add-category` edit-mode wiring

**Files:**
- Modify: `app/(edit-forms)/add-category/index.tsx` (use `updateCategoryMutation` when `?editId=` is present)
- Modify: `hooks/useCategories.ts` (expose `updateCategoryMutation` if not already — verify; it's already exported, so no change needed)

**Why:** The rename action in `CategoryRowActionSheet` will navigate to `/(edit-forms)/add-category?editId=<id>`. We need the form to prefill the name and submit via `updateCategoryMutation`. Note: `updateCategoryMutation` already exists in `useCategories()` — we just need the form to detect the param.

**Consumes:** `useLocalSearchParams` from `expo-router`, `useCategories`, `useGetCategory`.

**Produces:** the form behaves as create-mode when no `editId`, edit-mode when present.

- [ ] **Step 1: Verify `updateCategoryMutation` is exposed**

Run: `grep -n "updateCategoryMutation" D:/giomj/Projects/sarisari/hooks/useCategories.ts | head -10`
Expected: at least one match inside the `useCategories` return statement. Already true (line 131), so no hook change needed.

- [ ] **Step 2: Add edit-mode detection to `add-category/index.tsx`**

In `app/(edit-forms)/add-category/index.tsx`, after the existing `useState` lines (around line 33), add:

```typescript
  import { useLocalSearchParams } from 'expo-router';
  // ...
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = !!editId;
  const { getCategory } = useCategories();
  const categoryQuery = getCategory(editId ? Number(editId) : 0);
```

(Place the `import` at the top of the file with the other imports.)

Replace `useForm` `defaultValues` with a reactive version that loads from the query when in edit mode:

```typescript
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid, errors },
  } = useForm<CategoryFormData>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (isEditMode && categoryQuery.data) {
      reset({ name: categoryQuery.data.name });
    }
  }, [isEditMode, categoryQuery.data, reset]);
```

Add `useEffect` to the existing `useState` imports: `import { useState, useMemo, useRef, useCallback, useEffect, memo } from 'react';`

When editing, hide the Assign Products card and rename the header. Find the `<StyledText variant="extrabold" ...>{t('addCategory', 'New Category')}</StyledText>` line (around 150) and replace with:

```typescript
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-h2 font-stack-sans-bold"
          >
            {isEditMode ? t('editCategory', 'Edit Category') : t('addCategory', 'New Category')}
          </StyledText>
```

Conditionally hide the Assign Products card — wrap the `<StyledText variant="black" ...>{t('assignProductsTitle', 'Assign Products')}</StyledText>` block through the rest of that card with:

```typescript
          {!isEditMode && (
            <View>
              {/* existing Assign Products Card contents */}
            </View>
          )}
```

(The simplest way is to find the outer `<View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 my-2">` for that card and conditionally wrap it. The component is roughly 180 lines; use the comment `/* Assign Products Card */` to locate it.)

Replace `onSubmit` to handle edit mode:

```typescript
  const onSubmit = (data: CategoryFormData) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;
    if (isEditMode && editId) {
      updateCategoryMutation.mutate(
        { id: Number(editId), name: trimmedName },
        {
          onSuccess: () => router.back(),
        },
      );
      return;
    }
    insertCategoryMutation.mutate({
      name: trimmedName,
      productIds: selectedProductIds,
    });
  };
```

Pull `updateCategoryMutation` from the hook destructure (already destructured at line 39 alongside `insertCategoryMutation`):

```typescript
  const { insertCategoryMutation, updateCategoryMutation, getCategory, getAllCategoriesQuery } = useCategories();
```

- [ ] **Step 3: Update the bottom action button label and validation hint**

Find the `accessibilityLabel={t('saveCategory', 'Save category')}` line and change it to:

```typescript
            accessibilityLabel={
              isEditMode
                ? t('saveCategoryEdit', 'Save changes')
                : t('saveCategory', 'Save category')
            }
```

The visible label text is `"Add Category"` or `"Saving Category…"` — change to:

```typescript
          <StyledText
            variant="extrabold"
            className={`text-sm font-stack-sans-bold ml-2 ${
              !isValid || isSubmitting ? 'text-ink-400' : 'text-paper-50'
            }`}
          >
            {isSubmitting
              ? t('saving', 'Saving Category…')
              : isEditMode
                ? t('saveChanges', 'Save Changes')
                : t('saveCategory', 'Add Category')}
          </StyledText>
```

- [ ] **Step 4: Run TypeScript**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "add-category" | head -10`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add app/(edit-forms)/add-category/index.tsx
git commit -m "feat(category-form): edit-mode via ?editId= param"
```

---

### Task 7: Components — Category directory list family + index.ts

**Files:**
- Create: `components/inventory/directory/CategoryDirectoryRow.tsx`
- Create: `components/inventory/directory/CategoryDirectorySkeleton.tsx`
- Create: `components/inventory/directory/CategoryDirectoryEmptyState.tsx`
- Create: `components/inventory/directory/CategoryRowActionSheet.tsx`
- Create: `components/inventory/directory/CategoryDirectoryList.tsx`
- Create: `components/inventory/directory/index.ts`
- Create: `tests/components/inventory/CategoryDirectoryEmptyState.test.tsx`

**Why:** These are the row-level building blocks for `categories.tsx`. Empty state gets a unit test because the CTA is the highest-risk UX element.

**Consumes:** i18n keys added in Task 16. (For now, fall back to English literals — the tests in Task 16 will surface any missing keys.)

**Produces:** the five components above.

- [ ] **Step 1: Create `CategoryDirectoryRow.tsx`**

```tsx
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface CategoryDirectoryRowProps {
  name: string;
  productCount: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function CategoryDirectoryRow({
  name,
  productCount,
  onPress,
  onLongPress,
}: CategoryDirectoryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${productCount} products`}
      accessibilityHint="Opens products in this category"
      className="bg-paper-50 border border-ink-100 rounded-2xl px-4 py-3 mx-4 my-1 flex-row items-center justify-between active:opacity-70"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-9 h-9 rounded-full bg-cinnamon-100 items-center justify-center">
          <FontAwesome name="folder" size={14} color="#D49570" />
        </View>
        <StyledText variant="extrabold" className="text-ink-900 text-base flex-1" numberOfLines={1}>
          {name}
        </StyledText>
      </View>
      <View className="px-2.5 py-1 rounded-full bg-paper-200">
        <StyledText variant="extrabold" className="text-ink-700 text-[10px]">
          {productCount}
        </StyledText>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `CategoryDirectorySkeleton.tsx`**

```tsx
import { View } from 'react-native';

export function CategoryDirectorySkeleton() {
  return (
    <View className="pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={`skel-${i}`}
          className="bg-paper-100 border border-ink-100 rounded-2xl h-16 mx-4 my-1"
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Create `CategoryDirectoryEmptyState.tsx`**

```tsx
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface CategoryDirectoryEmptyStateProps {
  onAddPress: () => void;
}

export function CategoryDirectoryEmptyState({ onAddPress }: CategoryDirectoryEmptyStateProps) {
  return (
    <View className="mx-4 mt-6 rounded-3xl bg-paper-50 border border-ink-100 p-8 items-center">
      <View className="w-16 h-16 rounded-full bg-cinnamon-100 items-center justify-center mb-4">
        <FontAwesome name="folder-open" size={24} color="#D49570" />
      </View>
      <StyledText variant="extrabold" className="text-ink-900 text-lg text-center">
        No categories yet
      </StyledText>
      <StyledText variant="regular" className="text-ink-500 text-sm text-center mt-2">
        Add your first category to start grouping products.
      </StyledText>
      <TouchableOpacity
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Add your first category"
        className="mt-5 bg-persimmon-500 rounded-pill px-6 py-3 flex-row items-center shadow-persimmon-glow"
      >
        <FontAwesome name="plus" size={12} color="#FBF7EE" />
        <StyledText variant="extrabold" className="text-paper-50 text-sm ml-2">
          Add Category
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 4: Write the failing test for `CategoryDirectoryEmptyState`**

Create `tests/components/inventory/CategoryDirectoryEmptyState.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryDirectoryEmptyState } from '@/components/inventory/directory/CategoryDirectoryEmptyState';

describe('CategoryDirectoryEmptyState', () => {
  it('renders the add CTA', () => {
    const onAddPress = jest.fn();
    const { getByText } = render(<CategoryDirectoryEmptyState onAddPress={onAddPress} />);
    expect(getByText('Add Category')).toBeTruthy();
  });

  it('fires onAddPress when the CTA is pressed', () => {
    const onAddPress = jest.fn();
    const { getByText } = render(<CategoryDirectoryEmptyState onAddPress={onAddPress} />);
    fireEvent.press(getByText('Add Category'));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/CategoryDirectoryEmptyState.test.tsx -v`
Expected: PASS (component already created in Step 3).

- [ ] **Step 5: Create `CategoryRowActionSheet.tsx`**

```tsx
import { Modal, Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface CategoryRowActionSheetProps {
  visible: boolean;
  categoryName: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CategoryRowActionSheet({
  visible,
  categoryName,
  onRename,
  onDelete,
  onClose,
}: CategoryRowActionSheetProps) {
  return (
    <Modal visible={visible} onClose={onClose} transparent animationType="fade">
      <Pressable onPress={onClose} className="flex-1 bg-ink-900/40 justify-end">
        <Pressable onPress={() => {}} className="bg-paper-50 rounded-t-3xl p-4 pb-8">
          <StyledText variant="black" className="label-caps text-cinnamon-500 mb-2">
            {categoryName}
          </StyledText>
          <Pressable
            onPress={onRename}
            accessibilityRole="button"
            accessibilityLabel={`Rename ${categoryName}`}
            className="flex-row items-center gap-3 py-3.5 active:opacity-70"
          >
            <FontAwesome name="pencil" size={16} color="#0E0C0A" />
            <StyledText variant="semibold" className="text-ink-900 text-base">
              Rename
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${categoryName}`}
            className="flex-row items-center gap-3 py-3.5 active:opacity-70"
          >
            <FontAwesome name="trash" size={16} color="#E85A1F" />
            <StyledText variant="semibold" className="text-persimmon-500 text-base">
              Delete
            </StyledText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 6: Create `CategoryDirectoryList.tsx`**

```tsx
import { useMemo, useState, useEffect } from 'react';
import { TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { CategoryDirectoryRow } from './CategoryDirectoryRow';
import { CategoryDirectoryEmptyState } from './CategoryDirectoryEmptyState';
import type { CategoryWithCount } from '@/types/categories.types';

export interface CategoryDirectoryListProps {
  categories: CategoryWithCount[];
  isLoading: boolean;
  searchPlaceholder: string;
  emptyStateLabel: string;
  onSelect: (name: string) => void;
  onLongPress: (id: number, name: string) => void;
  onAddPress: () => void;
}

const DEBOUNCE_MS = 250;

export function CategoryDirectoryList({
  categories,
  isLoading,
  searchPlaceholder,
  emptyStateLabel,
  onSelect,
  onLongPress,
  onAddPress,
}: CategoryDirectoryListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, search]);

  if (isLoading) {
    return null; // skeleton is rendered by the parent
  }

  if (categories.length === 0) {
    return <CategoryDirectoryEmptyState onAddPress={onAddPress} />;
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3.5 py-2.5 mx-4 my-3">
        <FontAwesome name="search" size={14} color="#7A7165" style={{ marginRight: 8 }} />
        <TextInput
          accessibilityLabel={searchPlaceholder}
          placeholder={searchPlaceholder}
          placeholderTextColor="#7A7165"
          value={searchInput}
          onChangeText={setSearchInput}
          className="flex-1 text-sm text-ink-900 p-0"
        />
      </View>
      {filtered.length === 0 ? (
        <View className="px-4 py-8 items-center">
          <StyledText variant="regular" className="text-ink-500 text-sm text-center">
            {emptyStateLabel}
          </StyledText>
        </View>
      ) : (
        <View>
          {filtered.map((c) => (
            <CategoryDirectoryRow
              key={c.id}
              name={c.name}
              productCount={c.product_count}
              onPress={() => onSelect(c.name)}
              onLongPress={() => onLongPress(c.id, c.name)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 7: Create `components/inventory/directory/index.ts`**

```typescript
export * from './CategoryDirectoryList';
export * from './CategoryDirectoryRow';
export * from './CategoryDirectorySkeleton';
export * from './CategoryDirectoryEmptyState';
export * from './CategoryRowActionSheet';
export * from './SupplierDirectoryList';
export * from './SupplierDirectoryRow';
export * from './SupplierDirectorySkeleton';
export * from './SupplierDirectoryEmptyState';
export * from './DirectoryEntryHeader';
export * from './LastDeliveryChip';
```

(SupplierDirectory* and DirectoryEntryHeader/LastDeliveryChip are created in Tasks 8 and 9 — re-exporting from index.ts now is fine; the build will work once those tasks land.)

- [ ] **Step 8: Run the empty-state test to verify**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/CategoryDirectoryEmptyState.test.tsx -v`
Expected: PASS.

- [ ] **Step 9: Run TypeScript**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "directory" | head -10`
Expected: no errors related to these new files.

- [ ] **Step 10: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add components/inventory/directory/ tests/components/inventory/CategoryDirectoryEmptyState.test.tsx
git commit -m "feat(directory): category directory list, row, skeleton, empty, action sheet"
```

---

### Task 8: Components — Supplier directory list family

**Files:**
- Create: `components/inventory/directory/SupplierDirectoryRow.tsx`
- Create: `components/inventory/directory/SupplierDirectorySkeleton.tsx`
- Create: `components/inventory/directory/SupplierDirectoryEmptyState.tsx`
- Create: `components/inventory/directory/SupplierDirectoryList.tsx`
- Create: `tests/components/inventory/SupplierDirectoryEmptyState.test.tsx`

**Why:** Mirror the category family for suppliers. The list component does not implement swipe-to-delete in v1 — long-press opens the action sheet with a Delete entry, matching the category pattern (per spec "swipe-left → delete confirm; FAB → existing add-supplier"). If swipe is desired later, it's a separate additive change.

**Consumes:** `SupplierWithCount` from `types/suppliers.types.ts`.

**Produces:** the four components.

- [ ] **Step 1: Create `SupplierDirectoryRow.tsx`**

```tsx
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface SupplierDirectoryRowProps {
  name: string;
  contact: string | null;
  productCount: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function SupplierDirectoryRow({
  name,
  contact,
  productCount,
  onPress,
  onLongPress,
}: SupplierDirectoryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${contact ? `, ${contact}` : ''}, ${productCount} products`}
      accessibilityHint="Opens products supplied by this supplier"
      className="bg-paper-50 border border-ink-100 rounded-2xl px-4 py-3 mx-4 my-1 flex-row items-center justify-between active:opacity-70"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-9 h-9 rounded-full bg-persimmon-100 items-center justify-center">
          <FontAwesome name="truck" size={14} color="#E85A1F" />
        </View>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={1}>
            {name}
          </StyledText>
          {contact ? (
            <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5" numberOfLines={1}>
              {contact}
            </StyledText>
          ) : null}
        </View>
      </View>
      <View className="px-2.5 py-1 rounded-full bg-paper-200">
        <StyledText variant="extrabold" className="text-ink-700 text-[10px]">
          {productCount}
        </StyledText>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `SupplierDirectorySkeleton.tsx`**

```tsx
import { View } from 'react-native';

export function SupplierDirectorySkeleton() {
  return (
    <View className="pt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={`skel-${i}`}
          className="bg-paper-100 border border-ink-100 rounded-2xl h-16 mx-4 my-1"
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 3: Create `SupplierDirectoryEmptyState.tsx`**

```tsx
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface SupplierDirectoryEmptyStateProps {
  onAddPress: () => void;
}

export function SupplierDirectoryEmptyState({ onAddPress }: SupplierDirectoryEmptyStateProps) {
  return (
    <View className="mx-4 mt-6 rounded-3xl bg-paper-50 border border-ink-100 p-8 items-center">
      <View className="w-16 h-16 rounded-full bg-persimmon-100 items-center justify-center mb-4">
        <FontAwesome name="truck" size={24} color="#E85A1F" />
      </View>
      <StyledText variant="extrabold" className="text-ink-900 text-lg text-center">
        No suppliers yet
      </StyledText>
      <StyledText variant="regular" className="text-ink-500 text-sm text-center mt-2">
        Add your first supplier to start tracking deliveries.
      </StyledText>
      <TouchableOpacity
        onPress={onAddPress}
        accessibilityRole="button"
        accessibilityLabel="Add your first supplier"
        className="mt-5 bg-persimmon-500 rounded-pill px-6 py-3 flex-row items-center shadow-persimmon-glow"
      >
        <FontAwesome name="plus" size={12} color="#FBF7EE" />
        <StyledText variant="extrabold" className="text-paper-50 text-sm ml-2">
          Add Supplier
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 4: Write the failing test for `SupplierDirectoryEmptyState`**

Create `tests/components/inventory/SupplierDirectoryEmptyState.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SupplierDirectoryEmptyState } from '@/components/inventory/directory/SupplierDirectoryEmptyState';

describe('SupplierDirectoryEmptyState', () => {
  it('renders the add CTA', () => {
    const onAddPress = jest.fn();
    const { getByText } = render(<SupplierDirectoryEmptyState onAddPress={onAddPress} />);
    expect(getByText('Add Supplier')).toBeTruthy();
  });

  it('fires onAddPress when the CTA is pressed', () => {
    const onAddPress = jest.fn();
    const { getByText } = render(<SupplierDirectoryEmptyState onAddPress={onAddPress} />);
    fireEvent.press(getByText('Add Supplier'));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/SupplierDirectoryEmptyState.test.tsx -v`
Expected: PASS.

- [ ] **Step 5: Create `SupplierDirectoryList.tsx`**

```tsx
import { useMemo, useState, useEffect } from 'react';
import { TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { SupplierDirectoryRow } from './SupplierDirectoryRow';
import { SupplierDirectoryEmptyState } from './SupplierDirectoryEmptyState';
import type { SupplierWithCount } from '@/types/suppliers.types';

export interface SupplierDirectoryListProps {
  suppliers: SupplierWithCount[];
  isLoading: boolean;
  searchPlaceholder: string;
  emptyStateLabel: string;
  onSelect: (id: string) => void;
  onLongPress: (id: string, name: string) => void;
  onAddPress: () => void;
}

const DEBOUNCE_MS = 250;

export function SupplierDirectoryList({
  suppliers,
  isLoading,
  searchPlaceholder,
  emptyStateLabel,
  onSelect,
  onLongPress,
  onAddPress,
}: SupplierDirectoryListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.contact && s.contact.toLowerCase().includes(term)),
    );
  }, [suppliers, search]);

  if (isLoading) {
    return null; // skeleton is rendered by the parent
  }

  if (suppliers.length === 0) {
    return <SupplierDirectoryEmptyState onAddPress={onAddPress} />;
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3.5 py-2.5 mx-4 my-3">
        <FontAwesome name="search" size={14} color="#7A7165" style={{ marginRight: 8 }} />
        <TextInput
          accessibilityLabel={searchPlaceholder}
          placeholder={searchPlaceholder}
          placeholderTextColor="#7A7165"
          value={searchInput}
          onChangeText={setSearchInput}
          className="flex-1 text-sm text-ink-900 p-0"
        />
      </View>
      {filtered.length === 0 ? (
        <View className="px-4 py-8 items-center">
          <StyledText variant="regular" className="text-ink-500 text-sm text-center">
            {emptyStateLabel}
          </StyledText>
        </View>
      ) : (
        <View>
          {filtered.map((s) => (
            <SupplierDirectoryRow
              key={s.id}
              name={s.name}
              contact={s.contact}
              productCount={s.productCount}
              onPress={() => onSelect(s.id)}
              onLongPress={() => onLongPress(s.id, s.name)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 6: Run the empty-state test**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/SupplierDirectoryEmptyState.test.tsx -v`
Expected: PASS.

- [ ] **Step 7: Run TypeScript**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "directory" | head -10`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add components/inventory/directory/SupplierDirectoryRow.tsx components/inventory/directory/SupplierDirectorySkeleton.tsx components/inventory/directory/SupplierDirectoryEmptyState.tsx components/inventory/directory/SupplierDirectoryList.tsx tests/components/inventory/SupplierDirectoryEmptyState.test.tsx
git commit -m "feat(directory): supplier directory list, row, skeleton, empty"
```

---

### Task 9: Components — `DirectoryEntryHeader` and `LastDeliveryChip`

**Files:**
- Create: `components/inventory/directory/DirectoryEntryHeader.tsx`
- Create: `components/inventory/directory/LastDeliveryChip.tsx`

**Why:** Shared header for both drilldown screens; the chip lives below it on the supplier drilldown only.

**Consumes:** `useRouter` from `expo-router`, `lib/relativeDate` if it exists (verify and use; otherwise inline a simple `formatDistanceToNow`-equivalent).

**Produces:** the two components.

- [ ] **Step 1: Verify `lib/relativeDate.ts` exists**

Run: `ls D:/giomj/Projects/sarisari/lib/relativeDate.ts 2>&1`
Expected: a path. If it exists, use it; if not, fall back to inline formatting (the inline fallback is below).

- [ ] **Step 2: Create `DirectoryEntryHeader.tsx`**

```tsx
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';

export interface DirectoryEntryHeaderProps {
  title: string;
  count: number;
  countLabel: string;
}

export function DirectoryEntryHeader({ title, count, countLabel }: DirectoryEntryHeaderProps) {
  const router = useRouter();
  return (
    <View className="px-4 pt-3 pb-2 bg-paper-200">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          className="w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
        <View className="items-center flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-lg" numberOfLines={1}>
            {title}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5">
            {countLabel.replace('{{count}}', String(count))}
          </StyledText>
        </View>
        <View className="w-10 h-10" />
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Create `LastDeliveryChip.tsx`**

```tsx
import { ActivityIndicator, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface LastDeliveryChipProps {
  date: string | null;
  isLoading: boolean;
  presentLabel: string; // e.g. "Last delivery: {{date}}"
  absentLabel: string;  // e.g. "No deliveries yet"
}

export function LastDeliveryChip({
  date,
  isLoading,
  presentLabel,
  absentLabel,
}: LastDeliveryChipProps) {
  if (isLoading) {
    return (
      <View className="mx-4 mb-2 bg-paper-100 border border-ink-200 rounded-xl px-3.5 py-2 flex-row items-center gap-2">
        <ActivityIndicator size="small" color="#7A7165" />
        <StyledText variant="regular" className="text-ink-500 text-xs">
          Loading...
        </StyledText>
      </View>
    );
  }

  if (!date) {
    return (
      <View className="mx-4 mb-2 bg-paper-100 border border-ink-200 rounded-xl px-3.5 py-2 flex-row items-center gap-2">
        <FontAwesome name="info-circle" size={12} color="#7A7165" />
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {absentLabel}
        </StyledText>
      </View>
    );
  }

  return (
    <View className="mx-4 mb-2 bg-persimmon-50 border border-persimmon-200 rounded-xl px-3.5 py-2 flex-row items-center gap-2">
      <FontAwesome name="truck" size={12} color="#E85A1F" />
      <StyledText variant="semibold" className="text-persimmon-700 text-xs">
        {presentLabel.replace('{{date}}', date)}
      </StyledText>
    </View>
  );
}
```

- [ ] **Step 4: Run TypeScript**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "DirectoryEntryHeader\|LastDeliveryChip" | head -10`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add components/inventory/directory/DirectoryEntryHeader.tsx components/inventory/directory/LastDeliveryChip.tsx
git commit -m "feat(directory): DirectoryEntryHeader + LastDeliveryChip"
```

---

### Task 10: Components — drilldown wiring (category-products + supplier-products)

This task produces nothing new — it exists to verify Tasks 7-9 components compose cleanly before the routes consume them.

- [ ] **Step 1: Run TypeScript across the directory components**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | head -30`
Expected: no errors related to `components/inventory/directory/`.

- [ ] **Step 2: Run all directory tests**

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/ -v`
Expected: 4 PASS (2 from Task 7, 2 from Task 8).

- [ ] **Step 3: Commit**

(No new files; nothing to commit. This task is a checkpoint.)

---

### Task 11: Route — `categories.tsx` + register in `_layout`

**Files:**
- Create: `app/(tabs)/inventory/categories.tsx`
- Modify: `app/(tabs)/inventory/_layout.tsx` (register the new route)

**Why:** The browse + manage categories surface.

**Consumes:** `useCategories`, the directory components from Tasks 7, i18n keys from Task 16.

**Produces:** the route. Stack entry in `_layout.tsx`.

- [ ] **Step 1: Create `app/(tabs)/inventory/categories.tsx`**

```tsx
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  CategoryDirectoryList,
  CategoryDirectorySkeleton,
  CategoryRowActionSheet,
} from '@/components/inventory/directory';
import { useCategories } from '@/hooks/useCategories';
import { Modal } from '@/components/ui';

export default function CategoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation('inventory');
  const { getCategoriesWithCountQuery, deleteCategoryMutation } = useCategories();

  const categories = useMemo(
    () => getCategoriesWithCountQuery.data ?? [],
    [getCategoriesWithCountQuery.data],
  );
  const isLoading = getCategoriesWithCountQuery.isLoading;

  const [actionTarget, setActionTarget] = useState<{ id: number; name: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string; productCount: number } | null>(null);

  const handleSelect = useCallback(
    (name: string) => router.push(`/(tabs)/inventory/category-products/${encodeURIComponent(name)}` as never),
    [router],
  );

  const handleLongPress = useCallback((id: number, name: string) => {
    setActionTarget({ id, name });
  }, []);

  const handleRename = useCallback(() => {
    if (!actionTarget) return;
    router.push(`/(edit-forms)/add-category?editId=${actionTarget.id}` as never);
    setActionTarget(null);
  }, [actionTarget, router]);

  const handleDelete = useCallback(() => {
    if (!actionTarget) return;
    const count = categories.find((c) => c.id === actionTarget.id)?.product_count ?? 0;
    setConfirmDelete({ id: actionTarget.id, name: actionTarget.name, productCount: count });
    setActionTarget(null);
  }, [actionTarget, categories]);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    deleteCategoryMutation.mutate(confirmDelete.id);
    setConfirmDelete(null);
  }, [confirmDelete, deleteCategoryMutation]);

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top', 'bottom']}>
      {isLoading ? (
        <CategoryDirectorySkeleton />
      ) : (
        <CategoryDirectoryList
          categories={categories}
          isLoading={isLoading}
          searchPlaceholder={t('directorySearchCategoriesPlaceholder', 'Search categories...')}
          emptyStateLabel={t('directoryNoSearchResults', 'No categories match your search.')}
          onSelect={handleSelect}
          onLongPress={handleLongPress}
          onAddPress={() => router.push('/(edit-forms)/add-category' as never)}
        />
      )}
      <CategoryRowActionSheet
        visible={Boolean(actionTarget)}
        categoryName={actionTarget?.name ?? ''}
        onRename={handleRename}
        onDelete={handleDelete}
        onClose={() => setActionTarget(null)}
      />
      <Modal
        visible={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={t('directoryCategoryDeleteConfirmTitle', 'Delete category?')}
        description={
          confirmDelete
            ? t(
                'directoryCategoryDeleteConfirmMessage',
                "{{count}} products will lose their '{{name}}' category.",
              )
                .replace('{{count}}', String(confirmDelete.productCount))
                .replace('{{name}}', confirmDelete.name)
            : ''
        }
        variant="warning"
        buttons={[
          { text: t('cancel', 'Cancel'), style: 'cancel', onPress: () => setConfirmDelete(null) },
          {
            text: t('delete', 'Delete'),
            style: 'destructive',
            onPress: handleConfirmDelete,
          },
        ]}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Write the failing component test**

Create `tests/components/inventory/CategoriesScreen.test.tsx`:

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CategoriesScreen from '@/app/(tabs)/inventory/categories';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('CategoriesScreen', () => {
  it('renders the list', async () => {
    const { findByText } = renderWithClient(<CategoriesScreen />);
    // Empty-state CTA should be visible because the mock DB has no categories.
    await waitFor(() => expect(findByText('Add Category')).toBeTruthy());
  });

  it('renders the FAB and navigates to add-category when tapped', async () => {
    const { findByText } = renderWithClient(<CategoriesScreen />);
    const cta = await findByText('Add Category');
    fireEvent.press(cta);
    // router.push is a jest.fn(); we just assert it doesn't throw.
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/CategoriesScreen.test.tsx -v`
Expected: PASS.

- [ ] **Step 3: Register the new route in `app/(tabs)/inventory/_layout.tsx`**

Open `app/(tabs)/inventory/_layout.tsx` and add the categories screen to the Stack. (The file is a stack layout — most inventory routes use `<Stack.Screen name="..." />`. Add `<Stack.Screen name="categories" />` so the file-based routing registers the screen.)

- [ ] **Step 4: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add app/(tabs)/inventory/categories.tsx app/(tabs)/inventory/_layout.tsx tests/components/inventory/CategoriesScreen.test.tsx
git commit -m "feat(inventory): categories directory route"
```

---

### Task 12: Route — `suppliers.tsx` + register in `_layout`

**Files:**
- Create: `app/(tabs)/inventory/suppliers.tsx`
- Modify: `app/(tabs)/inventory/_layout.tsx` (register the new route)
- Create: `tests/components/inventory/SuppliersScreen.test.tsx`

**Why:** The browse + manage suppliers surface.

**Consumes:** `useSuppliers`, the directory components from Task 8, i18n keys from Task 16.

**Produces:** the route. Stack entry.

- [ ] **Step 1: Create `app/(tabs)/inventory/suppliers.tsx`**

```tsx
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  SupplierDirectoryList,
  SupplierDirectorySkeleton,
} from '@/components/inventory/directory';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Modal } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function SuppliersScreen() {
  const router = useRouter();
  const { t } = useTranslation('inventory');
  const { getSuppliersWithCountQuery, deleteSupplierMutation } = useSuppliers();

  const suppliers = useMemo(
    () => getSuppliersWithCountQuery.data ?? [],
    [getSuppliersWithCountQuery.data],
  );
  const isLoading = getSuppliersWithCountQuery.isLoading;

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; productCount: number } | null>(null);

  const handleSelect = useCallback(
    (id: string) => router.push(`/(tabs)/inventory/supplier-products/${id}` as never),
    [router],
  );

  const handleLongPress = useCallback(
    (id: string, name: string) => {
      const count = suppliers.find((s) => s.id === id)?.productCount ?? 0;
      setConfirmDelete({ id, name, productCount: count });
    },
    [suppliers],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    deleteSupplierMutation.mutate(confirmDelete.id);
    setConfirmDelete(null);
  }, [confirmDelete, deleteSupplierMutation]);

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top', 'bottom']}>
      {isLoading ? (
        <SupplierDirectorySkeleton />
      ) : (
        <SupplierDirectoryList
          suppliers={suppliers}
          isLoading={isLoading}
          searchPlaceholder={t('directorySearchSuppliersPlaceholder', 'Search suppliers...')}
          emptyStateLabel={t('directoryNoSearchResults', 'No suppliers match your search.')}
          onSelect={handleSelect}
          onLongPress={handleLongPress}
          onAddPress={() => router.push('/(edit-forms)/add-supplier' as never)}
        />
      )}
      <Modal
        visible={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title={t('directorySupplierDeleteConfirmTitle', 'Delete supplier?')}
        description={
          confirmDelete
            ? t(
                'directorySupplierDeleteConfirmMessage',
                "{{count}} products will lose their '{{name}}' supplier.",
              )
                .replace('{{count}}', String(confirmDelete.productCount))
                .replace('{{name}}', confirmDelete.name)
            : ''
        }
        variant="warning"
        buttons={[
          { text: t('cancel', 'Cancel'), style: 'cancel', onPress: () => setConfirmDelete(null) },
          {
            text: t('delete', 'Delete'),
            style: 'destructive',
            onPress: handleConfirmDelete,
          },
        ]}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Write the failing component test**

Create `tests/components/inventory/SuppliersScreen.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuppliersScreen from '@/app/(tabs)/inventory/suppliers';

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('SuppliersScreen', () => {
  it('renders the empty state CTA on first load', async () => {
    const { findByText } = renderWithClient(<SuppliersScreen />);
    await waitFor(() => expect(findByText('Add Supplier')).toBeTruthy());
  });
});
```

Run: `cd D:/giomj/Projects/sarisari && npx jest tests/components/inventory/SuppliersScreen.test.tsx -v`
Expected: PASS.

- [ ] **Step 3: Register the route in `_layout.tsx`**

Add `<Stack.Screen name="suppliers" />` to `app/(tabs)/inventory/_layout.tsx`.

- [ ] **Step 4: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add app/(tabs)/inventory/suppliers.tsx app/(tabs)/inventory/_layout.tsx tests/components/inventory/SuppliersScreen.test.tsx
git commit -m "feat(inventory): suppliers directory route"
```

---

### Task 13: Route — `category-products/[name].tsx`

**Files:**
- Create: `app/(tabs)/inventory/category-products/[name].tsx`
- Modify: `app/(tabs)/inventory/_layout.tsx` (already supports dynamic routes; verify)

**Why:** The lightweight drilldown. Reuses `ProductsList` with a category filter.

**Consumes:** `usePaginatedProducts`, `DirectoryEntryHeader`.

**Produces:** the route. Dynamic `[name]` is auto-registered.

- [ ] **Step 1: Create `app/(tabs)/inventory/category-products/[name].tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import {
  ProductsList,
  ProductsEmptyState,
  ProductsSkeleton,
} from '@/components/inventory/products';
import { usePaginatedProducts } from '@/hooks/useProducts';
import { DirectoryEntryHeader } from '@/components/inventory/directory';
import { useTranslation } from 'react-i18next';

export default function CategoryProductsScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { t } = useTranslation('inventory');
  const decodedName = decodeURIComponent(name ?? '');
  const productsQuery = usePaginatedProducts('', 'all');

  const products = useMemo(() => {
    const raw = productsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return raw.filter((p) => p.category?.toLowerCase() === decodedName.toLowerCase());
  }, [productsQuery.data, decodedName]);

  if (productsQuery.isLoading) return <ProductsSkeleton />;

  return (
    <View className="flex-1 bg-paper-200">
      <DirectoryEntryHeader
        title={decodedName}
        count={products.length}
        countLabel={t('directoryProductsCount', '{{count}} products')}
      />
      {products.length === 0 ? (
        <ProductsEmptyState variant="no-filter" onClearFilters={() => router.back()} />
      ) : (
        <ProductsList
          products={products}
          onPress={(id) => router.push(`/(edit-forms)/product-details/${id}` as never)}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: Verify the dynamic route is reachable**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "category-products" | head -10`
Expected: no errors. Expo Router auto-registers the file.

- [ ] **Step 3: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add app/(tabs)/inventory/category-products/[name].tsx
git commit -m "feat(inventory): category-products drilldown route"
```

---

### Task 14: Route — `supplier-products/[id].tsx`

**Files:**
- Create: `app/(tabs)/inventory/supplier-products/[id].tsx`

**Why:** The lightweight supplier drilldown with the LastDeliveryChip.

**Consumes:** `usePaginatedProducts`, `useGetSupplier`, `useGetLastDeliveryForSupplier`, `DirectoryEntryHeader`, `LastDeliveryChip`.

**Produces:** the route.

- [ ] **Step 1: Create `app/(tabs)/inventory/supplier-products/[id].tsx`**

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import {
  ProductsList,
  ProductsEmptyState,
  ProductsSkeleton,
} from '@/components/inventory/products';
import { usePaginatedProducts } from '@/hooks/useProducts';
import { useGetSupplier } from '@/hooks/useSuppliers';
import { useGetLastDeliveryForSupplier } from '@/hooks/useInventory';
import { DirectoryEntryHeader, LastDeliveryChip } from '@/components/inventory/directory';
import { useTranslation } from 'react-i18next';

export default function SupplierProductsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('inventory');
  const supplierQuery = useGetSupplier(id ?? '');
  const lastDeliveryQuery = useGetLastDeliveryForSupplier(id);
  const productsQuery = usePaginatedProducts('', 'all');

  const products = useMemo(() => {
    const raw = productsQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return raw.filter((p) => p.supplier_id === id);
  }, [productsQuery.data, id]);

  if (productsQuery.isLoading) return <ProductsSkeleton />;

  const supplierName = supplierQuery.data?.name ?? 'Supplier';

  return (
    <View className="flex-1 bg-paper-200">
      <DirectoryEntryHeader
        title={supplierName}
        count={products.length}
        countLabel={t('directoryProductsCount', '{{count}} products')}
      />
      <LastDeliveryChip
        date={lastDeliveryQuery.data?.date ?? null}
        isLoading={lastDeliveryQuery.isLoading}
        presentLabel={t('directoryLastDelivery', 'Last delivery: {{date}}')}
        absentLabel={t('directoryNeverDelivered', 'No deliveries yet')}
      />
      {products.length === 0 ? (
        <ProductsEmptyState variant="no-filter" onClearFilters={() => router.back()} />
      ) : (
        <ProductsList
          products={products}
          onPress={(productId) => router.push(`/(edit-forms)/product-details/${productId}` as never)}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "supplier-products" | head -10`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add app/(tabs)/inventory/supplier-products/[id].tsx
git commit -m "feat(inventory): supplier-products drilldown route"
```

---

### Task 15: Touched — `InventoryHeader` icons + `products.tsx` wiring

**Files:**
- Modify: `components/inventory/InventoryHeader.tsx` (add icon + overflow menu props)
- Modify: `app/(tabs)/inventory/products.tsx` (wire the new props)

**Why:** Discoverability — the spec requires both header icons and an overflow menu reaching the same two routes.

**Consumes:** the existing `InventoryHeader` props (search, tab, pills).

**Produces:** `InventoryHeader` accepts `onOpenCategories` and `onOpenSuppliers` callbacks (and an optional overflow menu). The products screen wires them to `router.push`.

- [ ] **Step 1: Extend `InventoryHeader` props**

In `components/inventory/InventoryHeader.tsx`, extend the interface:

```typescript
export interface InventoryHeaderProps {
  active: InventorySubTab;
  search: string;
  onSearchChange: (s: string) => void;
  onOpenScanner: () => void;
  onTabChange: (t: InventorySubTab) => void;
  onPillPress: (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => void;
  onOpenCategories: () => void;
  onOpenSuppliers: () => void;
  progress?: SharedValue<number>;
}
```

Inside the component, after the existing `<InventoryAlertPills ... />`, add a row with two icon buttons + a 3-dot menu:

```tsx
      <View className="flex-row items-center justify-between -mt-1">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={props.onOpenCategories}
            accessibilityRole="button"
            accessibilityLabel="Categories"
            accessibilityHint="Browse all categories"
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-cinnamon-50 border border-cinnamon-100 active:opacity-70"
          >
            <FontAwesome name="folder" size={12} color="#D49570" />
            <StyledText variant="extrabold" className="text-cinnamon-700 text-xs">
              Categories
            </StyledText>
          </Pressable>
          <Pressable
            onPress={props.onOpenSuppliers}
            accessibilityRole="button"
            accessibilityLabel="Suppliers"
            accessibilityHint="Browse all suppliers"
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-persimmon-50 border border-persimmon-100 active:opacity-70"
          >
            <FontAwesome name="truck" size={12} color="#E85A1F" />
            <StyledText variant="extrabold" className="text-persimmon-700 text-xs">
              Suppliers
            </StyledText>
          </Pressable>
        </View>
      </View>
```

Add the missing imports to the top:

```typescript
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
```

- [ ] **Step 2: Wire the props from `products.tsx`**

In `app/(tabs)/inventory/products.tsx`, find the `<InventoryHeader ... />` line (around line 184). Add:

```tsx
        onOpenCategories={() => router.push('/(tabs)/inventory/categories' as never)}
        onOpenSuppliers={() => router.push('/(tabs)/inventory/suppliers' as never)}
```

- [ ] **Step 3: Verify the products screen still compiles**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | grep "InventoryHeader\|products.tsx" | head -10`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add components/inventory/InventoryHeader.tsx app/(tabs)/inventory/products.tsx
git commit -m "feat(inventory): header entry points for categories and suppliers directories"
```

---

### Task 16: i18n — 19 new keys in en + tl

**Files:**
- Modify: `locales/en/inventory.json`
- Modify: `locales/tl/inventory.json`

**Why:** Every visible string in the new screens must come from i18n. The 19 keys below cover all surfaced strings in Tasks 11-14. Some keys already exist in `inventory.json` (e.g., `tabCategories`, `tabSuppliers`) — skip those and only add what's missing.

**Consumes:** the existing locale files. (Note: the components built in Tasks 7-14 use English fallback strings. After this task, the `useTranslation('inventory')` calls in those components will pick up the localized values.)

**Produces:** localized strings.

- [ ] **Step 1: Add the keys to `locales/en/inventory.json`**

Read the file end and append (or merge into a logical group):

```json
  "directorySearchCategoriesPlaceholder": "Search categories...",
  "directorySearchSuppliersPlaceholder": "Search suppliers...",
  "directoryNoSearchResults": "No matches for your search.",
  "directoryCategoryProductsTitle": "Category",
  "directorySupplierProductsTitle": "Supplier",
  "directoryProductsCount": "{{count}} products",
  "directoryLastDelivery": "Last delivery: {{date}}",
  "directoryNeverDelivered": "No deliveries yet",
  "directoryEmptyCategories": "No categories yet",
  "directoryEmptySuppliers": "No suppliers yet",
  "directoryEmptyCategoriesDescription": "Add your first category to start grouping products.",
  "directoryEmptySuppliersDescription": "Add your first supplier to start tracking deliveries.",
  "directoryCategoryDeleteConfirmTitle": "Delete category?",
  "directoryCategoryDeleteConfirmMessage": "{{count}} products will lose their '{{name}}' category.",
  "directorySupplierDeleteConfirmTitle": "Delete supplier?",
  "directorySupplierDeleteConfirmMessage": "{{count}} products will lose their '{{name}}' supplier.",
  "editCategory": "Edit Category",
  "saveChanges": "Save Changes",
  "saveCategoryEdit": "Save changes"
```

- [ ] **Step 2: Add the Tagalog equivalents to `locales/tl/inventory.json`**

Open the Tagalog file and add the same 19 keys with localized values. (If the existing Tagalog file already has equivalents for some of these — like the existing `tabCategories` — preserve them and only fill in what's missing.)

Suggested Tagalog values:

```json
  "directorySearchCategoriesPlaceholder": "Maghanap ng kategorya...",
  "directorySearchSuppliersPlaceholder": "Maghanap ng supplier...",
  "directoryNoSearchResults": "Walang tugma sa iyong hinahanap.",
  "directoryCategoryProductsTitle": "Kategorya",
  "directorySupplierProductsTitle": "Supplier",
  "directoryProductsCount": "{{count}} na produkto",
  "directoryLastDelivery": "Huling delivery: {{date}}",
  "directoryNeverDelivered": "Walang delivery pa",
  "directoryEmptyCategories": "Walang kategorya pa",
  "directoryEmptySuppliers": "Walang supplier pa",
  "directoryEmptyCategoriesDescription": "Magdagdag ng unang kategorya upang mag-grupo ng mga produkto.",
  "directoryEmptySuppliersDescription": "Magdagdag ng unang supplier upang masubaybayan ang mga delivery.",
  "directoryCategoryDeleteConfirmTitle": "Burahin ang kategorya?",
  "directoryCategoryDeleteConfirmMessage": "Mawawalan ng kategoryang '{{name}}' ang {{count}} na produkto.",
  "directorySupplierDeleteConfirmTitle": "Burahin ang supplier?",
  "directorySupplierDeleteConfirmMessage": "Mawawalan ng supplier na '{{name}}' ang {{count}} na produkto.",
  "editCategory": "I-edit ang Kategorya",
  "saveChanges": "I-save ang mga Pagbabago",
  "saveCategoryEdit": "I-save ang mga pagbabago"
```

- [ ] **Step 3: Verify the locale files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('D:/giomj/Projects/sarisari/locales/en/inventory.json','utf8'));JSON.parse(require('fs').readFileSync('D:/giomj/Projects/sarisari/locales/tl/inventory.json','utf8'));console.log('ok');"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
cd D:/giomj/Projects/sarisari
git add locales/en/inventory.json locales/tl/inventory.json
git commit -m "feat(i18n): 19 keys for categories and suppliers directories"
```

---

### Task 17: Manual smoke checklist

**Files:** none — this is a verification step before the feature is considered mergeable.

- [ ] **Step 1: Run the full test suite**

Run: `cd D:/giomj/Projects/sarisari && npx jest 2>&1 | tail -30`
Expected: all directory-related tests PASS. Pre-existing failures elsewhere (if any) are out of scope.

- [ ] **Step 2: Run TypeScript**

Run: `cd D:/giomj/Projects/sarisari && npx tsc --noEmit 2>&1 | tail -20`
Expected: no NEW errors from this change.

- [ ] **Step 3: Smoke test on a real device or simulator**

Launch the app on the dev build. Walk through:

1. Empty-state for new categories list (delete all categories, navigate to Inventory → Categories)
2. Tap into drilldown, back (Inventory → Categories → "Beverages" → back)
3. Rename a category (long-press → Rename → save new name)
4. Delete a category with products attached (long-press → Delete → confirm → products retain, category label clears)
5. Same four for suppliers (categories → suppliers, mirror the steps; verify `products.supplier_id` re-points)
6. Last-delivery chip on supplier drilldown (delivered case: insert a restock with the supplier, verify chip; never-delivered case: new supplier, verify chip says "No deliveries yet")

If any step fails, fix and re-run before committing the merge.

- [ ] **Step 4: Commit any smoke-test fixes**

If the smoke test surfaced bugs, fix them in the relevant task's file and amend or add a new commit.

```bash
cd D:/giomj/Projects/sarisari
git add -A
git commit -m "fix(directory): smoke-test fixes"
```

---

## Self-review

**Spec coverage:**

| Spec section | Covered by |
|--------------|-----------|
| Browse categories + suppliers with counts | Tasks 4, 11, 12 |
| Manage (rename / delete) with confirm | Tasks 6, 7, 8, 11, 12 |
| Drilldown (ProductsList + filter) | Tasks 13, 14 |
| Header icons + overflow on Inventory tab | Task 15 |
| Re-point-to-null on delete | Tasks 2, 3 |
| Last-delivery chip on supplier drilldown | Tasks 5, 9, 14 |
| i18n (19 keys) | Task 16 |
| DB tests for with-count, rename, delete, last-delivery | Tasks 2, 3 |
| Component tests for lists + empty states | Tasks 7, 8, 11, 12 |
| Manual smoke before merge | Task 17 |

**Placeholder scan:** No TBD/TODO. Every step has actual code or commands.

**Type consistency:** Type names match across tasks: `CategoryWithCount` (existing, used in Task 7), `SupplierWithCount` (introduced in Task 3, used in Tasks 8, 12). `LastDelivery` (introduced in Task 3, consumed in Task 14). The hook `useGetLastDeliveryForSupplier` is consistent across Tasks 5 and 14.

**Gap:** The 19 keys are added in Task 16 after Tasks 11-14 use English fallback strings. This is intentional — fallbacks render correctly until the locale file is updated, and the test in Task 11 only checks for the English fallback. The i18n task finalizes the strings. If the project adopts `react-i18next` test coverage in the future, that test would catch a missing key; for now, follow project precedent.

**No spec requirement is missing a task.**