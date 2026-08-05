# 04. Physical Stocktake

> Phase: Now

## Problem

The catalog quantity drifts away from what's actually on the shelf.
Shrinkage happens: shoplifting, spoilage that wasn't logged, free
"paminsu" to neighbors, a child helping themselves, counting errors
at restock, or a sale that didn't go through cleanly. Without a
guided, periodic count, the owner discovers the discrepancy only when
they open a box of something and find it empty — too late to
reconcile against a specific event.

## User Story

As a store owner, I want a guided, category-by-category count of what
is physically on my shelf, compared to what the catalog says I should
have, so I can record the variance and explain each gap.

## In Scope

- A "Stocktake" mode that walks the owner through products grouped by
  category (existing `categories` table).
- A counted-quantity input per product with quick-quantity chips
  (the same bulk unit, dozen, etc. as the product supports).
- A variance summary at the end: per-category and per-product
  expected vs. counted, with the delta and the implied money impact
  using `cost_price`.
- A reason-coded adjustment flow on the variance summary: each
  variance line gets a reason (shrinkage, spoilage, miscount, free
  to neighbor, return) and writes through the existing
  `inventory_transactions` table as a `type = 'adjustment'` row.
- The mode locks the rest of the app from logging conflicting
  changes during the count (a banner is enough; full lockout is
  not required for an offline single-device app).

## Out of Scope

- Continuous cycle counting automation (this is a manual, periodic
  exercise).
- Multi-device collaboration on a single count.
- Barcode-driven scanning during the count (the owner can already
  use `expo-barcode-scanner` from feature 1; this feature is
  keyboard/numeric input only).

## Data Implications

- New table `stocktake_sessions`: `id`, `started_at`, `ended_at`,
  `status` ('in_progress' | 'completed' | 'abandoned'), `note` TEXT.
- New table `stocktake_counts`: `id`, `session_id` (FK), `product_id`
  (FK), `expected_qty` INTEGER, `counted_qty` INTEGER, `reason_code`
  TEXT, `note` TEXT, `committed_at` TEXT (null while in progress).
- On commit, each committed count row produces a single
  `inventory_transactions` insert (`type = 'adjustment'`,
  `adjustment_sign` matches the variance direction, `note` carries
  the reason). Done inside a single `withTransactionAsync` block so
  partial commits cannot desync catalog quantity from the audit
  trail.
- New functions in `database/inventory.ts`:
  `startStocktakeSession()`,
  `upsertStocktakeCount({ sessionId, productId, countedQty })`,
  `listStocktakeVariance(sessionId)`,
  `commitStocktake(sessionId, reasonPerLine)`.
- New hook in `hooks/useInventory.tsx`.
- New migration bumping `user_version` past 9.

## Dependencies

- None — independent. Reason codes overlap with feature 13
  (expiry/damaged tracking) but the stocktake reason code is
  separate from the goods-tracking reason code.

## Open Questions

- What is the default cadence? Weekly? Monthly? Configurable per
  owner, or simply "on demand" with a soft prompt after N days
  since the last stocktake?
- Do reason codes carry a `cost_price` snapshot at stocktake time,
  or do they use the live `cost_price`? Snapshotting is safer if a
  restock lands between count and commit.
- Can a stocktake be paused and resumed across app restarts?
  (Recommended yes; the table schema already supports it.)

## Feasibility Notes

- Existing `inventory_transactions` already accepts
  `type = 'adjustment'` rows with a `note`, and the migration to v2
  added the `adjustment_sign` constraint — so the audit trail is
  ready. This feature mainly adds the workflow on top.
- Money: variance impact uses `cost_price` from `products` or
  `inventory_transactions.unit_cost`. Both are integer-pesos. The
  computed money figure is display-only, never stored as money
  again.
- Performance: for catalogs in the low thousands of products, a
  single `SELECT … GROUP BY category` is enough; no need to add
  pagination. If counts grow, the stocktake screen can paginate by
  category.
