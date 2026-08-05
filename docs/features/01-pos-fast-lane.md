# 01. POS Fast Lane

> Phase: Now

## Problem

During peak hours the cashier is racing the queue. Today's POS list
(`app/(tabs)/sales/pos.tsx` plus the `ProductSearchCatalog` component)
treats every product equally, so the most common sales — the same 8-15
items every shift — are buried in a long list behind search keystrokes.
On a small phone the cashier's eye has to travel, the thumb has to
scroll, and the suki in front of them waits. Slow checkout loses sales
and erodes trust.

## User Story

As a store owner at the register, I want the items I actually sell
every day to be one tap away, so I can ring up a typical transaction
without typing or scrolling.

## In Scope

- A "Favorites" surface on the POS screen, populated by marking
  products as favorite (long-press or star icon on the product row).
- A "Recently sold" strip driven by `sale_items` history — the most
  frequently sold products in the last 14 days.
- Common-quantity chips for each fast-lane item (e.g. 1, 2, 5, 1 dozen)
  so the cashier can add with one tap and skip the quantity step.
- Faster search: case-insensitive prefix match on name and
  `wholesale_barcode` / `barcode` with debounced input.
- Barcode scan support that lands the matched product directly in the
  cart. A scanner hardware or camera scan via `expo-barcode-scanner`
  falls into the same code path as a search hit.

## Out of Scope

- Personalized recommendations or ML-based ranking.
- Multi-register / multi-user preferences.
- Online catalog syncing — favorites stay on-device.

## Data Implications

- New columns on `products`: `is_favorite INTEGER NOT NULL DEFAULT 0`,
  `last_sold_at TEXT` (optional, derived from sales but cheap to
  materialize for the strip).
- New SQL view or function in `database/products.ts`:
  `getFastLaneProducts({ limit })` returning the union of favorites
  and top-N most-sold-in-14-days, deduped.
- New hook `useFastLaneProducts()` in `hooks/useProducts.tsx` backed by
  TanStack Query so it re-runs on cart change (to bump `last_sold_at`)
  and on favorite toggle.
- Barcode resolution already exists via `useBarcodeResolver`; this
  feature wires the resolver to the POS, not the resolution itself.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 18 (offline price-label/barcode sheets) would benefit from
  the same barcode plumbing but is not required.

## Open Questions

- Where do common quantities come from? Per-product owner-defined, or
  derived from the 25th/50th/75th percentile of past sales quantities?
- Does the fast-lane strip show even when the user is searching, or
  does searching replace it with results?
- Does a barcode scan add directly to cart, or pause for quantity
  confirmation?

## Feasibility Notes

- All data is local. No backend, no sync — matches the project's
  offline-first model.
- "Recently sold" requires reading `sale_items` aggregated by product;
  the existing `idx_sale_items_product_id` index keeps it cheap.
- Integer-pesos rule still applies for any totals surfaced in the
  fast-lane strip; favorites and quantities do not touch money.
- No new libraries required for the strip; `expo-barcode-scanner` is
  optional and can be added only if the owner has a scanner.
