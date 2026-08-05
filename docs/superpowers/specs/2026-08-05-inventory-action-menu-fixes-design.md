# Inventory action menu fixes — design

## Problem

Two UX bugs in `app/(tabs)/inventory/products.tsx`, surfaced via the per-row
`ProductActionMenuModal`:

1. **"Mark Damaged" and "Adjust Stock" show a product picker instead of the
   selected product.** Both `MarkDamagedSheet` and `AdjustStockSheet` accept
   `initialProductId: number | null` and, depending on whether the lookup
   resolves, render either a fixed `SheetProductCard` or a `ProductPicker`
   listing every product. From a per-row action menu the user has already
   chosen the product — the picker is wrong context and re-prompting them is
   a step backward.
2. **"Edit Product" routes to the read-only product details screen
   (`/(edit-forms)/product-details/[id]`) instead of the edit form
   (`/(edit-forms)/edit-product/[id]`).** The two screens are distinct;
   the menu's "Edit Product" must go to the edit form.

## Approach

### A. Lock the stock sheets to a single product

Replace `initialProductId: number | null` with `lockedProduct: Product | null`
on both `AdjustStockSheet` and `MarkDamagedSheet`.

- `lockedProduct !== null` (per-row menu path): render `SheetProductCard`
  directly. No `ProductPicker`, no `pickedId` state, no `useEffect` reset,
  no `products` query needed inside the sheet.
- `lockedProduct === null` (bulk path): existing picker behavior is kept
  unchanged.

Prop signature:

```ts
interface AdjustStockSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  lockedProduct: Product | null; // replaces initialProductId
}

interface MarkDamagedSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  lockedProduct: Product | null; // replaces initialProductId
}
```

Internal state changes:

- Drop `pickedId` state when `lockedProduct` is set.
- Drop the `useEffect` that resets `pickedId` on `visible` / `initialProductId`.
- Keep the `useProducts` call only for the `null` branch (bulk picker).
- The `ProductPicker` is rendered only when `lockedProduct === null`.

### B. Fix the Edit Product route

In `app/(tabs)/inventory/products.tsx`, change `handleMenuEdit` to push the
edit form:

```ts
const handleMenuEdit = useCallback(
  (id: number) => {
    setMenuProduct(null);
    router.push(`/(edit-forms)/edit-product/${id}`);
  },
  [router],
);
```

The row-tap `handlePress` (which currently pushes
`/(edit-forms)/product-details/${id}`) is unchanged — that route is the
intended read-only view for a normal row tap.

### C. Threading the product through the signal store

`useStockSheetSignal` already exposes `requestAdjust(id | null)` and
`requestDamaged(id | null)`. The screen-level handlers have the
`Product` object from `menuProduct` and can resolve the id locally —
the store API does not need to change. The menu handlers become:

```ts
const handleMenuAdjustStock = useCallback(
  (id: number) => {
    setMenuProduct(null);
    signal.requestAdjust(id);
  },
  [signal],
);
```

The host screen (e.g. `InventorySpeedDialFab` or a future container) reads
`menuProduct` and passes it as `lockedProduct` to the sheet. Concretely,
the screen will store `lockedProduct: Product | null` and pass it through.

### D. Files touched

- `app/(tabs)/inventory/products.tsx` — fix `handleMenuEdit` route; pass
  `lockedProduct` to the sheet host.
- `components/inventory/modals/AdjustStockSheet.tsx` — switch to
  `lockedProduct` prop; drop picker and `pickedId` state when locked.
- `components/inventory/modals/MarkDamagedSheet.tsx` — same.
- `components/inventory/InventorySpeedDialFab.tsx` — pass
  `lockedProduct={null}` for bulk actions.
- `app/(tabs)/inventory/stock.tsx` — confirm bulk path still passes
  `null` (no behavior change expected).

No DB / hook / migration changes.

### E. Tests

- New: when `handleMenuEdit` fires, `router.push` is called with
  `/(edit-forms)/edit-product/{id}` (mock `expo-router`).
- New: when `lockedProduct` is non-null, neither
  `AdjustStockSheet` nor `MarkDamagedSheet` renders `ProductPicker`.
- Existing sheet tests that pass `initialProductId` are updated to pass
  `lockedProduct`.

### F. Out of scope

- No new "Change product" affordance inside the locked card.
- No animation, copy, color, or haptics changes.
- No new sheet variants.
- `useStockSheetSignal` API surface is preserved.
