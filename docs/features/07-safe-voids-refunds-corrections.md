# 07. Safe Voids, Refunds, and Corrections

> Phase: Next

## Problem

Mistakes happen. The cashier miscounts change, the suki returns a
dud, the price was wrong on the shelf. Today the only way to "fix" a
sale is to delete the row, which erases the audit trail, leaves
inventory quantity out of sync, and silently breaks the daily cash
close-out math. The owner ends up with cash on hand that does not
match the books, and no way to know why.

## User Story

As a store owner, I want to void or refund a sale through a clear,
auditable flow that restores the right quantities and adjusts cash or
utang correctly, so I can correct mistakes without losing the
history.

## In Scope

- A "Void" action on a recently completed sale (within an owner-
  configurable window, default 24h) that:
  - Restores the sold quantities to `products.quantity` and writes
    the reversal as a `type = 'adjustment'` row in
    `inventory_transactions` with a reason code of `void`.
  - Reverses the cash side: if the sale was cash, the cash amount
    is logged as a `direction = 'out'` row in the cash ledger
    (feature 3).
  - Reverses the credit side: the linked `credit_transactions` row
    is marked `status = 'cancelled'` rather than deleted, so the
    suki's balance returns to the previous value without breaking
    the audit trail.
  - Requires an owner PIN (feature 11) to confirm.
- A "Refund" action that behaves like a void but with a
  `reason_code = 'returned_damaged'` or `'returned_other'` recorded
  on the inventory adjustment.
- A "Price correction" action that edits the line item's unit price
  (and recomputes the sale total) without touching quantity, again
  PIN-gated and reason-coded.
- An auditable log of all corrections visible on the sale detail
  screen and on a Corrections report.

## Out of Scope

- Partial refunds where only some line items are returned (initial
  cut is whole-sale void/refund; partial can be added once the
  whole-sale flow is stable).
- Cross-day voids/refunds (the time window is intentionally tight
  to keep the close-out math simple).
- Refund-to-utang (refunding as a credit to the suki's account) —
  not in scope; refunds go back to cash.

## Data Implications

- New columns on `sales`: `cancelled_at` TEXT (nullable),
  `cancelled_by_reason_code` TEXT (nullable),
  `cancelled_by_note` TEXT (nullable).
- New column on `credit_transactions`: `cancelled_at` TEXT
  (nullable). The `status` column already supports a 'cancelled'
  value semantically; the schema just needs a CHECK constraint
  update or a dedicated `cancelled_at` marker to make queries easy.
- New table `sale_corrections`: `id`, `sale_id` (FK), `kind`
  ('void' | 'refund' | 'price_correction'), `actor_reason_code`
  TEXT, `actor_note` TEXT, `actor_user` TEXT (for feature 16 shift
  tracking), `created_at` TEXT.
- All corrections wrap their inventory, cash, and (when relevant)
  credit writes in a single `db.withTransactionAsync` block. The
  CLAUDE.md multi-statement write rule applies here in full.
- New functions in `database/sales.ts` and
  `database/credits.ts` (or a new `database/corrections.ts`):
  `voidSale(saleId, reason)`,
  `refundSale(saleId, reason)`,
  `correctSalePrice(saleId, newLineTotals, reason)`.
- New hooks in `hooks/useSales.tsx` and `hooks/useCredits.tsx`.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 3 (daily cash close-out) — voids/refunds flow through
  the cash ledger; the close-out math assumes it.
- Feature 11 (owner PIN) — voids and price corrections must be PIN-
  gated to be useful as a control.
- Feature 13 (expiry/damaged tracking) — refund reason codes
  overlap with damaged-goods reason codes. Use the same code set
  where possible.

## Open Questions

- Should the void window be configurable per owner, or hard-coded
  at 24h?
- Does a void require the cashier to be physically present with the
  cash, or just the PIN? A void that records cash-out without
  confirming the cash left the drawer could mask theft.
- How are partial refunds staged in (deferred to v2)?

## Feasibility Notes

- Inventory restoration reuses the existing
  `inventory_transactions` write path (migration v2 added the
  constraints we need). No new inventory schema.
- Money is integer-pesos end to end. Void amounts are stored as
  positive integers in the cash ledger with a `direction`, never
  as negatives.
- The audit log in `sale_corrections` is append-only; corrections
  cannot be deleted, only reversed with a new correction row.
- This is the foundation for "Stock movement timeline" (feature
  10) — once corrections exist, the timeline has something rich
  to show.
