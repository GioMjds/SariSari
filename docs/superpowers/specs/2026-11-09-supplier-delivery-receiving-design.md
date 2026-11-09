# Supplier Delivery Receiving Design (Feature 8)

Date: 2026-11-09
Status: implemented (2026-11-09); implementation plan at `docs/superpowers/plans/2026-11-09-supplier-delivery-receiving.md`
Feature note: `obsidian-vault/02-Features/08-supplier-delivery-receiving.md`
Roadmap: R3, `obsidian-vault/01-Roadmap/project-roadmap.md`

## Goal

When a supplier delivery arrives, the owner records what actually came, at what cost, and what was short. Catalog stock and cost stay correct, and shortages feed a per-supplier reliability report.

## Decisions

| Topic                    | Decision                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expected quantity source | Typed from the invoice. A "Fill from reorder plan" button seeds lines from `getPalengkeRestockPlan({ supplierId })` (low and out-of-stock items for the chosen supplier, with Feature 9 suggested quantities) when any exist.                     |
| Entry unit               | Per-line toggle between retail and wholesale. Defaults to wholesale when the product has a wholesale unit. Entered values and converted retail values are both stored. |
| Cost basis               | Latest cost wins. A cost-change chip ("+PHP X vs last") shows before commit so the owner can catch typos. No weighted average.                                         |
| Unknown products         | Inline quick-add with name, retail price, and optional barcode. The product is created inside the commit transaction.                                                  |
| Drafts                   | A receipt is `draft`, `committed`, or `voided`. At most one open draft per supplier. Only commit changes stock.                                                        |
| Mistakes after commit    | Receipts are immutable. An owner-PIN-gated void reverses stock with offsetting adjustment rows. No in-place edit.                                                      |
| Write path               | Option A: receipt tables, commit through the existing restock logic, extracted so it can run inside one outer transaction.                                             |

## Scope

In scope: one supplier per delivery, header (supplier, invoice number, optional local photo URI), multi-line expected vs received, actual cost, shortage storage, shortage report, void.

Out of scope: purchase orders, multi-supplier receipts, photo upload, weighted-average cost, Feature 14 supplier-reliability tips, editing committed receipts.

## Data model

Migration: v23 (latest existing is v22 in `database/migrations.ts`).

`delivery_receipts`

- `id` INTEGER PK
- `supplier_id` TEXT NOT NULL, FK to `suppliers` (`suppliers.id` is a TEXT UUID)
- `status` TEXT NOT NULL, CHECK in (`draft`, `committed`, `voided`)
- `invoice_no` TEXT, `invoice_photo_uri` TEXT, `note` TEXT
- `received_at` TEXT, `created_at` TEXT, `committed_at` TEXT
- `voided_at` TEXT, `void_reason` TEXT
- Partial unique index on `supplier_id` where `status = 'draft'`.

`delivery_receipt_lines`

- `id` INTEGER PK
- `receipt_id` INTEGER NOT NULL, FK to `delivery_receipts`
- `product_id` INTEGER, FK to `products`. Null only for a quick-add line until commit.
- `new_product_name`, `new_product_price`, `new_product_barcode`: quick-add fields.
- `entered_unit` TEXT, CHECK in (`retail`, `wholesale`)
- `entered_expected_qty`, `entered_received_qty`, `entered_unit_cost`: as typed from the invoice.
- `expected_qty`, `received_qty`, `expected_unit_cost`, `actual_unit_cost`, `shortage_qty`: converted to retail pieces and per-piece cost.
- `conversion_factor_used`: snapshot, so later product edits do not alter history.

`inventory_transactions`: add nullable `receipt_id` with an index.

All money is integer pesos, handled through `lib/money.ts`. Per-piece cost from a wholesale entry uses integer rounding. Rounding rule: round half up to the nearest peso, applied once per line, and the entered wholesale cost is kept for audit.

Known discrepancy: `inventory_transactions.unit_cost` was added as `REAL` in `database/migrations.ts` (v7 area). Receiving writes integer pesos only. Normalize at the write boundary. Do not alter the column type in this release.

## Write path

1. Extract the body of `insertInventoryTransaction` in `database/inventory.ts` into `applyInventoryTransaction(tx)`, which does not open a transaction. The public function becomes a thin wrapper, so existing callers are unchanged. This avoids nesting `withTransactionAsync`.
2. `commitDeliveryReceipt(id)` runs one `db.withTransactionAsync`:
   - Re-read status. Throw `ReceiptNotDraftError` if not `draft`.
   - Throw `ReceiptEmptyError` if there are no lines or every line has received qty 0.
   - Create quick-add products.
   - For each line with `received_qty > 0`, call `applyInventoryTransaction` with `type = 'restock'`, `unit_cost`, `supplier_id`, `receipt_id`.
   - Set status `committed` and `committed_at`.
   - Any failure rolls back the whole transaction. A received qty of 0 writes no stock row but the line is kept for the shortage report.
3. `voidDeliveryReceipt(id, reason)` is owner-PIN gated through `useOwnerPinGuard`:
   - Reject if status is not `committed` (`ReceiptAlreadyVoidedError` or `ReceiptNotDraftError` semantics as appropriate).
   - Check each line's product stock is at least its received qty. Otherwise throw `VoidWouldGoNegativeError` carrying product names and shortfall. The UI directs the owner to a stock adjustment.
   - Write offsetting `adjustment` rows with `adjustment_sign = 'negative'` and the same `receipt_id`.
   - Set status `voided`, `voided_at`, `void_reason`.
   - `products.cost_price` is not rolled back. The next restock sets it.

Single-flight guard: `commitDeliveryReceipt` and `voidDeliveryReceipt` each keep a module-level in-flight `Set` of receipt ids, and flip status with a guarded update (`UPDATE ... SET status = ... WHERE id = ? AND status = 'draft'` for commit, `AND status = 'committed'` for void) followed by a `changes === 1` check. Reason: expo-sqlite `withTransactionAsync` is not exclusive, so an overlapping duplicate call can tear a transaction. An overlapping duplicate throws `ReceiptNotDraftError` (commit) or `ReceiptAlreadyVoidedError` (void). The UI also disables the buttons while a mutation is pending. The DB function does not check the PIN; the void gate lives in the UI through `useOwnerPinGuard`.

Known risk: the non-exclusive transaction hazard is project-wide. A POS sale that overlaps a commit would hit the same behavior. This release does not add a global write lock.

New DB functions live in `database/deliveries.ts`, not `database/suppliers.ts` as the feature note says. Reason: keeps `suppliers.ts` small. Update the feature note to match.

DB functions: `saveDeliveryDraft`, `getDeliveryReceipt`, `listDeliveryReceipts({ supplierId, status, since })`, `commitDeliveryReceipt`, `voidDeliveryReceipt`, `discardDeliveryDraft`, `getDeliveryShortageReport({ since, until })`.

## Screens and hooks

Screens:

- `app/(edit-forms)/delivery-receipts/index.tsx`: receipt list with Drafts, Received, Voided tabs. Stack route, not a fifth inventory sub-tab. Entry button on the Restock sub-tab (`app/(tabs)/inventory/recommendations.tsx`, already a sub-tab).
- `app/(edit-forms)/delivery-receipt/[id].tsx`: editor. `id = new` starts a receipt. Choosing a supplier that already has a draft resumes it.
- `app/reports/supplier-shortages.tsx`: shortage report, linked from the receiving list header.

Editor flow:

1. Pick supplier. The draft is created on first save.
2. Header: invoice number, optional photo.
3. Lines: add by search or barcode scan, reusing `ProductSearchCatalog` and `useBarcodeResolver`. "Fill from reorder plan" is shown only when plans exist for the supplier.
4. Per line: unit toggle, expected qty, received qty, unit cost, shortage chip, cost-change chip.
5. "New product" row opens the quick-add sheet.
6. Review step: total cost, total shortage value, list of cost changes, then commit.

Hooks in `hooks/useDeliveryReceipts.ts`: `useDeliveryReceipts`, `useDeliveryReceipt`, `useSaveDeliveryDraft`, `useCommitDeliveryReceipt`, `useVoidDeliveryReceipt`, `useDeliveryShortageReport`. Mutations invalidate products, inventory transactions, and reorder recommendations. Screens never call SQLite.

i18n: new `receiving` namespace in `locales/{en,tl}/`, registered in `lib/i18n.ts`.

## Shortage report

`getDeliveryShortageReport({ since, until })`, per supplier:

- receipts count, lines count, shortage qty
- shortage value in pesos: `shortage_qty * COALESCE(expected_unit_cost, actual_unit_cost)` (`products.cost_price` can be null)
- shortage rate: short lines divided by total lines, as a 0..1 fraction

`since` and `until` must be full ISO timestamps, because `committed_at` is an ISO string. A date-only `until` would exclude that whole day. Both bounds are inclusive. Suppliers with committed receipts but no shortage appear with value 0. Excludes `draft` and `voided`. Ranked by shortage value. Tapping a supplier shows its receipts and short lines as evidence.

## Errors

Named errors: `ReceiptNotDraftError`, `ReceiptEmptyError`, `DraftAlreadyExistsError`, `VoidWouldGoNegativeError`, `ReceiptAlreadyVoidedError`, `ReceiptNotCommittedError` (void of a draft), `QuickAddBarcodeExistsError`. `DraftAlreadyExistsError` is handled in the UI by resuming the existing draft.

All seven named errors have copy in both locales (the `receiving` namespace has 36 keys beyond the original set).

Validation: received qty and costs are integers at or above 0. Quick-add name must be non-empty.

Editor behavior: Save draft is refused while any line is incomplete, because the `entered_*` columns are NOT NULL. A half-counted delivery cannot be parked, and back-navigation discards unsaved lines. This is a known limitation (see the feature note).

## Testing

Tests ship with the feature. Features 5 and 6 shipped without tests and the vault records that as debt.

- `tests/database/delivery-receipts.test.ts`:
  - commit writes one restock row per received line with `receipt_id`
  - stock and `cost_price` update
  - wholesale conversion and rounding
  - zero-received line writes no stock row
  - second commit throws `ReceiptNotDraftError`
  - failure on line N rolls back lines 1 to N-1
  - quick-add product created in the same transaction
  - one draft per supplier enforced
  - void reverses stock, and is refused when stock is too low
  - shortage report excludes voided and draft
- Migration test for the new version.
- Tests live in `tests/` and `tests/database/`. The single-handle test named in `obsidian-vault/CONTEXT.md` does not exist in the repo, so it is not part of this feature.
- Mock caveat: the sqlite mock's `withTransactionAsync` rolls back with `ROLLBACK TO SAVEPOINT` but never `RELEASE`s, so the connection stays in a transaction after the first rollback in a test file and `PRAGMA foreign_keys` changes are then ignored.
- Existing inventory tests pass unchanged after the `applyInventoryTransaction` extraction.
- Component test for the line row: shortage chip, cost-change chip, unit toggle conversion.

## Release gate (from roadmap R3)

- A delivery commits each restock exactly once and updates stock and cost atomically.
- Shortages are retained against the supplier and appear in the report.
- Reorder suggestions remain correct after a delivery is received.
- Feature 9 is reachable from Inventory before release.
