---
title: ADR-005 Expiry Dates, Earliest Date Per Product
description: Tracks one optional earliest-expiry date per product, captured on delivery lines, with a store-wide warning window and per-product override, and a near-expiry list tied to the existing damaged write-off flow.
type: adr
status: accepted
tags: [adr, architecture, inventory, expiry, sqlite, offline-first]
created: 2026-11-28
---

## Status

Accepted on 2026-11-28. Resolves challenge #7 in `docs/store-owner-challenges.md`.

## Context

Owners lose money on canned goods, noodles, dairy and softdrinks that expire unsold. The products table had no expiry field, and the `near_expiry` filter in `database/products.ts` was a misnamed wholesale-unit filter. Dates are printed on each item, so the owner can read them while restocking.

## Decision

1. **One earliest-expiry date per product, no batches.** `products.expiry_date` (TEXT, `YYYY-MM-DD`, nullable) and `products.expiry_warn_days` (INTEGER, nullable override). Migration v29 also adds `delivery_receipt_lines.expiry_date`. Batch quantities would force every sale to deplete the oldest batch, which is heavier than owners need.
2. **Captured once per delivery line.** `commitDeliveryReceipt` sets the product date inside the commit transaction. The earliest date wins: a later delivery never pushes the date out. Once old stock is gone the owner edits the date on the product form.
3. **Store-wide window in Settings** (`app_settings.near_expiry_days`, default 7, no owner PIN), with the per-product override taking priority. The SQL filter and `getStatus` use the same rule, so list and counts agree.
4. **Expired stock still on the shelf counts as near expiry** until it is written off.
5. **No new write-off flow.** Expired and returned-to-supplier reuse the damaged transaction. `applyInventoryTransaction` now snapshots `products.cost_price` into `unit_cost` for damaged rows, so loss is `SUM(quantity * unit_cost)` and survives later cost changes. Reasons stay in the note text, as before.
6. **Sell first is a list and a flag.** No automatic markdown or price change.

## Consequences

- The Inventory near-expiry alert and filter now work, show days left on each product row, and show cost at risk plus 30-day write-off cost.
- The near-expiry list stays in name order, because the products list uses name cursor paging. Days left is shown on each row.
- Voiding a delivery receipt does not roll the product expiry date back.
- Returned-to-supplier items count in the write-off cost, even if the supplier refunds them.

## Deferred

- Soonest-first ordering of the near-expiry list.
- Batch or lot quantities and oldest-first depletion.
- Default shelf-life guesses by category.
- Push reminders and automatic markdown.
