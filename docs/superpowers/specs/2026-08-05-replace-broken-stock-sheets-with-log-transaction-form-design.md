# Replace broken stock sheets with LogTransactionForm — design

## Problem

`AdjustStockSheet` and `MarkDamagedSheet` in `components/inventory/modals/`
are unstable — the owner reports they damage the app when opened from the
inventory products tab. The most recent merge introduced these sheets to
replace the older `AdjustStockModal` and `MarkDamagedModal`, but the
replacement is regressed.

Meanwhile `LogTransactionForm` (in `components/inventory/ledger/`) already
supports all three relevant inventory event types (`restock`, `damaged`,
`adjustment`), uses the same `useInsertInventory` mutation that the broken
sheets do, and is the proven working modal that powers the
`/(edit-forms)/inventory-ledger/[productId]` page.

The simplest, lowest-risk fix is to reuse `LogTransactionForm` everywhere
the two broken sheets were intended to be used, then delete the broken
sheets.

## Approach

Switch the per-row triple-dot menu and the FAB `Mark Damaged` / `Stock
Adjustment` actions to open `LogTransactionForm` (with optional `initialType`
locking and optional in-sheet product picker for the FAB flow). Leave
`RestockSheet` alone — the owner did not report it as broken and the FAB
`Receive Stock` action continues to use it. Leave bulk adjust (toolbar
button) alone — it does not fit a single-product form.

## API changes

### `LogTransactionForm`

Add two optional props:

```ts
interface LogTransactionFormProps {
  product?: Product | null;
  initialType?: InventoryEventType;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

- `product` is now optional. When `null`/undefined, the form renders an
  in-sheet `ProductPicker` (reused from
  `components/inventory/modals/ProductPicker`). When the user picks a
  product, local state `pickedProduct: Product | null` updates and the form
  re-renders with that product locked. `useLogTransactionForm` is then
  called with the picked product so its `product.id` reset effect runs.
- `initialType` seeds the form's `type` state. When set, the in-sheet Type
  chooser is hidden and a small static label (e.g. "Damaged") replaces it.
  For `initialType === 'adjustment'` the existing Direction toggle is
  already shown, so the only change is suppressing the chooser above it
  when `initialType` is `damaged` or `restock`.

Title and confirm-button labels already follow `form.type` via the existing
`titleMap` / `confirmLabels` records, so they automatically read
`Mark Damaged` / `Adjust stock` / `Restock Product` depending on
`initialType`.

### `useLogTransactionForm`

Add `initialType` to its options:

```ts
interface UseLogTransactionFormOptions {
  onSuccessCallback?: () => void;
  initialType?: InventoryEventType;
}
```

Default `initialType` to `'restock'` (matches existing default). The
existing `reset()` callback seeds `type` from `initialType ?? 'restock'`.
No other logic changes — the projection math, validation, and submit path
already work for all three types.

## Screen wiring

### `app/(tabs)/inventory/products.tsx`

Per-row triple-dot menu actions:

- Keep `menuProduct: Product | null`.
- Add `formProduct: Product | null` and `formType: InventoryEventType | null`.
- `handleMenuAdjustStock(id)` → resolve the product from `items` via
  `items.find(p => p.id === id) ?? null`, set `formProduct` + `formType =
'adjustment'`, then `setMenuProduct(null)`.
- `handleMenuMarkDamaged(id)` → same with `formType = 'damaged'`.
- Render `<LogTransactionForm product={formProduct} initialType={formType}
visible={formProduct !== null && formType !== null} onClose={...} />`.
- `handleMenuEdit`, `handleMenuViewLedger`, `handleMenuDelete` unchanged.

Drop the now-unused `useStockSheetSignal` import. The triple-dot menu's
`onAdjustStock` / `onMarkDamaged` callbacks currently pass `id: number`
only (not the product object), so the lookup-by-id path is required —
this matches the existing menu API.

### `app/(tabs)/inventory/_layout.tsx`

FAB actions:

- Add local state `fabForm: { visible: boolean; type: InventoryEventType }`.
- `Mark Damaged` → `fabForm = { visible: true, type: 'damaged' }`.
- `Stock Adjustment` → `fabForm = { visible: true, type: 'adjustment' }`.
- `Receive Stock` → unchanged (`signal.requestRestock(null)` opens the
  existing `RestockSheet`).
- Render `<LogTransactionForm initialType={fabForm.type}
visible={fabForm.visible} onClose={...} />` with no `product` — the
  in-sheet picker shows.

## Files touched

**Modified**

- `components/inventory/ledger/LogTransactionForm.tsx` — add `product?`
  and `initialType?` props, render picker when product missing, hide Type
  chooser when `initialType` is set.
- `components/inventory/ledger/useLogTransactionForm.ts` — accept
  `initialType` option, seed `type` from it on reset.
- `app/(tabs)/inventory/products.tsx` — wire per-row menu to
  `LogTransactionForm` with locked product + type.
- `app/(tabs)/inventory/_layout.tsx` — switch FAB Mark Damaged and Stock
  Adjustment to `LogTransactionForm` with no product (picker-driven).
- `components/inventory/modals/index.ts` — drop the two `export *` lines
  for the deleted sheets.

**Deleted**

- `components/inventory/modals/AdjustStockSheet.tsx`
- `components/inventory/modals/MarkDamagedSheet.tsx`
- `app/(tabs)/inventory/modals.tsx` (already deleted in working tree —
  keep deleted; do not reintroduce)

## Data flow

Both entry points (`LogTransactionForm` consumer screens) end up calling
the same `useInsertInventory` mutation under the hood:

```
products.tsx / _layout.tsx
  └─ LogTransactionForm
       └─ useLogTransactionForm
            └─ useInsertInventory  (TanStack mutation)
                 └─ insertInventory (database fn)
                      └─ SQLite (WAL, busy_timeout=5000)
```

The mutation already invalidates `['products']` and `['inventory']` and
toasts `'Stock updated'` on success — no toast wiring changes needed in
the screens.

## Error handling

- `useLogTransactionForm` already surfaces `insertInventory.isError` and
  triggers a shake animation on the confirm button. No new error paths
  introduced.
- When `product` is null and the user cancels the picker, the form's
  background overlay closes the sheet (existing behavior).

## Tests

- New unit test: `<LogTransactionForm product={null} visible />` renders
  the in-sheet picker without crashing.
- New unit test: `<LogTransactionForm product={fixture}
initialType='damaged' visible />` does NOT render the Type chooser.
- Existing tests that reference `AdjustStockSheet` /
  `MarkDamagedSheet` / `useStockSheetSignal.requestAdjust` /
  `requestDamaged` from the products screen are deleted.

## Out of scope

- No change to `RestockSheet`, `useStockSheetSignal` API surface (still
  used by `restock` signal and the bulk-adjust fallback), or any database
  / hook code.
- No change to `inventory-ledger/[productId].tsx` — it already uses
  `LogTransactionForm` and continues to do so.
- No change to bulk adjust toolbar, bulk delete, bulk move-category, or
  the action menu's edit / view-ledger / delete handlers.
- No change to sales / POS flows.
