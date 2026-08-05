# 10. Stock Movement Timeline

> Phase: Next

## Problem

The owner looks at a product, sees that the quantity on hand is X, and
asks "why isn't it Y?" Today the answer is hidden. They can scroll
through `inventory_transactions` if they know SQL, but no surface
exists to walk the human through the trail. When a discrepancy
surfaces during a stocktake (feature 4) or a restock, the owner has no
quick way to trace it back to the event that caused it.

## User Story

As a store owner looking at a product, I want to see a simple
timeline of every quantity change — what happened, when, and why — so
I can answer "why is this number what it is?" without leaving the app.

## In Scope

- A per-product timeline screen, reachable from any product row,
  listing every `inventory_transactions` row for that product,
  newest first.
- Each timeline entry shows: timestamp, event type (sale, restock,
  damaged, adjustment, void reversal from feature 7), quantity
  delta, and the human-readable reason / note.
- A short period summary at the top: net change in the last 7 and
  30 days, broken down by event type.
- A "Linked sale" affordance on entries that come from a sale or a
  void, opening the existing sale detail screen.
- Filter by event type (e.g. "show me only adjustments") for
  debugging a specific concern.

## Out of Scope

- Editing or deleting timeline entries. The timeline is read-only
  and append-only.
- A global timeline across all products. Per-product is enough for
  v1.
- Predictive or projected future quantity.

## Data Implications

- No new tables. `inventory_transactions` is already the source of
  truth (migration v2 added `note` and `adjustment_sign`).
- New function in `database/inventory.ts`:
  `getProductTimeline(productId, { from, to, eventType })`
  returning rows enriched with the linked sale/void details.
- New hook in `hooks/useInventory.tsx`.
- No migration needed for the data layer. UI only.
- The reason text on each entry should be human-readable; some
  normalization may be needed in the SQL so that `note` values
  from the various writers (stocktake, void, manual adjustment)
  read consistently on the timeline.

## Dependencies

- Feature 4 (physical stocktake) populates the timeline with
  adjustment rows.
- Feature 7 (safe voids/refunds) populates the timeline with
  reversal rows.
- Feature 13 (expiry/damaged tracking) populates damaged rows.
- The timeline is most useful once all three populate it; the
  first cut can ship with whatever already writes to
  `inventory_transactions` (restock, sale, manual adjustment).

## Open Questions

- Pagination: a busy product can have hundreds of timeline entries
  in a year. The timeline should paginate, probably cursor-based
  to match the POS pagination plan.
- Grouping: do we collapse identical events happening back-to-back
  (e.g. three sales of the same product in two minutes) into one
  row, or keep them as discrete entries? Recommend keeping them
  discrete for audit; show a "+N more" chip if the page is full.

## Feasibility Notes

- Read-only, single-table query; the existing
  `idx_inventory_transactions` (if present) or the primary key
  range scan is enough. The migration v4 performance indexes did
  not include this table — adding one is a small follow-up if
  the timeline proves slow on a real catalog.
- Money is not on the timeline; only quantity and reason.
- This is a low-cost, high-trust feature: it does not introduce
  any new state, only reveals what is already there.
