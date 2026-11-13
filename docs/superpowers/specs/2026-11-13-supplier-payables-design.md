# Supplier Payables Design

- Date: 2026-11-13
- Status: draft, awaiting review
- Vault note: `obsidian-vault/02-Features/supplier-payables.md`

## Intent

Sari-sari owners often take stock from suppliers and ahente on utang and pay later. Today the app records what a delivery cost but not whether it was paid. This feature tracks what the owner owes each supplier, when it is due, and what has been paid, using the same oldest-first model as the suki ledger.

Success means: the owner can commit a delivery as paid, on utang, or part-paid; add utang that has no delivery receipt; record a payment against a supplier and see the oldest bills settle first; and see at a glance who is owed money and what is overdue.

## Background

This is feature 7 of the money-flow set (feature 10, price history, is done).

- Suki credit is the pattern to mirror: `credit_transactions`, `payments`, and FIFO `payment_allocations` in `database/credits.ts`. Balance is computed live and a payment deletion reverses its allocations.
- `delivery_receipts` and `delivery_receipt_lines` (migration 21) hold the receipt. Receipt total is `SUM(received_qty * actual_unit_cost)` (`database/deliveries.ts`, `listDeliveryReceipts`).
- `commitDeliveryReceipt` restocks and flips status to `committed` in one transaction. `voidDeliveryReceipt` reverses stock and does not roll back `cost_price`.
- `suppliers.id` is TEXT. `delivery_receipts.id` is INTEGER.
- `financial_entries` is the expense log. Paying a supplier is stock cost, not an operating expense, so payables do not touch it.
- Schema is at `user_version = 24`. This feature is migration 25.

## Decisions

| Question                   | Decision                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Where do payables come from| Both: a delivery commit can create one, and the owner can add utang by hand.                      |
| How are payments applied   | Oldest first (FIFO by `created_at`), same as the suki ledger.                                     |
| Cash and expense log       | Separate ledger. Payables and payments never write to `financial_entries`.                        |
| Due dates                  | Optional per-supplier terms in days pre-fill the due date. The owner can change or clear it.      |
| Data model                 | Three tables mirroring the suki ledger: payables, payments, allocations.                          |

## Scope

In scope:

- `supplier_payables`, `supplier_payments`, `supplier_payment_allocations`, and `suppliers.payment_terms_days`.
- Payment choice at delivery commit: Paid now, Utang, Partial.
- Manual "Add utang".
- Record and delete supplier payments, FIFO allocation, reversible.
- Payables list with per-supplier balance and overdue state, a supplier detail screen, and a More tab row with an overdue badge.
- Payment terms field on the supplier form.

Out of scope:

- Interest or penalties.
- Post-dated checks.
- Push or scheduled reminders.
- A separate ahente entity. An ahente is a supplier.
- A new owner PIN gate on payments.
- Any link to the daily close-out, savings goal, or capital split.
- Backfilling payables for receipts committed before migration 25. Those count as paid.
- Writing supplier payments to `financial_entries`.

## Data model

Migration 25. All money is integer pesos.

### `suppliers` (altered)

| Column               | Type    | Notes                                   |
| -------------------- | ------- | --------------------------------------- |
| `payment_terms_days` | INTEGER | NULL means no default terms. CHECK >= 0 |

Added with `ALTER TABLE ... ADD COLUMN`, guarded by a `PRAGMA table_info` check like migration 21.

### `supplier_payables`

| Column        | Type                              | Notes                                                              |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| `id`          | INTEGER PRIMARY KEY AUTOINCREMENT |                                                                    |
| `supplier_id` | TEXT NOT NULL                     | References `suppliers(id)`                                         |
| `receipt_id`  | INTEGER                           | References `delivery_receipts(id)`. NULL for manual payables       |
| `amount`      | INTEGER NOT NULL                  | CHECK > 0                                                          |
| `amount_paid` | INTEGER NOT NULL DEFAULT 0        | CHECK >= 0 and <= `amount`                                         |
| `due_date`    | TEXT                              | `YYYY-MM-DD`, NULL when there is no due date                       |
| `note`        | TEXT                              |                                                                    |
| `voided_at`   | TEXT                              | ISO timestamp. NULL while active                                   |
| `created_at`  | TEXT NOT NULL                     | ISO timestamp                                                      |

Indexes: UNIQUE on `receipt_id` WHERE `receipt_id IS NOT NULL` (one payable per receipt); `(supplier_id, created_at)`.

### `supplier_payments`

| Column        | Type                              | Notes                      |
| ------------- | --------------------------------- | -------------------------- |
| `id`          | INTEGER PRIMARY KEY AUTOINCREMENT |                            |
| `supplier_id` | TEXT NOT NULL                     | References `suppliers(id)` |
| `amount`      | INTEGER NOT NULL                  | CHECK > 0                  |
| `note`        | TEXT                              |                            |
| `paid_at`     | TEXT NOT NULL                     | ISO timestamp              |
| `created_at`  | TEXT NOT NULL                     | ISO timestamp              |

Index: `(supplier_id, created_at)`.

### `supplier_payment_allocations`

| Column       | Type                              | Notes                                                    |
| ------------ | --------------------------------- | -------------------------------------------------------- |
| `id`         | INTEGER PRIMARY KEY AUTOINCREMENT |                                                          |
| `payment_id` | INTEGER NOT NULL                  | References `supplier_payments(id)` ON DELETE CASCADE     |
| `payable_id` | INTEGER NOT NULL                  | References `supplier_payables(id)`                       |
| `amount`     | INTEGER NOT NULL                  | CHECK > 0                                                |

Index: `payment_id`; `payable_id`.

### Derived values

Computed in SQL or `lib/payables.ts`, never stored:

- `outstanding = amount - amount_paid` for a non-voided payable.
- Paid: `amount_paid = amount`.
- Overdue: not voided, outstanding > 0, `due_date` set, and `due_date` earlier than today in local time. A payable with no `due_date` is never overdue.
- Supplier balance: sum of `outstanding` over the supplier's non-voided payables.

`amount_paid` is a cached total that the allocation functions keep in step with the allocation rows, as `credit_transactions.amount_paid` is today.

## Rules

### Delivery commit

`commitDeliveryReceipt(receiptId, payment?)` gains an optional second argument:

```
type CommitPayment =
  | { mode: 'paid' }
  | { mode: 'utang'; dueDate: string | null }
  | { mode: 'partial'; paidNow: number; dueDate: string | null };
```

Omitted or `{ mode: 'paid' }`: no payable is created and behavior is unchanged. It was a cash purchase.

- `utang`: after restocking, insert a payable with `amount = receipt total`, `receipt_id`, and the given `due_date`.
- `partial`: insert the same payable, then insert a payment of `paidNow` allocated only to that new payable, not to older payables. `paidNow` must be an integer with `0 < paidNow < receipt total`, otherwise the commit throws and rolls back.
- Receipt total is computed from the lines inside the transaction (`SUM(received_qty * actual_unit_cost)`). If it is 0, `utang` and `partial` throw `ReceiptNoCostError` and roll back, because a zero payable is meaningless.
- All writes run inside the existing `db.withTransactionAsync`. Any failure rolls back stock, receipt status, payable, and payment together.

### Manual payable

`addSupplierPayable({ supplierId, amount, dueDate, note })` inserts a payable with `receipt_id = NULL`. `amount` must be a positive integer. The supplier must exist.

### Supplier payment (FIFO)

`recordSupplierPayment({ supplierId, amount, note, paidAt? })` runs in one transaction:

1. Reject if `amount` is not a positive integer.
2. Reject with `PaymentExceedsBalanceError` if `amount` is greater than the supplier's balance.
3. Insert the payment.
4. Walk the supplier's non-voided payables with outstanding > 0, ordered by `created_at ASC, id ASC`. For each, allocate `min(remaining, outstanding)`, insert an allocation row, and increase `amount_paid`.

`deleteSupplierPayment(id)` runs in one transaction. It reads the payment's allocations, subtracts each `amount` from the matching payable's `amount_paid`, then deletes the payment. The cascade removes the allocation rows.

### Void a delivery

`voidDeliveryReceipt` additionally checks the receipt's payable inside its transaction:

- No payable, or a payable with `amount_paid = 0`: set `voided_at` on the payable (if any) and continue.
- A payable with `amount_paid > 0`: throw `PayableHasPaymentsError` and change nothing. The owner deletes the related payments first, then voids.

The check runs before any stock reversal so a refusal leaves everything untouched.

### Edit and delete

- `updateSupplierPayable(id, { dueDate?, note?, amount? })`: `dueDate` and `note` are always editable. `amount` is editable only when `receipt_id IS NULL` and the new value is at least `amount_paid`.
- `deleteSupplierPayable(id)`: allowed only when `receipt_id IS NULL` and the payable has no allocation rows. Otherwise it throws `PayableLockedError`.

### Terms

`updateSupplier` and the supplier insert path accept `payment_terms_days` (integer >= 0 or NULL). At delivery commit time the UI pre-fills `dueDate` as received date plus terms. If the supplier has no terms the field is empty.

## Code units

### `lib/payables.ts` (new, pure)

- `dueDateFromTerms(receivedDate: string, termsDays: number | null): string | null`
- `isOverdue(dueDate: string | null, outstanding: number, today: string): boolean`
- `splitPayment(amount: number, outstandings: number[]): number[]`: returns the FIFO allocation for each outstanding, in order. Pure so the allocation rule is unit-tested without SQLite.

### `database/supplierPayables.ts` (new)

`addSupplierPayable`, `updateSupplierPayable`, `deleteSupplierPayable`, `recordSupplierPayment`, `deleteSupplierPayment`, `getSupplierBalances()`, `getSupplierPayables(supplierId)`, `getSupplierPayments(supplierId)`, `getPayablesSummary()` (total owed, total overdue, overdue count), plus `createReceiptPayable(receiptId, supplierId, total, payment)` used by the commit.

The commit helper uses the caller's transaction and does not open its own. All other write functions open their own `db.withTransactionAsync`. All functions use the single handle from `configs/sqlite.ts`.

### `types/payables.types.ts` (new)

`SupplierPayable`, `SupplierPayment`, `SupplierBalance`, `PayablesSummary`, `CommitPayment`.

### Changes to existing code

- `database/migrations.ts`: migration 25 creates the tables and indexes, alters `suppliers`, sets `user_version = 25`.
- `database/deliveries.ts`: `commitDeliveryReceipt` and `runCommit` take `CommitPayment`; `runVoid` checks the payable.
- `database/suppliers.ts`: read and write `payment_terms_days`.
- `types/` supplier type: add `payment_terms_days`.

### `hooks/useSupplierPayables.ts` (new)

Queries: `useSupplierBalances`, `usePayablesSummary`, `useSupplierPayables(supplierId)`, `useSupplierPayments(supplierId)`. Mutations: `useAddPayable`, `useUpdatePayable`, `useDeletePayable`, `useRecordSupplierPayment`, `useDeleteSupplierPayment`. Mutations invalidate the `['supplier-payables']` and `['supplier-payments']` keys. The delivery commit and void mutations also invalidate those keys. Screens use these hooks only.

## Screens

- **More tab**: a "Supplier payables" row in `components/more/`, with `badgeCount` set to the overdue payable count, reusing the reprice-row pattern.
- **`app/settings/payables.tsx`**: summary header (total owed, total overdue) and a list of suppliers with a balance greater than zero, each showing balance and an overdue chip. Empty state when nothing is owed.
- **`app/settings/payables/[supplierId].tsx`**: the supplier's payables (amount, paid, due date, overdue state, receipt link where present), payment history, and "Pay" and "Add utang" actions. Delete payment is available per payment.
- **Delivery receipt screen** (`app/(edit-forms)/delivery-receipt/[id].tsx`): a payment picker (Paid now, Utang, Partial) before Commit. Utang and Partial show a due date field pre-filled from the supplier's terms. Partial also shows the amount paid now.
- **Supplier form**: an optional "Payment terms (days)" field.
- **Components** in `components/payables/`: `PayableRow`, `PaymentPicker`, `PayPayableSheet`, `AddPayableSheet`.
- **Localization**: new `payables` namespace in `en` and `tl`. More row strings go in `common`.

## Error handling

- Commit with a payment problem (zero total, invalid `paidNow`) throws and the whole commit rolls back. There is never a committed delivery whose payable failed to write.
- Payment above the supplier balance shows an inline error and writes nothing.
- A blocked void shows which receipt still has payments so the owner knows what to delete.
- Invalid or empty amount fields disable the submit button. Parsing goes through `parsePesosInput` in `lib/money.ts`.
- A deleted supplier with payables is not allowed to be deleted: the foreign key references `suppliers(id)` with no cascade, so the existing delete path surfaces the constraint error. The supplier screen should show a clear message.

## Testing

Following the pattern in `tests/database/` and `tests/helpers/deliveryFixtures.ts`. Use `tests/helpers/expectRejection.ts` for native SQLite errors. Await every `fireEvent`.

- `tests/lib/payables.test.ts`: `splitPayment` exact, partial, and over-balance; `dueDateFromTerms` with and without terms; `isOverdue` boundary (due today is not overdue).
- `tests/database/supplier-payables-migration.test.ts`: tables, indexes, and `payment_terms_days` exist at version 25; migrating from 24 keeps data.
- `tests/database/supplier-payables.test.ts`:
  - Manual payable add; positive amount enforced.
  - A payment settles the oldest payable first and spills into the next.
  - A payment above balance is rejected and writes nothing.
  - Deleting a payment reverses `amount_paid` and removes allocations.
  - Amount edit blocked on receipt payables and below `amount_paid`.
  - Delete blocked when allocations exist or `receipt_id` is set.
  - A voided payable is excluded from balance.
- `tests/database/delivery-commit-payables.test.ts`:
  - `paid` and omitted creates no payable.
  - `utang` creates a payable equal to the receipt total with the given due date.
  - `partial` creates the payable and a payment allocated only to it, even when an older payable exists.
  - `partial` rejects `paidNow` of 0 and `paidNow` at or above the total.
  - Zero-total receipt with `utang` throws and rolls back.
  - A failed commit leaves no payable, payment, or stock change.
  - Void is blocked with payments, allowed without, and a blocked void changes no stock.
- Component tests for `PaymentPicker`, `PayPayableSheet`, and the payables screens. Mock `react-i18next` so `t(key, opts)` returns `key:JSON`.

## Related work

- `obsidian-vault/02-Features/08-supplier-delivery-receiving.md`: source of receipts and the commit and void flows.
- `obsidian-vault/02-Features/06-collection-queue.md`: the suki-side collection pattern this mirrors.
- `obsidian-vault/02-Features/price-history-and-margin-alert.md`: sibling money-flow feature, unaffected.
