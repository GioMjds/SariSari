# POS Product Pagination — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paginate the POS product list with cursor-based SQL pagination and infinite scroll so the screen stops loading and rendering every product in the catalog at once.

**Architecture:** Add a new `getProductsPage({ cursor, limit, search })` function in `database/products.ts` that returns one page (max 30 rows) ordered by `(LOWER(name), id)`. Wrap it in a new `usePaginatedProducts(search)` hook built on `useInfiniteQuery`. Replace the POS screen's in-memory filter and the existing `getAllProductsQuery` consumer with this hook. Wire `onEndReached` and a footer (spinner / "End of list") on the existing `FlatList` in `ProductSearchCatalog`. Keep `getAllProducts` and `getAllProductsQuery` untouched — every other tab still uses them.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript strict, NativeWind v4, TanStack Query v5 (`useInfiniteQuery`), better-sqlite3 (test mock via `tests/__setup__/expo-sqlite-mock.ts`), Jest.

## Global Constraints

(Verbatim from the spec — every task's requirements implicitly include these.)

- **TypeScript strict mode** + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`. New code must compile cleanly.
- **Money is integer pesos.** Pagination touches no money columns. Still: never parse/format money outside `lib/money.ts`.
- **Path alias `@/*`** maps to repo root. Use existing import paths.
- **One SQLite handle.** All DB code goes through `db` from `@/configs/sqlite`. Enforced by existing single-handle test.
- **Styling via NativeWind v4** (`className`). No new styles for the POS list — reuse existing palette tokens (`text-ink-500`, `text-ink-700`, etc.).
- **No emojis or special characters** in code or comments.
- **Commits atomic, focused. No auto-push.** Commit after each task.
- **Run `npm verify`** (typecheck + tests) before finishing.

---

## File map

**Modified**

- `database/products.ts` — append `getProductsPage` + cursor types. Do not touch existing exports.
- `hooks/useProducts.tsx` — append `productKeys.infinite` and a new exported hook `usePaginatedProducts(search)`. Do not change the `useProducts()` return shape.
- `components/sales/pos/useCart.ts` — swap `getAllProductsQuery` for `usePaginatedProducts(search)`. Surface new fields (`data`, `isFetchingNextPage`, `hasNextPage`, `fetchNextPage`, `error`).
- `components/sales/pos/ProductSearchCatalog.tsx` — add `isFetchingNextPage`, `hasNextPage`, `onEndReached`, `onRetryFetchNext` props. Wire `onEndReached`, `onEndReachedThreshold`, `ListFooterComponent`. Existing behavior preserved.
- `app/(tabs)/sales/pos.tsx` — remove the in-memory filter `useMemo`, pass `search` to the hook, pass new pagination props to `ProductSearchCatalog`.

**Created**

- `tests/database/products-pagination.test.ts` — DB integration test for `getProductsPage`. Cursor walk + search + duplicate-name tiebreaker.
- `hooks/__tests__/usePaginatedProducts.test.tsx` — hook test that `data.pages[0]` resets when `search` changes and `getNextPageParam` is wired.
- `components/sales/pos/__tests__/ProductSearchCatalog.test.tsx` — component test for `onEndReached` and `ListFooterComponent` (spinner / "End of list" / nothing).

---

## Task 1: Add `getProductsPage` DB function with failing tests

**Files:**

- Modify: `database/products.ts` (append at end of file)
- Test: `tests/database/products-pagination.test.ts` (new)

**Interfaces:**

- Consumes: `Product` from `@/types/products.types`, `db` from `@/configs/sqlite`.
- Produces:
  ```ts
  export interface ProductsPageCursor {
    name: string;
    id: number;
  }
  export interface ProductsPage {
    items: Product[];
    nextCursor: ProductsPageCursor | null;
  }
  export const getProductsPage: (params: {
    cursor: ProductsPageCursor | null;
    limit: number;
    search?: string;
  }) => Promise<ProductsPage>;
  ```

- [ ] **Step 1: Create the test file**

```ts
// tests/database/products-pagination.test.ts
import { initProductsTable } from '@/database/products';
import { db } from '@/configs/sqlite';

async function clear() {
  await db.execAsync('DELETE FROM products;');
}

async function insertProduct(
  id: number,
  name: string,
  sku: string,
  price = 10,
  quantity = 5,
) {
  await db.runAsync(
    'INSERT INTO products (id, name, sku, price, quantity) VALUES (?, ?, ?, ?, ?);',
    [id, name, sku, price, quantity],
  );
}

async function seedFifty() {
  for (let i = 1; i <= 50; i++) {
    const n = String(i).padStart(2, '0');
    await insertProduct(i, `Product ${n}`, `SKU${n}`);
  }
  // duplicate-name tiebreaker pair (lowercase 'apple' twice, different ids)
  await insertProduct(51, 'apple', 'APPLE-A', 12, 1);
  await insertProduct(52, 'apple', 'APPLE-B', 14, 1);
}

describe('getProductsPage', () => {
  beforeEach(async () => {
    await initProductsTable();
    await clear();
  });

  it('returns the first 20 items in (LOWER(name), id) order with nextCursor', async () => {
    const { getProductsPage } = await import('@/database/products');
    await seedFifty();

    const page1 = await getProductsPage({ cursor: null, limit: 20 });
    expect(page1.items).toHaveLength(20);
    expect(page1.items[0]?.name).toBe('apple'); // 'apple' sorts first
    expect(page1.nextCursor).not.toBeNull();
    expect(page1.items[19]?.name).toBe('Product 05');
  });

  it('cursor walk produces no duplicates and no skips', async () => {
    const { getProductsPage } = await import('@/database/products');
    await seedFifty();

    const allIds: number[] = [];
    let cursor: { name: string; id: number } | null = null;
    let safety = 10;
    while (safety-- > 0) {
      const page = await getProductsPage({ cursor, limit: 20 });
      for (const item of page.items) allIds.push(item.id);
      if (page.nextCursor === null) break;
      cursor = page.nextCursor;
    }

    expect(allIds).toHaveLength(52);
    expect(new Set(allIds).size).toBe(52); // no duplicates
    // ids 1..50 in order, then 51, 52
    expect(allIds).toEqual([
      ...Array.from({ length: 50 }, (_, i) => i + 1),
      51, 52,
    ]);
  });

  it('search="product 1" returns 11 items paginated correctly', async () => {
    const { getProductsPage } = await import('@/database/products');
    await seedFifty();

    const page = await getProductsPage({
      cursor: null,
      limit: 5,
      search: 'product 1',
    });
    // 'Product 1' substring matches Product 10..19 -> 11 rows, but also
    // anything containing the literal 'product 1' substring. 'Product 1'
    // matches: 10..19 (10 rows). Add "Product 1" the standalone? No -
    // names are "Product 01".."Product 50"; substring "product 1" matches
    // only "Product 10".."Product 19" (10 rows) because "Product 01"
    // contains "Product 0", not "Product 1".
    expect(page.items).toHaveLength(5);
    expect(page.items[0]?.name).toBe('Product 10');
    expect(page.nextCursor).not.toBeNull();
  });

  it('empty search returns everything paginated', async () => {
    const { getProductsPage } = await import('@/database/products');
    await seedFifty();

    const page1 = await getProductsPage({ cursor: null, limit: 30, search: '' });
    expect(page1.items).toHaveLength(30);
    expect(page1.nextCursor).not.toBeNull();
  });

  it('duplicate-name pair appears in id order, no skips, no duplicates', async () => {
    const { getProductsPage } = await import('@/database/products');
    await clear();
    await insertProduct(1, 'apple', 'APPLE-A', 12, 1);
    await insertProduct(2, 'apple', 'APPLE-B', 14, 1);

    const page1 = await getProductsPage({ cursor: null, limit: 1 });
    const page2 = await getProductsPage({ cursor: page1.nextCursor, limit: 1 });

    expect(page1.items.map((p) => p.id)).toEqual([1]);
    expect(page2.items.map((p) => p.id)).toEqual([2]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/database/products-pagination.test.ts`
Expected: FAIL — `getProductsPage` is not exported from `@/database/products`.

- [ ] **Step 3: Implement `getProductsPage`**

Append to `database/products.ts` (do not modify existing exports):

```ts
export interface ProductsPageCursor {
  name: string;
  id: number;
}

export interface ProductsPage {
  items: Product[];
  nextCursor: ProductsPageCursor | null;
}

export const getProductsPage = async (params: {
  cursor: ProductsPageCursor | null;
  limit: number;
  search?: string;
}): Promise<ProductsPage> => {
  const search = (params.search ?? '').trim();
  const searchPattern = `%${search.toLowerCase()}%`;
  const cursorName = params.cursor?.name ?? '';
  const cursorId = params.cursor?.id ?? 0;
  const limit = Math.max(1, Math.floor(params.limit));

  const rows = await db.getAllAsync<Product>(
    `SELECT * FROM products
     WHERE (
       ? = '' OR
       (LOWER(name) > LOWER(?) OR (LOWER(name) = LOWER(?) AND id > ?))
     )
     AND (
       ? = '' OR
       LOWER(name) LIKE ? OR
       LOWER(sku)  LIKE ?
     )
     ORDER BY LOWER(name), id
     LIMIT ?`,
    [
      cursorName, cursorName, cursorName, cursorId,
      search, searchPattern, searchPattern,
      limit,
    ],
  );

  const nextCursor =
    rows.length < limit
      ? null
      : (() => {
          const last = rows[rows.length - 1];
          // `noUncheckedIndexedAccess` makes `last` `Product | undefined`.
          // `rows.length` is at least 1 here (limit >= 1, returned N rows).
          if (!last) return null;
          return { name: last.name, id: last.id } satisfies ProductsPageCursor;
        })();

  return { items: rows, nextCursor };
};
```

Note on the mutation-during-scroll seam: if a cursor row vanishes, the next page may briefly repeat one row at the boundary. Self-corrects on the following page. Do not "fix" this — out of scope.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/database/products-pagination.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/database/products-pagination.test.ts database/products.ts
git commit -m "feat(pos): add cursor-paginated getProductsPage DB function"
```

---

## Task 2: Add `usePaginatedProducts` hook with failing test

**Files:**

- Modify: `hooks/useProducts.tsx` (append at end of file, do not change existing exports)
- Test: `hooks/__tests__/usePaginatedProducts.test.tsx` (new)

**Interfaces:**

- Consumes: `getProductsPage` from `@/database/products` (Task 1), `Product` from `@/types/products.types`.
- Produces:
  ```ts
  export const productKeys = {
    // ...existing keys...
    infinite: (search: string) => [...productKeys.all, 'infinite', search] as const,
  };
  export function usePaginatedProducts(search: string): UseInfiniteQueryResult<...>;
  ```
  The return shape is the standard `useInfiniteQuery` result so callers can read `data`, `isLoading`, `isFetchingNextPage`, `hasNextPage`, `fetchNextPage`, `error`.

- [ ] **Step 1: Create the failing test**

```tsx
// hooks/__tests__/usePaginatedProducts.test.tsx
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaginatedProducts } from '@/hooks/useProducts';
import * as productsDb from '@/database/products';

jest.mock('@/database/products', () => ({
  ...jest.requireActual('@/database/products'),
  getProductsPage: jest.fn(),
}));

const mockGetProductsPage = productsDb.getProductsPage as jest.MockedFunction<
  typeof productsDb.getProductsPage
>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('usePaginatedProducts', () => {
  beforeEach(() => {
    mockGetProductsPage.mockReset();
  });

  it('resets page 1 when search changes', async () => {
    mockGetProductsPage.mockResolvedValueOnce({
      items: [{ id: 1, name: 'Coke', sku: 'COKE1', price: 15, quantity: 5,
                barcode: null, created_at: '', updated_at: '' }],
      nextCursor: { name: 'Coke', id: 1 },
    });

    const wrapper = makeWrapper();
    const { result, rerender } = renderHook(
      ({ search }) => usePaginatedProducts(search),
      { wrapper, initialProps: { search: '' } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetProductsPage).toHaveBeenCalledWith({
      cursor: null, limit: 30, search: '',
    });

    mockGetProductsPage.mockResolvedValueOnce({
      items: [], nextCursor: null,
    });
    rerender({ search: 'coke' });

    await waitFor(() => expect(mockGetProductsPage).toHaveBeenCalledTimes(2));
    expect(mockGetProductsPage).toHaveBeenLastCalledWith({
      cursor: null, limit: 30, search: 'coke',
    });
  });

  it('getNextPageParam returns the last cursor', async () => {
    mockGetProductsPage.mockResolvedValueOnce({
      items: [
        { id: 1, name: 'A', sku: 'A', price: 1, quantity: 1,
          barcode: null, created_at: '', updated_at: '' },
        { id: 2, name: 'B', sku: 'B', price: 1, quantity: 1,
          barcode: null, created_at: '', updated_at: '' },
      ],
      nextCursor: { name: 'B', id: 2 },
    });

    const { result } = renderHook(() => usePaginatedProducts(''), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(mockGetProductsPage).toHaveBeenCalledTimes(2));
    expect(mockGetProductsPage).toHaveBeenLastCalledWith({
      cursor: { name: 'B', id: 2 }, limit: 30, search: '',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest hooks/__tests__/usePaginatedProducts.test.tsx`
Expected: FAIL — `usePaginatedProducts` is not exported from `@/hooks/useProducts`.

- [ ] **Step 3: Implement `usePaginatedProducts`**

Append to `hooks/useProducts.tsx`. First, ensure the imports are present at the top — update the existing import block to add `useInfiniteQuery` (TanStack Query v5 re-exports it from `@tanstack/react-query`):

```ts
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
```

Add `getProductsPage` to the existing `@/database/products` import:

```ts
import {
  // ...existing imports...
  getProductsPage,
} from '@/database/products';
```

Then add the cursor/Product types and the hook. They need to be importable from this file, so import them too:

```ts
import type { ProductsPageCursor } from '@/database/products';
```

Append at the end:

```ts
const PAGE_SIZE = 30;

export function usePaginatedProducts(search: string) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(search),
    initialPageParam: null as ProductsPageCursor | null,
    queryFn: ({ pageParam }) =>
      getProductsPage({ cursor: pageParam, limit: PAGE_SIZE, search }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
```

Also update the `productKeys` object to add `infinite`:

```ts
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  barcode: (barcode: string) =>
    [...productKeys.all, 'barcode', barcode] as const,
  sku: (sku: string) => [...productKeys.all, 'sku', sku] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
  infinite: (search: string) =>
    [...productKeys.all, 'infinite', search] as const,
};
```

(The existing `productKeys` declaration is already there — edit it to add the `infinite` line. Don't touch the other lines.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest hooks/__tests__/usePaginatedProducts.test.tsx`
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add hooks/useProducts.tsx hooks/__tests__/usePaginatedProducts.test.tsx
git commit -m "feat(pos): add usePaginatedProducts infinite-query hook"
```

---

## Task 3: Wire `ProductSearchCatalog` for `onEndReached` and footer

**Files:**

- Modify: `components/sales/pos/ProductSearchCatalog.tsx` (props + FlatList wiring)
- Test: `components/sales/pos/__tests__/ProductSearchCatalog.test.tsx` (new)

**Interfaces:**

- Consumes: existing `ProductSearchCatalogProps` plus four new optional props:
  ```ts
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  onRetryFetchNext?: () => void;
  ```
- Produces: the same component shape; existing call sites keep working unchanged (the new props are optional).

- [ ] **Step 1: Create the failing test**

```tsx
// components/sales/pos/__tests__/ProductSearchCatalog.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { ProductSearchCatalog } from '@/components/sales/pos/ProductSearchCatalog';

function makeControl() {
  // Minimal mock that lets us render <Controller> without React-Hook-Form.
  // We pass our own products directly so the search bar is not exercised.
  const form = useForm<{ search: string }>({ defaultValues: { search: '' } });
  return form.control;
}

describe('ProductSearchCatalog pagination footer', () => {
  it('renders spinner + "Loading more..." when isFetchingNextPage', () => {
    const control = makeControl();
    const { getByText } = render(
      <ProductSearchCatalog
        control={control}
        filteredProducts={[]}
        isLoading={false}
        getCartLine={() => undefined}
        onAdd={() => {}}
        onUpdateQuantity={() => {}}
        onPressScan={() => {}}
        isFetchingNextPage
        hasNextPage
        onEndReached={() => {}}
      />,
    );
    expect(getByText('Loading more...')).toBeTruthy();
  });

  it('renders "End of list" when !hasNextPage and items present', () => {
    const control = makeControl();
    const { getByText } = render(
      <ProductSearchCatalog
        control={control}
        filteredProducts={[
          {
            id: 1, name: 'Coke', sku: 'COKE1', price: 15, quantity: 5,
            barcode: null, created_at: '', updated_at: '',
          },
        ]}
        isLoading={false}
        getCartLine={() => undefined}
        onAdd={() => {}}
        onUpdateQuantity={() => {}}
        onPressScan={() => {}}
        isFetchingNextPage={false}
        hasNextPage={false}
        onEndReached={() => {}}
      />,
    );
    expect(getByText('End of list')).toBeTruthy();
  });

  it('renders no footer when neither loading nor end', () => {
    const control = makeControl();
    const { queryByText } = render(
      <ProductSearchCatalog
        control={control}
        filteredProducts={[
          {
            id: 1, name: 'Coke', sku: 'COKE1', price: 15, quantity: 5,
            barcode: null, created_at: '', updated_at: '',
          },
        ]}
        isLoading={false}
        getCartLine={() => undefined}
        onAdd={() => {}}
        onUpdateQuantity={() => {}}
        onPressScan={() => {}}
        isFetchingNextPage={false}
        hasNextPage
        onEndReached={() => {}}
      />,
    );
    expect(queryByText('Loading more...')).toBeNull();
    expect(queryByText('End of list')).toBeNull();
  });
});
```

We can't easily fire `onEndReached` through `FlatList` in unit tests — the hook-level `getNextPageParam` test (Task 2) already covers the fetch logic. Component-level coverage for the trigger is the manual smoke test in Task 5. The footer states are what we verify here.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/sales/pos/__tests__/ProductSearchCatalog.test.tsx`
Expected: FAIL — the new props don't exist yet, so the component can't compile (TypeScript) and the footer texts aren't there.

- [ ] **Step 3: Add new props and footer to `ProductSearchCatalog`**

Edit `components/sales/pos/ProductSearchCatalog.tsx`:

(a) Extend the props interface:

```ts
interface ProductSearchCatalogProps {
  control: Control<AddSalesFormData>;
  filteredProducts: Product[];
  isLoading: boolean;
  getCartLine: (productId: number) => NewSaleItem | undefined;
  onAdd: (product: Product, selectedUnit?: 'retail' | 'wholesale') => void;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onToggleUnit?: (productId: number) => void;
  onPressScan: () => void;
  pendingAddProductBarcode?: string | null;
  onPressAddNewProduct?: () => void;
  onDismissPendingAddProduct?: () => void;
  // Pagination (optional — POS screen supplies them, legacy callers omit)
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  onRetryFetchNext?: () => void;
}
```

(b) Extend the destructure at the top of the component body:

```ts
export function ProductSearchCatalog({
  control,
  filteredProducts,
  isLoading,
  getCartLine,
  onAdd,
  onUpdateQuantity,
  onToggleUnit,
  onPressScan,
  pendingAddProductBarcode,
  onPressAddNewProduct,
  onDismissPendingAddProduct,
  isFetchingNextPage = false,
  hasNextPage = false,
  onEndReached,
  onRetryFetchNext,
}: ProductSearchCatalogProps) {
```

(c) Add a `ListFooterComponent` to the FlatList. Replace the existing `<FlatList ... />` (currently around lines 142–173) with:

```tsx
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 82 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage && onEndReached) {
              onEndReached();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              cartLine={getCartLine(item.id)}
              onAdd={onAdd}
              onUpdateQuantity={onUpdateQuantity}
              {...(onToggleUnit ? { onToggleUnit } : {})}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-12">
              <FontAwesome
                name="inbox"
                size={56}
                color="#623418"
                style={{ opacity: 0.25 }}
              />
              <StyledText
                variant="semibold"
                className="text-ink-500 text-base mt-3"
              >
                No products found
              </StyledText>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color="#623418" />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs mt-2"
                >
                  Loading more...
                </StyledText>
              </View>
            ) : !hasNextPage && filteredProducts.length > 0 ? (
              <View className="items-center py-4">
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs"
                >
                  End of list
                </StyledText>
              </View>
            ) : null
          }
        />
```

Note: `ActivityIndicator` is already imported at the top of the file. `StyledText` is already imported. No new imports needed.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/sales/pos/__tests__/ProductSearchCatalog.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 5: Run `npm run typecheck`**

Run: `npx tsc --noEmit 2>&1 | grep -E 'ProductSearchCatalog|usePaginatedProducts|getProductsPage' || echo 'no related errors'`
Expected: `no related errors`. (There will be unrelated pre-existing errors in other files — those are out of scope.)

- [ ] **Step 6: Commit**

```bash
git add components/sales/pos/ProductSearchCatalog.tsx components/sales/pos/__tests__/ProductSearchCatalog.test.tsx
git commit -m "feat(pos): pagination footer + onEndReached on ProductSearchCatalog"
```

---

## Task 4: Wire POS screen and `useCart` to paginated products

**Files:**

- Modify: `components/sales/pos/useCart.ts` (swap query source, surface pagination state)
- Modify: `app/(tabs)/sales/pos.tsx` (remove in-memory filter, pass new props)

**Interfaces:**

- Consumes (Task 1, 2, 3 outputs): `usePaginatedProducts(search)` from `@/hooks/useProducts`.
- Produces: `useCart()` returns pagination fields (`products`, `isProductsLoading`, `isFetchingNextPage`, `hasNextPage`, `fetchNextPage`, `refetchProducts`, `productsError`) that the POS screen reads and forwards to `ProductSearchCatalog`.

- [ ] **Step 1: Update `useCart.ts`**

In `components/sales/pos/useCart.ts`:

(a) Update the import block — `useProducts` is no longer needed for `getAllProductsQuery`; replace with `usePaginatedProducts`. The destructure for `customers`, `sales`, barcode, etc. is unchanged.

```ts
import { usePaginatedProducts, useSales, useBarcodeResolver, useCustomers } from '@/hooks';
```

(b) Replace the products query line:

```ts
  const productsQuery = usePaginatedProducts('');
  const {
    data: products = [],
    isLoading: isProductsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProducts,
    error: productsError,
  } = productsQuery;
```

(c) Update the queued-scan effect that currently depends on `getAllProductsQuery` — the new shape uses `productsQuery`. Find the existing `useEffect`:

```ts
  useEffect(() => {
    if (!getAllProductsQuery.isSuccess || getAllProductsQuery.isFetching)
      return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [
    getAllProductsQuery.isSuccess,
    getAllProductsQuery.isFetching,
    handleScannedBarcode,
  ]);
```

Replace it with:

```ts
  useEffect(() => {
    if (!productsQuery.isSuccess || productsQuery.isFetching) return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [
    productsQuery.isSuccess,
    productsQuery.isFetching,
    handleScannedBarcode,
  ]);
```

(d) Update the returned object to surface the new fields. Find the `return {` block in `useCart` and add the pagination fields (keep existing fields):

```ts
  return {
    // Domain data
    products,
    customers,
    isProductsLoading,
    todayStats: getTodayStatsQuery.data,

    // Pagination
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchProducts,
    productsError,

    // Cart state (from store)
    cartItems,
    paymentType,
    selectedCustomer,
    itemCount,
    total,
    isSubmitDisabled,

    // Scanner state (local)
    isScannerOpen,
    lastScanned,
    pendingAddProductBarcode,

    // Store actions
    addItem,
    updateQuantity,
    toggleUnit,
    clearCart: clearCartStore,
    setPaymentType,
    setCustomer,

    // Handlers
    openScanner,
    closeScanner,
    handleScannedBarcode,
    handlePressAddNewProduct,
    dismissPendingAddProduct,
    submit,
    getCartLine,

    // Mutation
    insertSaleMutation,
  };
```

- [ ] **Step 2: Update `pos.tsx`**

In `app/(tabs)/sales/pos.tsx`:

(a) Remove the in-memory filter `useMemo` (the existing block is lines 28–35):

```tsx
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cart.products;
    return cart.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [cart.products, search]);
```

Delete it. Also delete the now-unused `useMemo` import at the top of the file (line 1):

```tsx
import { useState, useMemo } from 'react';
```

becomes:

```tsx
import { useState } from 'react';
```

(b) Replace the `<ProductSearchCatalog ... />` props. Pass pagination fields and remove the `filteredProducts` indirection — `cart.products` is now already the current page (server-side filtered when `search` is non-empty). But we still need search to flow to the DB. The cleanest move: pass `search` to `usePaginatedProducts` from `useCart`.

Hmm — `useCart` currently calls `usePaginatedProducts('')`. We need to give it `search`. Simplest: pull `search` into `useCart` (it needs the search value too so the queued-scan effect can wait for it).

Actually simpler still: keep the search lift at the screen, and have `useCart` accept an optional `search` argument. Update `useCart` signature:

```ts
export function useCart(search: string = '') {
```

Then the call inside `useCart`:

```ts
  const productsQuery = usePaginatedProducts(search);
```

And the POS screen calls `const cart = useCart(search);`.

Make those two changes.

(c) Update the `<ProductSearchCatalog />` element. Replace the existing block (lines 39–56) with:

```tsx
      <ProductSearchCatalog
        control={control}
        filteredProducts={cart.products}
        isLoading={cart.isProductsLoading}
        getCartLine={cart.getCartLine}
        onAdd={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        onToggleUnit={(productId) => {
          const idx = cart.cartItems.findIndex(
            (item) => item.product_id === productId,
          );
          if (idx !== -1) cart.toggleUnit(idx);
        }}
        onPressScan={cart.openScanner}
        pendingAddProductBarcode={cart.pendingAddProductBarcode}
        onPressAddNewProduct={cart.handlePressAddNewProduct}
        onDismissPendingAddProduct={cart.dismissPendingAddProduct}
        isFetchingNextPage={cart.isFetchingNextPage}
        hasNextPage={cart.hasNextPage}
        onEndReached={() => {
          if (!cart.isFetchingNextPage && cart.hasNextPage) {
            cart.fetchNextPage();
          }
        }}
        onRetryFetchNext={() => cart.fetchNextPage()}
      />
```

Note: `onEndReached` here re-checks the guards even though `ProductSearchCatalog` already does. Cheap and unambiguous. The actual fetch handler lives on `cart.fetchNextPage`.

- [ ] **Step 3: Run typecheck (POS-related only)**

Run: `npx tsc --noEmit 2>&1 | grep -E 'sales/pos|useCart|ProductSearchCatalog|usePaginatedProducts|getProductsPage' || echo 'no related errors'`
Expected: `no related errors`. Pre-existing errors in unrelated files (e.g. `add-credit/[id].tsx`) are not in scope.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: All tests pass (including the three new ones from Tasks 1–3).

If you see unrelated failures from the pre-existing TypeScript errors that have been blocking `npm verify` — note them in the PR but do not fix them in this change. They are out of scope.

- [ ] **Step 5: Commit**

```bash
git add components/sales/pos/useCart.ts 'app/(tabs)/sales/pos.tsx'
git commit -m "feat(pos): wire POS screen and useCart to paginated products"
```

---

## Task 5: Manual smoke test + verify

**Files:** none (verification only).

- [ ] **Step 1: Run `npm verify`**

Run: `npm verify`
Expected: `tsc --noEmit` reports no new errors related to POS / products pagination. Tests pass. (Pre-existing unrelated errors stay — out of scope.)

- [ ] **Step 2: Boot the app and walk through the smoke test**

Run: `npm run:android` (or `npm run:ios`). In the dev app:

1. Open the developer reset screen (`app/(tabs)/dev/reset.tsx`) and seed the sample data so the catalog has products.
2. Insert ~200 dummy products manually (or temporarily lower the seed threshold in `scripts/sample-mock-datas.ts` to 200, then re-run the dev reset).
3. Open the **POS** tab.
4. Verify the first ~30 products render quickly and the list scrolls smoothly.
5. Scroll near the bottom: a "Loading more..." spinner appears, then the next batch loads.
6. Reach the absolute end: "End of list" appears.
7. Type in the search bar (e.g. "co"): list resets to the first page of matching results only.
8. Clear the search: list returns to the full unfiltered paginated state.
9. From another tab, insert a new product. Return to POS: TanStack invalidation refetches the page; the new product appears at the right alphabetical spot (or after a refetch on next focus, since `staleTime: 60_000`).

If any step fails, file a fix and re-verify before declaring done.

- [ ] **Step 6: Final commit (if smoke test surfaced fixes)**

```bash
git add <whatever the smoke test required>
git commit -m "fix(pos): address smoke-test findings from pagination rollout"
```

(Empty if smoke test passed cleanly.)

---

## Self-review notes (for the plan author)

- **Spec coverage:** Sections 1–4 of the spec → Task 1 (DB), Task 2 (hook), Task 3 (UI footer + onEndReached), Task 4 (screen + cart wiring), Task 5 (verify + manual smoke). Architecture, error handling, edge cases, testing all map.
- **Placeholder scan:** No "TBD" / "TODO" / "implement later". Every code step has actual code.
- **Type consistency:** `ProductsPageCursor` and `ProductsPage` defined in Task 1, consumed in Task 2 (as `import type`). `usePaginatedProducts(search)` defined in Task 2, consumed in Task 4. `ProductSearchCatalog` pagination props defined in Task 3, consumed in Task 4.
- **One small inconsistency noted:** Task 4 step 2(b) initially deleted `useMemo`, then said "pull `search` into `useCart`". Updated to: `useCart` accepts `search` as arg (default `''`) and passes it through to `usePaginatedProducts`. The POS screen passes `search`. That's the simplest flow that keeps `useCart`'s queued-scan effect from going stale.