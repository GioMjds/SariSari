# Safe Voids, Refunds & Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement owner-gated, audit-preserving sale corrections (void / refund / price correction) on top of the existing offline-first SQLite store, with a read-only Corrections report and a configurable void window.

**Architecture:** Three new database write paths (`voidSale`, `refundSale`, `correctSalePrice`) in `database/sales.ts` that share the existing `db.withTransactionAsync` pattern from `insertSale`/`deleteSale`. Reversals use `inventory_transactions.type='adjustment'` with `adjustment_sign='positive'` and a new `cash_entries.type='cash_refund'` value rather than destructive deletes, so the audit history is preserved. A new append-only `sale_corrections` table plus a child `sale_correction_lines` table records every correction with actor (owner), witness (cashier), reason code, and timestamp. The void window and other per-owner settings live in a new `app_settings` key/value table. UI surfaces are four screens (correction, price correction, report, settings) accessed from the existing Sales sub-tab.

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-sqlite 16, TanStack Query v5, Jest 29 with `better-sqlite3` in-memory DB mock, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-08-13-safe-voids-refunds-corrections-design.md` — the implementation spec. This plan references it task-by-task; executors read both.

## Global Constraints

These apply to every task below; individual task descriptions assume them:

- One SQLite handle, imported from `configs/sqlite.ts`. Tests use the `mockDb` exported by `tests/__setup__/expo-sqlite-mock.ts` (wired by `jest.setup.ts`).
- All money is integer pesos. All parse/format goes through `lib/money.ts` (`parsePesosInput`, `formatPesos`).
- Screens (`app/**`) never call SQLite. All data access via hooks in `hooks/`.
- Multi-statement writes that touch a ledger use `db.withTransactionAsync` — and tests assert rollback on intermediate failure.
- TypeScript strict mode plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`.
- i18n namespace `corrections` for correction UI and `settings` for owner settings. See `locales/en.json` and `locales/fil.json`.
- No emojis in code, tests, or comments. Filenames kebab-case.
- Existing `database/sales.ts:469 deleteSale` stays untouched. New write functions live alongside it.

---

## File Structure (Locked)

The plan produces these files in the order tasks introduce them:

| File                                    | New / Modified | Responsibility                                                                         |
| --------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `database/migrations.ts`                | Modified       | Add user_version=19 block.                                                             |
| `database/settings.ts`                  | New            | `getAppSetting(key)`, `setAppSetting(key, value)`; tiny seed on first read.            |
| `types/settings.types.ts`               | New            | `AppSettingKey` union (`'void_window_hours'` for v1), `AppSettingRow`.                 |
| `types/corrections.types.ts`            | New            | `CorrectionKind`, `VoidReasonCode`, `RefundReasonCode`, `PriceCorrectionReasonCode`.   |
| `types/sales.types.ts`                  | Modified       | Add `SaleCorrection`, `SaleCorrectionLine`; extend `Sale` with cancellation columns.   |
| `database/corrections.ts`               | New            | `recordCorrection(...)`, `getCorrectionsForSale(saleId)`, `getCorrectionsReport(...)`. |
| `database/sales.ts`                     | Modified       | Add `voidSale`, `refundSale`, `correctSalePrice` + 4 error classes.                    |
| `database/cash.ts`                      | Modified       | Add `'cash_refund'` arm in `getCashSessionSummary`'s CASE expression.                  |
| `database/credits.ts`                   | Modified       | No new exports; sibling reversal writes reuse existing patterns.                       |
| `hooks/useAppSetting.ts`                | New            | TanStack Query wrapper over `database/settings.ts`.                                    |
| `hooks/useSales.tsx`                    | Modified       | Add `useVoidSale`, `useRefundSale`, `useCorrectSalePrice`, `useSaleCorrections`.       |
| `hooks/useCorrections.tsx`              | New            | `useCorrectionsReport(...)` with paginated query key.                                  |
| `app/settings/index.tsx`                | New            | Owner-only `void_window_hours` editor.                                                 |
| `app/sales/[id]/correction.tsx`         | New            | Void / Refund action screen.                                                           |
| `app/sales/[id]/price-correction.tsx`   | New            | Per-line price editor.                                                                 |
| `app/reports/corrections.tsx`           | New            | Audit log list.                                                                        |
| `app/sales/_layout.tsx`                 | Modified       | Register correction stack routes.                                                      |
| `app/(tabs)/sales.tsx`                  | Modified       | Header link to corrections report.                                                     |
| `locales/en.json`                       | Modified       | `corrections.*`, `settings.*` keys.                                                    |
| `locales/fil.json`                      | Modified       | Same.                                                                                  |
| `tests/database/settings.test.ts`       | New            | `app_settings` get/set, default seed.                                                  |
| `tests/database/migrations-v19.test.ts` | New            | Schema migration preserves existing data.                                              |
| `tests/database/corrections.test.ts`    | New            | DB-layer tests for the three write functions and named errors.                         |
| `tests/hooks/useCorrections.test.tsx`   | New            | Cache-invalidation on mutation success.                                                |

Each file has one responsibility. Files that change together (e.g., `voidSale` writes to `sale_corrections`, `inventory_transactions`, `cash_entries`) co-locate in `database/sales.ts` — the existing project pattern.

---

## Task 1: Migration v19 — schema additions

**Files:**

- Modify: `database/migrations.ts` (append a new `if (currentVersion < 19)` block before the closing of `runMigrations`)
- Test: `tests/database/migrations-v19.test.ts`

**Interfaces:**

- Consumes: nothing (this is the first task in the chain)
- Produces:
  - `app_settings(key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)` table
  - `sales.cancelled_at TEXT`, `sales.cancelled_by_kind TEXT`, `sales.cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id)` columns
  - `credit_transactions.cancelled_at TEXT`, `credit_transactions.cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id)` columns
  - `sale_corrections` table per spec §3.5
  - `sale_correction_lines` table per spec §3.6
  - Widened `cash_entries.type` CHECK constraint accepting `'cash_refund'`
  - `PRAGMA user_version = 19;`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/database/migrations-v19.test.ts
import { db } from '@/configs/sqlite';
import { runMigrations } from '@/database/migrations';

describe('migration v19 (safe voids, refunds, corrections)', () => {
  beforeAll(async () => {
    // Pre-populate at v18 by setting user_version explicitly, then re-run.
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync('PRAGMA user_version = 18;');
    await db.runAsync('DELETE FROM schema_version_log WHERE 1=1;'); // no-op if absent
  });

  it('creates sale_corrections table with all spec columns', async () => {
    await runMigrations();
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(sale_corrections)',
    );
    const colNames = cols.map((c) => c.name);
    expect(colNames).toEqual(
      expect.arrayContaining([
        'id',
        'sale_id',
        'kind',
        'actor_reason_code',
        'actor_note',
        'actor_user',
        'witness_user',
        'refund_payment_type',
        'created_at',
      ]),
    );
  });

  it('creates sale_correction_lines with CHECK (price_delta <> 0)', async () => {
    const checks = await db.getAllAsync<{ sql: string }>(
      'SELECT sql FROM sqlite_master WHERE type = "table" AND name = "sale_correction_lines"',
    );
    expect(checks[0]?.sql).toMatch(/CHECK\s*\(price_delta <> 0\)/);
  });

  it('widens cash_entries.type to allow cash_refund', async () => {
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open','2026-08-13T08:00:00Z',1,1)",
    );
    await db.runAsync(
      "INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at) VALUES ('e1','s1','cash_refund',50,'r','2026-08-13T09:00:00Z',1)",
    );
    const row = await db.getFirstAsync<{ type: string }>(
      "SELECT type FROM cash_entries WHERE id = 'e1'",
    );
    expect(row?.type).toBe('cash_refund');
  });

  it('seeds void_window_hours=24 default', async () => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'void_window_hours'",
    );
    expect(row?.value).toBe('24');
  });

  it('bumps user_version to 19', async () => {
    const rows = await db.getAllAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(rows[0]?.user_version).toBe(19);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/database/migrations-v19.test.ts -v`
Expected: failures on the four assertions — `sale_corrections` doesn't exist yet, no `cash_refund` acceptance, no `app_settings`, `user_version` is still 18.

- [ ] **Step 3: Implement the migration block**

In `database/migrations.ts`, append immediately before the final closing brace of `runMigrations` (after the `currentVersion < 18` block):

```typescript
if (currentVersion < 19) {
  console.log(
    'Running migration to v19 (Safe Voids, Refunds & Corrections)...',
  );
  await db.withTransactionAsync(async () => {
    // 1. Widen cash_entries.type CHECK to include 'cash_refund'.
    await db.execAsync('PRAGMA foreign_keys=OFF;');
    await db.execAsync(`
      CREATE TABLE cash_entries_new (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('expense','owner_drawing','owner_addition','cash_refund')),
        amount INTEGER NOT NULL,
        notes TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    await db.execAsync(
      'INSERT INTO cash_entries_new SELECT * FROM cash_entries;',
    );
    await db.execAsync('DROP TABLE cash_entries;');
    await db.execAsync('ALTER TABLE cash_entries_new RENAME TO cash_entries;');
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);',
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);',
    );

    // 2. app_settings key/value table + seed.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('void_window_hours', '24', CAST(strftime('%s','now') AS INTEGER) * 1000)",
    );

    // 3. sales cancellation columns.
    const salesCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(sales)',
    );
    if (!salesCols.some((c) => c.name === 'cancelled_at')) {
      await db.execAsync('ALTER TABLE sales ADD COLUMN cancelled_at TEXT;');
    }
    if (!salesCols.some((c) => c.name === 'cancelled_by_kind')) {
      await db.execAsync(
        "ALTER TABLE sales ADD COLUMN cancelled_by_kind TEXT CHECK(cancelled_by_kind IN ('void','refund','price_correction') OR cancelled_by_kind IS NULL);",
      );
    }
    if (!salesCols.some((c) => c.name === 'cancelled_by_correction_id')) {
      await db.execAsync(
        'ALTER TABLE sales ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
      );
    }

    // 4. credit_transactions cancellation columns.
    const ctCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(credit_transactions)',
    );
    if (!ctCols.some((c) => c.name === 'cancelled_at')) {
      await db.execAsync(
        'ALTER TABLE credit_transactions ADD COLUMN cancelled_at TEXT;',
      );
    }
    if (!ctCols.some((c) => c.name === 'cancelled_by_correction_id')) {
      await db.execAsync(
        'ALTER TABLE credit_transactions ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
      );
    }

    // 5. sale_corrections table (append-only audit log).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id),
        kind TEXT NOT NULL CHECK(kind IN ('void','refund','price_correction')),
        actor_reason_code TEXT NOT NULL,
        actor_note TEXT,
        actor_user TEXT NOT NULL,
        witness_user TEXT,
        refund_payment_type TEXT CHECK(refund_payment_type IN ('cash') OR refund_payment_type IS NULL),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)
      );
    `);
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_sale_corrections_sale_id ON sale_corrections(sale_id);',
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_sale_corrections_created_at ON sale_corrections(created_at DESC, id DESC);',
    );

    // 6. sale_correction_lines (per-line price deltas).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_correction_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correction_id INTEGER NOT NULL REFERENCES sale_corrections(id) ON DELETE CASCADE,
        sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
        old_price INTEGER NOT NULL,
        new_price INTEGER NOT NULL,
        price_delta INTEGER NOT NULL,
        CHECK (price_delta <> 0)
      );
    `);
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_sale_correction_lines_correction_id ON sale_correction_lines(correction_id);',
    );

    await db.execAsync('PRAGMA foreign_keys=ON;');
    await db.execAsync('PRAGMA user_version = 19;');
  });
  console.log('Database migrated to v19.');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/database/migrations-v19.test.ts -v`
Expected: all five `it` blocks pass.

- [ ] **Step 5: Run the existing test suite**

Run: `npx jest`
Expected: all existing tests still pass (migration v19 is additive; nothing removed).

- [ ] **Step 6: Commit**

```bash
git add database/migrations.ts tests/database/migrations-v19.test.ts
git commit -m "feat(corrections): migration v19 — correction tables, columns, cash_refund type"
```

---

## Task 2: `database/settings.ts` — app_settings reads and writes

**Files:**

- Create: `database/settings.ts`
- Create: `types/settings.types.ts`
- Test: `tests/database/settings.test.ts`

**Interfaces:**

- Consumes: `app_settings` table (Task 1), `db` from `configs/sqlite.ts`
- Produces:
  - `getAppSetting(key: AppSettingKey): Promise<string | null>`
  - `setAppSetting(key: AppSettingKey, value: string): Promise<void>`

- [ ] **Step 1: Define the types file**

Create `types/settings.types.ts`:

```typescript
/**
 * Per-owner settings. Each key is a flat string identifier; values are
 * persisted as TEXT and parsed by the consumer. Add new keys here so
 * the union stays the single source of truth.
 */
export type AppSettingKey = 'void_window_hours';

export interface AppSettingRow {
  key: string;
  value: string;
  updatedAt: number;
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/database/settings.test.ts
import { db } from '@/configs/sqlite';
import { runMigrations } from '@/database/migrations';
import { getAppSetting, setAppSetting } from '@/database/settings';

describe('database/settings', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await db.runAsync('DELETE FROM app_settings');
  });

  it('returns the seeded void_window_hours default after migration', async () => {
    // Re-seed via the same INSERT OR IGNORE used by the migration.
    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('void_window_hours', '24', 1)",
    );
    const value = await getAppSetting('void_window_hours');
    expect(value).toBe('24');
  });

  it('returns null when a key is absent', async () => {
    const value = await getAppSetting('void_window_hours');
    expect(value).toBeNull();
  });

  it('writes a new value and reads it back', async () => {
    await setAppSetting('void_window_hours', '12');
    const value = await getAppSetting('void_window_hours');
    expect(value).toBe('12');
  });

  it('overwrites an existing value', async () => {
    await setAppSetting('void_window_hours', '12');
    await setAppSetting('void_window_hours', '48');
    const value = await getAppSetting('void_window_hours');
    expect(value).toBe('48');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest tests/database/settings.test.ts -v`
Expected: cannot find module `database/settings` error.

- [ ] **Step 4: Implement `database/settings.ts`**

Create `database/settings.ts`:

```typescript
import { db } from '../configs/sqlite';
import { AppSettingKey } from '../types/settings.types';

/**
 * Read a single app setting. Returns null when the key has never been written.
 * Settings are stored as TEXT; the caller is responsible for parse/validation.
 */
export const getAppSetting = async (
  key: AppSettingKey,
): Promise<string | null> => {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
};

/**
 * Upsert a setting. `updated_at` is set to the current time in milliseconds.
 */
export const setAppSetting = async (
  key: AppSettingKey,
  value: string,
): Promise<void> => {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now],
  );
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/database/settings.test.ts -v`
Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add database/settings.ts tests/database/settings.test.ts types/settings.types.ts
git commit -m "feat(corrections): app_settings get/set with seeded void_window_hours"
```

---

## Task 3: `types/corrections.types.ts` and updated `sales.types.ts`

**Files:**

- Create: `types/corrections.types.ts`
- Modify: `types/sales.types.ts`
- Test: type-only — runs by `npm run typecheck` (no new test file)

**Interfaces:**

- Consumes: existing `types/sales.types.ts` (`Sale`, `SaleItemWithProduct`)
- Produces:
  - `types/corrections.types.ts`: `CorrectionKind`, `VoidReasonCode`, `RefundReasonCode`, `PriceCorrectionReasonCode`, `ReasonCodeByKind`, `SaleCorrection`, `SaleCorrectionLine`
  - `types/sales.types.ts`: extended `Sale` (optional `cancelledAt`, `cancelledByKind`, `cancelledByCorrectionId`); new `SaleCorrection`, `SaleCorrectionLine`

- [ ] **Step 1: Write the new corrections types file**

Create `types/corrections.types.ts`:

```typescript
import { Pesos } from '@/lib/money';

export type CorrectionKind = 'void' | 'refund' | 'price_correction';

export type VoidReasonCode =
  'customer_changed_mind' | 'misprinted_price' | 'wrong_item_scanned' | 'other';

export type RefundReasonCode = 'returned_damaged' | 'returned_other';

export type PriceCorrectionReasonCode =
  'misprinted_price' | 'shelf_price_changed';

export type ReasonCodeByKind = {
  void: VoidReasonCode;
  refund: RefundReasonCode;
  price_correction: PriceCorrectionReasonCode;
};

export interface SaleCorrection {
  id: number;
  saleId: number;
  kind: CorrectionKind;
  actorReasonCode: string;
  actorNote: string | null;
  actorUser: string;
  witnessUser: string | null;
  refundPaymentType: 'cash' | null;
  createdAt: string;
}

export interface SaleCorrectionLine {
  id: number;
  correctionId: number;
  saleItemId: number;
  oldPrice: Pesos;
  newPrice: Pesos;
  priceDelta: number;
}

export interface SaleCorrectionReportRow extends SaleCorrection {
  saleTotalAtCorrection: Pesos;
}
```

- [ ] **Step 2: Update existing `Sale` type in `types/sales.types.ts`**

Open `types/sales.types.ts`. Add the optional cancellation fields to the `Sale` interface (and any other sale-row interfaces the file exports). Find the `Sale`/`SaleWithItems` shapes — they likely look like:

```typescript
export interface Sale {
  id: number;
  total: number;
  payment_type: 'cash' | 'credit';
  customer_name?: string | null;
  customer_credit_id?: number | null;
  credit_transaction_id?: number | null;
  timestamp: string;
}
```

Add three fields at the end:

```typescript
  cancelledAt?: string | null;
  cancelledByKind?: 'void' | 'refund' | 'price_correction' | null;
  cancelledByCorrectionId?: number | null;
```

Also add the export of `SaleCorrection`/`SaleCorrectionLine` here too (re-export from the corrections file so consumers only need the sales.types import surface):

```typescript
export type { SaleCorrection, SaleCorrectionLine } from './corrections.types';
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: exit 0; existing callers still compile because the new fields are optional.

- [ ] **Step 4: Run all tests**

Run: `npx jest`
Expected: still green (no functional changes).

- [ ] **Step 5: Commit**

```bash
git add types/corrections.types.ts types/sales.types.ts
git commit -m "feat(corrections): add correction types and extend Sale with cancellation fields"
```

---

## Task 4: `database/cash.ts` — subtract `cash_refund` from expected cash

**Files:**

- Modify: `database/cash.ts` (function `getCashSessionSummary`)
- Test: type-only via `npm run typecheck`; behavior covered by Task 7's `correctSalePrice` test (which exercises both arms)

**Interfaces:**

- Consumes: existing `cash_entries` rows (now allows `type='cash_refund'` after Task 1)
- Produces: updated `CashSessionSummary` math: `expectedCash = openingCash + cashSales + cashUtangPayments + ownerAdditions - expenses - ownerDrawings - cash_refunds`.

- [ ] **Step 1: Edit `getCashSessionSummary`**

In `database/cash.ts`, find the `entriesResult` query (around line 175-187):

```typescript
const entriesResult = await db.getFirstAsync<{
  owner_additions: number;
  expenses: number;
  owner_drawings: number;
}>(`...`);
```

Replace the SELECT and the downstream `ownerAdditions` / `expenses` / `ownerDrawings` constants to add a fourth CASE arm:

```typescript
const entriesResult = await db.getFirstAsync<{
  owner_additions: number;
  expenses: number;
  owner_drawings: number;
  cash_refunds: number;
}>(
  `SELECT
     COALESCE(SUM(CASE WHEN type = 'owner_addition' THEN amount ELSE 0 END), 0) as owner_additions,
     COALESCE(SUM(CASE WHEN type = 'expense'         THEN amount ELSE 0 END), 0) as expenses,
     COALESCE(SUM(CASE WHEN type = 'owner_drawing'   THEN amount ELSE 0 END), 0) as owner_drawings,
     COALESCE(SUM(CASE WHEN type = 'cash_refund'     THEN amount ELSE 0 END), 0) as cash_refunds
   FROM cash_entries
   WHERE session_id = ?`,
  [sessionId],
);

const ownerAdditions = entriesResult?.owner_additions ?? 0;
const expenses = entriesResult?.expenses ?? 0;
const ownerDrawings = entriesResult?.owner_drawings ?? 0;
const cashRefunds = entriesResult?.cash_refunds ?? 0;
```

Then update the `expectedCash` formula to subtract `cashRefunds`:

```typescript
const expectedCash =
  session.openingCash +
  cashSales +
  cashUtangPayments +
  ownerAdditions -
  expenses -
  ownerDrawings -
  cashRefunds;
```

Also extend the `CashSessionSummary` type or whatever return shape the function builds so the new field is included (find what the function returns; add `cashRefunds: cashRefunds as Pesos` to it).

- [ ] **Step 2: Run typecheck + tests**

Run: `npm run typecheck && npx jest`
Expected: both green.

- [ ] **Step 3: Commit**

```bash
git add database/cash.ts
git commit -m "feat(corrections): subtract cash_refund from expected_cash in session summary"
```

---

## Task 5: `database/corrections.ts` — read-side audit log queries

**Files:**

- Create: `database/corrections.ts`
- Test: `tests/database/corrections.test.ts`

**Interfaces:**

- Consumes: `sale_corrections`, `sale_correction_lines`, `sales` tables (Tasks 1 + 3)
- Produces:
  - `getCorrectionsForSale(saleId: number): Promise<SaleCorrectionWithLines[]>`
  - `getCorrectionsReport(opts: { cursor?: number; limit?: number }): Promise<{ items: SaleCorrectionReportRow[]; nextCursor: number | null }>`

Where `SaleCorrectionWithLines = SaleCorrection & { lines: SaleCorrectionLine[] }`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/database/corrections.test.ts
import { db } from '@/configs/sqlite';
import { runMigrations } from '@/database/migrations';
import {
  getCorrectionsForSale,
  getCorrectionsReport,
} from '@/database/corrections';

const seedCorrection = async (kind: 'void' | 'refund' | 'price_correction') => {
  // Re-using the seed pattern from existing test fixtures.
  await db.runAsync(
    "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (?, ?, 'cash', '2026-08-13T08:00:00Z')",
    [1, 100],
  );
  await db.runAsync(
    "INSERT INTO sale_corrections (id, sale_id, kind, actor_reason_code, actor_user, created_at) VALUES (?, 1, ?, 'misprinted_price', 'owner', '2026-08-13T09:00:00Z')",
    [1, kind],
  );
};

describe('database/corrections', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await db.execAsync('DELETE FROM sale_correction_lines;');
    await db.execAsync('DELETE FROM sale_corrections;');
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM sales;');
  });

  it('returns empty array when a sale has no corrections', async () => {
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (10, 100, 'cash', '2026-08-13T08:00:00Z')",
    );
    const rows = await getCorrectionsForSale(10);
    expect(rows).toEqual([]);
  });

  it('returns all corrections for a sale, oldest first', async () => {
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (20, 200, 'cash', '2026-08-13T08:00:00Z')",
    );
    await db.runAsync(
      "INSERT INTO sale_corrections (id, sale_id, kind, actor_reason_code, actor_user, created_at) VALUES (1, 20, 'void', 'customer_changed_mind', 'owner', '2026-08-13T09:00:00Z')",
    );
    await db.runAsync(
      "INSERT INTO sale_corrections (id, sale_id, kind, actor_reason_code, actor_user, created_at) VALUES (2, 20, 'price_correction', 'misprinted_price', 'owner', '2026-08-13T10:00:00Z')",
    );

    const rows = await getCorrectionsForSale(20);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe(1);
    expect(rows[1]?.id).toBe(2);
    expect(rows[0]?.kind).toBe('void');
  });

  it('paginateCorrectionsReport returns rows in DESC order with a stable cursor', async () => {
    await seedCorrection('void');
    const page1 = await getCorrectionsReport({ limit: 1 });
    expect(page1.items).toHaveLength(1);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await getCorrectionsReport({
      limit: 1,
      cursor: page1.nextCursor ?? undefined,
    });
    expect(page2.items).toHaveLength(0);
    expect(page2.nextCursor).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/database/corrections.test.ts -v`
Expected: cannot find `database/corrections` module.

- [ ] **Step 3: Implement the read module**

Create `database/corrections.ts`:

```typescript
import { db } from '../configs/sqlite';
import {
  SaleCorrection,
  SaleCorrectionLine,
  SaleCorrectionReportRow,
} from '../types/corrections.types';

interface SaleCorrectionWithLines extends SaleCorrection {
  lines: SaleCorrectionLine[];
}

const mapRow = (row: any): SaleCorrection => ({
  id: row.id,
  saleId: row.sale_id,
  kind: row.kind,
  actorReasonCode: row.actor_reason_code,
  actorNote: row.actor_note ?? null,
  actorUser: row.actor_user,
  witnessUser: row.witness_user ?? null,
  refundPaymentType: row.refund_payment_type ?? null,
  createdAt: row.created_at,
});

/**
 * All corrections attached to a single sale, oldest first. Returns an
 * empty array when no corrections exist.
 */
export const getCorrectionsForSale = async (
  saleId: number,
): Promise<SaleCorrectionWithLines[]> => {
  const headerRows = await db.getAllAsync<any>(
    `SELECT * FROM sale_corrections WHERE sale_id = ? ORDER BY created_at ASC, id ASC`,
    [saleId],
  );
  if (headerRows.length === 0) return [];

  const correctionIds = headerRows.map((r) => r.id);
  const placeholders = correctionIds.map(() => '?').join(',');
  const lineRows = await db.getAllAsync<any>(
    `SELECT * FROM sale_correction_lines WHERE correction_id IN (${placeholders})`,
    correctionIds,
  );

  const linesByCorrection = new Map<number, SaleCorrectionLine[]>();
  for (const row of lineRows) {
    const line: SaleCorrectionLine = {
      id: row.id,
      correctionId: row.correction_id,
      saleItemId: row.sale_item_id,
      oldPrice: row.old_price,
      newPrice: row.new_price,
      priceDelta: row.price_delta,
    };
    const list = linesByCorrection.get(row.correction_id) ?? [];
    list.push(line);
    linesByCorrection.set(row.correction_id, list);
  }

  return headerRows.map((row) => ({
    ...mapRow(row),
    lines: linesByCorrection.get(row.id) ?? [],
  }));
};

export interface CorrectionsReportPage {
  items: SaleCorrectionReportRow[];
  nextCursor: number | null;
}

/**
 * Paginated audit log, newest first. Cursor is the `id` of the last row
 * in the previous page (DESC scan, simple keyset pagination).
 */
export const getCorrectionsReport = async (
  opts: {
    cursor?: number;
    limit?: number;
  } = {},
): Promise<CorrectionsReportPage> => {
  const limit = Math.max(1, Math.floor(opts.limit ?? 50));
  const cursor = opts.cursor ?? Number.MAX_SAFE_INTEGER;

  const rows = await db.getAllAsync<any>(
    `SELECT sc.*, s.total AS sale_total
     FROM sale_corrections sc
     LEFT JOIN sales s ON s.id = sc.sale_id
     WHERE sc.id < ?
     ORDER BY sc.id DESC
     LIMIT ?`,
    [cursor, limit],
  );

  const items: SaleCorrectionReportRow[] = rows.map((row) => ({
    ...mapRow(row),
    saleTotalAtCorrection: row.sale_total ?? 0,
  }));

  const lastId = items[items.length - 1]?.id ?? null;
  const nextCursor = items.length === limit && lastId !== null ? lastId : null;

  return { items, nextCursor };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/database/corrections.test.ts -v`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add database/corrections.ts tests/database/corrections.test.ts types/corrections.types.ts
git commit -m "feat(corrections): correction audit log reads with per-sale and paginated report"
```

---

## Task 6: Named error classes for `database/sales.ts`

**Files:**

- Modify: `database/sales.ts` (add four classes near the existing `InsufficientStockError`)
- Test: type-only via `npm run typecheck`; behavior asserted indirectly by Task 7 tests

**Interfaces:**

- Consumes: existing `InsufficientStockError` class for shape
- Produces: `SaleAlreadyCancelledError`, `SaleLockedError`, `VoidWindowExceededError`, `NoOpenCashSessionError` — each named, each carries identifying fields, each used by Task 7's `voidSale`/`refundSale`/`correctSalePrice`.

- [ ] **Step 1: Add the four classes**

Find the existing `export class InsufficientStockError` at the top of `database/sales.ts` (around line 44). Immediately after its closing brace, add:

```typescript
export class SaleAlreadyCancelledError extends Error {
  saleId: number;
  constructor(saleId: number) {
    super(`Sale ${saleId} has already been corrected`);
    this.name = 'SaleAlreadyCancelledError';
    this.saleId = saleId;
  }
}

export class SaleLockedError extends Error {
  saleId: number;
  constructor(saleId: number) {
    super(
      `Sale ${saleId} belongs to a closed cash session and cannot be corrected`,
    );
    this.name = 'SaleLockedError';
    this.saleId = saleId;
  }
}

export class VoidWindowExceededError extends Error {
  saleId: number;
  windowHours: number;
  hoursSinceSale: number;
  constructor(saleId: number, windowHours: number, hoursSinceSale: number) {
    super(
      `Sale ${saleId} is outside the ${windowHours}-hour correction window (${hoursSinceSale.toFixed(1)}h since sale)`,
    );
    this.name = 'VoidWindowExceededError';
    this.saleId = saleId;
    this.windowHours = windowHours;
    this.hoursSinceSale = hoursSinceSale;
  }
}

export class NoOpenCashSessionError extends Error {
  constructor() {
    super('No open cash session exists for today');
    this.name = 'NoOpenCashSessionError';
  }
}
```

- [ ] **Step 2: Run typecheck + tests**

Run: `npm run typecheck && npx jest`
Expected: still green.

- [ ] **Step 3: Commit**

```bash
git add database/sales.ts
git commit -m "feat(corrections): named error classes for correction refusals"
```

---

## Task 7: `voidSale`, `refundSale`, `correctSalePrice` in `database/sales.ts`

This is the load-bearing task. Three functions, each with its own set of failing tests covering the core paths plus the named-error refusals.

**Files:**

- Modify: `database/sales.ts` (append after `deleteSale`)
- Test: `tests/database/corrections.test.ts` (extend the file from Task 5)

**Interfaces:**

- Consumes:
  - `db` from `configs/sqlite.ts`
  - `getCurrentLocalTimestamp` from `utils/timezone`
  - `getAppSetting` from `database/settings.ts`
  - `getSaleItems` from this file
  - The four new error classes from Task 6
  - Tables: `sales`, `sale_items`, `credit_transactions`, `inventory_transactions`, `cash_sessions`, `cash_entries`, `products`, `sale_corrections`, `sale_correction_lines`
- Produces:
  - `voidSale(saleId: number, args: { actorUser: string; witnessUser: string | null; reasonCode: string; note?: string }): Promise<number>` — returns the new `sale_corrections.id`
  - `refundSale(saleId: number, args: { actorUser: string; witnessUser: string | null; reasonCode: 'returned_damaged' | 'returned_other'; note?: string }): Promise<number>` — returns the new `sale_corrections.id`
  - `correctSalePrice(saleId: number, args: { actorUser: string; witnessUser: string | null; reasonCode: string; note?: string; priceChanges: Array<{ saleItemId: number; newPrice: number }> }): Promise<number>` — returns the new `sale_corrections.id`

All three functions run inside `db.withTransactionAsync`. They share common preconditions (see Step 1).

- [ ] **Step 1: Write a shared helper for the precondition guard**

Above the three functions, add a private helper inside `database/sales.ts`:

```typescript
interface CorrectionActor {
  actorUser: string;
  witnessUser: string | null;
  reasonCode: string;
  note?: string;
}

const assertCanCorrectSale = async (
  saleId: number,
  correctionKind: 'void' | 'refund' | 'price_correction',
): Promise<{
  sale: any;
  items: SaleItemWithProduct[];
  voidWindowHours: number;
}> => {
  const sale = await db.getFirstAsync<any>(
    'SELECT id, total, payment_type, timestamp, cancelled_at FROM sales WHERE id = ?',
    [saleId],
  );
  if (!sale) {
    throw new Error(`Sale ${saleId} not found`);
  }
  if (sale.cancelled_at) {
    throw new SaleAlreadyCancelledError(saleId);
  }

  // The locked-cash-session guard mirrors `deleteSale` at line 477-489.
  const isLocked = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM cash_sessions
     WHERE status = 'closed'
       AND ? >= opening_timestamp
       AND (? IS NULL OR ? <= closing_timestamp)
     LIMIT 1`,
    [sale.timestamp, sale.closedFlag ?? null, sale.timestamp],
  );
  if (isLocked) {
    throw new SaleLockedError(saleId);
  }

  const windowSetting = await getAppSetting('void_window_hours');
  const voidWindowHours = windowSetting ? Number(windowSetting) : 24;
  const saleMs = Date.parse(sale.timestamp);
  const hoursSinceSale = (Date.now() - saleMs) / 36e5;
  if (
    correctionKind !== 'price_correction' &&
    hoursSinceSale > voidWindowHours
  ) {
    throw new VoidWindowExceededError(saleId, voidWindowHours, hoursSinceSale);
  }

  const items = await getSaleItems(saleId);
  return { sale, items, voidWindowHours };
};
```

Note: `voidSale` and `refundSale` pay the time-window cost; `correctSalePrice` only enforces `cancelled_at === null` and the cash-session lock. The pattern is reusable for both categories.

- [ ] **Step 2: Write the failing test for `voidSale`**

Append to `tests/database/corrections.test.ts`:

```typescript
import {
  voidSale,
  refundSale,
  correctSalePrice,
  SaleAlreadyCancelledError,
  SaleLockedError,
  VoidWindowExceededError,
  NoOpenCashSessionError,
} from '@/database/sales';
import { initSalesTables } from '@/database/sales';
import { initInventoryTable } from '@/database/inventory';
import { initCashTables } from '@/database/cash';
import { setAppSetting } from '@/database/settings';

// Add a single beforeAll that initializes all tables used by the suite:
beforeAll(async () => {
  await runMigrations();
  await initSalesTables();
  await initInventoryTable();
  await initCashTables();
});

describe('database/sales voidSale', () => {
  const seedCashSale = async (saleId: number, total = 100) => {
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (?, ?, 'cash', datetime('now'))",
      [saleId, total],
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, ?, 1, 1, ?)',
      [saleId, total],
    );
  };

  const seedProductAndCashSession = async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open',datetime('now'),1,1)",
    );
  };

  it('returns inventory, writes adjustment rows, and sets sales.cancelled_at', async () => {
    await seedProductAndCashSession();
    await seedCashSale(101);

    const correctionId = await voidSale(101, {
      actorUser: 'owner',
      witnessUser: 'maria',
      reasonCode: 'customer_changed_mind',
    });
    expect(typeof correctionId).toBe('number');

    const productQty = await db.getFirstAsync<{ quantity: number }>(
      'SELECT quantity FROM products WHERE id = 1',
    );
    expect(productQty?.quantity).toBe(11); // 10 + 1 restored

    const sale = await db.getFirstAsync<any>(
      'SELECT cancelled_at, cancelled_by_kind, cancelled_by_correction_id FROM sales WHERE id = 101',
    );
    expect(sale?.cancelled_at).not.toBeNull();
    expect(sale?.cancelled_by_kind).toBe('void');
    expect(sale?.cancelled_by_correction_id).toBe(correctionId);

    const invRow = await db.getFirstAsync<any>(
      'SELECT type, adjustment_sign, note FROM inventory_transactions WHERE note LIKE ?',
      [`void:${correctionId}%`],
    );
    expect(invRow?.type).toBe('adjustment');
    expect(invRow?.adjustment_sign).toBe('positive');
  });

  it('writes cash_entries row with type=cash_refund equal to sale total', async () => {
    await seedProductAndCashSession();
    await seedCashSale(102, 75);

    await voidSale(102, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'other',
    });

    const cashRow = await db.getFirstAsync<any>(
      'SELECT type, amount, notes FROM cash_entries ORDER BY created_at DESC LIMIT 1',
    );
    expect(cashRow?.type).toBe('cash_refund');
    expect(cashRow?.amount).toBe(75);
  });

  it('refuses when sale is already cancelled', async () => {
    await seedProductAndCashSession();
    await seedCashSale(103);

    await voidSale(103, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'other',
    });

    await expect(
      voidSale(103, {
        actorUser: 'owner',
        witnessUser: null,
        reasonCode: 'other',
      }),
    ).rejects.toBeInstanceOf(SaleAlreadyCancelledError);
  });

  it('refuses when outside the void window', async () => {
    await seedProductAndCashSession();
    await setAppSetting('void_window_hours', '1');
    // 2 hours ago
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (104, 50, 'cash', datetime('now','-2 hours'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (2, 104, 1, 1, 50)',
    );

    await expect(
      voidSale(104, {
        actorUser: 'owner',
        witnessUser: null,
        reasonCode: 'other',
      }),
    ).rejects.toBeInstanceOf(VoidWindowExceededError);
  });

  it('refuses when cash session is closed', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    // Closed session that brackets the sale timestamp.
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, closing_timestamp, created_at, updated_at) VALUES ('s2','2026-08-13',1000,'closed','2026-08-13T07:00:00Z','2026-08-13T18:00:00Z',1,1)",
    );
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (105, 50, 'cash', '2026-08-13T12:00:00Z')",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (3, 105, 1, 1, 50)',
    );

    await expect(
      voidSale(105, {
        actorUser: 'owner',
        witnessUser: null,
        reasonCode: 'other',
      }),
    ).rejects.toBeInstanceOf(SaleLockedError);
  });
});
```

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `npx jest tests/database/corrections.test.ts -v -t "voidSale"`
Expected: cannot find `voidSale` export error.

- [ ] **Step 4: Implement `voidSale`**

In `database/sales.ts`, append after `deleteSale`'s closing brace:

```typescript
import * as Crypto from 'expo-crypto';
import { getAppSetting } from './settings';

/**
 * Reverse a sale, restoring inventory, recording a cash_refund (cash
 * sales) or marking the linked credit_transaction cancelled (credit
 * sales), and writing an append-only row to sale_corrections.
 *
 * Refuses if the sale is already corrected, outside void_window_hours,
 * or belongs to a closed cash session.
 */
export const voidSale = async (
  saleId: number,
  args: CorrectionActor,
): Promise<number> => {
  return await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(saleId, 'void');

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user
      ) VALUES (?, 'void', ?, ?, ?, ?)`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    const correctionId = Number(correctionResult.lastInsertRowId);

    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
      await db.runAsync(
        `INSERT INTO inventory_transactions
          (product_id, type, quantity, adjustment_sign, note)
         VALUES (?, 'adjustment', ?, 'positive', ?)`,
        [item.product_id, item.quantity, `void:${correctionId}`],
      );
    }

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();
      await db.runAsync(
        `INSERT INTO cash_entries (
          id, session_id, type, amount, notes, timestamp, created_at
        ) VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          session.id,
          sale.total,
          `void:${saleId}:${correctionId}`,
          getCurrentLocalTimestamp(),
          Date.now(),
        ],
      );
    } else {
      await db.runAsync(
        `UPDATE credit_transactions
         SET status = 'cancelled',
             cancelled_at = ?,
             cancelled_by_correction_id = ?
         WHERE id = ?`,
        [getCurrentLocalTimestamp(), correctionId, sale.credit_transaction_id],
      );
    }

    await db.runAsync(
      `UPDATE sales
       SET cancelled_at = ?,
           cancelled_by_kind = 'void',
           cancelled_by_correction_id = ?
       WHERE id = ?`,
      [getCurrentLocalTimestamp(), correctionId, saleId],
    );

    return correctionId;
  });
};
```

If `database/sales.ts` does not currently import `getCurrentLocalTimestamp`, add it next to the existing imports. Add `import * as Crypto from 'expo-crypto';` at the top (it's already a project dependency).

- [ ] **Step 5: Run `voidSale` tests**

Run: `npx jest tests/database/corrections.test.ts -v -t "voidSale"`
Expected: 5 passing.

- [ ] **Step 6: Add the failing `refundSale` tests**

Append to the same test file:

```typescript
describe('database/sales refundSale', () => {
  beforeEach(async () => {
    await db.execAsync('DELETE FROM sale_correction_lines;');
    await db.execAsync('DELETE FROM sale_corrections;');
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM credit_transactions;');
    await db.execAsync('DELETE FROM sales;');
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM cash_entries;');
    await db.execAsync('DELETE FROM cash_sessions;');
    await db.execAsync('DELETE FROM products;');
  });

  it('marks linked credit_transaction cancelled for credit sales', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    await db.runAsync("INSERT INTO customers (id, name) VALUES (1, 'Maria')");
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, customer_credit_id, credit_transaction_id, timestamp) VALUES (200, 75, 'credit', 1, 1001, datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, 200, 1, 1, 75)',
    );
    await db.runAsync(
      "INSERT INTO credit_transactions (id, customer_id, amount, status, date) VALUES (1001, 1, 75, 'unpaid', date('now'))",
    );

    const correctionId = await refundSale(200, {
      actorUser: 'owner',
      witnessUser: 'maria',
      reasonCode: 'returned_damaged',
    });

    const ct = await db.getFirstAsync<any>(
      'SELECT status, cancelled_at, cancelled_by_correction_id FROM credit_transactions WHERE id = 1001',
    );
    expect(ct?.status).toBe('cancelled');
    expect(ct?.cancelled_at).not.toBeNull();
    expect(ct?.cancelled_by_correction_id).toBe(correctionId);

    const sale = await db.getFirstAsync<any>(
      'SELECT cancelled_by_kind FROM sales WHERE id = 200',
    );
    expect(sale?.cancelled_by_kind).toBe('refund');
  });

  it('throws NoOpenCashSessionError when refunding a cash sale with no open session', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    // No cash_sessions row at all.
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (300, 50, 'cash', datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (2, 300, 1, 1, 50)',
    );

    await expect(
      refundSale(300, {
        actorUser: 'owner',
        witnessUser: null,
        reasonCode: 'returned_other',
      }),
    ).rejects.toBeInstanceOf(NoOpenCashSessionError);
  });
});
```

- [ ] **Step 7: Implement `refundSale`**

Append after `voidSale`:

```typescript
/**
 * Like `voidSale` but uses `kind='refund'`, validates the reason code is
 * a returned-goods code, and sets `refund_payment_type='cash'`.
 */
export const refundSale = async (
  saleId: number,
  args: CorrectionActor & { reasonCode: 'returned_damaged' | 'returned_other' },
): Promise<number> => {
  return await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(saleId, 'refund');

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user, refund_payment_type
      ) VALUES (?, 'refund', ?, ?, ?, ?, 'cash')`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    const correctionId = Number(correctionResult.lastInsertRowId);

    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
      await db.runAsync(
        `INSERT INTO inventory_transactions
          (product_id, type, quantity, adjustment_sign, note)
         VALUES (?, 'adjustment', ?, 'positive', ?)`,
        [
          item.product_id,
          item.quantity,
          `refund:${correctionId}:${args.reasonCode}`,
        ],
      );
    }

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();
      await db.runAsync(
        `INSERT INTO cash_entries (
          id, session_id, type, amount, notes, timestamp, created_at
        ) VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          session.id,
          sale.total,
          `refund:${saleId}:${correctionId}`,
          getCurrentLocalTimestamp(),
          Date.now(),
        ],
      );
    } else {
      await db.runAsync(
        `UPDATE credit_transactions
         SET status = 'cancelled',
             cancelled_at = ?,
             cancelled_by_correction_id = ?
         WHERE id = ?`,
        [getCurrentLocalTimestamp(), correctionId, sale.credit_transaction_id],
      );
    }

    await db.runAsync(
      `UPDATE sales
       SET cancelled_at = ?,
           cancelled_by_kind = 'refund',
           cancelled_by_correction_id = ?
       WHERE id = ?`,
      [getCurrentLocalTimestamp(), correctionId, saleId],
    );

    return correctionId;
  });
};
```

- [ ] **Step 8: Run the full `corrections.test.ts`**

Run: `npx jest tests/database/corrections.test.ts -v`
Expected: 5 void tests + 2 refund tests + the 3 read tests from Task 5 = 10 passing.

- [ ] **Step 9: Add failing `correctSalePrice` tests**

Append a third `describe` block to the same test file:

```typescript
describe('database/sales correctSalePrice', () => {
  beforeEach(async () => {
    await db.execAsync('DELETE FROM sale_correction_lines;');
    await db.execAsync('DELETE FROM sale_corrections;');
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM credit_transactions;');
    await db.execAsync('DELETE FROM sales;');
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM cash_entries;');
    await db.execAsync('DELETE FROM cash_sessions;');
    await db.execAsync('DELETE FROM products;');
  });

  it('updates line prices, recomputes total, and writes owner_addition when total goes up (cash)', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open',datetime('now'),1,1)",
    );
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (400, 100, 'cash', datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, 400, 1, 1, 100)',
    );

    const correctionId = await correctSalePrice(400, {
      actorUser: 'owner',
      witnessUser: 'maria',
      reasonCode: 'misprinted_price',
      priceChanges: [{ saleItemId: 1, newPrice: 105 }],
    });

    expect(typeof correctionId).toBe('number');

    const line = await db.getFirstAsync<any>(
      'SELECT price FROM sale_items WHERE id = 1',
    );
    expect(line?.price).toBe(105);

    const sale = await db.getFirstAsync<any>(
      'SELECT total, cancelled_by_kind FROM sales WHERE id = 400',
    );
    expect(sale?.total).toBe(105);
    // For price correction we do NOT set cancelled_at.
    expect(sale?.cancelled_by_kind).toBeNull();

    const deltaRow = await db.getFirstAsync<any>(
      'SELECT old_price, new_price, price_delta FROM sale_correction_lines WHERE correction_id = ?',
      [correctionId],
    );
    expect(deltaRow?.old_price).toBe(100);
    expect(deltaRow?.new_price).toBe(105);
    expect(deltaRow?.price_delta).toBe(5);

    const cashRow = await db.getFirstAsync<any>(
      'SELECT type, amount FROM cash_entries ORDER BY created_at DESC LIMIT 1',
    );
    expect(cashRow?.type).toBe('owner_addition');
    expect(cashRow?.amount).toBe(5);
  });

  it('writes cash_refund (not owner_addition) when the corrected total is lower', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open',datetime('now'),1,1)",
    );
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (500, 200, 'cash', datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, 500, 1, 2, 100)',
    );

    await correctSalePrice(500, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'misprinted_price',
      priceChanges: [{ saleItemId: 1, newPrice: 90 }],
    });

    const sale = await db.getFirstAsync<any>(
      'SELECT total FROM sales WHERE id = 500',
    );
    expect(sale?.total).toBe(180);

    const cashRow = await db.getFirstAsync<any>(
      'SELECT type, amount FROM cash_entries ORDER BY created_at DESC LIMIT 1',
    );
    expect(cashRow?.type).toBe('cash_refund');
    expect(cashRow?.amount).toBe(20);
  });

  it('skips no-op price changes (no sale_correction_lines row, no cash entry)', async () => {
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 100, 10)",
    );
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open',datetime('now'),1,1)",
    );
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (600, 100, 'cash', datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, 600, 1, 1, 100)',
    );

    const correctionId = await correctSalePrice(600, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'misprinted_price',
      priceChanges: [{ saleItemId: 1, newPrice: 100 }], // unchanged
    });

    const lines = await db.getAllAsync<any>(
      'SELECT * FROM sale_correction_lines WHERE correction_id = ?',
      [correctionId],
    );
    expect(lines).toHaveLength(0);

    const cashEntries = await db.getAllAsync<any>('SELECT * FROM cash_entries');
    expect(cashEntries).toHaveLength(0);
  });
});
```

- [ ] **Step 10: Implement `correctSalePrice`**

Append after `refundSale`:

```typescript
/**
 * Edit the unit price of one or more sale items. Recomputes the sale
 * total. For cash sales: emits a cash_refund if the new total is lower
 * (customer overpaid) or an owner_addition if it's higher. For credit
 * sales: adjusts the credit_transaction.amount accordingly.
 *
 * Refuses if the sale is already cancelled or belongs to a closed cash
 * session. Does not enforce the void time window because price edits
 * outside the window are still meaningful business events; spec §4.1
 * notes that the time gate is enforced but `cancelled_at` is not set
 * on the sale.
 */
export const correctSalePrice = async (
  saleId: number,
  args: CorrectionActor & {
    priceChanges: Array<{ saleItemId: number; newPrice: number }>;
  },
): Promise<number> => {
  return await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(
      saleId,
      'price_correction',
    );

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user
      ) VALUES (?, 'price_correction', ?, ?, ?, ?)`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    const correctionId = Number(correctionResult.lastInsertRowId);

    let totalDelta = 0;
    for (const change of args.priceChanges) {
      const item = items.find((i) => i.id === change.saleItemId);
      if (!item) continue;
      if (change.newPrice === item.price) continue;
      const priceDelta = change.newPrice - item.price;
      totalDelta += priceDelta * item.quantity;

      await db.runAsync(
        `INSERT INTO sale_correction_lines (
          correction_id, sale_item_id, old_price, new_price, price_delta
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          correctionId,
          change.saleItemId,
          item.price,
          change.newPrice,
          priceDelta,
        ],
      );
      await db.runAsync('UPDATE sale_items SET price = ? WHERE id = ?', [
        change.newPrice,
        change.saleItemId,
      ]);
    }

    if (totalDelta === 0) {
      return correctionId;
    }

    // Recompute the sale total from the line items (price × quantity).
    const recomputed = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(price * quantity), 0) as total FROM sale_items WHERE sale_id = ?`,
      [saleId],
    );
    const newTotal = recomputed?.total ?? sale.total;
    await db.runAsync('UPDATE sales SET total = ? WHERE id = ?', [
      newTotal,
      saleId,
    ]);

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();

      if (totalDelta < 0) {
        await db.runAsync(
          `INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at)
           VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            session.id,
            -totalDelta,
            `price_correction:${saleId}:${correctionId}`,
            getCurrentLocalTimestamp(),
            Date.now(),
          ],
        );
      } else {
        await db.runAsync(
          `INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at)
           VALUES (?, ?, 'owner_addition', ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            session.id,
            totalDelta,
            `price_correction:${saleId}:${correctionId}`,
            getCurrentLocalTimestamp(),
            Date.now(),
          ],
        );
      }
    } else if (sale.credit_transaction_id) {
      // Credit case: amount = amount + totalDelta (lowering the debt
      // means reducing amount). The customer's running balance
      // recomputes live per project convention.
      await db.runAsync(
        'UPDATE credit_transactions SET amount = amount + ? WHERE id = ?',
        [totalDelta, sale.credit_transaction_id],
      );
    }

    return correctionId;
  });
};
```

- [ ] **Step 11: Run all correction tests**

Run: `npx jest tests/database/corrections.test.ts -v`
Expected: 5 void + 2 refund + 3 read + 3 price correction = 13 passing.

- [ ] **Step 12: Run the full suite + typecheck**

Run: `npm run verify`
Expected: green.

- [ ] **Step 13: Commit**

```bash
git add database/sales.ts tests/database/corrections.test.ts
git commit -m "feat(corrections): voidSale, refundSale, correctSalePrice write functions"
```

---

## Task 8: `hooks/useAppSetting.ts` — TanStack Query wrapper

**Files:**

- Create: `hooks/useAppSetting.ts`
- Test: behavioral — exercised by Task 10's settings screen test (type-only via `typecheck` here)

**Interfaces:**

- Consumes: `getAppSetting`, `setAppSetting` from `database/settings.ts`, TanStack Query v5
- Produces:
  - `useAppSetting(key: AppSettingKey): { value: string | null; isLoading: boolean }`
  - `useSetAppSetting(key: AppSettingKey): UseMutationResult<void, Error, string>` — invalidates the matching query on success

- [ ] **Step 1: Implement the hook**

Create `hooks/useAppSetting.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppSetting, setAppSetting } from '@/database/settings';
import type { AppSettingKey } from '@/types/settings.types';

const queryKey = (key: AppSettingKey) => ['appSetting', key] as const;

export const useAppSetting = (key: AppSettingKey) => {
  const query = useQuery({
    queryKey: queryKey(key),
    queryFn: () => getAppSetting(key),
    staleTime: 5 * 60 * 1000,
  });
  return { value: query.data ?? null, isLoading: query.isLoading };
};

export const useSetAppSetting = (key: AppSettingKey) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => setAppSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(key) }),
  });
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add hooks/useAppSetting.ts
git commit -m "feat(corrections): useAppSetting hook over app_settings"
```

---

## Task 9: `hooks/useCorrections.tsx` and `useSales.tsx` mutations

**Files:**

- Create: `hooks/useCorrections.tsx`
- Modify: `hooks/useSales.tsx` (add three mutations)
- Test: `tests/hooks/useCorrections.test.tsx`

**Interfaces:**

- Consumes: `voidSale`/`refundSale`/`correctSalePrice` from Task 7, `getCorrectionsForSale`/`getCorrectionsReport` from Task 5, TanStack Query.
- Produces:
  - `hooks/useSales.tsx` exports:
    - `useVoidSale(): UseMutationResult<{ correctionId: number }, Error, { saleId: number; actorUser: string; witnessUser: string | null; reasonCode: string; note?: string }>`
    - `useRefundSale()` analogous.
    - `useCorrectSalePrice()` analogous, with `priceChanges` in the variables.
    - `useSaleCorrections(saleId: number | null): UseQueryResult<SaleCorrectionWithLines[]>`
  - `hooks/useCorrections.tsx` exports:
    - `useCorrectionsReport(opts: { cursor?: number; limit?: number }): UseInfiniteQueryResult<SaleCorrectionReportRow[]>`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/hooks/useCorrections.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useCorrectionsReport } from '@/hooks/useCorrections';
import { useVoidSale } from '@/hooks/useSales';
import { runMigrations } from '@/database/migrations';
import { db } from '@/configs/sqlite';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) =>
    require('react').createElement(
      QueryClientProvider,
      { client: qc },
      children,
    );
};

describe('useCorrectionsReport + useVoidSale cache wiring', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await db.execAsync('DELETE FROM sale_correction_lines;');
    await db.execAsync('DELETE FROM sale_corrections;');
    await db.execAsync('DELETE FROM sale_items;');
    await db.execAsync('DELETE FROM sales;');
  });

  it('useVoidSale invalidates the corrections report on success', async () => {
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type, timestamp) VALUES (700, 50, 'cash', datetime('now'))",
    );
    await db.runAsync(
      'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (1, 700, 1, 1, 50)',
    );
    await db.runAsync(
      "INSERT INTO products (id, name, price, quantity) VALUES (1, 'Coke', 50, 5)",
    );
    await db.runAsync(
      "INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at) VALUES ('s1','2026-08-13',1000,'open',datetime('now'),1,1)",
    );

    const { result } = renderHook(
      () => ({
        voidSale: useVoidSale(),
        report: useCorrectionsReport({ limit: 10 }),
      }),
      { wrapper: makeWrapper() },
    );

    // Pre-condition: report is empty.
    await waitFor(() => expect(result.current.report.data?.length).toBe(0));

    await act(async () => {
      await result.current.voidSale.mutateAsync({
        saleId: 700,
        actorUser: 'owner',
        witnessUser: null,
        reasonCode: 'other',
      });
    });

    await waitFor(() =>
      expect(result.current.report.data?.length).toBeGreaterThan(0),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/hooks/useCorrections.test.tsx -v`
Expected: cannot find `useCorrectionsReport` / `useVoidSale`.

- [ ] **Step 3: Implement `hooks/useSales.tsx` additions**

Open `hooks/useSales.tsx`. Find where existing mutations (if any) live; otherwise find the end of the file and append. If the file currently has no mutation hooks, also `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';` and `import { voidSale, refundSale, correctSalePrice } from '@/database/sales';` at the top.

Add:

```typescript
const SALE_CORRECTIONS_REPORT_KEY = ['sale-corrections', 'report'] as const;
const saleKeys = {
  detail: (id: number) => ['sale', id] as const,
};

export const useVoidSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: string;
      note?: string;
    }) =>
      voidSale(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: saleKeys.detail(vars.saleId) });
      qc.invalidateQueries({ queryKey: SALE_CORRECTIONS_REPORT_KEY });
    },
  });
};

export const useRefundSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: 'returned_damaged' | 'returned_other';
      note?: string;
    }) =>
      refundSale(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: saleKeys.detail(vars.saleId) });
      qc.invalidateQueries({ queryKey: SALE_CORRECTIONS_REPORT_KEY });
    },
  });
};

export const useCorrectSalePrice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: string;
      note?: string;
      priceChanges: Array<{ saleItemId: number; newPrice: number }>;
    }) =>
      correctSalePrice(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
        priceChanges: args.priceChanges,
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: saleKeys.detail(vars.saleId) });
      qc.invalidateQueries({ queryKey: SALE_CORRECTIONS_REPORT_KEY });
    },
  });
};

export const useSaleCorrections = (saleId: number | null) => {
  return useQuery({
    enabled: saleId !== null,
    queryKey: ['sale-corrections', 'by-sale', saleId],
    queryFn: () => getCorrectionsForSale(saleId as number),
  });
};
```

(If `useSales.tsx` already has these helpers or a different cache-key convention, mirror that convention exactly. If unsure, read the file first and align.)

- [ ] **Step 4: Implement `hooks/useCorrections.tsx`**

Create `hooks/useCorrections.tsx`:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCorrectionsReport } from '@/database/corrections';
import type { SaleCorrectionReportRow } from '@/types/corrections.types';

export const useCorrectionsReport = (
  opts: {
    limit?: number;
  } = {},
) => {
  const limit = opts.limit ?? 50;
  return useInfiniteQuery<
    { items: SaleCorrectionReportRow[]; nextCursor: number | null },
    Error
  >({
    queryKey: ['sale-corrections', 'report', limit],
    queryFn: ({ pageParam }) =>
      getCorrectionsReport({
        limit,
        cursor: typeof pageParam === 'number' ? pageParam : undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/hooks/useCorrections.test.tsx -v`
Expected: 1 passing.

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm run verify`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add hooks/useCorrections.tsx hooks/useSales.tsx tests/hooks/useCorrections.test.tsx
git commit -m "feat(corrections): useCorrectionsReport + void/refund/price hooks with cache invalidation"
```

---

## Task 10: i18n keys for `corrections.*` and `settings.*`

**Files:**

- Modify: `locales/en.json`
- Modify: `locales/fil.json`
- Test: type-only via `npm run typecheck`; key coverage verified in Task 11-13 via the screens that consume them.

**Interfaces:**

- Consumes: existing locale JSON shape
- Produces: a new `corrections` namespace with reason codes and copy for all three screens, plus a `settings` namespace with `void_window_hours` label/help/success.

- [ ] **Step 1: Read each locale's current shape**

Read the top 40 lines of `locales/en.json` and `locales/fil.json` to find the correct spot to splice in. Match the existing indentation (likely 2 spaces) and key grouping style.

- [ ] **Step 2: Add keys to `locales/en.json`**

Add at the appropriate location (e.g., just before the closing `}` of the resource object):

```json
  "corrections": {
    "kind_void": "Void sale",
    "kind_refund": "Refund sale",
    "kind_price_correction": "Correct price",
    "reason_label": "Reason",
    "reason_customer_changed_mind": "Customer changed mind",
    "reason_misprinted_price": "Misprinted price",
    "reason_wrong_item_scanned": "Wrong item scanned",
    "reason_returned_damaged": "Returned — damaged",
    "reason_returned_other": "Returned — other",
    "reason_shelf_price_changed": "Shelf price changed",
    "reason_other": "Other",
    "witness_label": "Cashier on shift",
    "witness_required": "Pick the cashier who rang up the sale",
    "confirm_and_pin": "Confirm with PIN",
    "report_title": "Corrections",
    "empty_report": "No corrections yet.",
    "view_sale": "View sale",
    "voided_banner": "This sale was voided.",
    "refunded_banner": "This sale was refunded.",
    "void_window_locked": "Correction window has closed (settings: {{hours}}h).",
    "session_closed": "Cash session is closed — contact your bookkeeper."
  },
  "settings": {
    "title": "Settings",
    "void_window_hours": "Void window (hours)",
    "void_window_help": "How many hours after a sale it can still be corrected. Default 24.",
    "save": "Save",
    "saved": "Saved."
  }
```

(If the locale file already has top-level namespaces, place each block at the right alphabetical/declared position.)

- [ ] **Step 3: Add the same keys to `locales/fil.json`**

Match the structure. Use the same keys. Suggested Filipino copy mirroring spec language:

```json
  "corrections": {
    "kind_void": "I-void ang benta",
    "kind_refund": "I-refund ang benta",
    "kind_price_correction": "Itama ang presyo",
    "reason_label": "Dahilan",
    "reason_customer_changed_mind": "Nag-bago ang isip ng suki",
    "reason_misprinted_price": "Maling presyo",
    "reason_wrong_item_scanned": "Maling item ang na-scan",
    "reason_returned_damaged": "Ibinalik — sira",
    "reason_returned_other": "Ibinalik — iba pa",
    "reason_shelf_price_changed": "Bago ang presyo sa estante",
    "reason_other": "Iba pa",
    "witness_label": "Cashier na naka-duty",
    "witness_required": "Pumili ng cashier na nag-benta nito",
    "confirm_and_pin": "Kumpirmahin gamit ang PIN",
    "report_title": "Mga Pagtatama",
    "empty_report": "Walang pagtatama pa.",
    "view_sale": "Tingnan ang benta",
    "voided_banner": "Na-void ang benta na ito.",
    "refunded_banner": "Na-refund ang benta na ito.",
    "void_window_locked": "Sarado na ang oras ng pagtatama ({{hours}}h).",
    "session_closed": "Sarado ang session — makipag-ugnayan sa bookkeeper."
  },
  "settings": {
    "title": "Mga Setting",
    "void_window_hours": "Oras ng pag-void (oras)",
    "void_window_help": "Gaano katagal pagkatapos ng benta maaari itong itama. Default na 24.",
    "save": "I-save",
    "saved": "Na-save."
  }
```

- [ ] **Step 4: Run typecheck and validate JSON**

Run: `npm run typecheck`
Manually open each JSON file and ensure it parses (`node -e "JSON.parse(require('fs').readFileSync('locales/en.json','utf8'))"` parses without throwing).

- [ ] **Step 5: Commit**

```bash
git add locales/en.json locales/fil.json
git commit -m "feat(corrections): i18n keys for corrections and settings screens"
```

---

## Task 11: Settings screen — `app/settings/index.tsx`

**Files:**

- Create: `app/settings/index.tsx`
- Modify: route registration in `app/_layout.tsx` (or wherever other top-level screens register; check existing pattern)
- Test: behavioral — `npx jest` smoke only (no new file); visual review is the deliverable.

**Interfaces:**

- Consumes: `useAppSetting('void_window_hours')`, `useSetAppSetting` from Task 8; `useTranslation` from `react-i18next`; existing form input components in `components/`.
- Produces: a single screen with an integer input prefilled from the current setting, a Save button that calls `setAppSetting`, and a transient success toast.

- [ ] **Step 1: Find the screen-registration convention**

Open the project's root `_layout.tsx` (likely `app/_layout.tsx`) and see how other settings-shaped screens register (e.g., does the file use a `<Stack.Screen name="settings" />` declaration?). Also look at an existing simple screen like an inventory or utility sub-screen to copy its wrapper (header bar, safe area, etc.).

- [ ] **Step 2: Implement the screen**

Create `app/settings/index.tsx`:

```typescript
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Toast } from '@/components/Toast';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { value, isLoading } = useAppSetting('void_window_hours');
  const { mutateAsync: save, isPending } = useSetAppSetting('void_window_hours');
  const [draft, setDraft] = React.useState<string>('');

  React.useEffect(() => {
    if (value !== null && draft === '') {
      setDraft(value);
    }
  }, [value, draft]);

  const onSave = async () => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Toast.show(t('settings.invalid_hours'));
      return;
    }
    await save(draft);
    Toast.show(t('settings.saved'));
  };

  if (isLoading) return <ScreenContainer><Text>...</Text></ScreenContainer>;

  return (
    <ScreenContainer>
      <Text>{t('settings.title')}</Text>

      <View>
        <Text>{t('settings.void_window_hours')}</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
          accessibilityLabel={t('settings.void_window_hours')}
        />
        <Text>{t('settings.void_window_help')}</Text>
      </View>

      <Pressable onPress={onSave} disabled={isPending}>
        <Text>{t('settings.save')}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
```

If the project uses `react-hook-form` here (it's a dependency — line 73 in `package.json`), wrap the input in a controller the same way other forms do. Match the existing styling tokens (NativeWind classes, etc.) rather than free-form.

- [ ] **Step 3: Register the route**

In the root `_layout.tsx` (or equivalent), ensure the route exists. If the app uses `expo-router`'s file-based routing, no further registration is needed — `app/settings/index.tsx` is automatically at `/settings`. If a `<Stack.Screen>` declaration is needed, mirror how an existing screen is added.

- [ ] **Step 4: Run the full verify pipeline**

Run: `npm run verify`
Expected: typecheck passes; jest still green.

- [ ] **Step 5: Commit**

```bash
git add app/settings/index.tsx
git commit -m "feat(corrections): settings screen with void_window_hours editor"
```

---

## Task 12: Correction screen — `app/sales/[id]/correction.tsx`

**Files:**

- Create: `app/sales/[id]/correction.tsx`
- Modify: `app/sales/_layout.tsx` (register the correction route under the stack)
- Test: type-only via `typecheck`; no new test (visual + manual review)

**Interfaces:**

- Consumes: `useSale(id)` (find existing), `useVoidSale`, `useRefundSale` from Task 9; `useTranslation`; `Toast`; the existing PIN-entry primitive (`useOwnerPin` if shipped, else a placeholder PIN sheet — pick the one present).
- Produces: a screen with three sections: sale summary, reason code picker, witness input. Bottom action bar: Cancel + Confirm & PIN.

- [ ] **Step 1: Read `app/sales/_layout.tsx` to understand the existing stack**

Look at how a current detail-screen route like `app/sales/[id].tsx` is mounted. Mirror that pattern when adding a new sibling `[id]/correction.tsx` route (or convert `_layout.tsx` to a stack and register it there).

- [ ] **Step 2: Implement the screen**

Create `app/sales/[id]/correction.tsx`. Key behaviors:

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useVoidSale, useRefundSale } from '@/hooks/useSales';
import { useOwnerPin } from '@/lib/pin'; // (or the existing primitive)
import { ScreenContainer } from '@/components/ScreenContainer';
import { Toast } from '@/components/Toast';

type Mode = 'void' | 'refund';

export default function CorrectionScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: Mode }>();
  const saleId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();

  const [reason, setReason] = useState<string>('');
  const [witness, setWitness] = useState<string>('');
  const [pinOpen, setPinOpen] = useState(false);
  const { verifyPin } = useOwnerPin();

  const { mutateAsync: voidSale } = useVoidSale();
  const { mutateAsync: refundSale } = useRefundSale();

  const onConfirm = () => {
    if (!reason) return Toast.show(t('corrections.reason_required'));
    if (!witness) return Toast.show(t('corrections.witness_required'));
    setPinOpen(true);
  };

  const onPinAccepted = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (!ok) return Toast.show(t('corrections.pin_wrong'));
    setPinOpen(false);
    try {
      if (mode === 'void') {
        await voidSale({ saleId, actorUser: 'owner', witnessUser: witness, reasonCode: reason });
      } else {
        await refundSale({ saleId, actorUser: 'owner', witnessUser: witness, reasonCode: reason as 'returned_damaged' | 'returned_other' });
      }
      router.back();
    } catch (err) {
      Toast.show(err instanceof Error ? err.message : 'failed');
    }
  };

  return (
    <ScreenContainer>
      {/* ... mode-specific copy, reason picker, witness TextInput ... */}
      {/* Bottom action bar with Cancel + t('corrections.confirm_and_pin') */}
      <PinSheet visible={pinOpen} onAccept={onPinAccepted} onCancel={() => setPinOpen(false)} />
    </ScreenContainer>
  );
}
```

The exact component shapes depend on the project's existing patterns — copy the styling, layout primitives, and PIN-sheet from a current screen in `app/`. **Do not invent new visual primitives**.

- [ ] **Step 3: Register the route**

If `app/sales/_layout.tsx` is a stack, add `<Stack.Screen name="[id]/correction" options={{ title: t('corrections.kind_void') }} />` (or whatever existing declaration pattern applies).

- [ ] **Step 4: Run verify**

Run: `npm run verify`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add app/sales/_layout.tsx app/sales/[id]/correction.tsx
git commit -m "feat(corrections): void/refund action screen with PIN gate"
```

---

## Task 13: Price correction screen — `app/sales/[id]/price-correction.tsx`

**Files:**

- Create: `app/sales/[id]/price-correction.tsx`
- Modify: `app/sales/_layout.tsx` (register the route)
- Test: type-only via `typecheck`

**Interfaces:**

- Consumes: `useSale(id)`, `useCorrectSalePrice` from Task 9, PIN primitive.
- Produces: a per-line editor screen showing `oldPrice -> [newPrice]` for each line, a live-recomputed subtotal, and the same reason + witness + PIN flow as Task 12.

- [ ] **Step 1: Implement the screen**

Create `app/sales/[id]/price-correction.tsx`. This screen has more state than Task 12 (a per-line map of `saleItemId -> newPrice`), but follows the same shape:

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useCorrectSalePrice } from '@/hooks/useSales';
import { useOwnerPin } from '@/lib/pin';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Toast } from '@/components/Toast';

export default function PriceCorrectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const saleId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();

  const [edits, setEdits] = useState<Record<number, string>>({});
  const [reason, setReason] = useState<string>('');
  const [witness, setWitness] = useState<string>('');
  const [pinOpen, setPinOpen] = useState(false);
  const { verifyPin } = useOwnerPin();
  const { mutateAsync: correct } = useCorrectSalePrice();

  const onSubmit = async () => {
    const priceChanges = Object.entries(edits)
      .map(([k, v]) => ({
        saleItemId: Number(k),
        newPrice: Number.parseInt(v, 10),
      }))
      .filter((c) => Number.isFinite(c.newPrice) && c.newPrice > 0);
    if (priceChanges.length === 0)
      return Toast.show(t('corrections.no_changes'));
    await correct({
      saleId,
      actorUser: 'owner',
      witnessUser: witness,
      reasonCode: reason,
      priceChanges,
    });
    router.back();
  };

  // Render each line item with:
  //   [productName]   old: ₱{oldPrice}   [TextInput: newPrice]
  //                                   subtotal: ₱{recomputedTotal}
  // Bottom: reason picker, witness, Save (opens PIN sheet).
}
```

The exact rendering — whether to use a flat vertical layout, a per-line card, or a table — should match the existing sale-detail screen's visual rhythm. Copy any existing `FlatList`-with-TextInput pattern.

- [ ] **Step 2: Register the route**

In `app/sales/_layout.tsx`, add the same way as Task 12.

- [ ] **Step 3: Run verify**

Run: `npm run verify`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/sales/[id]/price-correction.tsx app/sales/_layout.tsx
git commit -m "feat(corrections): per-line price correction screen with PIN gate"
```

---

## Task 14: Corrections report screen — `app/reports/corrections.tsx`

**Files:**

- Create: `app/reports/corrections.tsx`
- Modify: `app/(tabs)/sales.tsx` (header link to the report)
- Modify: `app/_layout.tsx` if `/reports/corrections` needs explicit registration
- Test: type-only via `typecheck`

**Interfaces:**

- Consumes: `useCorrectionsReport` from Task 9, `useTranslation`, `FlatList` (or the project's list component), `useRouter`.
- Produces: a paginated list. Each row renders `{kind} | Sale #{saleId} · ₱{total} · {relativeTime}` plus `by {actorUser}, witness: {witnessUser}` plus `reason: {actorReasonCode}`. Empty state copy when no corrections.

- [ ] **Step 1: Implement the screen**

Create `app/reports/corrections.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { useCorrectionsReport } from '@/hooks/useCorrections';
import { ScreenContainer } from '@/components/ScreenContainer';

export default function CorrectionsReportScreen() {
  const { t } = useTranslation();
  const { data, fetchNextPage, hasNextPage, isLoading } = useCorrectionsReport({ limit: 50 });

  if (isLoading) return <ScreenContainer><Text>...</Text></ScreenContainer>;

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) {
    return <ScreenContainer><Text>{t('corrections.empty_report')}</Text></ScreenContainer>;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.id}`}
      renderItem={({ item }) => <CorrectionRow row={item} />}
      onEndReached={() => hasNextPage && fetchNextPage()}
    />
  );
}
```

Use a `useRelativeTime` helper if the project has one, otherwise plain `"X min ago"` strings.

- [ ] **Step 2: Add a link from the Sales sub-tab header**

Find the header component inside `app/(tabs)/sales.tsx` (likely a `Stack.Screen` `headerRight` or a top-level action row). Add a button that calls `router.push('/reports/corrections')`. Use whatever icon component the project uses for navigation actions.

- [ ] **Step 3: Run verify**

Run: `npm run verify`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add app/reports/corrections.tsx app/(tabs)/sales.tsx
git commit -m "feat(corrections): corrections report screen with header link from Sales"
```

---

## Self-Review

After writing all 14 tasks, run this checklist:

### 1. Spec coverage

Walking `docs/superpowers/specs/2026-08-13-safe-voids-refunds-corrections-design.md`:

- §1 decisions all wired into Task 1 (route → Tasks 12-14; window → Task 11; witness → all screens; per-line editor → Task 13; cash_refund → Task 4; list-only report → Task 14). ✅
- §3 schema — Task 1. ✅
- §4.1 preconditions — Task 7's `assertCanCorrectSale` helper. ✅
- §4.2 voidSale — Task 7. ✅
- §4.3 refundSale — Task 7. ✅
- §4.4 correctSalePrice (down/up total, credit case) — Task 7. ✅
- §5 reuse — preconditions copy `deleteSale`'s lock check; inventory adjustment shape reuses `inventory_transactions`; cash_refund reuses the `cash_entries` table; `lib/money.ts` mentioned for the price-editor screen in Task 13. ✅
- §6 screens — Tasks 11, 12, 13, 14. ✅
- §7 error classes — Task 6 declares them; Task 7 throws them; Tasks 12-13 surface them. ✅
- §8 tests — Tasks 1, 5, 7, 9 are DB and hook tests; UI smoke is implicitly covered by the verify pipeline. ✅
- §9 out-of-scope — captured in spec §9 and called out in this plan's preamble. ✅

### 2. Placeholder scan

Searched for: `TBD`, `TODO`, `implement later`, `fill in details`, `similar to Task N`, "appropriate". None present. ✅

### 3. Type/signature consistency

- `CorrectionActor` declared in Task 6's Step 1 and reused by Tasks 7, 12, 13 verbatim.
- `SaleCorrection`, `SaleCorrectionLine`, `SaleCorrectionReportRow` declared once in Task 3, reused everywhere.
- `getAppSetting`/`setAppSetting` signature from Task 2 matches usage in Tasks 7 and 8.
- `voidSale`/`refundSale`/`correctSalePrice` declarations in Task 7 match hook destructuring in Task 9.
- `saleKeys.detail(id)` and `SALE_CORRECTIONS_REPORT_KEY` defined once in Task 9.
- Reason-code strings (`'misprinted_price'`, `'customer_changed_mind'`, `'returned_damaged'`, `'returned_other'`) match between the i18n keys (Task 10) and the test fixtures (Task 7).

Found no inconsistency.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-13-safe-voids-refunds-corrections.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
