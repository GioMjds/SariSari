# 13. Expiry and Damaged-Goods Tracking

> Phase: Later

## Problem

A significant share of a sari-sari store's inventory is perishable
or fragile: canned goods, sachets, bread, dairy, detergent that
absorbs humidity, biscuits. Most of it never gets near an expiry
label check. Spoilage and damage are recorded inconsistently if at
all, so the loss is invisible — a couple of pesos a day, every day,
adds up to a meaningful drag on margin. Owners know the loss is
there; they cannot point to a number for it.

## User Story

As a store owner, I want to track expiry dates on the perishable
products that matter, and log damaged goods with a reason, so I can
see what's lost, why, and how to reduce it.

## In Scope

- An opt-in `perishable` flag and optional `expiry_date` on
  `products` (only for products the owner marks; do not force the
  field on every item).
- A near-expiry view (configurable threshold, default 14 days)
  surfacing products approaching expiry, sorted by date, with the
  affected quantity and a quick "discounted" or "write-off" action.
- A damaged-goods log: when the owner marks a quantity as damaged
  on a product, a row is written to `inventory_transactions` with
  `type = 'damaged'`, a `reason_code` ('expired' | 'physical' |
  'pest' | 'moisture' | 'other'), and a free-text note.
- A "Damaged goods" report aggregating losses (in quantity and in
  `cost_price` money impact) by reason and by period.
- A write-off action that combines near-expiry + damaged into a
  single recorded loss with the same audit trail.

## Out of Scope

- Auto-expiry notifications. The single-device, no-backend model
  means the owner is expected to look at the list.
- Batch-level expiry tracking (a single batch of canned goods
  delivered on a particular date). Per-product expiry is enough
  for v1; batch tracking is a follow-up.
- Predictive spoilage modeling. The feature surfaces what is
  already losing money, not what will.

## Data Implications

- New columns on `products`: `perishable` INTEGER NOT NULL DEFAULT
  0, `expiry_date` TEXT (nullable ISO date).
- The existing `inventory_transactions` table already supports
  `type = 'damaged'` (migration v2). Add a `reason_code` column if
  not already there.
- New table `damaged_goods_log`: `id`, `product_id` (FK),
  `reason_code` TEXT, `note` TEXT, `quantity` INTEGER,
  `cost_price_snapshot` INTEGER (snapshot at write time so the
  report is stable across restocks), `created_at` TEXT.
- New functions in `database/inventory.ts`:
  `getNearExpiry({ withinDays })`,
  `logDamagedGoods({ productId, quantity, reasonCode, note })`,
  `getDamagedGoodsReport({ from, to, groupBy })`.
- New hook in `hooks/useInventory.tsx`.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 7 (voids/refunds) — a damaged return may also be a
  refund; the reason code set should be shared.
- Feature 4 (physical stocktake) — stocktake can produce damaged
  rows using the same reason code vocabulary.

## Open Questions

- How is the "near expiry" window configured per owner? Per
  product, per owner, or both?
- Is `cost_price_snapshot` redundant with `inventory_transactions.
  unit_cost`? The latter is per-transaction; if a damaged write
  always has a corresponding inventory transaction, the snapshot
  is denormalized. Decide based on query performance.
- Does the "write-off" action need PIN gating (feature 11) since
  it removes value from inventory?

## Feasibility Notes

- The data model is light. The hardest part is the UI: keeping
  the per-product expiry field optional, not making every product
  look perishable.
- Money impact is display-only; cost is stored as integer pesos
  in `cost_price_snapshot` (or sourced from
  `inventory_transactions.unit_cost`).
- Reporting can be done with the existing TanStack Query +
  aggregator pattern, no new external libraries.
