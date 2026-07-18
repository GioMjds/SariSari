# Barcode Product Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make barcode resolution use a durable, offline SQLite product catalog while preserving store-owned product data and existing catalog records.

**Architecture:** Keep the existing v11 product_catalog schema as the persistent catalog. Bundled JSON becomes seed input only; a catalog hook performs one cached SQLite lookup per barcode, and an asynchronous resolver applies store-product precedence before that fallback. Product saves learn a minimal catalog record transactionally without ever copying store-specific money, stock, supplier, or packaging data into the catalog.

**Tech Stack:** TypeScript, Expo SDK 54, React Native 0.81, expo-sqlite 16, TanStack Query 5, Jest 30, better-sqlite3.

## Global Constraints

- Keep the existing product_catalog migration at user_version 11; do not add a version-only migration or rewrite existing catalog rows.
- Catalog writes must use INSERT OR IGNORE. Existing catalog metadata wins over bundled and merchant-provided metadata.
- Seed bundled catalog records after migrations in production and development; do not use a table-count shortcut.
- Core scan, catalog, registration, POS, inventory, and test flows make no network request.
- Store products resolve before the catalog in retail-barcode, wholesale-barcode, then legacy-SKU order.
- If loaded store products are not current, do not fall through to catalog or registration; return a safe unavailable result and leave the scanner open.
- All price, cost, stock, supplier, and wholesale values remain store-owned. Money stays integer pesos and continues through the existing money parser.
- Product catalog defaults unit to Pc, has no foreign key to products, and remains after store-product deletion.
- Use the existing shared SQLite handle. New catalog database functions receive that handle as their first argument.
- Preserve the unrelated untracked .claude directory; never stage it.

---

## File Map

| Path                                                                                       | Responsibility                                                                                                                               |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| constants/barcodes/index.ts                                                                | Exports immutable bundled seed records and their count; no runtime lookup map.                                                               |
| constants/barcodes/noodles.json                                                            | Adds the required Lucky Me Instant Mami Beef barcode fixture.                                                                                |
| database/catalog.ts                                                                        | Maps catalog rows, normalizes one-barcode reads, and performs insert-only catalog writes using an injected database handle.                  |
| database/seed.ts and configs/startup.ts                                                    | Seed every missing bundled catalog record after migrations in all builds; record a seed failure and continue.                                |
| database/products.ts and hooks/useProducts.tsx                                             | Enforce store scan-identity conflicts, learn retail catalog entries in the existing transaction, and invalidate catalog queries after saves. |
| hooks/useCatalog.tsx                                                                       | Defines per-barcode query keys and an imperative TanStack Query-backed lookup callback.                                                      |
| lib/barcodes/resolveBarcode.ts                                                             | Holds the pure, stateful asynchronous resolution policy: validation, throttling, precedence, catalog fallback, and stale-result suppression. |
| hooks/useBarcodeResolver.tsx                                                               | Adapts current product-query readiness and the catalog lookup hook to the pure resolver.                                                     |
| lib/barcodes/types.ts and lib/barcodes/applyToAddProductForm.ts                            | Define explicit resolution outcomes and map a catalog result into safe form defaults.                                                        |
| components/inventory/products/add-product/useAddProductForm.ts                             | Uses the shared resolver for both camera scans and prefillBarcode route parameters.                                                          |
| components/sell/add-sales/useAddSalesForm.ts                                               | Awaits the shared resolver while retaining the existing Add as new product path.                                                             |
| tests/database/catalog.test.ts, tests/database/products.test.ts, tests/barcodes/\*.test.ts | Cover persistence, seeding, transaction safety, resolution, cache behavior, and safe UI-default mapping.                                     |
| docs/features/barcode-product-storing-database.md                                          | Replaces obsolete cloud/static-map guidance with the v1.2 offline SQLite contract.                                                           |

## Public Interfaces

```ts
// database/catalog.ts
export async function getCatalogProductByBarcode(
  database: SQLiteDatabase,
  barcode: string,
): Promise<CatalogProduct | null>;

export async function insertCatalogProductIfMissing(
  database: SQLiteDatabase,
  input: NewCatalogProduct,
): Promise<void>;

// hooks/useCatalog.tsx
export const catalogKeys = {
  all: ['catalog'] as const,
  barcode: (barcode: string) =>
    [...catalogKeys.all, 'barcode', barcode] as const,
};

export function useCatalogProduct(
  barcode: string | null | undefined,
): UseQueryResult<CatalogProduct | null>;

export function useLookupCatalogProduct(): (
  barcode: string,
) => Promise<CatalogProduct | null>;

// lib/barcodes/resolveBarcode.ts
export interface BarcodeResolver {
  resolve(barcode: string, nowMs?: number): Promise<ScanResolution>;
}

export interface CreateBarcodeResolverOptions {
  getProducts: () => ReadonlyArray<Product>;
  isStoreProductsReady: () => boolean;
  lookupCatalogProduct: (barcode: string) => Promise<CatalogProduct | null>;
  throttleMs?: number;
  now?: () => number;
}

export function createBarcodeResolver(
  options: CreateBarcodeResolverOptions,
): BarcodeResolver;

// lib/barcodes/types.ts
export type ScanResolution =
  | {
      kind: 'resolved';
      barcode: string;
      product: Product;
      source: 'barcode' | 'wholesale_barcode' | 'sku';
      matchedUnit: 'retail' | 'wholesale';
    }
  | { kind: 'catalog_match'; barcode: string; catalogProduct: CatalogProduct }
  | { kind: 'missing'; barcode: string }
  | { kind: 'invalid'; reason: 'empty' | 'format' }
  | { kind: 'duplicate' }
  | { kind: 'superseded' }
  | { kind: 'store_products_unavailable' };

// lib/barcodes/applyToAddProductForm.ts
export interface AddProductScanPatch {
  barcode: string;
  productName?: string;
  category?: string;
  retailUnitName?: string;
  setAutoGenerateSku?: true;
  toast?: { variant: 'warning'; message: string };
  closeModal: true;
}

export function applyBarcodeToAddProductForm(input: {
  resolution: Extract<
    ScanResolution,
    { kind: 'catalog_match' } | { kind: 'missing' }
  >;
  autoGenerateSku: boolean;
}): AddProductScanPatch;
```

### Task 1: Make bundled records and catalog persistence authoritative

**Files:**

- Modify: constants/barcodes/index.ts
- Modify: constants/barcodes/noodles.json
- Modify: database/catalog.ts
- Modify: tests/**setup**/expo-sqlite-mock.ts
- Modify: tests/barcodes/lookup.test.ts
- Create: tests/database/catalog.test.ts

**Interfaces:**

- Consumes: the existing CatalogProduct, CatalogRow, and NewCatalogProduct types in types/catalog.types.ts.
- Produces: BUNDLED_CATALOG_RECORDS, BUNDLED_CATALOG_COUNT, getCatalogProductByBarcode(database, barcode), and insertCatalogProductIfMissing(database, input).
- Removes: lookupOfflineBarcode, OfflineBarcodeLookup, getAllCatalogProducts, and insertCatalogProduct replacement semantics.

- [ ] **Step 1: Replace static-lookup expectations with failing bundled-data and persistence tests**

Update tests/barcodes/lookup.test.ts so it imports BUNDLED_CATALOG_RECORDS and BUNDLED_CATALOG_COUNT rather than lookupOfflineBarcode. Add the required device fixture assertion:

```ts
test('contains the required Lucky Me Instant Mami Beef barcode', () => {
  expect(BUNDLED_CATALOG_RECORDS).toContainEqual({
    barcode: '4807770270017',
    name: 'Lucky Me Instant Mami Beef',
    category: 'Noodles',
  });
});
```

Create tests/database/catalog.test.ts with an isolated catalog table setup and these behavioral tests:

```ts
test('reads one trimmed barcode and maps snake_case fields', async () => {
  await db.runAsync(
    'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      '4807770270017',
      'Lucky Me Instant Mami Beef',
      'Lucky Me',
      'Noodles',
      'Pc',
      null,
      1,
    ],
  );

  await expect(
    getCatalogProductByBarcode(db, ' 4807770270017 '),
  ).resolves.toEqual({
    barcode: '4807770270017',
    name: 'Lucky Me Instant Mami Beef',
    brand: 'Lucky Me',
    category: 'Noodles',
    unit: 'Pc',
    imageUrl: null,
    createdAt: 1,
  });
});

test('does not replace existing catalog metadata', async () => {
  await db.runAsync(
    'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      '4800016551829',
      'Merchant Coke',
      'Merchant Brand',
      'Custom',
      'Bottle',
      'local://coke',
      10,
    ],
  );

  await insertCatalogProductIfMissing(db, {
    barcode: '4800016551829',
    name: 'Bundled Coke',
    brand: null,
    category: 'Beverages',
    unit: 'Pc',
    imageUrl: null,
  });

  await expect(
    getCatalogProductByBarcode(db, '4800016551829'),
  ).resolves.toMatchObject({
    name: 'Merchant Coke',
    brand: 'Merchant Brand',
    category: 'Custom',
    unit: 'Bottle',
    imageUrl: 'local://coke',
    createdAt: 10,
  });
});
```

Add product_catalog to resetMockDb so every database test begins with an empty catalog table.

- [ ] **Step 2: Run the new tests to prove the current static-map/replacement API cannot satisfy them**

Run: pnpm test -- --runInBand tests/barcodes/lookup.test.ts tests/database/catalog.test.ts

Expected: FAIL because BUNDLED_CATALOG_RECORDS and the injected-handle catalog APIs do not exist, and the required Lucky Me record is absent.

- [ ] **Step 3: Implement the bundled manifest and insert-only catalog APIs**

Replace constants/barcodes/index.ts with a manifest-only module:

```ts
import beverages from './beverages.json';
import cannedGoods from './canned-goods.json';
import noodles from './noodles.json';
import snacks from './snacks.json';

export interface BundledCatalogRecord {
  barcode: string;
  name: string;
  category: string;
}

export const BUNDLED_CATALOG_RECORDS: readonly BundledCatalogRecord[] = [
  ...beverages,
  ...snacks,
  ...noodles,
  ...cannedGoods,
];

export const BUNDLED_CATALOG_COUNT = BUNDLED_CATALOG_RECORDS.length;
```

Append this record to constants/barcodes/noodles.json, keeping valid JSON and the existing category order:

```json
{
  "barcode": "4807770270017",
  "name": "Lucky Me Instant Mami Beef",
  "category": "Noodles"
}
```

Replace database/catalog.ts with injected-handle functions. The insert must use INSERT OR IGNORE and must not expose a replacement or full-list API:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  CatalogProduct,
  CatalogRow,
  NewCatalogProduct,
} from '@/types/catalog.types';

function rowToCatalogProduct(row: CatalogRow): CatalogProduct {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    category: row.category,
    unit: row.unit,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

export async function getCatalogProductByBarcode(
  database: SQLiteDatabase,
  barcode: string,
): Promise<CatalogProduct | null> {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) return null;

  const row = await database.getFirstAsync<CatalogRow>(
    'SELECT barcode, name, brand, category, unit, image_url, created_at FROM product_catalog WHERE barcode = ? LIMIT 1',
    [normalizedBarcode],
  );

  return row ? rowToCatalogProduct(row) : null;
}

export async function insertCatalogProductIfMissing(
  database: SQLiteDatabase,
  input: NewCatalogProduct,
): Promise<void> {
  await database.runAsync(
    'INSERT OR IGNORE INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      input.barcode.trim(),
      input.name,
      input.brand,
      input.category,
      input.unit || 'Pc',
      input.imageUrl,
      Date.now(),
    ],
  );
}
```

Do not alter database/migrations.ts: its v11 schema already has the required primary key, nullable metadata, Pc default, and no product foreign key.

- [ ] **Step 4: Run the catalog foundation tests**

Run: pnpm test -- --runInBand tests/barcodes/lookup.test.ts tests/database/catalog.test.ts

Expected: PASS. The asset test proves all JSON records remain the versioned source, and the database test proves a single normalized SQLite read plus non-destructive insert behavior.

- [ ] **Step 5: Commit the foundation**

```bash
git add constants/barcodes/index.ts constants/barcodes/noodles.json database/catalog.ts tests/__setup__/expo-sqlite-mock.ts tests/barcodes/lookup.test.ts tests/database/catalog.test.ts
git commit -m "feat: make bundled barcode catalog durable"
```

### Task 2: Seed every missing bundled record after migrations

**Files:**

- Modify: database/seed.ts
- Modify: configs/startup.ts
- Modify: tests/database/catalog.test.ts
- Modify: tests/database/migrations-v9.test.ts

**Interfaces:**

- Consumes: BUNDLED_CATALOG_RECORDS and insertCatalogProductIfMissing(db, input) from Task 1.
- Produces: `seedProductCatalog(): Promise<void>`, which resolves after a successful seed or a recorded nonfatal seed failure.
- Preserves: the existing v11 migration, mock-development seed behavior, and fatal handling for migration failures.

- [ ] **Step 1: Add failing migration, partial-seed, and failure-containment tests**

In tests/database/migrations-v9.test.ts, create a v10-shaped database with a populated products row and a sale row, set PRAGMA user_version = 10, run migrations, and assert the original rows plus product_catalog remain present:

```ts
await expect(
  db.getFirstAsync('SELECT name FROM products WHERE id = 1'),
).resolves.toMatchObject({ name: 'Preserved product' });

await expect(
  db.getFirstAsync('SELECT total FROM sales WHERE id = 1'),
).resolves.toMatchObject({ total: 1250 });
```

In tests/database/catalog.test.ts, add a partial-catalog seed case:

```ts
test('seeds only missing bundled records and preserves a merchant row', async () => {
  await db.runAsync(
    'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['4800016551829', 'Merchant Coke', null, 'Custom', 'Bottle', null, 1],
  );

  await seedProductCatalog();

  await expect(
    getCatalogProductByBarcode(db, '4800016551829'),
  ).resolves.toMatchObject({
    name: 'Merchant Coke',
    category: 'Custom',
    unit: 'Bottle',
  });

  await expect(
    getCatalogProductByBarcode(db, '4807770270017'),
  ).resolves.toMatchObject({
    name: 'Lucky Me Instant Mami Beef',
    category: 'Noodles',
    unit: 'Pc',
  });
});
```

Create a trigger that aborts a bundled catalog insert, call seedProductCatalog, assert it resolves, and assert console.error was called. Drop that trigger in the test cleanup.

- [ ] **Step 2: Run the tests before changing seed or startup code**

Run: pnpm test -- --runInBand tests/database/catalog.test.ts tests/database/migrations-v9.test.ts

Expected: FAIL because current seeding exits when any catalog row exists and production startup only invokes seedDatabase under **DEV**.

- [ ] **Step 3: Replace count-gated development seeding with transactional incremental catalog seeding**

In database/seed.ts, import BUNDLED_CATALOG_RECORDS and insertCatalogProductIfMissing. Replace the current seedProductCatalog implementation with this behavior:

```ts
export async function seedProductCatalog(): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      for (const record of BUNDLED_CATALOG_RECORDS) {
        await insertCatalogProductIfMissing(db, {
          barcode: record.barcode,
          name: record.name,
          brand: null,
          category: record.category,
          unit: 'Pc',
          imageUrl: null,
        });
      }
    });
  } catch (error) {
    console.error(
      'Failed to seed bundled product catalog; continuing without catalog metadata.',
      error,
    );
  }
}
```

Remove the call to seedProductCatalog from seedDatabase. seedDatabase must remain the development-only mock-store-data seed; it must not wipe user data or determine whether bundled catalog records are complete. Do not infer a brand from a category: the existing seed JSON does not contain verified brand fields, so bundled brand remains null.

In configs/startup.ts, call seedProductCatalog immediately after successful init/migrations and before the **DEV** mock seed:

```ts
await executeWithRetry(async () => {
  await initProductsTable();
  await initCreditsTable();
  await initInventoryTable();
  await initSalesTables();
  await initCategoriesTable();
  await initSuppliersTable();
  await runMigrations();
});

await seedProductCatalog();

if (__DEV__) {
  await seedDatabase();
}
```

Do not wrap runMigrations in the nonfatal seed handler. A migration failure must still flow to DatabaseErrorScreen.

- [ ] **Step 4: Run the seed and migration tests**

Run: pnpm test -- --runInBand tests/database/catalog.test.ts tests/database/migrations-v9.test.ts

Expected: PASS. A partial catalog receives only missing rows, existing product/sale data remains, and an injected seed failure logs without rejecting startup’s seed step.

- [ ] **Step 5: Commit the seed behavior**

```bash
git add database/seed.ts configs/startup.ts tests/database/catalog.test.ts tests/database/migrations-v9.test.ts
git commit -m "feat: seed missing barcode catalog records on startup"
```

### Task 3: Learn catalog entries transactionally and protect scan identities

**Files:**

- Modify: database/products.ts
- Modify: hooks/useProducts.tsx
- Modify: tests/database/products.test.ts
- Modify: tests/database/catalog.test.ts

**Interfaces:**

- Consumes: insertCatalogProductIfMissing(db, input) and catalogKeys.all.
- Produces: unchanged insertProduct and updateProduct call signatures with stronger cross-column collision protection and transactional catalog learning.
- Preserves: BarcodeAlreadyExistsError, current partial unique indexes, inventory transaction behavior, and product deletion semantics.

- [ ] **Step 1: Add failing product-persistence tests**

Add these tests to tests/database/products.test.ts:

```ts
test('learns a minimal retail catalog record in the product transaction', async () => {
  await insertProduct(
    'Merchant Mami',
    'MAMI-001',
    1800,
    3,
    1200,
    'Noodles',
    '4807770270017',
    undefined,
    null,
    'Pack',
  );

  await expect(
    getCatalogProductByBarcode(db, '4807770270017'),
  ).resolves.toMatchObject({
    barcode: '4807770270017',
    name: 'Merchant Mami',
    brand: null,
    category: 'Noodles',
    unit: 'Pack',
    imageUrl: null,
  });
});

test('keeps catalog metadata when a store product uses the same barcode', async () => {
  await insertCatalogProductIfMissing(db, {
    barcode: '4800016551829',
    name: 'Bundled Coke',
    brand: null,
    category: 'Beverages',
    unit: 'Pc',
    imageUrl: null,
  });

  await insertProduct(
    'Store Coke',
    'STORE-COKE',
    2500,
    1,
    1800,
    'Store category',
    '4800016551829',
  );

  await expect(
    getCatalogProductByBarcode(db, '4800016551829'),
  ).resolves.toMatchObject({
    name: 'Bundled Coke',
    category: 'Beverages',
    unit: 'Pc',
  });
});
```

Also add:

- a transaction rollback test using a temporary BEFORE INSERT trigger on product_catalog; after the rejected product save, assert the product and its inventory row do not exist;
- an update test that assigns a previously unknown retail barcode and creates the minimal catalog row;
- a deletion test that removes the product but leaves its catalog row;
- cross-row collision tests for a new retail barcode matching an existing numeric SKU, a new SKU matching an existing retail barcode, and an update matching another product’s wholesale barcode;
- a same-row compatibility test where one product has identical numeric SKU and retail barcode and can still be created and updated.

- [ ] **Step 2: Run the product tests to demonstrate missing learning and collision gaps**

Run: pnpm test -- --runInBand tests/database/products.test.ts tests/database/catalog.test.ts

Expected: FAIL because product saves do not write catalog rows, product deletion/rollback behavior is not covered, and cross-column scan identities are not checked consistently.

- [ ] **Step 3: Add in-transaction collision checking and minimal catalog learning**

In database/products.ts:

1. Replace the retail/wholesale-only preflight with a helper that receives the incoming SKU, normalized retail barcode, normalized wholesale barcode, and optional excluded product ID.
2. Build a unique array of nonempty identifiers. Query products inside the existing withTransactionAsync block for any other row whose sku, barcode, or wholesale_barcode equals any incoming identifier.
3. Throw BarcodeAlreadyExistsError with that matched Product. Keep the existing retail-equals-wholesale rejection. Do not reject equal SKU and retail barcode on the same product.
4. Change getProductByBarcode to include the legacy SKU branch:

```ts
const result = await db.getFirstAsync<Product>(
  'SELECT * FROM products WHERE barcode = ? OR wholesale_barcode = ? OR sku = ? LIMIT 1',
  [barcode, barcode, barcode],
);
```

5. After each successful INSERT or UPDATE and any matching inventory write, call insertCatalogProductIfMissing for a nonempty normalized retail barcode only:

```ts
await insertCatalogProductIfMissing(db, {
  barcode: normalizedBarcode,
  name,
  brand: null,
  category: category ?? null,
  unit: retail_unit_name || 'Pc',
  imageUrl: null,
});
```

Do not create catalog records from wholesale_barcode. The catalog unit is the retail form default, and a wholesale code must not accidentally prefill a future product as a retail unit.

In hooks/useProducts.tsx, import catalogKeys and invalidate catalogKeys.all in both insertProductMutation.onSuccess and updateProductMutation.onSuccess. This clears cached positive and negative one-barcode query results after a learned record is committed.

- [ ] **Step 4: Run the transactional-learning test set**

Run: pnpm test -- --runInBand tests/database/products.test.ts tests/database/catalog.test.ts

Expected: PASS. Product/inventory/catalog writes commit or roll back together, a catalog row survives product deletion, and all new store scan identities are checked against retail, wholesale, and legacy SKU fields.

- [ ] **Step 5: Commit transactional learning**

```bash
git add database/products.ts hooks/useProducts.tsx tests/database/products.test.ts tests/database/catalog.test.ts
git commit -m "feat: learn barcode catalog entries with product saves"
```

### Task 4: Replace full-catalog reads with cached one-barcode resolution

**Files:**

- Modify: hooks/useCatalog.tsx
- Create: lib/barcodes/resolveBarcode.ts
- Modify: hooks/useBarcodeResolver.tsx
- Modify: lib/barcodes/types.ts
- Modify: lib/index.ts
- Create: tests/barcodes/resolveBarcode.test.ts
- Delete: tests/hooks/useBarcodeResolver.test.ts

**Interfaces:**

- Consumes: applyBarcodeToPosCart, validateBarcode, catalogKeys, getCatalogProductByBarcode, and the product query’s success/fetching state.
- Produces: useLookupCatalogProduct, createBarcodeResolver, and asynchronous useBarcodeResolver.resolve.
- Removes: useCatalogProducts, useCreateCatalogProduct, catalog list query keys, and every full-catalog lookup path.

- [ ] **Step 1: Write failing resolver tests**

Create tests/barcodes/resolveBarcode.test.ts using a deferred Promise for deterministic stale-result coverage. The test suite must assert:

```ts
const storeCoke: Product = {
  id: 1,
  sku: '4800016551829',
  barcode: '4800016551829',
  name: 'Store Coke',
  price: 2500,
  quantity: 10,
  retail_unit_name: 'Can',
  created_at: '2026-07-18 00:00:00',
  updated_at: '2026-07-18 00:00:00',
};

test('uses a loaded store product before requesting catalog metadata', async () => {
  const lookupCatalogProduct = jest.fn(async () => ({
    barcode: '4800016551829',
    name: 'Catalog Coke',
    brand: null,
    category: 'Beverages',
    unit: 'Pc',
    imageUrl: null,
    createdAt: 1,
  }));

  const resolver = createBarcodeResolver({
    getProducts: () => [storeCoke],
    isStoreProductsReady: () => true,
    lookupCatalogProduct,
  });

  await expect(resolver.resolve('4800016551829')).resolves.toMatchObject({
    kind: 'resolved',
    product: storeCoke,
    source: 'barcode',
    matchedUnit: 'retail',
  });
  expect(lookupCatalogProduct).not.toHaveBeenCalled();
});
```

Add tests for:

- wholesale and legacy-SKU store precedence;
- catalog hit with one lookup;
- catalog miss;
- invalid and duplicate inputs;
- store_products_unavailable when the product query is loading, fetching, or errored;
- a deferred catalog response for scan A followed by valid scan B, where A resolves as superseded and cannot add or prefill;
- a rejected catalog lookup becoming missing;
- a global fetch spy remaining untouched through all resolver paths.

- [ ] **Step 2: Run the pure resolver test before implementation**

Run: pnpm test -- --runInBand tests/barcodes/resolveBarcode.test.ts

Expected: FAIL because createBarcodeResolver and the new explicit resolution outcomes do not exist.

- [ ] **Step 3: Create the individual-query catalog hook**

Replace hooks/useCatalog.tsx with:

- normalized barcode query keys;
- a useCatalogProduct(barcode) hook for declarative consumers;
- a useLookupCatalogProduct hook that calls queryClient.fetchQuery with the same one-barcode query options;
- staleTime: Infinity for immutable-in-session catalog metadata, relying on catalogKeys.all invalidation after product saves.

The query function must call only getCatalogProductByBarcode(db, normalizedBarcode). It must not call getAllCatalogProducts or construct an in-memory catalog map.

- [ ] **Step 4: Implement the pure asynchronous resolver and hook adapter**

Create lib/barcodes/resolveBarcode.ts. Its resolver owns last accepted scan and a monotonically increasing request sequence. Its resolve method must follow this exact decision order:

```ts
if (!validateBarcode(barcode).ok) return invalid;
if (!isStoreProductsReady()) {
  sequence += 1;
  return store_products_unavailable;
}
storeResult = applyBarcodeToPosCart(...);
if (storeResult.kind === 'duplicate') return duplicate;
sequence += 1;
if (storeResult.kind === 'add') return resolved;
catalog = await lookupCatalogProduct(storeResult.barcode);
if (sequence changed or !isStoreProductsReady()) return superseded;
if (catalog === null) return missing;
return catalog_match;
```

Catch a lookup rejection, log it with console.warn, re-check the sequence/readiness, and return missing rather than throwing. No resolver branch may call fetch, use an online API, or read the whole catalog.

Update lib/barcodes/types.ts with the Public Interfaces union above. Update hooks/useBarcodeResolver.tsx to:

- retain the latest loaded product array in a ref;
- derive readiness from getAllProductsQuery.isSuccess && !getAllProductsQuery.isFetching;
- obtain useLookupCatalogProduct;
- construct the resolver with current-product/readiness getters;
- expose `resolve(barcode, nowMs)` as `Promise<ScanResolution>`.

Export createBarcodeResolver from lib/index.ts. Delete the obsolete hook test that relies on synchronously passing a full catalog array.

- [ ] **Step 5: Run the resolver tests**

Run: pnpm test -- --runInBand tests/barcodes/posScanLogic.test.ts tests/barcodes/resolveBarcode.test.ts

Expected: PASS. Existing POS throttling remains intact, catalog lookup occurs only after a loaded-store miss, stale completions are harmless, and no network request occurs.

- [ ] **Step 6: Commit the resolver**

```bash
git add hooks/useCatalog.tsx hooks/useBarcodeResolver.tsx lib/barcodes/resolveBarcode.ts lib/barcodes/types.ts lib/index.ts tests/barcodes/resolveBarcode.test.ts tests/hooks/useBarcodeResolver.test.ts
git commit -m "refactor: resolve catalog barcodes through SQLite query cache"
```

### Task 5: Route POS and product registration through the shared resolver

**Files:**

- Modify: lib/barcodes/applyToAddProductForm.ts
- Modify: components/inventory/products/add-product/useAddProductForm.ts
- Modify: components/sell/add-sales/useAddSalesForm.ts
- Modify: tests/barcodes/addProductScanLogic.test.ts

**Interfaces:**

- Consumes: asynchronous ScanResolution values from Task 4.
- Produces: catalog-driven product-form defaults for barcode, productName, category, and retailUnitName only.
- Removes: imports of lookupOfflineBarcode, useCatalogProducts, and synchronous catalog array searches from product registration.

- [ ] **Step 1: Replace static-map unit tests with failing result-to-form mapping tests**

Rewrite tests/barcodes/addProductScanLogic.test.ts to pass an explicit catalog_match or missing ScanResolution into the helper. Add these assertions:

```ts
test('catalog match fills only identity defaults and retail unit', () => {
  const patch = applyBarcodeToAddProductForm({
    resolution: {
      kind: 'catalog_match',
      barcode: '4807770270017',
      catalogProduct: {
        barcode: '4807770270017',
        name: 'Lucky Me Instant Mami Beef',
        brand: 'Lucky Me',
        category: 'Noodles',
        unit: 'Pack',
        imageUrl: 'https://not-used.example/image.png',
        createdAt: 1,
      },
    },
    autoGenerateSku: true,
  });

  expect(patch).toMatchObject({
    barcode: '4807770270017',
    productName: 'Lucky Me Instant Mami Beef',
    category: 'Noodles',
    retailUnitName: 'Pack',
    setAutoGenerateSku: true,
  });
  expect(patch).not.toHaveProperty('price');
  expect(patch).not.toHaveProperty('costPrice');
  expect(patch).not.toHaveProperty('supplierId');
  expect(patch).not.toHaveProperty('imageUri');
});
```

Add a missing-resolution test that only sets barcode and supplies the existing warning toast. Add a null-category catalog test that leaves category undefined rather than writing Others.

- [ ] **Step 2: Run the form mapper tests before changing the form**

Run: pnpm test -- --runInBand tests/barcodes/addProductScanLogic.test.ts

Expected: FAIL because the helper still accepts a synchronous lookup callback and cannot represent retailUnitName from a CatalogProduct.

- [ ] **Step 3: Make the mapper consume a resolved catalog result**

Change applyBarcodeToAddProductForm so its input contains:

- an Extract of ScanResolution whose kind is catalog_match or missing;
- autoGenerateSku.

For catalog_match, return barcode, productName, optional category, retailUnitName, optional setAutoGenerateSku, closeModal: true. For missing, return barcode, the existing not-in-catalog warning toast, and closeModal: true. Do not pass brand, imageUrl, price, cost, quantity, supplier, retail price, wholesale price, or stock through the patch.

- [ ] **Step 4: Update Add Product scanner and prefill behavior**

In components/inventory/products/add-product/useAddProductForm.ts:

1. Remove useCatalogProducts and lookupOfflineBarcode imports.
2. Call useBarcodeResolver once.
3. Make handleScannedBarcode async and await resolve(barcodeValue).
4. For resolved, write the normalized barcode to the field, close the scanner, and let the existing inline conflict card link to that product.
5. For catalog_match or missing, call the mapper. Disable automatic SKU before setting productName, then write barcode, productName, category, and retailUnitName when present. Keep the existing price-field focus after a catalog name is applied.
6. For invalid, preserve the current warning copy and close the single scanner.
7. For duplicate, superseded, and store_products_unavailable, make no form write and leave the scanner open.
8. Change barcodeConflictProduct to compare barcode, wholesale_barcode, and sku so all scan identities link to the conflicting product.
9. In the prefillBarcode effect, invoke void handleScannedBarcode(prefill) and continue clearing the route parameter once.

- [ ] **Step 5: Update POS scan handling**

In components/sell/add-sales/useAddSalesForm.ts:

1. Make handleScannedBarcode async and await resolve(barcode).
2. Keep existing resolved-cart behavior and matched unit behavior.
3. Treat catalog_match and missing as the existing pendingAddProductBarcode state, then retain the same Add as new product button and route parameter.
4. For duplicate, superseded, and store_products_unavailable, leave the cart, pending CTA, scanner, and last successful banner untouched.
5. Remove the unused lastScanRef. Do not pass catalog metadata in navigation parameters; Add Product must use the same resolver path for camera and prefillBarcode entries.

- [ ] **Step 6: Run unit tests for default mapping and resolution**

Run: pnpm test -- --runInBand tests/barcodes/addProductScanLogic.test.ts tests/barcodes/resolveBarcode.test.ts

Expected: PASS. A catalog record pre-fills only allowed fields, unknown values use barcode-only registration, and neither form consults the static map.

- [ ] **Step 7: Commit screen wiring**

```bash
git add lib/barcodes/applyToAddProductForm.ts components/inventory/products/add-product/useAddProductForm.ts components/sell/add-sales/useAddSalesForm.ts tests/barcodes/addProductScanLogic.test.ts
git commit -m "feat: prefill product registration from SQLite catalog"
```

### Task 6: Document the local-only catalog and complete verification

**Files:**

- Modify: docs/features/barcode-product-storing-database.md

**Interfaces:**

- Consumes: the final resolver and persistence behavior from Tasks 1-5.
- Produces: one accurate developer-facing description of v1.2 barcode behavior.
- Does not add: cloud lookup, sync, supplier import, image UI, a store-product brand field, dependencies, or a schema-version bump.

- [ ] **Step 1: Replace obsolete cloud/static-map guidance**

Rewrite docs/features/barcode-product-storing-database.md to document:

- constants/barcodes JSON files are build-time bundled seed assets;
- SQLite product_catalog is runtime source of truth;
- catalog records have barcode, name, optional brand/category/image URL, default Pc unit, and no product foreign key;
- startup uses transactional INSERT OR IGNORE seeding in every build;
- resolver order is validation/throttle, ready store products, one cached SQLite catalog query, registration fallback;
- catalog lookup failure becomes barcode-only registration, seed failure logs and continues, migration failure remains fatal;
- product save learns only a minimal retail catalog record inside its transaction;
- no network, cloud sync, image UI, or money/stock/supplier prefill exists in v1.2.

- [ ] **Step 2: Run the full automated verification set**

Run: pnpm test

Expected: PASS with no skipped tests.

Run: pnpm typecheck

Expected: PASS with no TypeScript diagnostics.

Run: pnpm lint

Expected: PASS with no lint errors.

- [ ] **Step 3: Perform the offline device/simulator acceptance check**

1. Launch a native build, enable airplane mode, and open POS.
2. Scan or manually enter 4807770270017 with no matching store product. Verify the existing Add as new product path opens the form with Lucky Me Instant Mami Beef, Noodles, barcode 4807770270017, and retail unit Pc; verify price, cost, stock, supplier, and image remain merchant-entered.
3. Return to Inventory and use its scanner for the same barcode. Verify the same form defaults appear through prefillBarcode.
4. Save the product with a valid integer-peso price. Scan it again in POS and verify it goes directly into the cart using the retail unit.
5. Scan a valid unknown barcode such as 9999999999999. Verify registration receives only the barcode.
6. Scan the same valid code twice inside 1.5 seconds. Verify only the first accepted result changes state.
7. Delete the test store product, then scan 4807770270017 again. Verify the catalog-only registration flow still exists.
8. Confirm no network requests are required or attempted during every step.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/features/barcode-product-storing-database.md
git commit -m "docs: document offline SQLite barcode catalog"
```

## Final Acceptance Checklist

- [ ] Fresh production startup creates the v11 catalog table through existing migrations and seeds all bundled records offline.
- [ ] Existing installations preserve products, inventory, sales, and catalog metadata while receiving only missing bundled records.
- [ ] Store products take precedence in retail, wholesale, and legacy-SKU scan paths.
- [ ] Catalog-only scans prefill barcode, name, category, and retail unit; unknown scans prefill only barcode.
- [ ] Product saves learn retail barcodes transactionally without overwriting catalog metadata or copying store-owned fields.
- [ ] Invalid, duplicate, stale, unloaded-store, catalog-failure, and seed-failure paths are safe.
- [ ] Runtime barcode resolution uses SQLite plus TanStack Query individual-key caching, not a static JavaScript map or network.
