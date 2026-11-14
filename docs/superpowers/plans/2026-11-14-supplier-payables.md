# Supplier Payables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track what the owner owes each supplier (commit a delivery as paid, utang, or part-paid; add manual utang; record oldest-first payments), and show who is owed and what is overdue.

**Architecture:** Three new SQLite tables (`supplier_payables`, `supplier_payments`, `supplier_payment_allocations`) plus `suppliers.payment_terms_days`, added in migration 25. A new `database/supplierPayables.ts` mirrors the suki FIFO ledger in `database/credits.ts`. `commitDeliveryReceipt` and `runVoid` in `database/deliveries.ts` call into it inside their existing transactions. Screens reach data only through `hooks/useSupplierPayables.ts`.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript strict, `expo-sqlite` (tests use a `better-sqlite3` mock), TanStack Query v5, react-i18next, NativeWind, Jest with `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-11-13-supplier-payables-design.md` (approved). Vault note: `obsidian-vault/02-Features/supplier-payables.md`. Read both before starting.

## Global Constraints

- Money is integer pesos in SQLite. Parse UI input through `parsePesosInput` in `lib/money.ts`, then also require `Number.isInteger` and `> 0`. A typed `12.50` is rejected, never rounded.
- Screens never import `database/`. All data access goes through hooks in `hooks/`. Hooks re-export the named error classes screens need.
- One SQLite handle, imported from `configs/sqlite.ts` (`tests/sqlite/single-handle.test.ts` enforces this). New database files import `db` from `'../configs/sqlite'` only.
- Multi-statement ledger writes use `db.withTransactionAsync`. `createReceiptPayable` runs inside the caller's transaction and never opens its own.
- Payables and supplier payments never write to `financial_entries`.
- FIFO order is `created_at ASC, id ASC`, same as the suki ledger rule in the spec.
- Overdue is derived, never stored: not voided, outstanding > 0, `due_date` set, `due_date < today` (local date, `getTodayDateString()` from `@/utils/timezone`). Due today is not overdue. No `due_date` is never overdue.
- Schema is at `user_version = 24`. This feature is migration 25 and sets `PRAGMA user_version = 25;`.
- TypeScript strict plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `useUnknownInCatchVariables`. No emojis in code or comments.
- Markdown filenames kebab-case. Localization: new `payables` namespace in `en` and `tl`; More-row strings go in `common`.
- Component tests mock `react-i18next` so `t(key, opts)` returns `key:JSON.stringify(opts)` when `opts` is given, else `key`. Await every `fireEvent`. Use `tests/helpers/expectRejection.ts` for native SQLite errors only.
- Commits: user edits and stages files concurrently on `main`. Always commit with a pathspec (`git commit -m "..." -- <paths>`), never `git commit -a` or a bare `git add .`. Do not create a new branch (user instruction).

## Review Focus

Inputs the spec implies but a straight reading of the tasks would not exercise. Each has a pinned test in the owning task.

1. A fractional peso amount (`12.50`) typed into Pay, Add utang, or Partial is rejected, not rounded. (Task 1 `parseWholePesos`; Task 7 sheet tests.)
2. A due date that looks right but is not a real date (`2026-02-30`, `14/11/2026`) is rejected with `InvalidDueDateError`, in manual add, edit, and delivery commit. (Task 1, Task 3, Task 4.)
3. A zero-cost receipt cannot be committed as utang or partial: the DB throws `ReceiptNoCostError`, rolls back, and the picker disables those modes. (Task 4, Task 7.)
4. The owner types a partial amount, then switches back to "Paid now": the commit must create no payable, ignoring the leftover fields. (Task 1 `buildCommitPayment`.)
5. Deleting a supplier that has payable rows shows a clear message, not a raw `FOREIGN KEY constraint failed`. (Task 2.)

---

## File Structure

| File                                                                            | Action        | Responsibility                                                                                                           |
| ------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `lib/payables.ts`                                                               | Create        | Pure helpers: due date from terms, overdue, FIFO split, date and terms parsing, commit-payment builder                   |
| `types/payables.types.ts`                                                       | Create        | `CommitPayment`, `SupplierPayable`, `SupplierPayment`, `SupplierBalance`, `PayablesSummary`                              |
| `types/suppliers.types.ts`                                                      | Modify        | `paymentTermsDays`                                                                                                       |
| `database/migrations.ts`                                                        | Modify        | Migration 25                                                                                                             |
| `database/suppliers.ts`                                                         | Modify        | Read and write terms, block delete when payables exist                                                                   |
| `database/supplierPayables.ts`                                                  | Create        | Errors, manual payables, FIFO payments, queries, `createReceiptPayable`                                                  |
| `database/deliveries.ts`                                                        | Modify        | Commit takes `CommitPayment`, void checks payable                                                                        |
| `hooks/useSupplierPayables.ts`                                                  | Create        | Queries, mutations, keys, error re-exports                                                                               |
| `hooks/useDeliveryReceipts.ts`                                                  | Modify        | Commit input shape, invalidate payable keys, error re-exports                                                            |
| `hooks/useSuppliers.ts`                                                         | Modify        | Pass `paymentTermsDays`                                                                                                  |
| `hooks/index.ts`                                                                | Modify        | Export `useSupplierPayables`                                                                                             |
| `components/payables/*`                                                         | Create        | `PaymentPicker`, `PayPayableSheet`, `AddPayableSheet`, `PayableRow`, `PaymentTermsField`, `payableErrors.ts`, `index.ts` |
| `components/receiving/deliveryErrors.ts`                                        | Modify        | Map new payable errors                                                                                                   |
| `components/more/MoreHomeScreen.tsx`, `moreNavigation.ts`                       | Modify        | Supplier payables row with overdue badge                                                                                 |
| `app/settings/payables.tsx`, `app/settings/payables/[supplierId].tsx`           | Create        | List and supplier detail screens                                                                                         |
| `app/(edit-forms)/delivery-receipt/[id].tsx`                                    | Modify        | Payment picker before Commit                                                                                             |
| `app/(edit-forms)/edit-supplier/[id].tsx`, `add-supplier/index.tsx`             | Modify        | Payment terms field                                                                                                      |
| `lib/i18n.ts`, `locales/{en,tl}/payables.json`, `common.json`, `receiving.json` | Create/Modify | Strings                                                                                                                  |
| `tests/__setup__/expo-sqlite-mock.ts`                                           | Modify        | Reset new tables                                                                                                         |

---

### Task 1: Pure helpers and shared types

**Files:**

- Create: `types/payables.types.ts`
- Create: `lib/payables.ts`
- Test: `tests/lib/payables.test.ts`

**Interfaces:**

- Consumes: `parsePesosInput` from `lib/money.ts`.
- Produces (used by Tasks 3, 4, 7, 8, 9):
  - `types/payables.types.ts`: `CommitPayment`, `SupplierPayable`, `SupplierPayment`, `SupplierBalance`, `PayablesSummary`.
  - `lib/payables.ts`: `isValidDateString(s: string): boolean`, `dueDateFromTerms(receivedDate: string, termsDays: number | null): string | null`, `isOverdue(dueDate: string | null, outstanding: number, today: string): boolean`, `splitPayment(amount: number, outstandings: number[]): number[]`, `parseTermsDays(text: string): { ok: true; value: number | null } | { ok: false }`, `parseWholePesos(text: string): number | null`, `PaymentPickerValue`, `EMPTY_PAYMENT_PICKER`, `buildCommitPayment(value, total): BuildCommitPaymentResult`.

- [ ] **Step 1: Create the types file**

Create `types/payables.types.ts`:

```ts
export type CommitPayment =
  | { mode: 'paid' }
  | { mode: 'utang'; dueDate: string | null }
  | { mode: 'partial'; paidNow: number; dueDate: string | null };

export interface SupplierPayable {
  id: number;
  supplierId: string;
  receiptId: number | null;
  amount: number;
  amountPaid: number;
  outstanding: number;
  dueDate: string | null;
  note: string | null;
  voidedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
}

export interface SupplierPayment {
  id: number;
  supplierId: string;
  amount: number;
  note: string | null;
  paidAt: string;
  createdAt: string;
}

export interface SupplierBalance {
  supplierId: string;
  supplierName: string;
  balance: number;
  overdueAmount: number;
  overdueCount: number;
}

export interface PayablesSummary {
  totalOwed: number;
  totalOverdue: number;
  overdueCount: number;
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/lib/payables.test.ts`:

```ts
import {
  EMPTY_PAYMENT_PICKER,
  buildCommitPayment,
  dueDateFromTerms,
  isOverdue,
  isValidDateString,
  parseTermsDays,
  parseWholePesos,
  splitPayment,
} from '@/lib/payables';

describe('isValidDateString', () => {
  it('accepts real dates and rejects look-alikes', () => {
    expect(isValidDateString('2026-11-14')).toBe(true);
    expect(isValidDateString('2028-02-29')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('14/11/2026')).toBe(false);
    expect(isValidDateString('2026-1-5')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});

describe('dueDateFromTerms', () => {
  it('adds the terms in local calendar days', () => {
    expect(dueDateFromTerms('2026-11-14', 30)).toBe('2026-12-14');
    expect(dueDateFromTerms('2026-12-20', 15)).toBe('2027-01-04');
    expect(dueDateFromTerms('2026-02-20', 10)).toBe('2026-03-02');
  });
  it('returns the same day for zero terms', () => {
    expect(dueDateFromTerms('2026-11-14', 0)).toBe('2026-11-14');
  });
  it('returns null without usable terms or date', () => {
    expect(dueDateFromTerms('2026-11-14', null)).toBeNull();
    expect(dueDateFromTerms('2026-11-14', -1)).toBeNull();
    expect(dueDateFromTerms('2026-11-14', 1.5)).toBeNull();
    expect(dueDateFromTerms('not-a-date', 30)).toBeNull();
    expect(dueDateFromTerms('2026-11-14', 999_999_999_999)).toBeNull();
  });
});

describe('isOverdue', () => {
  const today = '2026-11-14';
  it('is overdue only when due before today with money outstanding', () => {
    expect(isOverdue('2026-11-13', 50, today)).toBe(true);
  });
  it('is not overdue when due today (boundary) or later', () => {
    expect(isOverdue('2026-11-14', 50, today)).toBe(false);
    expect(isOverdue('2026-11-15', 50, today)).toBe(false);
  });
  it('is never overdue without a due date or when fully paid', () => {
    expect(isOverdue(null, 50, today)).toBe(false);
    expect(isOverdue('2026-01-01', 0, today)).toBe(false);
  });
});

describe('splitPayment', () => {
  it('settles exactly', () => {
    expect(splitPayment(150, [100, 50])).toEqual([100, 50]);
  });
  it('spills into the next bill', () => {
    expect(splitPayment(120, [100, 50])).toEqual([100, 20]);
  });
  it('stays inside the first bill when small', () => {
    expect(splitPayment(30, [100, 50])).toEqual([30, 0]);
  });
  it('drops any excess beyond the balance (callers reject it first)', () => {
    expect(splitPayment(200, [100, 50])).toEqual([100, 50]);
  });
  it('skips zero outstandings and handles empty input', () => {
    expect(splitPayment(20, [0, 50])).toEqual([0, 20]);
    expect(splitPayment(20, [])).toEqual([]);
  });
});

describe('parseTermsDays', () => {
  it('maps empty to no terms and digits to a number', () => {
    expect(parseTermsDays('')).toEqual({ ok: true, value: null });
    expect(parseTermsDays('  ')).toEqual({ ok: true, value: null });
    expect(parseTermsDays('0')).toEqual({ ok: true, value: 0 });
    expect(parseTermsDays('30')).toEqual({ ok: true, value: 30 });
  });
  it('rejects negatives, decimals, text, and absurd lengths', () => {
    for (const bad of ['-1', '1.5', 'abc', '3 0', '1234567890']) {
      expect(parseTermsDays(bad)).toEqual({ ok: false });
    }
  });
});

describe('parseWholePesos', () => {
  it('accepts whole pesos above zero', () => {
    expect(parseWholePesos('100')).toBe(100);
    expect(parseWholePesos('1,000')).toBe(1000);
  });
  it('review focus: rejects fractional pesos instead of rounding', () => {
    expect(parseWholePesos('12.50')).toBeNull();
  });
  it('rejects zero, negative, empty, and text', () => {
    for (const bad of ['0', '-5', '', 'abc']) {
      expect(parseWholePesos(bad)).toBeNull();
    }
  });
});

describe('buildCommitPayment', () => {
  const picker = (over: Partial<typeof EMPTY_PAYMENT_PICKER>) => ({
    ...EMPTY_PAYMENT_PICKER,
    ...over,
  });

  it('paid builds a plain paid payment', () => {
    expect(buildCommitPayment(EMPTY_PAYMENT_PICKER, 100)).toEqual({
      ok: true,
      payment: { mode: 'paid' },
    });
  });
  it('review focus: paid ignores leftover partial and due fields', () => {
    expect(
      buildCommitPayment(
        picker({ mode: 'paid', paidNow: '40', dueDate: 'garbage' }),
        100,
      ),
    ).toEqual({ ok: true, payment: { mode: 'paid' } });
  });
  it('utang keeps a valid due date and maps blank to null', () => {
    expect(
      buildCommitPayment(picker({ mode: 'utang', dueDate: '2026-12-01' }), 100),
    ).toEqual({ ok: true, payment: { mode: 'utang', dueDate: '2026-12-01' } });
    expect(buildCommitPayment(picker({ mode: 'utang' }), 100)).toEqual({
      ok: true,
      payment: { mode: 'utang', dueDate: null },
    });
  });
  it('review focus: rejects a calendar-invalid due date', () => {
    expect(
      buildCommitPayment(picker({ mode: 'utang', dueDate: '2026-02-30' }), 100),
    ).toEqual({ ok: false, field: 'dueDate' });
  });
  it('partial needs whole pesos strictly between 0 and the total', () => {
    const ok = buildCommitPayment(
      picker({ mode: 'partial', paidNow: '40', dueDate: '2026-12-01' }),
      100,
    );
    expect(ok).toEqual({
      ok: true,
      payment: { mode: 'partial', paidNow: 40, dueDate: '2026-12-01' },
    });
    for (const bad of ['', '0', '100', '150', '12.50']) {
      expect(
        buildCommitPayment(picker({ mode: 'partial', paidNow: bad }), 100),
      ).toEqual({ ok: false, field: 'paidNow' });
    }
  });
  it('review focus: utang and partial are refused on a zero-cost receipt', () => {
    expect(buildCommitPayment(picker({ mode: 'utang' }), 0)).toEqual({
      ok: false,
      field: 'total',
    });
    expect(
      buildCommitPayment(picker({ mode: 'partial', paidNow: '1' }), 0),
    ).toEqual({ ok: false, field: 'total' });
    expect(buildCommitPayment(picker({ mode: 'paid' }), 0)).toEqual({
      ok: true,
      payment: { mode: 'paid' },
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest tests/lib/payables.test.ts`
Expected: FAIL, "Cannot find module '@/lib/payables'".

- [ ] **Step 4: Write the implementation**

Create `lib/payables.ts`:

```ts
import { parsePesosInput } from '@/lib/money';
import type { CommitPayment } from '@/types/payables.types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for a real calendar date written as YYYY-MM-DD. */
export const isValidDateString = (s: string): boolean => {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d
  );
};

const pad = (n: number): string => String(n).padStart(2, '0');

/** Received date plus terms in local calendar days. Null when there are no usable terms. */
export const dueDateFromTerms = (
  receivedDate: string,
  termsDays: number | null,
): string | null => {
  if (termsDays === null || !Number.isInteger(termsDays) || termsDays < 0) {
    return null;
  }
  if (!isValidDateString(receivedDate)) return null;
  const y = Number(receivedDate.slice(0, 4));
  const mo = Number(receivedDate.slice(5, 7));
  const d = Number(receivedDate.slice(8, 10));
  const due = new Date(y, mo - 1, d + termsDays);
  if (Number.isNaN(due.getTime()) || due.getFullYear() > 9999) return null;
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
};

/** Due strictly before today, with money still outstanding. Due today is not overdue. */
export const isOverdue = (
  dueDate: string | null,
  outstanding: number,
  today: string,
): boolean => dueDate !== null && outstanding > 0 && dueDate < today;

/** FIFO allocation of `amount` over the outstandings, in order. Excess is dropped. */
export const splitPayment = (
  amount: number,
  outstandings: number[],
): number[] => {
  let remaining = amount;
  return outstandings.map((outstanding) => {
    const slice = Math.max(0, Math.min(remaining, outstanding));
    remaining -= slice;
    return slice;
  });
};

export type ParsedTerms = { ok: true; value: number | null } | { ok: false };

/** Empty means no terms. Otherwise a whole number of days, 0 or more. */
export const parseTermsDays = (text: string): ParsedTerms => {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: true, value: null };
  if (!/^\d{1,9}$/.test(trimmed)) return { ok: false };
  return { ok: true, value: Number(trimmed) };
};

/** Whole pesos above zero, or null. A typed 12.50 is rejected, never rounded. */
export const parseWholePesos = (text: string): number | null => {
  try {
    const value = parsePesosInput(text) as number;
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

export interface PaymentPickerValue {
  mode: 'paid' | 'utang' | 'partial';
  dueDate: string;
  paidNow: string;
}

export const EMPTY_PAYMENT_PICKER: PaymentPickerValue = {
  mode: 'paid',
  dueDate: '',
  paidNow: '',
};

export type BuildCommitPaymentResult =
  | { ok: true; payment: CommitPayment }
  | { ok: false; field: 'dueDate' | 'paidNow' | 'total' };

/** Turns picker text into a CommitPayment, or names the field that is wrong. */
export const buildCommitPayment = (
  value: PaymentPickerValue,
  total: number,
): BuildCommitPaymentResult => {
  if (value.mode === 'paid') return { ok: true, payment: { mode: 'paid' } };
  if (total <= 0) return { ok: false, field: 'total' };

  const trimmed = value.dueDate.trim();
  if (trimmed !== '' && !isValidDateString(trimmed)) {
    return { ok: false, field: 'dueDate' };
  }
  const dueDate = trimmed === '' ? null : trimmed;

  if (value.mode === 'utang') {
    return { ok: true, payment: { mode: 'utang', dueDate } };
  }
  const paidNow = parseWholePesos(value.paidNow);
  if (paidNow === null || paidNow >= total) {
    return { ok: false, field: 'paidNow' };
  }
  return { ok: true, payment: { mode: 'partial', paidNow, dueDate } };
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/lib/payables.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 6: Commit**

```bash
git add types/payables.types.ts lib/payables.ts tests/lib/payables.test.ts
git commit -m "feat(payables): add pure payable helpers and types" -- types/payables.types.ts lib/payables.ts tests/lib/payables.test.ts
```

---

### Task 2: Migration 25, mock reset, supplier terms, delete guard

**Files:**

- Modify: `database/migrations.ts` (append a block after the v24 block, before the final `}` of `runMigrations`)
- Modify: `tests/__setup__/expo-sqlite-mock.ts` (`resetMockDb` table list)
- Modify: `types/suppliers.types.ts`
- Modify: `database/suppliers.ts`
- Modify: `hooks/useSuppliers.ts`
- Test: `tests/database/supplier-payables-migration.test.ts`
- Test: `tests/database/supplier-terms.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces (Tasks 3, 4, 10): tables `supplier_payables`, `supplier_payments`, `supplier_payment_allocations`; column `suppliers.payment_terms_days`; `Supplier.paymentTermsDays: number | null`; `NewSupplier.paymentTermsDays?: number | null`; `InvalidPaymentTermsError`; `SupplierHasPayablesError`; `InsertSupplierParams.paymentTermsDays?: number | null`.

- [ ] **Step 1: Write the failing migration test**

Create `tests/database/supplier-payables-migration.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import { runMigrations } from '@/database';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedSupplier, setupDeliveryDb } from '../helpers/deliveryFixtures';
import { expectRejection } from '../helpers/expectRejection';

const columns = async (table: string): Promise<string[]> =>
  (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`))
    .map((c) => c.name)
    .sort();

describe('migration v25: supplier payables', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('sets user_version to at least 25', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(25);
  });

  it('creates supplier_payables with the expected columns', async () => {
    expect(await columns('supplier_payables')).toEqual(
      [
        'amount',
        'amount_paid',
        'created_at',
        'due_date',
        'id',
        'note',
        'receipt_id',
        'supplier_id',
        'voided_at',
      ].sort(),
    );
  });

  it('creates supplier_payments and supplier_payment_allocations', async () => {
    expect(await columns('supplier_payments')).toEqual(
      ['amount', 'created_at', 'id', 'note', 'paid_at', 'supplier_id'].sort(),
    );
    expect(await columns('supplier_payment_allocations')).toEqual(
      ['amount', 'id', 'payable_id', 'payment_id'].sort(),
    );
  });

  it('adds suppliers.payment_terms_days and rejects negatives', async () => {
    expect(await columns('suppliers')).toContain('payment_terms_days');
    await seedSupplier('mig-terms');
    await db.runAsync(
      'UPDATE suppliers SET payment_terms_days = 30 WHERE id = ?',
      ['mig-terms'],
    );
    await db.runAsync(
      'UPDATE suppliers SET payment_terms_days = NULL WHERE id = ?',
      ['mig-terms'],
    );
    await expectRejection(
      db.runAsync('UPDATE suppliers SET payment_terms_days = -1 WHERE id = ?', [
        'mig-terms',
      ]),
    );
  });

  it('enforces payable amount checks', async () => {
    const sup = await seedSupplier('mig-checks');
    const insert = (amount: number, paid: number) =>
      db.runAsync(
        "INSERT INTO supplier_payables (supplier_id, amount, amount_paid, created_at) VALUES (?, ?, ?, 'x')",
        [sup, amount, paid],
      );
    await insert(100, 0);
    await expectRejection(insert(0, 0));
    await expectRejection(insert(100, 101));
    await expectRejection(insert(100, -1));
  });

  it('allows one payable per receipt but many manual payables', async () => {
    const sup = await seedSupplier('mig-unique');
    const receipt = await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES (?, 'draft')",
      [sup],
    );
    const insert = (receiptId: number | null) =>
      db.runAsync(
        "INSERT INTO supplier_payables (supplier_id, receipt_id, amount, created_at) VALUES (?, ?, 10, 'x')",
        [sup, receiptId],
      );
    await insert(receipt.lastInsertRowId);
    await expectRejection(insert(receipt.lastInsertRowId));
    await insert(null);
    await insert(null);
  });

  it('deleting a payment cascades its allocations', async () => {
    const sup = await seedSupplier('mig-cascade');
    const payable = await db.runAsync(
      "INSERT INTO supplier_payables (supplier_id, amount, created_at) VALUES (?, 10, 'x')",
      [sup],
    );
    const payment = await db.runAsync(
      "INSERT INTO supplier_payments (supplier_id, amount, paid_at, created_at) VALUES (?, 10, 'x', 'x')",
      [sup],
    );
    await db.runAsync(
      'INSERT INTO supplier_payment_allocations (payment_id, payable_id, amount) VALUES (?, ?, 10)',
      [payment.lastInsertRowId, payable.lastInsertRowId],
    );
    await db.runAsync('DELETE FROM supplier_payments WHERE id = ?', [
      payment.lastInsertRowId,
    ]);
    const left = await db.getAllAsync(
      'SELECT id FROM supplier_payment_allocations',
    );
    expect(left).toHaveLength(0);
  });

  it('migrating from 24 keeps existing suppliers and adds the new schema', async () => {
    await seedSupplier('mig-keep', 'Keeper');
    await db.execAsync(`
      DROP TABLE supplier_payment_allocations;
      DROP TABLE supplier_payments;
      DROP TABLE supplier_payables;
      ALTER TABLE suppliers DROP COLUMN payment_terms_days;
      PRAGMA user_version = 24;
    `);

    await runMigrations();

    const version = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(version?.user_version).toBe(25);
    const kept = await db.getFirstAsync<{
      name: string;
      payment_terms_days: number | null;
    }>('SELECT name, payment_terms_days FROM suppliers WHERE id = ?', [
      'mig-keep',
    ]);
    expect(kept).toEqual({ name: 'Keeper', payment_terms_days: null });
    expect(await columns('supplier_payables')).toContain('receipt_id');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/database/supplier-payables-migration.test.ts`
Expected: FAIL (user_version 24, tables missing).

- [ ] **Step 3: Add migration 25**

In `database/migrations.ts`, replace

```ts
    console.log('Database migrated to v24.');
  }
}
```

with

```ts
    console.log('Database migrated to v24.');
  }

  if (currentVersion < 25) {
    console.log('Running migration to v25 (Supplier payables)...');
    await db.withTransactionAsync(async () => {
      const supplierCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(suppliers)',
      );
      if (
        supplierCols.length > 0 &&
        !supplierCols.some((c) => c.name === 'payment_terms_days')
      ) {
        await db.execAsync(
          'ALTER TABLE suppliers ADD COLUMN payment_terms_days INTEGER CHECK (payment_terms_days IS NULL OR payment_terms_days >= 0);',
        );
      }

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS supplier_payables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_id TEXT NOT NULL REFERENCES suppliers(id),
          receipt_id INTEGER REFERENCES delivery_receipts(id),
          amount INTEGER NOT NULL CHECK(amount > 0),
          amount_paid INTEGER NOT NULL DEFAULT 0
            CHECK(amount_paid >= 0 AND amount_paid <= amount),
          due_date TEXT,
          note TEXT,
          voided_at TEXT,
          created_at TEXT NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_payables_receipt
          ON supplier_payables(receipt_id) WHERE receipt_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_supplier_payables_supplier
          ON supplier_payables(supplier_id, created_at);

        CREATE TABLE IF NOT EXISTS supplier_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_id TEXT NOT NULL REFERENCES suppliers(id),
          amount INTEGER NOT NULL CHECK(amount > 0),
          note TEXT,
          paid_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier
          ON supplier_payments(supplier_id, created_at);

        CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_id INTEGER NOT NULL
            REFERENCES supplier_payments(id) ON DELETE CASCADE,
          payable_id INTEGER NOT NULL REFERENCES supplier_payables(id),
          amount INTEGER NOT NULL CHECK(amount > 0)
        );
        CREATE INDEX IF NOT EXISTS idx_supplier_alloc_payment
          ON supplier_payment_allocations(payment_id);
        CREATE INDEX IF NOT EXISTS idx_supplier_alloc_payable
          ON supplier_payment_allocations(payable_id);
      `);

      await db.execAsync('PRAGMA user_version = 25;');
    });
    console.log('Database migrated to v25.');
  }
}
```

- [ ] **Step 4: Teach `resetMockDb` the new tables**

In `tests/__setup__/expo-sqlite-mock.ts`, children must be deleted before parents. Replace

```ts
    'sqlite_sequence',
    'reprice_flags',
```

with

```ts
    'sqlite_sequence',
    'supplier_payment_allocations',
    'supplier_payments',
    'supplier_payables',
    'reprice_flags',
```

- [ ] **Step 5: Run the migration test**

Run: `npx jest tests/database/supplier-payables-migration.test.ts`
Expected: PASS. If the "migrating from 24" test fails with a `DROP COLUMN` error from the bundled SQLite, replace the `ALTER TABLE ... DROP COLUMN` line and the column assertions with a plain idempotency check (run `runMigrations()` again at version 25 and assert nothing changes), and note it in the commit message.

- [ ] **Step 6: Write the failing supplier-terms tests**

Create `tests/database/supplier-terms.test.ts`:

```ts
import * as Crypto from 'expo-crypto';
import { db } from '@/configs/sqlite';
import {
  InvalidPaymentTermsError,
  SupplierHasPayablesError,
  createSupplier,
  deleteSupplier,
  getSupplier,
  updateSupplier,
} from '@/database/suppliers';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedSupplier, setupDeliveryDb } from '../helpers/deliveryFixtures';

const nextUuid = (id: string) =>
  (Crypto.randomUUID as unknown as jest.Mock).mockReturnValueOnce(id);

describe('supplier payment terms', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('defaults to no terms', async () => {
    nextUuid('t-default');
    const s = await createSupplier({ name: 'A', contact: null, notes: null });
    expect(s.paymentTermsDays).toBeNull();
    expect((await getSupplier('t-default'))?.paymentTermsDays).toBeNull();
  });

  it('stores terms on create and updates and clears them', async () => {
    nextUuid('t-create');
    await createSupplier({
      name: 'B',
      contact: null,
      notes: null,
      paymentTermsDays: 30,
    });
    expect((await getSupplier('t-create'))?.paymentTermsDays).toBe(30);

    await updateSupplier('t-create', { paymentTermsDays: 7 });
    expect((await getSupplier('t-create'))?.paymentTermsDays).toBe(7);

    await updateSupplier('t-create', { name: 'B2' });
    expect((await getSupplier('t-create'))?.paymentTermsDays).toBe(7);

    await updateSupplier('t-create', { paymentTermsDays: null });
    expect((await getSupplier('t-create'))?.paymentTermsDays).toBeNull();
  });

  it('rejects negative and fractional terms', async () => {
    await seedSupplier('t-bad');
    await expect(
      updateSupplier('t-bad', { paymentTermsDays: -1 }),
    ).rejects.toBeInstanceOf(InvalidPaymentTermsError);
    await expect(
      updateSupplier('t-bad', { paymentTermsDays: 1.5 }),
    ).rejects.toBeInstanceOf(InvalidPaymentTermsError);
  });

  it('review focus: deleting a supplier with payables gives a clear message', async () => {
    const sup = await seedSupplier('t-del');
    await db.runAsync(
      "INSERT INTO supplier_payables (supplier_id, amount, created_at) VALUES (?, 10, 'x')",
      [sup],
    );
    const err = await deleteSupplier(sup).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SupplierHasPayablesError);
    expect((err as Error).message).toContain('utang');
    expect(await getSupplier(sup)).not.toBeNull();
  });

  it('still deletes a supplier with no payables', async () => {
    const sup = await seedSupplier('t-del-ok');
    await deleteSupplier(sup);
    expect(await getSupplier(sup)).toBeNull();
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx jest tests/database/supplier-terms.test.ts`
Expected: FAIL (`InvalidPaymentTermsError` not exported).

- [ ] **Step 8: Update the supplier type**

Replace the whole of `types/suppliers.types.ts` with:

```ts
export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  /** Default payment terms in days. Null means no default terms. */
  paymentTermsDays: number | null;
  createdAt: number; // Unix epoch in ms
}

export type NewSupplier = Omit<
  Supplier,
  'id' | 'createdAt' | 'paymentTermsDays'
> & { paymentTermsDays?: number | null };
```

- [ ] **Step 9: Update `database/suppliers.ts`**

Apply these edits.

1. After the imports, add the error classes and normalizer:

```ts
export class InvalidPaymentTermsError extends Error {
  constructor(value: unknown) {
    super(
      `Payment terms must be a whole number of days, 0 or more (got ${String(value)})`,
    );
    this.name = 'InvalidPaymentTermsError';
  }
}

export class SupplierHasPayablesError extends Error {
  supplierId: string;
  constructor(supplierId: string) {
    super('This supplier still has utang records and cannot be deleted.');
    this.name = 'SupplierHasPayablesError';
    this.supplierId = supplierId;
  }
}

const normalizeTerms = (value: number | null | undefined): number | null => {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidPaymentTermsError(value);
  }
  return value;
};
```

2. In `interface SupplierRow` add `payment_terms_days: number | null;` after `notes`.

3. In `rowToSupplier` add `paymentTermsDays: row.payment_terms_days,` after `notes: row.notes,`.

4. Replace the body of `createSupplier` from `const id` to the `return`:

```ts
const id = Crypto.randomUUID();
const createdAt = Date.now();
const paymentTermsDays = normalizeTerms(input.paymentTermsDays);
await db.runAsync(
  'INSERT INTO suppliers (id, name, contact, notes, payment_terms_days, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  [
    id,
    input.name,
    input.contact ?? null,
    input.notes ?? null,
    paymentTermsDays,
    createdAt,
  ],
);
return {
  id,
  createdAt,
  name: input.name,
  contact: input.contact ?? null,
  notes: input.notes ?? null,
  paymentTermsDays,
};
```

5. In `updateSupplier`, after the `notes` line add

```ts
const paymentTermsDays =
  patch.paymentTermsDays !== undefined
    ? normalizeTerms(patch.paymentTermsDays)
    : current.payment_terms_days;
```

and change the UPDATE to

```ts
await db.runAsync(
  'UPDATE suppliers SET name = ?, contact = ?, notes = ?, payment_terms_days = ? WHERE id = ?',
  [name, contact ?? null, notes ?? null, paymentTermsDays, id],
);
```

6. Make the same two changes inside `updateSupplierWithProducts` (the `paymentTermsDays` const after `notes`, and the UPDATE statement with `payment_terms_days = ?`).

7. In `createSupplierWithProducts`, add `const paymentTermsDays = normalizeTerms(input.paymentTermsDays);` after `createdAt`, change the INSERT to the six-column form used in step 4, and replace `inserted = { id, createdAt, ...input };` with:

```ts
inserted = {
  id,
  createdAt,
  name: input.name,
  contact: input.contact ?? null,
  notes: input.notes ?? null,
  paymentTermsDays,
};
```

8. Replace `deleteSupplier` with:

```ts
export const deleteSupplier = async (id: string): Promise<void> => {
  const blocking = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM supplier_payables WHERE supplier_id = ? LIMIT 1',
    [id],
  );
  if (blocking) throw new SupplierHasPayablesError(id);
  await db.runAsync('DELETE FROM suppliers WHERE id = ?', [id]);
};
```

- [ ] **Step 10: Pass terms through the supplier hook**

In `hooks/useSuppliers.ts`, add `paymentTermsDays?: number | null;` to `InsertSupplierParams`, and change the insert mutation to:

```ts
    mutationFn: ({
      name,
      contact,
      notes,
      paymentTermsDays,
      productIds,
    }: InsertSupplierParams) =>
      createSupplierWithProducts(
        {
          name,
          contact: contact ?? null,
          notes: notes ?? null,
          paymentTermsDays: paymentTermsDays ?? null,
        },
        productIds ?? []
      ),
```

The existing `onError` already toasts `error.message`, so the delete guard message reaches the owner.

- [ ] **Step 11: Run tests and the type check**

Run: `npx jest tests/database/supplier-terms.test.ts tests/database/supplier-payables-migration.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors. If any other file builds a `Supplier` object literal and now misses `paymentTermsDays`, add `paymentTermsDays: null` to it.

- [ ] **Step 12: Run the whole database test folder for regressions**

Run: `npx jest tests/database tests/sqlite`
Expected: PASS (existing delivery and price-history tests still pass with the extended `resetMockDb`).

- [ ] **Step 13: Commit**

```bash
git add database/migrations.ts database/suppliers.ts hooks/useSuppliers.ts types/suppliers.types.ts tests/__setup__/expo-sqlite-mock.ts tests/database/supplier-payables-migration.test.ts tests/database/supplier-terms.test.ts
git commit -m "feat(payables): migration 25, supplier payment terms, delete guard" -- database/migrations.ts database/suppliers.ts hooks/useSuppliers.ts types/suppliers.types.ts tests/__setup__/expo-sqlite-mock.ts tests/database/supplier-payables-migration.test.ts tests/database/supplier-terms.test.ts
```

---

### Task 3: Supplier payables data layer

**Files:**

- Create: `database/supplierPayables.ts`
- Test: `tests/database/supplier-payables.test.ts`

**Interfaces:**

- Consumes: Task 1 (`splitPayment`, `isOverdue`, `isValidDateString`, types), Task 2 (tables). `getTodayDateString` from `@/utils/timezone`.
- Produces (Tasks 4, 5):
  - Errors: `InvalidPayableAmountError(amount)`, `InvalidDueDateError(value)`, `PaymentExceedsBalanceError(amount, balance)` (fields `amount`, `balance`), `PayableHasPaymentsError(receiptId)` (field `receiptId`), `PayableLockedError(payableId)`, `ReceiptNoCostError(receiptId)`, `InvalidPartialPaymentError(receiptId, total)`.
  - `addSupplierPayable(input: AddPayableInput): Promise<number>` with `AddPayableInput = { supplierId: string; amount: number; dueDate: string | null; note?: string | null }`.
  - `updateSupplierPayable(id: number, patch: UpdatePayableInput): Promise<void>` with `UpdatePayableInput = { dueDate?: string | null; note?: string | null; amount?: number }`.
  - `deleteSupplierPayable(id: number): Promise<void>`.
  - `recordSupplierPayment(input: RecordSupplierPaymentInput): Promise<number>` with `{ supplierId: string; amount: number; note?: string | null; paidAt?: string }`.
  - `deleteSupplierPayment(id: number): Promise<void>`.
  - `getSupplierBalances(today?: string): Promise<SupplierBalance[]>`, `getPayablesSummary(today?: string): Promise<PayablesSummary>`, `getSupplierPayables(supplierId: string, today?: string): Promise<SupplierPayable[]>`, `getSupplierPayments(supplierId: string): Promise<SupplierPayment[]>`.
  - `createReceiptPayable(receiptId: number, supplierId: string, total: number, payment: CommitPayment): Promise<void>` (caller's transaction).

- [ ] **Step 1: Write the failing tests**

Create `tests/database/supplier-payables.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  InvalidDueDateError,
  InvalidPayableAmountError,
  PayableLockedError,
  PaymentExceedsBalanceError,
  addSupplierPayable,
  deleteSupplierPayable,
  deleteSupplierPayment,
  getPayablesSummary,
  getSupplierBalances,
  getSupplierPayables,
  getSupplierPayments,
  recordSupplierPayment,
  updateSupplierPayable,
} from '@/database/supplierPayables';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedSupplier, setupDeliveryDb } from '../helpers/deliveryFixtures';

const paidOf = async (id: number): Promise<number | undefined> =>
  (
    await db.getFirstAsync<{ amount_paid: number }>(
      'SELECT amount_paid FROM supplier_payables WHERE id = ?',
      [id],
    )
  )?.amount_paid;

const count = async (table: string): Promise<number> =>
  (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))
    ?.n ?? 0;

const bill = (
  supplierId: string,
  amount: number,
  dueDate: string | null = null,
) => addSupplierPayable({ supplierId, amount, dueDate });

describe('manual payables', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('adds a payable with no receipt', async () => {
    const sup = await seedSupplier('p-add');
    const id = await addSupplierPayable({
      supplierId: sup,
      amount: 250,
      dueDate: '2026-12-01',
      note: 'Soda on credit',
    });
    const list = await getSupplierPayables(sup, '2026-11-14');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id,
      receiptId: null,
      amount: 250,
      amountPaid: 0,
      outstanding: 250,
      dueDate: '2026-12-01',
      note: 'Soda on credit',
      isOverdue: false,
    });
  });

  it('enforces a positive whole amount', async () => {
    const sup = await seedSupplier('p-amt');
    for (const bad of [0, -5, 1.5, Number.NaN]) {
      await expect(bill(sup, bad)).rejects.toBeInstanceOf(
        InvalidPayableAmountError,
      );
    }
    expect(await count('supplier_payables')).toBe(0);
  });

  it('requires an existing supplier', async () => {
    await expect(bill('nobody', 10)).rejects.toThrow('not found');
  });

  it('review focus: rejects a calendar-invalid due date', async () => {
    const sup = await seedSupplier('p-due');
    await expect(bill(sup, 10, '2026-02-30')).rejects.toBeInstanceOf(
      InvalidDueDateError,
    );
    await expect(bill(sup, 10, '14/11/2026')).rejects.toBeInstanceOf(
      InvalidDueDateError,
    );
  });
});

describe('FIFO supplier payments', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('settles the oldest payable first and spills into the next', async () => {
    const sup = await seedSupplier('f-1');
    const a = await bill(sup, 100);
    const b = await bill(sup, 50);
    const paymentId = await recordSupplierPayment({
      supplierId: sup,
      amount: 120,
    });

    expect(await paidOf(a)).toBe(100);
    expect(await paidOf(b)).toBe(20);
    const allocations = await db.getAllAsync<{
      payable_id: number;
      amount: number;
    }>(
      'SELECT payable_id, amount FROM supplier_payment_allocations WHERE payment_id = ? ORDER BY id',
      [paymentId],
    );
    expect(allocations).toEqual([
      { payable_id: a, amount: 100 },
      { payable_id: b, amount: 20 },
    ]);
  });

  it('a payment equal to the balance settles everything', async () => {
    const sup = await seedSupplier('f-2');
    const a = await bill(sup, 100);
    const b = await bill(sup, 50);
    await recordSupplierPayment({ supplierId: sup, amount: 150 });
    expect(await paidOf(a)).toBe(100);
    expect(await paidOf(b)).toBe(50);
    expect(await getSupplierBalances()).toEqual([]);
  });

  it('rejects a payment above the balance and writes nothing', async () => {
    const sup = await seedSupplier('f-3');
    const a = await bill(sup, 100);
    const err = await recordSupplierPayment({
      supplierId: sup,
      amount: 101,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PaymentExceedsBalanceError);
    expect((err as PaymentExceedsBalanceError).balance).toBe(100);
    expect(await count('supplier_payments')).toBe(0);
    expect(await count('supplier_payment_allocations')).toBe(0);
    expect(await paidOf(a)).toBe(0);
  });

  it('rejects zero, fractional, and negative payments, and a supplier owed nothing', async () => {
    const sup = await seedSupplier('f-4');
    await bill(sup, 100);
    for (const bad of [0, -1, 12.5]) {
      await expect(
        recordSupplierPayment({ supplierId: sup, amount: bad }),
      ).rejects.toBeInstanceOf(InvalidPayableAmountError);
    }
    const other = await seedSupplier('f-4-other');
    await expect(
      recordSupplierPayment({ supplierId: other, amount: 5 }),
    ).rejects.toBeInstanceOf(PaymentExceedsBalanceError);
  });

  it("never touches another supplier's payables", async () => {
    const one = await seedSupplier('f-5a');
    const two = await seedSupplier('f-5b');
    const a = await bill(one, 100);
    const b = await bill(two, 100);
    await recordSupplierPayment({ supplierId: one, amount: 60 });
    expect(await paidOf(a)).toBe(60);
    expect(await paidOf(b)).toBe(0);
  });

  it('deleting a payment reverses amount_paid and removes allocations', async () => {
    const sup = await seedSupplier('f-6');
    const a = await bill(sup, 100);
    const b = await bill(sup, 50);
    const paymentId = await recordSupplierPayment({
      supplierId: sup,
      amount: 120,
    });
    await deleteSupplierPayment(paymentId);
    expect(await paidOf(a)).toBe(0);
    expect(await paidOf(b)).toBe(0);
    expect(await count('supplier_payment_allocations')).toBe(0);
    expect(await count('supplier_payments')).toBe(0);
  });

  it("deleting an older payment leaves a newer payment's allocation intact", async () => {
    const sup = await seedSupplier('f-7');
    const a = await bill(sup, 100);
    const b = await bill(sup, 50);
    const first = await recordSupplierPayment({ supplierId: sup, amount: 100 });
    await recordSupplierPayment({ supplierId: sup, amount: 20 });
    await deleteSupplierPayment(first);
    expect(await paidOf(a)).toBe(0);
    expect(await paidOf(b)).toBe(20);
    expect(await count('supplier_payment_allocations')).toBe(1);
  });

  it('deleting a payment that does not exist is a no-op', async () => {
    await deleteSupplierPayment(9999);
  });

  it('lists payments newest first', async () => {
    const sup = await seedSupplier('f-8');
    await bill(sup, 100);
    await recordSupplierPayment({
      supplierId: sup,
      amount: 10,
      paidAt: '2026-11-01T00:00:00.000Z',
    });
    await recordSupplierPayment({
      supplierId: sup,
      amount: 20,
      paidAt: '2026-11-05T00:00:00.000Z',
      note: 'cash',
    });
    const payments = await getSupplierPayments(sup);
    expect(payments.map((p) => p.amount)).toEqual([20, 10]);
    expect(payments[0]?.note).toBe('cash');
  });
});

describe('edit and delete payables', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('always lets due date and note change', async () => {
    const sup = await seedSupplier('e-1');
    const id = await bill(sup, 100);
    await updateSupplierPayable(id, { dueDate: '2026-12-25', note: 'moved' });
    const [row] = await getSupplierPayables(sup, '2026-11-14');
    expect(row).toMatchObject({ dueDate: '2026-12-25', note: 'moved' });
    await updateSupplierPayable(id, { dueDate: null });
    const [cleared] = await getSupplierPayables(sup, '2026-11-14');
    expect(cleared?.dueDate).toBeNull();
  });

  it('review focus: rejects a calendar-invalid due date on edit', async () => {
    const sup = await seedSupplier('e-1b');
    const id = await bill(sup, 100);
    await expect(
      updateSupplierPayable(id, { dueDate: '2026-02-30' }),
    ).rejects.toBeInstanceOf(InvalidDueDateError);
  });

  it('edits the amount of a manual payable but not below amount_paid', async () => {
    const sup = await seedSupplier('e-2');
    const id = await bill(sup, 100);
    await recordSupplierPayment({ supplierId: sup, amount: 40 });
    await updateSupplierPayable(id, { amount: 60 });
    await expect(
      updateSupplierPayable(id, { amount: 39 }),
    ).rejects.toBeInstanceOf(InvalidPayableAmountError);
    await expect(
      updateSupplierPayable(id, { amount: 0 }),
    ).rejects.toBeInstanceOf(InvalidPayableAmountError);
    const [row] = await getSupplierPayables(sup, '2026-11-14');
    expect(row?.amount).toBe(60);
  });

  it('blocks amount edits on a receipt payable', async () => {
    const sup = await seedSupplier('e-3');
    const receipt = await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES (?, 'draft')",
      [sup],
    );
    const inserted = await db.runAsync(
      "INSERT INTO supplier_payables (supplier_id, receipt_id, amount, created_at) VALUES (?, ?, 100, 'x')",
      [sup, receipt.lastInsertRowId],
    );
    await expect(
      updateSupplierPayable(inserted.lastInsertRowId, { amount: 90 }),
    ).rejects.toBeInstanceOf(PayableLockedError);
    await updateSupplierPayable(inserted.lastInsertRowId, { note: 'ok' });
  });

  it('deletes an untouched manual payable', async () => {
    const sup = await seedSupplier('e-4');
    const id = await bill(sup, 100);
    await deleteSupplierPayable(id);
    expect(await count('supplier_payables')).toBe(0);
  });

  it('blocks delete when allocations exist or a receipt is linked', async () => {
    const sup = await seedSupplier('e-5');
    const paid = await bill(sup, 100);
    await recordSupplierPayment({ supplierId: sup, amount: 10 });
    await expect(deleteSupplierPayable(paid)).rejects.toBeInstanceOf(
      PayableLockedError,
    );

    const receipt = await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES (?, 'draft')",
      [sup],
    );
    const linked = await db.runAsync(
      "INSERT INTO supplier_payables (supplier_id, receipt_id, amount, created_at) VALUES (?, ?, 100, 'x')",
      [sup, receipt.lastInsertRowId],
    );
    await expect(
      deleteSupplierPayable(linked.lastInsertRowId),
    ).rejects.toBeInstanceOf(PayableLockedError);
  });

  it('allows delete again once the payment is removed', async () => {
    const sup = await seedSupplier('e-6');
    const id = await bill(sup, 100);
    const paymentId = await recordSupplierPayment({
      supplierId: sup,
      amount: 10,
    });
    await deleteSupplierPayment(paymentId);
    await deleteSupplierPayable(id);
    expect(await count('supplier_payables')).toBe(0);
  });
});

describe('balances, overdue, and summary', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });
  const today = '2026-11-14';

  it('excludes a voided payable from balance and payments', async () => {
    const sup = await seedSupplier('b-1');
    const a = await bill(sup, 100);
    await bill(sup, 50);
    await db.runAsync(
      "UPDATE supplier_payables SET voided_at = '2026-11-14T00:00:00.000Z' WHERE id = ?",
      [a],
    );
    const [balance] = await getSupplierBalances(today);
    expect(balance).toMatchObject({ supplierId: sup, balance: 50 });
    await expect(
      recordSupplierPayment({ supplierId: sup, amount: 51 }),
    ).rejects.toBeInstanceOf(PaymentExceedsBalanceError);
    expect(await getSupplierPayables(sup, today)).toHaveLength(1);
  });

  it('counts overdue strictly before today and ignores no due date', async () => {
    const sup = await seedSupplier('b-2');
    await bill(sup, 100, '2026-11-13');
    await bill(sup, 50, '2026-11-14');
    await bill(sup, 25, null);
    const [balance] = await getSupplierBalances(today);
    expect(balance).toMatchObject({
      balance: 175,
      overdueAmount: 100,
      overdueCount: 1,
    });
    expect(await getPayablesSummary(today)).toEqual({
      totalOwed: 175,
      totalOverdue: 100,
      overdueCount: 1,
    });
    const list = await getSupplierPayables(sup, today);
    expect(list.map((p) => p.isOverdue)).toEqual([true, false, false]);
  });

  it('a fully paid overdue payable stops being overdue and the supplier drops off the list', async () => {
    const sup = await seedSupplier('b-3');
    await bill(sup, 100, '2026-11-01');
    await recordSupplierPayment({ supplierId: sup, amount: 100 });
    expect(await getSupplierBalances(today)).toEqual([]);
    expect(await getPayablesSummary(today)).toEqual({
      totalOwed: 0,
      totalOverdue: 0,
      overdueCount: 0,
    });
  });

  it('orders suppliers with overdue money first', async () => {
    const calm = await seedSupplier('b-4a', 'Calm Co');
    const late = await seedSupplier('b-4b', 'Late Co');
    await bill(calm, 500, '2026-12-31');
    await bill(late, 50, '2026-11-01');
    const rows = await getSupplierBalances(today);
    expect(rows.map((r) => r.supplierName)).toEqual(['Late Co', 'Calm Co']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/database/supplier-payables.test.ts`
Expected: FAIL, "Cannot find module '@/database/supplierPayables'".

- [ ] **Step 3: Write the implementation**

Create `database/supplierPayables.ts`:

```ts
import { db } from '../configs/sqlite';
import { isOverdue, isValidDateString, splitPayment } from '../lib/payables';
import type {
  CommitPayment,
  PayablesSummary,
  SupplierBalance,
  SupplierPayable,
  SupplierPayment,
} from '../types/payables.types';
import { getTodayDateString } from '../utils/timezone';

export class InvalidPayableAmountError extends Error {
  amount: number;
  constructor(amount: number) {
    super(`Amount must be a whole number of pesos above zero (got ${amount})`);
    this.name = 'InvalidPayableAmountError';
    this.amount = amount;
  }
}

export class InvalidDueDateError extends Error {
  value: string;
  constructor(value: string) {
    super(
      `Due date must be a real date written as YYYY-MM-DD (got "${value}")`,
    );
    this.name = 'InvalidDueDateError';
    this.value = value;
  }
}

export class PaymentExceedsBalanceError extends Error {
  amount: number;
  balance: number;
  constructor(amount: number, balance: number) {
    super(
      `Payment of ${amount} is more than the supplier balance of ${balance}`,
    );
    this.name = 'PaymentExceedsBalanceError';
    this.amount = amount;
    this.balance = balance;
  }
}

export class PayableHasPaymentsError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(
      `Delivery receipt ${receiptId} has payments recorded against it. Delete those payments first.`,
    );
    this.name = 'PayableHasPaymentsError';
    this.receiptId = receiptId;
  }
}

export class PayableLockedError extends Error {
  payableId: number;
  constructor(payableId: number) {
    super(`Payable ${payableId} can no longer be changed that way`);
    this.name = 'PayableLockedError';
    this.payableId = payableId;
  }
}

export class ReceiptNoCostError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} has no cost, so it cannot be utang`);
    this.name = 'ReceiptNoCostError';
    this.receiptId = receiptId;
  }
}

export class InvalidPartialPaymentError extends Error {
  receiptId: number;
  total: number;
  constructor(receiptId: number, total: number) {
    super(
      `Partial payment for receipt ${receiptId} must be whole pesos above 0 and below ${total}`,
    );
    this.name = 'InvalidPartialPaymentError';
    this.receiptId = receiptId;
    this.total = total;
  }
}

interface PayableRow {
  id: number;
  supplier_id: string;
  receipt_id: number | null;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  note: string | null;
  voided_at: string | null;
  created_at: string;
}

const mapPayable = (r: PayableRow, today: string): SupplierPayable => {
  const outstanding = r.amount - r.amount_paid;
  return {
    id: r.id,
    supplierId: r.supplier_id,
    receiptId: r.receipt_id,
    amount: r.amount,
    amountPaid: r.amount_paid,
    outstanding,
    dueDate: r.due_date,
    note: r.note,
    voidedAt: r.voided_at,
    createdAt: r.created_at,
    isOverdue:
      r.voided_at === null && isOverdue(r.due_date, outstanding, today),
  };
};

const assertPositiveInt = (amount: number): void => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new InvalidPayableAmountError(amount);
  }
};

/** Blank means no due date. Anything else must be a real YYYY-MM-DD date. */
const normalizeDueDate = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (!isValidDateString(trimmed)) throw new InvalidDueDateError(value);
  return trimmed;
};

const cleanNote = (note: string | null | undefined): string | null =>
  note?.trim() || null;

export interface AddPayableInput {
  supplierId: string;
  amount: number;
  dueDate: string | null;
  note?: string | null;
}

/** Manual utang with no delivery receipt. */
export const addSupplierPayable = async (
  input: AddPayableInput,
): Promise<number> => {
  assertPositiveInt(input.amount);
  const dueDate = normalizeDueDate(input.dueDate);
  let id = 0;
  await db.withTransactionAsync(async () => {
    const supplier = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM suppliers WHERE id = ?',
      [input.supplierId],
    );
    if (!supplier) throw new Error(`Supplier ${input.supplierId} not found`);
    const result = await db.runAsync(
      'INSERT INTO supplier_payables (supplier_id, receipt_id, amount, due_date, note, created_at) VALUES (?, NULL, ?, ?, ?, ?)',
      [
        input.supplierId,
        input.amount,
        dueDate,
        cleanNote(input.note),
        new Date().toISOString(),
      ],
    );
    id = result.lastInsertRowId;
  });
  return id;
};

export interface UpdatePayableInput {
  dueDate?: string | null;
  note?: string | null;
  amount?: number;
}

/**
 * Due date and note are always editable. The amount is editable only on a
 * manual payable and never below what is already paid.
 */
export const updateSupplierPayable = async (
  id: number,
  patch: UpdatePayableInput,
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<PayableRow>(
      'SELECT * FROM supplier_payables WHERE id = ?',
      [id],
    );
    if (!row) throw new Error(`Payable ${id} not found`);
    if (row.voided_at !== null) throw new PayableLockedError(id);

    let amount = row.amount;
    if (patch.amount !== undefined) {
      if (row.receipt_id !== null) throw new PayableLockedError(id);
      assertPositiveInt(patch.amount);
      if (patch.amount < row.amount_paid) {
        throw new InvalidPayableAmountError(patch.amount);
      }
      amount = patch.amount;
    }
    const dueDate =
      patch.dueDate !== undefined
        ? normalizeDueDate(patch.dueDate)
        : row.due_date;
    const note = patch.note !== undefined ? cleanNote(patch.note) : row.note;

    await db.runAsync(
      'UPDATE supplier_payables SET amount = ?, due_date = ?, note = ? WHERE id = ?',
      [amount, dueDate, note, id],
    );
  });
};

/** Only an untouched manual payable can be deleted. */
export const deleteSupplierPayable = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<PayableRow>(
      'SELECT * FROM supplier_payables WHERE id = ?',
      [id],
    );
    if (!row) return;
    if (row.receipt_id !== null) throw new PayableLockedError(id);
    const allocation = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM supplier_payment_allocations WHERE payable_id = ? LIMIT 1',
      [id],
    );
    if (allocation) throw new PayableLockedError(id);
    await db.runAsync('DELETE FROM supplier_payables WHERE id = ?', [id]);
  });
};

export interface RecordSupplierPaymentInput {
  supplierId: string;
  amount: number;
  note?: string | null;
  paidAt?: string;
}

/**
 * Records a payment and allocates it oldest first across the supplier's open
 * payables. The CHECK on amount_paid is the safety net if two payments race.
 */
export const recordSupplierPayment = async (
  input: RecordSupplierPaymentInput,
): Promise<number> => {
  assertPositiveInt(input.amount);
  let paymentId = 0;
  await db.withTransactionAsync(async () => {
    const owed = await db.getFirstAsync<{ balance: number }>(
      'SELECT COALESCE(SUM(amount - amount_paid), 0) AS balance FROM supplier_payables WHERE supplier_id = ? AND voided_at IS NULL',
      [input.supplierId],
    );
    const balance = owed?.balance ?? 0;
    if (input.amount > balance) {
      throw new PaymentExceedsBalanceError(input.amount, balance);
    }

    const now = new Date().toISOString();
    const result = await db.runAsync(
      'INSERT INTO supplier_payments (supplier_id, amount, note, paid_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [
        input.supplierId,
        input.amount,
        cleanNote(input.note),
        input.paidAt ?? now,
        now,
      ],
    );
    paymentId = result.lastInsertRowId;

    const open = await db.getAllAsync<{ id: number; outstanding: number }>(
      `SELECT id, amount - amount_paid AS outstanding
       FROM supplier_payables
       WHERE supplier_id = ? AND voided_at IS NULL AND amount > amount_paid
       ORDER BY created_at ASC, id ASC`,
      [input.supplierId],
    );
    const slices = splitPayment(
      input.amount,
      open.map((o) => o.outstanding),
    );
    for (let i = 0; i < open.length; i += 1) {
      const row = open[i];
      const slice = slices[i];
      if (!row || !slice) continue;
      await db.runAsync(
        'INSERT INTO supplier_payment_allocations (payment_id, payable_id, amount) VALUES (?, ?, ?)',
        [paymentId, row.id, slice],
      );
      await db.runAsync(
        'UPDATE supplier_payables SET amount_paid = amount_paid + ? WHERE id = ?',
        [slice, row.id],
      );
    }
  });
  return paymentId;
};

/** Reverses every allocation of the payment, then deletes it (cascade removes the rows). */
export const deleteSupplierPayment = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const payment = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM supplier_payments WHERE id = ?',
      [id],
    );
    if (!payment) return;
    const allocations = await db.getAllAsync<{
      payable_id: number;
      amount: number;
    }>(
      'SELECT payable_id, amount FROM supplier_payment_allocations WHERE payment_id = ?',
      [id],
    );
    for (const a of allocations) {
      await db.runAsync(
        'UPDATE supplier_payables SET amount_paid = amount_paid - ? WHERE id = ?',
        [a.amount, a.payable_id],
      );
    }
    await db.runAsync('DELETE FROM supplier_payments WHERE id = ?', [id]);
  });
};

/** Suppliers with a balance above zero. Overdue money first, then largest balance. */
export const getSupplierBalances = async (
  today: string = getTodayDateString(),
): Promise<SupplierBalance[]> => {
  const rows = await db.getAllAsync<{
    supplier_id: string;
    supplier_name: string;
    balance: number;
    overdue_amount: number;
    overdue_count: number;
  }>(
    `SELECT s.id AS supplier_id, s.name AS supplier_name,
            SUM(p.amount - p.amount_paid) AS balance,
            COALESCE(SUM(CASE WHEN p.due_date IS NOT NULL AND p.due_date < ?
                              THEN p.amount - p.amount_paid ELSE 0 END), 0) AS overdue_amount,
            COALESCE(SUM(CASE WHEN p.due_date IS NOT NULL AND p.due_date < ?
                              THEN 1 ELSE 0 END), 0) AS overdue_count
     FROM supplier_payables p
     JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.voided_at IS NULL AND p.amount > p.amount_paid
     GROUP BY s.id
     ORDER BY overdue_amount DESC, balance DESC, supplier_name ASC`,
    [today, today],
  );
  return rows.map((r) => ({
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    balance: r.balance,
    overdueAmount: r.overdue_amount,
    overdueCount: r.overdue_count,
  }));
};

export const getPayablesSummary = async (
  today: string = getTodayDateString(),
): Promise<PayablesSummary> => {
  const row = await db.getFirstAsync<{
    total_owed: number;
    total_overdue: number;
    overdue_count: number;
  }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) AS total_owed,
            COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date < ?
                              THEN amount - amount_paid ELSE 0 END), 0) AS total_overdue,
            COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date < ?
                              THEN 1 ELSE 0 END), 0) AS overdue_count
     FROM supplier_payables
     WHERE voided_at IS NULL AND amount > amount_paid`,
    [today, today],
  );
  return {
    totalOwed: row?.total_owed ?? 0,
    totalOverdue: row?.total_overdue ?? 0,
    overdueCount: row?.overdue_count ?? 0,
  };
};

/** Non-voided payables of one supplier, oldest first (the FIFO order). */
export const getSupplierPayables = async (
  supplierId: string,
  today: string = getTodayDateString(),
): Promise<SupplierPayable[]> => {
  const rows = await db.getAllAsync<PayableRow>(
    'SELECT * FROM supplier_payables WHERE supplier_id = ? AND voided_at IS NULL ORDER BY created_at ASC, id ASC',
    [supplierId],
  );
  return rows.map((r) => mapPayable(r, today));
};

export const getSupplierPayments = async (
  supplierId: string,
): Promise<SupplierPayment[]> => {
  const rows = await db.getAllAsync<{
    id: number;
    supplier_id: string;
    amount: number;
    note: string | null;
    paid_at: string;
    created_at: string;
  }>(
    'SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY paid_at DESC, id DESC',
    [supplierId],
  );
  return rows.map((r) => ({
    id: r.id,
    supplierId: r.supplier_id,
    amount: r.amount,
    note: r.note,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  }));
};

/**
 * Creates the payable for a delivery being committed. The caller owns the
 * transaction. Mode paid creates nothing. A partial payment is allocated only
 * to the new payable, never to older ones.
 */
export const createReceiptPayable = async (
  receiptId: number,
  supplierId: string,
  total: number,
  payment: CommitPayment,
): Promise<void> => {
  if (payment.mode === 'paid') return;
  if (total <= 0) throw new ReceiptNoCostError(receiptId);
  const dueDate = normalizeDueDate(payment.dueDate);
  if (payment.mode === 'partial') {
    const paidNow = payment.paidNow;
    if (!Number.isInteger(paidNow) || paidNow <= 0 || paidNow >= total) {
      throw new InvalidPartialPaymentError(receiptId, total);
    }
  }

  const now = new Date().toISOString();
  const inserted = await db.runAsync(
    'INSERT INTO supplier_payables (supplier_id, receipt_id, amount, amount_paid, due_date, note, created_at) VALUES (?, ?, ?, 0, ?, NULL, ?)',
    [supplierId, receiptId, total, dueDate, now],
  );
  const payableId = inserted.lastInsertRowId;

  if (payment.mode === 'partial') {
    const paidNow = payment.paidNow;
    const paid = await db.runAsync(
      'INSERT INTO supplier_payments (supplier_id, amount, note, paid_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [supplierId, paidNow, `Delivery receipt #${receiptId}`, now, now],
    );
    await db.runAsync(
      'INSERT INTO supplier_payment_allocations (payment_id, payable_id, amount) VALUES (?, ?, ?)',
      [paid.lastInsertRowId, payableId, paidNow],
    );
    await db.runAsync(
      'UPDATE supplier_payables SET amount_paid = ? WHERE id = ?',
      [paidNow, payableId],
    );
  }
};
```

- [ ] **Step 4: Run the tests**

Run: `npx jest tests/database/supplier-payables.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the single-handle guard and type check**

Run: `npx jest tests/sqlite/single-handle.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add database/supplierPayables.ts tests/database/supplier-payables.test.ts
git commit -m "feat(payables): add supplier payables data layer with FIFO payments" -- database/supplierPayables.ts tests/database/supplier-payables.test.ts
```

---

### Task 4: Delivery commit and void integration

**Files:**

- Modify: `database/deliveries.ts` (`commitDeliveryReceipt`, `runCommit`, `runVoid`, imports)
- Test: `tests/database/delivery-commit-payables.test.ts`

**Interfaces:**

- Consumes: Task 3 `createReceiptPayable`, `PayableHasPaymentsError`; Task 1 `CommitPayment`.
- Produces (Tasks 5, 9): `commitDeliveryReceipt(receiptId: number, payment?: CommitPayment): Promise<void>`. `voidDeliveryReceipt` additionally throws `PayableHasPaymentsError` and voids the payable.

- [ ] **Step 1: Write the failing tests**

Create `tests/database/delivery-commit-payables.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  ReceiptNoCostError,
  commitDeliveryReceipt,
  getDeliveryReceipt,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import {
  InvalidDueDateError,
  InvalidPartialPaymentError,
  PayableHasPaymentsError,
  addSupplierPayable,
  deleteSupplierPayment,
  getSupplierBalances,
} from '@/database/supplierPayables';
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

// 4 pieces at 25 pesos: the receipt total is 100.
const draft = async (supplierId: string, sku: string, cost = 25) => {
  const productId = await seedProduct({ name: sku, sku, qty: 0, cost });
  const receiptId = await saveDeliveryDraft({
    supplierId,
    lines: [retail(productId, 4, 4, cost)],
  });
  return { receiptId, productId };
};

const rows = async <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
  db.getAllAsync<T>(sql, params as never[]);

const count = async (table: string): Promise<number> =>
  (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))
    ?.n ?? 0;

describe('commitDeliveryReceipt with a payment choice', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('creates no payable when the payment is omitted or paid', async () => {
    const sup = await seedSupplier('c-1');
    const one = await draft(sup, 'C1A');
    await commitDeliveryReceipt(one.receiptId);
    const two = await draft(sup, 'C1B');
    await commitDeliveryReceipt(two.receiptId, { mode: 'paid' });
    expect(await count('supplier_payables')).toBe(0);
    expect(await count('supplier_payments')).toBe(0);
    expect((await stockOf(one.productId)).quantity).toBe(4);
  });

  it('utang creates a payable equal to the receipt total with the due date', async () => {
    const sup = await seedSupplier('c-2');
    const { receiptId } = await draft(sup, 'C2');
    await commitDeliveryReceipt(receiptId, {
      mode: 'utang',
      dueDate: '2026-12-01',
    });
    const payables = await rows<{
      receipt_id: number;
      amount: number;
      amount_paid: number;
      due_date: string | null;
      supplier_id: string;
    }>('SELECT * FROM supplier_payables');
    expect(payables).toHaveLength(1);
    expect(payables[0]).toMatchObject({
      receipt_id: receiptId,
      supplier_id: sup,
      amount: 100,
      amount_paid: 0,
      due_date: '2026-12-01',
    });
    expect(await count('supplier_payments')).toBe(0);
  });

  it('utang with no due date stores NULL', async () => {
    const sup = await seedSupplier('c-2b');
    const { receiptId } = await draft(sup, 'C2B');
    await commitDeliveryReceipt(receiptId, { mode: 'utang', dueDate: null });
    const [row] = await rows<{ due_date: string | null }>(
      'SELECT due_date FROM supplier_payables',
    );
    expect(row?.due_date).toBeNull();
  });

  it('partial creates the payable and a payment allocated only to it, even with an older payable', async () => {
    const sup = await seedSupplier('c-3');
    const older = await addSupplierPayable({
      supplierId: sup,
      amount: 80,
      dueDate: null,
    });
    const { receiptId } = await draft(sup, 'C3');
    await commitDeliveryReceipt(receiptId, {
      mode: 'partial',
      paidNow: 40,
      dueDate: '2026-12-01',
    });

    const payment = await rows<{ id: number; amount: number }>(
      'SELECT id, amount FROM supplier_payments',
    );
    expect(payment).toHaveLength(1);
    expect(payment[0]?.amount).toBe(40);

    const allocations = await rows<{ payable_id: number; amount: number }>(
      'SELECT payable_id, amount FROM supplier_payment_allocations',
    );
    expect(allocations).toHaveLength(1);
    expect(allocations[0]?.amount).toBe(40);

    const byId = await rows<{
      id: number;
      amount_paid: number;
      receipt_id: number | null;
    }>('SELECT id, amount_paid, receipt_id FROM supplier_payables ORDER BY id');
    expect(byId[0]).toMatchObject({ id: older, amount_paid: 0 });
    expect(byId[1]).toMatchObject({ receipt_id: receiptId, amount_paid: 40 });
    expect(allocations[0]?.payable_id).toBe(byId[1]?.id);

    const [balance] = await getSupplierBalances();
    expect(balance?.balance).toBe(80 + 60);
  });

  it('partial rejects paidNow of 0, the total, above the total, and fractions, leaving the draft untouched', async () => {
    const sup = await seedSupplier('c-4');
    const { receiptId, productId } = await draft(sup, 'C4');
    for (const paidNow of [0, 100, 150, 12.5, -3]) {
      await expect(
        commitDeliveryReceipt(receiptId, {
          mode: 'partial',
          paidNow,
          dueDate: null,
        }),
      ).rejects.toBeInstanceOf(InvalidPartialPaymentError);
    }
    expect((await getDeliveryReceipt(receiptId))?.status).toBe('draft');
    expect((await stockOf(productId)).quantity).toBe(0);
    expect(await count('supplier_payables')).toBe(0);
    expect(await count('supplier_payments')).toBe(0);
  });

  it('review focus: a zero-cost receipt cannot be utang or partial, and rolls back', async () => {
    const sup = await seedSupplier('c-5');
    const { receiptId, productId } = await draft(sup, 'C5', 0);
    await expect(
      commitDeliveryReceipt(receiptId, { mode: 'utang', dueDate: null }),
    ).rejects.toBeInstanceOf(ReceiptNoCostError);
    await expect(
      commitDeliveryReceipt(receiptId, {
        mode: 'partial',
        paidNow: 1,
        dueDate: null,
      }),
    ).rejects.toBeInstanceOf(ReceiptNoCostError);
    expect((await getDeliveryReceipt(receiptId))?.status).toBe('draft');
    expect((await stockOf(productId)).quantity).toBe(0);
    expect(await count('supplier_payables')).toBe(0);

    await commitDeliveryReceipt(receiptId, { mode: 'paid' });
    expect((await stockOf(productId)).quantity).toBe(4);
  });

  it('review focus: a calendar-invalid due date rolls the whole commit back', async () => {
    const sup = await seedSupplier('c-6');
    const { receiptId, productId } = await draft(sup, 'C6');
    await expect(
      commitDeliveryReceipt(receiptId, {
        mode: 'utang',
        dueDate: '2026-02-30',
      }),
    ).rejects.toBeInstanceOf(InvalidDueDateError);
    expect((await getDeliveryReceipt(receiptId))?.status).toBe('draft');
    expect((await stockOf(productId)).quantity).toBe(0);
    expect(await count('supplier_payables')).toBe(0);
  });
});

describe('voidDeliveryReceipt and payables', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('is blocked while the payable has payments and changes nothing', async () => {
    const sup = await seedSupplier('v-1');
    const { receiptId, productId } = await draft(sup, 'V1');
    await commitDeliveryReceipt(receiptId, {
      mode: 'partial',
      paidNow: 40,
      dueDate: null,
    });
    const err = await voidDeliveryReceipt(receiptId, 'oops').catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(PayableHasPaymentsError);
    expect((err as PayableHasPaymentsError).receiptId).toBe(receiptId);
    expect((await getDeliveryReceipt(receiptId))?.status).toBe('committed');
    expect((await stockOf(productId)).quantity).toBe(4);
    const [payable] = await rows<{ voided_at: string | null }>(
      'SELECT voided_at FROM supplier_payables',
    );
    expect(payable?.voided_at).toBeNull();
    expect(
      await rows(
        "SELECT id FROM inventory_transactions WHERE type = 'adjustment'",
      ),
    ).toHaveLength(0);
  });

  it('is allowed without payments, voids the payable, and drops it from the balance', async () => {
    const sup = await seedSupplier('v-2');
    const { receiptId, productId } = await draft(sup, 'V2');
    await commitDeliveryReceipt(receiptId, { mode: 'utang', dueDate: null });
    expect(await getSupplierBalances()).toHaveLength(1);

    await voidDeliveryReceipt(receiptId, 'wrong supplier');

    expect((await getDeliveryReceipt(receiptId))?.status).toBe('voided');
    expect((await stockOf(productId)).quantity).toBe(0);
    const [payable] = await rows<{ voided_at: string | null }>(
      'SELECT voided_at FROM supplier_payables',
    );
    expect(payable?.voided_at).not.toBeNull();
    expect(await getSupplierBalances()).toEqual([]);
  });

  it('is allowed again once the payments are deleted', async () => {
    const sup = await seedSupplier('v-3');
    const { receiptId } = await draft(sup, 'V3');
    await commitDeliveryReceipt(receiptId, {
      mode: 'partial',
      paidNow: 40,
      dueDate: null,
    });
    const [payment] = await rows<{ id: number }>(
      'SELECT id FROM supplier_payments',
    );
    await deleteSupplierPayment(payment?.id ?? 0);
    await voidDeliveryReceipt(receiptId, 'fixed');
    expect((await getDeliveryReceipt(receiptId))?.status).toBe('voided');
  });

  it('a paid-now receipt voids exactly as before', async () => {
    const sup = await seedSupplier('v-4');
    const { receiptId, productId } = await draft(sup, 'V4');
    await commitDeliveryReceipt(receiptId);
    await voidDeliveryReceipt(receiptId, 'x');
    expect((await stockOf(productId)).quantity).toBe(0);
    expect(await count('supplier_payables')).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/database/delivery-commit-payables.test.ts`
Expected: FAIL (utang/partial create no payable; void is not blocked).

- [ ] **Step 3: Wire the payable into commit**

In `database/deliveries.ts`:

1. Add imports after the existing `applyInventoryTransaction` import:

```ts
import type { CommitPayment } from '../types/payables.types';
import {
  createReceiptPayable,
  PayableHasPaymentsError,
} from './supplierPayables';
```

2. Replace `commitDeliveryReceipt` and the header of `runCommit`:

```ts
export const commitDeliveryReceipt = async (
  receiptId: number,
  payment: CommitPayment = { mode: 'paid' },
): Promise<void> => {
  if (commitsInFlight.has(receiptId)) {
    throw new ReceiptNotDraftError(receiptId, 'being committed');
  }
  commitsInFlight.add(receiptId);
  try {
    await runCommit(receiptId, payment);
  } finally {
    commitsInFlight.delete(receiptId);
  }
};

const runCommit = async (
  receiptId: number,
  payment: CommitPayment,
): Promise<void> => {
```

3. In `runCommit`, right after the `if (flipped.changes !== 1) { throw ... }` block, still inside the transaction callback, add:

```ts
if (payment.mode !== 'paid') {
  const totalRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(received_qty * actual_unit_cost), 0) AS total FROM delivery_receipt_lines WHERE receipt_id = ?',
    [receiptId],
  );
  await createReceiptPayable(
    receiptId,
    receipt.supplier_id,
    totalRow?.total ?? 0,
    payment,
  );
}
```

Update the doc comment above `commitsInFlight` to mention that a non-paid `payment` also writes the payable in the same transaction.

- [ ] **Step 4: Wire the payable into void**

In `runVoid`, immediately after the `if (receipt.status !== 'committed') { throw ... }` block and before the `const totals = ...` query, add:

```ts
const payable = await db.getFirstAsync<{ id: number; amount_paid: number }>(
  'SELECT id, amount_paid FROM supplier_payables WHERE receipt_id = ? AND voided_at IS NULL',
  [receiptId],
);
if (payable && payable.amount_paid > 0) {
  throw new PayableHasPaymentsError(receiptId);
}
```

After the existing `if (flipped.changes !== 1) { throw new ReceiptAlreadyVoidedError(receiptId); }` at the end of the transaction, add:

```ts
if (payable) {
  await db.runAsync('UPDATE supplier_payables SET voided_at = ? WHERE id = ?', [
    new Date().toISOString(),
    payable.id,
  ]);
}
```

Update the `voidDeliveryReceipt` doc comment: "Refuses with PayableHasPaymentsError while the receipt's payable has payments."

- [ ] **Step 5: Run the new and existing delivery tests**

Run: `npx jest tests/database/delivery-commit-payables.test.ts tests/database/delivery-commit.test.ts tests/database/delivery-void.test.ts tests/database/delivery-drafts.test.ts tests/database/delivery-report.test.ts tests/database/price-history-restock.test.ts`
Expected: PASS everywhere.

- [ ] **Step 6: Commit**

```bash
git add database/deliveries.ts tests/database/delivery-commit-payables.test.ts
git commit -m "feat(payables): create payable on delivery commit, guard void" -- database/deliveries.ts tests/database/delivery-commit-payables.test.ts
```

---

### Task 5: Hooks and cache invalidation

**Files:**

- Create: `hooks/useSupplierPayables.ts`
- Modify: `hooks/useDeliveryReceipts.ts`
- Modify: `hooks/index.ts`
- Modify: `tests/components/useDeliveryReceiptsCache.test.tsx` (new commit input shape, new case)
- Test: `tests/components/useSupplierPayables.test.tsx`

**Interfaces:**

- Consumes: Task 3 functions and errors, Task 4 `commitDeliveryReceipt(receiptId, payment?)`.
- Produces (Tasks 7, 8, 9):
  - Keys: `payableKeys.all = ['supplier-payables']`, `payableKeys.balances()`, `payableKeys.summary()`, `payableKeys.list(supplierId)`; `paymentKeys.all = ['supplier-payments']`, `paymentKeys.list(supplierId)`. `invalidatePayables(queryClient)`.
  - Queries: `useSupplierBalances()`, `usePayablesSummary()`, `useSupplierPayables(supplierId: string | null)`, `useSupplierPayments(supplierId: string | null)`.
  - Mutations: `useAddPayable()` (input `AddPayableInput`), `useUpdatePayable()` (input `{ id: number; patch: UpdatePayableInput }`), `useDeletePayable()` (input `number`), `useRecordSupplierPayment()` (input `RecordSupplierPaymentInput`), `useDeleteSupplierPayment()` (input `number`).
  - Re-exported errors from `@/hooks/useSupplierPayables`: `InvalidDueDateError`, `InvalidPayableAmountError`, `PayableLockedError`, `PaymentExceedsBalanceError`.
  - `useCommitDeliveryReceipt()` input is now `{ receiptId: number; payment?: CommitPayment }`. `@/hooks/useDeliveryReceipts` re-exports `InvalidDueDateError`, `InvalidPartialPaymentError`, `PayableHasPaymentsError`, `ReceiptNoCostError`.

- [ ] **Step 1: Write the failing hook tests**

Create `tests/components/useSupplierPayables.test.tsx`:

```tsx
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/database/supplierPayables', () => ({
  ...jest.requireActual('@/database/supplierPayables'),
  addSupplierPayable: jest.fn(async () => 1),
  updateSupplierPayable: jest.fn(async () => undefined),
  deleteSupplierPayable: jest.fn(async () => undefined),
  recordSupplierPayment: jest.fn(async () => 1),
  deleteSupplierPayment: jest.fn(async () => undefined),
}));

import {
  paymentKeys,
  payableKeys,
  useAddPayable,
  useDeletePayable,
  useDeleteSupplierPayment,
  useRecordSupplierPayment,
  useUpdatePayable,
} from '@/hooks/useSupplierPayables';

const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

const seed = (client: QueryClient) => {
  client.setQueryData(payableKeys.balances(), []);
  client.setQueryData(payableKeys.summary(), {});
  client.setQueryData(payableKeys.list('s1'), []);
  client.setQueryData(paymentKeys.list('s1'), []);
};

const allInvalidated = (client: QueryClient): boolean =>
  [
    payableKeys.balances(),
    payableKeys.summary(),
    payableKeys.list('s1'),
    paymentKeys.list('s1'),
  ].every((key) => client.getQueryState(key)?.isInvalidated === true);

describe('supplier payable mutations invalidate payables and payments', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = newClient();
    seed(client);
  });
  afterEach(() => {
    client.clear();
  });

  it.each([
    [
      'add',
      () => useAddPayable(),
      { supplierId: 's1', amount: 5, dueDate: null },
    ],
    ['update', () => useUpdatePayable(), { id: 1, patch: { note: 'x' } }],
    ['delete payable', () => useDeletePayable(), 1],
    ['pay', () => useRecordSupplierPayment(), { supplierId: 's1', amount: 5 }],
    ['delete payment', () => useDeleteSupplierPayment(), 1],
  ] as const)('%s', async (_label, useHook, input) => {
    const { result } = await renderHook(() => useHook() as never, {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await (
        result.current as { mutateAsync: (v: unknown) => Promise<unknown> }
      ).mutateAsync(input);
    });
    expect(allInvalidated(client)).toBe(true);
  });
});
```

Append this case to the existing `describe` in `tests/components/useDeliveryReceiptsCache.test.tsx`, and change the commit call to the new shape. First update the imports block at the top of that file so the mocks include the new hook module and import `payableKeys`:

```tsx
import { payableKeys } from '@/hooks/useSupplierPayables';
```

(add it next to the other `@/hooks/...` imports, after the `jest.mock` calls). Change

```tsx
await result.current.mutateAsync(5);
```

in the **commit** test only (the first `it`) to

```tsx
await result.current.mutateAsync({ receiptId: 5 });
```

and add this test inside the same `describe`:

```tsx
it('a commit invalidates payables so balances refresh', async () => {
  client.setQueryData(payableKeys.balances(), []);
  const { result } = await renderHook(() => useCommitDeliveryReceipt(), {
    wrapper: wrapper(client),
  });
  await act(async () => {
    await result.current.mutateAsync({
      receiptId: 5,
      payment: { mode: 'utang', dueDate: null },
    });
  });
  expect(client.getQueryState(payableKeys.balances())?.isInvalidated).toBe(
    true,
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx jest tests/components/useSupplierPayables.test.tsx tests/components/useDeliveryReceiptsCache.test.tsx`
Expected: FAIL (module missing; commit shape).

- [ ] **Step 3: Create the hooks file**

Create `hooks/useSupplierPayables.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addSupplierPayable,
  deleteSupplierPayable,
  deleteSupplierPayment,
  getPayablesSummary,
  getSupplierBalances,
  getSupplierPayables,
  getSupplierPayments,
  recordSupplierPayment,
  updateSupplierPayable,
  type AddPayableInput,
  type RecordSupplierPaymentInput,
  type UpdatePayableInput,
} from '@/database/supplierPayables';

// Screens never import database/, so the named payable errors are re-exported here.
export {
  InvalidDueDateError,
  InvalidPayableAmountError,
  PayableLockedError,
  PaymentExceedsBalanceError,
} from '@/database/supplierPayables';

export const payableKeys = {
  all: ['supplier-payables'] as const,
  balances: () => [...payableKeys.all, 'balances'] as const,
  summary: () => [...payableKeys.all, 'summary'] as const,
  list: (supplierId: string) =>
    [...payableKeys.all, 'list', supplierId] as const,
};

export const paymentKeys = {
  all: ['supplier-payments'] as const,
  list: (supplierId: string) =>
    [...paymentKeys.all, 'list', supplierId] as const,
};

export function invalidatePayables(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: payableKeys.all });
  queryClient.invalidateQueries({ queryKey: paymentKeys.all });
}

export function useSupplierBalances() {
  return useQuery({
    queryKey: payableKeys.balances(),
    queryFn: () => getSupplierBalances(),
  });
}

export function usePayablesSummary() {
  return useQuery({
    queryKey: payableKeys.summary(),
    queryFn: () => getPayablesSummary(),
  });
}

export function useSupplierPayables(supplierId: string | null) {
  return useQuery({
    queryKey: payableKeys.list(supplierId ?? ''),
    queryFn: () => getSupplierPayables(supplierId as string),
    enabled: supplierId !== null,
  });
}

export function useSupplierPayments(supplierId: string | null) {
  return useQuery({
    queryKey: paymentKeys.list(supplierId ?? ''),
    queryFn: () => getSupplierPayments(supplierId as string),
    enabled: supplierId !== null,
  });
}

export function useAddPayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPayableInput) => addSupplierPayable(input),
    onSuccess: () => invalidatePayables(queryClient),
  });
}

export function useUpdatePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; patch: UpdatePayableInput }) =>
      updateSupplierPayable(v.id, v.patch),
    onSuccess: () => invalidatePayables(queryClient),
  });
}

export function useDeletePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplierPayable(id),
    onSuccess: () => invalidatePayables(queryClient),
  });
}

export function useRecordSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordSupplierPaymentInput) =>
      recordSupplierPayment(input),
    onSuccess: () => invalidatePayables(queryClient),
  });
}

export function useDeleteSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplierPayment(id),
    onSuccess: () => invalidatePayables(queryClient),
  });
}
```

- [ ] **Step 4: Update the delivery hooks**

In `hooks/useDeliveryReceipts.ts`:

1. Add imports:

```ts
import { invalidatePayables } from '@/hooks/useSupplierPayables';
import type { CommitPayment } from '@/types/payables.types';
```

2. Extend the re-export block (after the `VoidWouldGoNegativeError` block) with:

```ts
export {
  InvalidDueDateError,
  InvalidPartialPaymentError,
  PayableHasPaymentsError,
  ReceiptNoCostError,
} from '@/database/supplierPayables';
```

3. In `invalidateAfterStockChange`, add `invalidatePayables(queryClient);` as the last statement.

4. Replace `useCommitDeliveryReceipt`'s `mutationFn`:

```ts
    mutationFn: (v: { receiptId: number; payment?: CommitPayment }) =>
      commitDeliveryReceipt(v.receiptId, v.payment),
```

- [ ] **Step 5: Export from the hooks index**

In `hooks/index.ts` append `export * from './useSupplierPayables';`.

- [ ] **Step 6: Run tests and type check**

Run: `npx jest tests/components/useSupplierPayables.test.tsx tests/components/useDeliveryReceiptsCache.test.tsx`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: one error at `app/(edit-forms)/delivery-receipt/[id].tsx` (`mutateAsync(savedId)`), fixed in Task 9. Any other error must be fixed now.

- [ ] **Step 7: Commit**

```bash
git add hooks/useSupplierPayables.ts hooks/useDeliveryReceipts.ts hooks/index.ts tests/components/useSupplierPayables.test.tsx tests/components/useDeliveryReceiptsCache.test.tsx
git commit -m "feat(payables): add supplier payable hooks and invalidation" -- hooks/useSupplierPayables.ts hooks/useDeliveryReceipts.ts hooks/index.ts tests/components/useSupplierPayables.test.tsx tests/components/useDeliveryReceiptsCache.test.tsx
```

---

### Task 6: Localization

**Files:**

- Create: `locales/en/payables.json`, `locales/tl/payables.json`
- Modify: `locales/en/common.json`, `locales/tl/common.json`, `locales/en/receiving.json`, `locales/tl/receiving.json`
- Modify: `lib/i18n.ts`
- Test: `tests/payablesLocales.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces (Tasks 7, 8, 9): the `payables` namespace keys below, `common:moreHomePayables*` keys, and `receiving:errorHasPayments`, `errorNoCost`, `errorPartialInvalid`, `errorDueDateInvalid`.

- [ ] **Step 1: Write the failing locale test**

Create `tests/payablesLocales.test.ts`:

```ts
import enCommon from '../locales/en/common.json';
import en from '../locales/en/payables.json';
import enReceiving from '../locales/en/receiving.json';
import tlCommon from '../locales/tl/common.json';
import tl from '../locales/tl/payables.json';
import tlReceiving from '../locales/tl/receiving.json';

const keysOf = (obj: Record<string, unknown>): string[] =>
  Object.keys(obj).sort();

const isFilled = (v: unknown): boolean =>
  typeof v === 'string' && v.trim().length > 0;

describe('payables locales', () => {
  it('en and tl have identical keys', () => {
    expect(keysOf(tl)).toEqual(keysOf(en));
  });

  it('has no empty strings', () => {
    for (const bundle of [en, tl]) {
      for (const [key, value] of Object.entries(bundle)) {
        expect(`${key}:${isFilled(value)}`).toBe(`${key}:true`);
      }
    }
  });

  it('keeps the same interpolation placeholders in en and tl', () => {
    const placeholders = (s: string) =>
      (s.match(/\{\{\w+\}\}/g) ?? []).sort().join(',');
    for (const key of keysOf(en)) {
      expect(
        `${key}:${placeholders((tl as Record<string, string>)[key] ?? '')}`,
      ).toBe(
        `${key}:${placeholders((en as Record<string, string>)[key] ?? '')}`,
      );
    }
  });

  it('has the More-tab row strings in both common bundles', () => {
    for (const bundle of [enCommon, tlCommon]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'moreHomePayablesLabel',
        'moreHomePayablesSub',
        'moreHomePayablesSubOwed',
        'moreHomePayablesHint',
      ]) {
        expect(`${key}:${isFilled(record[key])}`).toBe(`${key}:true`);
      }
    }
  });

  it('has the delivery error strings in both receiving bundles', () => {
    for (const bundle of [enReceiving, tlReceiving]) {
      const record = bundle as Record<string, unknown>;
      for (const key of [
        'errorHasPayments',
        'errorNoCost',
        'errorPartialInvalid',
        'errorDueDateInvalid',
      ]) {
        expect(`${key}:${isFilled(record[key])}`).toBe(`${key}:true`);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/payablesLocales.test.ts`
Expected: FAIL, cannot find `locales/en/payables.json`.

- [ ] **Step 3: Create `locales/en/payables.json`**

```json
{
  "title": "Supplier payables",
  "subtitle": "What you owe your suppliers",
  "back": "Back",
  "totalOwed": "Total owed",
  "totalOverdue": "Overdue",
  "overdueChip": "Overdue",
  "overdueCount": "{{count}} overdue",
  "emptyTitle": "You owe no supplier",
  "emptyBody": "Utang from deliveries and the utang you add yourself shows up here.",
  "loadError": "Could not load payables. Pull down to try again.",
  "balanceLabel": "You owe",
  "billsSection": "Bills",
  "paymentsSection": "Payments",
  "noBills": "No bills yet.",
  "noPayments": "No payments yet.",
  "manualBill": "Added utang",
  "receiptBill": "Delivery #{{id}}",
  "paidOf": "Paid {{paid}} of {{total}}",
  "dueOn": "Due {{date}}",
  "noDueDate": "No due date",
  "paidChip": "Paid",
  "deletePayable": "Delete",
  "pay": "Pay",
  "addUtang": "Add utang",
  "payTitle": "Pay {{name}}",
  "payBalance": "You owe {{balance}}",
  "payFifoHint": "Pays the oldest bills first.",
  "payAmountLabel": "Amount paid",
  "payNoteLabel": "Note (optional)",
  "payConfirm": "Record payment",
  "payInvalid": "Enter a whole peso amount above zero.",
  "payExceeds": "That is more than you owe ({{balance}}).",
  "addTitle": "Add utang",
  "addAmountLabel": "Amount owed",
  "addDueLabel": "Due date (YYYY-MM-DD, optional)",
  "addNoteLabel": "Note (optional)",
  "addConfirm": "Save utang",
  "dueInvalid": "Use the date format YYYY-MM-DD.",
  "paymentLine": "{{amount}} on {{date}}",
  "deletePayment": "Delete payment",
  "deletePaymentConfirm": "Delete this payment? The bills it paid go back to unpaid.",
  "deletePayableConfirm": "Delete this utang entry?",
  "cancel": "Cancel",
  "delete": "Delete",
  "pickerTitle": "How was this paid?",
  "modePaid": "Paid now",
  "modeUtang": "Utang",
  "modePartial": "Partial",
  "totalLine": "Delivery total: {{total}}",
  "dueDateLabel": "Due date (YYYY-MM-DD, optional)",
  "paidNowLabel": "Amount paid now",
  "partialInvalid": "Enter whole pesos above zero and below {{total}}.",
  "noCostHint": "This delivery has no cost, so it can only be marked paid.",
  "termsLabel": "Payment terms (days)",
  "termsHint": "Pre-fills the due date on utang deliveries. Leave empty for none.",
  "termsInvalid": "Use a whole number of days, 0 or more.",
  "paymentRecordedToast": "Payment recorded",
  "paymentDeletedToast": "Payment deleted",
  "utangAddedToast": "Utang added",
  "payableDeletedToast": "Utang deleted",
  "errorLocked": "This utang entry can no longer be changed.",
  "errorGeneric": "Something went wrong. Try again."
}
```

- [ ] **Step 4: Create `locales/tl/payables.json`**

```json
{
  "title": "Utang sa supplier",
  "subtitle": "Ang utang mo sa mga supplier",
  "back": "Bumalik",
  "totalOwed": "Kabuuang utang",
  "totalOverdue": "Lampas na sa takda",
  "overdueChip": "Lampas na",
  "overdueCount": "{{count}} lampas na",
  "emptyTitle": "Walang utang sa supplier",
  "emptyBody": "Dito lalabas ang utang mula sa deliveries at ang utang na idinagdag mo.",
  "loadError": "Hindi ma-load ang utang. Hilahin pababa para subukan ulit.",
  "balanceLabel": "Utang mo",
  "billsSection": "Mga bayarin",
  "paymentsSection": "Mga bayad",
  "noBills": "Wala pang bayarin.",
  "noPayments": "Wala pang bayad.",
  "manualBill": "Idinagdag na utang",
  "receiptBill": "Delivery #{{id}}",
  "paidOf": "Bayad {{paid}} sa {{total}}",
  "dueOn": "Takda sa {{date}}",
  "noDueDate": "Walang takdang petsa",
  "paidChip": "Bayad na",
  "deletePayable": "Burahin",
  "pay": "Magbayad",
  "addUtang": "Magdagdag ng utang",
  "payTitle": "Bayaran ang {{name}}",
  "payBalance": "Utang mo: {{balance}}",
  "payFifoHint": "Unang babayaran ang pinakamatandang utang.",
  "payAmountLabel": "Halagang binayad",
  "payNoteLabel": "Tala (opsyonal)",
  "payConfirm": "I-save ang bayad",
  "payInvalid": "Maglagay ng buong pisong higit sa zero.",
  "payExceeds": "Mas malaki ito sa utang mo ({{balance}}).",
  "addTitle": "Magdagdag ng utang",
  "addAmountLabel": "Halagang utang",
  "addDueLabel": "Takdang petsa (YYYY-MM-DD, opsyonal)",
  "addNoteLabel": "Tala (opsyonal)",
  "addConfirm": "I-save ang utang",
  "dueInvalid": "Gamitin ang petsang YYYY-MM-DD.",
  "paymentLine": "{{amount}} noong {{date}}",
  "deletePayment": "Burahin ang bayad",
  "deletePaymentConfirm": "Burahin ang bayad na ito? Babalik sa hindi pa bayad ang mga utang na binayaran nito.",
  "deletePayableConfirm": "Burahin ang utang na ito?",
  "cancel": "Kanselahin",
  "delete": "Burahin",
  "pickerTitle": "Paano binayaran?",
  "modePaid": "Bayad na",
  "modeUtang": "Utang",
  "modePartial": "Hati",
  "totalLine": "Kabuuan ng delivery: {{total}}",
  "dueDateLabel": "Takdang petsa (YYYY-MM-DD, opsyonal)",
  "paidNowLabel": "Halagang binayad ngayon",
  "partialInvalid": "Maglagay ng buong piso na higit sa zero at mas mababa sa {{total}}.",
  "noCostHint": "Walang halaga ang delivery na ito, kaya \"Bayad na\" lang ang puwede.",
  "termsLabel": "Termino ng bayad (araw)",
  "termsHint": "Awtomatikong pupunan ang takdang petsa sa utang na delivery. Iwanang blangko kung wala.",
  "termsInvalid": "Gumamit ng buong bilang ng araw, 0 o higit pa.",
  "paymentRecordedToast": "Naitala ang bayad",
  "paymentDeletedToast": "Nabura ang bayad",
  "utangAddedToast": "Naidagdag ang utang",
  "payableDeletedToast": "Nabura ang utang",
  "errorLocked": "Hindi na mababago ang utang na ito.",
  "errorGeneric": "May nangyaring mali. Subukan ulit."
}
```

- [ ] **Step 5: Add the More-row strings to `common`**

In `locales/en/common.json`, replace the line

```json
  "moreHomeRepriceHint": "Opens the list of items whose cost went up",
```

with

```json
  "moreHomeRepriceHint": "Opens the list of items whose cost went up",
  "moreHomePayablesLabel": "Supplier payables",
  "moreHomePayablesSub": "You owe no supplier",
  "moreHomePayablesSubOwed": "You owe {{amount}} to suppliers",
  "moreHomePayablesHint": "Opens what you owe each supplier",
```

In `locales/tl/common.json`, replace

```json
  "moreHomeRepriceHint": "Binubuksan ang listahan ng panindang tumaas ang puhunan",
```

with

```json
  "moreHomeRepriceHint": "Binubuksan ang listahan ng panindang tumaas ang puhunan",
  "moreHomePayablesLabel": "Utang sa supplier",
  "moreHomePayablesSub": "Walang utang sa supplier",
  "moreHomePayablesSubOwed": "May utang kang {{amount}} sa mga supplier",
  "moreHomePayablesHint": "Binubuksan ang utang mo sa bawat supplier",
```

- [ ] **Step 6: Add the delivery error strings to `receiving`**

Open `locales/en/receiving.json` and `locales/tl/receiving.json`. Add these four keys after the last existing key (add a comma after that last key first).

English:

```json
  "errorHasPayments": "Delivery #{{id}} still has payments. Delete them first, then void.",
  "errorNoCost": "This delivery has no cost, so it cannot be utang.",
  "errorPartialInvalid": "Enter whole pesos above zero and below the delivery total.",
  "errorDueDateInvalid": "Use the date format YYYY-MM-DD."
```

Tagalog:

```json
  "errorHasPayments": "May bayad pa ang delivery #{{id}}. Burahin muna ang mga bayad, saka i-void.",
  "errorNoCost": "Walang halaga ang delivery na ito kaya hindi ito puwedeng utang.",
  "errorPartialInvalid": "Maglagay ng buong piso na higit sa zero at mas mababa sa kabuuan ng delivery.",
  "errorDueDateInvalid": "Gamitin ang petsang YYYY-MM-DD."
```

- [ ] **Step 7: Register the namespace**

In `lib/i18n.ts` make these exact replacements.

Replace `import pricingEn from '../locales/en/pricing.json';` with

```ts
import pricingEn from '../locales/en/pricing.json';
import payablesEn from '../locales/en/payables.json';
```

Replace `import pricingTl from '../locales/tl/pricing.json';` with

```ts
import pricingTl from '../locales/tl/pricing.json';
import payablesTl from '../locales/tl/payables.json';
```

Replace `    pricing: pricingEn,` with

```ts
    pricing: pricingEn,
    payables: payablesEn,
```

Replace `    pricing: pricingTl,` with

```ts
    pricing: pricingTl,
    payables: payablesTl,
```

Replace `    'pricing',\n  ],` (the last entry of the `ns` array) with

```ts
    'pricing',
    'payables',
  ],
```

- [ ] **Step 8: Run the locale tests**

Run: `npx jest tests/payablesLocales.test.ts tests/receivingLocales.test.ts tests/pricingLocales.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add locales/en/payables.json locales/tl/payables.json locales/en/common.json locales/tl/common.json locales/en/receiving.json locales/tl/receiving.json lib/i18n.ts tests/payablesLocales.test.ts
git commit -m "feat(payables): add payables, More row, and delivery error strings" -- locales/en/payables.json locales/tl/payables.json locales/en/common.json locales/tl/common.json locales/en/receiving.json locales/tl/receiving.json lib/i18n.ts tests/payablesLocales.test.ts
```

---

### Task 7: Payables components

**Files:**

- Create: `components/payables/PaymentPicker.tsx`, `PayPayableSheet.tsx`, `AddPayableSheet.tsx`, `PayableRow.tsx`, `PaymentTermsField.tsx`, `payableErrors.ts`, `index.ts`
- Test: `tests/components/PaymentPicker.test.tsx`, `PayPayableSheet.test.tsx`, `AddPayableSheet.test.tsx`, `PayableRow.test.tsx`, `PaymentTermsField.test.tsx`, `payableErrors.test.ts`

**Interfaces:**

- Consumes: Task 1 (`PaymentPickerValue`, `buildCommitPayment`, `parseWholePesos`, `parseTermsDays`, `isValidDateString`, `SupplierPayable`), Task 5 error re-exports, Task 6 strings (namespace `payables`).
- Produces (Tasks 8, 9, 10):
  - `PaymentPicker` props `{ value: PaymentPickerValue; onChange: (next: PaymentPickerValue) => void; total: number; disabled?: boolean }`.
  - `PayPayableSheet` props `{ visible: boolean; supplierName: string; balance: number; busy?: boolean; onClose: () => void; onSubmit: (input: { amount: number; note: string | null }) => void }`.
  - `AddPayableSheet` props `{ visible: boolean; defaultDueDate: string | null; busy?: boolean; onClose: () => void; onSubmit: (input: { amount: number; dueDate: string | null; note: string | null }) => void }`.
  - `PayableRow` props `{ payable: SupplierPayable; onOpenReceipt?: (receiptId: number) => void; onDelete?: (payableId: number) => void }`.
  - `PaymentTermsField` props `{ value: string; onChangeText: (text: string) => void; onBlur?: () => void }`.
  - `payableErrorMessage(err: unknown, t: TFunction): string`.

All component tests start with this i18n mock (copy it verbatim), and sheet tests add the `Sheet` mock from `tests/components/RepriceReviewSheet.test.tsx`:

```tsx
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
```

```tsx
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
```

- [ ] **Step 1: Write the failing `PaymentPicker` test**

Create `tests/components/PaymentPicker.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { PaymentPicker } from '@/components/payables/PaymentPicker';
import { EMPTY_PAYMENT_PICKER, type PaymentPickerValue } from '@/lib/payables';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const value = (over: Partial<PaymentPickerValue>): PaymentPickerValue => ({
  ...EMPTY_PAYMENT_PICKER,
  ...over,
});

describe('PaymentPicker', () => {
  it('offers the three payment choices', async () => {
    const { getByText } = await render(
      <PaymentPicker value={value({})} onChange={jest.fn()} total={100} />,
    );
    expect(getByText('modePaid')).toBeTruthy();
    expect(getByText('modeUtang')).toBeTruthy();
    expect(getByText('modePartial')).toBeTruthy();
  });

  it('reports the chosen mode and keeps the typed fields', async () => {
    const onChange = jest.fn();
    const current = value({ dueDate: '2026-12-01', paidNow: '40' });
    const { getByText } = await render(
      <PaymentPicker value={current} onChange={onChange} total={100} />,
    );
    await fireEvent.press(getByText('modeUtang'));
    expect(onChange).toHaveBeenCalledWith({ ...current, mode: 'utang' });
  });

  it('shows no extra fields for paid, a due date for utang, both for partial', async () => {
    const paid = await render(
      <PaymentPicker
        value={value({ mode: 'paid' })}
        onChange={jest.fn()}
        total={100}
      />,
    );
    expect(paid.queryByLabelText('dueDateLabel')).toBeNull();
    expect(paid.queryByLabelText('paidNowLabel')).toBeNull();

    const utang = await render(
      <PaymentPicker
        value={value({ mode: 'utang' })}
        onChange={jest.fn()}
        total={100}
      />,
    );
    expect(utang.getByLabelText('dueDateLabel')).toBeTruthy();
    expect(utang.queryByLabelText('paidNowLabel')).toBeNull();

    const partial = await render(
      <PaymentPicker
        value={value({ mode: 'partial' })}
        onChange={jest.fn()}
        total={100}
      />,
    );
    expect(partial.getByLabelText('dueDateLabel')).toBeTruthy();
    expect(partial.getByLabelText('paidNowLabel')).toBeTruthy();
  });

  it('writes typed due date and amount back through onChange', async () => {
    const onChange = jest.fn();
    const current = value({ mode: 'partial' });
    const { getByLabelText } = await render(
      <PaymentPicker value={current} onChange={onChange} total={100} />,
    );
    await fireEvent.changeText(getByLabelText('dueDateLabel'), '2026-12-01');
    expect(onChange).toHaveBeenLastCalledWith({
      ...current,
      dueDate: '2026-12-01',
    });
    await fireEvent.changeText(getByLabelText('paidNowLabel'), '40');
    expect(onChange).toHaveBeenLastCalledWith({ ...current, paidNow: '40' });
  });

  it('flags a calendar-invalid due date', async () => {
    const { getByText } = await render(
      <PaymentPicker
        value={value({ mode: 'utang', dueDate: '2026-02-30' })}
        onChange={jest.fn()}
        total={100}
      />,
    );
    expect(getByText('dueInvalid')).toBeTruthy();
  });

  it('review focus: flags a fractional or too-large paid-now amount', async () => {
    for (const bad of ['12.50', '100', '150']) {
      const { getByText, unmount } = await render(
        <PaymentPicker
          value={value({ mode: 'partial', paidNow: bad })}
          onChange={jest.fn()}
          total={100}
        />,
      );
      expect(getByText(/^partialInvalid/)).toBeTruthy();
      await unmount();
    }
  });

  it('shows no error for a valid amount', async () => {
    const { queryByText } = await render(
      <PaymentPicker
        value={value({ mode: 'partial', paidNow: '40' })}
        onChange={jest.fn()}
        total={100}
      />,
    );
    expect(queryByText(/^partialInvalid/)).toBeNull();
  });

  it('review focus: on a zero-cost receipt utang and partial cannot be chosen', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <PaymentPicker value={value({})} onChange={onChange} total={0} />,
    );
    expect(getByText('noCostHint')).toBeTruthy();
    await fireEvent.press(getByText('modeUtang'));
    await fireEvent.press(getByText('modePartial'));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(getByText('modePaid'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while disabled', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <PaymentPicker
        value={value({})}
        onChange={onChange}
        total={100}
        disabled
      />,
    );
    await fireEvent.press(getByText('modeUtang'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest tests/components/PaymentPicker.test.tsx`
Expected: FAIL, cannot find `@/components/payables/PaymentPicker`.

- [ ] **Step 3: Implement `PaymentPicker`**

Create `components/payables/PaymentPicker.tsx`:

```tsx
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import { buildCommitPayment, type PaymentPickerValue } from '@/lib/payables';

export interface PaymentPickerProps {
  value: PaymentPickerValue;
  onChange: (next: PaymentPickerValue) => void;
  /** Receipt total in pesos. Utang and Partial need a total above zero. */
  total: number;
  disabled?: boolean;
}

const MODES = [
  { mode: 'paid', labelKey: 'modePaid' },
  { mode: 'utang', labelKey: 'modeUtang' },
  { mode: 'partial', labelKey: 'modePartial' },
] as const;

export function PaymentPicker({
  value,
  onChange,
  total,
  disabled = false,
}: PaymentPickerProps) {
  const { t } = useTranslation('payables');
  const noCost = total <= 0;
  const result = buildCommitPayment(value, total);

  const showDueError =
    value.mode !== 'paid' &&
    value.dueDate.trim() !== '' &&
    !result.ok &&
    result.field === 'dueDate';
  const showPaidNowError =
    value.mode === 'partial' &&
    value.paidNow.trim() !== '' &&
    !result.ok &&
    result.field === 'paidNow';

  return (
    <View className="mb-4 rounded-2xl border border-ink-100 bg-paper-50 p-4 shadow-paper">
      <StyledText variant="black" className="label-caps mb-3 text-cinnamon-500">
        {t('pickerTitle')}
      </StyledText>
      <StyledText variant="regular" className="mb-3 text-sm text-ink-600">
        {t('totalLine', { total: formatPesos(total) })}
      </StyledText>

      <View className="flex-row gap-x-2">
        {MODES.map(({ mode, labelKey }) => {
          const selected = value.mode === mode;
          const blocked = disabled || (noCost && mode !== 'paid');
          return (
            <Pressable
              key={mode}
              onPress={() => {
                if (blocked) return;
                onChange({ ...value, mode });
              }}
              disabled={blocked}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: blocked }}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border ${
                selected
                  ? 'border-persimmon-500 bg-persimmon-500'
                  : 'border-paper-300 bg-paper-100'
              } ${blocked ? 'opacity-50' : ''}`}
            >
              <StyledText
                variant="semibold"
                className={`text-sm ${selected ? 'text-paper-50' : 'text-ink-800'}`}
              >
                {t(labelKey)}
              </StyledText>
            </Pressable>
          );
        })}
      </View>

      {noCost ? (
        <StyledText variant="regular" className="mt-2 text-xs text-ink-500">
          {t('noCostHint')}
        </StyledText>
      ) : null}

      {value.mode !== 'paid' ? (
        <View className="mt-3">
          <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
            {t('dueDateLabel')}
          </StyledText>
          <TextInput
            value={value.dueDate}
            onChangeText={(dueDate) => onChange({ ...value, dueDate })}
            editable={!disabled}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A89F90"
            autoCapitalize="none"
            accessibilityLabel={t('dueDateLabel')}
            className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
          />
          {showDueError ? (
            <StyledText
              variant="medium"
              className="mt-1 text-xs text-persimmon-600"
            >
              {t('dueInvalid')}
            </StyledText>
          ) : null}
        </View>
      ) : null}

      {value.mode === 'partial' ? (
        <View className="mt-3">
          <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
            {t('paidNowLabel')}
          </StyledText>
          <TextInput
            value={value.paidNow}
            onChangeText={(paidNow) => onChange({ ...value, paidNow })}
            editable={!disabled}
            keyboardType="number-pad"
            accessibilityLabel={t('paidNowLabel')}
            className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
          />
          {showPaidNowError ? (
            <StyledText
              variant="medium"
              className="mt-1 text-xs text-persimmon-600"
            >
              {t('partialInvalid', { total: formatPesos(total) })}
            </StyledText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Run it**

Run: `npx jest tests/components/PaymentPicker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing `PayPayableSheet` test**

Create `tests/components/PayPayableSheet.test.tsx` (include the two mocks shown above the task, then):

```tsx
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PayPayableSheet } from '@/components/payables/PayPayableSheet';

// ... i18n mock and Sheet mock from the task header go here ...

const props = {
  visible: true,
  supplierName: 'Mang Tonyo',
  balance: 150,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
};

describe('PayPayableSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stays closed when not visible', async () => {
    const { queryByTestId } = await render(
      <PayPayableSheet {...props} visible={false} />,
    );
    expect(queryByTestId('sheet')).toBeNull();
  });

  it('submits a valid whole-peso amount with a trimmed note', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '120');
    await fireEvent.changeText(getByLabelText('payNoteLabel'), '  cash  ');
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).toHaveBeenCalledWith({ amount: 120, note: 'cash' });
  });

  it('passes a null note when the note is blank', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '50');
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).toHaveBeenCalledWith({ amount: 50, note: null });
  });

  it('accepts exactly the balance', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '150');
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).toHaveBeenCalledWith({ amount: 150, note: null });
  });

  it('blocks an amount above the balance with an inline error', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '151');
    expect(getByText(/^payExceeds/)).toBeTruthy();
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('review focus: blocks a fractional amount instead of rounding it', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '12.50');
    expect(getByText('payInvalid')).toBeTruthy();
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('blocks empty, zero, and negative amounts', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} />,
    );
    for (const bad of ['', '0', '-5']) {
      await fireEvent.changeText(getByLabelText('payAmountLabel'), bad);
      await fireEvent.press(getByText('payConfirm'));
    }
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit while busy', async () => {
    const { getByLabelText, getByText } = await render(
      <PayPayableSheet {...props} busy />,
    );
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '50');
    await fireEvent.press(getByText('payConfirm'));
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('cancel closes without submitting', async () => {
    const { getByText } = await render(<PayPayableSheet {...props} />);
    await fireEvent.press(getByText('cancel'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Implement `PayPayableSheet`**

Create `components/payables/PayPayableSheet.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import { formatPesos } from '@/lib/money';
import { parseWholePesos } from '@/lib/payables';

export interface PayPayableSheetProps {
  visible: boolean;
  supplierName: string;
  /** What the supplier is owed right now. A payment cannot exceed it. */
  balance: number;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { amount: number; note: string | null }) => void;
}

export function PayPayableSheet({
  visible,
  supplierName,
  balance,
  busy = false,
  onClose,
  onSubmit,
}: PayPayableSheetProps) {
  const { t } = useTranslation('payables');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) {
      setAmountText('');
      setNote('');
    }
  }, [visible]);

  const amount = parseWholePesos(amountText);
  const exceeds = amount !== null && amount > balance;
  const typedButInvalid = amountText.trim() !== '' && amount === null;
  const canSubmit = amount !== null && !exceeds && !busy;

  const handleSubmit = () => {
    if (!canSubmit || amount === null) return;
    onSubmit({ amount, note: note.trim() || null });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View>
        <StyledText variant="extrabold" className="text-xl text-ink-900">
          {t('payTitle', { name: supplierName })}
        </StyledText>
        <StyledText variant="regular" className="mt-1 text-sm text-ink-600">
          {t('payBalance', { balance: formatPesos(balance) })}
        </StyledText>
        <StyledText variant="regular" className="mt-1 text-xs text-ink-500">
          {t('payFifoHint')}
        </StyledText>
      </View>

      <View>
        <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
          {t('payAmountLabel')}
        </StyledText>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="number-pad"
          editable={!busy}
          accessibilityLabel={t('payAmountLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
        {typedButInvalid ? (
          <StyledText
            variant="medium"
            className="mt-1 text-xs text-persimmon-600"
          >
            {t('payInvalid')}
          </StyledText>
        ) : null}
        {exceeds ? (
          <StyledText
            variant="medium"
            className="mt-1 text-xs text-persimmon-600"
          >
            {t('payExceeds', { balance: formatPesos(balance) })}
          </StyledText>
        ) : null}
      </View>

      <View>
        <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
          {t('payNoteLabel')}
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          editable={!busy}
          accessibilityLabel={t('payNoteLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
        >
          <StyledText variant="semibold" className="text-sm text-ink-800">
            {t('cancel')}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy }}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-persimmon-500 active:opacity-80 ${
            canSubmit ? '' : 'opacity-50'
          }`}
        >
          <StyledText variant="extrabold" className="text-sm text-paper-50">
            {t('payConfirm')}
          </StyledText>
        </Pressable>
      </View>
    </Sheet>
  );
}
```

- [ ] **Step 7: Run it**

Run: `npx jest tests/components/PayPayableSheet.test.tsx`
Expected: PASS.

- [ ] **Step 8: Write the failing `AddPayableSheet` test**

Create `tests/components/AddPayableSheet.test.tsx` (same two mocks, then):

```tsx
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AddPayableSheet } from '@/components/payables/AddPayableSheet';

// ... i18n mock and Sheet mock from the task header go here ...

const props = {
  visible: true,
  defaultDueDate: '2026-12-14' as string | null,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
};

describe('AddPayableSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pre-fills the due date from the supplier terms', async () => {
    const { getByLabelText } = await render(<AddPayableSheet {...props} />);
    expect(getByLabelText('addDueLabel').props['value']).toBe('2026-12-14');
  });

  it('leaves the due date empty when the supplier has no terms', async () => {
    const { getByLabelText } = await render(
      <AddPayableSheet {...props} defaultDueDate={null} />,
    );
    expect(getByLabelText('addDueLabel').props['value']).toBe('');
  });

  it('submits amount, due date, and note', async () => {
    const { getByLabelText, getByText } = await render(
      <AddPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('addAmountLabel'), '250');
    await fireEvent.changeText(getByLabelText('addNoteLabel'), 'Soda');
    await fireEvent.press(getByText('addConfirm'));
    expect(props.onSubmit).toHaveBeenCalledWith({
      amount: 250,
      dueDate: '2026-12-14',
      note: 'Soda',
    });
  });

  it('lets the owner clear the due date', async () => {
    const { getByLabelText, getByText } = await render(
      <AddPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('addAmountLabel'), '10');
    await fireEvent.changeText(getByLabelText('addDueLabel'), '');
    await fireEvent.press(getByText('addConfirm'));
    expect(props.onSubmit).toHaveBeenCalledWith({
      amount: 10,
      dueDate: null,
      note: null,
    });
  });

  it('review focus: blocks a fractional amount and a calendar-invalid date', async () => {
    const { getByLabelText, getByText } = await render(
      <AddPayableSheet {...props} />,
    );
    await fireEvent.changeText(getByLabelText('addAmountLabel'), '12.50');
    await fireEvent.press(getByText('addConfirm'));
    await fireEvent.changeText(getByLabelText('addAmountLabel'), '12');
    await fireEvent.changeText(getByLabelText('addDueLabel'), '2026-02-30');
    expect(getByText('dueInvalid')).toBeTruthy();
    await fireEvent.press(getByText('addConfirm'));
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 9: Implement `AddPayableSheet`**

Create `components/payables/AddPayableSheet.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import { isValidDateString, parseWholePesos } from '@/lib/payables';

export interface AddPayableSheetProps {
  visible: boolean;
  /** Pre-filled from the supplier's payment terms. Null leaves the field empty. */
  defaultDueDate: string | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    amount: number;
    dueDate: string | null;
    note: string | null;
  }) => void;
}

export function AddPayableSheet({
  visible,
  defaultDueDate,
  busy = false,
  onClose,
  onSubmit,
}: AddPayableSheetProps) {
  const { t } = useTranslation('payables');
  const [amountText, setAmountText] = useState('');
  const [dueText, setDueText] = useState(defaultDueDate ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setDueText(defaultDueDate ?? '');
    } else {
      setAmountText('');
      setNote('');
    }
  }, [visible, defaultDueDate]);

  const amount = parseWholePesos(amountText);
  const dueTrimmed = dueText.trim();
  const dueInvalid = dueTrimmed !== '' && !isValidDateString(dueTrimmed);
  const typedButInvalid = amountText.trim() !== '' && amount === null;
  const canSubmit = amount !== null && !dueInvalid && !busy;

  const handleSubmit = () => {
    if (!canSubmit || amount === null) return;
    onSubmit({
      amount,
      dueDate: dueTrimmed === '' ? null : dueTrimmed,
      note: note.trim() || null,
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <StyledText variant="extrabold" className="text-xl text-ink-900">
        {t('addTitle')}
      </StyledText>

      <View>
        <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
          {t('addAmountLabel')}
        </StyledText>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="number-pad"
          editable={!busy}
          accessibilityLabel={t('addAmountLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
        {typedButInvalid ? (
          <StyledText
            variant="medium"
            className="mt-1 text-xs text-persimmon-600"
          >
            {t('payInvalid')}
          </StyledText>
        ) : null}
      </View>

      <View>
        <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
          {t('addDueLabel')}
        </StyledText>
        <TextInput
          value={dueText}
          onChangeText={setDueText}
          editable={!busy}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#A89F90"
          autoCapitalize="none"
          accessibilityLabel={t('addDueLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
        {dueInvalid ? (
          <StyledText
            variant="medium"
            className="mt-1 text-xs text-persimmon-600"
          >
            {t('dueInvalid')}
          </StyledText>
        ) : null}
      </View>

      <View>
        <StyledText variant="medium" className="mb-1 text-sm text-ink-700">
          {t('addNoteLabel')}
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          editable={!busy}
          accessibilityLabel={t('addNoteLabel')}
          className="min-h-[48px] rounded-xl border border-ink-200 bg-paper-100 px-3 text-base text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
        >
          <StyledText variant="semibold" className="text-sm text-ink-800">
            {t('cancel')}
          </StyledText>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy }}
          className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-persimmon-500 active:opacity-80 ${
            canSubmit ? '' : 'opacity-50'
          }`}
        >
          <StyledText variant="extrabold" className="text-sm text-paper-50">
            {t('addConfirm')}
          </StyledText>
        </Pressable>
      </View>
    </Sheet>
  );
}
```

- [ ] **Step 10: Run it**

Run: `npx jest tests/components/AddPayableSheet.test.tsx`
Expected: PASS.

- [ ] **Step 11: Write the failing `PayableRow` test**

Create `tests/components/PayableRow.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { PayableRow } from '@/components/payables/PayableRow';
import type { SupplierPayable } from '@/types/payables.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const payable = (over: Partial<SupplierPayable> = {}): SupplierPayable => ({
  id: 1,
  supplierId: 's1',
  receiptId: null,
  amount: 100,
  amountPaid: 0,
  outstanding: 100,
  dueDate: '2026-12-01',
  note: null,
  voidedAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  isOverdue: false,
  ...over,
});

describe('PayableRow', () => {
  it('labels a manual payable and shows its due date', async () => {
    const { getByText } = await render(<PayableRow payable={payable()} />);
    expect(getByText('manualBill')).toBeTruthy();
    expect(getByText('dueOn:{"date":"2026-12-01"}')).toBeTruthy();
  });

  it('shows no due date text when there is none', async () => {
    const { getByText } = await render(
      <PayableRow payable={payable({ dueDate: null })} />,
    );
    expect(getByText('noDueDate')).toBeTruthy();
  });

  it('links a receipt payable to its delivery', async () => {
    const onOpenReceipt = jest.fn();
    const { getByText } = await render(
      <PayableRow
        payable={payable({ receiptId: 7 })}
        onOpenReceipt={onOpenReceipt}
      />,
    );
    await fireEvent.press(getByText('receiptBill:{"id":7}'));
    expect(onOpenReceipt).toHaveBeenCalledWith(7);
  });

  it('shows the overdue chip only when overdue', async () => {
    const overdue = await render(
      <PayableRow payable={payable({ isOverdue: true })} />,
    );
    expect(overdue.getByText('overdueChip')).toBeTruthy();
    const fine = await render(<PayableRow payable={payable()} />);
    expect(fine.queryByText('overdueChip')).toBeNull();
  });

  it('shows the paid chip when nothing is outstanding', async () => {
    const { getByText, queryByText } = await render(
      <PayableRow payable={payable({ amountPaid: 100, outstanding: 0 })} />,
    );
    expect(getByText('paidChip')).toBeTruthy();
    expect(queryByText('overdueChip')).toBeNull();
  });

  it('offers delete only when an onDelete handler is given', async () => {
    const onDelete = jest.fn();
    const withDelete = await render(
      <PayableRow payable={payable({ id: 4 })} onDelete={onDelete} />,
    );
    await fireEvent.press(withDelete.getByText('deletePayable'));
    expect(onDelete).toHaveBeenCalledWith(4);
    const without = await render(<PayableRow payable={payable()} />);
    expect(without.queryByText('deletePayable')).toBeNull();
  });
});
```

- [ ] **Step 12: Implement `PayableRow`**

Create `components/payables/PayableRow.tsx`:

```tsx
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { SupplierPayable } from '@/types/payables.types';

export interface PayableRowProps {
  payable: SupplierPayable;
  onOpenReceipt?: (receiptId: number) => void;
  /** Pass only for a payable that can be deleted (manual and untouched). */
  onDelete?: (payableId: number) => void;
}

export function PayableRow({
  payable,
  onOpenReceipt,
  onDelete,
}: PayableRowProps) {
  const { t } = useTranslation('payables');
  const receiptId = payable.receiptId;
  const isPaid = payable.outstanding === 0;

  return (
    <View className="gap-y-1 rounded-2xl border border-paper-300 bg-paper-50 p-4">
      <View className="flex-row items-center justify-between">
        {receiptId !== null && onOpenReceipt ? (
          <Pressable
            onPress={() => onOpenReceipt(receiptId)}
            accessibilityRole="link"
            className="active:opacity-70"
          >
            <StyledText
              variant="semibold"
              className="text-base text-cinnamon-600"
            >
              {t('receiptBill', { id: receiptId })}
            </StyledText>
          </Pressable>
        ) : (
          <StyledText variant="semibold" className="text-base text-ink-900">
            {receiptId !== null
              ? t('receiptBill', { id: receiptId })
              : t('manualBill')}
          </StyledText>
        )}

        {payable.isOverdue ? (
          <View className="rounded-full bg-persimmon-500 px-2 py-0.5">
            <StyledText variant="extrabold" className="text-xs text-paper-50">
              {t('overdueChip')}
            </StyledText>
          </View>
        ) : isPaid ? (
          <View className="rounded-full bg-sage-50 px-2 py-0.5">
            <StyledText variant="extrabold" className="text-xs text-sage-700">
              {t('paidChip')}
            </StyledText>
          </View>
        ) : null}
      </View>

      <StyledText variant="regular" className="text-sm text-ink-700">
        {t('paidOf', {
          paid: formatPesos(payable.amountPaid),
          total: formatPesos(payable.amount),
        })}
      </StyledText>
      <StyledText variant="regular" className="text-sm text-ink-500">
        {payable.dueDate
          ? t('dueOn', { date: payable.dueDate })
          : t('noDueDate')}
      </StyledText>
      {payable.note ? (
        <StyledText variant="regular" className="text-xs text-ink-500">
          {payable.note}
        </StyledText>
      ) : null}

      {onDelete ? (
        <Pressable
          onPress={() => onDelete(payable.id)}
          accessibilityRole="button"
          className="mt-1 self-start rounded-lg px-1 py-1 active:opacity-70"
        >
          <StyledText
            variant="semibold"
            className="text-sm text-semantic-danger"
          >
            {t('deletePayable')}
          </StyledText>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 13: Run it**

Run: `npx jest tests/components/PayableRow.test.tsx`
Expected: PASS.

- [ ] **Step 14: Write the failing `PaymentTermsField` and `payableErrors` tests**

Create `tests/components/PaymentTermsField.test.tsx`:

```tsx
import { fireEvent, render } from '@testing-library/react-native';
import { PaymentTermsField } from '@/components/payables/PaymentTermsField';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

describe('PaymentTermsField', () => {
  it('shows the label, hint, and current value', async () => {
    const { getByText, getByLabelText } = await render(
      <PaymentTermsField value="30" onChangeText={jest.fn()} />,
    );
    expect(getByText('termsLabel')).toBeTruthy();
    expect(getByText('termsHint')).toBeTruthy();
    expect(getByLabelText('termsLabel').props['value']).toBe('30');
  });

  it('reports typed text', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <PaymentTermsField value="" onChangeText={onChangeText} />,
    );
    await fireEvent.changeText(getByLabelText('termsLabel'), '15');
    expect(onChangeText).toHaveBeenCalledWith('15');
  });

  it('shows an error only for invalid input; empty is valid', async () => {
    const empty = await render(
      <PaymentTermsField value="" onChangeText={jest.fn()} />,
    );
    expect(empty.queryByText('termsInvalid')).toBeNull();
    for (const bad of ['-1', '1.5', 'abc']) {
      const { getByText, unmount } = await render(
        <PaymentTermsField value={bad} onChangeText={jest.fn()} />,
      );
      expect(getByText('termsInvalid')).toBeTruthy();
      await unmount();
    }
  });
});
```

Create `tests/components/payableErrors.test.ts`:

```ts
import type { TFunction } from 'i18next';
import { payableErrorMessage } from '@/components/payables/payableErrors';
import {
  InvalidDueDateError,
  InvalidPayableAmountError,
  PayableLockedError,
  PaymentExceedsBalanceError,
} from '@/hooks/useSupplierPayables';

const t = ((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key) as unknown as TFunction;

describe('payableErrorMessage', () => {
  it('maps each named error to its string', () => {
    expect(payableErrorMessage(new InvalidPayableAmountError(0), t)).toBe(
      'payInvalid',
    );
    expect(payableErrorMessage(new InvalidDueDateError('x'), t)).toBe(
      'dueInvalid',
    );
    expect(payableErrorMessage(new PayableLockedError(1), t)).toBe(
      'errorLocked',
    );
  });

  it('names the balance when a payment is too large', () => {
    const message = payableErrorMessage(
      new PaymentExceedsBalanceError(200, 150),
      t,
    );
    expect(message.startsWith('payExceeds:')).toBe(true);
    expect(message).toContain('150');
  });

  it('falls back to the generic message', () => {
    expect(payableErrorMessage(new Error('disk I/O'), t)).toBe('errorGeneric');
    expect(payableErrorMessage('nope', t)).toBe('errorGeneric');
  });
});
```

- [ ] **Step 15: Implement `PaymentTermsField`, `payableErrors`, and the index**

Create `components/payables/PaymentTermsField.tsx`:

```tsx
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { parseTermsDays } from '@/lib/payables';

export interface PaymentTermsFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
}

/** Optional per-supplier payment terms, in whole days. Empty means no terms. */
export function PaymentTermsField({
  value,
  onChangeText,
  onBlur,
}: PaymentTermsFieldProps) {
  const { t } = useTranslation('payables');
  const invalid = !parseTermsDays(value).ok;

  return (
    <View className="mb-4 mt-3 rounded-2xl border border-ink-100 bg-paper-50 p-4 shadow-paper">
      <StyledText variant="semibold" className="mb-2 text-sm text-ink-900">
        {t('termsLabel')}
      </StyledText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder="30"
        placeholderTextColor="#A89F90"
        accessibilityLabel={t('termsLabel')}
        className="rounded-xl border border-ink-200 bg-paper-100 px-4 py-3.5 text-base text-ink-900"
      />
      <StyledText variant="regular" className="mt-1 text-xs text-ink-400">
        {t('termsHint')}
      </StyledText>
      {invalid ? (
        <StyledText
          variant="medium"
          className="mt-1 text-xs text-persimmon-600"
        >
          {t('termsInvalid')}
        </StyledText>
      ) : null}
    </View>
  );
}
```

Create `components/payables/payableErrors.ts`:

```ts
import type { TFunction } from 'i18next';
import {
  InvalidDueDateError,
  InvalidPayableAmountError,
  PayableLockedError,
  PaymentExceedsBalanceError,
} from '@/hooks/useSupplierPayables';
import { formatPesos } from '@/lib/money';

/** Maps a payables error to owner-facing copy in the `payables` namespace. */
export function payableErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof PaymentExceedsBalanceError) {
    return t('payExceeds', { balance: formatPesos(err.balance) });
  }
  if (err instanceof InvalidPayableAmountError) return t('payInvalid');
  if (err instanceof InvalidDueDateError) return t('dueInvalid');
  if (err instanceof PayableLockedError) return t('errorLocked');
  return t('errorGeneric');
}
```

Create `components/payables/index.ts`:

```ts
export * from './AddPayableSheet';
export * from './PayableRow';
export * from './PayPayableSheet';
export * from './PaymentPicker';
export * from './PaymentTermsField';
export * from './payableErrors';
```

- [ ] **Step 16: Run all component tests and the type check**

Run: `npx jest tests/components/PaymentPicker.test.tsx tests/components/PayPayableSheet.test.tsx tests/components/AddPayableSheet.test.tsx tests/components/PayableRow.test.tsx tests/components/PaymentTermsField.test.tsx tests/components/payableErrors.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: only the known `[id].tsx` error from Task 5.

- [ ] **Step 17: Commit**

```bash
git add components/payables tests/components/PaymentPicker.test.tsx tests/components/PayPayableSheet.test.tsx tests/components/AddPayableSheet.test.tsx tests/components/PayableRow.test.tsx tests/components/PaymentTermsField.test.tsx tests/components/payableErrors.test.ts
git commit -m "feat(payables): add payment picker, sheets, row, and terms field" -- components/payables tests/components/PaymentPicker.test.tsx tests/components/PayPayableSheet.test.tsx tests/components/AddPayableSheet.test.tsx tests/components/PayableRow.test.tsx tests/components/PaymentTermsField.test.tsx tests/components/payableErrors.test.ts
```

---

### Task 8: Payables screens and More row

**Files:**

- Create: `app/settings/payables.tsx`, `app/settings/payables/[supplierId].tsx`
- Modify: `components/more/moreNavigation.ts`, `components/more/MoreHomeScreen.tsx`
- Test: `tests/components/PayablesScreen.test.tsx`, `tests/components/SupplierPayablesScreen.test.tsx`

**Interfaces:**

- Consumes: Task 5 hooks, Task 7 components and `payableErrorMessage`, Task 1 `dueDateFromTerms`, `useGetSupplier` from `@/hooks/useSuppliers`, `MoreDetailHeader` and `goBackToMore` from `@/components/more`.
- Produces: routes `/settings/payables` and `/settings/payables/[supplierId]`; `MORE_ROUTES.payables`.

- [ ] **Step 1: Add the route constant**

In `components/more/moreNavigation.ts`, add `payables: '/settings/payables',` after the `reprice` entry in `MORE_ROUTES`, and add `| typeof MORE_ROUTES.payables` after `| typeof MORE_ROUTES.reprice` in `MoreDestination`.

- [ ] **Step 2: Add the More row**

In `components/more/MoreHomeScreen.tsx`:

1. Replace the hooks import

```tsx
import {
  useFinancialTotals,
  useLocalSnapshots,
  useRepriceFlags,
} from '@/hooks';
```

with

```tsx
import {
  useFinancialTotals,
  useLocalSnapshots,
  usePayablesSummary,
  useRepriceFlags,
} from '@/hooks';
import { formatPesos } from '@/lib/money';
```

2. After `const repriceSupportingText = ...;` add:

```tsx
const payablesSummary = usePayablesSummary();
const payablesOverdueCount = payablesSummary.data?.overdueCount ?? 0;
const payablesOwed = payablesSummary.data?.totalOwed ?? 0;
const payablesSupportingText =
  payablesOwed > 0
    ? t('common:moreHomePayablesSubOwed', { amount: formatPesos(payablesOwed) })
    : t('common:moreHomePayablesSub');
```

3. After the closing `/>` of the reprice `MoreDestinationRow`, add:

```tsx
<MoreDestinationRow
  icon="money"
  title={t('common:moreHomePayablesLabel')}
  supportingText={payablesSupportingText}
  badgeCount={payablesOverdueCount}
  onPress={() => navigate(MORE_ROUTES.payables)}
  accessibilityLabel={`${t(
    'common:moreHomePayablesLabel',
  )}. ${payablesSupportingText}`}
  accessibilityHint={t('common:moreHomePayablesHint')}
/>
```

- [ ] **Step 3: Write the failing list-screen test**

Create `tests/components/PayablesScreen.test.tsx`:

```tsx
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { PayablesSummary, SupplierBalance } from '@/types/payables.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('@/components/layout', () => ({ useTabBarBottomOffset: () => 0 }));
jest.mock('@/components/more', () => {
  const { Text } = require('react-native');
  return {
    goBackToMore: jest.fn(),
    MoreDetailHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});

let mockBalances: SupplierBalance[] = [];
let mockSummary: PayablesSummary = {
  totalOwed: 0,
  totalOverdue: 0,
  overdueCount: 0,
};
jest.mock('@/hooks/useSupplierPayables', () => ({
  useSupplierBalances: () => ({
    data: mockBalances,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  usePayablesSummary: () => ({ data: mockSummary }),
}));

import PayablesScreen from '@/app/settings/payables';

const balance = (over: Partial<SupplierBalance>): SupplierBalance => ({
  supplierId: 's1',
  supplierName: 'Mang Tonyo',
  balance: 150,
  overdueAmount: 0,
  overdueCount: 0,
  ...over,
});

describe('PayablesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBalances = [];
    mockSummary = { totalOwed: 0, totalOverdue: 0, overdueCount: 0 };
  });

  it('shows the empty state when nothing is owed', async () => {
    const { getByText } = await render(<PayablesScreen />);
    expect(getByText('emptyTitle')).toBeTruthy();
    expect(getByText('emptyBody')).toBeTruthy();
  });

  it('lists suppliers with a balance and the summary totals', async () => {
    mockBalances = [
      balance({ overdueAmount: 100, overdueCount: 2 }),
      balance({ supplierId: 's2', supplierName: 'Aling Nena', balance: 40 }),
    ];
    mockSummary = { totalOwed: 190, totalOverdue: 100, overdueCount: 2 };
    const { getByText, queryByText } = await render(<PayablesScreen />);
    expect(getByText('Mang Tonyo')).toBeTruthy();
    expect(getByText('Aling Nena')).toBeTruthy();
    expect(getByText('totalOwed')).toBeTruthy();
    expect(getByText('totalOverdue')).toBeTruthy();
    expect(getByText('overdueCount:{"count":2}')).toBeTruthy();
    expect(queryByText('emptyTitle')).toBeNull();
  });

  it('opens the supplier detail on press', async () => {
    mockBalances = [balance({})];
    const { getByText } = await render(<PayablesScreen />);
    await fireEvent.press(getByText('Mang Tonyo'));
    expect(mockPush).toHaveBeenCalledWith('/settings/payables/s1');
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx jest tests/components/PayablesScreen.test.tsx`
Expected: FAIL, cannot find `@/app/settings/payables`.

- [ ] **Step 5: Implement the list screen**

Create `app/settings/payables.tsx`:

```tsx
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import {
  usePayablesSummary,
  useSupplierBalances,
} from '@/hooks/useSupplierPayables';
import { formatPesos } from '@/lib/money';

export default function PayablesScreen() {
  const { t } = useTranslation('payables');
  const router = useRouter();
  const bottomOffset = useTabBarBottomOffset();
  const balancesQuery = useSupplierBalances();
  const summaryQuery = usePayablesSummary();

  const balances = balancesQuery.data ?? [];
  const summary = summaryQuery.data;

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('title')}
        subtitle={t('subtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('back')}
      />
      <KeyboardAwareScrollView
        bottomOffset={64}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomOffset + 16,
          rowGap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={balancesQuery.isRefetching}
            onRefresh={() => {
              void balancesQuery.refetch();
            }}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        {balancesQuery.isLoading ? (
          <ActivityIndicator color="#E85A1F" />
        ) : balancesQuery.isError ? (
          <StyledText variant="regular" className="text-sm text-ink-600">
            {t('loadError')}
          </StyledText>
        ) : balances.length === 0 ? (
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
          <>
            <View className="flex-row gap-x-3">
              <View className="flex-1 rounded-2xl border border-paper-300 bg-paper-50 p-4">
                <StyledText variant="regular" className="text-xs text-ink-500">
                  {t('totalOwed')}
                </StyledText>
                <StyledText
                  variant="black"
                  className="mt-1 text-xl text-ink-900"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatPesos(summary?.totalOwed ?? 0)}
                </StyledText>
              </View>
              <View className="flex-1 rounded-2xl border border-paper-300 bg-paper-50 p-4">
                <StyledText variant="regular" className="text-xs text-ink-500">
                  {t('totalOverdue')}
                </StyledText>
                <StyledText
                  variant="black"
                  className={`mt-1 text-xl ${
                    (summary?.totalOverdue ?? 0) > 0
                      ? 'text-semantic-danger'
                      : 'text-ink-900'
                  }`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatPesos(summary?.totalOverdue ?? 0)}
                </StyledText>
                {(summary?.overdueCount ?? 0) > 0 ? (
                  <StyledText
                    variant="regular"
                    className="mt-0.5 text-xs text-ink-500"
                  >
                    {t('overdueCount', { count: summary?.overdueCount ?? 0 })}
                  </StyledText>
                ) : null}
              </View>
            </View>

            {balances.map((row) => (
              <Pressable
                key={row.supplierId}
                onPress={() =>
                  router.push(`/settings/payables/${row.supplierId}` as Href)
                }
                accessibilityRole="button"
                accessibilityLabel={row.supplierName}
                style={{ minHeight: 64 }}
                className="flex-row items-center justify-between rounded-2xl border border-paper-300 bg-paper-50 px-4 py-3 active:opacity-80"
              >
                <View className="mr-3 flex-1">
                  <StyledText
                    variant="semibold"
                    className="text-base text-ink-800"
                  >
                    {row.supplierName}
                  </StyledText>
                  {row.overdueCount > 0 ? (
                    <View className="mt-1 self-start rounded-full bg-persimmon-500 px-2 py-0.5">
                      <StyledText
                        variant="extrabold"
                        className="text-xs text-paper-50"
                      >
                        {t('overdueChip')}
                      </StyledText>
                    </View>
                  ) : null}
                </View>
                <StyledText
                  variant="extrabold"
                  className="text-base text-ink-900"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatPesos(row.balance)}
                </StyledText>
              </Pressable>
            ))}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
```

- [ ] **Step 6: Run it**

Run: `npx jest tests/components/PayablesScreen.test.tsx`
Expected: PASS. If a native import still fails to load, mock that module as the other mocks in this file do (see `tests/components/RepriceReviewSheet.test.tsx`).

- [ ] **Step 7: Write the failing detail-screen test**

Create `tests/components/SupplierPayablesScreen.test.tsx`:

```tsx
import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { SupplierPayable, SupplierPayment } from '@/types/payables.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ supplierId: 's1' }),
}));

jest.mock('@/components/layout', () => ({ useTabBarBottomOffset: () => 0 }));
jest.mock('@/components/more', () => {
  const { Text } = require('react-native');
  return {
    goBackToMore: jest.fn(),
    MoreDetailHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});
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
jest.mock('@/components/ui', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    Modal: ({
      visible,
      title,
      buttons,
    }: {
      visible: boolean;
      title: string;
      buttons: { text: string; onPress: () => void }[];
    }) =>
      visible ? (
        <View testID="modal">
          <Text>{title}</Text>
          {buttons.map((b) => (
            <Pressable key={b.text} onPress={b.onPress}>
              <Text>{b.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null,
  };
});

const mockAddToast = jest.fn();
jest.mock('@/stores', () => ({
  useToastStore: (selector: (s: { addToast: jest.Mock }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

const mockPay = jest.fn();
const mockDeletePayment = jest.fn();
const mockDeletePayable = jest.fn();
const mockAdd = jest.fn();
let mockPayables: SupplierPayable[] = [];
let mockPayments: SupplierPayment[] = [];

jest.mock('@/hooks/useSuppliers', () => ({
  useGetSupplier: () => ({
    data: { id: 's1', name: 'Mang Tonyo', paymentTermsDays: 30 },
  }),
}));
jest.mock('@/hooks/useSupplierPayables', () => ({
  useSupplierPayables: () => ({ data: mockPayables }),
  useSupplierPayments: () => ({ data: mockPayments }),
  useRecordSupplierPayment: () => ({ mutate: mockPay, isPending: false }),
  useDeleteSupplierPayment: () => ({
    mutate: mockDeletePayment,
    isPending: false,
  }),
  useDeletePayable: () => ({ mutate: mockDeletePayable, isPending: false }),
  useAddPayable: () => ({ mutate: mockAdd, isPending: false }),
}));

import SupplierPayablesScreen from '@/app/settings/payables/[supplierId]';

const payable = (over: Partial<SupplierPayable>): SupplierPayable => ({
  id: 1,
  supplierId: 's1',
  receiptId: null,
  amount: 100,
  amountPaid: 0,
  outstanding: 100,
  dueDate: null,
  note: null,
  voidedAt: null,
  createdAt: '2026-11-01T00:00:00.000Z',
  isOverdue: false,
  ...over,
});

const payment = (over: Partial<SupplierPayment>): SupplierPayment => ({
  id: 9,
  supplierId: 's1',
  amount: 40,
  note: null,
  paidAt: '2026-11-05T08:00:00.000Z',
  createdAt: '2026-11-05T08:00:00.000Z',
  ...over,
});

describe('SupplierPayablesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayables = [
      payable({ id: 1, receiptId: 7 }),
      payable({ id: 2, amount: 50, outstanding: 50 }),
    ];
    mockPayments = [payment({})];
  });

  it('shows the supplier name, bills, and payment history', async () => {
    const { getByText } = await render(<SupplierPayablesScreen />);
    expect(getByText('Mang Tonyo')).toBeTruthy();
    expect(getByText('receiptBill:{"id":7}')).toBeTruthy();
    expect(getByText('manualBill')).toBeTruthy();
    expect(getByText(/^paymentLine/)).toBeTruthy();
  });

  it('opens the receipt of a delivery bill', async () => {
    const { getByText } = await render(<SupplierPayablesScreen />);
    await fireEvent.press(getByText('receiptBill:{"id":7}'));
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/delivery-receipt/7');
  });

  it('pays through the sheet with the typed amount', async () => {
    const { getByText, getByLabelText } = await render(
      <SupplierPayablesScreen />,
    );
    await fireEvent.press(getByText('pay'));
    await fireEvent.changeText(getByLabelText('payAmountLabel'), '120');
    await fireEvent.press(getByText('payConfirm'));
    expect(mockPay).toHaveBeenCalledWith(
      { supplierId: 's1', amount: 120, note: null },
      expect.any(Object),
    );
  });

  it('adds utang with the terms-based due date prefilled', async () => {
    const { getByText, getByLabelText } = await render(
      <SupplierPayablesScreen />,
    );
    await fireEvent.press(getByText('addUtang'));
    const due = getByLabelText('addDueLabel').props['value'] as string;
    expect(due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await fireEvent.changeText(getByLabelText('addAmountLabel'), '75');
    await fireEvent.press(getByText('addConfirm'));
    expect(mockAdd).toHaveBeenCalledWith(
      { supplierId: 's1', amount: 75, dueDate: due, note: null },
      expect.any(Object),
    );
  });

  it('asks before deleting a payment, then deletes it', async () => {
    const { getByText } = await render(<SupplierPayablesScreen />);
    await fireEvent.press(getByText('deletePayment'));
    expect(mockDeletePayment).not.toHaveBeenCalled();
    await fireEvent.press(getByText('delete'));
    expect(mockDeletePayment).toHaveBeenCalledWith(9, expect.any(Object));
  });

  it('offers delete only on an untouched manual bill', async () => {
    mockPayables = [
      payable({ id: 1, receiptId: 7 }),
      payable({ id: 2, amountPaid: 10, outstanding: 90 }),
      payable({ id: 3 }),
    ];
    const { getAllByText } = await render(<SupplierPayablesScreen />);
    expect(getAllByText('deletePayable')).toHaveLength(1);
  });

  it('disables Pay when nothing is owed', async () => {
    mockPayables = [payable({ amountPaid: 100, outstanding: 0 })];
    const { getByText } = await render(<SupplierPayablesScreen />);
    await fireEvent.press(getByText('pay'));
    const { queryByTestId } = await render(<SupplierPayablesScreen />);
    expect(queryByTestId('sheet')).toBeNull();
  });
});
```

- [ ] **Step 8: Implement the detail screen**

Create `app/settings/payables/[supplierId].tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useTabBarBottomOffset } from '@/components/layout';
import { MoreDetailHeader } from '@/components/more';
import {
  AddPayableSheet,
  PayableRow,
  PayPayableSheet,
  payableErrorMessage,
} from '@/components/payables';
import { Modal } from '@/components/ui';
import {
  useAddPayable,
  useDeletePayable,
  useDeleteSupplierPayment,
  useRecordSupplierPayment,
  useSupplierPayables,
  useSupplierPayments,
} from '@/hooks/useSupplierPayables';
import { useGetSupplier } from '@/hooks/useSuppliers';
import { formatPesos } from '@/lib/money';
import { dueDateFromTerms } from '@/lib/payables';
import { useToastStore } from '@/stores';
import { getTodayDateString } from '@/utils/timezone';

const LIST_ROUTE = '/settings/payables' as Href;

export default function SupplierPayablesScreen() {
  const { supplierId } = useLocalSearchParams<{ supplierId: string }>();
  const id = supplierId ?? '';
  const router = useRouter();
  const { t } = useTranslation('payables');
  const addToast = useToastStore((s) => s.addToast);
  const bottomOffset = useTabBarBottomOffset();

  const supplierQuery = useGetSupplier(id);
  const payablesQuery = useSupplierPayables(id || null);
  const paymentsQuery = useSupplierPayments(id || null);
  const payMutation = useRecordSupplierPayment();
  const addMutation = useAddPayable();
  const deletePaymentMutation = useDeleteSupplierPayment();
  const deletePayableMutation = useDeletePayable();

  const [payOpen, setPayOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);
  const [payableToDelete, setPayableToDelete] = useState<number | null>(null);

  const supplier = supplierQuery.data ?? null;
  const payables = useMemo(
    () => payablesQuery.data ?? [],
    [payablesQuery.data],
  );
  const payments = paymentsQuery.data ?? [];
  const balance = useMemo(
    () => payables.reduce((sum, p) => sum + p.outstanding, 0),
    [payables],
  );
  const defaultDueDate = dueDateFromTerms(
    getTodayDateString(),
    supplier?.paymentTermsDays ?? null,
  );

  const toastError = (err: unknown) =>
    addToast({ message: payableErrorMessage(err, t), variant: 'danger' });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(LIST_ROUTE);
  };

  const handlePay = (input: { amount: number; note: string | null }) => {
    payMutation.mutate(
      { supplierId: id, amount: input.amount, note: input.note },
      {
        onSuccess: () => {
          setPayOpen(false);
          addToast({ message: t('paymentRecordedToast'), variant: 'success' });
        },
        onError: toastError,
      },
    );
  };

  const handleAdd = (input: {
    amount: number;
    dueDate: string | null;
    note: string | null;
  }) => {
    addMutation.mutate(
      {
        supplierId: id,
        amount: input.amount,
        dueDate: input.dueDate,
        note: input.note,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          addToast({ message: t('utangAddedToast'), variant: 'success' });
        },
        onError: toastError,
      },
    );
  };

  const confirmDeletePayment = () => {
    const paymentId = paymentToDelete;
    setPaymentToDelete(null);
    if (paymentId === null) return;
    deletePaymentMutation.mutate(paymentId, {
      onSuccess: () =>
        addToast({ message: t('paymentDeletedToast'), variant: 'success' }),
      onError: toastError,
    });
  };

  const confirmDeletePayable = () => {
    const payableId = payableToDelete;
    setPayableToDelete(null);
    if (payableId === null) return;
    deletePayableMutation.mutate(payableId, {
      onSuccess: () =>
        addToast({ message: t('payableDeletedToast'), variant: 'success' }),
      onError: toastError,
    });
  };

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={supplier?.name ?? t('title')}
        subtitle={`${t('balanceLabel')} ${formatPesos(balance)}`}
        onBack={goBack}
        backAccessibilityLabel={t('back')}
      />
      <KeyboardAwareScrollView
        bottomOffset={64}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomOffset + 16,
          rowGap: 12,
        }}
      >
        <View className="flex-row gap-x-3">
          <Pressable
            onPress={() => balance > 0 && setPayOpen(true)}
            disabled={balance <= 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: balance <= 0 }}
            className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-persimmon-500 active:opacity-80 ${
              balance <= 0 ? 'opacity-50' : ''
            }`}
          >
            <StyledText variant="extrabold" className="text-sm text-paper-50">
              {t('pay')}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={() => setAddOpen(true)}
            accessibilityRole="button"
            className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
          >
            <StyledText variant="semibold" className="text-sm text-ink-800">
              {t('addUtang')}
            </StyledText>
          </Pressable>
        </View>

        <StyledText variant="black" className="label-caps text-cinnamon-500">
          {t('billsSection')}
        </StyledText>
        {payables.length === 0 ? (
          <StyledText variant="regular" className="text-sm text-ink-500">
            {t('noBills')}
          </StyledText>
        ) : (
          payables.map((p) => (
            <PayableRow
              key={p.id}
              payable={p}
              onOpenReceipt={(receiptId) =>
                router.push(
                  `/(edit-forms)/delivery-receipt/${receiptId}` as Href,
                )
              }
              {...(p.receiptId === null && p.amountPaid === 0
                ? { onDelete: setPayableToDelete }
                : {})}
            />
          ))
        )}

        <StyledText
          variant="black"
          className="label-caps mt-2 text-cinnamon-500"
        >
          {t('paymentsSection')}
        </StyledText>
        {payments.length === 0 ? (
          <StyledText variant="regular" className="text-sm text-ink-500">
            {t('noPayments')}
          </StyledText>
        ) : (
          payments.map((payment) => (
            <View
              key={payment.id}
              className="flex-row items-center justify-between rounded-2xl border border-paper-300 bg-paper-50 p-4"
            >
              <View className="mr-3 flex-1">
                <StyledText variant="semibold" className="text-sm text-ink-800">
                  {t('paymentLine', {
                    amount: formatPesos(payment.amount),
                    date: payment.paidAt.slice(0, 10),
                  })}
                </StyledText>
                {payment.note ? (
                  <StyledText
                    variant="regular"
                    className="text-xs text-ink-500"
                  >
                    {payment.note}
                  </StyledText>
                ) : null}
              </View>
              <Pressable
                onPress={() => setPaymentToDelete(payment.id)}
                accessibilityRole="button"
                className="rounded-lg px-1 py-1 active:opacity-70"
              >
                <StyledText
                  variant="semibold"
                  className="text-sm text-semantic-danger"
                >
                  {t('deletePayment')}
                </StyledText>
              </Pressable>
            </View>
          ))
        )}
      </KeyboardAwareScrollView>

      <PayPayableSheet
        visible={payOpen}
        supplierName={supplier?.name ?? ''}
        balance={balance}
        busy={payMutation.isPending}
        onClose={() => setPayOpen(false)}
        onSubmit={handlePay}
      />
      <AddPayableSheet
        visible={addOpen}
        defaultDueDate={defaultDueDate}
        busy={addMutation.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      <Modal
        visible={paymentToDelete !== null}
        onClose={() => setPaymentToDelete(null)}
        title={t('deletePayment')}
        description={t('deletePaymentConfirm')}
        variant="warning"
        buttons={[
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => setPaymentToDelete(null),
          },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: confirmDeletePayment,
          },
        ]}
      />
      <Modal
        visible={payableToDelete !== null}
        onClose={() => setPayableToDelete(null)}
        title={t('deletePayable')}
        description={t('deletePayableConfirm')}
        variant="warning"
        buttons={[
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => setPayableToDelete(null),
          },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: confirmDeletePayable,
          },
        ]}
      />
    </View>
  );
}
```

Note: the test's last case renders the screen twice (once to press the disabled Pay, once to assert no sheet). If that reads as confusing when you run it, simplify to a single render, press `pay`, and assert `queryByTestId('sheet')` is null on that same render.

- [ ] **Step 9: Run the screen tests and the type check**

Run: `npx jest tests/components/PayablesScreen.test.tsx tests/components/SupplierPayablesScreen.test.tsx tests/components/MoreDestinationRow.test.tsx`
Expected: PASS. A missing native module means adding a `jest.mock` for it in the test file, following the mocks already shown.

Run: `npx tsc --noEmit`
Expected: only the known `[id].tsx` error from Task 5.

- [ ] **Step 10: Commit**

```bash
git add app/settings/payables.tsx "app/settings/payables/[supplierId].tsx" components/more/moreNavigation.ts components/more/MoreHomeScreen.tsx tests/components/PayablesScreen.test.tsx tests/components/SupplierPayablesScreen.test.tsx
git commit -m "feat(payables): add payables screens and More tab row" -- app/settings/payables.tsx "app/settings/payables/[supplierId].tsx" components/more/moreNavigation.ts components/more/MoreHomeScreen.tsx tests/components/PayablesScreen.test.tsx tests/components/SupplierPayablesScreen.test.tsx
```

---

### Task 9: Payment choice on the delivery receipt screen

**Files:**

- Modify: `app/(edit-forms)/delivery-receipt/[id].tsx`
- Modify: `components/receiving/deliveryErrors.ts`
- Test: `tests/components/deliveryErrors.test.ts` (extend)

**Interfaces:**

- Consumes: Task 1 (`EMPTY_PAYMENT_PICKER`, `PaymentPickerValue`, `buildCommitPayment`, `dueDateFromTerms`), Task 5 (`useCommitDeliveryReceipt` new input; re-exported errors from `@/hooks/useDeliveryReceipts`), Task 6 (`receiving:` keys), Task 7 (`PaymentPicker`).
- Produces: nothing used later.

- [ ] **Step 1: Extend the failing error-mapping test**

In `tests/components/deliveryErrors.test.ts`, add to the import from `@/hooks/useDeliveryReceipts`:

```ts
  InvalidDueDateError,
  InvalidPartialPaymentError,
  PayableHasPaymentsError,
  ReceiptNoCostError,
```

Add these rows to the existing `it.each([...])` list:

```ts
    [new ReceiptNoCostError(1), 'errorNoCost'],
    [new InvalidPartialPaymentError(1, 100), 'errorPartialInvalid'],
    [new InvalidDueDateError('2026-02-30'), 'errorDueDateInvalid'],
```

And add this test inside the `describe`:

```ts
it('names the receipt whose payments block a void', () => {
  expect(deliveryErrorMessage(new PayableHasPaymentsError(5), t)).toBe(
    'errorHasPayments:{"id":5}',
  );
});
```

Run: `npx jest tests/components/deliveryErrors.test.ts`
Expected: FAIL (new errors fall through to `errorGeneric`).

- [ ] **Step 2: Map the new errors**

In `components/receiving/deliveryErrors.ts`, extend the import from `@/hooks/useDeliveryReceipts`:

```ts
import {
  InvalidDueDateError,
  InvalidPartialPaymentError,
  PayableHasPaymentsError,
  QuickAddBarcodeExistsError,
  ReceiptAlreadyVoidedError,
  ReceiptEmptyError,
  ReceiptNoCostError,
  ReceiptNotCommittedError,
  ReceiptNotDraftError,
  VoidWouldGoNegativeError,
} from '@/hooks/useDeliveryReceipts';
```

and add, just before the `InvalidDeliveryLineError` branch:

```ts
if (err instanceof PayableHasPaymentsError) {
  return t('errorHasPayments', { id: err.receiptId });
}
if (err instanceof ReceiptNoCostError) return t('errorNoCost');
if (err instanceof InvalidPartialPaymentError) return t('errorPartialInvalid');
if (err instanceof InvalidDueDateError) return t('errorDueDateInvalid');
```

Run: `npx jest tests/components/deliveryErrors.test.ts`
Expected: PASS.

- [ ] **Step 3: Edit the delivery receipt screen**

All edits are in `app/(edit-forms)/delivery-receipt/[id].tsx`.

1. Add imports next to the existing ones:

```tsx
import { PaymentPicker } from '@/components/payables';
import {
  buildCommitPayment,
  dueDateFromTerms,
  EMPTY_PAYMENT_PICKER,
  type PaymentPickerValue,
} from '@/lib/payables';
import { getTodayDateString } from '@/utils/timezone';
```

2. After the `repriceReceiptId` state declaration add:

```tsx
// How this delivery was paid. Only used when the review step is open.
const [payment, setPayment] =
  useState<PaymentPickerValue>(EMPTY_PAYMENT_PICKER);
```

3. After the `suppliers` memo add:

```tsx
const supplierTerms =
  suppliers.find((s) => s.id === supplierId)?.paymentTermsDays ?? null;
```

4. Replace `handleOpenReview` with:

```tsx
const handleOpenReview = () => {
  if (!allComplete) {
    addToast({ message: t('reviewIncomplete'), variant: 'warning' });
    return;
  }
  Haptics.selectionAsync().catch(() => {});
  // Pre-fill the due date from the supplier's terms; the owner can change or clear it.
  setPayment((prev) =>
    prev.dueDate === ''
      ? {
          ...prev,
          dueDate: dueDateFromTerms(getTodayDateString(), supplierTerms) ?? '',
        }
      : prev,
  );
  setReviewOpen(true);
};
```

5. In `handleCommit`, replace the first lines

```tsx
if (committing.current || isCommitting) return;
committing.current = true;
```

with

```tsx
if (committing.current || isCommitting) return;
const built = buildCommitPayment(payment, review.totalCost);
if (!built.ok) {
  addToast({
    message: t(
      built.field === 'dueDate'
        ? 'errorDueDateInvalid'
        : built.field === 'paidNow'
          ? 'errorPartialInvalid'
          : 'errorNoCost',
    ),
    variant: 'warning',
  });
  return;
}
committing.current = true;
```

and replace `await commitMutation.mutateAsync(savedId);` with

```tsx
await commitMutation.mutateAsync({
  receiptId: savedId,
  payment: built.payment,
});
```

6. Render the picker under the review card. Replace

```tsx
              {reviewOpen && allComplete ? (
                <ReviewCard
                  totalCost={review.totalCost}
                  shortageValue={review.shortageValue}
                  changes={review.changes}
                  t={t}
                />
              ) : (
```

with

```tsx
              {reviewOpen && allComplete ? (
                <>
                  <ReviewCard
                    totalCost={review.totalCost}
                    shortageValue={review.shortageValue}
                    changes={review.changes}
                    t={t}
                  />
                  <PaymentPicker
                    value={payment}
                    onChange={setPayment}
                    total={review.totalCost}
                    disabled={isCommitting}
                  />
                </>
              ) : (
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: no errors (the Task 5 `[id].tsx` error is now fixed).

- [ ] **Step 5: Run the related tests**

Run: `npx jest tests/components tests/deliveryForm.test.ts tests/deliveryReceiptLib.test.ts tests/receivingLocales.test.ts`
Expected: PASS.

- [ ] **Step 6: Manual check in the app**

Run: `npx expo start` and open a supplier with delivery drafting enabled.

1. Set supplier terms to 30 (Task 10), start a delivery, press Review. Expected: payment picker shows "Paid now" selected; choosing "Utang" shows a due date pre-filled 30 days out.
2. Choose "Partial", type `40` with a total above 40, Commit. Expected: delivery commits, More tab shows the supplier owed (total minus 40).
3. Choose "Partial", then switch back to "Paid now", Commit. Expected: no payable created.
4. Try a zero-cost line: Utang and Partial are disabled with the hint.

- [ ] **Step 7: Commit**

```bash
git add "app/(edit-forms)/delivery-receipt/[id].tsx" components/receiving/deliveryErrors.ts tests/components/deliveryErrors.test.ts
git commit -m "feat(payables): choose paid, utang, or partial when committing a delivery" -- "app/(edit-forms)/delivery-receipt/[id].tsx" components/receiving/deliveryErrors.ts tests/components/deliveryErrors.test.ts
```

---

### Task 10: Payment terms on the supplier form

**Files:**

- Modify: `app/(edit-forms)/edit-supplier/[id].tsx`
- Modify: `app/(edit-forms)/add-supplier/index.tsx`

**Interfaces:**

- Consumes: Task 7 `PaymentTermsField`, Task 1 `parseTermsDays`, Task 2 `Supplier.paymentTermsDays` and `InsertSupplierParams.paymentTermsDays`.
- Produces: nothing used later.

- [ ] **Step 1: Edit the edit-supplier screen**

In `app/(edit-forms)/edit-supplier/[id].tsx`:

1. Add imports:

```tsx
import { PaymentTermsField } from '@/components/payables';
import { parseTermsDays } from '@/lib/payables';
```

2. Add `paymentTermsDays: string;` to `SupplierFormData` (after `notes: string;`).

3. In `defaultValues` add `paymentTermsDays: '',` after `notes: '',`.

4. In the `reset({...})` call inside the supplier `useEffect` add:

```tsx
        paymentTermsDays:
          supplier.paymentTermsDays !== null
            ? String(supplier.paymentTermsDays)
            : '',
```

5. In `onSubmit`, build the terms before `updateSupplierMutation.mutate` and add them to `patch`:

```tsx
    const terms = parseTermsDays(data.paymentTermsDays);
    updateSupplierMutation.mutate(
      {
        id,
        patch: {
          name: data.name.trim(),
          contact: data.contact.trim() || null,
          notes: data.notes.trim() || null,
          paymentTermsDays: terms.ok ? terms.value : null,
        },
        productIds: selectedProductIds,
      },
```

(keep the existing `{ onSuccess: ... }` second argument unchanged).

6. Between the `NotesCard` usage and the next dashed divider, add a controlled terms field. Insert after the `<NotesCard ... />` element:

```tsx
<Controller
  control={control}
  name="paymentTermsDays"
  rules={{ validate: (v: string) => parseTermsDays(v).ok }}
  render={({ field: { onChange, onBlur, value } }) => (
    <PaymentTermsField value={value} onChangeText={onChange} onBlur={onBlur} />
  )}
/>
```

- [ ] **Step 2: Edit the add-supplier screen**

Open `app/(edit-forms)/add-supplier/index.tsx` and apply the same five changes, anchored on the same structure:

1. Add the two imports (`PaymentTermsField`, `parseTermsDays`).
2. Add `paymentTermsDays: string;` to its `SupplierFormData` and `paymentTermsDays: ''` to its `useForm` `defaultValues`.
3. In its submit handler (the `insertSupplierMutation.mutate({...})` call), add `paymentTermsDays` computed as in step 1.5:

```tsx
    const terms = parseTermsDays(data.paymentTermsDays);
    // then, inside the object passed to insertSupplierMutation.mutate:
    paymentTermsDays: terms.ok ? terms.value : null,
```

4. Render the same `<Controller name="paymentTermsDays" ...>` block after the notes card.

- [ ] **Step 3: Type check and tests**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest tests/components/PaymentTermsField.test.tsx`
Expected: PASS.

- [ ] **Step 4: Manual check**

Run: `npx expo start`. Add a supplier with terms `30`, reopen it, expect `30` shown. Clear the field and save, reopen, expect it empty. Type `abc`, expect the inline error and a disabled Save button.

- [ ] **Step 5: Commit**

```bash
git add "app/(edit-forms)/edit-supplier/[id].tsx" "app/(edit-forms)/add-supplier/index.tsx"
git commit -m "feat(payables): add payment terms field to the supplier forms" -- "app/(edit-forms)/edit-supplier/[id].tsx" "app/(edit-forms)/add-supplier/index.tsx"
```

---

### Task 11: Final verification

**Files:** none created. Fixes only.

- [ ] **Step 1: Run the whole test suite**

Run: `npx jest`
Expected: PASS. If an existing test breaks, the usual causes are (a) a `Supplier` fixture missing `paymentTermsDays`, (b) a test that calls `useCommitDeliveryReceipt().mutateAsync(<number>)`, (c) a test that deletes a supplier before migrations ran. Fix the fixture or call, not the production code.

- [ ] **Step 2: Type check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint components/payables hooks/useSupplierPayables.ts database/supplierPayables.ts lib/payables.ts app/settings/payables.tsx "app/settings/payables/[supplierId].tsx"`
Expected: no errors. Fix any reported.

- [ ] **Step 3: Walk the spec once**

Open `docs/superpowers/specs/2026-11-13-supplier-payables-design.md` and tick each Scope bullet against a passing test or a manual check from Tasks 9 and 10. Success criteria: commit as paid, utang, or part-paid; manual utang; oldest-first payment; at-a-glance list with overdue and a More-tab badge.

- [ ] **Step 4: Report**

Do not touch the vault. Tell the user the vault note `obsidian-vault/02-Features/supplier-payables.md` may now be updated from `draft` to implemented, and let them decide (per `obsidian-vault/AGENTS.md` write etiquette).

---

## Self-Review

**Spec coverage**

| Spec item                                                                                               | Task                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Migration 25: three tables, indexes, `payment_terms_days` with CHECK, guarded ALTER                     | 2                                  |
| `CommitPayment` and commit modes paid, utang, partial; total from lines; `ReceiptNoCostError`; rollback | 3, 4                               |
| Partial allocated only to the new payable                                                               | 3 (`createReceiptPayable`), 4 test |
| `addSupplierPayable`, positive integer, supplier must exist                                             | 3                                  |
| FIFO `recordSupplierPayment`, `PaymentExceedsBalanceError`, `created_at ASC, id ASC`                    | 3                                  |
| `deleteSupplierPayment` reverses allocations                                                            | 3                                  |
| Void check before any stock reversal, `PayableHasPaymentsError`, payable voided                         | 4                                  |
| `updateSupplierPayable` rules, `deleteSupplierPayable` lock rules                                       | 3                                  |
| Terms on `updateSupplier` and insert paths                                                              | 2                                  |
| `lib/payables.ts` three pure functions                                                                  | 1                                  |
| `types/payables.types.ts`                                                                               | 1                                  |
| Hooks and invalidation incl. delivery commit and void                                                   | 5                                  |
| More tab row with overdue badge                                                                         | 8                                  |
| List screen and supplier detail screen                                                                  | 8                                  |
| Delivery receipt payment picker, due date pre-fill, paid-now field                                      | 7, 9                               |
| Supplier form terms field                                                                               | 7, 10                              |
| Components `PayableRow`, `PaymentPicker`, `PayPayableSheet`, `AddPayableSheet`                          | 7                                  |
| `payables` namespace in `en` and `tl`; More strings in `common`                                         | 6                                  |
| Blocked void shows which receipt has payments                                                           | 6, 9 (`errorHasPayments` with id)  |
| Supplier with payables cannot be deleted, clear message                                                 | 2                                  |
| Tests listed in the spec                                                                                | 1 to 5, 7, 8                       |
| `parsePesosInput` for amount fields                                                                     | 1 (`parseWholePesos`), 7           |
| Out of scope items (interest, reminders, PIN gate, `financial_entries`, backfill)                       | Not built; no task touches them    |

Spec items I extended and why: `InvalidDueDateError` and calendar-valid dates (the spec says `YYYY-MM-DD`, so `2026-02-30` must be rejected somewhere); a delete button for untouched manual payables (the spec defines `deleteSupplierPayable` and `useDeletePayable` but lists no UI, so an owner could not fix a typo); `useUpdatePayable` has a hook but no UI, as the spec screens list no edit action.

**Placeholder scan:** The only deliberate "open the file" steps are the `receiving.json` pair (Task 6 step 6) and `add-supplier/index.tsx` (Task 10 step 2), because I could not anchor an exact edit without reading content that is not in the spec. Both give the exact keys or snippets to add.

**Type consistency:** `CommitPayment`, `SupplierPayable`, `SupplierBalance`, `PayablesSummary`, `AddPayableInput`, `RecordSupplierPaymentInput`, `UpdatePayableInput`, `PaymentPickerValue`, and hook names match across Tasks 1, 3, 5, 7, 8, and 9. `useCommitDeliveryReceipt` input changes in Task 5 and is consumed in Task 9. `BuildCommitPaymentResult` fields (`dueDate`, `paidNow`, `total`) match the screen's mapping in Task 9.
