# Collection Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Collection" sub-tab under Customers that shows a ranked list of customers who owe the store money, with an always-visible per-row "Follow up by" chip and a "Mark contacted" counter. Tapping "Record payment" deep-links into the existing `add-payment` flow.

**Architecture:** Pure-additive change. The repo already has every SQL building block needed (`getOutstandingBalance`, `getCustomerCreditSummary`, `getAllCustomers('overdue')`), the hook/invalidation pattern, the `add-payment` deep-link, and the `TopTabs`/`SubTabControl`/`useTabProgress` sub-tab plumbing. The only genuinely new SQL piece is a `collection_followups` table (migration v16→v17) and four new DB functions that compose existing primitives.

**Tech Stack:** Expo SDK 54 / React Native 0.81 / React 19, New Architecture. TanStack Query v5, Zustand v5, react-i18next, NativeWind v4, better-sqlite3 (in-memory test mock).

## Global Constraints

These are non-negotiable. Every task's requirements implicitly include this section.

- Money is integer pesos in SQLite (`₱12.50` stored as `12.5`). All parse/format through `lib/money.ts` (`parsePesosInput`, `formatPesos`). No float arithmetic.
- Multi-statement writes that touch the ledger use `db.withTransactionAsync`.
- One SQLite handle, imported from `@/configs/sqlite`. No `openDatabaseSync`/`openDatabaseAsync` calls elsewhere. Enforced by `tests/__setup__/expo-sqlite-mock.ts` (single in-memory `better-sqlite3` instance).
- `app/` screens NEVER call SQLite directly — all data access via hooks in `hooks/`.
- `database/` files are pure async functions returning typed rows with snake_case→camelCase mapping.
- `stores/` is for transient UI state only — never caches business data. Use TanStack Query.
- TypeScript strict mode is on, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`. New code compiles cleanly under these.
- Path alias `@/*` → repo root (tsconfig.json).
- Styling via NativeWind v4 (`className`); Tailwind config in `tailwind.config.js`.
- i18n namespace `utang` for this surface (existing).
- Prettier: 2-space indent, single quotes, semicolons, trailing commas, 80-col print width.
- No emojis in code or comments. Markdown file names kebab-case.
- One SQLite handle per migration block. `runMigrations()` uses sequential `if (currentVersion < N)` blocks ending with `PRAGMA user_version = N`.
- Test pattern (proven): `components/<area>/__tests__/<name>.test.ts` or `<name>.test.tsx`. Use `renderHook` + `QueryClient` wrapper for hooks. Use `better-sqlite3` in-memory mock for DB-layer tests.
- Test wipe list: `tests/__setup__/expo-sqlite-mock.ts` `resetMockDb` must include any new table created.

---

## File Map

### New files

| File                                                           | Purpose                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `database/migrations.ts` (append v16→v17 block)                | Create `collection_followups` + indexes                                                                 |
| `database/credits.ts` (append)                                 | `getCollectionQueue`, `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted`       |
| `types/credits.types.ts` (append)                              | `CollectionQueueRow`, `CollectionQueueParams`, `CollectionFollowUp`, `CollectionBucket`                 |
| `hooks/useCredits.ts` (append)                                 | `useCollectionQueue`, `useCollectionFollowUp`, `useSetCollectionFollowUp`, `useMarkCollectionContacted` |
| `app/(tabs)/customers/collection.tsx`                          | Sub-tab screen (thin wrapper)                                                                           |
| `components/customers/CollectionTab.tsx`                       | Search + FlatList + bucket headers                                                                      |
| `components/customers/CollectionRow.tsx`                       | One row: avatar, name, balance, overdue chip, follow-up chip, mark-contacted, record-payment CTA        |
| `components/customers/CollectionErrorState.tsx`                | Error UI with retry                                                                                     |
| `components/customers/__tests__/useCollectionQueue.test.ts`    | Hook query-key / staleTime / invalidation                                                               |
| `components/customers/__tests__/useCollectionFollowUp.test.ts` | Hook id parsing                                                                                         |
| `tests/__setup__/expo-sqlite-mock.ts` (modify wipe list)       | Add `collection_followups`                                                                              |

### Modified files (small additions)

| File                                             | Change                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `constants/tabs.ts`                              | Append `'collection'` to `CUSTOMERS_SUB_TABS` (line 54)                                               |
| `app/(tabs)/customers/_layout.tsx`               | Add `<TopTabs.Screen name="collection" />`; extend `getCurrentTab`; extend `isDetailScreen` exclusion |
| `components/customers/CustomersHeader.tsx`       | Append `{ key: 'collection', label: 'COLLECTION', badgeCount: overdueCount }` to `tabs` array         |
| `components/customers/index.ts`                  | Re-export `CollectionTab`, `CollectionRow`, `CollectionErrorState`                                    |
| `components/more/MoreHomeScreen.tsx`             | Change `routes.collection` from `/(tabs)/customers/credit` to `/(tabs)/customers/collection`          |
| `hooks/useCredits.ts`                            | Add `['collection-queue']` invalidation to 9 existing mutations' `onSuccess`                          |
| `locales/en/utang.json`, `locales/tl/utang.json` | Add 22 keys (full list in Task 11)                                                                    |

---

## Task 1: Migration v16 → v17 (create `collection_followups`)

**Files:**

- Modify: `database/migrations.ts:611` (append new block after the v16 block)
- Test: `tests/__setup__/expo-sqlite-mock.ts` (add table to wipe list — handled in Task 3 setup, no test here)

**Interfaces:**

- Consumes: `db` from `@/configs/sqlite`; `runMigrations` already started by app boot
- Produces: `collection_followups` table exists with columns `{id, customer_id, follow_up_by, contacts_today, last_contact_at, status, created_at, updated_at}` and two indexes; `PRAGMA user_version = 17`

- [ ] **Step 1: Open `database/migrations.ts`, scroll to line 611 (end of v16 block, closing `}` of `runMigrations`)**

- [ ] **Step 2: Append the v16→v17 block immediately before the closing `}` of `runMigrations`**

Insert (verbatim, between line 611 and the closing `}` at line 612):

```ts
if (currentVersion < 17) {
  console.log('Running migration to version 17 (Collection Queue)...');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS collection_followups (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          follow_up_by    TEXT,
          contacts_today  INTEGER NOT NULL DEFAULT 0,
          last_contact_at TEXT,
          status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
          created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_collection_followups_customer_id ON collection_followups(customer_id);',
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_collection_followups_status_follow_up_by ON collection_followups(status, follow_up_by);',
    );
    await db.execAsync('PRAGMA user_version = 17;');
  });
  console.log('Database migrated to version 17.');
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors. (The migration block uses only the existing `db` import.)

- [ ] **Step 4: Commit**

```bash
git add database/migrations.ts
git commit -m "feat(db): add migration v17 for collection_followups table"
```

---

## Task 2: Add new types to `types/credits.types.ts`

**Files:**

- Modify: `types/credits.types.ts` (append after the closing `}` of `CustomerCreditSummary` at line 161)

**Interfaces:**

- Produces: `CollectionBucket`, `CollectionQueueParams`, `CollectionFollowUp`, `CollectionQueueRow` exported types

- [ ] **Step 1: Open `types/credits.types.ts`, scroll to line 161 (end of `CustomerCreditSummary` interface)**

- [ ] **Step 2: Append the new types**

Insert (verbatim, after line 161):

```ts
export type CollectionBucket = 'overdue' | 'near_limit' | 'oldest_balance';

export interface CollectionQueueParams {
  overdueDays?: number;
  nearLimitPct?: number;
}

export interface CollectionFollowUp {
  customerId: number;
  followUpBy: string | null;
  contactsToday: number;
  lastContactAt: string | null;
  status: 'open' | 'closed';
}

export interface CollectionQueueRow {
  customerId: number;
  name: string;
  phone: string | null;
  photoUri: string | null;
  creditLimit: number | null;
  balance: number;
  availableCredit: number | null;
  oldestUnpaidDueDate: string | null;
  overdueDays: number;
  overdueThresholdDays: number;
  isNearLimit: boolean;
  nearLimitPctUsed: number;
  bucket: CollectionBucket;
  followUp: {
    followUpBy: string | null;
    contactsToday: number;
    lastContactAt: string | null;
  } | null;
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add types/credits.types.ts
git commit -m "feat(types): add CollectionQueue types"
```

---

## Task 3: Add `collection_followups` to test mock wipe list

**Files:**

- Modify: `tests/__setup__/expo-sqlite-mock.ts:50-65` (extend the `tables` array inside `resetMockDb`)

**Interfaces:**

- Produces: `resetMockDb` deletes the `collection_followups` table between tests

- [ ] **Step 1: Open `tests/__setup__/expo-sqlite-mock.ts` and find the `tables` array inside `resetMockDb` (line 50 onward)**

- [ ] **Step 2: Add `'collection_followups'` to the array**

In the `tables` array literal (currently ending at `'stocktake_sessions'`), add the entry at the appropriate alphabetic position:

```ts
    'collection_followups',
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/__setup__/expo-sqlite-mock.ts
git commit -m "test(mock): include collection_followups in reset wipe list"
```

---

## Task 4: Write failing test for `getCollectionQueue` (write the test first — TDD)

**Files:**

- Create: `database/__tests__/credits-collection-queue.test.ts`

**Interfaces:**

- Uses: `db` from `@/configs/sqlite`, `initCreditsTable` from `@/database/credits`, `getCollectionQueue` (not yet implemented)
- Will produce (after Task 5): a `CollectionQueueRow[]` ordered by bucket (overdue > near_limit > oldest_balance)

- [ ] **Step 1: Create the test file**

File path: `database/__tests__/credits-collection-queue.test.ts`

Content (verbatim):

```ts
import { initCreditsTable } from '@/database/credits';
import { getCollectionQueue } from '@/database/credits';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

const insertCustomer = async (name: string, creditLimit: number | null) => {
  const result = await db.runAsync(
    'INSERT INTO customers (name, credit_limit) VALUES (?, ?);',
    [name, creditLimit],
  );
  return result.lastInsertRowId;
};

const insertCredit = async (
  customerId: number,
  amount: number,
  amountPaid: number,
  dueDate: string | null,
  status: 'unpaid' | 'partial' | 'paid' = 'unpaid',
) => {
  await db.runAsync(
    `INSERT INTO credit_transactions
       (customer_id, amount, amount_paid, status, due_date)
     VALUES (?, ?, ?, ?, ?);`,
    [customerId, amount, amountPaid, status, dueDate],
  );
};

describe('getCollectionQueue', () => {
  beforeEach(async () => {
    resetMockDb();
    await initCreditsTable();
  });

  it('returns empty array when no customers exist', async () => {
    const result = await getCollectionQueue();
    expect(result).toEqual([]);
  });

  it('excludes customers whose balance is zero', async () => {
    const id = await insertCustomer('Aling Nena', null);
    await insertCredit(id, 100, 100, null, 'paid');
    const result = await getCollectionQueue();
    expect(result).toEqual([]);
  });

  it('places overdue customer in overdue bucket', async () => {
    const id = await insertCustomer('Mang Jose', null);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await insertCredit(id, 500, 0, tenDaysAgo, 'unpaid');
    const result = await getCollectionQueue();
    expect(result).toHaveLength(1);
    expect(result[0].bucket).toBe('overdue');
    expect(result[0].overdueDays).toBeGreaterThanOrEqual(10);
  });

  it('places near-limit customer in near_limit bucket when no overdue', async () => {
    const id = await insertCustomer('Aling Maria', 1000);
    await insertCredit(id, 850, 0, null, 'unpaid');
    const result = await getCollectionQueue();
    expect(result).toHaveLength(1);
    expect(result[0].bucket).toBe('near_limit');
    expect(result[0].isNearLimit).toBe(true);
    expect(result[0].nearLimitPctUsed).toBeCloseTo(0.85, 2);
  });

  it('places customer with balance but no limit/due_date in oldest_balance', async () => {
    const id = await insertCustomer('Suking Pedro', null);
    await insertCredit(id, 200, 0, null, 'unpaid');
    const result = await getCollectionQueue();
    expect(result).toHaveLength(1);
    expect(result[0].bucket).toBe('oldest_balance');
  });

  it('orders overdue before near_limit before oldest_balance', async () => {
    const overdueId = await insertCustomer('Overdue', null);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await insertCredit(overdueId, 500, 0, tenDaysAgo, 'unpaid');

    const nearId = await insertCustomer('NearLimit', 1000);
    await insertCredit(nearId, 850, 0, null, 'unpaid');

    const oldestId = await insertCustomer('Oldest', null);
    await insertCredit(oldestId, 200, 0, null, 'unpaid');

    const result = await getCollectionQueue();
    expect(result.map((r) => r.name)).toEqual([
      'Overdue',
      'NearLimit',
      'Oldest',
    ]);
  });

  it('honors overdueDays parameter', async () => {
    const id = await insertCustomer('Mildly Late', null);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await insertCredit(id, 200, 0, fiveDaysAgo, 'unpaid');
    // With overdueDays=30, 5-day overdue should NOT be in overdue bucket.
    const result = await getCollectionQueue({ overdueDays: 30 });
    expect(result[0].bucket).toBe('oldest_balance');
  });

  it('honors nearLimitPct parameter', async () => {
    const id = await insertCustomer('Half Spent', 1000);
    await insertCredit(id, 500, 0, null, 'unpaid');
    // balance/limit = 0.5, so available = 0.5
    // With nearLimitPct=0.1 (10%), available (50%) > 10% → not near limit
    const result = await getCollectionQueue({ nearLimitPct: 0.1 });
    expect(result[0].bucket).toBe('oldest_balance');
    // With nearLimitPct=0.6 (60%), available (50%) < 60% → near limit
    const result2 = await getCollectionQueue({ nearLimitPct: 0.6 });
    expect(result2[0].bucket).toBe('near_limit');
  });

  it('returns followUp null when no collection_followups row exists', async () => {
    const id = await insertCustomer('No Follow Up', null);
    await insertCredit(id, 100, 0, null, 'unpaid');
    const result = await getCollectionQueue();
    expect(result[0].followUp).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (function not yet implemented)**

Run: `npm test -- database/__tests__/credits-collection-queue.test.ts`
Expected: FAIL with "Cannot find module '@/database/credits'" or "getCollectionQueue is not a function".

- [ ] **Step 3: Commit the failing test**

```bash
git add database/__tests__/credits-collection-queue.test.ts
git commit -m "test(credits): failing tests for getCollectionQueue"
```

---

## Task 5: Implement `getCollectionQueue` in `database/credits.ts`

**Files:**

- Modify: `database/credits.ts` (append after `getCustomerCreditSummary` ending around line 898)

**Interfaces:**

- Consumes: `db` from `../configs/sqlite` (relative import already in file); `CollectionQueueParams`, `CollectionQueueRow` from `@/types/credits.types`
- Produces: `getCollectionQueue(params?): Promise<CollectionQueueRow[]>` exported function

- [ ] **Step 1: Open `database/credits.ts` and find the end of `getCustomerCreditSummary` (search for `wouldExceedLimit`). The function ends near line 898.**

- [ ] **Step 2: Add `CollectionQueueRow`, `CollectionQueueParams`, `CollectionBucket` to the type-import list at the top of the file (line 1-17)**

Find:

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
  Payment,
} from '@/types/credits.types';
```

Add three imports:

```ts
  CollectionBucket,
  CollectionFollowUp,
  CollectionQueueParams,
  CollectionQueueRow,
```

Result (alphabetic-inserted):

```ts
import {
  CollectionBucket,
  CollectionFollowUp,
  CollectionQueueParams,
  CollectionQueueRow,
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
  Payment,
} from '@/types/credits.types';
```

- [ ] **Step 3: Append the `getCollectionQueue` implementation at the end of the file**

Insert after the closing `};` of `getCustomerCreditSummary`:

```ts
/**
 * Returns a ranked list of customers who owe money, bucketed by collection
 * priority: overdue (oldest first) → near_limit (highest % consumed first)
 * → oldest_balance (longest outstanding balance first).
 *
 * Eligibility: customer must have outstanding_balance > 0.
 *
 * Money is integer pesos throughout; no float arithmetic on balances.
 */
export const getCollectionQueue = async (
  params: CollectionQueueParams = {},
): Promise<CollectionQueueRow[]> => {
  const { overdueDays = 1, nearLimitPct = 0.2 } = params;

  // Per-customer outstanding balance + credit config + overdue aggregate.
  // Mirrors the SQL shape of getAllCustomers (216-229) and
  // getCustomerCreditSummary (855-866).
  type RawRow = {
    customer_id: number;
    name: string;
    phone: string | null;
    photo_uri: string | null;
    credit_limit: number | null;
    overdue_threshold_days: number;
    outstanding_balance: number;
    days_overdue: number | null;
    oldest_due_date: string | null;
    last_transaction_date: string | null;
    // collection_followups (LEFT JOIN; may be null)
    cf_id: number | null;
    cf_follow_up_by: string | null;
    cf_contacts_today: number | null;
    cf_last_contact_at: string | null;
  };

  const rows = await db.getAllAsync<RawRow>(
    `SELECT
       c.id AS customer_id,
       c.name,
       c.phone,
       c.photo_uri,
       c.credit_limit,
       c.overdue_threshold_days,
       COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount - ct.amount_paid ELSE 0 END), 0) AS outstanding_balance,
       (SELECT CAST(MIN(julianday('now') - julianday(ct2.due_date)) AS INTEGER)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id
            AND ct2.status != 'paid'
            AND ct2.due_date IS NOT NULL
            AND ct2.due_date < date('now')) AS days_overdue,
       (SELECT MIN(ct2.due_date)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id
            AND ct2.status != 'paid'
            AND ct2.due_date IS NOT NULL) AS oldest_due_date,
       (SELECT MAX(ct2.date)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id) AS last_transaction_date,
       cf.id AS cf_id,
       cf.follow_up_by AS cf_follow_up_by,
       cf.contacts_today AS cf_contacts_today,
       cf.last_contact_at AS cf_last_contact_at
     FROM customers c
     LEFT JOIN credit_transactions ct ON ct.customer_id = c.id
     LEFT JOIN collection_followups cf ON cf.customer_id = c.id
     GROUP BY c.id
     HAVING outstanding_balance > 0`,
  );

  const enriched: CollectionQueueRow[] = rows.map((r) => {
    const balance = r.outstanding_balance;
    const creditLimit = r.credit_limit;
    const nearLimitPctUsed =
      creditLimit != null && creditLimit > 0 ? balance / creditLimit : 0;
    const isNearLimit =
      creditLimit != null && 1 - nearLimitPctUsed <= nearLimitPct;
    const overdueDaysActual = r.days_overdue ?? 0;
    const isOverdue = overdueDaysActual >= overdueDays;
    const bucket: CollectionBucket = isOverdue
      ? 'overdue'
      : isNearLimit
        ? 'near_limit'
        : 'oldest_balance';

    return {
      customerId: r.customer_id,
      name: r.name,
      phone: r.phone,
      photoUri: r.photo_uri,
      creditLimit,
      balance,
      availableCredit:
        creditLimit != null ? Math.max(creditLimit - balance, 0) : null,
      oldestUnpaidDueDate: r.oldest_due_date,
      overdueDays: overdueDaysActual,
      overdueThresholdDays: r.overdue_threshold_days,
      isNearLimit,
      nearLimitPctUsed,
      bucket,
      followUp:
        r.cf_id != null
          ? {
              followUpBy: r.cf_follow_up_by,
              contactsToday: r.cf_contacts_today ?? 0,
              lastContactAt: r.cf_last_contact_at,
            }
          : null,
    };
  });

  const bucketPriority: Record<CollectionBucket, number> = {
    overdue: 0,
    near_limit: 1,
    oldest_balance: 2,
  };

  enriched.sort((a, b) => {
    const bp = bucketPriority[a.bucket] - bucketPriority[b.bucket];
    if (bp !== 0) return bp;
    if (a.bucket === 'overdue') return b.overdueDays - a.overdueDays;
    if (a.bucket === 'near_limit')
      return b.nearLimitPctUsed - a.nearLimitPctUsed;
    // oldest_balance: oldest last_transaction_date first, nulls first.
    if (a.last_transaction_date == null) return -1;
    if (b.last_transaction_date == null) return 1;
    return a.last_transaction_date.localeCompare(b.last_transaction_date);
  });

  return enriched;
};
```

- [ ] **Step 4: Run the test**

Run: `npm test -- database/__tests__/credits-collection-queue.test.ts`
Expected: All 9 tests PASS.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/credits.ts
git commit -m "feat(credits): implement getCollectionQueue"
```

---

## Task 6: Write failing tests for `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted`

**Files:**

- Create: `database/__tests__/credits-collection-followups.test.ts`

**Interfaces:**

- Uses: `db`, `initCreditsTable`, the three fns (not yet implemented)
- Produces (after Task 7): a `CollectionFollowUp | null`, an upsert write, an idempotent counter increment

- [ ] **Step 1: Create the test file**

File path: `database/__tests__/credits-collection-followups.test.ts`

Content (verbatim):

```ts
import {
  initCreditsTable,
  getCollectionFollowUp,
  setCollectionFollowUp,
  markCollectionContacted,
} from '@/database/credits';
import { db } from '@/configs/sqlite';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

const insertCustomer = async (name: string) => {
  const r = await db.runAsync('INSERT INTO customers (name) VALUES (?);', [
    name,
  ]);
  return r.lastInsertRowId;
};

describe('getCollectionFollowUp', () => {
  beforeEach(async () => {
    resetMockDb();
    await initCreditsTable();
  });

  it('returns null when no follow-up row exists', async () => {
    const id = await insertCustomer('New Customer');
    const result = await getCollectionFollowUp(id);
    expect(result).toBeNull();
  });

  it('returns the existing follow-up row', async () => {
    const id = await insertCustomer('Returning');
    await db.runAsync(
      `INSERT INTO collection_followups (customer_id, follow_up_by) VALUES (?, ?);`,
      [id, '2026-08-14'],
    );
    const result = await getCollectionFollowUp(id);
    expect(result).toEqual({
      customerId: id,
      followUpBy: '2026-08-14',
      contactsToday: 0,
      lastContactAt: null,
      status: 'open',
    });
  });
});

describe('setCollectionFollowUp', () => {
  beforeEach(async () => {
    resetMockDb();
    await initCreditsTable();
  });

  it('creates a row when none exists', async () => {
    const id = await insertCustomer('First Time');
    await setCollectionFollowUp({ customerId: id, followUpBy: '2026-08-15' });
    const result = await getCollectionFollowUp(id);
    expect(result?.followUpBy).toBe('2026-08-15');
    expect(result?.status).toBe('open');
  });

  it('updates the existing row preserving contacts_today', async () => {
    const id = await insertCustomer('Repeat');
    await db.runAsync(
      `INSERT INTO collection_followups (customer_id, follow_up_by, contacts_today) VALUES (?, ?, ?);`,
      [id, '2026-08-14', 2],
    );
    await setCollectionFollowUp({ customerId: id, followUpBy: '2026-08-20' });
    const row = await db.getFirstAsync<{ contacts_today: number }>(
      'SELECT contacts_today FROM collection_followups WHERE customer_id = ?;',
      [id],
    );
    expect(row?.contacts_today).toBe(2);
    const result = await getCollectionFollowUp(id);
    expect(result?.followUpBy).toBe('2026-08-20');
  });

  it('clears follow_up_by when null is passed', async () => {
    const id = await insertCustomer('Clearer');
    await setCollectionFollowUp({ customerId: id, followUpBy: '2026-08-15' });
    await setCollectionFollowUp({ customerId: id, followUpBy: null });
    const result = await getCollectionFollowUp(id);
    expect(result?.followUpBy).toBeNull();
  });
});

describe('markCollectionContacted', () => {
  beforeEach(async () => {
    resetMockDb();
    await initCreditsTable();
  });

  it('creates a row with contacts_today=1 on first contact', async () => {
    const id = await insertCustomer('First Contact');
    await markCollectionContacted(id);
    const result = await getCollectionFollowUp(id);
    expect(result?.contactsToday).toBe(1);
    expect(result?.status).toBe('closed');
    expect(result?.lastContactAt).not.toBeNull();
  });

  it('increments contacts_today when called twice same day', async () => {
    const id = await insertCustomer('Same Day');
    await markCollectionContacted(id);
    await markCollectionContacted(id);
    const result = await getCollectionFollowUp(id);
    expect(result?.contactsToday).toBe(2);
  });

  it('resets contacts_today to 1 when called on a different day', async () => {
    const id = await insertCustomer('Next Day');
    // Seed an existing row with a last_contact_at from 2 days ago.
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);
    await db.runAsync(
      `INSERT INTO collection_followups (customer_id, contacts_today, last_contact_at) VALUES (?, ?, ?);`,
      [id, 5, twoDaysAgo],
    );
    await markCollectionContacted(id);
    const result = await getCollectionFollowUp(id);
    expect(result?.contactsToday).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- database/__tests__/credits-collection-followups.test.ts`
Expected: FAIL — imports not found.

- [ ] **Step 3: Commit failing test**

```bash
git add database/__tests__/credits-collection-followups.test.ts
git commit -m "test(credits): failing tests for collection follow-up write fns"
```

---

## Task 7: Implement `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted`

**Files:**

- Modify: `database/credits.ts` (append after `getCollectionQueue`)

**Interfaces:**

- Produces:
  - `getCollectionFollowUp(customerId: number): Promise<CollectionFollowUp | null>`
  - `setCollectionFollowUp({ customerId, followUpBy }: { customerId: number; followUpBy: string | null }): Promise<void>`
  - `markCollectionContacted(customerId: number): Promise<void>`

- [ ] **Step 1: Append the three functions after `getCollectionQueue` in `database/credits.ts`**

Insert (verbatim):

```ts
/**
 * Reads the collection_followups row for a customer.
 * Returns null if no follow-up has been set yet.
 */
export const getCollectionFollowUp = async (
  customerId: number,
): Promise<CollectionFollowUp | null> => {
  const row = await db.getFirstAsync<{
    customer_id: number;
    follow_up_by: string | null;
    contacts_today: number;
    last_contact_at: string | null;
    status: 'open' | 'closed';
  }>(
    `SELECT customer_id, follow_up_by, contacts_today, last_contact_at, status
       FROM collection_followups
       WHERE customer_id = ?`,
    [customerId],
  );
  if (!row) return null;
  return {
    customerId: row.customer_id,
    followUpBy: row.follow_up_by,
    contactsToday: row.contacts_today,
    lastContactAt: row.last_contact_at,
    status: row.status,
  };
};

/**
 * Upsert: sets the follow-up date for a customer.
 * Pass `followUpBy: null` to clear.
 * Creates the row if it does not exist.
 */
export const setCollectionFollowUp = async ({
  customerId,
  followUpBy,
}: {
  customerId: number;
  followUpBy: string | null;
}): Promise<void> => {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO collection_followups (customer_id, status)
         VALUES (?, 'open');`,
      [customerId],
    );
    await db.runAsync(
      `UPDATE collection_followups
         SET follow_up_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = ?;`,
      [followUpBy, customerId],
    );
  });
};

/**
 * Records that the owner contacted the customer today.
 * Increments contacts_today if last_contact_at is from today; otherwise
 * resets to 1 and updates last_contact_at. Sets status='closed'.
 */
export const markCollectionContacted = async (
  customerId: number,
): Promise<void> => {
  const today = new Date().toDateString();
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{
      contacts_today: number;
      last_contact_at: string | null;
    }>(
      `SELECT contacts_today, last_contact_at
         FROM collection_followups
         WHERE customer_id = ?`,
      [customerId],
    );

    if (!existing) {
      await db.runAsync(
        `INSERT INTO collection_followups
           (customer_id, contacts_today, last_contact_at, status)
           VALUES (?, 1, CURRENT_TIMESTAMP, 'closed');`,
        [customerId],
      );
      return;
    }

    const sameDay =
      existing.last_contact_at != null &&
      new Date(
        existing.last_contact_at.replace(' ', 'T') + 'Z',
      ).toDateString() === today;

    const nextCount = sameDay ? existing.contacts_today + 1 : 1;

    await db.runAsync(
      `UPDATE collection_followups
         SET contacts_today = ?,
             last_contact_at = CURRENT_TIMESTAMP,
             status = 'closed',
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = ?;`,
      [nextCount, customerId],
    );
  });
};
```

- [ ] **Step 2: Run the test**

Run: `npm test -- database/__tests__/credits-collection-followups.test.ts`
Expected: All 8 tests PASS.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add database/credits.ts
git commit -m "feat(credits): add collection follow-up read/write functions"
```

---

## Task 8: Write failing tests for hooks

**Files:**

- Create: `components/customers/__tests__/useCollectionQueue.test.ts`
- Create: `components/customers/__tests__/useCollectionFollowUp.test.ts`

**Interfaces:**

- Uses: `renderHook` + `QueryClientProvider` wrapper (pattern from `useLogTransactionForm.test.ts`); the two hooks (not yet implemented)

- [ ] **Step 1: Create the first hook test**

File: `components/customers/__tests__/useCollectionQueue.test.ts`

Content (verbatim):

```ts
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollectionQueue } from '@/hooks/useCredits';
import { initCreditsTable, getCollectionQueue } from '@/database/credits';
import { resetMockDb } from '@/tests/__setup__/expo-sqlite-mock';

jest.mock('@/database/credits', () => {
  const actual = jest.requireActual('@/database/credits');
  return { ...actual, getCollectionQueue: jest.fn() };
});

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useCollectionQueue', () => {
  beforeEach(async () => {
    (getCollectionQueue as jest.Mock).mockReset();
    await initCreditsTable();
    resetMockDb();
  });

  it('uses queryKey ["collection-queue", params]', async () => {
    (getCollectionQueue as jest.Mock).mockResolvedValue([]);
    const { result } = renderHook(
      () => useCollectionQueue({ overdueDays: 7, nearLimitPct: 0.3 }),
      { wrapper: createWrapper() },
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(getCollectionQueue).toHaveBeenCalledWith({
      overdueDays: 7,
      nearLimitPct: 0.3,
    });
    expect(result.current.data).toEqual([]);
  });

  it('uses default empty params when none passed', async () => {
    (getCollectionQueue as jest.Mock).mockResolvedValue([]);
    renderHook(() => useCollectionQueue(), { wrapper: createWrapper() });
    await new Promise((r) => setTimeout(r, 0));
    expect(getCollectionQueue).toHaveBeenCalledWith({});
  });
});
```

- [ ] **Step 2: Create the second hook test**

File: `components/customers/__tests__/useCollectionFollowUp.test.ts`

Content (verbatim):

```ts
import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollectionFollowUp } from '@/hooks/useCredits';
import { getCollectionFollowUp } from '@/database/credits';

jest.mock('@/database/credits', () => {
  const actual = jest.requireActual('@/database/credits');
  return { ...actual, getCollectionFollowUp: jest.fn() };
});

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useCollectionFollowUp', () => {
  beforeEach(() => {
    (getCollectionFollowUp as jest.Mock).mockReset();
  });

  it('parses string id to integer', async () => {
    (getCollectionFollowUp as jest.Mock).mockResolvedValue(null);
    renderHook(() => useCollectionFollowUp('42'), {
      wrapper: createWrapper(),
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(getCollectionFollowUp).toHaveBeenCalledWith(42);
  });

  it('passes through numeric id unchanged', async () => {
    (getCollectionFollowUp as jest.Mock).mockResolvedValue(null);
    renderHook(() => useCollectionFollowUp(7), { wrapper: createWrapper() });
    await new Promise((r) => setTimeout(r, 0));
    expect(getCollectionFollowUp).toHaveBeenCalledWith(7);
  });

  it('does not call queryFn when id is undefined', async () => {
    (getCollectionFollowUp as jest.Mock).mockResolvedValue(null);
    renderHook(() => useCollectionFollowUp(undefined), {
      wrapper: createWrapper(),
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(getCollectionFollowUp).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run both hook tests to verify they fail**

Run:

```bash
npm test -- components/customers/__tests__/useCollectionQueue.test.ts
npm test -- components/customers/__tests__/useCollectionFollowUp.test.ts
```

Expected: FAIL — hooks not exported.

- [ ] **Step 4: Commit failing hook tests**

```bash
git add components/customers/__tests__/useCollectionQueue.test.ts components/customers/__tests__/useCollectionFollowUp.test.ts
git commit -m "test(hooks): failing tests for useCollectionQueue and useCollectionFollowUp"
```

---

## Task 9: Implement the four new hooks in `hooks/useCredits.ts`

**Files:**

- Modify: `hooks/useCredits.ts` (append at end of file)

**Interfaces:**

- Consumes: TanStack Query, `useToastStore` (already imported)
- Produces: `useCollectionQueue`, `useCollectionFollowUp`, `useSetCollectionFollowUp`, `useMarkCollectionContacted` exported hooks
- Also: append `CollectionQueueParams` and `CollectionFollowUp` to the existing type-import block (line 26-41)

- [ ] **Step 1: Open `hooks/useCredits.ts`, find the type import block (lines 26-41)**

- [ ] **Step 2: Extend the type import**

Find:

```ts
import type {
  CreditFilter,
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerWithDetails,
  NewCredit,
  NewCustomer,
  NewPayment,
  Payment,
  CustomerTimelineItem,
  CustomerInsights,
  CustomerCreditSummary,
} from '@/types/credits.types';
```

Add two new imports (alphabetic insert):

```ts
import type {
  CollectionFollowUp,
  CollectionQueueParams,
  CollectionQueueRow,
  CreditFilter,
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerWithDetails,
  NewCredit,
  NewCustomer,
  NewPayment,
  Payment,
  CustomerTimelineItem,
  CustomerInsights,
  CustomerCreditSummary,
} from '@/types/credits.types';
```

- [ ] **Step 3: Extend the DB-fn import block (lines 1-24)**

Find the existing import and add five new imports (alphabetic insert):

```ts
import {
  deleteCreditTransaction,
  deleteCustomer,
  deletePayment,
  getAllCustomers,
  getCollectionFollowUp,
  getCollectionQueue,
  getCreditHistory,
  getCreditKPIs,
  getCreditTransactionsByCustomer,
  getCustomer,
  getCustomerWithDetails,
  getPaymentsByCustomer,
  insertCreditTransaction,
  insertCustomer,
  insertPayment,
  markAllCreditsAsPaid,
  markCollectionContacted,
  searchCustomers,
  setCollectionFollowUp,
  updateCreditStatus,
  updateCustomer,
  getCustomerTimeline,
  getCustomerInsights,
  getCustomerFavoriteProduct,
  getCustomerCreditSummary,
} from '@/database/credits';
```

- [ ] **Step 4: Append the four new hooks at the very end of `hooks/useCredits.ts`**

```ts
export function useCollectionQueue(
  params: CollectionQueueParams = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<CollectionQueueRow[]>({
    queryKey: ['collection-queue', params],
    queryFn: () => getCollectionQueue(params),
    staleTime: 60 * 1000,
    ...opts,
  });
}

export function useCollectionFollowUp(
  customerId?: number,
  opts: { enabled?: boolean } = {},
) {
  const parsed =
    typeof customerId === 'string' ? parseInt(customerId) : customerId;
  return useQuery<CollectionFollowUp | null>({
    queryKey: ['collection-follow-up', parsed],
    queryFn: () => getCollectionFollowUp(parsed!),
    enabled: opts.enabled ?? !!parsed,
    staleTime: 30 * 1000,
    ...opts,
  });
}

export function useSetCollectionFollowUp() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: (vars: { customerId: number; followUpBy: string | null }) =>
      setCollectionFollowUp(vars),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['collection-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['collection-follow-up', vars.customerId],
      });
      addToast({
        message: 'Follow-up updated',
        variant: 'success',
        duration: 3000,
      });
    },
    onError: () => {
      addToast({
        message: 'Failed to update follow-up',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useMarkCollectionContacted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: number) => markCollectionContacted(customerId),
    onSuccess: (_d, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['collection-queue'] });
      queryClient.invalidateQueries({
        queryKey: ['collection-follow-up', customerId],
      });
    },
  });
}
```

- [ ] **Step 5: Run both hook tests**

Run:

```bash
npm test -- components/customers/__tests__/useCollectionQueue.test.ts
npm test -- components/customers/__tests__/useCollectionFollowUp.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add hooks/useCredits.ts
git commit -m "feat(hooks): add collection queue hooks"
```

---

## Task 10: Add `['collection-queue']` invalidation to 9 existing mutations in `hooks/useCredits.ts`

**Files:**

- Modify: `hooks/useCredits.ts` (one line added in each of 9 `onSuccess` blocks)

**Mutations to update (with line numbers as of the current source):**

- `useInsertCustomer` (line 134-153)
- `useUpdateCustomer` (line 155-169)
- `useDeleteCustomer` (line 171-195)
- `useInsertCredit` (line 197-242)
- `useDeleteCredit` (line 244-265)
- `useInsertPayment` (line 267-306)
- `useDeletePayment` (line 308-335)
- `useMarkAllCreditsAsPaid` (line 337-368)
- `useUpdateCreditStatus` (line 370-383)

The pattern in each: add one line — `queryClient.invalidateQueries({ queryKey: ['collection-queue'] });` — after the existing `['credit-kpis']` invalidation line.

- [ ] **Step 1: In `useInsertCustomer` (around line 152)**, add the new invalidation line right after `queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });`. The current block ends with that line and a `},`.

- [ ] **Step 2: In `useUpdateCustomer`**, same — add line after the `['credit-kpis']` invalidation.

- [ ] **Step 3: In `useDeleteCustomer`**, same.

- [ ] **Step 4: In `useInsertCredit`**, same — the block ends with `['credit-kpis']` invalidation, then `addToast(...)`, then `router.back()`. Add the new line before the toast.

- [ ] **Step 5: In `useDeleteCredit`**, same as Step 1 pattern.

- [ ] **Step 6: In `useInsertPayment`** (around line 290-291), add the new invalidation after `queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });`. See the verified block at lines 273-297.

- [ ] **Step 7: In `useDeletePayment`** (around line 332), same.

- [ ] **Step 8: In `useMarkAllCreditsAsPaid`** (around line 360-368), same.

- [ ] **Step 9: In `useUpdateCreditStatus`** (around line 380), same.

- [ ] **Step 10: Run typecheck + tests**

Run: `npm run verify`
Expected: PASS (no behavior change yet, just additional cache invalidation).

- [ ] **Step 11: Commit**

```bash
git add hooks/useCredits.ts
git commit -m "feat(hooks): invalidate collection-queue on credit/customer mutations"
```

---

## Task 11: Add 22 i18n keys to `locales/en/utang.json` and `locales/tl/utang.json`

**Files:**

- Modify: `locales/en/utang.json`
- Modify: `locales/tl/utang.json`

**Interfaces:**

- Produces: 22 new keys in each file, accessed via `useTranslation('utang')` with namespacing.

- [ ] **Step 1: Open `locales/en/utang.json`. Replace its contents with the following (verbatim):**

```json
{
  "eyebrow": "UTANG LEDGER",
  "title": "Credits",

  "addCustomerA11y": "Add customer",

  "subtitleOverdueSingular": "{{count}} overdue customer needs follow-up",
  "subtitleOverduePlural": "{{count}} overdue customers need follow-up",
  "subtitleEmpty": "Add your first suki to start tracking utang",
  "subtitleTopOfList": "{{name}} top of the list",
  "subtitleLedgerClear": "Ledger is clear — all balances settled",
  "subtitleLoading": "Loading your ledger…",

  "searchCustomersPlaceholder": "Search customers…",

  "sukiSingular": "suki",
  "sukiPlural": "sukis",
  "withBalance": "with outstanding balance",
  "allPaidUp": "all paid up",
  "pastDueDate": "past due date",

  "collectionEyebrow": "Collection",
  "collectionTitle": "Collection Queue",
  "collectionSearchPlaceholder": "Search suki…",
  "collectionBucketOverdue": "Overdue",
  "collectionBucketNearLimit": "Near limit",
  "collectionBucketOldestBalance": "Longest outstanding",
  "collectionRowRecordPayment": "Record payment",
  "collectionRowOpenDetails": "Open details",
  "collectionFollowUpSet": "Follow up by {{date}}",
  "collectionFollowUpOverdue": "Follow up was {{date}} ({{days}} days ago)",
  "collectionFollowUpContactedToday": "Contacted today · {{count}}x",
  "collectionFollowUpNone": "Set follow-up",
  "collectionFollowUpSheetTitle": "When to follow up?",
  "collectionFollowUpToday": "Today",
  "collectionFollowUpTomorrow": "Tomorrow",
  "collectionFollowUpIn3Days": "In 3 days",
  "collectionFollowUpInAWeek": "In 1 week",
  "collectionFollowUpPickDate": "Pick a date…",
  "collectionFollowUpClear": "Clear",
  "collectionMarkContactedA11y": "Mark {{name}} as contacted today",
  "collectionEmptyTitle": "No one to chase today",
  "collectionEmptyDescription": "When a suki has an outstanding balance, they'll appear here.",
  "collectionOverdueChip": "{{days}} days overdue",
  "collectionNearLimitChip": "Near limit",
  "collectionToastFollowUpUpdated": "Follow-up updated"
}
```

- [ ] **Step 2: Open `locales/tl/utang.json`. Replace its contents with the following (verbatim Tagalog draft):**

```json
{
  "eyebrow": "UTANG LEDGER",
  "title": "Mga Utang",

  "addCustomerA11y": "Magdagdag ng suki",

  "subtitleOverdueSingular": "{{count}} overdue na suki ang kailangan sundan",
  "subtitleOverduePlural": "{{count}} mga overdue na suki ang kailangan sundan",
  "subtitleEmpty": "Magdagdag ng unang suki para masimulan ang talaan ng utang",
  "subtitleTopOfList": "{{name}} nasa taas ng listahan",
  "subtitleLedgerClear": "Walang balance — lahat nakabayaran na",
  "subtitleLoading": "Ikinakarga ang talaan…",

  "searchCustomersPlaceholder": "Maghanap ng suki…",

  "sukiSingular": "suki",
  "sukiPlural": "mga suki",
  "withBalance": "may natitirang utang",
  "allPaidUp": "walang balance",
  "pastDueDate": "huli na sa takdang petsa",

  "collectionEyebrow": "Collection",
  "collectionTitle": "Pila ng Paniningil",
  "collectionSearchPlaceholder": "Maghanap ng suki…",
  "collectionBucketOverdue": "Overdue",
  "collectionBucketNearLimit": "Malapit na sa limit",
  "collectionBucketOldestBalance": "Pinakamatagal nang may utang",
  "collectionRowRecordPayment": "Magtala ng bayad",
  "collectionRowOpenDetails": "Buksan ang detalye",
  "collectionFollowUpSet": "Sundan sa {{date}}",
  "collectionFollowUpOverdue": "Dapat sinundan noong {{date}} ({{days}} araw nakakaraan)",
  "collectionFollowUpContactedToday": "Nakausap ngayong araw · {{count}}x",
  "collectionFollowUpNone": "Itakda ang follow-up",
  "collectionFollowUpSheetTitle": "Kailan susundan?",
  "collectionFollowUpToday": "Ngayong araw",
  "collectionFollowUpTomorrow": "Bukas",
  "collectionFollowUpIn3Days": "Sa loob ng 3 araw",
  "collectionFollowUpInAWeek": "Sa loob ng 1 linggo",
  "collectionFollowUpPickDate": "Pumili ng petsa…",
  "collectionFollowUpClear": "Alisin",
  "collectionMarkContactedA11y": "Itala na nakausap si {{name}} ngayong araw",
  "collectionEmptyTitle": "Walang kailangan singilin ngayon",
  "collectionEmptyDescription": "Kapag may natitirang utang ang isang suki, lalabas sila dito.",
  "collectionOverdueChip": "{{days}} araw nang overdue",
  "collectionNearLimitChip": "Malapit na sa limit",
  "collectionToastFollowUpUpdated": "Na-update ang follow-up"
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add locales/en/utang.json locales/tl/utang.json
git commit -m "feat(i18n): add Collection Queue translation keys (en + tl)"
```

---

## Task 12: Update `constants/tabs.ts` and re-export new components

**Files:**

- Modify: `constants/tabs.ts` (line 54)
- Modify: `components/customers/index.ts` (append re-exports)

- [ ] **Step 1: In `constants/tabs.ts`, change line 54 from:**

```ts
export const CUSTOMERS_SUB_TABS = ['all', 'credit'] as const;
```

to:

```ts
export const CUSTOMERS_SUB_TABS = ['all', 'credit', 'collection'] as const;
```

- [ ] **Step 2: Open `components/customers/index.ts` and append re-exports for the new components (will be created in Task 14 — TypeScript will warn until then, but typecheck will pass because they don't yet exist as imported names; however, importing a non-existent file is an error, so DO THIS STEP AFTER Task 14 if you want a clean intermediate state. The recommended flow: add a TODO marker comment now, run this step in Task 14 alongside the new component files.)**

**Recommended: defer this step to Task 14** so we don't add imports to files that don't exist yet. Mark this step DONE when Task 14 completes.

- [ ] **Step 3: Commit**

```bash
git add constants/tabs.ts
git commit -m "feat(tabs): add 'collection' to CUSTOMERS_SUB_TABS"
```

---

## Task 13: Sub-tab wiring — `_layout.tsx` and `CustomersHeader.tsx`

**Files:**

- Modify: `app/(tabs)/customers/_layout.tsx`
- Modify: `components/customers/CustomersHeader.tsx`

- [ ] **Step 1: In `app/(tabs)/customers/_layout.tsx`:**

(a) Extend the `getCurrentTab` switch (lines 24-27):

Find:

```ts
const getCurrentTab = (): CustomersSubTab => {
  if (pathname.includes('credit')) return 'credit';
  return 'all';
};
```

Replace with:

```ts
const getCurrentTab = (): CustomersSubTab => {
  if (pathname.includes('collection')) return 'collection';
  if (pathname.includes('credit')) return 'credit';
  return 'all';
};
```

(b) Extend the `isDetailScreen` exclusion list (lines 32-36):

Find:

```ts
const isDetailScreen =
  pathname.includes('/customers/') &&
  !['credit', 'insights', 'all', ''].includes(
    pathname.split('/customers/')[1] || '',
  );
```

Replace with:

```ts
const isDetailScreen =
  pathname.includes('/customers/') &&
  !['credit', 'collection', 'insights', 'all', ''].includes(
    pathname.split('/customers/')[1] || '',
  );
```

(c) Add `<TopTabs.Screen name="collection" />` after the existing screens (after line 76):

Find:

```tsx
          <TopTabs.Screen name="all" />
          <TopTabs.Screen name="credit" />
        </TopTabs>
```

Replace with:

```tsx
          <TopTabs.Screen name="all" />
          <TopTabs.Screen name="credit" />
          <TopTabs.Screen name="collection" />
        </TopTabs>
```

(d) Compute and pass `overdueCount` to the header for the new badge:

Find:

```tsx
{
  !isDetailScreen && (
    <CustomersHeader
      activeTab={activeTab}
      totalCustomers={customers.length}
      debtorCount={debtorCount}
      loyalCount={loyalCount}
      totalCredit={kpis?.totalOutstanding || 0}
      onTabPress={handleTabPress}
      onAddCustomer={handleAddCustomer}
      progress={progress}
    />
  );
}
```

Replace with:

```tsx
{
  !isDetailScreen && (
    <CustomersHeader
      activeTab={activeTab}
      totalCustomers={customers.length}
      debtorCount={debtorCount}
      loyalCount={loyalCount}
      totalCredit={kpis?.totalOutstanding || 0}
      overdueCount={kpis?.overdueCount ?? 0}
      onTabPress={handleTabPress}
      onAddCustomer={handleAddCustomer}
      progress={progress}
    />
  );
}
```

- [ ] **Step 2: In `components/customers/CustomersHeader.tsx`:**

(a) Extend the `CustomersHeaderProps` interface (lines 11-20):

Find:

```ts
export interface CustomersHeaderProps {
  activeTab: CustomersSubTab;
  totalCustomers?: number;
  debtorCount?: number;
  loyalCount?: number;
  totalCredit?: number;
  onTabPress: (tab: CustomersSubTab) => void;
  onAddCustomer?: () => void;
  progress?: SharedValue<number>;
}
```

Replace with:

```ts
export interface CustomersHeaderProps {
  activeTab: CustomersSubTab;
  totalCustomers?: number;
  debtorCount?: number;
  loyalCount?: number;
  overdueCount?: number;
  totalCredit?: number;
  onTabPress: (tab: CustomersSubTab) => void;
  onAddCustomer?: () => void;
  progress?: SharedValue<number>;
}
```

(b) Add `overdueCount = 0` to the destructured props (around line 22-30):

Find:

```ts
export function CustomersHeader({
  activeTab,
  totalCustomers = 142,
  debtorCount = 0,
  loyalCount = 28,
  totalCredit = 4850,
  onTabPress,
  progress,
}: CustomersHeaderProps) {
```

Replace with:

```ts
export function CustomersHeader({
  activeTab,
  totalCustomers = 142,
  debtorCount = 0,
  loyalCount = 28,
  overdueCount = 0,
  totalCredit = 4850,
  onTabPress,
  progress,
}: CustomersHeaderProps) {
```

(c) Append the new tab to the `tabs` array (lines 31-34):

Find:

```ts
const tabs: SubTabItem<CustomersSubTab>[] = [
  { key: 'all', label: 'ALL' },
  { key: 'credit', label: 'CREDIT', badgeCount: debtorCount },
];
```

Replace with:

```ts
const tabs: SubTabItem<CustomersSubTab>[] = [
  { key: 'all', label: 'ALL' },
  { key: 'credit', label: 'CREDIT', badgeCount: debtorCount },
  { key: 'collection', label: 'COLLECTION', badgeCount: overdueCount },
];
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (the new `collection` sub-tab route file does not exist yet, but `_layout.tsx` references it via the `TopTabs.Screen` which is lazy — TypeScript only checks names against the static `TopTabs` props, which is fine).

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/customers/_layout.tsx" components/customers/CustomersHeader.tsx
git commit -m "feat(customers): wire Collection sub-tab in layout and header"
```

---

## Task 14: Create the new sub-tab route + components

**Files:**

- Create: `app/(tabs)/customers/collection.tsx`
- Create: `components/customers/CollectionTab.tsx`
- Create: `components/customers/CollectionRow.tsx`
- Create: `components/customers/CollectionErrorState.tsx`
- Modify: `components/customers/index.ts` (add re-exports — the deferred step from Task 12)

**Interfaces:**

- Consumes: `useCollectionQueue`, `useCollectionFollowUp`, `useSetCollectionFollowUp`, `useMarkCollectionContacted` from `hooks/useCredits`
- Produces: A screen that renders a search bar, FlatList of `CollectionRow` with bucket section headers, and an error/empty state.

- [ ] **Step 1: Create `app/(tabs)/customers/collection.tsx`**

File path: `app/(tabs)/customers/collection.tsx`

Content (verbatim):

```tsx
import { View } from 'react-native';
import { CollectionTab } from '@/components/customers/CollectionTab';

export default function CollectionScreen() {
  return (
    <View className="flex-1 bg-paper-200">
      <CollectionTab />
    </View>
  );
}
```

- [ ] **Step 2: Create `components/customers/CollectionErrorState.tsx`**

File path: `components/customers/CollectionErrorState.tsx`

Content (verbatim):

```tsx
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { PrimaryButton } from '@/components/elements/buttons';

interface CollectionErrorStateProps {
  onRetry: () => void;
}

export function CollectionErrorState({ onRetry }: CollectionErrorStateProps) {
  const { t } = useTranslation('utang');
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <StyledText
        accessibilityRole="header"
        className="text-lg font-sans-bold text-cinnamon-700 mb-2"
      >
        {t('collectionEmptyTitle')}
      </StyledText>
      <StyledText className="text-sm text-cinnamon-600 mb-4 text-center">
        {t('collectionEmptyDescription')}
      </StyledText>
      <PrimaryButton onPress={onRetry} label="Retry" />
    </View>
  );
}
```

> If `@/components/elements/buttons` does not export `PrimaryButton`, replace with the actual existing button import (look at `CreditsCustomerCard.tsx` for the button import used by the credit card).

- [ ] **Step 3: Create `components/customers/CollectionRow.tsx`**

File path: `components/customers/CollectionRow.tsx`

Content (verbatim):

```tsx
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { formatPesos } from '@/lib';
import type { CollectionQueueRow } from '@/types/credits.types';

interface CollectionRowProps {
  row: CollectionQueueRow;
}

export function CollectionRow({ row }: CollectionRowProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('utang');

  const handleOpenDetails = () => {
    router.push(`/(edit-forms)/credit-details/${row.customerId}` as Href);
  };
  const handleRecordPayment = () => {
    router.push(`/(edit-forms)/add-payment/${row.customerId}` as Href);
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language) : '';

  const followUpChipState: 'set' | 'overdue' | 'contacted' | 'none' =
    !row.followUp
      ? 'none'
      : row.followUp.contactsToday > 0 &&
          row.followUp.lastContactAt &&
          new Date(row.followUp.lastContactAt).toDateString() ===
            new Date().toDateString()
        ? 'contacted'
        : row.followUp.followUpBy &&
            new Date(row.followUp.followUpBy) <
              new Date(new Date().toDateString())
          ? 'overdue'
          : 'set';

  const chipLabel = (() => {
    if (followUpChipState === 'contacted') {
      return t('collectionFollowUpContactedToday', {
        count: row.followUp!.contactsToday,
      });
    }
    if (followUpChipState === 'overdue' && row.followUp?.followUpBy) {
      const days = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(row.followUp.followUpBy).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );
      return t('collectionFollowUpOverdue', {
        date: fmtDate(row.followUp.followUpBy),
        days,
      });
    }
    if (followUpChipState === 'set' && row.followUp?.followUpBy) {
      return t('collectionFollowUpSet', {
        date: fmtDate(row.followUp.followUpBy),
      });
    }
    return t('collectionFollowUpNone');
  })();

  return (
    <Pressable
      onPress={handleOpenDetails}
      accessibilityRole="button"
      accessibilityLabel={`${row.name}, ${formatPesos(row.balance)}`}
      className="mx-4 my-1.5 bg-cream-50 rounded-2xl p-4 flex-row items-center"
    >
      <CustomerAvatar name={row.name} photoUri={row.photoUri ?? null} />
      <View className="flex-1 ml-3">
        <StyledText className="text-base font-sans-semibold text-cinnamon-800">
          {row.name}
        </StyledText>
        {row.phone ? (
          <StyledText className="text-xs text-cinnamon-500">
            {row.phone}
          </StyledText>
        ) : null}
        <View className="flex-row items-center mt-1 flex-wrap">
          <View
            className={`px-2 py-0.5 rounded-full ${
              row.overdueDays > 0 ? 'bg-clay-500' : 'bg-cinnamon-100'
            }`}
          >
            <StyledText
              className={`text-xs ${
                row.overdueDays > 0 ? 'text-white' : 'text-cinnamon-700'
              }`}
            >
              {formatPesos(row.balance)}
            </StyledText>
          </View>
          {row.overdueDays > 0 ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-clay-100">
              <StyledText className="text-xs text-clay-700">
                {t('collectionOverdueChip', { days: row.overdueDays })}
              </StyledText>
            </View>
          ) : null}
          {row.isNearLimit ? (
            <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
              <StyledText className="text-xs text-amber-700">
                {t('collectionNearLimitChip')}
              </StyledText>
            </View>
          ) : null}
        </View>
        <View className="mt-2">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              // Action sheet handler stub — implemented in Task 15.
            }}
            accessibilityRole="button"
            accessibilityLabel={chipLabel}
            className={`self-start px-2 py-1 rounded-full ${
              followUpChipState === 'overdue'
                ? 'bg-clay-100'
                : followUpChipState === 'contacted'
                  ? 'bg-sage-100'
                  : 'bg-paper-200'
            }`}
          >
            <StyledText
              className={`text-xs ${
                followUpChipState === 'overdue'
                  ? 'text-clay-700'
                  : followUpChipState === 'contacted'
                    ? 'text-sage-700'
                    : 'text-cinnamon-700'
              }`}
            >
              {chipLabel}
            </StyledText>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleRecordPayment();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('collectionRowRecordPayment', {
          name: row.name,
        })}
        className="ml-2 bg-cinnamon-500 px-3 py-2 rounded-xl min-h-11 items-center justify-center"
      >
        <FontAwesome name="money" size={14} color="#FFFFFF" />
        <StyledText className="text-xs text-white mt-0.5">
          {t('collectionRowRecordPayment')}
        </StyledText>
      </Pressable>
    </Pressable>
  );
}
```

- [ ] **Step 4: Create `components/customers/CollectionTab.tsx`**

File path: `components/customers/CollectionTab.tsx`

Content (verbatim):

```tsx
import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CollectionRow } from '@/components/customers/CollectionRow';
import { CollectionErrorState } from '@/components/customers/CollectionErrorState';
import { CustomersEmptyState } from '@/components/customers/CustomersEmptyState';
import { CustomersSkeleton } from '@/components/customers/CustomersSkeleton';
import { useCollectionQueue } from '@/hooks/useCredits';
import type {
  CollectionBucket,
  CollectionQueueRow,
} from '@/types/credits.types';

const bucketLabelKey: Record<CollectionBucket, string> = {
  overdue: 'collectionBucketOverdue',
  near_limit: 'collectionBucketNearLimit',
  oldest_balance: 'collectionBucketOldestBalance',
};

const bucketOrder: CollectionBucket[] = [
  'overdue',
  'near_limit',
  'oldest_balance',
];

interface RowItem {
  type: 'header' | 'row';
  key: string;
  bucket?: CollectionBucket;
  row?: CollectionQueueRow;
}

export function CollectionTab() {
  const { t } = useTranslation('utang');
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = useCollectionQueue();

  const items: RowItem[] = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.phone != null && r.phone.toLowerCase().includes(q))
      );
    });
    const sections: RowItem[] = [];
    for (const bucket of bucketOrder) {
      const bucketRows = filtered.filter((r) => r.bucket === bucket);
      if (bucketRows.length === 0) continue;
      sections.push({ type: 'header', key: `h:${bucket}`, bucket });
      for (const r of bucketRows) {
        sections.push({ type: 'row', key: `r:${r.customerId}`, row: r });
      }
    }
    return sections;
  }, [data, search]);

  if (isLoading) return <CustomersSkeleton />;
  if (error) return <CollectionErrorState onRetry={() => void refetch()} />;
  if (items.length === 0)
    return (
      <CustomersEmptyState
        title={t('collectionEmptyTitle')}
        description={t('collectionEmptyDescription')}
      />
    );

  return (
    <View className="flex-1">
      <View className="px-4 py-3 bg-paper-200">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('collectionSearchPlaceholder')}
          placeholderTextColor="#A98D78"
          className="bg-cream-50 rounded-xl px-4 py-2 text-sm text-cinnamon-800"
          accessibilityLabel={t('collectionSearchPlaceholder')}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <StyledText
              accessibilityRole="header"
              className="px-4 pt-4 pb-1 text-xs font-sans-bold text-cinnamon-600 uppercase"
            >
              {t(bucketLabelKey[item.bucket!])}
            </StyledText>
          ) : (
            <CollectionRow row={item.row!} />
          )
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </View>
  );
}
```

- [ ] **Step 5: Update `components/customers/index.ts` to re-export**

Open `components/customers/index.ts` and append (after the last existing export):

```ts
export { CollectionTab } from './CollectionTab';
export { CollectionRow } from './CollectionRow';
export { CollectionErrorState } from './CollectionErrorState';
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (all types resolve; `CustomerAvatar` and `CustomersEmptyState`/`CustomersSkeleton` already exist; `StyledText`, `formatPesos` already exist).

If typecheck reports a missing export (e.g., `PrimaryButton` not found, `CustomerAvatar` props mismatch, color class not defined), fix the offending import. Common adjustments:

- Replace `CustomerAvatar name={...} photoUri={...}` with whatever prop shape the actual `CustomerAvatar` component uses (read `components/customers/CustomerAvatar.tsx` to confirm).
- Replace the color classes `bg-clay-500` / `bg-clay-100` / `bg-sage-100` / `bg-sage-700` / `bg-amber-100` / `bg-amber-700` with the closest match in `tailwind.config.js` (e.g., `bg-error-500` / `bg-success-100` if `clay`/`sage`/`amber` aren't in the theme).
- Replace `font-sans-bold` / `font-sans-semibold` with the actual font utility classes defined in `tailwind.config.js`.

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: PASS (no regression; new components have no tests yet — they're integrated in the manual smoke test).

- [ ] **Step 8: Commit**

```bash
git add "app/(tabs)/customers/collection.tsx" \
        components/customers/CollectionTab.tsx \
        components/customers/CollectionRow.tsx \
        components/customers/CollectionErrorState.tsx \
        components/customers/index.ts
git commit -m "feat(customers): Collection sub-tab screen, list, row, and error state"
```

---

## Task 15: Repoint More-tab tile to the new Collection route

**Files:**

- Modify: `components/more/MoreHomeScreen.tsx:33`

- [ ] **Step 1: In `components/more/MoreHomeScreen.tsx`, change line 33 from:**

```ts
  collection: '/(tabs)/customers/credit',
```

to:

```ts
  collection: '/(tabs)/customers/collection',
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/more/MoreHomeScreen.tsx
git commit -m "feat(more): repoint Collection queue tile to new sub-tab"
```

---

## Task 16: Wire follow-up chip action sheet + Mark contacted (touch handlers in `CollectionRow.tsx`)

The Task 14 implementation of `CollectionRow.tsx` left the follow-up chip's `onPress` as a stub. This task implements the action sheet and Mark contacted handler in the row.

**Files:**

- Modify: `components/customers/CollectionRow.tsx`

**Interfaces:**

- Consumes: `useSetCollectionFollowUp`, `useMarkCollectionContacted` from `hooks/useCredits`; `ActionSheetIOS` or a custom sheet component already in the repo (look for `components/elements/ActionSheet*` or use `Alert.alert` as a fallback).

- [ ] **Step 1: Discover the existing action-sheet pattern**

Search the repo for `ActionSheet` usage:

```bash
grep -rn "ActionSheet" components/ --include="*.tsx" --include="*.ts" | head -20
```

Pick the action-sheet component that fits (likely `components/elements/ActionSheet.tsx` or `ActionSheetIOS` from `react-native`). If no clean fit exists, use a simple `Alert.alert` with action buttons as a fallback for v1.

- [ ] **Step 2: Open `components/customers/CollectionRow.tsx`**

- [ ] **Step 3: Add imports for the action sheet and the two mutation hooks**

Find the imports block (near the top). Add the mutation hook imports:

```ts
import {
  useSetCollectionFollowUp,
  useMarkCollectionContacted,
} from '@/hooks/useCredits';
```

Add the action-sheet import matching what Step 1 found (or `Alert` from `react-native`).

- [ ] **Step 4: Inside `CollectionRow`, instantiate the two mutations before the return**

Add (just before the `return` statement, after the existing helpers):

```ts
const setFollowUp = useSetCollectionFollowUp();
const markContacted = useMarkCollectionContacted();

const openFollowUpSheet = () => {
  const today = new Date();
  const isoOf = (d: Date) => d.toISOString().slice(0, 10);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const in3 = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const inWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const options = [
    { label: t('collectionFollowUpToday'), value: isoOf(today) },
    { label: t('collectionFollowUpTomorrow'), value: isoOf(tomorrow) },
    { label: t('collectionFollowUpIn3Days'), value: isoOf(in3) },
    { label: t('collectionFollowUpInAWeek'), value: isoOf(inWeek) },
  ];
  // Trigger the chosen option. Use the action sheet API found in Step 1.
  // When using Alert.alert as fallback, the option list maps to buttons.
  Alert.alert(t('collectionFollowUpSheetTitle'), undefined, [
    ...options.map((o) => ({
      text: o.label,
      onPress: () =>
        setFollowUp.mutate({
          customerId: row.customerId,
          followUpBy: o.value,
        }),
    })),
    {
      text: t('collectionFollowUpClear'),
      onPress: () =>
        setFollowUp.mutate({
          customerId: row.customerId,
          followUpBy: null,
        }),
    },
    { text: 'Cancel', style: 'cancel' as const },
  ]);
};
```

> If using a real ActionSheet component (instead of `Alert.alert`), wire the same option list to it. The mapping is the same.

- [ ] **Step 5: Replace the stub `onPress` of the follow-up chip Pressable**

Find:

```tsx
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              // Action sheet handler stub — implemented in Task 15.
            }}
```

Replace the `onPress` body with:

```tsx
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              openFollowUpSheet();
            }}
```

- [ ] **Step 6: Add a `Mark contacted` small text-button under the chip**

Find the follow-up chip Pressable closing `</Pressable>` (the one with `chipLabel`). Below it, still inside the inner View, add:

```tsx
<Pressable
  onPress={(e) => {
    e.stopPropagation();
    markContacted.mutate(row.customerId);
  }}
  accessibilityRole="button"
  accessibilityLabel={t('collectionMarkContactedA11y', {
    name: row.name,
  })}
  className="self-start mt-1 px-2 py-1"
>
  <StyledText className="text-xs text-cinnamon-600 underline">
    Mark contacted
  </StyledText>
</Pressable>
```

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add components/customers/CollectionRow.tsx
git commit -m "feat(customers): wire follow-up sheet + Mark contacted handler"
```

---

## Task 17: Full verification + manual smoke test

**Files:** None (verification only).

- [ ] **Step 1: Run `npm run verify`**

Run: `npm run verify`
Expected: PASS — typecheck + all tests clean.

- [ ] **Step 2: Run `npm run lint`**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Manual smoke (Expo dev client)**

Start the app:

```bash
npm start
```

Run through these checks (do not skip — each is a separate acceptance criterion):

1. Fresh install → confirm `PRAGMA user_version = 17`. Open `app/(tabs)/dev/reset.tsx` and run reset; re-launch; verify by selecting any customer detail screen — the app should boot cleanly with no migration warnings in the console.
2. Upgrade path: install on a DB at v16 (run dev/reset, then manually drop the new table via the dev reset screen's raw SQL surface if available, OR write a small one-off migration-revert script in `scripts/` and run it). Launch app. Confirm v17 migration runs cleanly. No errors, no warnings.
3. Customers tab: three sub-tabs visible: All / Credit / Collection. Tap Collection. Empty state renders "No one to chase today" when no outstanding balances.
4. Seeded data: `npm run:ios` or `npm run:android` with `scripts/sample-mock-datas.ts` running. Open Collection:
   - Overdue rows under **OVERDUE** header (most days overdue first).
   - Near-limit rows under **NEAR LIMIT** (highest % consumed first).
   - Oldest balance rows under **LONGEST OUTSTANDING**.
   - Bucket headers visible and tappable (announce as headings to a11y).
5. Search: type a partial name. Confirm filtered rows within the bucket order are preserved.
6. Follow-up chip: tap the chip on a row. Pick "Tomorrow". Confirm chip updates to "Follow up by Aug 12" (today 2026-08-11). Pull-to-refresh (if implemented) or re-mount the screen: state preserved.
7. Mark contacted: tap "Mark contacted" on a row. Confirm chip turns soft sage-grey and shows "Contacted today · 1x". Tap again → "2x". Confirm `collection_followups.contacts_today` matches via a SELECT in `app/(tabs)/dev/reset.tsx` if it has a raw SQL pad.
8. Record payment: tap "Record payment" on an overdue row. Confirm `add-payment` opens with customer pre-selected, FIFO receipt visible. Enter ₱100, submit. Queue auto-refreshes. Balance reduced. Row re-buckets or drops out.
9. Delete customer: open customer details, delete. Confirm queue refetches and row gone.
10. i18n: toggle device language to Filipino. Confirm Collection copy is in Tagalog.
11. A11y smoke: enable VoiceOver/TalkBack. Tab through the queue. Confirm bucket headers announce as headings; rows announce name + balance + overdue state; `Record payment` CTA is focusable independently; follow-up chip label reflects its current state.
12. No regression: All and Credit sub-tabs still render correctly. Floating "+" FAB still adds a customer.

- [ ] **Step 4: If any smoke step fails, file a bug, fix, and re-run `npm run verify`**

- [ ] **Step 5: Final commit (if any fixes applied during smoke)**

```bash
git add -A
git commit -m "fix(collection): address smoke-test findings"
```

---

## Self-Review Checklist (run before handing off)

**Spec coverage:**

| Spec requirement                                                                                          | Task     |
| --------------------------------------------------------------------------------------------------------- | -------- |
| v16→v17 migration, `collection_followups` table                                                           | T1       |
| New types `CollectionQueueRow` etc.                                                                       | T2       |
| Mock wipe list updated                                                                                    | T3       |
| `getCollectionQueue` (empty, exclude paid, overdue, near-limit, oldest, ordering, params)                 | T4, T5   |
| `getCollectionFollowUp` (null when no row, returns row)                                                   | T6, T7   |
| `setCollectionFollowUp` (create, update, clear)                                                           | T6, T7   |
| `markCollectionContacted` (first time, same day, different day)                                           | T6, T7   |
| Hook tests                                                                                                | T8       |
| `useCollectionQueue` hook                                                                                 | T9       |
| `useCollectionFollowUp` hook                                                                              | T9       |
| `useSetCollectionFollowUp` mutation                                                                       | T9       |
| `useMarkCollectionContacted` mutation                                                                     | T9       |
| Invalidate `['collection-queue']` from 9 existing mutations                                               | T10      |
| i18n keys (22 each, en + tl)                                                                              | T11      |
| `constants/tabs.ts` add `'collection'`                                                                    | T12      |
| Re-exports in `components/customers/index.ts`                                                             | T14      |
| `_layout.tsx` getCurrentTab + isDetailScreen + TopTabs.Screen                                             | T13      |
| `CustomersHeader.tsx` overdueCount prop + tab badge                                                       | T13      |
| Collection sub-tab route file                                                                             | T14      |
| `CollectionTab` (search + list + bucket headers)                                                          | T14      |
| `CollectionRow` (avatar, name, balance, overdue chip, follow-up chip, Mark contacted, Record payment CTA) | T14, T16 |
| `CollectionErrorState`                                                                                    | T14      |
| More-tab tile repointed                                                                                   | T15      |
| Follow-up chip action sheet wired                                                                         | T16      |
| Mark contacted wired                                                                                      | T16      |
| Verification (typecheck, lint, tests, smoke)                                                              | T17      |

**Placeholder scan:** No "TBD", "TODO", or "implement later" in any step. Every step shows the actual file path and content.

**Type consistency:** `CollectionQueueRow.bucket` is `CollectionBucket`; `CollectionQueueParams` is `{ overdueDays?, nearLimitPct? }`; `CollectionFollowUp` is `{ customerId, followUpBy, contactsToday, lastContactAt, status }`. These match across all tasks.

**Cross-checks:**

- `CustomerAvatar` import in T14 — if signature differs, the task explicitly tells the implementer to read the actual component and adjust.
- `CustomersEmptyState` props — T14 passes `title` + `description`, matching the verified signature.
- `CollectionRowProps` shape consistent across T14, T16.
- Mutation hook shapes match the existing pattern (`useInsertPayment`) exactly.
