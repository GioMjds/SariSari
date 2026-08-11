# Utang Guardrails at Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live credit-guardrail panel to the credit checkout flow — showing outstanding balance, limit status, and overdue state — with a soft warn and a hard block (per-customer toggle) plus a recordable owner override reason.

**Architecture:** New `CustomerCreditSummary` type + `getCustomerCreditSummary` DB fn + `useCustomerCreditSummary` hook feeds three presentational components (`SukiPanel`, `OverrideReasonModal`, `OverrideReasonLabel`) in a new `components/utang/credit-guardrails/` folder. Screen integrations for Add Credit, Add Sales (credit path), and Customer Details wire the panel without moving business logic into screens.

**Tech Stack:** Expo SDK 54 / React Native 0.81, better-sqlite3 (tests), TanStack Query v5, react-hook-form v7, NativeWind v4 (`className`), Moti, Jest + `jest-environment-node`.

## Global Constraints

- Money is integer pesos in SQLite. All formatting via `formatPesos` from `lib/money.ts`. No `toFixed`, no inline string concat.
- `isNearLimit` / `wouldExceedLimit` are JS derivations on the caller side (not in the DB fn). The DB fn returns `availableCredit` only.
- Migration block follows `await db.withTransactionAsync(...)` + idempotent column-check pattern. `PRAGMA user_version = 16` at the end.
- One SQLite handle: import `db` from `@/configs/sqlite`. Never call `openDatabaseSync` / `openDatabaseAsync` elsewhere.
- TypeScript strict mode + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. New code must compile cleanly.
- Path alias `@/*` maps to repo root.
- Test files live in `tests/` (matching `jest.config.ts`). Run with `npm test -- -t "<pattern>"`.
- No emojis or special characters in code or comments.

---

## File Map

| File                                                                | Action                                                                                              |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `database/migrations.ts`                                            | Modify — add migration v16 block                                                                    |
| `types/credits.types.ts`                                            | Modify — add `CustomerCreditSummary`, `OverrideReasonCode`                                          |
| `database/credits.ts`                                               | Modify — add `getCustomerCreditSummary`                                                             |
| `hooks/useCredits.ts`                                               | Modify — add `useCustomerCreditSummary`, update invalidations                                       |
| `hooks/index.ts`                                                    | No change — already `export *` from `useCredits`                                                    |
| `components/utang/credit-guardrails/SukiPanel.tsx`                  | Create                                                                                              |
| `components/utang/credit-guardrails/OverrideReasonModal.tsx`        | Create                                                                                              |
| `components/utang/credit-guardrails/OverrideReasonLabel.tsx`        | Create                                                                                              |
| `components/utang/credit-guardrails/index.ts`                       | Create                                                                                              |
| `components/utang/add-credit/useAddCreditForm.ts`                   | Modify — add `overrideReason` state, forward to `useInsertCredit`                                   |
| `app/(edit-forms)/add-credit/[id].tsx`                              | Modify — render `SukiPanel` + override modal                                                        |
| `database/sales.ts`                                                 | Modify — `insertSale` accepts optional override params, writes to `sales` and `credit_transactions` |
| `types/sales.types.ts`                                              | Modify — add override fields to `InsertSaleParams`                                                  |
| `hooks/useSales.ts`                                                 | Modify — forward override fields in `insertSaleMutation`                                            |
| `components/sales/add-sales/useAddSalesForm.ts`                     | Modify — add `overrideReason` state + guardrail logic                                               |
| `app/(edit-forms)/add-sales/index.tsx`                              | Modify — render `SukiPanel` on credit path                                                          |
| `app/(edit-forms)/credit-details/[id].tsx`                          | Modify — render `SukiPanel` in detailed mode                                                        |
| `tests/database/migrations-v16.test.ts`                             | Create                                                                                              |
| `tests/database/get-customer-credit-summary.test.ts`                | Create                                                                                              |
| `tests/database/insert-credit-with-override.test.ts`                | Create                                                                                              |
| `tests/database/insert-sale-with-override.test.ts`                  | Create                                                                                              |
| `tests/components/utang/SukiPanel.test.tsx`                         | Create                                                                                              |
| `tests/components/utang/OverrideReasonModal.test.tsx`               | Create                                                                                              |
| `docs/activity-log.md`                                              | Modify — add feature entry                                                                          |
| `obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md`     | Modify — status Shipped                                                                             |
| `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` | Modify — feature 5 shipped                                                                          |

---

### Task 1: Migration v16

**Files:**

- Modify: `database/migrations.ts` (append after the `currentVersion < 15` block)
- Test: `tests/database/migrations-v16.test.ts`

**Interfaces:**

- Produces: `customers.block_on_exceed INTEGER NOT NULL DEFAULT 0`, `customers.overdue_threshold_days INTEGER NOT NULL DEFAULT 30`, `sales.override_reason_code TEXT`, `sales.override_reason_note TEXT`, `credit_transactions.override_reason_code TEXT`, `credit_transactions.override_reason_note TEXT`

- [ ] **Step 1: Write the failing test**

Create `tests/database/migrations-v16.test.ts`:

```ts
import { runMigrations } from '@/database/migrations';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

beforeEach(() => {
  resetMockDb();
});

async function columnNames(table: string): Promise<string[]> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  return cols.map((c) => c.name);
}

describe('migration v16 — utang guardrails columns', () => {
  it('adds block_on_exceed and overdue_threshold_days to customers', async () => {
    await runMigrations();
    const cols = await columnNames('customers');
    expect(cols).toContain('block_on_exceed');
    expect(cols).toContain('overdue_threshold_days');
  });

  it('adds override columns to sales', async () => {
    await runMigrations();
    const cols = await columnNames('sales');
    expect(cols).toContain('override_reason_code');
    expect(cols).toContain('override_reason_note');
  });

  it('adds override columns to credit_transactions', async () => {
    await runMigrations();
    const cols = await columnNames('credit_transactions');
    expect(cols).toContain('override_reason_code');
    expect(cols).toContain('override_reason_note');
  });

  it('sets PRAGMA user_version to 16 after migration', async () => {
    await runMigrations();
    const rows = await db.getAllAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(rows[0]?.user_version).toBe(16);
  });

  it('is idempotent — running migrations twice does not error', async () => {
    await runMigrations();
    await expect(runMigrations()).resolves.not.toThrow();
  });

  it('block_on_exceed defaults to 0', async () => {
    await runMigrations();
    await db.runAsync(`INSERT INTO customers (name) VALUES (?)`, ['TestSuki']);
    const row = await db.getFirstAsync<{ block_on_exceed: number }>(
      `SELECT block_on_exceed FROM customers WHERE name = ?`,
      ['TestSuki'],
    );
    expect(row?.block_on_exceed).toBe(0);
  });

  it('overdue_threshold_days defaults to 30', async () => {
    await runMigrations();
    await db.runAsync(`INSERT INTO customers (name) VALUES (?)`, ['TestSuki2']);
    const row = await db.getFirstAsync<{ overdue_threshold_days: number }>(
      `SELECT overdue_threshold_days FROM customers WHERE name = ?`,
      ['TestSuki2'],
    );
    expect(row?.overdue_threshold_days).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- -t "migration v16"
```

Expected: FAIL — "column block_on_exceed does not exist" or similar.

- [ ] **Step 3: Add migration v16 to `database/migrations.ts`**

Append this block immediately before the closing `}` of `runMigrations()` (after the `currentVersion < 15` block):

```ts
if (currentVersion < 16) {
  console.log('Running migration to version 16 (Utang Guardrails)...');
  await db.withTransactionAsync(async () => {
    const customerCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(customers)',
    );
    const hasBlockOnExceed = customerCols.some(
      (c) => c.name === 'block_on_exceed',
    );
    const hasOverdueDays = customerCols.some(
      (c) => c.name === 'overdue_threshold_days',
    );
    if (!hasBlockOnExceed) {
      await db.execAsync(
        'ALTER TABLE customers ADD COLUMN block_on_exceed INTEGER NOT NULL DEFAULT 0;',
      );
    }
    if (!hasOverdueDays) {
      await db.execAsync(
        'ALTER TABLE customers ADD COLUMN overdue_threshold_days INTEGER NOT NULL DEFAULT 30;',
      );
    }

    const salesCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(sales)',
    );
    const hasSalesCode = salesCols.some(
      (c) => c.name === 'override_reason_code',
    );
    if (!hasSalesCode) {
      await db.execAsync(
        'ALTER TABLE sales ADD COLUMN override_reason_code TEXT;',
      );
      await db.execAsync(
        'ALTER TABLE sales ADD COLUMN override_reason_note TEXT;',
      );
    }

    const ctCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(credit_transactions)',
    );
    const hasCtCode = ctCols.some((c) => c.name === 'override_reason_code');
    if (!hasCtCode) {
      await db.execAsync(
        'ALTER TABLE credit_transactions ADD COLUMN override_reason_code TEXT;',
      );
      await db.execAsync(
        'ALTER TABLE credit_transactions ADD COLUMN override_reason_note TEXT;',
      );
    }

    await db.execAsync('PRAGMA user_version = 16;');
  });
  console.log('Database migrated to version 16.');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- -t "migration v16"
```

Expected: PASS — all 7 tests green.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add database/migrations.ts tests/database/migrations-v16.test.ts
git commit -m "feat: migration v16 — utang guardrail columns"
```

---

### Task 2: Types

**Files:**

- Modify: `types/credits.types.ts`

**Interfaces:**

- Produces:
  - `OverrideReasonCode` type
  - `CustomerCreditSummary` interface

- [ ] **Step 1: Append types to `types/credits.types.ts`**

Add at the end of the file:

```ts
export type OverrideReasonCode =
  | 'regular_customer'
  | 'long_term_suki'
  | 'partial_payment_promised'
  | 'owner_discretion'
  | 'other';

export interface CustomerCreditSummary {
  customerId: number;
  balance: number;
  creditLimit: number | null;
  availableCredit: number | null;
  blockOnExceed: boolean;
  oldestUnpaidDueDate: string | null;
  overdueDays: number | null;
  overdueThresholdDays: number;
  isOverdue: boolean;
  isNearLimit: boolean;
  wouldExceedLimit: boolean;
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add types/credits.types.ts
git commit -m "feat: add CustomerCreditSummary and OverrideReasonCode types"
```

---

### Task 3: Database function `getCustomerCreditSummary`

**Files:**

- Modify: `database/credits.ts`
- Test: `tests/database/get-customer-credit-summary.test.ts`

**Interfaces:**

- Consumes: `CustomerCreditSummary` from `@/types/credits.types`
- Produces: `getCustomerCreditSummary(customerId: number): Promise<CustomerCreditSummary | null>`

- [ ] **Step 1: Write the failing test**

Create `tests/database/get-customer-credit-summary.test.ts`:

```ts
import { runMigrations } from '@/database/migrations';
import { initCreditsTable, getCustomerCreditSummary } from '@/database/credits';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

beforeEach(async () => {
  resetMockDb();
  await runMigrations();
  await initCreditsTable();
});

async function insertCustomer(
  name: string,
  creditLimit: number | null = null,
  blockOnExceed = false,
  overdueThresholdDays = 30,
): Promise<number> {
  const r = await db.runAsync(
    `INSERT INTO customers (name, credit_limit, block_on_exceed, overdue_threshold_days)
     VALUES (?, ?, ?, ?)`,
    [name, creditLimit, blockOnExceed ? 1 : 0, overdueThresholdDays],
  );
  return r.lastInsertRowId;
}

describe('getCustomerCreditSummary', () => {
  it('returns null when customer does not exist', async () => {
    const result = await getCustomerCreditSummary(9999);
    expect(result).toBeNull();
  });

  it('customer with no credits: balance 0, not overdue, no limit', async () => {
    const id = await insertCustomer('NoCredit');
    const result = await getCustomerCreditSummary(id);
    expect(result).not.toBeNull();
    expect(result!.balance).toBe(0);
    expect(result!.isOverdue).toBe(false);
    expect(result!.creditLimit).toBeNull();
    expect(result!.availableCredit).toBeNull();
    expect(result!.isNearLimit).toBe(false);
    expect(result!.wouldExceedLimit).toBe(false);
  });

  it('credit_limit null: limit/near-limit indicators are null/false', async () => {
    const id = await insertCustomer('NoLimit', null);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, date)
       VALUES (?, 100, 'unpaid', 0, date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.creditLimit).toBeNull();
    expect(result!.availableCredit).toBeNull();
    expect(result!.isNearLimit).toBe(false);
    expect(result!.wouldExceedLimit).toBe(false);
  });

  it('balance 100 vs limit 500: available 400, not near limit', async () => {
    const id = await insertCustomer('SmallBalance', 500);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, date)
       VALUES (?, 100, 'unpaid', 0, date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.balance).toBe(100);
    expect(result!.availableCredit).toBe(400);
    expect(result!.isNearLimit).toBe(false);
    expect(result!.wouldExceedLimit).toBe(false);
  });

  it('balance 420 vs limit 500: available 80, isNearLimit true (16% <= 20%)', async () => {
    const id = await insertCustomer('NearLimit', 500);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, date)
       VALUES (?, 420, 'unpaid', 0, date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.balance).toBe(420);
    expect(result!.availableCredit).toBe(80);
    expect(result!.isNearLimit).toBe(true);
    expect(result!.wouldExceedLimit).toBe(false);
  });

  it('balance 600 vs limit 500: available -100, wouldExceedLimit true', async () => {
    const id = await insertCustomer('OverLimit', 500);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, date)
       VALUES (?, 600, 'unpaid', 0, date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.balance).toBe(600);
    expect(result!.availableCredit).toBe(-100);
    expect(result!.wouldExceedLimit).toBe(true);
    expect(result!.isNearLimit).toBe(true);
  });

  it('overdue 29 days vs threshold 30: isOverdue false', async () => {
    const id = await insertCustomer('Almost', 500, false, 30);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, due_date, date)
       VALUES (?, 100, 'unpaid', 0, date('now', '-29 days'), date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.isOverdue).toBe(false);
  });

  it('overdue 31 days vs threshold 30: isOverdue true', async () => {
    const id = await insertCustomer('Overdue', 500, false, 30);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, due_date, date)
       VALUES (?, 100, 'unpaid', 0, date('now', '-31 days'), date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.isOverdue).toBe(true);
    expect(result!.overdueDays).toBeGreaterThan(30);
  });

  it('paid credits excluded from balance and overdue', async () => {
    const id = await insertCustomer('Paid', 500, false, 30);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, due_date, date)
       VALUES (?, 200, 'paid', 200, date('now', '-60 days'), date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.balance).toBe(0);
    expect(result!.isOverdue).toBe(false);
  });

  it('overdue_threshold_days 0: any past due date is overdue', async () => {
    const id = await insertCustomer('ZeroThreshold', 500, false, 0);
    await db.runAsync(
      `INSERT INTO credit_transactions (customer_id, amount, status, amount_paid, due_date, date)
       VALUES (?, 100, 'unpaid', 0, date('now', '-1 days'), date('now'))`,
      [id],
    );
    const result = await getCustomerCreditSummary(id);
    expect(result!.isOverdue).toBe(true);
  });

  it('blockOnExceed is mapped from integer column correctly', async () => {
    const id = await insertCustomer('BlockedSuki', 500, true, 30);
    const result = await getCustomerCreditSummary(id);
    expect(result!.blockOnExceed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- -t "getCustomerCreditSummary"
```

Expected: FAIL — "getCustomerCreditSummary is not a function".

- [ ] **Step 3: Add import to `database/credits.ts`**

Add `CustomerCreditSummary` and `OverrideReasonCode` to the type import at the top of `database/credits.ts`:

```ts
import {
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerCreditSummary,
  CustomerInsights,
  CustomerTimelineItem,
  CustomerWithDetails,
  ExtendedCreditFilter,
  LoyaltyTier,
  NewCredit,
  NewCustomer,
  NewPayment,
  OverrideReasonCode,
  Payment,
} from '@/types/credits.types';
```

- [ ] **Step 4: Implement `getCustomerCreditSummary` in `database/credits.ts`**

Add the function at the end of the file:

```ts
/**
 * Returns a live credit-guardrail summary for a single customer.
 *
 * Three reads, no transaction — pure reads with no side effects.
 * isNearLimit and wouldExceedLimit are derived here from balance only
 * (no pendingTotal — callers project the cart total at their layer).
 *
 * Money is integer pesos throughout; no float arithmetic.
 */
export const getCustomerCreditSummary = async (
  customerId: number,
): Promise<CustomerCreditSummary | null> => {
  // 1. Customer config row
  const configRow = await db.getFirstAsync<{
    id: number;
    credit_limit: number | null;
    block_on_exceed: number;
    overdue_threshold_days: number;
  }>(
    `SELECT id, credit_limit, block_on_exceed, overdue_threshold_days
     FROM customers WHERE id = ?`,
    [customerId],
  );
  if (!configRow) return null;

  const creditLimit = configRow.credit_limit ?? null;
  const blockOnExceed = configRow.block_on_exceed === 1;
  const overdueThresholdDays = configRow.overdue_threshold_days;

  // 2. Balance — canonical query matching getOutstandingBalance
  const balanceRow = await db.getFirstAsync<{ balance: number }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) AS balance
     FROM credit_transactions
     WHERE customer_id = ? AND status != 'paid'`,
    [customerId],
  );
  const balance = balanceRow?.balance ?? 0;

  // 3. Overdue — oldest unpaid past-due credit
  const overdueRow = await db.getFirstAsync<{
    days_overdue: number | null;
    oldest_due_date: string | null;
  }>(
    `SELECT MIN(julianday('now') - julianday(due_date)) AS days_overdue,
            MIN(due_date) AS oldest_due_date
     FROM credit_transactions
     WHERE customer_id = ? AND status != 'paid'
       AND due_date IS NOT NULL
       AND due_date < date('now')`,
    [customerId],
  );

  const rawDaysOverdue = overdueRow?.days_overdue ?? null;
  const overdueDays =
    rawDaysOverdue !== null ? Math.floor(rawDaysOverdue) : null;
  const oldestUnpaidDueDate = overdueRow?.oldest_due_date ?? null;
  const isOverdue = overdueDays !== null && overdueDays > overdueThresholdDays;

  // JS derivations — no pendingTotal here (callers apply projection)
  const availableCredit = creditLimit === null ? null : creditLimit - balance;

  const isNearLimit =
    creditLimit !== null &&
    availableCredit !== null &&
    availableCredit / creditLimit <= 0.2;

  const wouldExceedLimit =
    creditLimit !== null && availableCredit !== null && availableCredit < 0;

  return {
    customerId,
    balance,
    creditLimit,
    availableCredit,
    blockOnExceed,
    oldestUnpaidDueDate,
    overdueDays,
    overdueThresholdDays,
    isOverdue,
    isNearLimit,
    wouldExceedLimit,
  };
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- -t "getCustomerCreditSummary"
```

Expected: PASS — all tests green.

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add database/credits.ts tests/database/get-customer-credit-summary.test.ts
git commit -m "feat: getCustomerCreditSummary DB function"
```

---

### Task 4: Hook `useCustomerCreditSummary` + invalidation wiring

**Files:**

- Modify: `hooks/useCredits.ts`

**Interfaces:**

- Consumes: `getCustomerCreditSummary` from `@/database/credits`, `CustomerCreditSummary` from `@/types/credits.types`
- Produces: `useCustomerCreditSummary(customerId?: number | string, opts?: object)`

- [ ] **Step 1: Add import and hook to `hooks/useCredits.ts`**

In the DB function import at the top, add `getCustomerCreditSummary`:

```ts
import {
  deleteCreditTransaction,
  deleteCustomer,
  deletePayment,
  getAllCustomers,
  getCreditHistory,
  getCreditKPIs,
  getCreditTransactionsByCustomer,
  getCustomer,
  getCustomerCreditSummary,
  getCustomerFavoriteProduct,
  getCustomerInsights,
  getCustomerTimeline,
  getCustomerWithDetails,
  getPaymentsByCustomer,
  insertCreditTransaction,
  insertCustomer,
  insertPayment,
  markAllCreditsAsPaid,
  searchCustomers,
  updateCreditStatus,
  updateCustomer,
} from '@/database/credits';
```

In the type import, add `CustomerCreditSummary`:

```ts
import type {
  CreditFilter,
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerCreditSummary,
  CustomerWithDetails,
  NewCredit,
  NewCustomer,
  NewPayment,
  Payment,
  CustomerTimelineItem,
  CustomerInsights,
} from '@/types/credits.types';
```

Append the hook at the end of the file:

```ts
export function useCustomerCreditSummary(
  customerId?: number | string,
  opts = {},
) {
  const parsedId =
    typeof customerId === 'string' ? parseInt(customerId, 10) : customerId;
  return useQuery<CustomerCreditSummary | null>({
    queryKey: ['customer-credit-summary', parsedId],
    queryFn: () =>
      parsedId ? getCustomerCreditSummary(parsedId) : Promise.resolve(null),
    enabled: !!parsedId,
    staleTime: 60 * 1000,
    ...opts,
  });
}
```

- [ ] **Step 2: Add `'customer-credit-summary'` invalidation to `useInsertCredit` onSuccess**

After the existing `queryClient.invalidateQueries({ queryKey: ['credit-history', customerId] })` call inside the `if (customerId)` block:

```ts
queryClient.invalidateQueries({
  queryKey: ['customer-credit-summary', customerId],
});
```

- [ ] **Step 3: Add `'customer-credit-summary'` invalidation to `useInsertPayment` onSuccess**

After the existing `queryClient.invalidateQueries({ queryKey: ['credit-kpis'] })` call:

```ts
queryClient.invalidateQueries({
  queryKey: ['customer-credit-summary', vars.customer_id],
});
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add hooks/useCredits.ts
git commit -m "feat: useCustomerCreditSummary hook + invalidation wiring"
```

---

### Task 5: Presentational components

**Files:**

- Create: `components/utang/credit-guardrails/SukiPanel.tsx`
- Create: `components/utang/credit-guardrails/OverrideReasonModal.tsx`
- Create: `components/utang/credit-guardrails/OverrideReasonLabel.tsx`
- Create: `components/utang/credit-guardrails/index.ts`
- Test: `tests/components/utang/SukiPanel.test.tsx`
- Test: `tests/components/utang/OverrideReasonModal.test.tsx`

**Interfaces:**

- Consumes: `CustomerCreditSummary`, `OverrideReasonCode` from `@/types/credits.types`; `formatPesos` from `@/lib/money`
- Produces:
  - `SukiPanel({ summary: CustomerCreditSummary; pendingTotal?: number; mode: 'compact' | 'detailed'; onRequestOverride?: () => void })`
  - `OverrideReasonModal({ visible: boolean; onClose: () => void; onSubmit: (result: OverrideReasonResult) => void })`
  - `OverrideReasonResult = { code: OverrideReasonCode; note: string | null }`
  - `OverrideReasonLabel({ code: OverrideReasonCode })`
  - `OVERRIDE_REASON_LABELS: Record<OverrideReasonCode, { label: string; description: string }>`

- [ ] **Step 1: Write failing tests**

Create `tests/components/utang/SukiPanel.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SukiPanel } from '@/components/utang/credit-guardrails/SukiPanel';
import type { CustomerCreditSummary } from '@/types/credits.types';

const baseSummary: CustomerCreditSummary = {
  customerId: 1,
  balance: 0,
  creditLimit: null,
  availableCredit: null,
  blockOnExceed: false,
  oldestUnpaidDueDate: null,
  overdueDays: null,
  overdueThresholdDays: 30,
  isOverdue: false,
  isNearLimit: false,
  wouldExceedLimit: false,
};

describe('SukiPanel', () => {
  it('returns null when no limit, not overdue, no pendingTotal (compact mode)', () => {
    const { toJSON } = render(
      <SukiPanel summary={baseSummary} mode="compact" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('detailed mode always shows balance even with no limit and no overdue', () => {
    const { getByText } = render(
      <SukiPanel summary={baseSummary} mode="detailed" />,
    );
    expect(getByText(/Outstanding/i)).toBeTruthy();
  });

  it('shows near-limit chip when isNearLimit and not wouldExceed', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      creditLimit: 500,
      balance: 420,
      availableCredit: 80,
      isNearLimit: true,
      wouldExceedLimit: false,
    };
    const { getByText } = render(
      <SukiPanel summary={summary} mode="compact" />,
    );
    expect(getByText(/Almost at limit/i)).toBeTruthy();
  });

  it('shows exceeded warning (non-blocking) when wouldExceed and blockOnExceed false', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      creditLimit: 500,
      balance: 600,
      availableCredit: -100,
      isNearLimit: true,
      wouldExceedLimit: true,
      blockOnExceed: false,
    };
    const { getByText } = render(
      <SukiPanel summary={summary} mode="compact" />,
    );
    expect(getByText(/Over limit by/i)).toBeTruthy();
  });

  it('shows block banner with CTA when wouldExceed and blockOnExceed true', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      creditLimit: 500,
      balance: 600,
      availableCredit: -100,
      isNearLimit: true,
      wouldExceedLimit: true,
      blockOnExceed: true,
    };
    const onRequestOverride = jest.fn();
    const { getByText } = render(
      <SukiPanel
        summary={summary}
        mode="compact"
        onRequestOverride={onRequestOverride}
      />,
    );
    expect(getByText(/Over limit/i)).toBeTruthy();
    expect(getByText(/Record override/i)).toBeTruthy();
  });

  it('shows overdue badge when isOverdue', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      isOverdue: true,
      overdueDays: 35,
    };
    const { getByText } = render(
      <SukiPanel summary={summary} mode="detailed" />,
    );
    expect(getByText(/Overdue/i)).toBeTruthy();
    expect(getByText(/35/)).toBeTruthy();
  });

  it('pendingTotal projects available and shows soft warning when soft-exceeded', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      creditLimit: 500,
      balance: 400,
      availableCredit: 100,
      isNearLimit: true,
      wouldExceedLimit: false,
      blockOnExceed: false,
    };
    // pendingTotal 150 pushes available to -50 -> soft exceeded warning
    const { getByText } = render(
      <SukiPanel summary={summary} mode="compact" pendingTotal={150} />,
    );
    expect(getByText(/Over limit by/i)).toBeTruthy();
  });

  it('money strings use peso symbol', () => {
    const summary: CustomerCreditSummary = {
      ...baseSummary,
      creditLimit: 500,
      balance: 200,
      availableCredit: 300,
      isNearLimit: false,
      wouldExceedLimit: false,
    };
    const { getByText } = render(
      <SukiPanel summary={summary} mode="detailed" />,
    );
    expect(getByText(/\u20b1200\.00/)).toBeTruthy();
  });
});
```

Create `tests/components/utang/OverrideReasonModal.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OverrideReasonModal } from '@/components/utang/credit-guardrails/OverrideReasonModal';

describe('OverrideReasonModal', () => {
  it('renders all five override reason labels', () => {
    const { getByText } = render(
      <OverrideReasonModal visible onClose={jest.fn()} onSubmit={jest.fn()} />,
    );
    expect(getByText(/Regular Customer/i)).toBeTruthy();
    expect(getByText(/Long-term Suki/i)).toBeTruthy();
    expect(getByText(/Partial Payment Promised/i)).toBeTruthy();
    expect(getByText(/Owner Discretion/i)).toBeTruthy();
    expect(getByText(/Other/i)).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { toJSON } = render(
      <OverrideReasonModal
        visible={false}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it('selecting regular_customer calls onSubmit with correct shape', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <OverrideReasonModal visible onClose={jest.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByText(/Regular Customer/i));
    expect(onSubmit).toHaveBeenCalledWith({
      code: 'regular_customer',
      note: null,
    });
  });

  it("selecting 'other' reveals note input; submit disabled until note filled", () => {
    const onSubmit = jest.fn();
    const { getByText, queryByPlaceholderText } = render(
      <OverrideReasonModal visible onClose={jest.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByText(/Other/i));
    const input = queryByPlaceholderText(/Add a note/i);
    expect(input).toBeTruthy();
    // No submit yet — note is empty
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.changeText(input!, 'Will pay Friday');
    fireEvent.press(getByText(/Submit/i));
    expect(onSubmit).toHaveBeenCalledWith({
      code: 'other',
      note: 'Will pay Friday',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- -t "SukiPanel"
npm test -- -t "OverrideReasonModal"
```

Expected: FAIL — "Cannot find module".

- [ ] **Step 3: Create `components/utang/credit-guardrails/SukiPanel.tsx`**

```tsx
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { CustomerCreditSummary } from '@/types/credits.types';

export interface SukiPanelProps {
  summary: CustomerCreditSummary;
  pendingTotal?: number;
  mode: 'compact' | 'detailed';
  onRequestOverride?: () => void;
}

export function SukiPanel({
  summary,
  pendingTotal,
  mode,
  onRequestOverride,
}: SukiPanelProps) {
  const pending = pendingTotal ?? 0;

  // Projected available: creditLimit - balance - pending
  const projectedAvailable =
    summary.creditLimit !== null
      ? summary.creditLimit - summary.balance - pending
      : null;

  const projectedWouldExceed =
    summary.creditLimit !== null &&
    projectedAvailable !== null &&
    projectedAvailable < 0;

  const projectedNearLimit =
    summary.creditLimit !== null &&
    projectedAvailable !== null &&
    !projectedWouldExceed &&
    projectedAvailable / summary.creditLimit <= 0.2;

  // In compact mode, hide entirely when there is nothing to show
  if (
    mode === 'compact' &&
    summary.creditLimit === null &&
    !summary.isOverdue &&
    pending === 0
  ) {
    return null;
  }

  const overAmount =
    projectedAvailable !== null && projectedAvailable < 0
      ? Math.abs(projectedAvailable)
      : 0;

  return (
    <View className="bg-paper-50 border border-ink-150 rounded-xl p-3 gap-2">
      {/* Outstanding row — always shown */}
      <View className="flex-row items-center justify-between">
        <StyledText variant="medium" className="text-ink-500 text-xs">
          Outstanding
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-sm">
          {formatPesos(summary.balance)}
        </StyledText>
      </View>

      {/* Limit + available rows */}
      {summary.creditLimit !== null && (
        <>
          <View className="flex-row items-center justify-between">
            <StyledText variant="medium" className="text-ink-500 text-xs">
              Limit
            </StyledText>
            <StyledText variant="medium" className="text-ink-700 text-sm">
              {formatPesos(summary.creditLimit)}
            </StyledText>
          </View>
          {projectedAvailable !== null && (
            <View className="flex-row items-center justify-between">
              <StyledText variant="medium" className="text-ink-500 text-xs">
                Available
              </StyledText>
              <StyledText
                variant="extrabold"
                className={
                  projectedAvailable < 0
                    ? 'text-red-600 text-sm'
                    : 'text-ink-900 text-sm'
                }
              >
                {formatPesos(projectedAvailable)}
              </StyledText>
            </View>
          )}
        </>
      )}

      {/* Overdue badge */}
      {summary.isOverdue && summary.overdueDays !== null && (
        <View className="bg-red-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-red-700 text-xs">
            {`Overdue \u00b7 ${summary.overdueDays} days`}
          </StyledText>
        </View>
      )}

      {/* Near-limit chip */}
      {projectedNearLimit && summary.creditLimit !== null && (
        <View className="bg-amber-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-amber-700 text-xs">
            Almost at limit
          </StyledText>
        </View>
      )}

      {/* Exceeded — soft warning (non-blocking) */}
      {projectedWouldExceed && !summary.blockOnExceed && (
        <View className="bg-red-100 px-2 py-1 rounded-full self-start">
          <StyledText variant="semibold" className="text-red-700 text-xs">
            {`Over limit by ${formatPesos(overAmount)}`}
          </StyledText>
        </View>
      )}

      {/* Exceeded — hard block banner with CTA */}
      {projectedWouldExceed && summary.blockOnExceed && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 gap-2">
          <StyledText variant="semibold" className="text-red-800 text-sm">
            Over limit \u00b7 requires owner override
          </StyledText>
          {onRequestOverride && (
            <Pressable
              onPress={onRequestOverride}
              className="bg-red-600 rounded-lg px-3 py-2 items-center"
            >
              <StyledText variant="semibold" className="text-white text-sm">
                Record override
              </StyledText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Create `components/utang/credit-guardrails/OverrideReasonModal.tsx`**

```tsx
import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import type { OverrideReasonCode } from '@/types/credits.types';

export interface OverrideReasonResult {
  code: OverrideReasonCode;
  note: string | null;
}

export interface OverrideReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: OverrideReasonResult) => void;
}

export const OVERRIDE_REASON_LABELS: Record<
  OverrideReasonCode,
  { label: string; description: string }
> = {
  regular_customer: {
    label: 'Regular Customer',
    description: 'Trusted suki with consistent payment history.',
  },
  long_term_suki: {
    label: 'Long-term Suki',
    description: 'Customer has been buying for a long time.',
  },
  partial_payment_promised: {
    label: 'Partial Payment Promised',
    description: 'Customer committed to pay part of the balance today.',
  },
  owner_discretion: {
    label: 'Owner Discretion',
    description: 'Owner approves this credit on their own judgment.',
  },
  other: {
    label: 'Other',
    description: 'Explain the reason below.',
  },
};

const REASON_CODES: OverrideReasonCode[] = [
  'regular_customer',
  'long_term_suki',
  'partial_payment_promised',
  'owner_discretion',
  'other',
];

export function OverrideReasonModal({
  visible,
  onClose,
  onSubmit,
}: OverrideReasonModalProps) {
  const [selectedCode, setSelectedCode] = useState<OverrideReasonCode | null>(
    null,
  );
  const [note, setNote] = useState('');

  if (!visible) return null;

  const handleSelect = (code: OverrideReasonCode) => {
    if (code !== 'other') {
      setSelectedCode(null);
      setNote('');
      onSubmit({ code, note: null });
    } else {
      setSelectedCode(code);
    }
  };

  const handleSubmitOther = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    onSubmit({ code: 'other', note: trimmed });
    setSelectedCode(null);
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-paper-50 rounded-t-2xl p-4 gap-4">
          <View className="flex-row items-center justify-between">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Override Reason
            </StyledText>
            <Pressable onPress={onClose} hitSlop={8}>
              <StyledText variant="medium" className="text-ink-500 text-sm">
                Cancel
              </StyledText>
            </Pressable>
          </View>

          {REASON_CODES.map((code) => {
            const { label, description } = OVERRIDE_REASON_LABELS[code];
            return (
              <Pressable
                key={code}
                onPress={() => handleSelect(code)}
                className="border border-ink-150 rounded-xl p-3 gap-1"
              >
                <StyledText variant="semibold" className="text-ink-900 text-sm">
                  {label}
                </StyledText>
                <StyledText variant="regular" className="text-ink-500 text-xs">
                  {description}
                </StyledText>
              </Pressable>
            );
          })}

          {selectedCode === 'other' && (
            <View className="gap-2">
              <TextInput
                placeholder="Add a note"
                value={note}
                onChangeText={setNote}
                multiline
                className="border border-ink-200 rounded-xl p-3 text-ink-900 min-h-20"
              />
              <Pressable
                onPress={handleSubmitOther}
                disabled={!note.trim()}
                className={`rounded-xl px-4 py-3 items-center ${note.trim() ? 'bg-primary-600' : 'bg-ink-200'}`}
              >
                <StyledText
                  variant="semibold"
                  className={
                    note.trim() ? 'text-white text-sm' : 'text-ink-400 text-sm'
                  }
                >
                  Submit
                </StyledText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 5: Create `components/utang/credit-guardrails/OverrideReasonLabel.tsx`**

```tsx
import { StyledText } from '@/components/elements';
import type { OverrideReasonCode } from '@/types/credits.types';
import { OVERRIDE_REASON_LABELS } from './OverrideReasonModal';

interface OverrideReasonLabelProps {
  code: OverrideReasonCode;
}

export function OverrideReasonLabel({ code }: OverrideReasonLabelProps) {
  return (
    <StyledText variant="medium" className="text-ink-600 text-xs">
      {OVERRIDE_REASON_LABELS[code]?.label ?? code}
    </StyledText>
  );
}
```

- [ ] **Step 6: Create `components/utang/credit-guardrails/index.ts`**

```ts
export { SukiPanel } from './SukiPanel';
export type { SukiPanelProps } from './SukiPanel';
export {
  OverrideReasonModal,
  OVERRIDE_REASON_LABELS,
} from './OverrideReasonModal';
export type {
  OverrideReasonModalProps,
  OverrideReasonResult,
} from './OverrideReasonModal';
export { OverrideReasonLabel } from './OverrideReasonLabel';
```

- [ ] **Step 7: Run tests**

```bash
npm test -- -t "SukiPanel"
npm test -- -t "OverrideReasonModal"
```

Expected: PASS — all tests green.

- [ ] **Step 8: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add components/utang/credit-guardrails/
git add tests/components/utang/SukiPanel.test.tsx
git add tests/components/utang/OverrideReasonModal.test.tsx
git commit -m "feat: SukiPanel, OverrideReasonModal, OverrideReasonLabel components"
```

---

### Task 6: Override metadata on insert — DB, types, hooks

Thread override reason through the write path. Both `insertCreditTransaction` and `insertSale` write `override_reason_code` / `override_reason_note` when supplied.

**Files:**

- Modify: `types/credits.types.ts` — extend `NewCredit`
- Modify: `database/credits.ts` — extend `insertCreditTransaction`
- Modify: `types/sales.types.ts` — extend `InsertSaleParams`
- Modify: `database/sales.ts` — extend `insertSale`
- Modify: `hooks/useSales.ts` — forward new fields in `insertSaleMutation`
- Test: `tests/database/insert-credit-with-override.test.ts`
- Test: `tests/database/insert-sale-with-override.test.ts`

**Interfaces:**

- Consumes: `OverrideReasonCode` from `@/types/credits.types`
- Produces:
  - `NewCredit` gains `overrideReasonCode?: OverrideReasonCode`, `overrideReasonNote?: string | null`
  - `insertCreditTransaction(credit: NewCredit): Promise<number>` — unchanged signature, new optional fields written
  - `InsertSaleParams` gains `overrideReasonCode?: OverrideReasonCode`, `overrideReasonNote?: string | null`
  - `insertSale(items, payment_type, customer_name?, customer_credit_id?, overrideReasonCode?, overrideReasonNote?): Promise<number>` — two new optional trailing params

- [ ] **Step 1: Write failing tests**

Create `tests/database/insert-credit-with-override.test.ts`:

```ts
import { runMigrations } from '@/database/migrations';
import { initCreditsTable, insertCreditTransaction } from '@/database/credits';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

beforeEach(async () => {
  resetMockDb();
  await runMigrations();
  await initCreditsTable();
  await db.runAsync(`INSERT INTO customers (name) VALUES (?)`, ['TestSuki']);
});

describe('insertCreditTransaction with override', () => {
  it('stores override_reason_code and null note for regular_customer', async () => {
    const id = await insertCreditTransaction({
      customer_id: 1,
      amount: 100,
      overrideReasonCode: 'regular_customer',
      overrideReasonNote: null,
    });
    const row = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
    }>(
      `SELECT override_reason_code, override_reason_note
       FROM credit_transactions WHERE id = ?`,
      [id],
    );
    expect(row?.override_reason_code).toBe('regular_customer');
    expect(row?.override_reason_note).toBeNull();
  });

  it('stores override_reason_code = other with a note', async () => {
    const id = await insertCreditTransaction({
      customer_id: 1,
      amount: 100,
      overrideReasonCode: 'other',
      overrideReasonNote: 'Will pay Friday',
    });
    const row = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
    }>(
      `SELECT override_reason_code, override_reason_note
       FROM credit_transactions WHERE id = ?`,
      [id],
    );
    expect(row?.override_reason_code).toBe('other');
    expect(row?.override_reason_note).toBe('Will pay Friday');
  });

  it('without override fields, both columns are null', async () => {
    const id = await insertCreditTransaction({
      customer_id: 1,
      amount: 100,
    });
    const row = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
    }>(
      `SELECT override_reason_code, override_reason_note
       FROM credit_transactions WHERE id = ?`,
      [id],
    );
    expect(row?.override_reason_code).toBeNull();
    expect(row?.override_reason_note).toBeNull();
  });
});
```

Create `tests/database/insert-sale-with-override.test.ts`:

```ts
import { runMigrations } from '@/database/migrations';
import { initCreditsTable } from '@/database/credits';
import { initSalesTables, insertSale } from '@/database/sales';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

beforeEach(async () => {
  resetMockDb();
  await runMigrations();
  await initCreditsTable();
  await initSalesTables();
  await db.runAsync(`INSERT INTO customers (id, name) VALUES (1, 'TestSuki')`);
  await db.runAsync(
    `INSERT INTO products (id, name, price, quantity, retail_unit_name, sku)
     VALUES (1, 'Softdrink', 25, 100, 'Pc', 'SKU001')`,
  );
});

describe('insertSale with override (credit sale)', () => {
  it('writes override code and null note to sales and linked credit_transactions', async () => {
    const saleId = await insertSale(
      [{ product_id: 1, quantity: 1, price: 25 }],
      'credit',
      'TestSuki',
      1,
      'owner_discretion',
      null,
    );

    const saleRow = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
      credit_transaction_id: number | null;
    }>(
      `SELECT override_reason_code, override_reason_note, credit_transaction_id
       FROM sales WHERE id = ?`,
      [saleId],
    );
    expect(saleRow?.override_reason_code).toBe('owner_discretion');
    expect(saleRow?.override_reason_note).toBeNull();

    const ctRow = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
    }>(
      `SELECT override_reason_code, override_reason_note
       FROM credit_transactions WHERE id = ?`,
      [saleRow!.credit_transaction_id],
    );
    expect(ctRow?.override_reason_code).toBe('owner_discretion');
    expect(ctRow?.override_reason_note).toBeNull();
  });

  it('writes other code + note to both tables', async () => {
    const saleId = await insertSale(
      [{ product_id: 1, quantity: 2, price: 25 }],
      'credit',
      'TestSuki',
      1,
      'other',
      'Festival padek',
    );

    const saleRow = await db.getFirstAsync<{
      override_reason_code: string | null;
      override_reason_note: string | null;
      credit_transaction_id: number | null;
    }>(
      `SELECT override_reason_code, override_reason_note, credit_transaction_id
       FROM sales WHERE id = ?`,
      [saleId],
    );
    expect(saleRow?.override_reason_code).toBe('other');
    expect(saleRow?.override_reason_note).toBe('Festival padek');

    const ctRow = await db.getFirstAsync<{
      override_reason_code: string | null;
    }>(`SELECT override_reason_code FROM credit_transactions WHERE id = ?`, [
      saleRow!.credit_transaction_id,
    ]);
    expect(ctRow?.override_reason_code).toBe('other');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- -t "insertCreditTransaction with override"
npm test -- -t "insertSale with override"
```

Expected: FAIL.

- [ ] **Step 3: Extend `NewCredit` in `types/credits.types.ts`**

Replace the existing `NewCredit` interface:

```ts
export interface NewCredit {
  customer_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity?: number | null;
  amount: number;
  due_date?: string | null;
  notes?: string | null;
  overrideReasonCode?: OverrideReasonCode;
  overrideReasonNote?: string | null;
}
```

- [ ] **Step 4: Extend `insertCreditTransaction` in `database/credits.ts`**

Replace the body of `insertCreditTransaction`:

```ts
export const insertCreditTransaction = async (
  credit: NewCredit,
): Promise<number> => {
  const timestamp = getCurrentLocalTimestamp();
  const result = await db.runAsync(
    `INSERT INTO credit_transactions
     (customer_id, product_id, product_name, quantity, amount, due_date, notes,
      status, date, override_reason_code, override_reason_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?)`,
    [
      credit.customer_id,
      credit.product_id || null,
      credit.product_name || null,
      credit.quantity || null,
      credit.amount,
      credit.due_date || null,
      credit.notes || null,
      timestamp,
      credit.overrideReasonCode || null,
      credit.overrideReasonNote || null,
    ],
  );
  return result.lastInsertRowId;
};
```

- [ ] **Step 5: Extend `InsertSaleParams` in `types/sales.types.ts`**

Add import at the top of the file:

```ts
import type { OverrideReasonCode } from '@/types/credits.types';
```

Replace the `InsertSaleParams` interface:

```ts
export interface InsertSaleParams {
  items: {
    product_id: number;
    quantity: number;
    price: number;
    selected_unit?: 'retail' | 'wholesale';
    sold_unit_name?: string;
    sold_unit_qty?: number;
    conversion_factor?: number | null;
  }[];
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  overrideReasonCode?: OverrideReasonCode;
  overrideReasonNote?: string | null;
}
```

- [ ] **Step 6: Extend `insertSale` signature in `database/sales.ts`**

Replace the function signature line:

```ts
export const insertSale = async (
  items: InsertSaleItemInput[],
  payment_type: 'cash' | 'credit' = 'cash',
  customer_name?: string,
  customer_credit_id?: number,
  overrideReasonCode?: string | null,
  overrideReasonNote?: string | null,
): Promise<number> => {
```

Replace step 2 (insert sale header) — the `db.runAsync` call that inserts into `sales`:

```ts
const saleResult = await db.runAsync(
  `INSERT INTO sales
       (total, payment_type, customer_name, customer_credit_id, timestamp,
        override_reason_code, override_reason_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    total,
    payment_type,
    customer_name || null,
    customer_credit_id || null,
    timestamp,
    overrideReasonCode || null,
    overrideReasonNote || null,
  ],
);
```

Replace step 4 credit INSERT inside the `if (payment_type === 'credit')` block:

```ts
const creditResult = await db.runAsync(
  `INSERT INTO credit_transactions
         (customer_id, amount, status, date, override_reason_code, override_reason_note)
         VALUES (?, ?, 'unpaid', ?, ?, ?)`,
  [
    customer_credit_id,
    total,
    timestamp,
    overrideReasonCode || null,
    overrideReasonNote || null,
  ],
);
```

- [ ] **Step 7: Forward override fields in `hooks/useSales.ts` `insertSaleMutation`**

Replace the `mutationFn` destructuring:

```ts
const insertSaleMutation = useMutation({
  mutationFn: ({
    items,
    payment_type,
    customer_name,
    customer_credit_id,
    overrideReasonCode,
    overrideReasonNote,
  }: InsertSaleParams) =>
    insertSale(
      items,
      payment_type,
      customer_name,
      customer_credit_id,
      overrideReasonCode,
      overrideReasonNote,
    ),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: salesKeys.all });
    queryClient.invalidateQueries({ queryKey: salesKeys.salesStats });
    queryClient.invalidateQueries({
      queryKey: salesKeys.byDateRange('recent', '10'),
    });
    queryClient.invalidateQueries({ queryKey: salesKeys.product(0) });
    queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    queryClient.invalidateQueries({ queryKey: salesKeys.creditTransactions });
    queryClient.invalidateQueries({ queryKey: salesKeys.customers });
    queryClient.invalidateQueries({ queryKey: salesKeys.creditKpis });
  },
});
```

- [ ] **Step 8: Run tests**

```bash
npm test -- -t "insertCreditTransaction with override"
npm test -- -t "insertSale with override"
```

Expected: PASS — all tests green.

- [ ] **Step 9: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add types/credits.types.ts database/credits.ts
git add types/sales.types.ts database/sales.ts hooks/useSales.ts
git add tests/database/insert-credit-with-override.test.ts
git add tests/database/insert-sale-with-override.test.ts
git commit -m "feat: thread override metadata through credit and sale insert paths"
```

---

### Task 7: Screen integrations

Wire `SukiPanel` and override flow into Add Credit, Add Sales, and Customer Details.

**Files:**

- Modify: `components/utang/add-credit/useAddCreditForm.ts`
- Modify: `app/(edit-forms)/add-credit/[id].tsx`
- Modify: `components/sales/add-sales/useAddSalesForm.ts`
- Modify: `app/(edit-forms)/add-sales/index.tsx`
- Modify: `app/(edit-forms)/credit-details/[id].tsx`

**Interfaces:**

- Consumes: `useCustomerCreditSummary` from `@/hooks`; `SukiPanel`, `OverrideReasonModal`, `OverrideReasonResult` from `@/components/utang/credit-guardrails`

- [ ] **Step 1: Extend `components/utang/add-credit/useAddCreditForm.ts`**

Add these imports at the top:

```ts
import { useCustomerCreditSummary } from '@/hooks';
import type { OverrideReasonResult } from '@/components/utang/credit-guardrails';
import type { OverrideReasonCode } from '@/types/credits.types';
```

Inside `useAddCreditForm()`, after `const insertCredit = useInsertCredit();`, add:

```ts
const { data: creditSummary = null } = useCustomerCreditSummary(id);

const [overrideReason, setOverrideReason] =
  useState<OverrideReasonResult | null>(null);
const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
const [showSoftWarnModal, setShowSoftWarnModal] = useState<boolean>(false);
```

After the existing `total` derivation, add:

```ts
const projectedAvailable =
  creditSummary?.creditLimit != null
    ? creditSummary.creditLimit - creditSummary.balance - total
    : null;

const projectedWouldExceedLimit =
  creditSummary?.creditLimit != null &&
  projectedAvailable !== null &&
  projectedAvailable < 0;

const submitIsBlockedByGuardrail =
  projectedWouldExceedLimit &&
  (creditSummary?.blockOnExceed ?? false) &&
  overrideReason === null;
```

Replace the `submit` function:

```ts
const submit = handleSubmit((data) => {
  const buildCredits = (): NewCredit[] => {
    const overrideFields = overrideReason
      ? {
          overrideReasonCode: overrideReason.code as OverrideReasonCode,
          overrideReasonNote: overrideReason.note,
        }
      : {};

    const credits: NewCredit[] = ticketItems.map((item) => ({
      customer_id: Number(id),
      ...(item.product_id != null ? { product_id: item.product_id } : {}),
      ...(item.product_name ? { product_name: item.product_name } : {}),
      quantity: item.quantity,
      amount: item.amount,
      due_date: data.dueDate?.trim() || null,
      notes: data.notes?.trim() || null,
      ...overrideFields,
    }));

    if (productName?.trim() && amount) {
      credits.push({
        customer_id: Number(id),
        ...(selectedProduct?.id != null
          ? { product_id: selectedProduct.id }
          : {}),
        product_name: selectedProduct
          ? selectedProduct.name
          : productName.trim(),
        quantity: quantity ? parseInt(quantity, 10) : null,
        amount: qtyNum * tryParsePesosInput(amount),
        due_date: data.dueDate?.trim() || null,
        notes: data.notes?.trim() || null,
        ...overrideFields,
      });
    }
    return credits;
  };

  if (submitIsBlockedByGuardrail) return;

  // Soft warn path — prompt but allow continuation without override
  if (
    projectedWouldExceedLimit &&
    !(creditSummary?.blockOnExceed ?? false) &&
    overrideReason === null
  ) {
    setShowSoftWarnModal(true);
    return;
  }

  const credits = buildCredits();
  if (credits.length === 0) return;
  insertCredit.mutate(credits);
  setOverrideReason(null);
});
```

Update `isSubmitDisabled`:

```ts
const isSubmitDisabled =
  insertCredit.isPending ||
  (ticketItems.length === 0 && (!productName?.trim() || !amount)) ||
  submitIsBlockedByGuardrail;
```

Add new items to the return object:

```ts
    creditSummary,
    overrideReason,
    setOverrideReason,
    showOverrideModal,
    setShowOverrideModal,
    showSoftWarnModal,
    setShowSoftWarnModal,
    projectedWouldExceedLimit,
    submitIsBlockedByGuardrail,
```

- [ ] **Step 2: Replace `app/(edit-forms)/add-credit/[id].tsx`**

```tsx
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AddCreditHeader,
  CreditTicketSheet,
  SubmitButton,
  useAddCreditForm,
} from '@/components/utang/add-credit';
import {
  SukiPanel,
  OverrideReasonModal,
} from '@/components/utang/credit-guardrails';
import { StyledText } from '@/components/elements';

export default function AddCreditTransaction() {
  const form = useAddCreditForm();
  const q = form.productQuery.trim().toLowerCase();
  const productSuggestions = !q
    ? form.products.slice(0, 6)
    : form.products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q),
        )
        .slice(0, 6);

  if (!form.customer) return null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AddCreditHeader
        customer={form.customer}
        onBack={() => form.router.back()}
      />

      <View className="px-4 gap-3">
        {form.creditSummary && (
          <SukiPanel
            summary={form.creditSummary}
            pendingTotal={form.total}
            mode="compact"
            onRequestOverride={() => form.setShowOverrideModal(true)}
          />
        )}

        <CreditTicketSheet
          control={form.control}
          quantity={form.quantity}
          amount={form.amount}
          dueDate={form.dueDate}
          productName={form.productName}
          selectedProduct={form.selectedProduct}
          productDropdownOpen={form.productDropdownOpen}
          setProductDropdownOpen={form.setProductDropdownOpen}
          duePreset={form.duePreset}
          productSuggestions={productSuggestions}
          qtyNum={form.qtyNum}
          unitPrice={form.unitPrice}
          total={form.total}
          ticketItems={form.ticketItems}
          itemCount={form.itemCount}
          onProductSelect={form.handleProductSelect}
          onProductNameChange={form.handleProductNameChange}
          onBumpQuantity={form.bumpQuantity}
          onPresetSelect={form.handlePresetSelect}
          onClearProduct={form.clearProduct}
          onAddItemToTicket={form.addCurrentToTicket}
          onRemoveItemFromTicket={form.removeTicketItem}
        />

        <SubmitButton
          disabled={form.isSubmitDisabled}
          isPending={form.insertCredit.isPending}
          total={form.total}
          hasProductName={form.ticketItems.length > 0 || !!form.productName}
          onPress={form.submit}
        />
      </View>

      {/* Soft warn modal */}
      <Modal
        visible={form.showSoftWarnModal}
        transparent
        animationType="fade"
        onRequestClose={() => form.setShowSoftWarnModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 gap-4 w-full">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Suki is over limit
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm">
              You can continue without an override, or record a reason.
            </StyledText>
            <View className="gap-2">
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.submit();
                }}
                className="bg-ink-200 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  Continue without override
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.setShowOverrideModal(true);
                }}
                className="bg-primary-600 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-white text-sm">
                  Record override reason
                </StyledText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OverrideReasonModal
        visible={form.showOverrideModal}
        onClose={() => form.setShowOverrideModal(false)}
        onSubmit={(result) => {
          form.setOverrideReason(result);
          form.setShowOverrideModal(false);
          form.submit();
        }}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Extend `components/sales/add-sales/useAddSalesForm.ts`**

Add imports at the top:

```ts
import { useCustomerCreditSummary } from '@/hooks';
import type { OverrideReasonResult } from '@/components/utang/credit-guardrails';
import type { OverrideReasonCode } from '@/types/credits.types';
```

Inside `useAddSalesForm()`, after `const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);`, add:

```ts
const [overrideReason, setOverrideReason] =
  useState<OverrideReasonResult | null>(null);
const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
const [showSoftWarnModal, setShowSoftWarnModal] = useState<boolean>(false);
```

After `const { data: customers = [] } = useCustomers();`, add:

```ts
const selectedCustomerId =
  typeof selectedCustomer === 'object' && selectedCustomer !== null
    ? selectedCustomer.id
    : undefined;

const { data: creditSummary = null } =
  useCustomerCreditSummary(selectedCustomerId);
```

After the existing `total` derivation (after the `isSubmitDisabled` const), add:

```ts
const projectedAvailable =
  creditSummary?.creditLimit != null && paymentType === 'credit'
    ? creditSummary.creditLimit - creditSummary.balance - total
    : null;

const projectedWouldExceedLimit =
  creditSummary?.creditLimit != null &&
  projectedAvailable !== null &&
  projectedAvailable < 0 &&
  paymentType === 'credit';

const submitIsBlockedByGuardrail =
  projectedWouldExceedLimit &&
  (creditSummary?.blockOnExceed ?? false) &&
  overrideReason === null;
```

Update `isSubmitDisabled`:

```ts
const isSubmitDisabled =
  insertSaleMutation.isPending ||
  cartItems.length === 0 ||
  (paymentType === 'credit' && !selectedCustomer) ||
  submitIsBlockedByGuardrail;
```

Replace the `submit` function:

```ts
const submit = useCallback(async () => {
  if (cartItems.length === 0 || insertSaleMutation.isPending) return;

  if (submitIsBlockedByGuardrail) return;

  if (
    projectedWouldExceedLimit &&
    !(creditSummary?.blockOnExceed ?? false) &&
    overrideReason === null
  ) {
    setShowSoftWarnModal(true);
    return;
  }

  try {
    await insertSaleMutation.mutateAsync({
      items: cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        selected_unit: item.selected_unit,
      })),
      payment_type: paymentType,
      ...(typeof selectedCustomer === 'string'
        ? { customer_name: selectedCustomer }
        : selectedCustomer?.name != null
          ? { customer_name: selectedCustomer.name }
          : {}),
      ...(typeof selectedCustomer !== 'string' && selectedCustomer?.id != null
        ? { customer_credit_id: selectedCustomer.id }
        : {}),
      ...(overrideReason
        ? {
            overrideReasonCode: overrideReason.code as OverrideReasonCode,
            overrideReasonNote: overrideReason.note,
          }
        : {}),
    });

    setOverrideReason(null);
    clearCart();
    router.back();
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      Alert.alert(
        'Stock changed',
        `Only ${err.available} of ${err.requested} available now. Please refresh.`,
      );
      return;
    }
    Alert.alert('Error', 'Failed to complete sale. Please try again.');
  }
}, [
  cartItems,
  paymentType,
  selectedCustomer,
  insertSaleMutation,
  clearCart,
  overrideReason,
  projectedWouldExceedLimit,
  submitIsBlockedByGuardrail,
  creditSummary,
]);
```

Add new items to the return object:

```ts
    creditSummary,
    overrideReason,
    setOverrideReason,
    showOverrideModal,
    setShowOverrideModal,
    showSoftWarnModal,
    setShowSoftWarnModal,
    projectedWouldExceedLimit,
    submitIsBlockedByGuardrail,
    selectedCustomerId,
```

- [ ] **Step 4: Update `app/(edit-forms)/add-sales/index.tsx`**

Add imports:

```tsx
import {
  SukiPanel,
  OverrideReasonModal,
} from '@/components/utang/credit-guardrails';
import { StyledText } from '@/components/elements';
```

After `<CartSummaryTray .../>`'s closing tag and before `</View>` (the inner `<View className="flex-1">`), insert the panel. The panel must only show when `paymentType === 'credit'` and a real customer object is selected:

```tsx
{
  form.paymentType === 'credit' &&
    form.creditSummary &&
    typeof form.selectedCustomer === 'object' &&
    form.selectedCustomer !== null && (
      <View className="px-4 pb-2">
        <SukiPanel
          summary={form.creditSummary}
          pendingTotal={form.total}
          mode="compact"
          onRequestOverride={() => form.setShowOverrideModal(true)}
        />
      </View>
    );
}
```

After the existing discard `<Modal>` closing tag, add:

```tsx
      {/* Soft warn modal */}
      <Modal
        visible={form.showSoftWarnModal}
        transparent
        animationType="fade"
        onRequestClose={() => form.setShowSoftWarnModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 gap-4 w-full">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Suki is over limit
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm">
              You can continue or record a reason.
            </StyledText>
            <View className="gap-2">
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.submit();
                }}
                className="bg-ink-200 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  Continue without override
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.setShowOverrideModal(true);
                }}
                className="bg-primary-600 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-white text-sm">
                  Record override reason
                </StyledText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OverrideReasonModal
        visible={form.showOverrideModal}
        onClose={() => form.setShowOverrideModal(false)}
        onSubmit={(result) => {
          form.setOverrideReason(result);
          form.setShowOverrideModal(false);
          form.submit();
        }}
      />
```

Also add `Pressable` to the `react-native` import if not already present.

- [ ] **Step 5: Update `app/(edit-forms)/credit-details/[id].tsx`**

Add imports:

```tsx
import { SukiPanel } from '@/components/utang/credit-guardrails';
import { useCustomerCreditSummary } from '@/hooks';
```

Inside `CustomerDetails()`, after the existing `const { data: history = [] } = useCreditHistory(id);` line, add:

```tsx
const { data: creditSummary = null } = useCustomerCreditSummary(id);
```

Inside the `<View className="px-4">` block that wraps `<CustomerHeroCard .../>`, add the panel immediately after the hero card closing tag:

```tsx
{
  creditSummary && (
    <View className="mt-3">
      <SukiPanel summary={creditSummary} mode="detailed" />
    </View>
  );
}
```

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add components/utang/add-credit/useAddCreditForm.ts
git add "app/(edit-forms)/add-credit/[id].tsx"
git add components/sales/add-sales/useAddSalesForm.ts
git add "app/(edit-forms)/add-sales/index.tsx"
git add "app/(edit-forms)/credit-details/[id].tsx"
git commit -m "feat: integrate SukiPanel and override flow into Add Credit, Add Sales, Customer Details"
```

---

### Task 8: Full verification + documentation

**Files:**

- Modify: `docs/activity-log.md`
- Modify: `obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md`
- Modify: `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md`

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests pass. Zero failures.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Add activity log entry to `docs/activity-log.md`**

Prepend a new entry at the top of the log:

```markdown
## 2026-08-11 - Utang Guardrails at Checkout (Feature 5)

**What shipped:**

- Migration v16: added `block_on_exceed`, `overdue_threshold_days` to `customers`;
  `override_reason_code`, `override_reason_note` to `sales` and `credit_transactions`.
- `getCustomerCreditSummary` DB function (pure reads, integer math only).
- `useCustomerCreditSummary` TanStack Query hook (1-minute stale time).
  Invalidated by `useInsertCredit` and `useInsertPayment`.
- `SukiPanel`, `OverrideReasonModal`, `OverrideReasonLabel` components
  in `components/utang/credit-guardrails/`.
- Override reasons stored on both `sales` and `credit_transactions` rows for audit queries.

**Rollback recipe (SQLite 3.35+ required for DROP COLUMN):**
ALTER TABLE customers DROP COLUMN block_on_exceed;
ALTER TABLE customers DROP COLUMN overdue_threshold_days;
ALTER TABLE sales DROP COLUMN override_reason_code;
ALTER TABLE sales DROP COLUMN override_reason_note;
ALTER TABLE credit_transactions DROP COLUMN override_reason_code;
ALTER TABLE credit_transactions DROP COLUMN override_reason_note;
PRAGMA user_version = 15;
```

- [ ] **Step 4: Update Obsidian feature note status to Shipped**

In `obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md`, change the status to:

```
Status: Shipped - spec: docs/superpowers/specs/2026-08-11-utang-guardrails-at-checkout-design.md
```

- [ ] **Step 5: Update roadmap status**

In `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md`, update Feature 5's row to Shipped and add the spec link.

- [ ] **Step 6: Final commit**

```bash
git add docs/activity-log.md
git add "obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md"
git add "obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md"
git commit -m "docs: activity log and vault status for utang guardrails feature"
```

---

## Self-Review

### Spec coverage

| Spec requirement                           | Task |
| ------------------------------------------ | ---- |
| Migration v16 — 6 columns                  | 1    |
| Idempotent column checks                   | 1    |
| `PRAGMA user_version = 16`                 | 1    |
| `OverrideReasonCode` type                  | 2    |
| `CustomerCreditSummary` interface          | 2    |
| `getCustomerCreditSummary` DB function     | 3    |
| Balance canonical query                    | 3    |
| Overdue query + `Math.floor`               | 3    |
| `isNearLimit` = available/limit <= 0.20    | 3    |
| `wouldExceedLimit` = available < 0         | 3    |
| `blockOnExceed` boolean mapping            | 3    |
| `useCustomerCreditSummary` hook            | 4    |
| 1-minute staleTime                         | 4    |
| Invalidation on insert/payment             | 4    |
| `SukiPanel` hide logic                     | 5    |
| Detailed mode always shows                 | 5    |
| Near-limit amber chip                      | 5    |
| Exceeded soft warning chip                 | 5    |
| Exceeded block banner + CTA                | 5    |
| Overdue badge                              | 5    |
| `pendingTotal` projection                  | 5    |
| All money via `formatPesos`                | 5    |
| `OverrideReasonModal` 5 codes              | 5    |
| `other` reveals free-text input            | 5    |
| `OVERRIDE_REASON_LABELS` exported          | 5    |
| `OverrideReasonLabel` component            | 5    |
| Override on `insertCreditTransaction`      | 6    |
| Override on `insertSale` (both tables)     | 6    |
| Add Credit — `SukiPanel` render            | 7    |
| Add Credit — submit disabled on hard block | 7    |
| Add Credit — soft warn modal               | 7    |
| Add Credit — override modal                | 7    |
| Add Sales — panel on credit path only      | 7    |
| Add Sales — soft warn + override flow      | 7    |
| Customer Details — panel detailed mode     | 7    |
| Activity log + rollback recipe             | 8    |
| Obsidian status update                     | 8    |

All spec requirements are covered. No placeholders remain.

### Type consistency

- `getCustomerCreditSummary` returns `CustomerCreditSummary | null` used by `useCustomerCreditSummary<CustomerCreditSummary | null>` used by `SukiPanel({ summary: CustomerCreditSummary })` — consistent.
- `OverrideReasonResult.code: OverrideReasonCode` used in `NewCredit.overrideReasonCode?: OverrideReasonCode` and `InsertSaleParams.overrideReasonCode?: OverrideReasonCode` — consistent.
- `insertSale` trailing params are `string | null` (not the enum) to avoid circular imports from `database/sales.ts`; the type constraint lives at the `InsertSaleParams` layer where `OverrideReasonCode` is imported.
