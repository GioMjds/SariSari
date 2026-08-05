# Inventory stock-sheets redesign

**Date:** 2026-08-05
**Status:** Draft
**Scope:** `app/(tabs)/inventory/` action menu and the three stock-mutation bottom sheets, plus the ledger filter plumbing that lets "View Ledger" jump to a per-product view.

## Background

The inventory tab today exposes stock-mutation through two purpose-built bottom sheets (`AdjustStockModal`, `ReceiveStockModal`) and a per-row action menu (`ProductActionMenuModal`) that contains Edit / Receive / Adjust / Delete. The two modals are not visually consistent with each other, and the action menu does not surface a "View Ledger" entry, a "Mark Damaged" entry, or the "current → new" preview that users have come to expect from similar product flows. A redesigned set of bottom sheets, modeled on the screenshots in this design, replaces the two existing modals and updates the action menu to match.

## Goals

- One unified visual language for the three stock-mutation bottom sheets (Restock, Mark Damaged, Adjust Stock).
- The action menu becomes the primary entry-point for per-product stock actions.
- Mark Damaged writes a first-class `inventory_transactions.type = 'damaged'` row (the schema already supports this; we add the missing hook).
- A "View Ledger" entry on the action menu jumps to the Movements tab filtered to that product.
- Existing layout-FAB and stock-tab entry points continue to work; their sheets open with no pre-selected product.

## Non-goals

- The `Edit Product` screen (`app/(edit-forms)/edit-product/[id].tsx`) is **not** touched. It is a separate surface.
- The `add-product` form, the Analytics tab, and the bulk-actions toolbar are not touched.
- No new analytics dashboard work. No new "expired" / "transferred" / "returned-to-supplier" sheet.
- No new route for a per-product ledger — we filter the existing Movements tab instead.

## Files

### New

- `components/inventory/modals/RestockSheet.tsx` — "Restock Product" sheet (screenshot 4)
- `components/inventory/modals/MarkDamagedSheet.tsx` — "Mark Damaged" sheet (screenshot 3)
- `components/inventory/modals/AdjustStockSheet.tsx` — "Adjust Stock" sheet (screenshot 2)
- `components/inventory/modals/_shared/SheetProductCard.tsx` — product name / SKU / current stock / price card
- `components/inventory/modals/_shared/QuantityStepper.tsx` — `[-] qty [+]` row with optional "CURRENT → NEW" preview
- `components/inventory/modals/_shared/SegmentedControl.tsx` — three-slot pill segmented control (used by the Adjust sheet for the Increase/Decrease toggle)
- `components/inventory/modals/_shared/sheetChrome.tsx` — small wrapper that owns the `<Modal><KeyboardAvoidingView><MotiView slide-up>` boilerplate
- `stores/useStockSheetSignal.ts` — replaces `useRestockSignal` and `useInventoryModalSignal` with one unified Zustand store
- `hooks/useStockMutations.ts` — adds `useRecordDamaged` (the file already exists; we add a new export)

### Rewritten

- `components/inventory/products/ProductActionMenuModal.tsx` — match screenshot 5: Mark Damaged / Adjust Stock / View Ledger (with hairline divider) / Edit Product / Delete Product (red, separated)
- `components/inventory/modals/index.ts` — re-export the new sheets

### Edited

- `app/(tabs)/inventory/_layout.tsx` — mount the three new sheets; wire the new store's slices into opening effects
- `app/(tabs)/inventory/products.tsx` — use the new store; pass `productId` to `requestDamaged` / `requestAdjust`; remove the `_id: number => signal.requestAdjust()` ignore
- `app/(tabs)/inventory/stock.tsx` — replace `useRestockSignal` with `useStockSheetSignal`
- `app/(tabs)/inventory/movements.tsx` — no change; the existing per-product ledger screen handles product filtering
- `components/inventory/ledger/LedgerToolbar.tsx` — no change
- `components/inventory/ledger/LedgerList.tsx` — no change

### Deleted

- `components/inventory/modals/AdjustStockModal.tsx`
- `components/inventory/modals/ReceiveStockModal.tsx`
- `stores/useInventoryModalSignal.ts` (its functionality moves into `useStockSheetSignal.ts`)
- `stores/useInventorySelection.ts` is **split**:
  - New `stores/useInventorySelection.ts` keeps only the `useInventorySelection` store (multi-select state).
  - The `useRestockSignal` definition in the current file moves into `stores/useStockSheetSignal.ts`. The original `useInventorySelection.ts` is replaced by the slimmer version.

## Data model

The existing `inventory_transactions` schema already supports all three new flows:

```sql
type TEXT NOT NULL CHECK(type IN ('restock', 'sale', 'damaged', 'adjustment'))
```

`database/inventory.ts → insertInventoryTransaction` already handles `'damaged'` (treats it as a negative quantity change) and `'restock'` (positive). No migration is needed. We add a new hook `useRecordDamaged` modeled on the existing `useReceiveStock` and `useAdjustStock` (optimistic update with rollback, single success/error toast, invalidate products + inventory keys).

## Signalling

A single Zustand store at `stores/useStockSheetSignal.ts`:

```ts
interface StockSheetSignalState {
  restock: { productId: number | null };
  damaged: { productId: number | null };
  adjust: { productId: number | null };

  requestRestock: (productId: number | null) => void;
  requestDamaged: (productId: number | null) => void;
  requestAdjust: (productId: number | null) => void;

  clearRestock: () => void;
  clearDamaged: () => void;
  clearAdjust: () => void;
}
```

`null` means "open the sheet with no product pre-selected — show the `<ProductPicker>`". A non-null id means "open the sheet pre-filled with that product — show the `<SheetProductCard>` and skip the picker".

`app/(tabs)/inventory/_layout.tsx` mounts all three sheets and runs three `useEffect` blocks that read the corresponding slice and call `setXOpen(true)` + `clearX()` on the next tick, exactly the same pattern the layout uses today.

## Sheet bodies

All three sheets share the chrome wrapper (`<Modal transparent><KeyboardAvoidingView><Pressable onPress=onClose /><MotiView slide-up>`), the `<SheetProductCard>` at the top (or `<ProductPicker>` if no product is pre-selected), the `<QuantityStepper>` in the middle, an optional `<SegmentedControl>`, an optional note input, and a Cancel + primary-action button row at the bottom.

### `<SheetProductCard product={p} />`

- Product name (bold, ink-900)
- `SKU: <code>` (ink-500, smaller)
- Two columns: `Current Stock` (number, bold) and `Price` (`<MoneyText>`)
- Background `bg-paper-50`, border `border-paper-200`, rounded `2xl`, padding `4`

### `<QuantityStepper value onChange current={p?.quantity} sign='+'|'−'|'auto' />`

- Three elements in a row, evenly spaced.
- Two circular `min-w-[44px] min-h-[44px]` `bg-paper-100` Pressables with `FontAwesome minus` and `plus` icons.
- Center is a `TextInput` with `keyboardType="number-pad"` and an underline style (border-bottom). Width auto, font-semibold.
- Below: `CURRENT: <old> → NEW: <new>` preview, in 11px ink-500, with `NEW` colored `cinnamon-700` if positive, `rose-700` if negative, `ink-700` if zero.
- If the new value would push quantity below zero, show "Can't go below zero." in rose-700 and disable the submit button.
- `min = 1` for all three sheets.

### `<SegmentedControl value onChange options={[{label,value,icon?}, ...]} />`

- Pill-shaped container `bg-paper-100 rounded-full p-1 flex-row`
- Each option is a flex-1 Pressable. Active option: `bg-paper-50 rounded-full` with shadow/elevation. Inactive: transparent.
- Used by the Adjust sheet only. The Mark Damaged sheet's screenshot shows a three-slot control (`+ Restock / – Damaged / ± Adjust`) but we agreed the segmented control is **omitted on the damaged sheet** because the sheet is locked to its entry choice. The same logic applies to the Restock sheet — no segmented control there either. **Only `AdjustStockSheet` renders a `<SegmentedControl>`** (its two-slot Increase/Decrease toggle).

### `RestockSheet`

- Header: "Restock Product", close button on the right
- `<SheetProductCard>` (or `<ProductPicker>` if no product)
- `<QuantityStepper>` with `current = product.quantity`, `sign = '+'`
- `Wholesale unit cost` text input, pre-filled from `product.cost_price`, parsed via `parsePesosInput`, integer pesos
- `Supplier` dropdown (the existing pattern from `add-product`)
- `Note (optional)` text input
- Cancel + `Restock` (persimmon-500)
- Submit calls `useReceiveStock().mutate({ productId, qty, unitCost, note })`

### `MarkDamagedSheet`

- Header: "Mark Damaged", close button
- `<SheetProductCard>` (or `<ProductPicker>` if no product)
- `<QuantityStepper>` with `current = product.quantity`, `sign = 'auto'`
- "CURRENT → NEW" preview
- "Can't go below zero." validation when new would be negative (also shown when `qty > current`)
- `Note (optional)` text input
- Cancel + `Mark damaged` (persimmon-500 when valid, paper-300 when invalid)
- Submit calls `useRecordDamaged().mutate({ productId, qty, note })`

### `AdjustStockSheet`

- Header: "Adjust Stock", close button
- `<SheetProductCard>` (or `<ProductPicker>` if no product)
- `<SegmentedControl>` with two slots: `+ Increase (+)` (default) and `− Decrease (−)`. The active value determines the sign passed to the quantity stepper.
- `<QuantityStepper>` with `current = product.quantity`, `sign = 'auto'`
- "CURRENT → NEW" preview
- "Can't go below zero." validation only when in Decrease mode and new would be negative
- `Note (optional)` text input
- Cancel + `Adjust stock` (cinnamon-500 when valid)
- Submit calls `useAdjustStock().mutate({ productId, newQty, reason: note || 'Adjustment' })`

## Action menu

The new `ProductActionMenuModal` renders (screenshot 5):

```
+----------------------------------------+
|  Corned Beef                  [ x ]    |
|  Select action to perform              |
+----------------------------------------+
|  ⊘  Mark Damaged                       |
|  ⇆  Adjust Stock                       |
|  🗒  View Ledger                        |
+----------------------------------------+
|  ✎  Edit Product                       |
+----------------------------------------+
|  🗑  Delete Product                     |  (red, on a light-pink row)
+----------------------------------------+
```

- `Mark Damaged` → `useStockSheetSignal.requestDamaged(product.id)` then `onClose`
- `Adjust Stock` → `useStockSheetSignal.requestAdjust(product.id)` then `onClose`
- `View Ledger` → `router.push('/(edit-forms)/inventory-ledger/' + product.id)` then `onClose`
- `Edit Product` → `router.push('/(edit-forms)/product-details/${id}')` then `onClose`
- `Delete Product` → existing single-row delete, `onClose`

The action menu **drops** the "Receive Stock" entry — restock is reached from the per-row `+` button on `ProductRow` (already wired today) or from the layout-FAB or from the stock-tab restock button. This matches the screenshot exactly.

## "View Ledger" filtering

A per-product ledger screen **already exists** at `app/(edit-forms)/inventory-ledger/[productId].tsx`. It reads the `productId` param, fetches the product and the last-30-day transaction list, and renders the existing `LedgerHero` + `LedgerToolbar` + `LedgerList` components. "View Ledger" from the action menu navigates there directly — no new screen, no Movements-tab filter.

1. The new `ProductActionMenuModal`'s "View Ledger" row calls `router.push('/(edit-forms)/inventory-ledger/' + product.id)`.
2. No changes to `app/(tabs)/inventory/movements.tsx`, `LedgerToolbar.tsx`, or `LedgerList.tsx`. They keep showing the global ledger.
3. `useGetInventoryTransactions` already accepts an optional `productId` filter (see `hooks/useInventory.tsx`). We do **not** use it for the new View Ledger flow; the existing per-product screen uses `useInventoryTransactionsByProduct` instead.

## Hook changes

- New: `useRecordDamaged` in `hooks/useStockMutations.ts`. Mutation shape: `{ productId: number; qty: number; note?: string }`. Optimistic update: `p.quantity -= qty`. Rollback on error. Success toast: `Marked ${qty} as damaged`. Invalidates products + inventory keys.
- Existing: `useReceiveStock` already supports `{ productId, qty, note, unitCost }` — no change.
- Existing: `useAdjustStock` already supports `{ productId, newQty, reason }` — no change.
- New: `useGetInventoryTransactions` (or the existing one) gains an optional `productId` filter. If provided, query key includes the id; queryFn calls `getInventoryTransactions(productId)`.

## Out-of-scope flows that must keep working

- Per-row `+` button on `ProductRow`: still calls `useStockSheetSignal.requestRestock(id)`.
- Layout-FAB "Receive Stock" / "Stock Adjustment" / "Mark Damaged" (newly added): each opens the matching sheet with `productId: null`. The user picks a product inside.
- Layout-FAB "Add Product" / "Scan Barcode": unchanged.
- Stock-tab per-row "restock" button: still calls `useStockSheetSignal.requestRestock(id)`.
- `BulkActionsToolbar` "Bulk adjust stock" button: continues to call `useStockSheetSignal.requestAdjust(null)` (no product, picker inside).
- `BulkMoveCategoryModal`: not touched.

## Open questions resolved during brainstorming

- FAB scope: keep the speed-dial with all four options including the newly added "Mark Damaged".
- Segmented control: locked to entry choice; "Mark Damaged" sheet does not render the three-slot control.
- Adjust sheet: dedicated `+ Increase / − Decrease` toggle, not a unified three-option sheet.
- Signal model: one unified `useStockSheetSignal` store.
- "View Ledger": route to the existing per-product ledger screen at `app/(edit-forms)/inventory-ledger/[productId].tsx`.
- Damaged transaction: new `useRecordDamaged` hook that calls `insertInventoryTransaction({ type: 'damaged', quantity: qty })`.
- Receive Stock in action menu: dropped. Per-row `+` button keeps that path.

## Testing

- `npm run typecheck` must pass.
- The existing Jest suite under `tests/` and `__tests__/` should continue to pass. The `AdjustStockModal` and `ReceiveStockModal` delete means any test that imports them by path must be updated to the new file paths. A grep confirms whether any test references the old paths.
- The optimistic-update / rollback logic for `useRecordDamaged` is a copy of the pattern in `useReceiveStock` / `useAdjustStock` and inherits the same coverage (none today, but the pattern is consistent).

## Risk

- One behavioural change: the action menu's "Adjust Stock" entry used to call `requestAdjust()` (ignoring the product id) and force the user to re-pick. After this change, the sheet opens pre-filled. Users who relied on the global behaviour now have to use the layout-FAB path.
- The "View Ledger" filter goes through the Movements tab rather than a dedicated screen. If the Movements tab's URL is shareable, the product filter is part of the URL — fine.
- The new shared `<SheetProductCard>` and `<QuantityStepper>` need to handle the no-product state (rendering a placeholder or being hidden). We render the ProductPicker in that case instead, so neither component needs to handle the empty case.
