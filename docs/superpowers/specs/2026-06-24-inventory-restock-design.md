# Inventory restock + new event types — design

**Date:** 2026-06-24
**Status:** Approved (brainstorming)
**Owner:** Inventory domain

## Context

The 2026-06-24 dashboard cut-over replaced the old home screen with a Dashboard tab and reduced the `/inventory` tab to a master-data catalog. The previous home screen carried the restock entry point — a per-row `+` button that opened an `InventoryActionModal` and called `insertInventoryMutation`. After the cut-over, that UI was orphaned: the components still exist (`components/inventory/InventoryRow.tsx`, `components/inventory/InventoryActionModal.tsx`), the DB and hook layer are still alive (`db/inventory.ts`, `hooks/useInventory.tsx`), but nothing in `app/` calls them.

The dashboard now exposes an "Add Stock" deep-link to `/inventory`, but `/inventory` itself has no restock action. The `app/(edit-forms)/add-product/` form still carries a stale hint that says you can leave initial stock at 0 and add stock later via Inventory — there is no such path today.

At the same time, the `inventory_transactions` CHECK constraint only allows `'restock' | 'sale'`. The owner has no way to record damage, loss, or manual count adjustments, which means stock drift accumulates without an audit trail.

This design brings restocking back into the catalog and dashboard, widens the ledger to support four event types, and lays the foundation for an audit "View ledger" view.

## Goals

1. Restore a fast, discoverable restock action on every product row in `/inventory`.
2. Allow the catalog to record `damaged` (loss) and `adjustment` (audit correction) events in addition to `restock`.
3. Let the Dashboard's low/out-of-stock alerts deep-link straight into a pre-filled restock modal.
4. Land the changes offline-first, with integer-centavos math untouched and the layering rule preserved.

## Non-goals

- Bulk restocking (multiple products in one transaction).
- Per-product `low_stock_threshold` (continues to use the global `LOW_STOCK_THRESHOLD = 5` constant).
- Photo or receipt upload for ledger events.
- Editing or deleting past ledger entries (data stays append-only).
- Server sync of `inventory_transactions` (still offline-only).

## Data model

### `inventory_transactions` schema change

```sql
-- existing
type TEXT NOT NULL CHECK(type IN ('restock', 'sale'))

-- new
type TEXT NOT NULL CHECK(type IN ('restock', 'sale', 'damaged', 'adjustment'))
note             TEXT                       -- optional free text
adjustment_sign  TEXT                       -- 'positive' | 'negative' | NULL
  -- required when type='adjustment', NULL otherwise
```

`quantity` stays an integer column that is always `> 0`. Sign is derived from `type` for `restock` / `sale` / `damaged`; for `adjustment`, the sign is recorded in `adjustment_sign`. We do not store negative quantities.

### Event-type → `products.quantity` delta

| Type | Delta | UI |
| --- | --- | --- |
| `restock` | `+ quantity` | quantity stepper, always positive |
| `sale` | `- quantity` | quantity stepper, always positive (delta is implicit) |
| `damaged` | `- quantity` | quantity stepper, always positive |
| `adjustment` | `± quantity` | quantity stepper + direction toggle |

### Migration

The `inventory_transactions` table already exists in user devices, so we need a real migration, not just an in-place `CREATE TABLE IF NOT EXISTS`. The lightest approach that fits the codebase:

1. Add a `db/migrations/` folder with `002_inventory_events.sql`.
2. Add or extend a runner that reads `PRAGMA user_version` on app start and applies pending migrations inside `db.withTransactionAsync`.
3. After the migration runs, bump `user_version` to `2`.

If a migrations runner does not exist yet, the implementation will introduce the smallest one that fits — no third-party migration tooling.

### Type updates — `types/inventory.types.ts`

```ts
export type InventoryEventType =
  | 'restock' | 'sale' | 'damaged' | 'adjustment';

export interface InventoryTransaction {
  id: number;
  product_id: number;
  type: InventoryEventType;
  quantity: number;
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
  timestamp: string;
}

export interface InsertInventoryV2 {
  product_id: number;
  type: InventoryEventType;
  quantity: number;            // > 0
  note?: string | null;
  adjustment_sign?: 'positive' | 'negative' | null;
}
```

The DB layer validates that an `adjustment` row carries an `adjustment_sign` and that all other types leave it null.

### `db/inventory.ts::insertInventoryTransaction`

Wrap the ledger `INSERT` and the `products.quantity` `UPDATE` inside `db.withTransactionAsync` so the two statements land atomically. This mirrors the guardrail that utang balances are updated inside the same transaction as their ledger rows.

## Hooks — `hooks/useInventory.tsx`

Query keys migrate to a single root and live as a factory on `inventoryKeys`:

```ts
export const inventoryKeys = {
  all: ['inventory'] as const,
  transactions: () => [...inventoryKeys.all, 'transactions'] as const,
  byProduct: (productId: number) =>
    [...inventoryKeys.all, 'transactions', productId] as const,
};
```

Hooks:

- `useInsertInventory()` — wraps `insertInventoryTransaction`. `onSuccess` invalidates `['products']`, `inventoryKeys.transactions()`, and `inventoryKeys.byProduct(input.product_id)`. Success toast: "Stock updated". Failure toast: "Couldn't update stock".
- `useInventoryTransactionsByProduct(productId)` — backed by the existing `getInventoryTransactionsByDateRange` for the last 30 days, filtered by `product_id`. Used by the new "View ledger" route.

Existing report query keys (`['inventory-transactions']`, `['inventory-transactions-by-date']`) are updated to call `inventoryKeys.transactions()` / `inventoryKeys.byProduct(...)` in the same change.

## Screen flow

### `/inventory` — `app/(tabs)/inventory/index.tsx`

The catalog shell (search, sort, Products/Categories sub-tabs, FAB) stays unchanged. Two surgical edits:

1. Replace the current row renderer inside `components/products/ProductsTab.tsx` with `components/inventory/InventoryRow.tsx`. The row already has the persimmon `+` button and an `onRestock` prop; we add a new `onMore(product)` prop for the overflow menu.
2. Mount `components/inventory/InventoryActionModal` at the screen level, controlled by local state:

```ts
type PendingAction =
  | { product: Product; type: 'restock' }
  | { product: Product; type: 'damaged' }
  | { product: Product; type: 'adjustment' };

const [pending, setPending] = useState<PendingAction | null>(null);
```

On submit the modal calls `useInsertInventory().mutate({...})`.

The existing long-press → delete modal is replaced by a bottom-sheet action sheet that contains Damage, Adjust, View ledger, and Delete. The delete action stays destructive and at the bottom of the sheet.

### Row design — `components/inventory/InventoryRow.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Lucky Me Beef Noodles                       [12]  [ + ] [ ⋯ ]
│  SKU · Snacks · ₱12.50
└──────────────────────────────────────────────────────────────┘
```

- `[12]` is a stock chip — `StatusPill` with `variant="default"` (paper-100) at ≥6, `warning` at 1–5, `danger` at 0. Text is always present ("3 left" / "Out").
- `[+]` is the persimmon restock button (already in the orphaned component).
- `[⋯]` opens the more menu.
- Long-press still works as the discoverable trigger for first-time users.

### Modal design — `components/inventory/InventoryActionModal.tsx`

The existing modal is extended to handle all four event types.

```
┌──────────────────────────────────────┐
│  Restock                             │ ← title, dynamic per type
│  Lucky Me Beef Noodles               │ ← product subtitle
├──────────────────────────────────────┤
│  TYPE                                │
│  ┌──────┬──────┬──────┬──────┐       │
│  │ +   │ −   │ −   │ ±   │       │
│  │Rstk │Sale │Dmg  │Adj  │       │
│  └──────┴──────┴──────┴──────┘       │
├──────────────────────────────────────┤
│  QUANTITY                            │
│        [-]    12    [+]              │
│                                      │
│  CURRENT: 12 → NEW: 24               │ ← tabular nums
├──────────────────────────────────────┤
│  NOTE  (optional)                    │
│  ┌──────────────────────────────┐    │
│  │ e.g. "10 from supplier A"    │    │
│  └──────────────────────────────┘    │
├──────────────────────────────────────┤
│  [Cancel]                  [Confirm] │ ← Confirm disabled until qty > 0
└──────────────────────────────────────┘
```

- When `type === 'adjustment'`, the TYPE row is replaced by a `±` direction toggle.
- Confirm label is dynamic: "Restock" / "Mark damaged" / "Adjust stock" / "Record sale".
- Sale is included in the segment for parity, but it is not exposed on the catalog row (the sales tab owns sale entry). The modal may be reused by the sales tab in the future.
- Validation: if projected `NEW < 0`, Confirm is disabled with an inline message "Can't go below zero."
- On mutation failure, the Confirm button shakes for 1 second (Moti) while the toast appears.

### Dashboard deep-link — `app/(tabs)/index.tsx`

`DashboardAlertCards` is the existing low/out-of-stock surface. The implementation wraps each row in `<Link href={\`/inventory?restock=${product.id}\`}>`.

The inventory screen reads `useLocalSearchParams().restock`. When the param is set:

1. Find the matching product.
2. Open `InventoryActionModal` with `type='restock'`.
3. Prefill quantity to `LOW_STOCK_THRESHOLD - currentQuantity` (clamped to 1 minimum).
4. After the modal closes, call `router.setParams({ restock: undefined })` so a re-tap of the same alert reopens the modal.

The param is cleared on dismiss so the URL stays clean.

### "View ledger" route — `app/(edit-forms)/inventory-ledger/[productId].tsx` (optional)

A thin placeholder list screen:

- Reads `useInventoryTransactionsByProduct(id)`.
- Renders rows in reverse chronological order with the event-type badge, signed quantity, note, and timestamp.
- Empty state uses the `InventoryManagement` sari mascot.
- No edit/delete actions — the data is append-only.

This route is the foundation for a future audit screen. **Optional deliverable** — if the user prefers to defer, drop both the route and the "View ledger" entry from the more menu in `InventoryRow`.

## UI tokens & accessibility

- All chips, modal segments, and Confirm/Cancel buttons carry `accessibilityLabel` and `accessibilityRole`.
- Stepper announces the projected total, e.g. "Quantity 12, will be 24 after restock."
- Color is never the only signal for low/out — chips always carry text.
- Reuses `StatusPill`, `MoneyText`, `ReceiptHeroDivider`, `SearchBar`, and `Skeleton` from `components/ui/`.

## File-level edit set

### New
- `db/migrations/002_inventory_events.sql` — schema migration (CHECK widening + `note` + `adjustment_sign`).
- `app/(edit-forms)/inventory-ledger/[productId].tsx` — placeholder list screen.

### Modified
- `db/inventory.ts` — `ensureInventoryTable` runs the migration; `insertInventoryTransaction` accepts `InsertInventoryV2` and is wrapped in `withTransactionAsync`.
- `types/inventory.types.ts` — `InventoryTransaction` adds `note`, `adjustment_sign`; new `InventoryEventType` union and `InsertInventoryV2`.
- `hooks/useInventory.tsx` — query keys migrate to `inventoryKeys.*`; `insertInventoryMutation` → `useInsertInventory`; new `useInventoryTransactionsByProduct`.
- `hooks/index.ts` — export new hook.
- `components/inventory/InventoryActionModal.tsx` — accept all four event types; segment picker; quantity stepper with `CURRENT → NEW`; optional note; signed adjustment toggle.
- `components/inventory/InventoryRow.tsx` — add `⋯` overflow button, `onMore` callback prop, stock chip.
- `components/products/ProductsTab.tsx` — wire `InventoryRow` in, hand `onRestock` / `onMore` to the screen.
- `app/(tabs)/inventory/index.tsx` — host the modal; consume `useLocalSearchParams().restock`; replace long-press delete with the more-menu action sheet.
- `app/(tabs)/index.tsx` — `DashboardAlertCards` rows become `<Link href="/inventory?restock={id}">`.
- `app/(edit-forms)/add-product/index.tsx` — drop or reword the stale "leave as 0 and add stock later via Inventory" hint.
- `constants/tabs.ts` — drop the stale "restock filters on home tab" comment if still present.
- `db/reports.ts`, `hooks/useReports.tsx`, `app/(tabs)/reports/index.tsx` — consume new `inventoryKeys.*` factories instead of the literal `['inventory-transactions']` key.

### Risks

- The orphaned components may not compile against the current NativeWind v4 / React 19 patterns. If they are too stale, replace rather than refactor.
- The Dashboard deep-link depends on the inventory tab being available. expo-router lazy-loads it, so the modal mounts one tick later — acceptable.
- Adding a `note` column requires a real migration. If `db/` has no migration runner, introduce the lightest one that fits.

## Verification

1. **Migration safety**
   - Fresh install: `ensureInventoryTable` creates the new shape; smoke-test by clearing app data on a simulator.
   - Upgrade: install the previous build with seeded data, install this build, confirm `PRAGMA user_version` bumps to `2` and existing rows have `note = NULL, adjustment_sign = NULL`.
2. **Transactional integrity**
   - Jest test using `better-sqlite3` that monkey-patches `runAsync` to throw on the second statement and asserts no `inventory_transactions` row was created.
3. **UI flows**
   - Cold start `/inventory`, tap `+` on a row, pick "Restock", set qty 5, submit → product quantity increases by 5; modal closes; list re-renders.
   - Long-press row → action sheet → Damage → qty 1 → submit → product quantity decreases; toast shows "Stock updated".
   - Tap a dashboard low-stock alert → modal opens at `/inventory?restock=3` with that product, qty prefilled to threshold minus current. Submit → dashboard alert disappears after the next refetch.
4. **Offline rule**
   - Toggle airplane mode on, repeat flow #3 — works without network, since this only touches SQLite via `expo-sqlite`.
5. **Lint and tests**
   - `npx expo lint` and `pnpm test` clean.