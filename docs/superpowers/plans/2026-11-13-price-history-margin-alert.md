# Price History and Margin Alert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record every retail cost and selling-price change per product, and flag products whose cost rose while the price stayed the same, with a suggested price the owner confirms.

**Architecture:** Two new SQLite tables (`product_price_changes`, `reprice_flags`) written by application code inside the caller's transaction. A pure `lib/repricing.ts` does the math, `database/priceHistory.ts` owns the SQL, `hooks/usePriceHistory.ts` exposes it to screens. Two existing write paths (`applyInventoryTransaction`, `updateProduct`) call into the new module.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript strict, `expo-sqlite`, TanStack Query v5, react-i18next, NativeWind v4, Jest 29 with a `better-sqlite3` in-memory mock.

**Spec:** `docs/superpowers/specs/2026-11-13-price-history-margin-alert-design.md`

## Global Constraints

- Work on `main`. Do not create a branch. Do not push.
- Offline-first. Local SQLite is the source of truth. No network calls.
- Strict flow: `app/` -> `hooks/` -> `database/` -> SQLite. Screens and components never import from `database/`.
- One SQLite handle, imported from `configs/sqlite.ts` (in `database/` files: `import { db } from '../configs/sqlite';`).
- Multi-statement writes use `db.withTransactionAsync`.
- Money parse and format go through `lib/money.ts` (`parsePesosInput`, `formatPesos`).
- The app never changes a selling price on its own. The owner confirms every price.
- Retail unit only. Do not track `wholesale_price` or `wholesale_cost_price`.
- Cost decreases are recorded in history and never raise an alert.
- Voiding a delivery does not roll back cost, history, or flags.
- No backfill of history before migration 24.
- No new owner PIN gate.
- TypeScript strict flags are on, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. Code must pass `pnpm typecheck`.
- No emojis in code, comments, or locale strings. New filenames kebab-case for Markdown, existing conventions for code.
- Every user-visible string goes through i18n, in both `locales/en` and `locales/tl`, with identical keys.
- Commands: `pnpm test -- <path>` runs one test file, `pnpm typecheck` runs `tsc --noEmit`, `pnpm verify` runs both.

## Deviations From the Spec

Found while reading the code. Task 12 writes these back into the spec.

1. **Source value `restock` added.** `applyInventoryTransaction` is also called by the manual restock sheet, with no receipt. Those changes get `source = 'restock'`. Delivery commits (which pass `receipt_id`) keep `source = 'delivery'`.
2. **Needs-repricing screen lives at `app/settings/reprice.tsx`**, not `app/(edit-forms)/reprice/index.tsx`. Every More-tab destination is under `app/settings/` and uses `MoreDetailHeader`.
3. **Price history shows on the product details screen** (`app/(edit-forms)/product-details/[id].tsx`, Overview tab), not on the edit form. The details screen is where product history already lives.
4. **A manual edit that clears cost to empty** writes no cost history row (`new_value` is NOT NULL) and removes any flag.
5. **The More-tab row strings live in the `common` namespace**, matching every other More row. All other strings use the new `pricing` namespace.

## Review Focus

1. A suggested price computed from values with floating-point noise (for example cost 0.1 to 0.3 at price 10) must not round up one peso too far. Expected: 30, not 31.
2. A product whose cost rises twice before the owner acts must keep the original baseline cost and price, so the suggestion still restores the original markup.
3. A manual restock with a higher cost and no delivery receipt must still flag the product, and that flag must appear in the needs-repricing list but in no delivery review sheet.
4. Voiding a delivery after it raised a cost must leave the flag in place and usable. Dismissing it afterward must work.
5. Deleting a flagged product must succeed and must remove its flag and history rows.

---

## File Structure

| File                                                 | Action | Responsibility                             |
| ---------------------------------------------------- | ------ | ------------------------------------------ |
| `lib/repricing.ts`                                   | Create | Pure math: suggested price, markup percent |
| `types/pricing.types.ts`                             | Create | Shared types for history rows and flags    |
| `database/migrations.ts`                             | Modify | Migration 24                               |
| `database/priceHistory.ts`                           | Create | All SQL for history and flags              |
| `database/inventory.ts`                              | Modify | Log cost change on restock                 |
| `database/products.ts`                               | Modify | Log cost and price change on manual edit   |
| `hooks/usePriceHistory.ts`                           | Create | Queries and mutations for screens          |
| `hooks/useProducts.ts`                               | Modify | Invalidate price-history queries           |
| `hooks/index.ts`                                     | Modify | Re-export new hook                         |
| `lib/i18n.ts`                                        | Modify | Register `pricing` namespace               |
| `locales/en/pricing.json`, `locales/tl/pricing.json` | Create | Feature strings                            |
| `locales/en/common.json`, `locales/tl/common.json`   | Modify | More-tab row strings                       |
| `components/pricing/RepriceRow.tsx`                  | Create | One flagged product with actions           |
| `components/pricing/RepriceReviewSheet.tsx`          | Create | Sheet shown after delivery commit          |
| `components/pricing/PriceHistoryCard.tsx`            | Create | Last 10 changes for one product            |
| `components/pricing/index.ts`                        | Create | Barrel                                     |
| `app/settings/reprice.tsx`                           | Create | Needs-repricing list screen                |
| `components/more/moreNavigation.ts`                  | Modify | New route                                  |
| `components/more/MoreDestinationRow.tsx`             | Modify | Optional count badge                       |
| `components/more/MoreHomeScreen.tsx`                 | Modify | New row                                    |
| `app/(edit-forms)/delivery-receipt/[id].tsx`         | Modify | Open review sheet after commit             |
| `app/(edit-forms)/product-details/[id].tsx`          | Modify | Render history card                        |
| `tests/__setup__/expo-sqlite-mock.ts`                | Modify | Reset new tables                           |

---

### Task 1: Repricing math

**Files:**

- Create: `lib/repricing.ts`
- Test: `tests/lib/repricing.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `suggestPrice(baselineCost: number, newCost: number, priceAtFlag: number): number | null`
  - `markupPercent(cost: number | null | undefined, price: number): number | null`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/repricing.test.ts`:

```ts
import { markupPercent, suggestPrice } from '@/lib/repricing';

describe('suggestPrice', () => {
  it('keeps the same markup percent and rounds up to a whole peso', () => {
    // 13 on cost 10 is a 30% markup. 12 * 1.3 = 15.6, rounded up to 16.
    expect(suggestPrice(10, 12, 13)).toBe(16);
  });

  it('returns an exact whole number unchanged', () => {
    expect(suggestPrice(10, 20, 15)).toBe(30);
  });

  it('review focus: floating-point noise does not push the price up a peso', () => {
    // 0.3 * 10 / 0.1 evaluates to 30.000000000000004 in IEEE-754.
    expect(suggestPrice(0.1, 0.3, 10)).toBe(30);
  });

  it('returns null when the baseline cost is zero or negative', () => {
    expect(suggestPrice(0, 12, 13)).toBeNull();
    expect(suggestPrice(-5, 12, 13)).toBeNull();
  });

  it('returns null when the price at flag is zero or negative', () => {
    expect(suggestPrice(10, 12, 0)).toBeNull();
  });

  it('returns null for non-finite input', () => {
    expect(suggestPrice(10, Number.NaN, 13)).toBeNull();
    expect(suggestPrice(10, Number.POSITIVE_INFINITY, 13)).toBeNull();
  });
});

describe('markupPercent', () => {
  it('returns markup over cost with one decimal', () => {
    expect(markupPercent(10, 13)).toBe(30);
    expect(markupPercent(12, 13)).toBe(8.3);
  });

  it('returns a negative markup when selling below cost', () => {
    expect(markupPercent(20, 15)).toBe(-25);
  });

  it('returns null when cost is missing, zero, or negative', () => {
    expect(markupPercent(null, 13)).toBeNull();
    expect(markupPercent(undefined, 13)).toBeNull();
    expect(markupPercent(0, 13)).toBeNull();
    expect(markupPercent(-1, 13)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/repricing.test.ts`
Expected: FAIL with "Cannot find module '@/lib/repricing'".

- [ ] **Step 3: Write the implementation**

Create `lib/repricing.ts`:

```ts
/**
 * Price that keeps the markup percent the owner last accepted, rounded up to
 * a whole peso. Returns null when no meaningful suggestion exists.
 */
export function suggestPrice(
  baselineCost: number,
  newCost: number,
  priceAtFlag: number,
): number | null {
  if (
    !Number.isFinite(baselineCost) ||
    !Number.isFinite(newCost) ||
    !Number.isFinite(priceAtFlag)
  ) {
    return null;
  }
  if (baselineCost <= 0 || priceAtFlag <= 0) return null;
  const raw = (newCost * priceAtFlag) / baselineCost;
  // Round to centavos first so float noise such as 30.000000000000004 does
  // not get rounded up to the next peso.
  return Math.ceil(Math.round(raw * 100) / 100);
}

/** Markup over cost, in percent, with one decimal. Null when cost is unusable. */
export function markupPercent(
  cost: number | null | undefined,
  price: number,
): number | null {
  if (cost == null || !Number.isFinite(cost) || cost <= 0) return null;
  if (!Number.isFinite(price)) return null;
  return Math.round(((price - cost) / cost) * 1000) / 10;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/lib/repricing.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/repricing.ts tests/lib/repricing.test.ts
git commit -m "feat(pricing): add suggested price and markup math"
```

---

### Task 2: Migration 24 and shared types

**Files:**

- Create: `types/pricing.types.ts`
- Modify: `database/migrations.ts` (append after the `currentVersion < 23` block, before the closing brace of `runMigrations`)
- Modify: `tests/__setup__/expo-sqlite-mock.ts` (the `tables` array in `resetMockDb`)
- Test: `tests/database/price-history-migration.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - Tables `product_price_changes` and `reprice_flags` at `user_version = 24`.
  - Types `PriceField`, `PriceChangeSource`, `PriceChange`, `RepriceFlag` from `@/types/pricing.types`.

- [ ] **Step 1: Write the failing test**

Create `tests/database/price-history-migration.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

describe('migration v24: price history and reprice flags', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('sets user_version to at least 24', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(24);
  });

  it('creates product_price_changes with the expected columns', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(product_price_changes)',
    );
    expect(cols.map((c) => c.name).sort()).toEqual(
      [
        'created_at',
        'field',
        'id',
        'new_value',
        'old_value',
        'product_id',
        'receipt_id',
        'source',
      ].sort(),
    );
  });

  it('creates reprice_flags with the expected columns', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(reprice_flags)',
    );
    expect(cols.map((c) => c.name).sort()).toEqual(
      [
        'baseline_cost',
        'created_at',
        'new_cost',
        'price_at_flag',
        'product_id',
        'receipt_id',
      ].sort(),
    );
  });

  it('rejects an unknown field and an unknown source', async () => {
    const p = await seedProduct({ name: 'A', sku: 'M-A', cost: 10 });
    await expect(
      db.runAsync(
        "INSERT INTO product_price_changes (product_id, field, old_value, new_value, source, created_at) VALUES (?, 'bogus', 1, 2, 'delivery', 'x')",
        [p],
      ),
    ).rejects.toThrow();
    await expect(
      db.runAsync(
        "INSERT INTO product_price_changes (product_id, field, old_value, new_value, source, created_at) VALUES (?, 'cost', 1, 2, 'bogus', 'x')",
        [p],
      ),
    ).rejects.toThrow();
  });

  it('allows only one flag per product', async () => {
    const p = await seedProduct({ name: 'B', sku: 'M-B', cost: 10 });
    const insert = () =>
      db.runAsync(
        "INSERT INTO reprice_flags (product_id, baseline_cost, new_cost, price_at_flag, created_at) VALUES (?, 10, 12, 13, 'x')",
        [p],
      );
    await insert();
    await expect(insert()).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/database/price-history-migration.test.ts`
Expected: FAIL. `user_version` is 23 and `PRAGMA table_info` returns no columns.

- [ ] **Step 3: Add the migration**

In `database/migrations.ts`, directly after this existing block:

```ts
      await db.execAsync('PRAGMA user_version = 23;');
    });
    console.log('Database migrated to v23.');
  }
```

add:

```ts
if (currentVersion < 24) {
  console.log('Running migration to v24 (Price history and reprice flags)...');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS product_price_changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL
            REFERENCES products(id) ON DELETE CASCADE,
          field TEXT NOT NULL CHECK(field IN ('cost', 'price')),
          old_value INTEGER,
          new_value INTEGER NOT NULL,
          source TEXT NOT NULL
            CHECK(source IN ('delivery', 'restock', 'manual_edit', 'reprice')),
          receipt_id INTEGER,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_price_changes_product
          ON product_price_changes(product_id, created_at DESC, id DESC);

        CREATE TABLE IF NOT EXISTS reprice_flags (
          product_id INTEGER PRIMARY KEY
            REFERENCES products(id) ON DELETE CASCADE,
          baseline_cost INTEGER NOT NULL,
          new_cost INTEGER NOT NULL,
          price_at_flag INTEGER NOT NULL,
          receipt_id INTEGER,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reprice_flags_receipt
          ON reprice_flags(receipt_id);
      `);

    await db.execAsync('PRAGMA user_version = 24;');
  });
  console.log('Database migrated to v24.');
}
```

- [ ] **Step 4: Reset the new tables between tests**

In `tests/__setup__/expo-sqlite-mock.ts`, inside `resetMockDb`, change the start of the `tables` array from:

```ts
  const tables = [
    'sqlite_sequence',
    'delivery_receipt_lines',
```

to:

```ts
  const tables = [
    'sqlite_sequence',
    'reprice_flags',
    'product_price_changes',
    'delivery_receipt_lines',
```

- [ ] **Step 5: Add the shared types**

Create `types/pricing.types.ts`:

```ts
export type PriceField = 'cost' | 'price';

export type PriceChangeSource =
  'delivery' | 'restock' | 'manual_edit' | 'reprice';

export interface PriceChange {
  id: number;
  productId: number;
  field: PriceField;
  /** Null when the product had no previous value. */
  oldValue: number | null;
  newValue: number;
  source: PriceChangeSource;
  receiptId: number | null;
  createdAt: string;
}

export interface RepriceFlag {
  productId: number;
  productName: string;
  /** Cost in effect when the current selling price was last accepted. */
  baselineCost: number;
  newCost: number;
  /** Selling price when the flag was created. */
  priceAtFlag: number;
  currentPrice: number;
  receiptId: number | null;
  createdAt: string;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- tests/database/price-history-migration.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Confirm no other migration test regressed**

Run: `pnpm test -- tests/database/delivery-migration.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add database/migrations.ts types/pricing.types.ts tests/__setup__/expo-sqlite-mock.ts tests/database/price-history-migration.test.ts
git commit -m "feat(pricing): add migration 24 for price history and reprice flags"
```

---

### Task 3: Price history database module

**Files:**

- Create: `database/priceHistory.ts`
- Test: `tests/database/price-history.test.ts`

**Interfaces:**

- Consumes: tables from Task 2; types from `@/types/pricing.types`.
- Produces (all exported from `@/database/priceHistory`):
  - `recordPriceChange(productId: number, field: PriceField, oldValue: number | null, newValue: number, source: PriceChangeSource, receiptId?: number | null): Promise<boolean>` returns true when a row was written. Does not open a transaction.
  - `evaluateRepriceFlag(productId: number, oldCost: number | null, newCost: number, currentPrice: number, receiptId?: number | null): Promise<void>`. Does not open a transaction.
  - `clearRepriceFlag(productId: number): Promise<void>`. Does not open a transaction.
  - `getRepriceFlags(): Promise<RepriceFlag[]>`
  - `getRepriceFlagsForReceipt(receiptId: number): Promise<RepriceFlag[]>`
  - `getPriceHistory(productId: number, limit?: number): Promise<PriceChange[]>` default limit 10, newest first.
  - `dismissRepriceFlag(productId: number): Promise<void>`
  - `applyReprice(productId: number, newPrice: number): Promise<void>` opens its own transaction.
  - `class InvalidRepriceError extends Error`

- [ ] **Step 1: Write the failing test**

Create `tests/database/price-history.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  InvalidRepriceError,
  applyReprice,
  clearRepriceFlag,
  dismissRepriceFlag,
  evaluateRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
  recordPriceChange,
} from '@/database/priceHistory';
import { deleteProduct } from '@/database/products';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

const priceOf = async (productId: number): Promise<number> => {
  const row = await db.getFirstAsync<{ price: number }>(
    'SELECT price FROM products WHERE id = ?',
    [productId],
  );
  if (!row) throw new Error(`product ${productId} missing`);
  return row.price;
};

const countRows = async (table: string, productId: number): Promise<number> => {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${table} WHERE product_id = ?`,
    [productId],
  );
  return row?.n ?? 0;
};

describe('priceHistory', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  describe('recordPriceChange', () => {
    it('writes a row when the value changes', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A', cost: 10 });
      const wrote = await recordPriceChange(p, 'cost', 10, 12, 'delivery', 7);
      expect(wrote).toBe(true);
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        productId: p,
        field: 'cost',
        oldValue: 10,
        newValue: 12,
        source: 'delivery',
        receiptId: 7,
      });
    });

    it('writes nothing when the value is unchanged', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A2', cost: 10 });
      const wrote = await recordPriceChange(p, 'cost', 10, 10, 'delivery');
      expect(wrote).toBe(false);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('records a first value with a null old value', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A3' });
      await recordPriceChange(p, 'cost', null, 10, 'manual_edit');
      const history = await getPriceHistory(p);
      expect(history[0]?.oldValue).toBeNull();
      expect(history[0]?.receiptId).toBeNull();
    });
  });

  describe('getPriceHistory', () => {
    it('returns newest first and respects the limit', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A4', cost: 1 });
      for (let i = 1; i <= 12; i += 1) {
        await recordPriceChange(p, 'cost', i, i + 1, 'restock');
      }
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(10);
      expect(history[0]?.newValue).toBe(13);
      expect(await getPriceHistory(p, 3)).toHaveLength(3);
    });
  });

  describe('evaluateRepriceFlag', () => {
    it('does not flag the first recorded cost', async () => {
      const p = await seedProduct({ name: 'A', sku: 'F-A', price: 13 });
      await evaluateRepriceFlag(p, null, 10, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });

    it('flags a cost rise with the baseline cost and current price', async () => {
      const p = await seedProduct({
        name: 'Soda',
        sku: 'F-B',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13, 5);
      const flags = await getRepriceFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0]).toMatchObject({
        productId: p,
        productName: 'Soda',
        baselineCost: 10,
        newCost: 12,
        priceAtFlag: 13,
        currentPrice: 13,
        receiptId: 5,
      });
    });

    it('does not flag an unchanged or lower cost', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 10, 13);
      await evaluateRepriceFlag(p, 10, 8, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });

    it('review focus: a second rise keeps the baseline cost and price at flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-D',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13, 5);
      await evaluateRepriceFlag(p, 12, 15, 13, 6);
      const flags = await getRepriceFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0]).toMatchObject({
        baselineCost: 10,
        newCost: 15,
        priceAtFlag: 13,
        receiptId: 6,
      });
    });

    it('updates new cost when cost falls but stays above the baseline', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-E',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 15, 13);
      await evaluateRepriceFlag(p, 15, 11, 13);
      const flags = await getRepriceFlags();
      expect(flags[0]).toMatchObject({ baselineCost: 10, newCost: 11 });
    });

    it('clears the flag when cost falls back to the baseline or lower', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-F',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await evaluateRepriceFlag(p, 12, 10, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });
  });

  describe('getRepriceFlagsForReceipt', () => {
    it('returns only the flags last touched by that receipt', async () => {
      const a = await seedProduct({
        name: 'A',
        sku: 'R-A',
        cost: 10,
        price: 13,
      });
      const b = await seedProduct({
        name: 'B',
        sku: 'R-B',
        cost: 10,
        price: 13,
      });
      const c = await seedProduct({
        name: 'C',
        sku: 'R-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(a, 10, 12, 13, 5);
      await evaluateRepriceFlag(b, 10, 12, 13, 6);
      await evaluateRepriceFlag(c, 10, 12, 13, null);
      const forFive = await getRepriceFlagsForReceipt(5);
      expect(forFive.map((f) => f.productId)).toEqual([a]);
      expect(await getRepriceFlags()).toHaveLength(3);
    });
  });

  describe('dismissRepriceFlag', () => {
    it('removes the flag and leaves the price unchanged', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'D-A',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await dismissRepriceFlag(p);
      expect(await getRepriceFlags()).toEqual([]);
      expect(await priceOf(p)).toBe(13);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('is a no-op when there is no flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'D-B',
        cost: 10,
        price: 13,
      });
      await expect(dismissRepriceFlag(p)).resolves.toBeUndefined();
      await expect(clearRepriceFlag(p)).resolves.toBeUndefined();
    });
  });

  describe('applyReprice', () => {
    it('updates the price, writes history, and clears the flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-A',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await applyReprice(p, 16);
      expect(await priceOf(p)).toBe(16);
      expect(await getRepriceFlags()).toEqual([]);
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        field: 'price',
        oldValue: 13,
        newValue: 16,
        source: 'reprice',
      });
    });

    it('clears the flag and writes no history when the price is unchanged', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-B',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await applyReprice(p, 13);
      expect(await getRepriceFlags()).toEqual([]);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('allows a price below the new cost', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 20, 13);
      await applyReprice(p, 15);
      expect(await priceOf(p)).toBe(15);
    });

    it('rejects zero, negative, and non-finite prices and changes nothing', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-D',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        await expect(applyReprice(p, bad)).rejects.toBeInstanceOf(
          InvalidRepriceError,
        );
      }
      expect(await priceOf(p)).toBe(13);
      expect(await getRepriceFlags()).toHaveLength(1);
    });

    it('rejects an unknown product', async () => {
      await expect(applyReprice(999999, 10)).rejects.toThrow(
        'Product with ID 999999 not found',
      );
    });
  });

  describe('product deletion', () => {
    it('review focus: deleting a flagged product removes its flag and history', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'X-A',
        cost: 10,
        price: 13,
      });
      await recordPriceChange(p, 'cost', 10, 12, 'delivery');
      await evaluateRepriceFlag(p, 10, 12, 13);
      await deleteProduct(p);
      expect(await countRows('reprice_flags', p)).toBe(0);
      expect(await countRows('product_price_changes', p)).toBe(0);
      expect(await getRepriceFlags()).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/database/price-history.test.ts`
Expected: FAIL with "Cannot find module '@/database/priceHistory'".

- [ ] **Step 3: Write the implementation**

Create `database/priceHistory.ts`:

```ts
import type {
  PriceChange,
  PriceChangeSource,
  PriceField,
  RepriceFlag,
} from '@/types/pricing.types';
import { db } from '../configs/sqlite';

export class InvalidRepriceError extends Error {
  constructor(public readonly price: number) {
    super('Price must be a number greater than zero');
    this.name = 'InvalidRepriceError';
  }
}

/**
 * Appends one history row when the value changed. Does NOT open a
 * transaction: callers run this inside their own db.withTransactionAsync so
 * history commits or rolls back with the product update.
 */
export const recordPriceChange = async (
  productId: number,
  field: PriceField,
  oldValue: number | null,
  newValue: number,
  source: PriceChangeSource,
  receiptId: number | null = null,
): Promise<boolean> => {
  if (oldValue === newValue) return false;
  await db.runAsync(
    `INSERT INTO product_price_changes
       (product_id, field, old_value, new_value, source, receipt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      field,
      oldValue,
      newValue,
      source,
      receiptId,
      new Date().toISOString(),
    ],
  );
  return true;
};

/** Removes a flag if present. Does NOT open a transaction. */
export const clearRepriceFlag = async (productId: number): Promise<void> => {
  await db.runAsync('DELETE FROM reprice_flags WHERE product_id = ?', [
    productId,
  ]);
};

/**
 * Applies the flag rules after a cost change. Call only when the cost
 * actually changed. Does NOT open a transaction.
 *
 * - No flag yet: flag only when there was a previous cost and it rose.
 * - Flag exists, cost still above the baseline: keep the baseline cost and
 *   price, track the latest cost.
 * - Flag exists, cost back at or under the baseline: remove the flag.
 */
export const evaluateRepriceFlag = async (
  productId: number,
  oldCost: number | null,
  newCost: number,
  currentPrice: number,
  receiptId: number | null = null,
): Promise<void> => {
  const existing = await db.getFirstAsync<{ baseline_cost: number }>(
    'SELECT baseline_cost FROM reprice_flags WHERE product_id = ?',
    [productId],
  );

  if (existing) {
    if (newCost > existing.baseline_cost) {
      await db.runAsync(
        'UPDATE reprice_flags SET new_cost = ?, receipt_id = ? WHERE product_id = ?',
        [newCost, receiptId, productId],
      );
    } else {
      await clearRepriceFlag(productId);
    }
    return;
  }

  if (oldCost === null || newCost <= oldCost) return;

  await db.runAsync(
    `INSERT INTO reprice_flags
       (product_id, baseline_cost, new_cost, price_at_flag, receipt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      productId,
      oldCost,
      newCost,
      currentPrice,
      receiptId,
      new Date().toISOString(),
    ],
  );
};

interface FlagRow {
  product_id: number;
  product_name: string;
  baseline_cost: number;
  new_cost: number;
  price_at_flag: number;
  current_price: number;
  receipt_id: number | null;
  created_at: string;
}

const FLAG_SELECT = `
  SELECT f.product_id, p.name AS product_name, f.baseline_cost, f.new_cost,
         f.price_at_flag, p.price AS current_price, f.receipt_id, f.created_at
  FROM reprice_flags f
  JOIN products p ON p.id = f.product_id`;

const mapFlag = (r: FlagRow): RepriceFlag => ({
  productId: r.product_id,
  productName: r.product_name,
  baselineCost: r.baseline_cost,
  newCost: r.new_cost,
  priceAtFlag: r.price_at_flag,
  currentPrice: r.current_price,
  receiptId: r.receipt_id,
  createdAt: r.created_at,
});

export const getRepriceFlags = async (): Promise<RepriceFlag[]> => {
  const rows = await db.getAllAsync<FlagRow>(
    `${FLAG_SELECT} ORDER BY f.created_at DESC, f.product_id DESC`,
  );
  return rows.map(mapFlag);
};

export const getRepriceFlagsForReceipt = async (
  receiptId: number,
): Promise<RepriceFlag[]> => {
  const rows = await db.getAllAsync<FlagRow>(
    `${FLAG_SELECT} WHERE f.receipt_id = ? ORDER BY p.name COLLATE NOCASE, f.product_id`,
    [receiptId],
  );
  return rows.map(mapFlag);
};

interface ChangeRow {
  id: number;
  product_id: number;
  field: PriceField;
  old_value: number | null;
  new_value: number;
  source: PriceChangeSource;
  receipt_id: number | null;
  created_at: string;
}

export const getPriceHistory = async (
  productId: number,
  limit: number = 10,
): Promise<PriceChange[]> => {
  const rows = await db.getAllAsync<ChangeRow>(
    `SELECT id, product_id, field, old_value, new_value, source, receipt_id, created_at
     FROM product_price_changes
     WHERE product_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [productId, Math.max(1, Math.floor(limit))],
  );
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    field: r.field,
    oldValue: r.old_value,
    newValue: r.new_value,
    source: r.source,
    receiptId: r.receipt_id,
    createdAt: r.created_at,
  }));
};

/** "Keep price": the owner accepts the current price at the new cost. */
export const dismissRepriceFlag = async (productId: number): Promise<void> => {
  await clearRepriceFlag(productId);
};

/**
 * Sets a new selling price chosen by the owner, records it, and clears the
 * flag, in one transaction. A price below cost is allowed: the owner decides.
 */
export const applyReprice = async (
  productId: number,
  newPrice: number,
): Promise<void> => {
  if (!Number.isFinite(newPrice) || newPrice <= 0) {
    throw new InvalidRepriceError(newPrice);
  }
  await db.withTransactionAsync(async () => {
    const product = await db.getFirstAsync<{ price: number }>(
      'SELECT price FROM products WHERE id = ?',
      [productId],
    );
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    await db.runAsync(
      'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPrice, productId],
    );
    await recordPriceChange(
      productId,
      'price',
      product.price,
      newPrice,
      'reprice',
    );
    await clearRepriceFlag(productId);
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/database/price-history.test.ts`
Expected: PASS, 19 tests.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add database/priceHistory.ts tests/database/price-history.test.ts
git commit -m "feat(pricing): add price history and reprice flag data access"
```

---

### Task 4: Log cost changes on restock and delivery commit

**Files:**

- Modify: `database/inventory.ts` (`applyInventoryTransaction`, lines 57-108)
- Test: `tests/database/price-history-restock.test.ts`

**Interfaces:**

- Consumes: `recordPriceChange`, `evaluateRepriceFlag` from `@/database/priceHistory` (Task 3).
- Produces: every `restock` with a `unit_cost` now writes cost history and evaluates the flag in the caller's transaction. Source is `'delivery'` when `receipt_id` is set, `'restock'` otherwise.

- [ ] **Step 1: Write the failing test**

Create `tests/database/price-history-restock.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  commitDeliveryReceipt,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { insertInventoryTransaction } from '@/database/inventory';
import {
  dismissRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
} from '@/database/priceHistory';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';

const retail = (
  productId: number,
  qty: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: qty,
  enteredReceivedQty: qty,
  enteredUnitCost: cost,
});

const totalRows = async (table: string): Promise<number> => {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${table}`,
  );
  return row?.n ?? 0;
};

describe('cost history on restock', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('delivery commit logs a cost rise and flags the product for that receipt', async () => {
    const sup = await seedSupplier('ph-1');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-A',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });

    await commitDeliveryReceipt(id);

    const history = await getPriceHistory(a);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: 10,
      newValue: 12,
      source: 'delivery',
      receiptId: id,
    });
    const flags = await getRepriceFlagsForReceipt(id);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      productId: a,
      baselineCost: 10,
      newCost: 12,
      priceAtFlag: 13,
    });
  });

  it('delivery commit with an unchanged cost logs nothing', async () => {
    const sup = await seedSupplier('ph-2');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-B',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 10)],
    });
    await commitDeliveryReceipt(id);
    expect(await getPriceHistory(a)).toEqual([]);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('delivery commit with a lower cost logs history and does not flag', async () => {
    const sup = await seedSupplier('ph-3');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-C',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 8)],
    });
    await commitDeliveryReceipt(id);
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({ oldValue: 10, newValue: 8 });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a product with no previous cost logs a first cost and is not flagged', async () => {
    const sup = await seedSupplier('ph-4');
    const a = await seedProduct({ name: 'A', sku: 'PH-D', price: 13 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 9)],
    });
    await commitDeliveryReceipt(id);
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({ oldValue: null, newValue: 9 });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a failed commit leaves no history rows and no flags', async () => {
    const sup = await seedSupplier('ph-5');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-E',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    // Force a failure after the stock, history, and flag writes: the status
    // flip is the last statement of the commit transaction.
    await db.execAsync(`
      CREATE TRIGGER fail_commit BEFORE UPDATE OF status ON delivery_receipts
      BEGIN SELECT RAISE(ABORT, 'forced failure'); END;
    `);
    try {
      await expect(commitDeliveryReceipt(id)).rejects.toThrow('forced failure');
    } finally {
      await db.execAsync('DROP TRIGGER fail_commit;');
    }
    expect(await totalRows('product_price_changes')).toBe(0);
    expect(await totalRows('reprice_flags')).toBe(0);
  });

  it('review focus: a manual restock with no receipt flags with source restock', async () => {
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-F',
      cost: 10,
      price: 13,
    });
    await insertInventoryTransaction({
      product_id: a,
      type: 'restock',
      quantity: 3,
      unit_cost: 14,
    });
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({
      source: 'restock',
      receiptId: null,
      newValue: 14,
    });
    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]?.receiptId).toBeNull();
    expect(await getRepriceFlagsForReceipt(1)).toEqual([]);
  });

  it('a restock with no unit cost logs nothing', async () => {
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-G',
      cost: 10,
      price: 13,
    });
    await insertInventoryTransaction({
      product_id: a,
      type: 'restock',
      quantity: 3,
    });
    expect(await getPriceHistory(a)).toEqual([]);
  });

  it('review focus: two deliveries raising the cost keep the first baseline', async () => {
    const sup = await seedSupplier('ph-6');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-H',
      cost: 10,
      price: 13,
    });
    const first = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    await commitDeliveryReceipt(first);
    const second = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 15)],
    });
    await commitDeliveryReceipt(second);

    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      baselineCost: 10,
      newCost: 15,
      priceAtFlag: 13,
      receiptId: second,
    });
    expect(await getRepriceFlagsForReceipt(first)).toEqual([]);
  });

  it('review focus: voiding the delivery keeps the flag, and dismiss still works', async () => {
    const sup = await seedSupplier('ph-7');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-I',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    await commitDeliveryReceipt(id);
    await voidDeliveryReceipt(id, 'wrong supplier');

    expect(await getRepriceFlags()).toHaveLength(1);
    await dismissRepriceFlag(a);
    expect(await getRepriceFlags()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/database/price-history-restock.test.ts`
Expected: FAIL. History and flag assertions find empty arrays.

- [ ] **Step 3: Change `applyInventoryTransaction`**

In `database/inventory.ts`, add the import under the existing imports:

```ts
import { evaluateRepriceFlag, recordPriceChange } from './priceHistory';
```

Replace this block:

```ts
// 1. Check product existence and current quantity
const product = await db.getFirstAsync<{ quantity: number }>(
  'SELECT quantity FROM products WHERE id = ?',
  [product_id],
);
```

with:

```ts
// 1. Check product existence, current quantity, and current pricing
const product = await db.getFirstAsync<{
  quantity: number;
  cost_price: number | null;
  price: number;
}>('SELECT quantity, cost_price, price FROM products WHERE id = ?', [
  product_id,
]);
```

Replace this block:

```ts
  // 4. Update products table
  if (type === 'restock' && unit_cost !== null && unit_cost !== undefined) {
    await db.runAsync(
      'UPDATE products SET quantity = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, unit_cost, product_id],
    );
  } else {
```

with:

```ts
  // 4. Update products table
  if (type === 'restock' && unit_cost !== null && unit_cost !== undefined) {
    await db.runAsync(
      'UPDATE products SET quantity = ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, unit_cost, product_id],
    );
    // Runs in the caller's transaction, so cost history and the reprice flag
    // commit or roll back together with the stock change.
    const oldCost = product.cost_price ?? null;
    if (oldCost !== unit_cost) {
      await recordPriceChange(
        product_id,
        'cost',
        oldCost,
        unit_cost,
        receipt_id !== null ? 'delivery' : 'restock',
        receipt_id,
      );
      await evaluateRepriceFlag(
        product_id,
        oldCost,
        unit_cost,
        product.price,
        receipt_id,
      );
    }
  } else {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/database/price-history-restock.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Run the existing inventory and delivery suites**

Run: `pnpm test -- tests/applyInventoryTransaction.test.ts tests/database`
Expected: PASS for every file. No existing assertion changes.

- [ ] **Step 6: Commit**

```bash
git add database/inventory.ts tests/database/price-history-restock.test.ts
git commit -m "feat(pricing): log cost changes and flag products on restock"
```

---

### Task 5: Log cost and price changes on manual product edit

**Files:**

- Modify: `database/products.ts` (`updateProduct`, the `current` lookup and the lines after the `UPDATE products SET` statement)
- Test: `tests/database/price-history-product-edit.test.ts`

**Interfaces:**

- Consumes: `recordPriceChange`, `evaluateRepriceFlag`, `clearRepriceFlag` from `@/database/priceHistory` (Task 3).
- Produces: `updateProduct` writes `manual_edit` history rows for cost and price changes. A price change removes the flag. A cost rise with an unchanged price creates or updates the flag. Clearing cost to empty removes the flag and writes no cost row.

- [ ] **Step 1: Write the failing test**

Create `tests/database/price-history-product-edit.test.ts`:

```ts
import { getPriceHistory, getRepriceFlags } from '@/database/priceHistory';
import { updateProduct } from '@/database/products';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

// updateProduct(id, name, sku, price, quantity, cost_price?)
const edit = (
  id: number,
  sku: string,
  price: number,
  cost: number | undefined,
) => updateProduct(id, 'Item', sku, price, 0, cost);

describe('price history on manual product edit', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('logs nothing when neither cost nor price changes', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-A',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-A', 13, 10);
    expect(await getPriceHistory(p)).toEqual([]);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('logs a price change with source manual_edit', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-B',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-B', 15, 10);
    const history = await getPriceHistory(p);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'price',
      oldValue: 13,
      newValue: 15,
      source: 'manual_edit',
      receiptId: null,
    });
  });

  it('a cost rise with an unchanged price logs cost and flags the product', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-C',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-C', 13, 12);
    const history = await getPriceHistory(p);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: 10,
      newValue: 12,
      source: 'manual_edit',
    });
    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      baselineCost: 10,
      newCost: 12,
      priceAtFlag: 13,
      receiptId: null,
    });
  });

  it('changing cost and price together logs both and leaves no flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-D',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-D', 16, 12);
    const fields = (await getPriceHistory(p)).map((h) => h.field).sort();
    expect(fields).toEqual(['cost', 'price']);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a price edit removes an existing flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-E',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-E', 13, 12);
    expect(await getRepriceFlags()).toHaveLength(1);
    await edit(p, 'E-E', 16, 12);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('lowering the cost back to the baseline removes the flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-F',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-F', 13, 12);
    await edit(p, 'E-F', 13, 10);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a first cost on a product with none logs and does not flag', async () => {
    const p = await seedProduct({ name: 'Item', sku: 'E-G', price: 13 });
    await edit(p, 'E-G', 13, 9);
    const history = await getPriceHistory(p);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: null,
      newValue: 9,
    });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('clearing the cost removes the flag and writes no cost row', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-H',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-H', 13, 12);
    const before = (await getPriceHistory(p)).length;
    await edit(p, 'E-H', 13, undefined);
    expect(await getRepriceFlags()).toEqual([]);
    expect(await getPriceHistory(p)).toHaveLength(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/database/price-history-product-edit.test.ts`
Expected: FAIL. History and flag assertions find empty arrays.

- [ ] **Step 3: Change `updateProduct`**

In `database/products.ts`, add to the imports at the top of the file:

```ts
import {
  clearRepriceFlag,
  evaluateRepriceFlag,
  recordPriceChange,
} from './priceHistory';
```

Inside `updateProduct`, replace:

```ts
const current = await db.getFirstAsync<{ quantity: number }>(
  'SELECT quantity FROM products WHERE id = ?',
  [id],
);
```

with:

```ts
const current = await db.getFirstAsync<{
  quantity: number;
  cost_price: number | null;
  price: number;
}>('SELECT quantity, cost_price, price FROM products WHERE id = ?', [id]);
```

Then, directly before this existing line inside `updateProduct`:

```ts
      if (current && current.quantity !== quantity) {
```

insert:

```ts
if (current) {
  const oldCost = current.cost_price ?? null;
  const newCost = cost_price ?? null;
  const priceChanged = current.price !== price;

  if (priceChanged) {
    await recordPriceChange(id, 'price', current.price, price, 'manual_edit');
  }
  if (newCost !== null && newCost !== oldCost) {
    await recordPriceChange(id, 'cost', oldCost, newCost, 'manual_edit');
    // A price change in the same edit means the owner already repriced.
    if (!priceChanged) {
      await evaluateRepriceFlag(id, oldCost, newCost, price);
    }
  }
  if (priceChanged || newCost === null) {
    await clearRepriceFlag(id);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/database/price-history-product-edit.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the existing product suite**

Run: `pnpm test -- tests/productsCrud.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add database/products.ts tests/database/price-history-product-edit.test.ts
git commit -m "feat(pricing): log cost and price changes on manual product edit"
```

---

### Task 6: Localization

**Files:**

- Create: `locales/en/pricing.json`, `locales/tl/pricing.json`
- Modify: `lib/i18n.ts`
- Modify: `locales/en/common.json`, `locales/tl/common.json`
- Test: `tests/pricingLocales.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: i18n namespace `pricing` with the keys below, and four `common` keys: `moreHomeRepriceLabel`, `moreHomeRepriceSub`, `moreHomeRepriceSubCount`, `moreHomeRepriceHint`.

- [ ] **Step 1: Write the failing test**

Create `tests/pricingLocales.test.ts`:

```ts
import enCommon from '../locales/en/common.json';
import en from '../locales/en/pricing.json';
import tlCommon from '../locales/tl/common.json';
import tl from '../locales/tl/pricing.json';

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

describe('pricing locales', () => {
  it('en and tl have identical keys', () => {
    expect(flatten(tl).sort()).toEqual(flatten(en).sort());
  });

  it('has no empty strings', () => {
    for (const bundle of [en, tl]) {
      for (const key of flatten(bundle)) {
        const value = (bundle as Record<string, unknown>)[key];
        expect(
          `${key}:${typeof value === 'string' && value.trim().length > 0}`,
        ).toBe(`${key}:true`);
      }
    }
  });

  it('has a label for every price change source', () => {
    for (const bundle of [en, tl]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'sourceDelivery',
        'sourceRestock',
        'sourceManualEdit',
        'sourceReprice',
      ]) {
        expect(`${key}:${typeof record[key]}`).toBe(`${key}:string`);
      }
    }
  });

  it('has the More-tab row strings in both common bundles', () => {
    for (const bundle of [enCommon, tlCommon]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'moreHomeRepriceLabel',
        'moreHomeRepriceSub',
        'moreHomeRepriceSubCount',
        'moreHomeRepriceHint',
      ]) {
        expect(`${key}:${typeof record[key]}`).toBe(`${key}:string`);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/pricingLocales.test.ts`
Expected: FAIL with "Cannot find module '../locales/en/pricing.json'".

- [ ] **Step 3: Create the English bundle**

Create `locales/en/pricing.json`:

```json
{
  "title": "Needs repricing",
  "subtitle": "Cost went up, price stayed the same",
  "back": "Back",
  "emptyTitle": "Nothing to reprice",
  "emptyBody": "Items show up here when a cost goes up and the selling price stays the same.",
  "loadError": "Could not load the list. Pull down to try again.",
  "costLine": "Cost {{from}} to {{to}}",
  "markupLine": "Markup {{from}}% to {{to}}%",
  "markupUnknown": "Markup not available",
  "currentPrice": "Current price {{price}}",
  "newPriceLabel": "New price",
  "suggestedHint": "Suggested {{price}} keeps your markup",
  "noSuggestion": "No suggestion available. Type a price.",
  "updatePrice": "Update price",
  "keepPrice": "Keep price",
  "later": "Later",
  "lossWarning": "This price is below your cost. You will sell at a loss.",
  "invalidPrice": "Enter a price above zero.",
  "sheetTitle": "Costs went up",
  "sheetSubtitle": "Items in this delivery that now cost more: {{count}}",
  "updatedToast": "Price updated",
  "keptToast": "Price kept",
  "errorToast": "Could not save. Try again.",
  "historyTitle": "Price history",
  "historyCost": "Cost",
  "historyPrice": "Selling price",
  "historyFirst": "Set to {{to}}",
  "historyChange": "{{from}} to {{to}}",
  "sourceDelivery": "Delivery",
  "sourceRestock": "Restock",
  "sourceManualEdit": "Edited",
  "sourceReprice": "Repriced"
}
```

- [ ] **Step 4: Create the Tagalog bundle**

Create `locales/tl/pricing.json`:

```json
{
  "title": "Kailangang i-reprice",
  "subtitle": "Tumaas ang puhunan, hindi nabago ang presyo",
  "back": "Bumalik",
  "emptyTitle": "Walang kailangang i-reprice",
  "emptyBody": "Lalabas dito ang paninda kapag tumaas ang puhunan at hindi nabago ang presyo ng benta.",
  "loadError": "Hindi ma-load ang listahan. Hilahin pababa para subukan ulit.",
  "costLine": "Puhunan {{from}} naging {{to}}",
  "markupLine": "Patong {{from}}% naging {{to}}%",
  "markupUnknown": "Walang makuhang patong",
  "currentPrice": "Kasalukuyang presyo {{price}}",
  "newPriceLabel": "Bagong presyo",
  "suggestedHint": "Mungkahi {{price}} para manatili ang patong mo",
  "noSuggestion": "Walang mungkahi. I-type ang presyo.",
  "updatePrice": "I-update ang presyo",
  "keepPrice": "Panatilihin ang presyo",
  "later": "Mamaya na",
  "lossWarning": "Mas mababa ang presyong ito sa puhunan mo. Malulugi ka sa benta.",
  "invalidPrice": "Maglagay ng presyong higit sa zero.",
  "sheetTitle": "Tumaas ang puhunan",
  "sheetSubtitle": "Mga paninda sa delivery na ito na tumaas ang puhunan: {{count}}",
  "updatedToast": "Na-update ang presyo",
  "keptToast": "Pinanatili ang presyo",
  "errorToast": "Hindi na-save. Subukan ulit.",
  "historyTitle": "Kasaysayan ng presyo",
  "historyCost": "Puhunan",
  "historyPrice": "Presyo ng benta",
  "historyFirst": "Itinakda sa {{to}}",
  "historyChange": "{{from}} naging {{to}}",
  "sourceDelivery": "Delivery",
  "sourceRestock": "Restock",
  "sourceManualEdit": "In-edit",
  "sourceReprice": "Ni-reprice"
}
```

- [ ] **Step 5: Add the More-tab strings**

In `locales/en/common.json`, directly after the line `"moreHomePalengkeHint": "Opens the palengke restock sheet",` add:

```json
  "moreHomeRepriceLabel": "Needs repricing",
  "moreHomeRepriceSub": "No items need a new price",
  "moreHomeRepriceSubCount": "Items that need a new price: {{count}}",
  "moreHomeRepriceHint": "Opens the list of items whose cost went up",
```

In `locales/tl/common.json`, directly after the line `"moreHomePalengkeHint": "Binubuksan ang palengke restock sheet",` add:

```json
  "moreHomeRepriceLabel": "Kailangang i-reprice",
  "moreHomeRepriceSub": "Walang panindang kailangan ng bagong presyo",
  "moreHomeRepriceSubCount": "Mga panindang kailangan ng bagong presyo: {{count}}",
  "moreHomeRepriceHint": "Binubuksan ang listahan ng panindang tumaas ang puhunan",
```

- [ ] **Step 6: Register the namespace**

In `lib/i18n.ts`:

After `import receivingEn from '../locales/en/receiving.json';` add:

```ts
import pricingEn from '../locales/en/pricing.json';
```

After `import receivingTl from '../locales/tl/receiving.json';` add:

```ts
import pricingTl from '../locales/tl/pricing.json';
```

In `resources.en`, after `receiving: receivingEn,` add:

```ts
    pricing: pricingEn,
```

In `resources.tl`, after `receiving: receivingTl,` add:

```ts
    pricing: pricingTl,
```

In the `ns` array, after `'receiving',` add:

```ts
    'pricing',
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test -- tests/pricingLocales.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 8: Commit**

```bash
git add locales/en/pricing.json locales/tl/pricing.json locales/en/common.json locales/tl/common.json lib/i18n.ts tests/pricingLocales.test.ts
git commit -m "feat(pricing): add pricing locale namespace in English and Tagalog"
```

---

### Task 7: Hooks

**Files:**

- Create: `hooks/usePriceHistory.ts`
- Modify: `hooks/useProducts.ts` (`invalidateProductDependencies`)
- Modify: `hooks/index.ts`
- Test: `tests/components/usePriceHistory.test.tsx`

**Interfaces:**

- Consumes: everything exported by `@/database/priceHistory` (Task 3); `invalidateProductDependencies(queryClient, productId?)` from `@/hooks/useProducts`.
- Produces (from `@/hooks/usePriceHistory`, also re-exported by `@/hooks`):
  - `priceHistoryKeys` with `all`, `flags()`, `flagsForReceipt(receiptId)`, `history(productId)`
  - `useRepriceFlags()` returns a query of `RepriceFlag[]`
  - `useRepriceFlagsForReceipt(receiptId: number | null)` returns a query of `RepriceFlag[]`, disabled when null
  - `usePriceHistory(productId: number)` returns a query of `PriceChange[]`
  - `useFetchRepriceFlagsForReceipt()` returns `(receiptId: number) => Promise<RepriceFlag[]>`
  - `useApplyReprice()` mutation with variables `{ productId: number; newPrice: number }`
  - `useDismissRepriceFlag()` mutation with variable `productId: number`
  - Re-exports `InvalidRepriceError` and the types `RepriceFlag`, `PriceChange`

- [ ] **Step 1: Write the failing test**

Create `tests/components/usePriceHistory.test.tsx`:

```tsx
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockApplyReprice = jest.fn(async () => undefined);
const mockDismiss = jest.fn(async () => undefined);
const mockFlagsForReceipt = jest.fn(async () => [{ productId: 1 }]);
const mockInvalidateProducts = jest.fn();

jest.mock('@/database/priceHistory', () => ({
  InvalidRepriceError: class InvalidRepriceError extends Error {},
  applyReprice: (...args: unknown[]) => mockApplyReprice(...(args as [])),
  dismissRepriceFlag: (...args: unknown[]) => mockDismiss(...(args as [])),
  getPriceHistory: jest.fn(async () => []),
  getRepriceFlags: jest.fn(async () => []),
  getRepriceFlagsForReceipt: (...args: unknown[]) =>
    mockFlagsForReceipt(...(args as [])),
}));
jest.mock('@/hooks/useProducts', () => ({
  invalidateProductDependencies: (...args: unknown[]) =>
    mockInvalidateProducts(...args),
}));

import {
  priceHistoryKeys,
  useApplyReprice,
  useDismissRepriceFlag,
  useFetchRepriceFlagsForReceipt,
} from '@/hooks/usePriceHistory';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// gcTime Infinity schedules no garbage-collection timers, so jest can exit.
const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

describe('usePriceHistory mutations', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = newClient();
    jest.clearAllMocks();
  });
  afterEach(() => {
    client.clear();
  });

  it('applyReprice passes the price through and invalidates flags and products', async () => {
    client.setQueryData(priceHistoryKeys.flags(), [{ productId: 3 }]);
    const { result } = await renderHook(() => useApplyReprice(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ productId: 3, newPrice: 16 });
    });
    expect(mockApplyReprice).toHaveBeenCalledWith(3, 16);
    expect(client.getQueryState(priceHistoryKeys.flags())?.isInvalidated).toBe(
      true,
    );
    expect(mockInvalidateProducts).toHaveBeenCalledWith(client, 3);
  });

  it('dismiss invalidates flags and leaves product queries alone', async () => {
    client.setQueryData(priceHistoryKeys.flags(), [{ productId: 3 }]);
    const { result } = await renderHook(() => useDismissRepriceFlag(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync(3);
    });
    expect(mockDismiss).toHaveBeenCalledWith(3);
    expect(client.getQueryState(priceHistoryKeys.flags())?.isInvalidated).toBe(
      true,
    );
    expect(mockInvalidateProducts).not.toHaveBeenCalled();
  });

  it('fetchRepriceFlagsForReceipt always reads fresh data', async () => {
    client.setQueryData(priceHistoryKeys.flagsForReceipt(9), []);
    const { result } = await renderHook(
      () => useFetchRepriceFlagsForReceipt(),
      {
        wrapper: wrapper(client),
      },
    );
    let flags: unknown;
    await act(async () => {
      flags = await result.current(9);
    });
    expect(mockFlagsForReceipt).toHaveBeenCalledWith(9);
    expect(flags).toEqual([{ productId: 1 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/usePriceHistory.test.tsx`
Expected: FAIL with "Cannot find module '@/hooks/usePriceHistory'".

- [ ] **Step 3: Write the hooks**

Create `hooks/usePriceHistory.ts`:

```ts
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyReprice,
  dismissRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
} from '@/database/priceHistory';
import { invalidateProductDependencies } from '@/hooks/useProducts';
import type { RepriceFlag } from '@/types/pricing.types';

// Screens never import database/, so the named error and row types are
// re-exported from here.
export { InvalidRepriceError } from '@/database/priceHistory';
export type { PriceChange, RepriceFlag } from '@/types/pricing.types';

export const priceHistoryKeys = {
  all: ['price-history'] as const,
  flags: () => [...priceHistoryKeys.all, 'flags'] as const,
  flagsForReceipt: (receiptId: number) =>
    [...priceHistoryKeys.flags(), 'receipt', receiptId] as const,
  history: (productId: number) =>
    [...priceHistoryKeys.all, 'history', productId] as const,
};

export function useRepriceFlags() {
  return useQuery({
    queryKey: priceHistoryKeys.flags(),
    queryFn: () => getRepriceFlags(),
  });
}

export function useRepriceFlagsForReceipt(receiptId: number | null) {
  return useQuery({
    queryKey: priceHistoryKeys.flagsForReceipt(receiptId ?? -1),
    queryFn: () => getRepriceFlagsForReceipt(receiptId as number),
    enabled: receiptId !== null,
  });
}

export function usePriceHistory(productId: number) {
  return useQuery({
    queryKey: priceHistoryKeys.history(productId),
    queryFn: () => getPriceHistory(productId),
    enabled: Number.isFinite(productId),
  });
}

/**
 * One-shot read used right after a delivery commit, before any component is
 * subscribed to that receipt's flags. staleTime 0 forces a fresh read.
 */
export function useFetchRepriceFlagsForReceipt() {
  const queryClient = useQueryClient();
  return useCallback(
    (receiptId: number): Promise<RepriceFlag[]> =>
      queryClient.fetchQuery({
        queryKey: priceHistoryKeys.flagsForReceipt(receiptId),
        queryFn: () => getRepriceFlagsForReceipt(receiptId),
        staleTime: 0,
      }),
    [queryClient],
  );
}

export function useApplyReprice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { productId: number; newPrice: number }) =>
      applyReprice(v.productId, v.newPrice),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: priceHistoryKeys.all });
      invalidateProductDependencies(queryClient, variables.productId);
    },
  });
}

export function useDismissRepriceFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => dismissRepriceFlag(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceHistoryKeys.all });
    },
  });
}
```

- [ ] **Step 4: Invalidate price-history queries on every product change**

`invalidateProductDependencies` already runs after delivery commit, delivery void, product insert, product update, and product delete. Adding the key there covers all of them. A literal key avoids a circular import between `useProducts` and `usePriceHistory`, and matches the other literal keys in that function.

In `hooks/useProducts.ts`, inside `invalidateProductDependencies`, directly before this existing block:

```ts
  queryClient.invalidateQueries({
    queryKey: ['sales-stats'],
```

insert:

```ts
// Reprice flags and price history change whenever cost or price changes.
queryClient.invalidateQueries({
  queryKey: ['price-history'],
});
```

- [ ] **Step 5: Re-export from the hooks barrel**

In `hooks/index.ts`, after `export * from './useDigitalServices';` add:

```ts
export * from './usePriceHistory';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- tests/components/usePriceHistory.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 7: Run the suites that touch the changed hook**

Run: `pnpm test -- tests/productsCrud.test.ts tests/components/useDeliveryReceiptsCache.test.tsx`
Expected: PASS.

- [ ] **Step 8: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add hooks/usePriceHistory.ts hooks/useProducts.ts hooks/index.ts tests/components/usePriceHistory.test.tsx
git commit -m "feat(pricing): add price history and reprice hooks"
```

---

### Task 8: RepriceRow component

**Files:**

- Create: `components/pricing/RepriceRow.tsx`
- Create: `components/pricing/index.ts`
- Test: `tests/components/RepriceRow.test.tsx`

**Interfaces:**

- Consumes: `suggestPrice`, `markupPercent` from `@/lib/repricing` (Task 1); `RepriceFlag` from `@/types/pricing.types` (Task 2); `pricing` strings (Task 6); `parsePesosInput`, `formatPesos` from `@/lib/money`.
- Produces:

```ts
export interface RepriceRowProps {
  flag: RepriceFlag;
  busy?: boolean;
  onApply: (productId: number, newPrice: number) => void;
  onKeep: (productId: number) => void;
}
export function RepriceRow(props: RepriceRowProps): JSX.Element;
```

- [ ] **Step 1: Write the failing test**

Create `tests/components/RepriceRow.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { RepriceRow } from '@/components/pricing/RepriceRow';
import type { RepriceFlag } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const flag: RepriceFlag = {
  productId: 7,
  productName: 'Soda',
  baselineCost: 10,
  newCost: 12,
  priceAtFlag: 13,
  currentPrice: 13,
  receiptId: 4,
  createdAt: '2026-11-13T00:00:00.000Z',
};

describe('RepriceRow', () => {
  it('prefills the suggested price that keeps the markup', async () => {
    const { getByLabelText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={jest.fn()} />,
    );
    expect(getByLabelText('newPriceLabel').props.value).toBe('16');
  });

  it('shows the old and new markup', async () => {
    const { getByText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={jest.fn()} />,
    );
    expect(getByText('markupLine:{"from":30,"to":8.3}')).toBeTruthy();
  });

  it('applies the typed price for this product', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    fireEvent.changeText(getByLabelText('newPriceLabel'), '15');
    fireEvent.press(getByText('updatePrice'));
    expect(onApply).toHaveBeenCalledWith(7, 15);
  });

  it('keeps the price for this product', async () => {
    const onKeep = jest.fn();
    const { getByText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={onKeep} />,
    );
    fireEvent.press(getByText('keepPrice'));
    expect(onKeep).toHaveBeenCalledWith(7);
  });

  it('blocks update and explains when the price is empty or zero', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    fireEvent.changeText(getByLabelText('newPriceLabel'), '');
    expect(getByText('invalidPrice')).toBeTruthy();
    fireEvent.press(getByText('updatePrice'));
    fireEvent.changeText(getByLabelText('newPriceLabel'), '0');
    fireEvent.press(getByText('updatePrice'));
    expect(onApply).not.toHaveBeenCalled();
  });

  it('warns but still allows a price below the new cost', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    fireEvent.changeText(getByLabelText('newPriceLabel'), '11');
    expect(getByText('lossWarning')).toBeTruthy();
    fireEvent.press(getByText('updatePrice'));
    expect(onApply).toHaveBeenCalledWith(7, 11);
  });

  it('shows no suggestion and an empty field when the baseline cost is zero', async () => {
    const { getByLabelText, getByText } = await render(
      <RepriceRow
        flag={{ ...flag, baselineCost: 0 }}
        onApply={jest.fn()}
        onKeep={jest.fn()}
      />,
    );
    expect(getByLabelText('newPriceLabel').props.value).toBe('');
    expect(getByText('noSuggestion')).toBeTruthy();
    expect(getByText('markupUnknown')).toBeTruthy();
  });

  it('does not fire actions while busy', async () => {
    const onApply = jest.fn();
    const onKeep = jest.fn();
    const { getByText } = await render(
      <RepriceRow flag={flag} busy onApply={onApply} onKeep={onKeep} />,
    );
    fireEvent.press(getByText('updatePrice'));
    fireEvent.press(getByText('keepPrice'));
    expect(onApply).not.toHaveBeenCalled();
    expect(onKeep).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/RepriceRow.test.tsx`
Expected: FAIL with "Cannot find module '@/components/pricing/RepriceRow'".

- [ ] **Step 3: Write the component**

Create `components/pricing/RepriceRow.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos, parsePesosInput } from '@/lib/money';
import { markupPercent, suggestPrice } from '@/lib/repricing';
import type { RepriceFlag } from '@/types/pricing.types';

export interface RepriceRowProps {
  flag: RepriceFlag;
  busy?: boolean;
  onApply: (productId: number, newPrice: number) => void;
  onKeep: (productId: number) => void;
}

/** Returns the typed price, or null when it is empty, invalid, or not above zero. */
const readPrice = (text: string): number | null => {
  try {
    const value = parsePesosInput(text);
    return value > 0 ? value : null;
  } catch {
    return null;
  }
};

export function RepriceRow({
  flag,
  busy = false,
  onApply,
  onKeep,
}: RepriceRowProps) {
  const { t } = useTranslation('pricing');
  const suggestion = suggestPrice(
    flag.baselineCost,
    flag.newCost,
    flag.priceAtFlag,
  );
  const [text, setText] = useState(
    suggestion !== null ? String(suggestion) : '',
  );

  const typed = readPrice(text);
  const oldMarkup = markupPercent(flag.baselineCost, flag.priceAtFlag);
  const newMarkup = markupPercent(flag.newCost, flag.currentPrice);
  const sellsAtLoss = typed !== null && typed < flag.newCost;

  const handleApply = () => {
    if (busy || typed === null) return;
    onApply(flag.productId, typed);
  };

  const handleKeep = () => {
    if (busy) return;
    onKeep(flag.productId);
  };

  return (
    <View className="rounded-2xl border border-paper-300 bg-paper-50 p-4 gap-y-2">
      <StyledText variant="semibold" className="text-base text-ink-900">
        {flag.productName}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-600">
        {t('costLine', {
          from: formatPesos(flag.baselineCost),
          to: formatPesos(flag.newCost),
        })}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-600">
        {oldMarkup !== null && newMarkup !== null
          ? t('markupLine', { from: oldMarkup, to: newMarkup })
          : t('markupUnknown')}
      </StyledText>

      <StyledText variant="regular" className="text-sm text-ink-500">
        {t('currentPrice', { price: formatPesos(flag.currentPrice) })}
      </StyledText>

      <View className="mt-1">
        <StyledText variant="medium" className="text-sm text-ink-700 mb-1">
          {t('newPriceLabel')}
        </StyledText>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={!busy}
          keyboardType="decimal-pad"
          accessibilityLabel={t('newPriceLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
        <StyledText variant="regular" className="text-xs text-ink-500 mt-1">
          {suggestion !== null
            ? t('suggestedHint', { price: formatPesos(suggestion) })
            : t('noSuggestion')}
        </StyledText>
        {typed === null ? (
          <StyledText
            variant="medium"
            className="text-xs text-persimmon-600 mt-1"
          >
            {t('invalidPrice')}
          </StyledText>
        ) : null}
        {sellsAtLoss ? (
          <StyledText
            variant="medium"
            className="text-xs text-persimmon-600 mt-1"
          >
            {t('lossWarning')}
          </StyledText>
        ) : null}
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <Pressable
          onPress={handleKeep}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          className="flex-1 min-h-[48px] items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
        >
          <StyledText variant="semibold" className="text-sm text-ink-800">
            {t('keepPrice')}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={handleApply}
          disabled={busy || typed === null}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || typed === null }}
          className={`flex-1 min-h-[48px] items-center justify-center rounded-xl bg-persimmon-500 active:opacity-80 ${
            busy || typed === null ? 'opacity-50' : ''
          }`}
        >
          <StyledText variant="extrabold" className="text-sm text-paper-50">
            {t('updatePrice')}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
```

Create `components/pricing/index.ts`:

```ts
export * from './RepriceRow';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/RepriceRow.test.tsx`
Expected: PASS, 8 tests.

If the "blocks update" or "does not fire actions while busy" test fails because `fireEvent.press` reaches a disabled `Pressable`, the guards inside `handleApply` and `handleKeep` are what the tests rely on. Do not remove them.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/pricing/RepriceRow.tsx components/pricing/index.ts tests/components/RepriceRow.test.tsx
git commit -m "feat(pricing): add reprice row component"
```

---

### Task 9: Needs-repricing screen and More-tab entry

**Files:**

- Create: `app/settings/reprice.tsx`
- Modify: `components/more/moreNavigation.ts`
- Modify: `components/more/MoreDestinationRow.tsx`
- Modify: `components/more/MoreHomeScreen.tsx`
- Test: `tests/components/MoreDestinationRow.test.tsx`

**Interfaces:**

- Consumes: `useRepriceFlags`, `useApplyReprice`, `useDismissRepriceFlag` from `@/hooks/usePriceHistory` (Task 7); `RepriceRow` from `@/components/pricing` (Task 8); `MoreDetailHeader`, `goBackToMore` from `@/components/more`; `useToastStore` from `@/stores`.
- Produces: route `/settings/reprice` as `MORE_ROUTES.reprice`; `MoreDestinationRow` accepts optional `badgeCount?: number`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/MoreDestinationRow.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import { MoreDestinationRow } from '@/components/more/MoreDestinationRow';

const baseProps = {
  icon: 'tag' as const,
  title: 'Needs repricing',
  supportingText: 'Sub',
  onPress: jest.fn(),
  accessibilityLabel: 'Needs repricing. Sub',
};

describe('MoreDestinationRow badge', () => {
  it('shows the count when badgeCount is above zero', async () => {
    const { getByText } = await render(
      <MoreDestinationRow {...baseProps} badgeCount={3} />,
    );
    expect(getByText('3')).toBeTruthy();
  });

  it('caps the label at 99+', async () => {
    const { getByText } = await render(
      <MoreDestinationRow {...baseProps} badgeCount={250} />,
    );
    expect(getByText('99+')).toBeTruthy();
  });

  it('shows no badge when badgeCount is zero or missing', async () => {
    const zero = await render(
      <MoreDestinationRow {...baseProps} badgeCount={0} />,
    );
    expect(zero.queryByText('0')).toBeNull();
    const missing = await render(<MoreDestinationRow {...baseProps} />);
    expect(missing.queryByTestId('more-row-badge')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/MoreDestinationRow.test.tsx`
Expected: FAIL. `getByText('3')` finds nothing.

- [ ] **Step 3: Add the badge to `MoreDestinationRow`**

In `components/more/MoreDestinationRow.tsx`, change the props type from:

```ts
  accessibilityLabel: string;
  accessibilityHint?: string;
};
```

to:

```ts
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Shows a count pill before the chevron when above zero. */
  badgeCount?: number;
};
```

Change the destructuring from:

```ts
  accessibilityLabel,
  accessibilityHint,
}: MoreDestinationRowProps) {
```

to:

```ts
  accessibilityLabel,
  accessibilityHint,
  badgeCount,
}: MoreDestinationRowProps) {
```

Replace:

```tsx
<FontAwesome name="chevron-right" size={16} color="#7A7165" />
```

with:

```tsx
{
  badgeCount !== undefined && badgeCount > 0 ? (
    <View
      testID="more-row-badge"
      className="mr-3 min-w-[24px] items-center justify-center rounded-full bg-persimmon-500 px-2 py-0.5"
    >
      <StyledText variant="extrabold" className="text-xs text-paper-50">
        {badgeCount > 99 ? '99+' : String(badgeCount)}
      </StyledText>
    </View>
  ) : null;
}

<FontAwesome name="chevron-right" size={16} color="#7A7165" />;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/MoreDestinationRow.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add the route**

In `components/more/moreNavigation.ts`, after `palengke: '/settings/palengke-sheet',` add:

```ts
  reprice: '/settings/reprice',
```

and after `| typeof MORE_ROUTES.palengke` add:

```ts
  | typeof MORE_ROUTES.reprice
```

- [ ] **Step 6: Create the screen**

Create `app/settings/reprice.tsx`:

```tsx
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { RepriceRow } from '@/components/pricing';
import {
  useApplyReprice,
  useDismissRepriceFlag,
  useRepriceFlags,
} from '@/hooks/usePriceHistory';
import { useToastStore } from '@/stores';

export default function RepriceScreen() {
  const { t } = useTranslation('pricing');
  const bottomOffset = useTabBarBottomOffset();
  const addToast = useToastStore((s) => s.addToast);
  const flagsQuery = useRepriceFlags();
  const applyMutation = useApplyReprice();
  const dismissMutation = useDismissRepriceFlag();

  const flags = flagsQuery.data ?? [];
  const busy = applyMutation.isPending || dismissMutation.isPending;

  const handleApply = (productId: number, newPrice: number) => {
    applyMutation.mutate(
      { productId, newPrice },
      {
        onSuccess: () =>
          addToast({ message: t('updatedToast'), variant: 'success' }),
        onError: () =>
          addToast({ message: t('errorToast'), variant: 'danger' }),
      },
    );
  };

  const handleKeep = (productId: number) => {
    dismissMutation.mutate(productId, {
      onSuccess: () =>
        addToast({ message: t('keptToast'), variant: 'success' }),
      onError: () => addToast({ message: t('errorToast'), variant: 'danger' }),
    });
  };

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomOffset + 16,
          rowGap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={flagsQuery.isRefetching}
            onRefresh={() => {
              void flagsQuery.refetch();
            }}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        {flagsQuery.isLoading ? (
          <ActivityIndicator color="#E85A1F" />
        ) : flagsQuery.isError ? (
          <StyledText variant="regular" className="text-sm text-ink-600">
            {t('loadError')}
          </StyledText>
        ) : flags.length === 0 ? (
          <View className="items-center rounded-2xl border border-paper-300 bg-paper-50 p-6">
            <StyledText variant="extrabold" className="text-base text-ink-900">
              {t('emptyTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="mt-1 text-center text-sm text-ink-500"
            >
              {t('emptyBody')}
            </StyledText>
          </View>
        ) : (
          flags.map((flag) => (
            <RepriceRow
              key={flag.productId}
              flag={flag}
              busy={busy}
              onApply={handleApply}
              onKeep={handleKeep}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 7: Add the row to the More home screen**

In `components/more/MoreHomeScreen.tsx`:

Change:

```ts
import { useFinancialTotals, useLocalSnapshots } from '@/hooks';
```

to:

```ts
import {
  useFinancialTotals,
  useLocalSnapshots,
  useRepriceFlags,
} from '@/hooks';
```

After `const snapshots = useLocalSnapshots();` add:

```ts
const repriceFlags = useRepriceFlags();
const repriceCount = repriceFlags.data?.length ?? 0;
const repriceSupportingText =
  repriceCount > 0
    ? t('common:moreHomeRepriceSubCount', { count: repriceCount })
    : t('common:moreHomeRepriceSub');
```

Directly before the `<MoreDestinationRow` whose `icon` is `"mobile"`, add:

```tsx
<MoreDestinationRow
  icon="tag"
  title={t('common:moreHomeRepriceLabel')}
  supportingText={repriceSupportingText}
  badgeCount={repriceCount}
  onPress={() => navigate(MORE_ROUTES.reprice)}
  accessibilityLabel={`${t(
    'common:moreHomeRepriceLabel',
  )}. ${repriceSupportingText}`}
  accessibilityHint={t('common:moreHomeRepriceHint')}
/>
```

- [ ] **Step 8: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

`app.json` has `typedRoutes: true`. If the only error is that `'/settings/reprice'` is not assignable to `Href`, the generated route types are stale. Start the dev server once with `npx expo start`, wait for it to finish bundling, stop it, and run `pnpm typecheck` again.

- [ ] **Step 9: Run the full suite**

Run: `pnpm test`
Expected: PASS for every file.

- [ ] **Step 10: Commit**

```bash
git add app/settings/reprice.tsx components/more/moreNavigation.ts components/more/MoreDestinationRow.tsx components/more/MoreHomeScreen.tsx tests/components/MoreDestinationRow.test.tsx
git commit -m "feat(pricing): add needs-repricing screen and More tab entry"
```

---

### Task 10: Review sheet after delivery commit

**Files:**

- Create: `components/pricing/RepriceReviewSheet.tsx`
- Modify: `components/pricing/index.ts`
- Modify: `app/(edit-forms)/delivery-receipt/[id].tsx` (imports, state, `handleCommit`, JSX before the closing `</SafeAreaView>` of the main return)
- Test: `tests/components/RepriceReviewSheet.test.tsx`

**Interfaces:**

- Consumes: `useRepriceFlagsForReceipt`, `useFetchRepriceFlagsForReceipt`, `useApplyReprice`, `useDismissRepriceFlag` (Task 7); `RepriceRow` (Task 8); `Sheet` from `@/components/inventory/modals/_shared`.
- Produces:

```ts
export interface RepriceReviewSheetProps {
  /** Null keeps the sheet closed. */
  receiptId: number | null;
  onClose: () => void;
}
export function RepriceReviewSheet(props: RepriceReviewSheetProps): JSX.Element;
```

The sheet calls `onClose` by itself when the last flag for the receipt is handled.

- [ ] **Step 1: Write the failing test**

Create `tests/components/RepriceReviewSheet.test.tsx`:

```tsx
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { RepriceFlag } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

jest.mock('@/components/inventory/modals/_shared', () => {
  const { View } = require('react-native');
  return {
    Sheet: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: React.ReactNode;
    }) => (visible ? <View testID="sheet">{children}</View> : null),
  };
});

const mockAddToast = jest.fn();
jest.mock('@/stores', () => ({
  useToastStore: (selector: (s: { addToast: jest.Mock }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

const mockApply = jest.fn();
const mockDismiss = jest.fn();
let mockFlags: RepriceFlag[] = [];
let mockIsSuccess = true;

jest.mock('@/hooks/usePriceHistory', () => ({
  useRepriceFlagsForReceipt: () => ({
    data: mockFlags,
    isSuccess: mockIsSuccess,
  }),
  useApplyReprice: () => ({ mutate: mockApply, isPending: false }),
  useDismissRepriceFlag: () => ({ mutate: mockDismiss, isPending: false }),
}));

import { RepriceReviewSheet } from '@/components/pricing/RepriceReviewSheet';

const flag = (productId: number, productName: string): RepriceFlag => ({
  productId,
  productName,
  baselineCost: 10,
  newCost: 12,
  priceAtFlag: 13,
  currentPrice: 13,
  receiptId: 4,
  createdAt: '2026-11-13T00:00:00.000Z',
});

describe('RepriceReviewSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlags = [flag(1, 'Soda'), flag(2, 'Noodles')];
    mockIsSuccess = true;
  });

  it('stays closed when receiptId is null', async () => {
    const { queryByTestId } = await render(
      <RepriceReviewSheet receiptId={null} onClose={jest.fn()} />,
    );
    expect(queryByTestId('sheet')).toBeNull();
  });

  it('lists every flagged product with the count in the subtitle', async () => {
    const { getByText } = await render(
      <RepriceReviewSheet receiptId={4} onClose={jest.fn()} />,
    );
    expect(getByText('Soda')).toBeTruthy();
    expect(getByText('Noodles')).toBeTruthy();
    expect(getByText('sheetSubtitle:{"count":2}')).toBeTruthy();
  });

  it('Later closes without touching any flag', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <RepriceReviewSheet receiptId={4} onClose={onClose} />,
    );
    fireEvent.press(getByText('later'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('closes by itself once the last flag is handled', async () => {
    const onClose = jest.fn();
    const view = await render(
      <RepriceReviewSheet receiptId={4} onClose={onClose} />,
    );
    expect(onClose).not.toHaveBeenCalled();
    mockFlags = [];
    await view.rerender(<RepriceReviewSheet receiptId={4} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close while the first load is still pending', async () => {
    mockFlags = [];
    mockIsSuccess = false;
    const onClose = jest.fn();
    await render(<RepriceReviewSheet receiptId={4} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/RepriceReviewSheet.test.tsx`
Expected: FAIL with "Cannot find module '@/components/pricing/RepriceReviewSheet'".

- [ ] **Step 3: Write the sheet**

Create `components/pricing/RepriceReviewSheet.tsx`:

```tsx
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import {
  useApplyReprice,
  useDismissRepriceFlag,
  useRepriceFlagsForReceipt,
} from '@/hooks/usePriceHistory';
import { useToastStore } from '@/stores';
import { RepriceRow } from './RepriceRow';

export interface RepriceReviewSheetProps {
  /** Null keeps the sheet closed. */
  receiptId: number | null;
  onClose: () => void;
}

export function RepriceReviewSheet({
  receiptId,
  onClose,
}: RepriceReviewSheetProps) {
  const { t } = useTranslation('pricing');
  const addToast = useToastStore((s) => s.addToast);
  const flagsQuery = useRepriceFlagsForReceipt(receiptId);
  const applyMutation = useApplyReprice();
  const dismissMutation = useDismissRepriceFlag();

  const flags = flagsQuery.data ?? [];
  const busy = applyMutation.isPending || dismissMutation.isPending;
  const finished =
    receiptId !== null && flagsQuery.isSuccess && flags.length === 0;

  // Once every flagged item is handled there is nothing left to review.
  useEffect(() => {
    if (finished) onClose();
  }, [finished, onClose]);

  const handleApply = (productId: number, newPrice: number) => {
    applyMutation.mutate(
      { productId, newPrice },
      {
        onSuccess: () =>
          addToast({ message: t('updatedToast'), variant: 'success' }),
        onError: () =>
          addToast({ message: t('errorToast'), variant: 'danger' }),
      },
    );
  };

  const handleKeep = (productId: number) => {
    dismissMutation.mutate(productId, {
      onSuccess: () =>
        addToast({ message: t('keptToast'), variant: 'success' }),
      onError: () => addToast({ message: t('errorToast'), variant: 'danger' }),
    });
  };

  return (
    <Sheet visible={receiptId !== null && !finished} onClose={onClose}>
      <View>
        <StyledText variant="extrabold" className="text-xl text-ink-900">
          {t('sheetTitle')}
        </StyledText>
        <StyledText variant="regular" className="mt-1 text-sm text-ink-600">
          {t('sheetSubtitle', { count: flags.length })}
        </StyledText>
      </View>

      <ScrollView
        style={{ maxHeight: 420 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ rowGap: 12 }}
      >
        {flags.map((flag) => (
          <RepriceRow
            key={flag.productId}
            flag={flag}
            busy={busy}
            onApply={handleApply}
            onKeep={handleKeep}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        className="min-h-[48px] items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
      >
        <StyledText variant="semibold" className="text-sm text-ink-800">
          {t('later')}
        </StyledText>
      </Pressable>
    </Sheet>
  );
}
```

In `components/pricing/index.ts`, add:

```ts
export * from './RepriceReviewSheet';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/RepriceReviewSheet.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Wire the sheet into the delivery editor**

All edits are in `app/(edit-forms)/delivery-receipt/[id].tsx`.

After the line `import { deliveryErrorMessage } from '@/components/receiving/deliveryErrors';` add:

```ts
import { RepriceReviewSheet } from '@/components/pricing';
```

After the line `import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';` add:

```ts
import { useFetchRepriceFlagsForReceipt } from '@/hooks/usePriceHistory';
```

After the line `const discardMutation = useDiscardDeliveryDraft();` add:

```ts
const fetchRepriceFlags = useFetchRepriceFlagsForReceipt();
```

After the line `const [discardOpen, setDiscardOpen] = useState(false);` add:

```ts
// The committed receipt whose cost increases are being reviewed, if any.
const [repriceReceiptId, setRepriceReceiptId] = useState<number | null>(null);
```

In `handleCommit`, replace:

```ts
await commitMutation.mutateAsync(savedId);
addToast({ message: t('committedToast'), variant: 'success' });
router.replace(LIST_ROUTE);
```

with:

```ts
await commitMutation.mutateAsync(savedId);
addToast({ message: t('committedToast'), variant: 'success' });
// The delivery is already saved. A failed lookup must not look like a
// failed commit, so fall through to the list; the flags stay available
// on the needs-repricing screen.
let flagged = 0;
try {
  flagged = (await fetchRepriceFlags(savedId)).length;
} catch {
  flagged = 0;
}
if (flagged > 0) {
  setReviewOpen(false);
  setRepriceReceiptId(savedId);
  return;
}
router.replace(LIST_ROUTE);
```

Directly before the `<Modal` whose first prop is `visible={discardOpen}`, add:

```tsx
<RepriceReviewSheet
  receiptId={repriceReceiptId}
  onClose={() => {
    setRepriceReceiptId(null);
    router.replace(LIST_ROUTE);
  }}
/>
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Run the receiving and pricing suites**

Run: `pnpm test -- tests/components tests/deliveryForm.test.ts tests/deliveryReceiptLib.test.ts`
Expected: PASS for every file.

- [ ] **Step 8: Commit**

```bash
git add components/pricing/RepriceReviewSheet.tsx components/pricing/index.ts "app/(edit-forms)/delivery-receipt/[id].tsx" tests/components/RepriceReviewSheet.test.tsx
git commit -m "feat(pricing): review cost increases right after delivery commit"
```

---

### Task 11: Price history on product details

**Files:**

- Create: `components/pricing/PriceHistoryCard.tsx`
- Modify: `components/pricing/index.ts`
- Modify: `app/(edit-forms)/product-details/[id].tsx`
- Test: `tests/components/PriceHistoryCard.test.tsx`

**Interfaces:**

- Consumes: `usePriceHistory(productId)` (Task 7); `PriceChange` type (Task 2); `pricing` strings (Task 6).
- Produces:

```ts
export interface PriceHistoryCardProps {
  productId: number;
}
export function PriceHistoryCard(
  props: PriceHistoryCardProps,
): JSX.Element | null;
```

Renders nothing when the product has no recorded changes.

- [ ] **Step 1: Write the failing test**

Create `tests/components/PriceHistoryCard.test.tsx`:

```tsx
import { render } from '@testing-library/react-native';
import type { PriceChange } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

let mockHistory: PriceChange[] | undefined = [];
jest.mock('@/hooks/usePriceHistory', () => ({
  usePriceHistory: () => ({ data: mockHistory }),
}));

import { PriceHistoryCard } from '@/components/pricing/PriceHistoryCard';

const change = (over: Partial<PriceChange>): PriceChange => ({
  id: 1,
  productId: 7,
  field: 'cost',
  oldValue: 10,
  newValue: 12,
  source: 'delivery',
  receiptId: 4,
  createdAt: '2026-11-13T02:00:00.000Z',
  ...over,
});

describe('PriceHistoryCard', () => {
  it('renders nothing when there is no history', async () => {
    mockHistory = [];
    const { toJSON } = await render(<PriceHistoryCard productId={7} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing while history is still loading', async () => {
    mockHistory = undefined;
    const { toJSON } = await render(<PriceHistoryCard productId={7} />);
    expect(toJSON()).toBeNull();
  });

  it('shows a cost change with its source', async () => {
    mockHistory = [change({})];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText('historyTitle')).toBeTruthy();
    expect(getByText('historyCost')).toBeTruthy();
    expect(
      getByText('historyChange:{"from":"₱10.00","to":"₱12.00"}'),
    ).toBeTruthy();
    expect(getByText(/sourceDelivery/)).toBeTruthy();
  });

  it('shows a first value without an old value', async () => {
    mockHistory = [
      change({
        id: 2,
        field: 'price',
        oldValue: null,
        newValue: 15,
        source: 'manual_edit',
      }),
    ];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText('historyPrice')).toBeTruthy();
    expect(getByText('historyFirst:{"to":"₱15.00"}')).toBeTruthy();
    expect(getByText(/sourceManualEdit/)).toBeTruthy();
  });

  it('labels restock and reprice sources', async () => {
    mockHistory = [
      change({ id: 3, source: 'restock' }),
      change({ id: 4, field: 'price', source: 'reprice' }),
    ];
    const { getByText } = await render(<PriceHistoryCard productId={7} />);
    expect(getByText(/sourceRestock/)).toBeTruthy();
    expect(getByText(/sourceReprice/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/PriceHistoryCard.test.tsx`
Expected: FAIL with "Cannot find module '@/components/pricing/PriceHistoryCard'".

- [ ] **Step 3: Write the card**

Create `components/pricing/PriceHistoryCard.tsx`:

```tsx
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { formatPesos } from '@/lib/money';
import type { PriceChangeSource } from '@/types/pricing.types';

export interface PriceHistoryCardProps {
  productId: number;
}

const SOURCE_KEYS: Record<PriceChangeSource, string> = {
  delivery: 'sourceDelivery',
  restock: 'sourceRestock',
  manual_edit: 'sourceManualEdit',
  reprice: 'sourceReprice',
};

const formatDay = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
};

export function PriceHistoryCard({ productId }: PriceHistoryCardProps) {
  const { t } = useTranslation('pricing');
  const history = usePriceHistory(productId).data;

  if (!history || history.length === 0) return null;

  return (
    <View className="mx-4 mt-4 rounded-2xl border border-ink-100 bg-paper-50 p-4">
      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {t('historyTitle')}
      </StyledText>
      {history.map((change) => (
        <View
          key={change.id}
          className="mt-3 flex-row items-start justify-between"
        >
          <View className="mr-3 flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-800">
              {change.field === 'cost' ? t('historyCost') : t('historyPrice')}
            </StyledText>
            <StyledText variant="regular" className="text-sm text-ink-600">
              {change.oldValue === null
                ? t('historyFirst', { to: formatPesos(change.newValue) })
                : t('historyChange', {
                    from: formatPesos(change.oldValue),
                    to: formatPesos(change.newValue),
                  })}
            </StyledText>
          </View>
          <StyledText variant="regular" className="text-xs text-ink-500">
            {`${t(SOURCE_KEYS[change.source])} - ${formatDay(change.createdAt)}`}
          </StyledText>
        </View>
      ))}
    </View>
  );
}
```

In `components/pricing/index.ts`, add:

```ts
export * from './PriceHistoryCard';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/PriceHistoryCard.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Render the card on the product details screen**

In `app/(edit-forms)/product-details/[id].tsx`:

After the line `import { LogTransactionForm } from '@/components/inventory/ledger';` add:

```ts
import { PriceHistoryCard } from '@/components/pricing';
```

Replace:

```tsx
{
  activeTab === 'overview' && (
    <ProductOverviewTab
      product={product}
      onEdit={handleEdit}
      onRestock={handleRestock}
      onAdjust={handleAdjust}
      onDamaged={handleDamaged}
      onDelete={handleDelete}
    />
  );
}
```

with:

```tsx
{
  activeTab === 'overview' && (
    <>
      <ProductOverviewTab
        product={product}
        onEdit={handleEdit}
        onRestock={handleRestock}
        onAdjust={handleAdjust}
        onDamaged={handleDamaged}
        onDelete={handleDelete}
      />
      <PriceHistoryCard productId={product.id} />
    </>
  );
}
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/pricing/PriceHistoryCard.tsx components/pricing/index.ts "app/(edit-forms)/product-details/[id].tsx" tests/components/PriceHistoryCard.test.tsx
git commit -m "feat(pricing): show price history on product details"
```

---

### Task 12: Reconcile docs, verify, and check on device

**Files:**

- Modify: `docs/superpowers/specs/2026-11-13-price-history-margin-alert-design.md`
- Modify: `obsidian-vault/02-Features/price-history-and-margin-alert.md`
- Modify: `obsidian-vault/02-Features/features.md`
- Modify: `obsidian-vault/01-Roadmap/current-implemented-feature-inventory.md`

**Interfaces:**

- Consumes: the finished feature.
- Produces: docs that match the code. Vault write rules are in `obsidian-vault/AGENTS.md`: read the note before editing, keep folder placement, never touch `.obsidian/`, no emojis, do not push.

- [ ] **Step 1: Update the spec for the five deviations**

In `docs/superpowers/specs/2026-11-13-price-history-margin-alert-design.md`:

1. Change the status line to `- Status: implemented`.
2. In the `product_price_changes` table, change the `source` row notes to `CHECK in (\`delivery\`, \`restock\`, \`manual_edit\`, \`reprice\`)`.
3. Under "Changes to existing write paths", in the `database/inventory.ts` bullet, replace `source = 'delivery'` with: `source = 'delivery'` when the transaction carries a receipt id, `source = 'restock'` otherwise.
4. Under "Flag rules", after the sentence that begins "If a single manual edit changes both cost and price", add: `If a manual edit clears the cost to empty, no cost history row is written and any flag is removed.`
5. In "Screens", replace the needs-repricing path `app/(edit-forms)/reprice/index.tsx` with `app/settings/reprice.tsx`.
6. In "Screens", replace the "Product history" paragraph with: `A card on the Overview tab of the product details screen (\`app/(edit-forms)/product-details/[id].tsx\`) showing the last 10 cost and price changes with date and source. It is hidden when the product has no recorded changes.`
7. In "Localization", append: `The More-tab row strings live in the \`common\` namespace, matching the other More rows.`

- [ ] **Step 2: Update the vault feature note**

In `obsidian-vault/02-Features/price-history-and-margin-alert.md`:

1. In "Kasama sa Saklaw", replace the last bullet with: `- Huling 10 pagbabago ng puhunan at presyo sa Overview tab ng product details screen.`
2. In "Mga Implikasyon sa Data", add a bullet: `- Mga source ng pagbabago: \`delivery\`, \`restock\`, \`manual_edit\`, \`reprice\`.`
3. In "Mga Implikasyon sa Data", add a bullet: `- Screen: \`app/settings/reprice.tsx\`; mga component sa \`components/pricing/\`.`
4. In "Status", tick `In Development`, `Testing`, and `Completed`.

- [ ] **Step 3: Add the index line**

In `obsidian-vault/02-Features/features.md`, under the heading "Mga Bagong Karagdagang Tampok (Operational & Digital Expansions)", after the bullet that links `palengke-restock-sheet.md`, add:

```markdown
- [Kasaysayan ng Presyo at Babala sa Tubo](price-history-and-margin-alert.md) —
  talaan ng pagbabago ng puhunan at presyo, at babala na may mungkahing presyo kapag tumaas ang puhunan pero hindi nabago ang presyo ng benta.
```

- [ ] **Step 4: Add the feature to the implemented inventory**

Read `obsidian-vault/01-Roadmap/current-implemented-feature-inventory.md` first. Find the section headed `### Expenses and Owner Cash Movements`. Directly after that section's `Primary code:` line, add a new section in the same style:

```markdown
### Price History and Margin Alert

- Cost and selling-price history per product, written on delivery commit, manual restock, manual edit, and reprice.
- Reprice flag when a cost rises and the selling price is unchanged.
- Suggested price that keeps the previous markup percent, rounded up to a whole peso.
- Review sheet after delivery commit, needs-repricing list from the More tab, and a history card on product details.
- Retail unit only; wholesale cost and price are not tracked.

Primary code: `app/settings/reprice.tsx`, `components/pricing/`, `hooks/usePriceHistory.ts`, `database/priceHistory.ts`, `lib/repricing.ts`.
```

- [ ] **Step 5: Run the full verification**

Run: `pnpm verify`
Expected: `tsc --noEmit` reports no errors, and Jest reports every suite passing.

Run: `pnpm lint`
Expected: no new errors in the files this plan created or changed.

- [ ] **Step 6: Check the flow on a device or emulator**

Start the app with `npx expo start` and walk through this script. Each line states the expected result.

1. Open a product with cost 10 and price 13. The Overview tab shows no price history card.
2. Receive a delivery for that product at unit cost 12 and commit. The "Costs went up" sheet opens, lists the product, shows markup 30% to 8.3%, and prefills 16.
3. Tap "Later". The receipts list opens. The More tab row "Needs repricing" shows a badge of 1.
4. Open "Needs repricing". The product is listed. Type 11. The loss warning shows. Clear the field. "Update price" is disabled and the invalid-price message shows.
5. Type 16 and tap "Update price". A success toast shows, the list becomes empty, and the More badge is gone.
6. Open the product. The Overview tab shows a price history card with a cost change from delivery and a selling price change from reprice.
7. Receive another delivery at cost 15 and commit. In the sheet tap "Keep price". The sheet closes by itself and the receipts list opens.
8. Switch the app language to Tagalog in Settings and repeat step 2 with a new cost. All sheet text is in Tagalog.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-11-13-price-history-margin-alert-design.md docs/superpowers/plans/2026-11-13-price-history-margin-alert.md obsidian-vault/02-Features/price-history-and-margin-alert.md obsidian-vault/02-Features/features.md obsidian-vault/01-Roadmap/current-implemented-feature-inventory.md
git commit -m "docs(pricing): add price history spec, plan, and vault notes"
```
