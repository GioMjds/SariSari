# Supplier Delivery Receiving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner record a supplier delivery (multi-line, expected vs received, actual cost, shortages), commit it exactly once into stock and cost, void it safely, and see a per-supplier shortage report.

**Architecture:** New `delivery_receipts` and `delivery_receipt_lines` tables (migration v23) plus a nullable `receipt_id` on `inventory_transactions`. A new `database/deliveries.ts` owns draft, commit, void, and report logic. Commit loops lines inside one `db.withTransactionAsync` and calls a new transaction-free `applyInventoryTransaction` extracted from `insertInventoryTransaction`, so the existing restock rule (stock plus `cost_price`) is reused and transactions never nest. UI is hooks-only (`hooks/useDeliveryReceipts.ts`) with screens under `app/(edit-forms)/`.

**Tech Stack:** Expo SDK 54, React Native 0.81, `expo-sqlite` (tests use `better-sqlite3` via `tests/__setup__/expo-sqlite-mock.ts`), TanStack Query v5, react-i18next, NativeWind v4, Jest 29 + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-11-09-supplier-delivery-receiving-design.md` (read it first; see "Deviations from the spec" below, which the spec was updated to match). Vault note: `obsidian-vault/02-Features/08-supplier-delivery-receiving.md`.

## Global Constraints

- Money is integer pesos. Parse and format only through `lib/money.ts` (`parsePesosInput`, `formatPesos`). Never store decimals.
- Screens never call SQLite. Screens use hooks in `hooks/`, hooks call `database/`.
- One SQLite handle: import `db` only from `configs/sqlite.ts` (`@/configs/sqlite`).
- Multi-statement ledger writes use `db.withTransactionAsync`. Never nest it. Inside a transaction call `applyInventoryTransaction`, never `insertInventoryTransaction` or `insertProduct`.
- TypeScript strict plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `useUnknownInCatchVariables`. Index access returns `T | undefined`. Optional props cannot be assigned `undefined` explicitly.
- No emojis in code or comments. Markdown filenames kebab-case.
- Run `pnpm typecheck` and `pnpm test` before every commit that touches TypeScript. Test files go in `tests/` (flat or `tests/database/`), named `*.test.ts` or `*.test.tsx`.
- In tests, `expo-crypto` `randomUUID` is mocked to a constant `'uuid'`. Never call `createSupplier` in tests. Insert suppliers with SQL (see Task 1 helper).
- Commit messages end with:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_014rjHKieHsuizYgjRjDyCFH`.
- The working tree has unrelated uncommitted changes (settings and reports screens). Stage only the files each task lists. Never `git add -A`.

## Deviations from the spec (found while reading code; spec updated in Task 10)

1. `suppliers.id` is TEXT (UUID). `delivery_receipts.supplier_id` is TEXT, not INTEGER.
2. Latest migration is v22, so this migration is v23.
3. `tests/sqlite/single-handle.test.ts` does not exist. Dropped from the spec's testing list. Tests live flat in `tests/` plus a `tests/database/` folder created by this plan.
4. "Fill from reorder plan" seeds from `getPalengkeRestockPlan({ supplierId })` (low and out-of-stock items for that supplier with suggested quantities), not only saved `reorder_plans` rows. `reorder_plans` has no supplier column, so per-supplier seeding must go through products.
5. Feature 9 is already reachable: `recommendations` is the "Restock" sub-tab in `app/(tabs)/inventory/_layout.tsx`. The receipt list is a stack route `app/(edit-forms)/delivery-receipts/index.tsx` (not a fifth sub-tab). Entry button goes on the Restock sub-tab.
6. Shortage value uses `COALESCE(expected_unit_cost, actual_unit_cost)` because `products.cost_price` can be null.
7. New error `ReceiptNotCommittedError` for voiding a draft.

## Review Focus

The spec's silence on these inputs must not let them break the app. Each has a test in the owning task.

1. Wholesale unit chosen for a product with no wholesale unit or `conversion_factor` below 2: reject, never silently treat as retail. (Task 3, Task 4)
2. Same product on two lines of one receipt: stock adds up on commit and void reverses the total, never going negative per line. (Task 5, Task 6)
3. Over-delivery (received greater than expected): shortage is 0, never negative, and stock still gets the full received qty. (Task 3, Task 5)
4. Quick-add barcode that already belongs to an existing product: reject at save with a named error, never reach commit and half-fail. (Task 4)
5. Double-tapped commit, and void after some of the stock was already sold: second commit throws `ReceiptNotDraftError`; void throws `VoidWouldGoNegativeError` naming the product and leaves stock untouched. (Task 5, Task 6)

## File Structure

Create:

- `types/deliveries.types.ts`: status, line input, row, and report types.
- `lib/deliveryReceipt.ts`: pure unit conversion, shortage, cost-change math. No DB.
- `lib/deliveryForm.ts`: pure form-state helpers (string inputs to line input, seed from plan, blank detection).
- `database/deliveries.ts`: schema helpers, named errors, draft CRUD, commit, void, report.
- `hooks/useDeliveryReceipts.ts`: query keys and hooks.
- `locales/en/receiving.json`, `locales/tl/receiving.json`.
- `components/receiving/DeliveryLineRow.tsx`, `components/receiving/QuickAddProductSheet.tsx`, `components/receiving/ProductPickerSheet.tsx`.
- `app/(edit-forms)/delivery-receipts/index.tsx` (list), `app/(edit-forms)/delivery-receipt/[id].tsx` (editor), `app/reports/supplier-shortages.tsx`.
- `tests/helpers/deliveryFixtures.ts`, `tests/database/delivery-migration.test.ts`, `tests/database/delivery-drafts.test.ts`, `tests/database/delivery-commit.test.ts`, `tests/database/delivery-void.test.ts`, `tests/database/delivery-report.test.ts`, `tests/deliveryReceiptLib.test.ts`, `tests/deliveryForm.test.ts`, `tests/applyInventoryTransaction.test.ts`, `tests/components/DeliveryLineRow.test.tsx`.

Modify:

- `database/migrations.ts` (append v23), `database/inventory.ts` (extract), `database/index.ts` (export), `types/inventory.types.ts` (`receipt_id`), `tests/__setup__/expo-sqlite-mock.ts` (reset list), `lib/i18n.ts` (register namespace), `app/(tabs)/inventory/recommendations.tsx` (entry button), `docs/superpowers/specs/...` and the vault feature note.

---

### Task 1: Migration v23, mock reset, test fixtures

**Files:**

- Modify: `database/migrations.ts` (append after the v22 block, before the closing `}` of `runMigrations`)
- Modify: `tests/__setup__/expo-sqlite-mock.ts:50-71` (reset list)
- Create: `tests/helpers/deliveryFixtures.ts`
- Test: `tests/database/delivery-migration.test.ts`

**Interfaces:**

- Produces: tables `delivery_receipts`, `delivery_receipt_lines`; column `inventory_transactions.receipt_id`; test helpers `setupDeliveryDb()`, `seedSupplier(id, name?)`, `seedProduct(opts)`, `stockOf(productId)` used by Tasks 4 to 7.

- [ ] **Step 1: Write the failing migration test**

Create `tests/helpers/deliveryFixtures.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  initProductsTable,
  initInventoryTable,
  initSalesTables,
  initSuppliersTable,
  initCreditsTable,
  runMigrations,
} from '@/database';
import { insertProduct } from '@/database/products';

export const setupDeliveryDb = async (): Promise<void> => {
  await initProductsTable();
  await initSuppliersTable();
  await initInventoryTable();
  await initSalesTables();
  await initCreditsTable();
  await runMigrations();
};

export const seedSupplier = async (
  id: string,
  name: string = id,
): Promise<string> => {
  await db.runAsync(
    'INSERT OR IGNORE INTO suppliers (id, name, created_at) VALUES (?, ?, ?)',
    [id, name, Date.now()],
  );
  return id;
};

export interface SeedProductOptions {
  name: string;
  sku: string;
  qty?: number;
  cost?: number;
  price?: number;
  supplierId?: string | null;
  barcode?: string | null;
  wholesale?: { unitName: string; price: number; cost: number; factor: number };
}

export const seedProduct = async (o: SeedProductOptions): Promise<number> =>
  insertProduct(
    o.name,
    o.sku,
    o.price ?? 2000,
    o.qty ?? 0,
    o.cost,
    undefined,
    o.barcode ?? null,
    o.supplierId ?? null,
    null,
    'Pc',
    o.wholesale?.unitName ?? null,
    o.wholesale?.price ?? null,
    o.wholesale?.cost ?? null,
    o.wholesale?.factor ?? null,
  );

export const stockOf = async (
  productId: number,
): Promise<{ quantity: number; cost_price: number | null }> => {
  const row = await db.getFirstAsync<{
    quantity: number;
    cost_price: number | null;
  }>('SELECT quantity, cost_price FROM products WHERE id = ?', [productId]);
  if (!row) throw new Error(`product ${productId} missing`);
  return row;
};
```

Create `tests/database/delivery-migration.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedSupplier, setupDeliveryDb } from '../helpers/deliveryFixtures';

describe('migration v23: delivery receipts', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('sets user_version to at least 23', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(23);
  });

  it('adds receipt_id to inventory_transactions', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(inventory_transactions)',
    );
    expect(cols.some((c) => c.name === 'receipt_id')).toBe(true);
  });

  it('allows only one draft per supplier', async () => {
    await seedSupplier('sup-a');
    await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'draft')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'draft')",
      ),
    ).rejects.toThrow();
    await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'committed')",
    );
  });

  it('rejects an unknown status', async () => {
    await seedSupplier('sup-b');
    await expect(
      db.runAsync(
        "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-b', 'bogus')",
      ),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/database/delivery-migration.test.ts`
Expected: FAIL (`no such table: delivery_receipts` or `user_version` below 23).

- [ ] **Step 3: Add the migration**

In `database/migrations.ts`, after the `if (currentVersion < 22) { ... }` block and before the final `}`:

```ts
if (currentVersion < 23) {
  console.log('Running migration to v23 (Supplier delivery receipts)...');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS delivery_receipts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_id TEXT NOT NULL REFERENCES suppliers(id),
          status TEXT NOT NULL DEFAULT 'draft'
            CHECK(status IN ('draft', 'committed', 'voided')),
          invoice_no TEXT,
          invoice_photo_uri TEXT,
          note TEXT,
          received_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          committed_at TEXT,
          voided_at TEXT,
          void_reason TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_receipts_one_draft
          ON delivery_receipts(supplier_id) WHERE status = 'draft';
        CREATE INDEX IF NOT EXISTS idx_delivery_receipts_status
          ON delivery_receipts(status, supplier_id);

        CREATE TABLE IF NOT EXISTS delivery_receipt_lines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          receipt_id INTEGER NOT NULL
            REFERENCES delivery_receipts(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          new_product_name TEXT,
          new_product_price INTEGER,
          new_product_barcode TEXT,
          entered_unit TEXT NOT NULL CHECK(entered_unit IN ('retail', 'wholesale')),
          entered_expected_qty INTEGER NOT NULL,
          entered_received_qty INTEGER NOT NULL,
          entered_unit_cost INTEGER NOT NULL,
          expected_qty INTEGER NOT NULL,
          received_qty INTEGER NOT NULL,
          expected_unit_cost INTEGER,
          actual_unit_cost INTEGER NOT NULL,
          shortage_qty INTEGER NOT NULL,
          conversion_factor_used INTEGER NOT NULL DEFAULT 1,
          CHECK(product_id IS NOT NULL OR new_product_name IS NOT NULL)
        );
        CREATE INDEX IF NOT EXISTS idx_delivery_lines_receipt
          ON delivery_receipt_lines(receipt_id);
      `);

    const invCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(inventory_transactions)',
    );
    if (!invCols.some((c) => c.name === 'receipt_id')) {
      await db.execAsync(
        'ALTER TABLE inventory_transactions ADD COLUMN receipt_id INTEGER;',
      );
    }
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_inventory_tx_receipt_id ON inventory_transactions(receipt_id);',
    );

    await db.execAsync('PRAGMA user_version = 23;');
  });
  console.log('Database migrated to v23.');
}
```

In `tests/__setup__/expo-sqlite-mock.ts`, add two entries right after `'sqlite_sequence',` (lines must be deleted before `products` because of the foreign key):

```ts
    'delivery_receipt_lines',
    'delivery_receipts',
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/database/delivery-migration.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Run full suite and typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add database/migrations.ts tests/__setup__/expo-sqlite-mock.ts tests/helpers/deliveryFixtures.ts tests/database/delivery-migration.test.ts
git commit -m "feat(receiving): add delivery receipt tables (migration v23)"
```

---

### Task 2: Extract `applyInventoryTransaction`

**Files:**

- Modify: `database/inventory.ts:26-89`
- Modify: `types/inventory.types.ts:32-40` (`InsertInventoryV2`)
- Test: `tests/applyInventoryTransaction.test.ts`

**Interfaces:**

- Produces: `applyInventoryTransaction(tx: InsertInventoryV2): Promise<number>` (no own transaction; returns inserted row id). `InsertInventoryV2` gains `receipt_id?: number | null`. `insertInventoryTransaction` keeps its exact signature and behavior.

- [ ] **Step 1: Write the failing test**

```ts
import { db } from '@/configs/sqlite';
import {
  applyInventoryTransaction,
  insertInventoryTransaction,
} from '@/database/inventory';
import { resetMockDb } from './__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
  stockOf,
} from './helpers/deliveryFixtures';

describe('applyInventoryTransaction', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('restock updates quantity and cost_price and stores receipt_id', async () => {
    const supplier = await seedSupplier('sup-x');
    const pid = await seedProduct({
      name: 'Rice',
      sku: 'R1',
      qty: 5,
      cost: 40,
    });
    await db.withTransactionAsync(async () => {
      await applyInventoryTransaction({
        product_id: pid,
        type: 'restock',
        quantity: 10,
        unit_cost: 45,
        supplier_id: supplier,
        receipt_id: 7,
      });
    });
    expect(await stockOf(pid)).toEqual({ quantity: 15, cost_price: 45 });
    const row = await db.getFirstAsync<{ receipt_id: number | null }>(
      "SELECT receipt_id FROM inventory_transactions WHERE product_id = ? AND type = 'restock' ORDER BY id DESC",
      [pid],
    );
    expect(row?.receipt_id).toBe(7);
  });

  it('refuses to go below zero', async () => {
    const pid = await seedProduct({ name: 'Egg', sku: 'E1', qty: 2 });
    await expect(
      applyInventoryTransaction({
        product_id: pid,
        type: 'adjustment',
        adjustment_sign: 'negative',
        quantity: 3,
      }),
    ).rejects.toThrow("Can't go below zero.");
    expect((await stockOf(pid)).quantity).toBe(2);
  });

  it('insertInventoryTransaction wrapper still works and returns the id', async () => {
    const pid = await seedProduct({ name: 'Salt', sku: 'S1', qty: 1 });
    const id = await insertInventoryTransaction({
      product_id: pid,
      type: 'restock',
      quantity: 4,
    });
    expect(id).toBeGreaterThan(0);
    expect((await stockOf(pid)).quantity).toBe(5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/applyInventoryTransaction.test.ts`
Expected: FAIL (`applyInventoryTransaction` is not exported).

- [ ] **Step 3: Implement**

In `types/inventory.types.ts`, add to `InsertInventoryV2` (after `supplier_id`):

```ts
  receipt_id?: number | null;
```

Replace `insertInventoryTransaction` in `database/inventory.ts` (lines 26 to 89) with:

```ts
/**
 * Applies one inventory transaction and the matching products update.
 * Does NOT open a transaction: callers must already be inside
 * db.withTransactionAsync (or use insertInventoryTransaction below).
 */
export const applyInventoryTransaction = async (
  tx: InsertInventoryV2,
): Promise<number> => {
  const {
    product_id,
    type,
    quantity,
    note = null,
    adjustment_sign = null,
    unit_cost = null,
    supplier_id = null,
    receipt_id = null,
  } = tx;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (type === 'adjustment' && !adjustment_sign) {
    throw new Error('Adjustment transactions must specify adjustment_sign');
  }
  if (type !== 'adjustment' && adjustment_sign) {
    throw new Error(
      'Non-adjustment transactions must not specify adjustment_sign',
    );
  }

  // 1. Check product existence and current quantity
  const product = await db.getFirstAsync<{ quantity: number }>(
    'SELECT quantity FROM products WHERE id = ?',
    [product_id],
  );

  if (!product) {
    throw new Error(`Product with ID ${product_id} not found`);
  }

  // 2. Determine quantity change
  let quantityChange = 0;
  if (type === 'restock') {
    quantityChange = quantity;
  } else if (type === 'sale' || type === 'damaged') {
    quantityChange = -quantity;
  } else if (type === 'adjustment') {
    quantityChange = adjustment_sign === 'positive' ? quantity : -quantity;
  }

  const newQuantity = product.quantity + quantityChange;
  if (newQuantity < 0) {
    throw new Error("Can't go below zero.");
  }

  // 3. Insert into inventory_transactions
  const result = await db.runAsync(
    'INSERT INTO inventory_transactions (product_id, type, quantity, note, adjustment_sign, unit_cost, supplier_id, receipt_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      product_id,
      type,
      quantity,
      note,
      adjustment_sign,
      unit_cost,
      supplier_id,
      receipt_id,
    ],
  );

  // 4. Update products table
  if (type === 'restock' && unit_cost !== null && unit_cost !== undefined) {
    await db.runAsync(
      'UPDATE products SET quantity = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, unit_cost, product_id],
    );
  } else {
    await db.runAsync(
      'UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, product_id],
    );
  }

  return result.lastInsertRowId;
};

export const insertInventoryTransaction = async (
  tx: InsertInventoryV2,
): Promise<number> => {
  let insertedId = 0;
  await db.withTransactionAsync(async () => {
    insertedId = await applyInventoryTransaction(tx);
  });
  return insertedId;
};
```

Note: the early argument validation now runs inside the caller's transaction for the wrapper too (previously before it). Observable behavior is unchanged because a thrown error rolls back nothing that was written.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/applyInventoryTransaction.test.ts tests/productsCrud.test.ts`
Expected: PASS (new tests plus the existing products tests).

- [ ] **Step 5: Run full suite and typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/inventory.ts types/inventory.types.ts tests/applyInventoryTransaction.test.ts
git commit -m "refactor(inventory): extract transaction-free applyInventoryTransaction"
```

---

### Task 3: Pure delivery math and form helpers

**Files:**

- Create: `types/deliveries.types.ts`, `lib/deliveryReceipt.ts`, `lib/deliveryForm.ts`
- Test: `tests/deliveryReceiptLib.test.ts`, `tests/deliveryForm.test.ts`

**Interfaces:**

- Produces (types): `DeliveryReceiptStatus`, `EnteredUnit`, `DeliveryLineInput`, `SaveDeliveryDraftInput`, `DeliveryReceiptLine`, `DeliveryReceiptSummary`, `DeliveryReceiptDetail`, `SupplierShortageRow`.
- Produces (lib): `convertDeliveryLine(input): ConvertedLine`, `costChange(actual, last): number | null`, `InvalidDeliveryLineError`.
- Produces (form): `DraftLineForm`, `toLineInput(form): DeliveryLineInput`, `isLineComplete(form): boolean`, `seedLinesFromPlan(items): DraftLineForm[]`, `newLineKey(): string`.

- [ ] **Step 1: Write the failing tests**

`tests/deliveryReceiptLib.test.ts`:

```ts
import {
  convertDeliveryLine,
  costChange,
  InvalidDeliveryLineError,
} from '@/lib/deliveryReceipt';

describe('convertDeliveryLine', () => {
  it('passes retail values through', () => {
    expect(
      convertDeliveryLine({
        enteredUnit: 'retail',
        enteredExpectedQty: 10,
        enteredReceivedQty: 8,
        enteredUnitCost: 12,
        conversionFactor: null,
      }),
    ).toEqual({
      expectedQty: 10,
      receivedQty: 8,
      actualUnitCost: 12,
      shortageQty: 2,
      conversionFactorUsed: 1,
    });
  });

  it('converts wholesale boxes to retail pieces and per-piece cost', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'wholesale',
      enteredExpectedQty: 3,
      enteredReceivedQty: 3,
      enteredUnitCost: 240,
      conversionFactor: 24,
    });
    expect(r.expectedQty).toBe(72);
    expect(r.receivedQty).toBe(72);
    expect(r.actualUnitCost).toBe(10);
    expect(r.conversionFactorUsed).toBe(24);
  });

  it('rounds per-piece cost half up', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'wholesale',
      enteredExpectedQty: 1,
      enteredReceivedQty: 1,
      enteredUnitCost: 252,
      conversionFactor: 24,
    });
    expect(r.actualUnitCost).toBe(11);
  });

  it('review focus: over-delivery gives zero shortage, never negative', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'retail',
      enteredExpectedQty: 5,
      enteredReceivedQty: 9,
      enteredUnitCost: 10,
      conversionFactor: null,
    });
    expect(r.shortageQty).toBe(0);
    expect(r.receivedQty).toBe(9);
  });

  it.each([null, 0, 1])(
    'review focus: wholesale with conversion factor %p is rejected',
    (factor) => {
      expect(() =>
        convertDeliveryLine({
          enteredUnit: 'wholesale',
          enteredExpectedQty: 1,
          enteredReceivedQty: 1,
          enteredUnitCost: 100,
          conversionFactor: factor,
        }),
      ).toThrow(InvalidDeliveryLineError);
    },
  );

  it.each([
    ['fractional qty', 1.5, 1, 10],
    ['negative received', 1, -1, 10],
    ['fractional cost', 1, 1, 10.5],
  ])('rejects %s', (_label, expected, received, cost) => {
    expect(() =>
      convertDeliveryLine({
        enteredUnit: 'retail',
        enteredExpectedQty: expected,
        enteredReceivedQty: received,
        enteredUnitCost: cost,
        conversionFactor: null,
      }),
    ).toThrow(InvalidDeliveryLineError);
  });
});

describe('costChange', () => {
  it('returns null when there is no previous cost', () => {
    expect(costChange(10, null)).toBeNull();
  });
  it('returns signed difference', () => {
    expect(costChange(12, 10)).toBe(2);
    expect(costChange(9, 10)).toBe(-1);
    expect(costChange(10, 10)).toBe(0);
  });
});
```

`tests/deliveryForm.test.ts`:

```ts
import {
  isLineComplete,
  seedLinesFromPlan,
  toLineInput,
  type DraftLineForm,
} from '@/lib/deliveryForm';

const base: DraftLineForm = {
  key: 'k1',
  productId: 5,
  productName: 'Coke 1L',
  newProduct: null,
  enteredUnit: 'retail',
  retailUnitName: 'Pc',
  wholesaleUnitName: null,
  conversionFactor: null,
  lastCostPrice: 10,
  expectedQty: '10',
  receivedQty: '8',
  unitCost: '12',
};

describe('toLineInput', () => {
  it('parses strings to numbers', () => {
    expect(toLineInput(base)).toEqual({
      productId: 5,
      newProduct: null,
      enteredUnit: 'retail',
      enteredExpectedQty: 10,
      enteredReceivedQty: 8,
      enteredUnitCost: 12,
    });
  });
  it('throws on a blank cost instead of becoming 0', () => {
    expect(() => toLineInput({ ...base, unitCost: '' })).toThrow();
  });
  it('treats blank expected qty as 0', () => {
    expect(toLineInput({ ...base, expectedQty: '' }).enteredExpectedQty).toBe(
      0,
    );
  });
});

describe('isLineComplete', () => {
  it('is false when received or cost is blank', () => {
    expect(isLineComplete({ ...base, receivedQty: '' })).toBe(false);
    expect(isLineComplete({ ...base, unitCost: '' })).toBe(false);
  });
  it('is true when received and cost are filled', () => {
    expect(isLineComplete(base)).toBe(true);
  });
});

describe('seedLinesFromPlan', () => {
  it('seeds retail lines with expected qty and cost, blank received', () => {
    const lines = seedLinesFromPlan([
      {
        productId: 1,
        productName: 'Rice',
        sku: 'R1',
        currentStock: 0,
        suggestedQuantity: 6,
        retailUnitName: 'Pc',
        costPrice: 40,
        subtotal: 240,
        isOutOfStock: true,
        supplierId: 's',
        supplierName: 'S',
        categoryName: null,
      },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      productId: 1,
      productName: 'Rice',
      enteredUnit: 'retail',
      expectedQty: '6',
      receivedQty: '',
      unitCost: '40',
      lastCostPrice: 40,
    });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm jest tests/deliveryReceiptLib.test.ts tests/deliveryForm.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`types/deliveries.types.ts`:

```ts
export type DeliveryReceiptStatus = 'draft' | 'committed' | 'voided';
export type EnteredUnit = 'retail' | 'wholesale';

export interface QuickAddProductInput {
  name: string;
  price: number;
  barcode?: string | null;
}

export interface DeliveryLineInput {
  productId: number | null;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
}

export interface SaveDeliveryDraftInput {
  receiptId?: number;
  supplierId: string;
  invoiceNo?: string | null;
  invoicePhotoUri?: string | null;
  note?: string | null;
  lines: DeliveryLineInput[];
}

export interface DeliveryReceiptLine {
  id: number;
  receiptId: number;
  productId: number | null;
  productName: string;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
  expectedQty: number;
  receivedQty: number;
  expectedUnitCost: number | null;
  actualUnitCost: number;
  shortageQty: number;
  conversionFactorUsed: number;
}

export interface DeliveryReceiptSummary {
  id: number;
  supplierId: string;
  supplierName: string;
  status: DeliveryReceiptStatus;
  invoiceNo: string | null;
  createdAt: string;
  committedAt: string | null;
  voidedAt: string | null;
  lineCount: number;
  totalCost: number;
  shortageQty: number;
}

export interface DeliveryReceiptDetail extends DeliveryReceiptSummary {
  invoicePhotoUri: string | null;
  note: string | null;
  voidReason: string | null;
  lines: DeliveryReceiptLine[];
}

export interface SupplierShortageRow {
  supplierId: string;
  supplierName: string;
  receipts: number;
  lines: number;
  shortLines: number;
  shortageQty: number;
  shortageValue: number;
  shortageRate: number;
}
```

`lib/deliveryReceipt.ts`:

```ts
import type { EnteredUnit } from '@/types/deliveries.types';

export class InvalidDeliveryLineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDeliveryLineError';
  }
}

export interface ConvertLineInput {
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
  conversionFactor: number | null;
}

export interface ConvertedLine {
  expectedQty: number;
  receivedQty: number;
  actualUnitCost: number;
  shortageQty: number;
  conversionFactorUsed: number;
}

const assertWhole = (label: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidDeliveryLineError(
      `${label} must be a whole number of 0 or more`,
    );
  }
};

/**
 * Converts what the owner typed (retail pieces or wholesale boxes) into
 * retail pieces and a per-piece cost in integer pesos. Per-piece cost is
 * rounded half up once per line. Shortage is never negative.
 */
export function convertDeliveryLine(input: ConvertLineInput): ConvertedLine {
  assertWhole('Expected quantity', input.enteredExpectedQty);
  assertWhole('Received quantity', input.enteredReceivedQty);
  assertWhole('Unit cost', input.enteredUnitCost);

  let factor = 1;
  if (input.enteredUnit === 'wholesale') {
    const f = input.conversionFactor;
    if (f == null || !Number.isInteger(f) || f < 2) {
      throw new InvalidDeliveryLineError(
        'This product has no wholesale unit to receive in',
      );
    }
    factor = f;
  }

  const expectedQty = input.enteredExpectedQty * factor;
  const receivedQty = input.enteredReceivedQty * factor;
  return {
    expectedQty,
    receivedQty,
    actualUnitCost: Math.round(input.enteredUnitCost / factor),
    shortageQty: Math.max(0, expectedQty - receivedQty),
    conversionFactorUsed: factor,
  };
}

/** Signed per-piece cost difference versus the last known cost, or null. */
export function costChange(actual: number, last: number | null): number | null {
  if (last == null) return null;
  return actual - last;
}
```

`lib/deliveryForm.ts`:

```ts
import type {
  DeliveryLineInput,
  EnteredUnit,
  QuickAddProductInput,
} from '@/types/deliveries.types';
import type { PalengkeRestockItem } from '@/types/stock-intelligence.types';

export interface DraftLineForm {
  key: string;
  productId: number | null;
  productName: string;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  retailUnitName: string;
  wholesaleUnitName: string | null;
  conversionFactor: number | null;
  lastCostPrice: number | null;
  expectedQty: string;
  receivedQty: string;
  unitCost: string;
}

let keyCounter = 0;
export const newLineKey = (): string => `line-${Date.now()}-${keyCounter++}`;

const parseWhole = (label: string, raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed === '') throw new Error(`${label} is required`);
  const n = Number(trimmed);
  if (!Number.isFinite(n)) throw new Error(`${label} is not a number`);
  return n;
};

export const isLineComplete = (form: DraftLineForm): boolean =>
  form.receivedQty.trim() !== '' && form.unitCost.trim() !== '';

export function toLineInput(form: DraftLineForm): DeliveryLineInput {
  const expected =
    form.expectedQty.trim() === ''
      ? 0
      : parseWhole('Expected', form.expectedQty);
  return {
    productId: form.productId,
    newProduct: form.newProduct,
    enteredUnit: form.enteredUnit,
    enteredExpectedQty: expected,
    enteredReceivedQty: parseWhole('Received', form.receivedQty),
    enteredUnitCost: parseWhole('Unit cost', form.unitCost),
  };
}

export function seedLinesFromPlan(
  items: PalengkeRestockItem[],
): DraftLineForm[] {
  return items.map((item) => ({
    key: newLineKey(),
    productId: item.productId,
    productName: item.productName,
    newProduct: null,
    enteredUnit: 'retail' as const,
    retailUnitName: item.retailUnitName,
    wholesaleUnitName: null,
    conversionFactor: null,
    lastCostPrice: item.costPrice,
    expectedQty: String(item.suggestedQuantity),
    receivedQty: '',
    unitCost: item.costPrice != null ? String(item.costPrice) : '',
  }));
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm jest tests/deliveryReceiptLib.test.ts tests/deliveryForm.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add types/deliveries.types.ts lib/deliveryReceipt.ts lib/deliveryForm.ts tests/deliveryReceiptLib.test.ts tests/deliveryForm.test.ts
git commit -m "feat(receiving): add delivery conversion math and form helpers"
```

---

### Task 4: Draft CRUD in `database/deliveries.ts`

**Files:**

- Create: `database/deliveries.ts`
- Modify: `database/index.ts` (add `export * from './deliveries';`)
- Test: `tests/database/delivery-drafts.test.ts`

**Interfaces:**

- Consumes: `convertDeliveryLine`, `InvalidDeliveryLineError` (Task 3), types (Task 3), fixtures (Task 1).
- Produces:
  - Errors: `ReceiptNotDraftError(receiptId, status)`, `ReceiptEmptyError(receiptId)`, `DraftAlreadyExistsError(existingReceiptId)`, `QuickAddBarcodeExistsError(barcode)`, `ReceiptNotCommittedError(receiptId, status)`, `ReceiptAlreadyVoidedError(receiptId)`, `VoidWouldGoNegativeError(shortfalls)` where `shortfalls: { productId; productName; needed; onHand }[]`. All defined here so Tasks 5 to 6 only add functions.
  - `saveDeliveryDraft(input: SaveDeliveryDraftInput): Promise<number>` returns receipt id.
  - `getDeliveryReceipt(id: number): Promise<DeliveryReceiptDetail | null>`.
  - `getOpenDraftForSupplier(supplierId: string): Promise<number | null>`.
  - `listDeliveryReceipts(filter?: { supplierId?: string; status?: DeliveryReceiptStatus; since?: string }): Promise<DeliveryReceiptSummary[]>`.
  - `discardDeliveryDraft(id: number): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```ts
import { db } from '@/configs/sqlite';
import {
  DraftAlreadyExistsError,
  QuickAddBarcodeExistsError,
  ReceiptNotDraftError,
  discardDeliveryDraft,
  getDeliveryReceipt,
  getOpenDraftForSupplier,
  listDeliveryReceipts,
  saveDeliveryDraft,
} from '@/database/deliveries';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';

const retailLine = (
  productId: number,
  expected: number,
  received: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('delivery drafts', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('saves a draft with converted wholesale values and snapshots', async () => {
    const sup = await seedSupplier('sup-1', 'Acme');
    const pid = await seedProduct({
      name: 'Soda',
      sku: 'SO1',
      qty: 0,
      cost: 9,
      wholesale: { unitName: 'Case', price: 300, cost: 216, factor: 24 },
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-1',
      lines: [
        {
          productId: pid,
          newProduct: null,
          enteredUnit: 'wholesale',
          enteredExpectedQty: 3,
          enteredReceivedQty: 2,
          enteredUnitCost: 240,
        },
      ],
    });
    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('draft');
    expect(detail?.invoiceNo).toBe('INV-1');
    expect(detail?.lines).toHaveLength(1);
    expect(detail?.lines[0]).toMatchObject({
      productName: 'Soda',
      expectedQty: 72,
      receivedQty: 48,
      shortageQty: 24,
      actualUnitCost: 10,
      expectedUnitCost: 9,
      conversionFactorUsed: 24,
      enteredUnit: 'wholesale',
      enteredReceivedQty: 2,
    });
  });

  it('re-saving replaces lines and keeps one receipt', async () => {
    const sup = await seedSupplier('sup-2');
    const a = await seedProduct({ name: 'A', sku: 'A1' });
    const b = await seedProduct({ name: 'B', sku: 'B1' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 5, 5, 10)],
    });
    const id2 = await saveDeliveryDraft({
      receiptId: id,
      supplierId: sup,
      lines: [retailLine(b, 2, 2, 20)],
    });
    expect(id2).toBe(id);
    const detail = await getDeliveryReceipt(id);
    expect(detail?.lines.map((l) => l.productId)).toEqual([b]);
  });

  it('a second new draft for the same supplier throws with the existing id', async () => {
    const sup = await seedSupplier('sup-3');
    const a = await seedProduct({ name: 'A', sku: 'A2' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await expect(
      saveDeliveryDraft({ supplierId: sup, lines: [retailLine(a, 1, 1, 5)] }),
    ).rejects.toMatchObject({
      name: 'DraftAlreadyExistsError',
      existingReceiptId: id,
    });
    expect(await getOpenDraftForSupplier(sup)).toBe(id);
  });

  it('review focus: wholesale on a product without a wholesale unit is rejected and saves nothing', async () => {
    const sup = await seedSupplier('sup-4');
    const pid = await seedProduct({ name: 'Plain', sku: 'P1' });
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: pid,
            newProduct: null,
            enteredUnit: 'wholesale',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidDeliveryLineError);
    expect(await getOpenDraftForSupplier(sup)).toBeNull();
  });

  it('review focus: quick-add barcode that belongs to an existing product is rejected at save', async () => {
    const sup = await seedSupplier('sup-5');
    await seedProduct({ name: 'Taken', sku: 'T1', barcode: '4800000000011' });
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: null,
            newProduct: {
              name: 'Clone',
              price: 1500,
              barcode: '4800000000011',
            },
            enteredUnit: 'retail',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 900,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(QuickAddBarcodeExistsError);
    expect(await getOpenDraftForSupplier(sup)).toBeNull();
  });

  it('rejects a quick-add line with an empty name', async () => {
    const sup = await seedSupplier('sup-6');
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: null,
            newProduct: { name: '   ', price: 1500 },
            enteredUnit: 'retail',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 900,
          },
        ],
      }),
    ).rejects.toThrow('name');
  });

  it('cannot save over a committed receipt', async () => {
    const sup = await seedSupplier('sup-7');
    const a = await seedProduct({ name: 'A', sku: 'A3' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed' WHERE id = ?",
      [id],
    );
    await expect(
      saveDeliveryDraft({
        receiptId: id,
        supplierId: sup,
        lines: [retailLine(a, 2, 2, 5)],
      }),
    ).rejects.toBeInstanceOf(ReceiptNotDraftError);
  });

  it('discard removes a draft and its lines; refuses a committed receipt', async () => {
    const sup = await seedSupplier('sup-8');
    const a = await seedProduct({ name: 'A', sku: 'A4' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await discardDeliveryDraft(id);
    expect(await getDeliveryReceipt(id)).toBeNull();
    const lines = await db.getAllAsync(
      'SELECT id FROM delivery_receipt_lines WHERE receipt_id = ?',
      [id],
    );
    expect(lines).toHaveLength(0);

    const id2 = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed' WHERE id = ?",
      [id2],
    );
    await expect(discardDeliveryDraft(id2)).rejects.toBeInstanceOf(
      ReceiptNotDraftError,
    );
  });

  it('lists receipts filtered by status', async () => {
    const sup = await seedSupplier('sup-9', 'Nine');
    const a = await seedProduct({ name: 'A', sku: 'A5' });
    await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 4, 3, 10)],
    });
    const drafts = await listDeliveryReceipts({ status: 'draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      supplierName: 'Nine',
      lineCount: 1,
      totalCost: 30,
      shortageQty: 1,
    });
    expect(await listDeliveryReceipts({ status: 'committed' })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/database/delivery-drafts.test.ts`
Expected: FAIL (module `@/database/deliveries` not found).

- [ ] **Step 3: Implement**

Create `database/deliveries.ts`:

```ts
import { db } from '../configs/sqlite';
import {
  convertDeliveryLine,
  InvalidDeliveryLineError,
} from '../lib/deliveryReceipt';
import type {
  DeliveryLineInput,
  DeliveryReceiptDetail,
  DeliveryReceiptLine,
  DeliveryReceiptStatus,
  DeliveryReceiptSummary,
  SaveDeliveryDraftInput,
} from '../types/deliveries.types';

export class ReceiptNotDraftError extends Error {
  receiptId: number;
  status: string;
  constructor(receiptId: number, status: string) {
    super(`Delivery receipt ${receiptId} is ${status}, not a draft`);
    this.name = 'ReceiptNotDraftError';
    this.receiptId = receiptId;
    this.status = status;
  }
}

export class ReceiptEmptyError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} has nothing received`);
    this.name = 'ReceiptEmptyError';
    this.receiptId = receiptId;
  }
}

export class DraftAlreadyExistsError extends Error {
  existingReceiptId: number;
  constructor(existingReceiptId: number) {
    super(
      `A draft delivery receipt ${existingReceiptId} already exists for this supplier`,
    );
    this.name = 'DraftAlreadyExistsError';
    this.existingReceiptId = existingReceiptId;
  }
}

export class QuickAddBarcodeExistsError extends Error {
  barcode: string;
  constructor(barcode: string) {
    super(`Barcode ${barcode} already belongs to a product`);
    this.name = 'QuickAddBarcodeExistsError';
    this.barcode = barcode;
  }
}

export class ReceiptNotCommittedError extends Error {
  receiptId: number;
  status: string;
  constructor(receiptId: number, status: string) {
    super(`Delivery receipt ${receiptId} is ${status}, not committed`);
    this.name = 'ReceiptNotCommittedError';
    this.receiptId = receiptId;
    this.status = status;
  }
}

export class ReceiptAlreadyVoidedError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} is already voided`);
    this.name = 'ReceiptAlreadyVoidedError';
    this.receiptId = receiptId;
  }
}

export interface VoidShortfall {
  productId: number;
  productName: string;
  needed: number;
  onHand: number;
}

export class VoidWouldGoNegativeError extends Error {
  shortfalls: VoidShortfall[];
  constructor(shortfalls: VoidShortfall[]) {
    super(
      `Cannot void: stock too low for ${shortfalls.map((s) => s.productName).join(', ')}`,
    );
    this.name = 'VoidWouldGoNegativeError';
    this.shortfalls = shortfalls;
  }
}

interface ReceiptRow {
  id: number;
  supplier_id: string;
  status: DeliveryReceiptStatus;
  invoice_no: string | null;
  invoice_photo_uri: string | null;
  note: string | null;
  created_at: string;
  committed_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

interface LineRow {
  id: number;
  receipt_id: number;
  product_id: number | null;
  product_name: string | null;
  new_product_name: string | null;
  new_product_price: number | null;
  new_product_barcode: string | null;
  entered_unit: 'retail' | 'wholesale';
  entered_expected_qty: number;
  entered_received_qty: number;
  entered_unit_cost: number;
  expected_qty: number;
  received_qty: number;
  expected_unit_cost: number | null;
  actual_unit_cost: number;
  shortage_qty: number;
  conversion_factor_used: number;
}

export const getReceiptRow = async (id: number): Promise<ReceiptRow | null> =>
  db.getFirstAsync<ReceiptRow>('SELECT * FROM delivery_receipts WHERE id = ?', [
    id,
  ]);

export const getOpenDraftForSupplier = async (
  supplierId: string,
): Promise<number | null> => {
  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM delivery_receipts WHERE supplier_id = ? AND status = 'draft'",
    [supplierId],
  );
  return row?.id ?? null;
};

const insertLine = async (
  receiptId: number,
  line: DeliveryLineInput,
): Promise<void> => {
  let conversionFactor: number | null = null;
  let expectedUnitCost: number | null = null;

  if (line.productId !== null) {
    const product = await db.getFirstAsync<{
      conversion_factor: number | null;
      cost_price: number | null;
    }>('SELECT conversion_factor, cost_price FROM products WHERE id = ?', [
      line.productId,
    ]);
    if (!product) {
      throw new InvalidDeliveryLineError(`Product ${line.productId} not found`);
    }
    conversionFactor = product.conversion_factor;
    expectedUnitCost = product.cost_price;
  } else {
    const quick = line.newProduct;
    if (!quick || quick.name.trim() === '') {
      throw new InvalidDeliveryLineError('New product name is required');
    }
    if (!Number.isInteger(quick.price) || quick.price < 0) {
      throw new InvalidDeliveryLineError(
        'New product price must be whole pesos',
      );
    }
    if (line.enteredUnit !== 'retail') {
      throw new InvalidDeliveryLineError(
        'New products are received in retail pieces',
      );
    }
    const barcode = quick.barcode?.trim() || null;
    if (barcode) {
      const clash = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM products WHERE barcode = ? OR wholesale_barcode = ?',
        [barcode, barcode],
      );
      if (clash) throw new QuickAddBarcodeExistsError(barcode);
    }
  }

  const c = convertDeliveryLine({
    enteredUnit: line.enteredUnit,
    enteredExpectedQty: line.enteredExpectedQty,
    enteredReceivedQty: line.enteredReceivedQty,
    enteredUnitCost: line.enteredUnitCost,
    conversionFactor,
  });

  await db.runAsync(
    `INSERT INTO delivery_receipt_lines (
       receipt_id, product_id, new_product_name, new_product_price, new_product_barcode,
       entered_unit, entered_expected_qty, entered_received_qty, entered_unit_cost,
       expected_qty, received_qty, expected_unit_cost, actual_unit_cost,
       shortage_qty, conversion_factor_used
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receiptId,
      line.productId,
      line.newProduct?.name.trim() ?? null,
      line.newProduct?.price ?? null,
      line.newProduct?.barcode?.trim() || null,
      line.enteredUnit,
      line.enteredExpectedQty,
      line.enteredReceivedQty,
      line.enteredUnitCost,
      c.expectedQty,
      c.receivedQty,
      expectedUnitCost,
      c.actualUnitCost,
      c.shortageQty,
      c.conversionFactorUsed,
    ],
  );
};

/**
 * Creates or updates the draft header and replaces all its lines.
 * The supplier of an existing draft cannot change.
 */
export const saveDeliveryDraft = async (
  input: SaveDeliveryDraftInput,
): Promise<number> => {
  let receiptId = input.receiptId ?? 0;

  await db.withTransactionAsync(async () => {
    if (input.receiptId !== undefined) {
      const existing = await getReceiptRow(input.receiptId);
      if (!existing) {
        throw new Error(`Delivery receipt ${input.receiptId} not found`);
      }
      if (existing.status !== 'draft') {
        throw new ReceiptNotDraftError(existing.id, existing.status);
      }
      await db.runAsync(
        'UPDATE delivery_receipts SET invoice_no = ?, invoice_photo_uri = ?, note = ? WHERE id = ?',
        [
          input.invoiceNo ?? null,
          input.invoicePhotoUri ?? null,
          input.note ?? null,
          existing.id,
        ],
      );
      await db.runAsync(
        'DELETE FROM delivery_receipt_lines WHERE receipt_id = ?',
        [existing.id],
      );
    } else {
      const openDraft = await getOpenDraftForSupplier(input.supplierId);
      if (openDraft !== null) throw new DraftAlreadyExistsError(openDraft);
      const result = await db.runAsync(
        'INSERT INTO delivery_receipts (supplier_id, status, invoice_no, invoice_photo_uri, note, received_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          input.supplierId,
          'draft',
          input.invoiceNo ?? null,
          input.invoicePhotoUri ?? null,
          input.note ?? null,
          new Date().toISOString(),
        ],
      );
      receiptId = result.lastInsertRowId;
    }

    for (const line of input.lines) {
      await insertLine(receiptId, line);
    }
  });

  return receiptId;
};

export const discardDeliveryDraft = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const existing = await getReceiptRow(id);
    if (!existing) return;
    if (existing.status !== 'draft') {
      throw new ReceiptNotDraftError(id, existing.status);
    }
    await db.runAsync(
      'DELETE FROM delivery_receipt_lines WHERE receipt_id = ?',
      [id],
    );
    await db.runAsync('DELETE FROM delivery_receipts WHERE id = ?', [id]);
  });
};

const mapLine = (r: LineRow): DeliveryReceiptLine => ({
  id: r.id,
  receiptId: r.receipt_id,
  productId: r.product_id,
  productName: r.product_name ?? r.new_product_name ?? 'Unknown product',
  newProduct:
    r.new_product_name !== null
      ? {
          name: r.new_product_name,
          price: r.new_product_price ?? 0,
          barcode: r.new_product_barcode,
        }
      : null,
  enteredUnit: r.entered_unit,
  enteredExpectedQty: r.entered_expected_qty,
  enteredReceivedQty: r.entered_received_qty,
  enteredUnitCost: r.entered_unit_cost,
  expectedQty: r.expected_qty,
  receivedQty: r.received_qty,
  expectedUnitCost: r.expected_unit_cost,
  actualUnitCost: r.actual_unit_cost,
  shortageQty: r.shortage_qty,
  conversionFactorUsed: r.conversion_factor_used,
});

const SUMMARY_SELECT = `
  SELECT r.id, r.supplier_id, s.name AS supplier_name, r.status, r.invoice_no,
         r.created_at, r.committed_at, r.voided_at,
         COUNT(l.id) AS line_count,
         COALESCE(SUM(l.received_qty * l.actual_unit_cost), 0) AS total_cost,
         COALESCE(SUM(l.shortage_qty), 0) AS shortage_qty
  FROM delivery_receipts r
  JOIN suppliers s ON s.id = r.supplier_id
  LEFT JOIN delivery_receipt_lines l ON l.receipt_id = r.id`;

interface SummaryRow {
  id: number;
  supplier_id: string;
  supplier_name: string;
  status: DeliveryReceiptStatus;
  invoice_no: string | null;
  created_at: string;
  committed_at: string | null;
  voided_at: string | null;
  line_count: number;
  total_cost: number;
  shortage_qty: number;
}

const mapSummary = (r: SummaryRow): DeliveryReceiptSummary => ({
  id: r.id,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  status: r.status,
  invoiceNo: r.invoice_no,
  createdAt: r.created_at,
  committedAt: r.committed_at,
  voidedAt: r.voided_at,
  lineCount: r.line_count,
  totalCost: r.total_cost,
  shortageQty: r.shortage_qty,
});

export const getDeliveryReceipt = async (
  id: number,
): Promise<DeliveryReceiptDetail | null> => {
  const summary = await db.getFirstAsync<SummaryRow>(
    `${SUMMARY_SELECT} WHERE r.id = ? GROUP BY r.id`,
    [id],
  );
  if (!summary) return null;
  const header = await getReceiptRow(id);
  const lines = await db.getAllAsync<LineRow>(
    `SELECT l.*, p.name AS product_name
     FROM delivery_receipt_lines l
     LEFT JOIN products p ON p.id = l.product_id
     WHERE l.receipt_id = ? ORDER BY l.id`,
    [id],
  );
  return {
    ...mapSummary(summary),
    invoicePhotoUri: header?.invoice_photo_uri ?? null,
    note: header?.note ?? null,
    voidReason: header?.void_reason ?? null,
    lines: lines.map(mapLine),
  };
};

export const listDeliveryReceipts = async (
  filter: {
    supplierId?: string;
    status?: DeliveryReceiptStatus;
    since?: string;
  } = {},
): Promise<DeliveryReceiptSummary[]> => {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.supplierId) {
    where.push('r.supplier_id = ?');
    params.push(filter.supplierId);
  }
  if (filter.status) {
    where.push('r.status = ?');
    params.push(filter.status);
  }
  if (filter.since) {
    where.push('r.created_at >= ?');
    params.push(filter.since);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.getAllAsync<SummaryRow>(
    `${SUMMARY_SELECT} ${clause} GROUP BY r.id ORDER BY r.id DESC`,
    params,
  );
  return rows.map(mapSummary);
};
```

Add to `database/index.ts` after the `./auth` export:

```ts
export * from './deliveries';
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/database/delivery-drafts.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add database/deliveries.ts database/index.ts tests/database/delivery-drafts.test.ts
git commit -m "feat(receiving): delivery draft save, get, list, discard"
```

---

### Task 5: Commit a receipt

**Files:**

- Modify: `database/deliveries.ts` (append `commitDeliveryReceipt`; add `applyInventoryTransaction` import)
- Test: `tests/database/delivery-commit.test.ts`

**Interfaces:**

- Consumes: `applyInventoryTransaction` (Task 2), `getReceiptRow`, `ReceiptNotDraftError`, `ReceiptEmptyError` (Task 4).
- Produces: `commitDeliveryReceipt(receiptId: number): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```ts
import { db } from '@/configs/sqlite';
import {
  ReceiptEmptyError,
  ReceiptNotDraftError,
  commitDeliveryReceipt,
  getDeliveryReceipt,
  saveDeliveryDraft,
} from '@/database/deliveries';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
  stockOf,
} from '../helpers/deliveryFixtures';

const retail = (
  productId: number,
  expected: number,
  received: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('commitDeliveryReceipt', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('writes one restock row per received line, updates stock and cost, flips status', async () => {
    const sup = await seedSupplier('c-1');
    const a = await seedProduct({ name: 'A', sku: 'CA', qty: 5, cost: 10 });
    const b = await seedProduct({ name: 'B', sku: 'CB', qty: 0, cost: 20 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-9',
      lines: [retail(a, 10, 8, 12), retail(b, 4, 4, 25)],
    });

    await commitDeliveryReceipt(id);

    expect(await stockOf(a)).toEqual({ quantity: 13, cost_price: 12 });
    expect(await stockOf(b)).toEqual({ quantity: 4, cost_price: 25 });

    const rows = await db.getAllAsync<{
      product_id: number;
      quantity: number;
      unit_cost: number;
      supplier_id: string;
      receipt_id: number;
    }>(
      'SELECT product_id, quantity, unit_cost, supplier_id, receipt_id FROM inventory_transactions WHERE receipt_id = ? ORDER BY id',
      [id],
    );
    expect(rows).toEqual([
      {
        product_id: a,
        quantity: 8,
        unit_cost: 12,
        supplier_id: sup,
        receipt_id: id,
      },
      {
        product_id: b,
        quantity: 4,
        unit_cost: 25,
        supplier_id: sup,
        receipt_id: id,
      },
    ]);

    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('committed');
    expect(detail?.committedAt).not.toBeNull();
  });

  it('review focus: double commit throws ReceiptNotDraftError and does not restock twice', async () => {
    const sup = await seedSupplier('c-2');
    const a = await seedProduct({ name: 'A', sku: 'CA2', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 3, 10)],
    });
    await commitDeliveryReceipt(id);
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      ReceiptNotDraftError,
    );
    expect((await stockOf(a)).quantity).toBe(3);
  });

  it('zero-received line writes no stock row but the line is kept', async () => {
    const sup = await seedSupplier('c-3');
    const a = await seedProduct({ name: 'A', sku: 'CA3', qty: 1, cost: 5 });
    const b = await seedProduct({ name: 'B', sku: 'CB3', qty: 1, cost: 5 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 6, 0, 7), retail(b, 2, 2, 7)],
    });
    await commitDeliveryReceipt(id);
    expect(await stockOf(a)).toEqual({ quantity: 1, cost_price: 5 });
    const detail = await getDeliveryReceipt(id);
    expect(detail?.lines).toHaveLength(2);
    expect(detail?.lines.find((l) => l.productId === a)?.shortageQty).toBe(6);
  });

  it('an empty or all-zero receipt throws ReceiptEmptyError and stays a draft', async () => {
    const sup = await seedSupplier('c-4');
    const a = await seedProduct({ name: 'A', sku: 'CA4' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 0, 5)],
    });
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      ReceiptEmptyError,
    );
    expect((await getDeliveryReceipt(id))?.status).toBe('draft');
  });

  it('wholesale entry restocks converted pieces at per-piece cost', async () => {
    const sup = await seedSupplier('c-5');
    const a = await seedProduct({
      name: 'Soda',
      sku: 'CA5',
      qty: 0,
      cost: 9,
      wholesale: { unitName: 'Case', price: 300, cost: 216, factor: 24 },
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        {
          productId: a,
          newProduct: null,
          enteredUnit: 'wholesale',
          enteredExpectedQty: 3,
          enteredReceivedQty: 3,
          enteredUnitCost: 240,
        },
      ],
    });
    await commitDeliveryReceipt(id);
    expect(await stockOf(a)).toEqual({ quantity: 72, cost_price: 10 });
  });

  it('review focus: same product on two lines adds both quantities', async () => {
    const sup = await seedSupplier('c-6');
    const a = await seedProduct({ name: 'A', sku: 'CA6', qty: 2, cost: 5 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 6), retail(a, 3, 3, 7)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(9);
  });

  it('review focus: over-delivery restocks the full received qty with zero shortage', async () => {
    const sup = await seedSupplier('c-7');
    const a = await seedProduct({ name: 'A', sku: 'CA7', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 9, 4)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(9);
    expect((await getDeliveryReceipt(id))?.lines[0]?.shortageQty).toBe(0);
  });

  it('creates a quick-add product in the same transaction and links the line', async () => {
    const sup = await seedSupplier('c-8');
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        {
          productId: null,
          newProduct: {
            name: 'Mystery Candy',
            price: 150,
            barcode: '4800000000099',
          },
          enteredUnit: 'retail',
          enteredExpectedQty: 20,
          enteredReceivedQty: 18,
          enteredUnitCost: 100,
        },
      ],
    });
    await commitDeliveryReceipt(id);
    const detail = await getDeliveryReceipt(id);
    const pid = detail?.lines[0]?.productId;
    expect(pid).toBeGreaterThan(0);
    const product = await db.getFirstAsync<{
      name: string;
      price: number;
      barcode: string;
      supplier_id: string;
    }>('SELECT name, price, barcode, supplier_id FROM products WHERE id = ?', [
      pid ?? 0,
    ]);
    expect(product).toEqual({
      name: 'Mystery Candy',
      price: 150,
      barcode: '4800000000099',
      supplier_id: sup,
    });
    expect(await stockOf(pid ?? 0)).toEqual({ quantity: 18, cost_price: 100 });
  });

  it('failure on a later line rolls back everything (no partial restock, no quick-add product)', async () => {
    const sup = await seedSupplier('c-9');
    const a = await seedProduct({ name: 'A', sku: 'CA9', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        retail(a, 2, 2, 5),
        {
          productId: null,
          newProduct: { name: 'Ghost', price: 100 },
          enteredUnit: 'retail',
          enteredExpectedQty: 1,
          enteredReceivedQty: 1,
          enteredUnitCost: 50,
        },
      ],
    });
    // Sabotage: delete the product behind line 1 so applyInventoryTransaction throws mid-loop
    await db.runAsync('PRAGMA foreign_keys = OFF');
    await db.runAsync('DELETE FROM products WHERE id = ?', [a]);
    await db.runAsync('PRAGMA foreign_keys = ON');
    await expect(commitDeliveryReceipt(id)).rejects.toThrow();
    expect((await getDeliveryReceipt(id))?.status).toBe('draft');
    const ghosts = await db.getAllAsync(
      "SELECT id FROM products WHERE name = 'Ghost'",
    );
    expect(ghosts).toHaveLength(0);
    const txs = await db.getAllAsync(
      'SELECT id FROM inventory_transactions WHERE receipt_id = ?',
      [id],
    );
    expect(txs).toHaveLength(0);
  });
});
```

Note for the implementer: the rollback test deletes a product to force a mid-loop failure. If `PRAGMA foreign_keys` cannot be toggled inside the mock (SQLite ignores it inside a transaction), instead make the second line fail by pre-inserting a product with barcode `'4800000000077'` after saving a draft whose quick-add line used that barcode, so commit's barcode re-check throws. Keep whichever variant makes the assertions (status `draft`, no ghost product, no `receipt_id` rows) pass.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/database/delivery-commit.test.ts`
Expected: FAIL (`commitDeliveryReceipt` is not exported).

- [ ] **Step 3: Implement**

At the top of `database/deliveries.ts` add the import:

```ts
import { applyInventoryTransaction } from './inventory';
```

Append to `database/deliveries.ts`:

```ts
const createQuickAddProduct = async (
  line: LineRow,
  supplierId: string,
  receiptId: number,
): Promise<number> => {
  const barcode = line.new_product_barcode?.trim() || null;
  if (barcode) {
    const clash = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM products WHERE barcode = ? OR wholesale_barcode = ?',
      [barcode, barcode],
    );
    if (clash) throw new QuickAddBarcodeExistsError(barcode);
  }
  const result = await db.runAsync(
    `INSERT INTO products (name, sku, price, quantity, cost_price, barcode, supplier_id)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
    [
      line.new_product_name ?? 'New product',
      `DLV-${receiptId}-${line.id}`,
      line.new_product_price ?? 0,
      line.actual_unit_cost,
      barcode,
      supplierId,
    ],
  );
  return result.lastInsertRowId;
};

/**
 * Commits a draft: creates quick-add products, restocks every received line
 * through applyInventoryTransaction, and flips the status, all in one
 * transaction. A second call throws ReceiptNotDraftError, so a double tap
 * cannot restock twice.
 */
export const commitDeliveryReceipt = async (
  receiptId: number,
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const receipt = await getReceiptRow(receiptId);
    if (!receipt) throw new Error(`Delivery receipt ${receiptId} not found`);
    if (receipt.status !== 'draft') {
      throw new ReceiptNotDraftError(receiptId, receipt.status);
    }

    const lines = await db.getAllAsync<LineRow>(
      'SELECT l.*, NULL AS product_name FROM delivery_receipt_lines l WHERE l.receipt_id = ? ORDER BY l.id',
      [receiptId],
    );
    if (lines.length === 0 || lines.every((l) => l.received_qty === 0)) {
      throw new ReceiptEmptyError(receiptId);
    }

    const note = receipt.invoice_no
      ? `Delivery receipt #${receiptId} (invoice ${receipt.invoice_no})`
      : `Delivery receipt #${receiptId}`;

    for (const line of lines) {
      let productId = line.product_id;
      if (productId === null) {
        productId = await createQuickAddProduct(
          line,
          receipt.supplier_id,
          receiptId,
        );
        await db.runAsync(
          'UPDATE delivery_receipt_lines SET product_id = ? WHERE id = ?',
          [productId, line.id],
        );
      }
      if (line.received_qty > 0) {
        await applyInventoryTransaction({
          product_id: productId,
          type: 'restock',
          quantity: line.received_qty,
          unit_cost: line.actual_unit_cost,
          supplier_id: receipt.supplier_id,
          receipt_id: receiptId,
          note,
        });
      }
    }

    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed', committed_at = ? WHERE id = ?",
      [new Date().toISOString(), receiptId],
    );
  });
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/database/delivery-commit.test.ts`
Expected: PASS (9 tests). If the rollback test needs the alternate sabotage described in Step 1, apply it.

- [ ] **Step 5: Run full suite and typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/deliveries.ts tests/database/delivery-commit.test.ts
git commit -m "feat(receiving): commit delivery receipts atomically through restock path"
```

---

### Task 6: Void a committed receipt

**Files:**

- Modify: `database/deliveries.ts` (append `voidDeliveryReceipt`)
- Test: `tests/database/delivery-void.test.ts`

**Interfaces:**

- Consumes: Task 4 errors and `getReceiptRow`; Task 5 `commitDeliveryReceipt`; `applyInventoryTransaction`.
- Produces: `voidDeliveryReceipt(receiptId: number, reason: string): Promise<void>`. PIN gating is the caller's job (Task 8 hook and Task 9 screen).

- [ ] **Step 1: Write the failing test**

```ts
import { db } from '@/configs/sqlite';
import {
  ReceiptAlreadyVoidedError,
  ReceiptNotCommittedError,
  VoidWouldGoNegativeError,
  commitDeliveryReceipt,
  getDeliveryReceipt,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
  stockOf,
} from '../helpers/deliveryFixtures';

const retail = (
  productId: number,
  expected: number,
  received: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('voidDeliveryReceipt', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('reverses stock with negative adjustment rows tagged with the receipt id', async () => {
    const sup = await seedSupplier('v-1');
    const a = await seedProduct({ name: 'A', sku: 'VA', qty: 5, cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 12)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(9);

    await voidDeliveryReceipt(id, 'Wrong supplier');

    expect(await stockOf(a)).toEqual({ quantity: 5, cost_price: 12 });
    const rows = await db.getAllAsync<{
      type: string;
      adjustment_sign: string | null;
      quantity: number;
    }>(
      "SELECT type, adjustment_sign, quantity FROM inventory_transactions WHERE receipt_id = ? AND type = 'adjustment'",
      [id],
    );
    expect(rows).toEqual([
      { type: 'adjustment', adjustment_sign: 'negative', quantity: 4 },
    ]);
    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('voided');
    expect(detail?.voidReason).toBe('Wrong supplier');
    expect(detail?.voidedAt).not.toBeNull();
  });

  it('review focus: refuses when stock was sold since, names the product, changes nothing', async () => {
    const sup = await seedSupplier('v-2');
    const a = await seedProduct({
      name: 'Sold Out Item',
      sku: 'VB',
      qty: 0,
      cost: 10,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 5, 12)],
    });
    await commitDeliveryReceipt(id);
    await db.runAsync('UPDATE products SET quantity = 2 WHERE id = ?', [a]);

    const err = await voidDeliveryReceipt(id, 'oops').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VoidWouldGoNegativeError);
    expect((err as VoidWouldGoNegativeError).shortfalls).toEqual([
      { productId: a, productName: 'Sold Out Item', needed: 5, onHand: 2 },
    ]);
    expect((await stockOf(a)).quantity).toBe(2);
    expect((await getDeliveryReceipt(id))?.status).toBe('committed');
  });

  it('review focus: same product on two lines is reversed as one total, checked against stock once', async () => {
    const sup = await seedSupplier('v-3');
    const a = await seedProduct({ name: 'A', sku: 'VC', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 6), retail(a, 3, 3, 7)],
    });
    await commitDeliveryReceipt(id);
    await db.runAsync('UPDATE products SET quantity = 6 WHERE id = ?', [a]);
    await expect(voidDeliveryReceipt(id, 'x')).rejects.toBeInstanceOf(
      VoidWouldGoNegativeError,
    );
    await db.runAsync('UPDATE products SET quantity = 7 WHERE id = ?', [a]);
    await voidDeliveryReceipt(id, 'x');
    expect((await stockOf(a)).quantity).toBe(0);
  });

  it('refuses a draft and an already-voided receipt', async () => {
    const sup = await seedSupplier('v-4');
    const a = await seedProduct({ name: 'A', sku: 'VD' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 1, 1, 5)],
    });
    await expect(voidDeliveryReceipt(id, 'x')).rejects.toBeInstanceOf(
      ReceiptNotCommittedError,
    );
    await commitDeliveryReceipt(id);
    await voidDeliveryReceipt(id, 'x');
    await expect(voidDeliveryReceipt(id, 'again')).rejects.toBeInstanceOf(
      ReceiptAlreadyVoidedError,
    );
  });

  it('requires a non-empty reason', async () => {
    const sup = await seedSupplier('v-5');
    const a = await seedProduct({ name: 'A', sku: 'VE' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 1, 1, 5)],
    });
    await commitDeliveryReceipt(id);
    await expect(voidDeliveryReceipt(id, '   ')).rejects.toThrow('reason');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/database/delivery-void.test.ts`
Expected: FAIL (`voidDeliveryReceipt` is not exported).

- [ ] **Step 3: Implement**

Append to `database/deliveries.ts`:

```ts
/**
 * Voids a committed receipt: refuses if any product no longer has enough
 * stock to reverse, otherwise writes offsetting negative adjustments and
 * marks the receipt voided. cost_price is not rolled back. Owner PIN gating
 * is done by the caller.
 */
export const voidDeliveryReceipt = async (
  receiptId: number,
  reason: string,
): Promise<void> => {
  const trimmedReason = reason.trim();
  if (trimmedReason === '') {
    throw new Error('A void reason is required');
  }

  await db.withTransactionAsync(async () => {
    const receipt = await getReceiptRow(receiptId);
    if (!receipt) throw new Error(`Delivery receipt ${receiptId} not found`);
    if (receipt.status === 'voided')
      throw new ReceiptAlreadyVoidedError(receiptId);
    if (receipt.status !== 'committed') {
      throw new ReceiptNotCommittedError(receiptId, receipt.status);
    }

    const totals = await db.getAllAsync<{
      product_id: number;
      product_name: string;
      received: number;
      on_hand: number;
    }>(
      `SELECT l.product_id AS product_id, p.name AS product_name,
              SUM(l.received_qty) AS received, p.quantity AS on_hand
       FROM delivery_receipt_lines l
       JOIN products p ON p.id = l.product_id
       WHERE l.receipt_id = ? AND l.received_qty > 0
       GROUP BY l.product_id`,
      [receiptId],
    );

    const shortfalls: VoidShortfall[] = totals
      .filter((t) => t.on_hand < t.received)
      .map((t) => ({
        productId: t.product_id,
        productName: t.product_name,
        needed: t.received,
        onHand: t.on_hand,
      }));
    if (shortfalls.length > 0) throw new VoidWouldGoNegativeError(shortfalls);

    for (const t of totals) {
      await applyInventoryTransaction({
        product_id: t.product_id,
        type: 'adjustment',
        adjustment_sign: 'negative',
        quantity: t.received,
        receipt_id: receiptId,
        note: `Void of delivery receipt #${receiptId}: ${trimmedReason}`,
      });
    }

    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'voided', voided_at = ?, void_reason = ? WHERE id = ?",
      [new Date().toISOString(), trimmedReason, receiptId],
    );
  });
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/database/delivery-void.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add database/deliveries.ts tests/database/delivery-void.test.ts
git commit -m "feat(receiving): void committed delivery receipts with stock guard"
```

---

### Task 7: Shortage report

**Files:**

- Modify: `database/deliveries.ts` (append `getDeliveryShortageReport`, `getSupplierShortageLines`)
- Test: `tests/database/delivery-report.test.ts`

**Interfaces:**

- Consumes: Task 5 `commitDeliveryReceipt`, Task 6 `voidDeliveryReceipt`.
- Produces:
  - `getDeliveryShortageReport(range?: { since?: string; until?: string }): Promise<SupplierShortageRow[]>`
  - `getSupplierShortageLines(supplierId: string, range?: { since?: string; until?: string }): Promise<{ receiptId: number; invoiceNo: string | null; committedAt: string; productName: string; expectedQty: number; receivedQty: number; shortageQty: number }[]>`

- [ ] **Step 1: Write the failing test**

```ts
import {
  commitDeliveryReceipt,
  getDeliveryShortageReport,
  getSupplierShortageLines,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';

const line = (
  pid: number,
  expected: number,
  received: number,
  cost: number,
) => ({
  productId: pid,
  newProduct: null,
  enteredUnit: 'retail' as const,
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('getDeliveryShortageReport', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('ranks suppliers by shortage value and computes rate', async () => {
    const good = await seedSupplier('r-good', 'Reliable Co');
    const bad = await seedSupplier('r-bad', 'Shorty Inc');
    const a = await seedProduct({ name: 'A', sku: 'RA', cost: 10 });
    const b = await seedProduct({ name: 'B', sku: 'RB', cost: 50 });

    const g = await saveDeliveryDraft({
      supplierId: good,
      lines: [line(a, 10, 10, 10)],
    });
    await commitDeliveryReceipt(g);
    const s = await saveDeliveryDraft({
      supplierId: bad,
      lines: [line(a, 10, 7, 10), line(b, 4, 2, 50)],
    });
    await commitDeliveryReceipt(s);

    const report = await getDeliveryShortageReport();
    expect(report.map((r) => r.supplierId)).toEqual(['r-bad', 'r-good']);
    expect(report[0]).toMatchObject({
      supplierName: 'Shorty Inc',
      receipts: 1,
      lines: 2,
      shortLines: 2,
      shortageQty: 5,
      shortageValue: 3 * 10 + 2 * 50,
      shortageRate: 1,
    });
    expect(report[1]).toMatchObject({ shortageValue: 0, shortageRate: 0 });
  });

  it('excludes drafts and voided receipts', async () => {
    const sup = await seedSupplier('r-x', 'X');
    const a = await seedProduct({ name: 'A', sku: 'RX', cost: 10 });
    const draft = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 1, 10)],
    });
    expect(draft).toBeGreaterThan(0);
    expect(await getDeliveryShortageReport()).toHaveLength(0);

    await commitDeliveryReceipt(draft);
    expect(await getDeliveryShortageReport()).toHaveLength(1);
    await voidDeliveryReceipt(draft, 'mistake');
    expect(await getDeliveryShortageReport()).toHaveLength(0);
  });

  it('falls back to actual cost when the product had no expected cost', async () => {
    const sup = await seedSupplier('r-y', 'Y');
    const a = await seedProduct({ name: 'NoCost', sku: 'RY' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 3, 8)],
    });
    await commitDeliveryReceipt(id);
    const [row] = await getDeliveryShortageReport();
    expect(row?.shortageValue).toBe(2 * 8);
  });

  it('respects the date range', async () => {
    const sup = await seedSupplier('r-z', 'Z');
    const a = await seedProduct({ name: 'A', sku: 'RZ', cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 1, 10)],
    });
    await commitDeliveryReceipt(id);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(await getDeliveryShortageReport({ since: future })).toHaveLength(0);
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(await getDeliveryShortageReport({ since: past })).toHaveLength(1);
  });

  it('lists the short lines per supplier as evidence', async () => {
    const sup = await seedSupplier('r-w', 'W');
    const a = await seedProduct({ name: 'Short Item', sku: 'RW', cost: 10 });
    const b = await seedProduct({ name: 'Full Item', sku: 'RW2', cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-5',
      lines: [line(a, 6, 4, 10), line(b, 2, 2, 10)],
    });
    await commitDeliveryReceipt(id);
    const lines = await getSupplierShortageLines(sup);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      receiptId: id,
      invoiceNo: 'INV-5',
      productName: 'Short Item',
      expectedQty: 6,
      receivedQty: 4,
      shortageQty: 2,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/database/delivery-report.test.ts`
Expected: FAIL (functions not exported).

- [ ] **Step 3: Implement**

Add `SupplierShortageRow` to the type import at the top of `database/deliveries.ts`, then append:

```ts
interface DateRange {
  since?: string;
  until?: string;
}

export const getDeliveryShortageReport = async (
  range: DateRange = {},
): Promise<SupplierShortageRow[]> => {
  const rows = await db.getAllAsync<{
    supplier_id: string;
    supplier_name: string;
    receipts: number;
    lines: number;
    short_lines: number;
    shortage_qty: number;
    shortage_value: number;
  }>(
    `SELECT r.supplier_id AS supplier_id, s.name AS supplier_name,
            COUNT(DISTINCT r.id) AS receipts,
            COUNT(l.id) AS lines,
            SUM(CASE WHEN l.shortage_qty > 0 THEN 1 ELSE 0 END) AS short_lines,
            COALESCE(SUM(l.shortage_qty), 0) AS shortage_qty,
            COALESCE(SUM(l.shortage_qty * COALESCE(l.expected_unit_cost, l.actual_unit_cost)), 0) AS shortage_value
     FROM delivery_receipts r
     JOIN delivery_receipt_lines l ON l.receipt_id = r.id
     JOIN suppliers s ON s.id = r.supplier_id
     WHERE r.status = 'committed'
       AND (? IS NULL OR r.committed_at >= ?)
       AND (? IS NULL OR r.committed_at <= ?)
     GROUP BY r.supplier_id
     ORDER BY shortage_value DESC, short_lines DESC, supplier_name ASC`,
    [
      range.since ?? null,
      range.since ?? null,
      range.until ?? null,
      range.until ?? null,
    ],
  );
  return rows.map((r) => ({
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    receipts: r.receipts,
    lines: r.lines,
    shortLines: r.short_lines,
    shortageQty: r.shortage_qty,
    shortageValue: r.shortage_value,
    shortageRate: r.lines > 0 ? r.short_lines / r.lines : 0,
  }));
};

export interface SupplierShortageLine {
  receiptId: number;
  invoiceNo: string | null;
  committedAt: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  shortageQty: number;
}

export const getSupplierShortageLines = async (
  supplierId: string,
  range: DateRange = {},
): Promise<SupplierShortageLine[]> => {
  const rows = await db.getAllAsync<{
    receipt_id: number;
    invoice_no: string | null;
    committed_at: string;
    product_name: string | null;
    new_product_name: string | null;
    expected_qty: number;
    received_qty: number;
    shortage_qty: number;
  }>(
    `SELECT r.id AS receipt_id, r.invoice_no, r.committed_at,
            p.name AS product_name, l.new_product_name,
            l.expected_qty, l.received_qty, l.shortage_qty
     FROM delivery_receipts r
     JOIN delivery_receipt_lines l ON l.receipt_id = r.id
     LEFT JOIN products p ON p.id = l.product_id
     WHERE r.status = 'committed' AND r.supplier_id = ? AND l.shortage_qty > 0
       AND (? IS NULL OR r.committed_at >= ?)
       AND (? IS NULL OR r.committed_at <= ?)
     ORDER BY r.committed_at DESC, l.id ASC`,
    [
      supplierId,
      range.since ?? null,
      range.since ?? null,
      range.until ?? null,
      range.until ?? null,
    ],
  );
  return rows.map((r) => ({
    receiptId: r.receipt_id,
    invoiceNo: r.invoice_no,
    committedAt: r.committed_at,
    productName: r.product_name ?? r.new_product_name ?? 'Unknown product',
    expectedQty: r.expected_qty,
    receivedQty: r.received_qty,
    shortageQty: r.shortage_qty,
  }));
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/database/delivery-report.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Run full suite and typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/deliveries.ts tests/database/delivery-report.test.ts
git commit -m "feat(receiving): supplier shortage report"
```

---

### Task 8: Hooks and i18n

**Files:**

- Create: `hooks/useDeliveryReceipts.ts`, `locales/en/receiving.json`, `locales/tl/receiving.json`
- Modify: `lib/i18n.ts` (register `receiving` in imports, `resources.en`, `resources.tl`, and `ns`)
- Test: `tests/receivingLocales.test.ts`

**Interfaces:**

- Consumes: all `database/deliveries.ts` functions; `invalidateProductDependencies` (`hooks/useProducts.ts`), `inventoryKeys` (`hooks/useInventory.ts`), `stockIntelligenceKeys` (`hooks/useStockIntelligence.ts`).
- Produces:
  - `deliveryKeys`
  - `useDeliveryReceipts(filter?)`, `useDeliveryReceipt(id: number | null)`, `useOpenDraftForSupplier(supplierId: string | null)`
  - `useSaveDeliveryDraft()` mutation of `SaveDeliveryDraftInput` returning receipt id
  - `useDiscardDeliveryDraft()`, `useCommitDeliveryReceipt()`, `useVoidDeliveryReceipt()` (variables `{ receiptId: number; reason: string }`)
  - `useDeliveryShortageReport(range?)`, `useSupplierShortageLines(supplierId, range?)`
  - i18n namespace `receiving` (keys listed below).

- [ ] **Step 1: Write the failing test**

Check how the existing locale test works first: read `tests/onboardingLocales.test.ts` and mirror it. Create `tests/receivingLocales.test.ts`:

```ts
import en from '../locales/en/receiving.json';
import tl from '../locales/tl/receiving.json';

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

describe('receiving locales', () => {
  it('en and tl have identical keys', () => {
    expect(flatten(tl).sort()).toEqual(flatten(en).sort());
  });
  it('has no empty strings', () => {
    for (const bundle of [en, tl]) {
      for (const key of flatten(bundle)) {
        const value = key
          .split('.')
          .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], bundle);
        expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/receivingLocales.test.ts`
Expected: FAIL (JSON files not found).

- [ ] **Step 3: Implement**

`locales/en/receiving.json`:

```json
{
  "listTitle": "Deliveries",
  "newDelivery": "Receive delivery",
  "tabDrafts": "Drafts",
  "tabCommitted": "Received",
  "tabVoided": "Voided",
  "emptyDrafts": "No drafts. Start a delivery when a supplier arrives.",
  "emptyCommitted": "No received deliveries yet.",
  "emptyVoided": "No voided deliveries.",
  "shortagesLink": "Shortages by supplier",
  "editorTitle": "Delivery",
  "supplier": "Supplier",
  "pickSupplier": "Choose supplier",
  "invoiceNo": "Invoice number",
  "invoicePhoto": "Invoice photo",
  "addPhoto": "Add photo",
  "note": "Note",
  "addLine": "Add product",
  "newProduct": "New product",
  "fillFromPlan": "Fill from reorder plan",
  "unitRetail": "Pieces",
  "unitWholesale": "Boxes",
  "expected": "Invoice qty",
  "received": "Received",
  "unitCost": "Cost each",
  "shortageChip": "Short {{count}}",
  "costUpChip": "+{{amount}} vs last",
  "costDownChip": "-{{amount}} vs last",
  "saveDraft": "Save draft",
  "review": "Review",
  "discard": "Discard draft",
  "commit": "Receive delivery",
  "reviewTotalCost": "Total cost",
  "reviewTotalShortage": "Shortage value",
  "reviewCostChanges": "Cost changes",
  "reviewIncomplete": "Fill received qty and cost on every line first.",
  "void": "Void delivery",
  "voidReason": "Why void this delivery?",
  "voidPinTitle": "Authorize Void Delivery",
  "quickAddTitle": "New product",
  "quickAddName": "Name",
  "quickAddPrice": "Selling price",
  "quickAddBarcode": "Barcode (optional)",
  "errorDraftExists": "A draft for this supplier is already open. Opening it.",
  "errorBarcodeExists": "That barcode already belongs to a product.",
  "errorEmpty": "Nothing was received on this delivery.",
  "errorVoidTooLow": "Cannot void: some stock was already sold. Use a stock adjustment instead.",
  "errorNotDraft": "This delivery was already received.",
  "reportTitle": "Shortages by supplier",
  "reportReceipts": "Deliveries",
  "reportShortLines": "Short lines",
  "reportShortageValue": "Shortage value",
  "reportRate": "Short rate",
  "reportEmpty": "No received deliveries in this period."
}
```

`locales/tl/receiving.json` (same keys, Filipino text):

```json
{
  "listTitle": "Mga Delivery",
  "newDelivery": "Tanggapin ang delivery",
  "tabDrafts": "Draft",
  "tabCommitted": "Natanggap",
  "tabVoided": "Na-void",
  "emptyDrafts": "Walang draft. Magsimula kapag dumating ang supplier.",
  "emptyCommitted": "Wala pang natanggap na delivery.",
  "emptyVoided": "Walang na-void na delivery.",
  "shortagesLink": "Kulang ayon sa supplier",
  "editorTitle": "Delivery",
  "supplier": "Supplier",
  "pickSupplier": "Pumili ng supplier",
  "invoiceNo": "Numero ng invoice",
  "invoicePhoto": "Larawan ng invoice",
  "addPhoto": "Magdagdag ng larawan",
  "note": "Tala",
  "addLine": "Magdagdag ng produkto",
  "newProduct": "Bagong produkto",
  "fillFromPlan": "Punan mula sa reorder plan",
  "unitRetail": "Piraso",
  "unitWholesale": "Kahon",
  "expected": "Dami sa invoice",
  "received": "Natanggap",
  "unitCost": "Puhunan bawat isa",
  "shortageChip": "Kulang {{count}}",
  "costUpChip": "+{{amount}} kumpara sa huli",
  "costDownChip": "-{{amount}} kumpara sa huli",
  "saveDraft": "I-save ang draft",
  "review": "Suriin",
  "discard": "Itapon ang draft",
  "commit": "Tanggapin ang delivery",
  "reviewTotalCost": "Kabuuang puhunan",
  "reviewTotalShortage": "Halaga ng kulang",
  "reviewCostChanges": "Pagbabago sa puhunan",
  "reviewIncomplete": "Punan muna ang natanggap at puhunan sa bawat linya.",
  "void": "I-void ang delivery",
  "voidReason": "Bakit i-void ang delivery na ito?",
  "voidPinTitle": "Pahintulutan ang Pag-void ng Delivery",
  "quickAddTitle": "Bagong produkto",
  "quickAddName": "Pangalan",
  "quickAddPrice": "Presyo ng bentahan",
  "quickAddBarcode": "Barcode (opsyonal)",
  "errorDraftExists": "May bukas nang draft para sa supplier na ito. Binubuksan ito.",
  "errorBarcodeExists": "Ang barcode na iyan ay pag-aari na ng isang produkto.",
  "errorEmpty": "Walang natanggap sa delivery na ito.",
  "errorVoidTooLow": "Hindi ma-void: may naibenta nang stock. Gumamit ng stock adjustment.",
  "errorNotDraft": "Natanggap na ang delivery na ito.",
  "reportTitle": "Kulang ayon sa supplier",
  "reportReceipts": "Mga delivery",
  "reportShortLines": "Mga linyang kulang",
  "reportShortageValue": "Halaga ng kulang",
  "reportRate": "Rate ng kulang",
  "reportEmpty": "Walang natanggap na delivery sa panahong ito."
}
```

In `lib/i18n.ts` add (mirroring the existing lines): imports `receivingEn from '../locales/en/receiving.json'` and `receivingTl from '../locales/tl/receiving.json'`; `receiving: receivingEn` in `resources.en`; `receiving: receivingTl` in `resources.tl`; `'receiving'` appended to the `ns` array.

`hooks/useDeliveryReceipts.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commitDeliveryReceipt,
  discardDeliveryDraft,
  getDeliveryReceipt,
  getDeliveryShortageReport,
  getOpenDraftForSupplier,
  getSupplierShortageLines,
  listDeliveryReceipts,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { inventoryKeys } from '@/hooks/useInventory';
import { invalidateProductDependencies } from '@/hooks/useProducts';
import { stockIntelligenceKeys } from '@/hooks/useStockIntelligence';
import type {
  DeliveryReceiptStatus,
  SaveDeliveryDraftInput,
} from '@/types/deliveries.types';

export const deliveryKeys = {
  all: ['delivery-receipts'] as const,
  list: (status?: DeliveryReceiptStatus, supplierId?: string) =>
    [
      ...deliveryKeys.all,
      'list',
      status ?? 'all',
      supplierId ?? 'all',
    ] as const,
  detail: (id: number) => [...deliveryKeys.all, 'detail', id] as const,
  openDraft: (supplierId: string) =>
    [...deliveryKeys.all, 'open-draft', supplierId] as const,
  report: (since?: string, until?: string) =>
    [...deliveryKeys.all, 'report', since ?? '', until ?? ''] as const,
  shortLines: (supplierId: string, since?: string, until?: string) =>
    [
      ...deliveryKeys.all,
      'short-lines',
      supplierId,
      since ?? '',
      until ?? '',
    ] as const,
};

export function useDeliveryReceipts(
  filter: { status?: DeliveryReceiptStatus; supplierId?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.list(filter.status, filter.supplierId),
    queryFn: () => listDeliveryReceipts(filter),
  });
}

export function useDeliveryReceipt(id: number | null) {
  return useQuery({
    queryKey: deliveryKeys.detail(id ?? -1),
    queryFn: () => getDeliveryReceipt(id as number),
    enabled: id !== null,
  });
}

export function useOpenDraftForSupplier(supplierId: string | null) {
  return useQuery({
    queryKey: deliveryKeys.openDraft(supplierId ?? ''),
    queryFn: () => getOpenDraftForSupplier(supplierId as string),
    enabled: supplierId !== null,
  });
}

export function useSaveDeliveryDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveDeliveryDraftInput) => saveDeliveryDraft(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

export function useDiscardDeliveryDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discardDeliveryDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

function invalidateAfterStockChange(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
  invalidateProductDependencies(queryClient);
  queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  queryClient.invalidateQueries({ queryKey: stockIntelligenceKeys.all });
}

export function useCommitDeliveryReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiptId: number) => commitDeliveryReceipt(receiptId),
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}

export function useVoidDeliveryReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { receiptId: number; reason: string }) =>
      voidDeliveryReceipt(v.receiptId, v.reason),
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}

export function useDeliveryShortageReport(
  range: { since?: string; until?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.report(range.since, range.until),
    queryFn: () => getDeliveryShortageReport(range),
  });
}

export function useSupplierShortageLines(
  supplierId: string | null,
  range: { since?: string; until?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.shortLines(
      supplierId ?? '',
      range.since,
      range.until,
    ),
    queryFn: () => getSupplierShortageLines(supplierId as string, range),
    enabled: supplierId !== null,
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm jest tests/receivingLocales.test.ts && pnpm typecheck`
Expected: PASS and no type errors.

- [ ] **Step 5: Commit**

```bash
git add hooks/useDeliveryReceipts.ts locales/en/receiving.json locales/tl/receiving.json lib/i18n.ts tests/receivingLocales.test.ts
git commit -m "feat(receiving): delivery hooks and receiving i18n namespace"
```

---

### Task 9: Screens and components

This task is UI. Before writing any screen, read these files to match the project's look, header, and form conventions, and reuse their components and NativeWind tokens: `app/(edit-forms)/add-supplier/index.tsx` (form screen scaffold), `app/reports/corrections.tsx` (report screen scaffold), `app/(edit-forms)/sale-correction/[id].tsx` (PIN guard and error toast pattern), `components/inventory/modals/RestockSheet.tsx` (supplier picker and unit entry), `hooks/useBarcodeResolver.tsx` and `usePaginatedProducts` in `hooks/useProducts.ts` (product search), and the supplier list hook (`grep -rn "listSuppliers" hooks/`). Match their import style and class names. The code below fixes logic, props, and behavior; copy visual tokens from those files.

**Files:**

- Create: `components/receiving/DeliveryLineRow.tsx`, `components/receiving/QuickAddProductSheet.tsx`, `components/receiving/ProductPickerSheet.tsx`
- Create: `app/(edit-forms)/delivery-receipts/index.tsx`, `app/(edit-forms)/delivery-receipt/[id].tsx`, `app/reports/supplier-shortages.tsx`
- Modify: `app/(tabs)/inventory/recommendations.tsx` (add "Receive delivery" button)
- Test: `tests/components/DeliveryLineRow.test.tsx`

**Interfaces:**

- Consumes: Task 3 `DraftLineForm`, `toLineInput`, `isLineComplete`, `seedLinesFromPlan`, `newLineKey`, `convertDeliveryLine`, `costChange`; Task 8 hooks; `useOwnerPinGuard().runWithPinGuard({ title, actionDescription, onApproved })`; `usePalengkeRestockPlan({ supplierId })` from `hooks/useStockIntelligence.ts`; `formatPesos`.
- Produces:
  - `<DeliveryLineRow form={DraftLineForm} onChange={(next: DraftLineForm) => void} onRemove={() => void} />`
  - `<QuickAddProductSheet visible onClose onSubmit={(p: QuickAddProductInput) => void} />`
  - `<ProductPickerSheet visible supplierId onClose onPick={(form: DraftLineForm) => void} />`

- [ ] **Step 1: Write the failing component test**

```tsx
import { render } from '@testing-library/react-native';
import { DeliveryLineRow } from '@/components/receiving/DeliveryLineRow';
import type { DraftLineForm } from '@/lib/deliveryForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const base: DraftLineForm = {
  key: 'k',
  productId: 1,
  productName: 'Soda',
  newProduct: null,
  enteredUnit: 'wholesale',
  retailUnitName: 'Pc',
  wholesaleUnitName: 'Case',
  conversionFactor: 24,
  lastCostPrice: 9,
  expectedQty: '3',
  receivedQty: '2',
  unitCost: '240',
};

describe('DeliveryLineRow', () => {
  it('shows a shortage chip in retail pieces when received is below expected', () => {
    const { getByText } = render(
      <DeliveryLineRow form={base} onChange={jest.fn()} onRemove={jest.fn()} />,
    );
    expect(getByText('shortageChip:{"count":24}')).toBeTruthy();
  });

  it('shows a cost-up chip comparing converted per-piece cost to the last cost', () => {
    const { getByText } = render(
      <DeliveryLineRow form={base} onChange={jest.fn()} onRemove={jest.fn()} />,
    );
    // 240 / 24 = 10 per piece, last cost 9, so +1
    expect(getByText(/costUpChip/)).toBeTruthy();
  });

  it('shows no chips when received equals expected and cost is unchanged', () => {
    const { queryByText } = render(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '3', unitCost: '216' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByText(/shortageChip/)).toBeNull();
    expect(queryByText(/costUpChip/)).toBeNull();
    expect(queryByText(/costDownChip/)).toBeNull();
  });

  it('shows no chips and does not crash on a blank or invalid line', () => {
    const { queryByText } = render(
      <DeliveryLineRow
        form={{ ...base, receivedQty: '', unitCost: '' }}
        onChange={jest.fn()}
        onRemove={jest.fn()}
      />,
    );
    expect(queryByText(/shortageChip/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/components/DeliveryLineRow.test.tsx`
Expected: FAIL (component not found).

- [ ] **Step 3: Implement `DeliveryLineRow`**

`components/receiving/DeliveryLineRow.tsx` computes chips with the pure lib and never throws on bad input:

```tsx
import { useMemo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { costChange, convertDeliveryLine } from '@/lib/deliveryReceipt';
import { formatPesos } from '@/lib/money';
import type { DraftLineForm } from '@/lib/deliveryForm';

interface Props {
  form: DraftLineForm;
  onChange: (next: DraftLineForm) => void;
  onRemove: () => void;
}

const toInt = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

export function DeliveryLineRow({ form, onChange, onRemove }: Props) {
  const { t } = useTranslation('receiving');

  const chips = useMemo(() => {
    const expected =
      form.expectedQty.trim() === '' ? 0 : toInt(form.expectedQty);
    const received = toInt(form.receivedQty);
    const cost = toInt(form.unitCost);
    if (expected === null || received === null || cost === null) return null;
    try {
      const c = convertDeliveryLine({
        enteredUnit: form.enteredUnit,
        enteredExpectedQty: expected,
        enteredReceivedQty: received,
        enteredUnitCost: cost,
        conversionFactor: form.conversionFactor,
      });
      return {
        shortage: c.shortageQty,
        change: costChange(c.actualUnitCost, form.lastCostPrice),
      };
    } catch {
      return null;
    }
  }, [form]);

  const canUseWholesale =
    form.wholesaleUnitName !== null && (form.conversionFactor ?? 0) >= 2;
  const unitLabel =
    form.enteredUnit === 'wholesale'
      ? (form.wholesaleUnitName ?? t('unitWholesale'))
      : form.retailUnitName;

  const set = (patch: Partial<DraftLineForm>) =>
    onChange({ ...form, ...patch });

  return (
    <View className="mb-3 rounded-2xl border border-paper-300 bg-white p-3">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold" numberOfLines={1}>
          {form.productName}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove line"
          onPress={onRemove}
        >
          <Text className="px-2 text-lg">x</Text>
        </Pressable>
      </View>

      {canUseWholesale ? (
        <View className="mt-2 flex-row gap-2">
          {(['wholesale', 'retail'] as const).map((unit) => (
            <Pressable
              key={unit}
              accessibilityRole="button"
              onPress={() => set({ enteredUnit: unit })}
              className={`rounded-full border px-3 py-1 ${form.enteredUnit === unit ? 'border-ink bg-ink' : 'border-paper-300'}`}
            >
              <Text className={form.enteredUnit === unit ? 'text-white' : ''}>
                {unit === 'wholesale'
                  ? (form.wholesaleUnitName ?? t('unitWholesale'))
                  : form.retailUnitName}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="mt-2 flex-row gap-2">
        <LabeledInput
          label={`${t('expected')} (${unitLabel})`}
          value={form.expectedQty}
          onChangeText={(v) => set({ expectedQty: v.replace(/[^\d]/g, '') })}
        />
        <LabeledInput
          label={`${t('received')} (${unitLabel})`}
          value={form.receivedQty}
          onChangeText={(v) => set({ receivedQty: v.replace(/[^\d]/g, '') })}
        />
        <LabeledInput
          label={`${t('unitCost')} / ${unitLabel}`}
          value={form.unitCost}
          onChangeText={(v) => set({ unitCost: v.replace(/[^\d]/g, '') })}
        />
      </View>

      {chips ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {chips.shortage > 0 ? (
            <Text className="rounded-full bg-red-100 px-2 py-0.5 text-xs">
              {t('shortageChip', { count: chips.shortage })}
            </Text>
          ) : null}
          {chips.change !== null && chips.change > 0 ? (
            <Text className="rounded-full bg-amber-100 px-2 py-0.5 text-xs">
              {t('costUpChip', { amount: formatPesos(chips.change) })}
            </Text>
          ) : null}
          {chips.change !== null && chips.change < 0 ? (
            <Text className="rounded-full bg-green-100 px-2 py-0.5 text-xs">
              {t('costDownChip', {
                amount: formatPesos(Math.abs(chips.change)),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-xs">{props.label}</Text>
      <TextInput
        className="rounded-lg border border-paper-300 px-2 py-1"
        keyboardType="number-pad"
        value={props.value}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}
```

Replace the placeholder-looking class names (`border-paper-300`, `bg-ink`, `bg-white`) with the project's real tokens copied from `app/(edit-forms)/add-supplier/index.tsx`. Keep the chip logic and the `try/catch` untouched.

- [ ] **Step 4: Run the component test**

Run: `pnpm jest tests/components/DeliveryLineRow.test.tsx`
Expected: PASS (4 tests). The pure-chip test strings come from the mocked `t`.

- [ ] **Step 5: Implement `QuickAddProductSheet` and `ProductPickerSheet`**

`QuickAddProductSheet`: a `Modal` with three inputs (name, price in whole pesos via `parsePesosInput` then `Math.round`, optional barcode). Submit is disabled while the name is blank. On submit call `onSubmit({ name: name.trim(), price, barcode: barcode.trim() || null })` then `onClose()`. Price blank means 0 is NOT allowed; require a number greater than 0.

`ProductPickerSheet`: a `Modal` with a debounced (250 ms) search field and a barcode scan button. Use `usePaginatedProducts` for search results and `useBarcodeResolver` for scan (read their signatures first). On pick, build a `DraftLineForm` from the product row: `productId`, `productName`, `retailUnitName` (`retail_unit_name`), `wholesaleUnitName` (`wholesale_unit_name`), `conversionFactor` (`conversion_factor`), `lastCostPrice` (`cost_price`), `enteredUnit` = `'wholesale'` when the product has a wholesale unit and `conversion_factor >= 2`, else `'retail'`, `expectedQty: ''`, `receivedQty: ''`, `unitCost` = String of the matching cost (`wholesale_cost_price` for wholesale, else `cost_price`, else `''`), `key: newLineKey()`. Include a "New product" row that closes the picker and opens `QuickAddProductSheet`.

- [ ] **Step 6: Implement the editor screen `app/(edit-forms)/delivery-receipt/[id].tsx`**

Behavior (follow the spec's editor flow):

- `useLocalSearchParams<{ id: string }>()`. `id === 'new'` means no receipt yet; a numeric id loads `useDeliveryReceipt(id)` and maps `detail.lines` back to `DraftLineForm[]` (use `enteredUnit`, `enteredExpectedQty`, `enteredReceivedQty`, `enteredUnitCost` as strings; read product unit data from the product row for `retailUnitName`, `wholesaleUnitName`, `conversionFactor`, `lastCostPrice`).
- Supplier picker (disabled once a draft exists). When a supplier is chosen on a new receipt, call `useOpenDraftForSupplier`; if it returns an id, `router.replace('/(edit-forms)/delivery-receipt/<id>')` and toast `t('errorDraftExists')`.
- Header: invoice number input, optional photo via `expo-image-picker` (`launchImageLibraryAsync`, store `assets[0].uri` only), note input.
- "Fill from reorder plan" button shown only when `usePalengkeRestockPlan({ supplierId }).data?.items.length` is greater than 0; on press, `seedLinesFromPlan(plan.items)` replaces blank lines (append, never overwrite lines the owner already typed).
- Lines list with `DeliveryLineRow`, "Add product" opening `ProductPickerSheet`, quick-add lines display with a "New" label.
- "Save draft" calls `useSaveDeliveryDraft` with `{ receiptId?, supplierId, invoiceNo, invoicePhotoUri, note, lines: forms.map(toLineInput) }` (omit `receiptId` when `new`; with `exactOptionalPropertyTypes` build the object conditionally). Wrap `toLineInput` in try/catch and toast the message. After the first save, `router.replace` to the numeric id.
- "Review" step (a section or modal) is allowed only when every line `isLineComplete`; otherwise show `t('reviewIncomplete')`. It lists total cost (`sum(receivedQty * perPieceCost)` via `convertDeliveryLine`), total shortage value, and every line whose `costChange` is non-null and non-zero. Its Commit button saves the draft first, then calls `useCommitDeliveryReceipt().mutateAsync(receiptId)`, then toasts success and `router.replace('/(edit-forms)/delivery-receipts')`. Disable the button while the mutation is pending (double-tap guard on top of the DB guard).
- Map named errors to toasts: `ReceiptEmptyError` to `errorEmpty`, `ReceiptNotDraftError` to `errorNotDraft`, `QuickAddBarcodeExistsError` to `errorBarcodeExists`, `InvalidDeliveryLineError` to its own message.
- For a committed receipt show read-only lines and a "Void delivery" button. Pressing it asks for a reason, then `runWithPinGuard({ title: t('voidPinTitle'), actionDescription: 'Void delivery receipt #<id>', onApproved: async () => { await voidMutation.mutateAsync({ receiptId, reason }) } })`. Map `VoidWouldGoNegativeError` to `errorVoidTooLow` and list the product names from `error.shortfalls`.
- For a draft show "Discard draft" calling `useDiscardDeliveryDraft`.

- [ ] **Step 7: Implement the list and report screens**

`app/(edit-forms)/delivery-receipts/index.tsx`: three tabs (Drafts, Received, Voided) using `useDeliveryReceipts({ status })`, a row per receipt (supplier name, invoice no, date, line count, `formatPesos(totalCost)`, shortage chip when `shortageQty > 0`) navigating to `/(edit-forms)/delivery-receipt/<id>`, a "Receive delivery" button navigating to `/(edit-forms)/delivery-receipt/new`, and a header link "Shortages by supplier" to `/reports/supplier-shortages`. Empty states use `emptyDrafts`, `emptyCommitted`, `emptyVoided`.

`app/reports/supplier-shortages.tsx`: `useDeliveryShortageReport()` with a 30 / 90 / all-time range selector (compute `since` ISO strings). Row per supplier: name, `formatPesos(shortageValue)`, `shortLines / lines`, rate as a percent. Tapping a supplier expands `useSupplierShortageLines(supplierId, range)` rows (invoice, product, expected, received, short). Empty state `reportEmpty`.

`app/(tabs)/inventory/recommendations.tsx`: add a "Receive delivery" button (label `t('newDelivery')`, namespace `receiving`) that routes to `/(edit-forms)/delivery-receipts`. Read the file first and place it next to the existing header actions.

- [ ] **Step 8: Typecheck and run everything**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 9: Manual smoke on a device or emulator (document results in the PR)**

1. Receive a delivery with one wholesale line (3 boxes), one retail line, and one new product. Confirm stock and cost on Products.
2. Short one line, commit, open Shortages by supplier, confirm the supplier ranks and the line shows.
3. Double-tap Commit. Confirm stock is added once.
4. Void the receipt with PIN. Confirm stock returns and the receipt moves to Voided.
5. Sell some of a received product, then try void. Confirm the refusal names the product.
6. Check Movements: restock and void rows show the receipt note.
7. Restock sub-tab suggestions update after a delivery.

- [ ] **Step 10: Commit**

```bash
git add components/receiving app/\(edit-forms\)/delivery-receipts app/\(edit-forms\)/delivery-receipt app/reports/supplier-shortages.tsx app/\(tabs\)/inventory/recommendations.tsx tests/components/DeliveryLineRow.test.tsx
git commit -m "feat(receiving): delivery list, editor, quick-add, and shortage report screens"
```

---

### Task 10: Reconcile docs and vault

**Files:**

- Modify: `docs/superpowers/specs/2026-11-09-supplier-delivery-receiving-design.md`
- Modify: `obsidian-vault/02-Features/08-supplier-delivery-receiving.md`
- Modify: `obsidian-vault/01-Roadmap/current-implemented-feature-inventory.md` (row 8)

- [ ] **Step 1: Update the spec**

Edit the spec so it matches what was built: `supplier_id` TEXT; migration v23; remove the `tests/sqlite/single-handle.test.ts` bullet and say tests live in `tests/` and `tests/database/`; "Fill from reorder plan" seeds from `getPalengkeRestockPlan({ supplierId })`; the list is a stack route `app/(edit-forms)/delivery-receipts/index.tsx`, not a fifth sub-tab; shortage value uses `COALESCE(expected_unit_cost, actual_unit_cost)`; add `ReceiptNotCommittedError`; set `Status: implemented`.

- [ ] **Step 2: Update the vault**

In `obsidian-vault/02-Features/08-supplier-delivery-receiving.md` change the "Design Decisions" section to "Implemented" with the same corrections and links to the changed code files (`database/deliveries.ts`, `hooks/useDeliveryReceipts.ts`, `app/(edit-forms)/delivery-receipt/[id].tsx`). In `current-implemented-feature-inventory.md` change row 8 from Partial to Done with a one-line summary. No emojis, no credentials, do not touch `.obsidian/`.

- [ ] **Step 3: Final verification**

Run: `pnpm verify`
Expected: typecheck and the full test suite pass.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-11-09-supplier-delivery-receiving-design.md obsidian-vault/02-Features/08-supplier-delivery-receiving.md obsidian-vault/01-Roadmap/current-implemented-feature-inventory.md
git commit -m "docs(receiving): reconcile spec and vault with implementation"
```

---

## Self-Review (done by the plan author)

1. **Spec coverage.** Tables and `receipt_id`: Task 1. Extraction: Task 2. Unit conversion and rounding: Task 3. Draft rules including one draft per supplier and quick-add validation: Task 4. Commit, quick-add creation, rollback, zero-received, double commit: Task 5. PIN-gated void with stock guard: Task 6 (DB) and Task 9 (PIN in UI). Shortage report and drill-down: Task 7. Hooks, invalidation, i18n: Task 8. Screens, plan seeding, cost-change chip, review step, Feature 9 entry: Task 9. Spec and vault updates: Task 10. Release gate "reorder suggestions stay correct" is covered by `stockIntelligenceKeys` invalidation in Task 8 and smoke step 7 in Task 9.
2. **Placeholders.** None in DB, lib, hook, locale, or test code. Task 9 screens are specified by behavior plus the reusable component code; the implementer must read the named reference files for visual tokens. This is the one place the plan leans on the codebase's UI conventions instead of inlining every class name.
3. **Type consistency.** `DraftLineForm`, `DeliveryLineInput`, `SaveDeliveryDraftInput`, `convertDeliveryLine`, `costChange`, error class names, and `commitDeliveryReceipt` / `voidDeliveryReceipt` / `getDeliveryShortageReport` / `getSupplierShortageLines` signatures match across Tasks 3 to 9.
4. **Review Focus.** All five lines map to tests: wholesale-without-unit (Tasks 3, 4), duplicate-product lines (Tasks 5, 6), over-delivery (Tasks 3, 5), quick-add barcode clash (Task 4), double commit and void-after-sale (Tasks 5, 6).
