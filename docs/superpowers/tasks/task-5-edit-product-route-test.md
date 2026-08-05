# Task 5: Add a regression test for the Edit Product route

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks inlined. **Sequential** after [Task 4](./task-4-edit-product-route.md) because the route must be wrong before the test can fail.

**Goal:** Pin the route behavior so a future refactor can't accidentally send "Edit Product" to the read-only `product-details` view again.

**Files:**

- Create: `tests/app/inventory/products.test.tsx` (path mirrors `app/(tabs)/inventory/products.tsx`)
- Reference: existing test setup at `jest.setup.ts` and any sibling test in `tests/app/` for the test harness conventions (mock `expo-router`, `useProducts`, store hooks, modal components).

**Interfaces:**

- Consumes: `useRouter().push` mock; `useProducts().getAllProductsQuery` mock returns a single product; `useInventorySelection()` and `useToastStore()` mocks.
- Produces: a test that asserts `router.push` is called with `/(edit-forms)/edit-product/{id}` after the menu's Edit Product is fired.

**Dependencies:** [Task 4](./task-4-edit-product-route.md) (the route change must be in place before this test can pass).

**Estimated scope:** S.

---

## Steps

### Step 1: Locate a sibling test for harness conventions

Run: search for tests under `tests/app/` that mock `useRouter` from `expo-router`. Read one (`tests/app/inventory/<existing>.test.tsx`) to mirror the imports, mock style, and render helpers. If no such test exists, search `tests/components/inventory/` for one. Use that file as a template for the imports and providers.

### Step 2: Write the failing test

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

### Step 3: Run the test to verify it fails

Run: `npm test -- tests/app/inventory/products.test.tsx`
Expected: FAIL — `push` is currently called with `/(edit-forms)/product-details/42`. The failure message will assert the wrong route was pushed.

(Note: in the plan's execution order, Task 4 is already committed, so the test will pass on first run. The "fail then pass" sequence described in the parent plan only applies if the test is written before Task 4.)

### Step 4: Re-run typecheck + test

Run: `npm run verify`
Expected: PASS.

### Step 5: Commit

```bash
git add tests/app/inventory/products.test.tsx
git commit -m "test(inventory): assert Edit Product routes to edit form"
```

---

## Acceptance criteria

- [ ] File created at `tests/app/inventory/products.test.tsx`
- [ ] Test uses the inlined mocks (expo-router, useProducts, stores, modal components)
- [ ] `ProductsList` mock exposes an `onActionPress` shim
- [ ] `ProductActionMenuModal` mock renders only when visible + product is set
- [ ] Single test asserts `push` called with `/(edit-forms)/edit-product/42`
- [ ] `npm test -- tests/app/inventory/products.test.tsx` passes
- [ ] `npm run verify` passes
- [ ] Single commit: `test(inventory): assert Edit Product routes to edit form`

## Verification

- `npm test -- tests/app/inventory/products.test.tsx` passes.
- `npm run verify` passes.
- `git log -1 --oneline` shows the expected commit.
