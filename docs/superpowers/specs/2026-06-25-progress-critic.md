# June 25, 2026 Progress Critic

> SariSari is a strong feature-rich prototype, but the README currently overclaims financial reliability: the app
> has the right screens and direction, yet its money, SQLite, utang, and recovery guarantees are not defensible
> enough for a serious offline-first store app.

## Key Issues

- The money invariant is broken. README says integer centavos everywhere, but forms use parseFloat for
  `prices/payments` in `app/(edit-forms)/add-product/index.tsx:174`, `app/(edit-forms)/edit-product/[id].tsx:146`,
  `app/(edit-forms)/add-credit/[id].tsx:87`, and `app/(edit-forms)/add-payment/[id].tsx:84`. Display code is also
  inconsistent: some places divide by 100, some pass fromPesos, some call formatCurrency directly. This is the
  biggest blocker.

- The “one SQLite connection” claim is not true. You open a global DB in `configs/sqlite.ts:3`, but also mount
  SQLiteProvider in `app/\_layout.tsx:59`. The dev reset screen opens another handle. That contradicts your own
  Android SQLITE_BUSY guardrail.

- Utang is not yet audit-safe. The schema does not have the denormalised `customers.balance` described in the
  `README/AGENTS` rules; balances are computed from `credit_transactions`. That can be acceptable, but the
  implementation then needs stronger ledger rules. `insertPayment` writes the payment first, then mutates credit
  rows outside an explicit transaction in `database/credits.ts:298`. FIFO payments are not linked per allocation,
  and `deletePayment` cannot reverse FIFO allocations when `credit_transaction_id` is null.

- Credit sale reversal is unsafe. `insertSale` creates an utang row for credit sales, but it is not linked back to
  the sale by `sale_id`; `deleteSale` restores stock and deletes sale rows but does not `reverse/delete` the related
  credit transaction in `database/sales.ts:306`. That can leave a customer owing money for a deleted sale.

- There is a likely broken foreign key. `sales.customer_credit_id` references `customer_credits(id)` in
  `database/sales.ts:14`, but the actual table is customers. If foreign keys are enforced, credit sale inserts can fail or behave unpredictably.

- Products and inventory still overlap. Product create/update can set quantity directly through
  `database/products.ts:20`, while inventory has its own transaction ledger. Initial stock and edited quantity can bypass
  the inventory movement history, weakening the “source of truth for stock” story.

- Tests and type-checks do not pass. pnpm test fails because better-sqlite3 native bindings are missing.
  `npx tsc --noEmit` fails with four errors, including `useSales.tsx` calling `getSalesByDateRange` with the wrong argument
  shape. `npx expo lint` passes with 7 warnings.

- Backup/recovery is still only a placeholder. `app/settings/index.tsx:4` lists backup/import/export, but no
  implementation exists. For offline-first, this is part of the core trust model, not an optional polish item.

## Questions To Probe

- What is the single canonical money API: `pesosToCentavos`, `centavosToPesos`, and where exactly is conversion allowed?
- Is customer balance meant to be denormalised, derived from ledger rows, or both?
- What should happen when a credit sale, payment, partial payment, or FIFO allocation is deleted or corrected?
- Is `products.quantity` the source of truth, or is it a projection of inventory movements?
- How does a store owner recover data after phone loss, app reinstall, or SQLite corruption?

## Bottom Line

You have made real progress on screens, domain coverage, seed data, inventory movement, POS, utang, and reports.
But the project is not yet financially trustworthy. Fix the money invariant first, then the utang/payment
reversal model, then the single SQLite handle and backup/export story. Until then, pitch it as a promising
prototype, not a reliable offline store ledger.
