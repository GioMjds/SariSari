# Task 5: Add a regression test for the Edit Product route

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — test code is inlined and grounded against the actual imports in `app/(tabs)/inventory/products.tsx`.

**Goal:** Pin the route behavior so a future refactor can't accidentally send "Edit Product" to the read-only `product-details` view again.

**File to create:** `tests/app/inventory/products.test.tsx` (path mirrors `app/(tabs)/inventory/products.tsx`)

**Reference for the test harness:** there is currently no `tests/app/` directory and no sibling `tests/app/inventory/*.test.tsx` to mirror. The only existing test in the repo is `tests/useStockMutations/useRecordDamaged.test.ts`, which uses a different shape (hook test, not screen render). Use the inline mocks below verbatim — they target the actual exports of `app/(tabs)/inventory/products.tsx` and the actual return shapes of `useProducts` and the store hooks.

**Mock paths (verified against the actual code):**

- `@/hooks/useProducts` returns `{ getAllProductsQuery: { data, isLoading, error, refetch }, bulkDeleteProductsMutation: { mutateAsync } }`. See `hooks/useProducts.tsx:63-304`.
- `@/components/inventory/products` exports `ProductsList`, `ProductsSkeleton`, `ProductsFilterChips`, `ProductsEmptyState`, `ProductActionMenuModal` (re-exported through `index.ts:1-6`).
- `@/components/inventory` exports `InventoryErrorState`, `BulkActionsToolbar` (`index.ts:5-9` includes `InventoryErrorState`; `BulkActionsToolbar` is in `index.ts:3`).
- `@/components/inventory/modals` exports `BulkMoveCategoryModal` (`modals/index.ts:10`).
- `@/stores` exports `useInventorySelection`, `useStockSheetSignal`, `useToastStore` (`stores/index.ts`).

**Dependencies:** [Task 4](./task-4-edit-product-route.md) (the route must be `edit-product/${id}` for the assertion to pass).

**Estimated scope:** S (one new test file).

---

## Steps

### Step 1: Create the test directory if missing

```bash
mkdir -p tests/app/inventory
```

(The `tests/` directory exists; the `app/inventory` subdirs do not.)

### Step 2: Write the test file

Create `tests/app/inventory/products.test.tsx` with this content:

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
    requestRestock: jest.fn(),
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
          onPress={() =>
            onActionPress({ id: 42, name: 'Test Product', quantity: 5 })
          }
        />
      );
    },
    ProductsSkeleton: () => null,
    ProductsFilterChips: () => null,
    ProductsEmptyState: () => null,
    ProductActionMenuModal: ({ visible, product, onEdit }: any) =>
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
    (useRouter as jest.Mock).mockReturnValue({
      push,
      setParams: jest.fn(),
    });

    render(<ProductsScreen />);

    fireEvent.press(screen.getByTestId('open-actions'));
    fireEvent.press(screen.getByTestId('menu-edit'));

    expect(push).toHaveBeenCalledWith('/(edit-forms)/edit-product/42');
  });
});
```

Notes on the mock shape:

- `useStockSheetSignal` mock also stubs `requestRestock` because `app/(tabs)/inventory/_layout.tsx` and `ProductsScreen` reference it (the per-row menu doesn't currently, but `BulkActionsToolbar`'s production code does, and stubbing it is harmless).
- `ProductsList` is exported by `components/inventory/products/ProductList.tsx:14` (despite the file's singular name) and re-exported by `components/inventory/products/index.ts:4` — so the production import `import { ProductsList } from '@/components/inventory/products'` resolves. The mock returns the same export name.
- `ProductActionMenuModal` mock renders only when both `visible` and `product` are set, mirroring the production guard at `app/(tabs)/inventory/products.tsx:215-218` (`visible={Boolean(menuProduct)}`).
- `setParams` is included on the `useRouter` mock because `app/(tabs)/inventory/products.tsx` calls `router.setParams({ q: undefined })` in `handleClearSearch` (line 92).

### Step 3: Run the test

Run: `npm test -- tests/app/inventory/products.test.tsx`
Expected: PASS. (If Task 4 has been re-applied correctly, the test passes on first run. If the route regressed to `product-details/${id}`, the assertion fails with the actual route shown — that's the regression this test is meant to catch.)

### Step 4: Run the full verify suite

Run: `npm run verify`
Expected: PASS (typecheck + all tests, including the new one).

### Step 5: Commit

```bash
git add tests/app/inventory/products.test.tsx
git commit -m "test(inventory): assert Edit Product routes to edit form"
```

---

## Acceptance criteria

- [ ] `tests/app/inventory/products.test.tsx` exists
- [ ] Test uses the inlined mocks for `expo-router`, `@/hooks/useProducts`, `@/stores`, `@/components/inventory/products`, `@/components/inventory`, and `@/components/inventory/modals`
- [ ] `ProductsList` mock exposes an `onActionPress` shim with `testID="open-actions"`
- [ ] `ProductActionMenuModal` mock renders only when visible + product is set, with `testID="menu-edit"`
- [ ] `useStockSheetSignal` mock stubs all `request*` and `clear*` methods (the production code path that eventually calls `setParams` on the router is also mocked)
- [ ] Single test asserts `push` called with `/(edit-forms)/edit-product/42`
- [ ] `npm test -- tests/app/inventory/products.test.tsx` passes
- [ ] `npm run verify` passes
- [ ] Single commit: `test(inventory): assert Edit Product routes to edit form`

## Verification

- Test passes on first run (Task 4 is already applied).
- `npm run verify` is green.
- `git log -1 --oneline` shows the expected commit.