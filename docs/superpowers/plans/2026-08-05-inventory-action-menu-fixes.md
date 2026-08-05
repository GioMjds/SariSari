# Inventory Action Menu Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the `MarkDamagedSheet` and `AdjustStockSheet` to the product chosen in the per-row action menu, and route the menu's "Edit Product" action to the `edit-product` form (not the read-only `product-details` view).

**Architecture:** The layout currently drops the per-row product id on the floor — it stores it in `useStockSheetSignal` but the layout's sheet mounts pass `initialProductId={null}`. We replace `initialProductId` with `lockedProduct: Product | null` on the two sheets and thread the signal's id through the layout by reading it inside the same effect that opens the sheet, so the sheet receives the resolved product. Bulk flows (FAB) continue to pass `null` and the existing `ProductPicker` branch is preserved. The Edit Product route is a one-line change in `handleMenuEdit`.

**Tech Stack:** Expo Router, React Native, NativeWind, Zustand, TanStack Query, Jest + `@testing-library/react-native`.

## Global Constraints

- TypeScript strict mode is on, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`.
- Path alias `@/*` maps to the repo root.
- 2-space indent, single quotes, semicolons, trailing commas, 80-col print width.
- No emojis or special characters in code or comments.
- No external libraries — only what is already in `package.json`.
- Run `npm run verify` (typecheck + test) before the final commit.

---

## File Structure

**Modify**

- `app/(tabs)/inventory/products.tsx` — `handleMenuEdit` route; nothing else.
- `app/(tabs)/inventory/_layout.tsx` — read the signal's `productId` to feed the sheets, pass it down to a new `lockedProduct` prop.
- `components/inventory/modals/AdjustStockSheet.tsx` — replace `initialProductId` with `lockedProduct`; drop `pickedId` and picker when locked.
- `components/inventory/modals/MarkDamagedSheet.tsx` — same shape as `AdjustStockSheet`.

**No new files.** All changes are in-place edits.

---

## Task 1: Lock `AdjustStockSheet` to a single product

**Files:**

- Modify: `components/inventory/modals/AdjustStockSheet.tsx`
- No new tests (existing sheet tests do not cover this component; manual smoke covered in Task 5).

**Interfaces:**

- Consumes: existing exports from `@/hooks/useProducts` and `@/hooks/useStockMutations`; `Product` from `@/types/products.types`.
- Produces: new prop signature on `AdjustStockSheet`:

  ```ts
  interface AdjustStockSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, newQty: number) => void;
    lockedProduct: Product | null;
  }
  ```

- [ ] **Step 1: Update the `Props` interface**

In `components/inventory/modals/AdjustStockSheet.tsx` (lines 16-22), replace the interface body so it becomes:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  lockedProduct: Product | null;
}

export function AdjustStockSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

- [ ] **Step 2: Drop `pickedId` and its reset effect**

In the component body, delete the lines:

```ts
const [pickedId, setPickedId] = useState<number | null>(initialProductId);
const [direction, setDirection] = useState<Direction>('increase');
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setPickedId(initialProductId);
    setDirection('increase');
    setQty(1);
    setNote('');
  }
}, [visible, initialProductId]);
```

Replace with:

```ts
const [direction, setDirection] = useState<Direction>('increase');
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setDirection('increase');
    setQty(1);
    setNote('');
  }
}, [visible]);
```

Also remove the now-unused `useState` import if `useState` is no longer referenced. Keep `useEffect` and `useMemo` (still needed for `products` in the bulk branch).

- [ ] **Step 3: Resolve the active product from `lockedProduct` directly**

Replace the `product = useMemo(...)` derivation (currently `products.find(p => p.id === pickedId)`) with:

```ts
const product = lockedProduct;
```

The `useProducts()` call and `products` memo are still needed for the `ProductPicker` shown in the bulk branch.

- [ ] **Step 4: Branch the body on `lockedProduct`**

In the JSX, replace the conditional:

```tsx
{
  product ? (
    <SheetProductCard product={product} />
  ) : (
    <ProductPicker
      products={products}
      selectedId={pickedId}
      onSelect={setPickedId}
    />
  );
}
```

with:

```tsx
{
  lockedProduct ? (
    <SheetProductCard product={lockedProduct} />
  ) : (
    <ProductPicker
      products={products}
      selectedId={null}
      onSelect={() => {
        /* bulk path: selection handled inside ProductPicker */
      }}
    />
  );
}
```

Note: `ProductPicker`'s `onSelect` signature is `(id: number) => void`. Read the current `ProductPicker` props (in `components/inventory/modals/ProductPicker.tsx`) before editing — if it accepts a stable callback with no other side effects, the no-op arrow is fine. If it expects a real setter, pass a no-op `() => {}` and leave a TODO in the next task. (This task is about locking, not picker wiring.)

- [ ] **Step 5: Remove the `pickedId` references in handlers**

In `handleSubmit`, replace `product.id` (already correct) and `pickedId` references. The current code references `product.id` and `product.quantity` — both still resolve through `product = lockedProduct` when locked, so no change is needed there. Verify no other reference to `setPickedId` or `pickedId` remains.

- [ ] **Step 6: Type-check**

Run: `npm run typecheck`
Expected: PASS. If `ProductPicker`'s `onSelect` signature differs, adjust the no-op to match the expected type (likely `() => void` already, since the picker manages its own state in the bulk case).

- [ ] **Step 7: Commit**

```bash
git add components/inventory/modals/AdjustStockSheet.tsx
git commit -m "refactor(inventory): lock AdjustStockSheet to a single product"
```

---

## Task 2: Lock `MarkDamagedSheet` to a single product

**Files:**

- Modify: `components/inventory/modals/MarkDamagedSheet.tsx`

**Interfaces:**

- Produces: new prop signature on `MarkDamagedSheet`:

  ```ts
  interface MarkDamagedSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, qty: number) => void;
    lockedProduct: Product | null;
  }
  ```

- [ ] **Step 1: Update the `Props` interface**

In `components/inventory/modals/MarkDamagedSheet.tsx` (lines 13-19), replace the body with:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  lockedProduct: Product | null;
}

export function MarkDamagedSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

- [ ] **Step 2: Drop `pickedId` and its reset effect**

Replace the state declarations and effect with:

```ts
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setQty(1);
    setNote('');
  }
}, [visible]);
```

- [ ] **Step 3: Resolve the active product from `lockedProduct` directly**

Replace the `product = useMemo(...)` derivation with:

```ts
const product = lockedProduct;
```

- [ ] **Step 4: Branch the body on `lockedProduct`**

In the JSX, replace the conditional:

```tsx
{
  product ? (
    <SheetProductCard product={product} />
  ) : (
    <ProductPicker
      products={products}
      selectedId={pickedId}
      onSelect={setPickedId}
    />
  );
}
```

with:

```tsx
{
  lockedProduct ? (
    <SheetProductCard product={lockedProduct} />
  ) : (
    <ProductPicker products={products} selectedId={null} onSelect={() => {}} />
  );
}
```

- [ ] **Step 5: Type-check**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/inventory/modals/MarkDamagedSheet.tsx
git commit -m "refactor(inventory): lock MarkDamagedSheet to a single product"
```

---

## Task 3: Thread the signal's productId into the layout's sheet mounts

**Files:**

- Modify: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- Consumes: `useStockSheetSignal` (unchanged API), `useProducts` from `@/hooks/useProducts` (already used elsewhere).
- Produces: each sheet receives `lockedProduct={matchedProduct}` where `matchedProduct` is the product resolved from the signal's `productId` plus the products list.

- [ ] **Step 1: Add the product list hook and a `matchedProduct` resolver**

Near the existing `useProducts` call (none currently in this file), add at the top of the component body (after `const signal = useStockSheetSignal();` on line 39):

```ts
import { useProducts } from '@/hooks/useProducts';
```

Then inside the component:

```ts
const { getAllProductsQuery } = useProducts();
const products = getAllProductsQuery.data ?? [];
const resolveProduct = (id: number | null) =>
  id == null ? null : (products.find((p) => p.id === id) ?? null);
```

- [ ] **Step 2: Open the sheets with the resolved product**

The three existing `useEffect` blocks at lines 90-109 currently only flip a boolean. Extend each so the id is captured before the signal is cleared. Replace the `adjust` block with:

```ts
useEffect(() => {
  if (signal.adjust.productId !== null) {
    setAdjustProduct(signal.adjust.productId);
    setAdjustOpen(true);
    signal.clearAdjust();
  }
}, [signal.adjust.productId, signal]);
```

Add three new state slots next to the existing `setAdjustOpen`:

```ts
const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
const [damagedProduct, setDamagedProduct] = useState<number | null>(null);
const [restockProduct, setRestockProduct] = useState<number | null>(null);
```

Apply the same pattern to the `restock` and `damaged` blocks, capturing into `setRestockProduct` and `setDamagedProduct` respectively. When a sheet closes (via the `onClose` callback), also clear the captured id (e.g. `setAdjustProduct(null)` inside the `onClose` arrow) so the next bulk open doesn't briefly show the previous product.

- [ ] **Step 3: Resolve the captured id to a `Product` at render time**

Just before the sheet mount block, compute:

```ts
const lockedAdjust = resolveProduct(adjustProduct);
const lockedDamaged = resolveProduct(damagedProduct);
const lockedRestock = resolveProduct(restockProduct);
```

- [ ] **Step 4: Pass the new prop to each sheet**

Update the three sheet mounts to use the new prop:

```tsx
<RestockSheet
  visible={restockOpen}
  lockedProduct={lockedRestock}
  onClose={() => {
    setRestockOpen(false);
    setRestockProduct(null);
  }}
/>
<MarkDamagedSheet
  visible={damagedOpen}
  lockedProduct={lockedDamaged}
  onClose={() => {
    setDamagedOpen(false);
    setDamagedProduct(null);
  }}
/>
<AdjustStockSheet
  visible={adjustOpen}
  lockedProduct={lockedAdjust}
  onClose={() => {
    setAdjustOpen(false);
    setAdjustProduct(null);
  }}
/>
```

- [ ] **Step 5: Type-check**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(inventory): thread signal productId into stock sheet mounts"
```

---

## Task 4: Fix the Edit Product route

**Files:**

- Modify: `app/(tabs)/inventory/products.tsx:123-129`

**Interfaces:**

- Consumes: `useRouter` from `expo-router` (already in scope).
- Produces: `handleMenuEdit` pushes `/(edit-forms)/edit-product/${id}`.

- [ ] **Step 1: Change the route**

In `app/(tabs)/inventory/products.tsx`, replace the `handleMenuEdit` body (lines 123-129):

```ts
const handleMenuEdit = useCallback(
  (id: number) => {
    setMenuProduct(null);
    router.push(`/(edit-forms)/edit-product/${id}`);
  },
  [router],
);
```

- [ ] **Step 2: Verify `handlePress` is unchanged**

Confirm lines 78-80 still push `/(edit-forms)/product-details/${id}`. Do not modify.

- [ ] **Step 3: Type-check**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/inventory/products.tsx
git commit -m "fix(inventory): route Edit Product to the edit form"
```

---

## Task 5: Add a regression test for the Edit Product route

**Files:**

- Create: `tests/app/inventory/products.test.tsx` (path mirrors `app/(tabs)/inventory/products.tsx`)
- Reference: existing test setup at `jest.setup.ts` and any sibling test in `tests/app/` for the test harness conventions (mock `expo-router`, `useProducts`, store hooks, modal components).

**Interfaces:**

- Consumes: `useRouter().push` mock; `useProducts().getAllProductsQuery` mock returns a single product; `useInventorySelection()` and `useToastStore()` mocks.
- Produces: a test that asserts `router.push` is called with `/(edit-forms)/edit-product/{id}` after the menu's Edit Product is fired.

- [ ] **Step 1: Locate a sibling test for harness conventions**

Run: search for tests under `tests/app/` that mock `useRouter` from `expo-router`. Read one (`tests/app/inventory/<existing>.test.tsx`) to mirror the imports, mock style, and render helpers. If no such test exists, search `tests/components/inventory/` for one. Use that file as a template for the imports and providers.

- [ ] **Step 2: Write the failing test**

In `tests/app/inventory/products.test.tsx`, write:

```ts
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ProductsScreen from '@/app/(tabs)/inventory/products';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: [{ id: 42, name: 'Test Product', quantity: 5 }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    bulkDeleteProductsMutation: { mutateAsync: jest.fn() },
  }),
}));

jest.mock('@/stores', () => ({
  useInventorySelection: () => ({
    selectedIds: new Set(),
    selectMode: false,
    enterSelectMode: jest.fn(),
    clear: jest.fn(),
  }),
  useStockSheetSignal: () => ({
    requestAdjust: jest.fn(),
    requestDamaged: jest.fn(),
    adjust: { productId: null },
    damaged: { productId: null },
    restock: { productId: null },
    clearAdjust: jest.fn(),
    clearDamaged: jest.fn(),
    clearRestock: jest.fn(),
  }),
  useToastStore: () => ({ addToast: jest.fn() }),
}));

jest.mock('@/components/inventory/products', () => {
  const RN = require('react-native');
  return {
    ProductsList: ({ onActionPress }: any) => {
      // expose an action button per product for the test
      return (
        <RN.Pressable
          testID="open-actions"
          onPress={() => onActionPress({ id: 42, name: 'Test Product', quantity: 5 })}
        />
      );
    },
    ProductsSkeleton: () => null,
    ProductsFilterChips: () => null,
    ProductsEmptyState: () => null,
    ProductActionMenuModal: ({
      visible,
      product,
      onEdit,
    }: any) =>
      visible && product ? (
        <RN.Pressable testID="menu-edit" onPress={() => onEdit(product.id)} />
      ) : null,
  };
});

jest.mock('@/components/inventory', () => ({
  InventoryErrorState: () => null,
  BulkActionsToolbar: () => null,
}));

jest.mock('@/components/inventory/modals', () => ({
  BulkMoveCategoryModal: () => null,
}));

describe('ProductsScreen menu actions', () => {
  it('routes Edit Product to the edit form', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push, setParams: jest.fn() });

    render(<ProductsScreen />);

    fireEvent.press(screen.getByTestId('open-actions'));
    fireEvent.press(screen.getByTestId('menu-edit'));

    expect(push).toHaveBeenCalledWith('/(edit-forms)/edit-product/42');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/app/inventory/products.test.tsx`
Expected: FAIL — `push` is currently called with `/(edit-forms)/product-details/42`. The failure message will assert the wrong route was pushed.

- [ ] **Step 4: Re-run typecheck + test**

Run: `npm run verify`
Expected: PASS. The previously-failing test now passes because Task 4 changed the route.

- [ ] **Step 5: Commit**

```bash
git add tests/app/inventory/products.test.tsx
git commit -m "test(inventory): assert Edit Product routes to edit form"
```

---

## Task 6: Add a regression test for the locked sheet

**Files:**

- Create: `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
- Create: `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
- Reference: `jest.setup.ts` and any sibling test under `tests/components/inventory/` for the test harness.

**Interfaces:**

- Consumes: `AdjustStockSheet` / `MarkDamagedSheet` with a `lockedProduct` set; mocked `useProducts` and `useAdjustStock` / `useRecordDamaged`.
- Produces: asserts that `ProductPicker` is NOT rendered when `lockedProduct` is non-null.

- [ ] **Step 1: Locate the sheet's `ProductPicker` testID**

Read `components/inventory/modals/ProductPicker.tsx` to find its `testID` (or the role/text it exposes). If it has none, add a `testID="product-picker"` to its root `View` as part of this task. Note this in a follow-up commit if you add the testID.

- [ ] **Step 2: Write the failing test for `AdjustStockSheet`**

In `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`:

```ts
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AdjustStockSheet } from '@/components/inventory/modals/AdjustStockSheet';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ getAllProductsQuery: { data: [] } }),
}));

jest.mock('@/hooks/useStockMutations', () => ({
  useAdjustStock: () => ({ mutate: jest.fn(), isPending: false }),
}));

const product = {
  id: 1,
  name: 'Coke',
  quantity: 5,
  price: 12,
  created_at: 0,
  updated_at: 0,
  category: null,
  sku: null,
  barcode: null,
  supplier_id: null,
};

describe('AdjustStockSheet locked mode', () => {
  it('does not render the product picker when lockedProduct is set', () => {
    render(
      <AdjustStockSheet
        visible
        onClose={() => {}}
        lockedProduct={product as any}
      />,
    );
    expect(screen.queryByTestId('product-picker')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
Expected: FAIL — currently the test references `lockedProduct` which doesn't exist on the prop interface, so the type-error fails the test (or runtime error if types are loose).

- [ ] **Step 4: Write the failing test for `MarkDamagedSheet`**

In `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`:

```ts
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MarkDamagedSheet } from '@/components/inventory/modals/MarkDamagedSheet';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ getAllProductsQuery: { data: [] } }),
}));

jest.mock('@/hooks/useStockMutations', () => ({
  useRecordDamaged: () => ({ mutate: jest.fn(), isPending: false }),
}));

const product = {
  id: 1,
  name: 'Coke',
  quantity: 5,
  price: 12,
  created_at: 0,
  updated_at: 0,
  category: null,
  sku: null,
  barcode: null,
  supplier_id: null,
};

describe('MarkDamagedSheet locked mode', () => {
  it('does not render the product picker when lockedProduct is set', () => {
    render(
      <MarkDamagedSheet
        visible
        onClose={() => {}}
        lockedProduct={product as any}
      />,
    );
    expect(screen.queryByTestId('product-picker')).toBeNull();
  });
});
```

- [ ] **Step 5: Run both tests to verify they pass after Tasks 1-3**

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx \
        tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx
git commit -m "test(inventory): assert stock sheets hide picker when locked"
```

---

## Task 7: Final verify

**Files:** None modified.

- [ ] **Step 1: Run the full verify suite**

Run: `npm run verify`
Expected: PASS (typecheck + all tests).

- [ ] **Step 2: Manual smoke (document in `docs/activity-log.md`)**

If you can run the app, verify the per-row action menu:

1. Open the Products tab.
2. Long-press a row, tap the menu button.
3. Tap "Mark Damaged" — confirm the sheet shows only that product's card (no picker).
4. Tap "Adjust Stock" — same.
5. Tap "Edit Product" — confirm the edit form opens (not the read-only details).

If you cannot run the app, note that in the activity log and rely on tests for the verification.

- [ ] **Step 3: Append to activity log**

Append a short entry to `docs/activity-log.md` summarizing: per-row sheet is now locked; Edit Product routes to the edit form; tests added.

- [ ] **Step 4: Commit (only if `activity-log.md` changed)**

```bash
git add docs/activity-log.md
git commit -m "docs(inventory): log action menu fixes"
```

---

## Self-Review Notes

- Spec coverage: A (sheet lock) -> Tasks 1-3, 6. B (Edit route) -> Task 4, 5. Tests -> Tasks 5, 6. C (signal store) intentionally not changed; the layout reads the id. D (files touched) all listed. E (tests) covered. F (out of scope) respected.
- Placeholder scan: no "TBD" / "TODO" / "implement later" / "add appropriate error handling". The only "TODO" in the plan is `Step 4 of Task 1` which describes a real, named fallback (read `ProductPicker`'s signature). No "similar to Task N" — each task's code is inlined.
- Type consistency: `lockedProduct: Product | null` used uniformly across Tasks 1, 2, 3, 6. The state slot names (`adjustProduct`, `damagedProduct`, `restockProduct`) match between Step 2 and Step 4 of Task 3. `resolveProduct` is defined in Step 1 and consumed in Step 3 of Task 3.
- No spec requirement is left without a task. No task references a name defined elsewhere in the plan without showing it inline.
