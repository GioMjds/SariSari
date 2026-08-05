# 09. Offline Reorder Suggestions

> Phase: Next

## Problem

Restocking is a memory exercise. The owner walks the shelf, eyeballs
what's low, and tries to remember what sold well this week. Often
they forget, or they over-order the slow movers and under-order the
fast ones. They get back from the supplier with a receipt (if feature
8 exists) showing shortages on the items they were sure would be
plenty.

## User Story

As a store owner planning a supplier run, I want a shopping list
grouped by supplier and sized to my target stock levels, so I can
walk into the supplier and walk out with the right quantities.

## In Scope

- A "Reorder suggestions" view, generated entirely on-device, that
  lists products that are:
  - At or below their target stock level (per-product, configurable
    in `products`).
  - Trending down in sales velocity (last 14 days vs. previous 14
    days).
- The list is grouped by supplier so the owner can place a single
  order per supplier, or visit them in a planned order.
- Suggested quantity = `target_stock - current_stock + buffer`, where
  `buffer` accounts for the lead time of that supplier if known.
- The owner always confirms before any catalog or inventory change.
  No automatic ordering.
- A "Mark as ordered" toggle per line that does not yet commit a
  delivery (the delivery receiving flow in feature 8 is the
  committing action).

## Out of Scope

- Predictive demand forecasting (the "trending down" signal is a
  simple velocity diff, not a model).
- Auto-submitted orders to the supplier. This is a one-tap "show me
  what to buy" surface, nothing more.
- Cross-store benchmarking (single store only).

## Data Implications

- New columns on `products`: `target_stock_level` INTEGER (nullable
  — null means "do not suggest for reorder"), `reorder_buffer_qty`
  INTEGER.
- New table `reorder_suggestions` (optional, for audit of what was
  shown): `id`, `generated_at`, `supplier_id`, `product_id`,
  `current_qty`, `suggested_qty`, `reason` ('below_target' |
  'velocity_drop' | 'manual_pin'), `status` ('open' | 'ordered' |
  'dismissed').
- New SQL view or function in `database/stock-intelligence.ts`
  (which already exists): `getReorderSuggestions({ lookbackDays })`
  returning the ranked list. The existing module already computes
  velocity-style signals, so the heavy lifting may already be in
  place — verify before adding new SQL.
- New hook in `hooks/useStockIntelligence.tsx`.
- New migration bumping `user_version` past 9 (only if the new
  product columns are not already there — check `products` first).

## Dependencies

- Feature 8 (supplier delivery receiving) — without it, the
  reorder list is generated but the "what actually arrived"
  feedback loop is missing.
- Feature 14 (local store insights) shares the velocity signal
  source.

## Open Questions

- What is the default `target_stock_level` for existing products?
  Null is safest, but a one-time "best guess" based on the
  product's max stock ever observed is friendlier.
- Should the suggestion also factor in upcoming events (payday,
  weekend) the owner has flagged? YAGNI for the first cut.
- How often is the list regenerated? On every app open is fine for
  small catalogs; for very large catalogs, debounce.

## Feasibility Notes

- All data is local; the offline-first model is a perfect fit.
- Money: reorder math is in integer quantities, not money. No
  money parsing needed.
- The "owner always confirms" rule is a hard product policy, not
  a code caveat. The UI should make that explicit, not just
  default to it.
- This is one of the highest-leverage features in the roadmap for
  store profitability, but also the one most likely to overreach.
  Resist the temptation to add auto-reorder, predictive
  forecasting, or "smart" bundling in v1.
