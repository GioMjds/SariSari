# Price History and Margin Alert Design

- Date: 2026-11-13
- Status: implemented
- Vault note: `obsidian-vault/02-Features/price-history-and-margin-alert.md`

## Intent

When a supplier raises the cost of a product and the selling price stays the same, the store's margin shrinks without the owner noticing. This feature records every cost and selling-price change per product and tells the owner which products need repricing, with a suggested price. The owner always confirms; the app never changes a selling price on its own.

Success means: after committing a delivery whose costs rose, the owner sees the affected products immediately, can reprice each in one tap, and can come back later to any product they skipped.

## Background

This is the first of five planned money-flow features. Context found while planning:

- The expense log already exists as the financial ledger (`database/financial.ts`, `financial_entries`).
- The daily cash close-out is legacy; the savings-goal and capital-versus-profit ideas depend on a pending decision about it and are out of scope here.
- Supplier payables will get its own spec.

Cost reaches `products.cost_price` through two write paths today:

1. `applyInventoryTransaction` in `database/inventory.ts`, on a `restock` with a `unit_cost` (used by delivery commit).
2. `updateProduct` in `database/products.ts` (manual edit).

Selling price (`products.price`) changes only through `updateProduct`. The schema is at `user_version = 23`.

## Decisions

| Question                     | Decision                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Where does the alert appear? | In a review sheet right after delivery commit, and in a persistent needs-repricing list.                         |
| What flags a product?        | Its unit cost rose and its selling price is unchanged. No threshold setting.                                     |
| What price is suggested?     | The price that keeps the same markup percent, rounded up to a whole peso.                                        |
| How is history stored?       | A dedicated table written by application code inside the caller's transaction. Not derived, not SQLite triggers. |

## Scope

In scope:

- History of retail cost and retail selling-price changes per product.
- Reprice flags with a suggested price.
- Review sheet after delivery commit.
- Needs-repricing list with a count badge on the More tab.
- Recent history card on the product details screen.

Out of scope for this version:

- Wholesale cost and wholesale price.
- Alerts on cost decreases. Decreases are recorded in history only.
- Rolling back cost or flags when a delivery is voided. This matches the existing rule that `cost_price` is not rolled back on void.
- Backfilling history from data that predates migration 24.
- Any new owner PIN gate. Repricing uses whatever gate product price edits use today.

## Data model

Migration 24 adds two tables. All money values are integer pesos.

### `product_price_changes`

| Column       | Type                              | Notes                                           |
| ------------ | --------------------------------- | ----------------------------------------------- |
| `id`         | INTEGER PRIMARY KEY AUTOINCREMENT |                                                 |
| `product_id` | INTEGER NOT NULL                  | References `products(id)` ON DELETE CASCADE     |
| `field`      | TEXT NOT NULL                     | CHECK in (`cost`, `price`)                      |
| `old_value`  | INTEGER                           | NULL when the product had no previous value     |
| `new_value`  | INTEGER NOT NULL                  |                                                 |
| `source`     | TEXT NOT NULL                     | CHECK in (`delivery`, `restock`, `manual_edit`, `reprice`) |
| `receipt_id` | INTEGER                           | Delivery receipt that caused the change, if any |
| `created_at` | TEXT NOT NULL                     | ISO timestamp                                   |

Index: `(product_id, created_at)`.

A row is written only when `old_value` differs from `new_value`.

### `reprice_flags`

| Column          | Type                | Notes                                                           |
| --------------- | ------------------- | --------------------------------------------------------------- |
| `product_id`    | INTEGER PRIMARY KEY | References `products(id)` ON DELETE CASCADE                     |
| `baseline_cost` | INTEGER NOT NULL    | Cost in effect when the current selling price was last accepted |
| `new_cost`      | INTEGER NOT NULL    | Latest cost                                                     |
| `price_at_flag` | INTEGER NOT NULL    | Selling price when the flag was created                         |
| `receipt_id`    | INTEGER             | Most recent delivery receipt that raised the cost, if any       |
| `created_at`    | TEXT NOT NULL       | ISO timestamp                                                   |

At most one flag per product.

### Flag rules

Evaluated whenever cost changes, with `oldCost`, `newCost`, and the current selling price:

1. `oldCost` is NULL (first cost ever recorded): no flag.
2. No existing flag and `newCost > oldCost`: create a flag with `baseline_cost = oldCost`, `new_cost = newCost`, `price_at_flag = current price`.
3. Existing flag and `newCost > baseline_cost`: keep `baseline_cost` and `price_at_flag`, update `new_cost` and `receipt_id`. The suggestion stays anchored to the margin the owner last accepted.
4. Existing flag and `newCost <= baseline_cost`: delete the flag.
5. No existing flag and `newCost <= oldCost`: no flag.

A flag is also deleted when:

- The selling price changes by any path (manual edit or reprice).
- The owner taps "Keep price".
- The product is deleted (cascade).

If a single manual edit changes both cost and price, the price change wins and no flag remains. If a manual edit clears the cost to empty, no cost history row is written and any flag is removed.

### Suggested price

```
suggested = ceil(new_cost * price_at_flag / baseline_cost)
```

If `baseline_cost <= 0`, there is no suggestion; the row shows costs only and the owner types a price.

## Code units

### `lib/repricing.ts` (new, pure)

- `suggestPrice(baselineCost, newCost, priceAtFlag): Pesos | null`
- `markupPercent(cost, price): number | null`

No database access. Fully unit-testable.

### `database/priceHistory.ts` (new)

- `recordPriceChange(productId, field, oldValue, newValue, source, receiptId?)` inserts a history row when values differ.
- `evaluateRepriceFlag(productId, oldCost, newCost, currentPrice, receiptId?)` applies the flag rules.
- `clearRepriceFlag(productId)` deletes a flag if present.
- `getRepriceFlags()` returns all flags joined with product name and current price.
- `getRepriceFlagsForReceipt(receiptId)` returns the flags last touched by one receipt.
- `getPriceHistory(productId, limit)` returns recent changes, newest first.
- `dismissRepriceFlag(productId)` implements "Keep price".
- `applyReprice(productId, newPrice)` updates `products.price`, records a `reprice` history row, and deletes the flag in one `db.withTransactionAsync`.

`recordPriceChange`, `evaluateRepriceFlag`, and `clearRepriceFlag` do not open their own transaction. They run inside the caller's transaction so history, flags, and the product update commit or roll back together.

All functions use the single SQLite handle from `configs/sqlite.ts`.

### Changes to existing write paths

- `database/inventory.ts`, `applyInventoryTransaction`: on a `restock` with a `unit_cost`, read the previous `cost_price` and current `price` before the update, then call `recordPriceChange` (`field = 'cost'`, `source = 'delivery'` when the transaction carries a receipt id, `source = 'restock'` otherwise) and `evaluateRepriceFlag`, passing the receipt id when present.
- `database/products.ts`, `updateProduct`: compare previous and new `cost_price` and `price`. Record each change with `source = 'manual_edit'`. Evaluate the flag on a cost change. Clear the flag on a price change.
- `database/migrations.ts`: migration 24 creates both tables and the index, then sets `user_version = 24`.

### `hooks/usePriceHistory.ts` (new)

- Queries: `useRepriceFlags`, `useRepriceFlagsForReceipt(receiptId)`, `usePriceHistory(productId)`.
- Mutations: `useApplyReprice`, `useDismissRepriceFlag`.
- Mutations invalidate product, reprice-flag, price-history, and report query keys.
- The delivery-commit and product-update mutations also invalidate reprice-flag and price-history keys.

Screens never touch SQLite; they use these hooks only.

## Screens

### Review sheet after delivery commit

In `app/(edit-forms)/delivery-receipt/[id].tsx`. After a successful commit, if `getRepriceFlagsForReceipt` returns rows, a sheet opens listing them. Each row shows:

- Product name
- Old cost and new cost
- Old markup percent and new markup percent
- Suggested price in an editable field

Row actions: "Update price" and "Keep price". A sheet-level "Later" closes the sheet and leaves remaining flags in place. If there are no flags, the commit flow is unchanged.

### Needs-repricing list

New screen `app/settings/reprice.tsx`, reached from `app/(tabs)/more/index.tsx` through an entry with a count badge. It reuses the same row component as the sheet. It shows an empty state when there are no flags.

### Product history

A card on the Overview tab of the product details screen (`app/(edit-forms)/product-details/[id].tsx`) showing the last 10 cost and price changes with date and source. It is hidden when the product has no recorded changes.

### Shared component

`components/pricing/RepriceRow.tsx` is used by both the sheet and the list.

### Localization

New i18n namespace `pricing`, with strings in every existing locale. The More-tab row strings live in the `common` namespace, matching the other More rows.

## Error handling

- A failure writing history or a flag inside delivery commit rolls back the whole commit. There is never a committed delivery with missing history.
- A price below the new cost is allowed. The row shows a selling-at-a-loss warning; the owner decides.
- An invalid or empty price in the editable field disables "Update price". Parsing goes through `parsePesosInput` in `lib/money.ts`.
- Deleting a flagged product removes its flag and history through cascade.

## Testing

Following the existing pattern in `tests/database/` and `tests/helpers/deliveryFixtures.ts`:

- `tests/lib/repricing.test.ts`: same-markup math, rounding up, zero or negative baseline, markup percent with missing cost.
- `tests/database/price-history-migration.test.ts`: both tables and the index exist at version 24; migrating from 23 keeps existing data.
- `tests/database/price-history.test.ts`:
  - A history row is written only when the value changes.
  - The first recorded cost never flags.
  - A cost rise with unchanged price creates a flag.
  - A second rise keeps `baseline_cost` and `price_at_flag`.
  - A cost drop to the baseline or below deletes the flag.
  - A manual price edit deletes the flag.
  - `dismissRepriceFlag` deletes the flag and leaves the price unchanged.
  - `applyReprice` updates price, writes history, and deletes the flag atomically.
- Extend `tests/database/delivery-commit.test.ts`:
  - Commit creates flags tied to the receipt id.
  - A failed commit leaves no history rows and no flags.
- Extend the product update tests for `manual_edit` history rows.

## Related work

- `obsidian-vault/02-Features/08-supplier-delivery-receiving.md`: source of cost changes.
- `obsidian-vault/02-Features/14-transparent-local-store-insights.md`: its planned margin-change signal can read `product_price_changes` once this ships.
