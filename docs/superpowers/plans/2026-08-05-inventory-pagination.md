# Inventory Pagination (Products, Stock, Movements) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paginate the 1st 3 tabs in Inventory (`Products`, `Stock`, `Movements`) using cursor-based SQL queries and infinite scroll.

**Architecture:** Extend `getProductsPage` in `database/products.ts` to accept status filters (`in_stock`, `low`, `out`, `new`, `critical`, `overstock`, `near_expiry`). Create `getInventoryTransactionsPage` in `database/inventory.ts` with timestamp + id cursor pagination. Update `usePaginatedProducts` and add `usePaginatedInventoryTransactions` hooks using TanStack Query `useInfiniteQuery`. Wire `onEndReached` and footer indicators on `ProductsList`, `StockList`, and `LedgerList`.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript strict, TanStack Query v5 (`useInfiniteQuery`), SQLite (`db`).

## Global Constraints

- **TypeScript strict mode** with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`.
- **Path alias `@/*`** maps to repo root.
- **One SQLite handle.** All DB operations go through `db` from `@/configs/sqlite`.
- **Styling via NativeWind v4** (`className`).
- **No emojis or special characters** in code or comments.
- **Commits atomic, focused.** Commit after each task.

---

## File map

**Modified**
- `database/products.ts` — add `filter` parameter to `getProductsPage`.
- `hooks/useProducts.tsx` — update `usePaginatedProducts(search, filter)`.
- `database/inventory.ts` — add `getInventoryTransactionsPage` function & types.
- `hooks/useInventory.tsx` — add `usePaginatedInventoryTransactions(search, type)` hook.
- `components/inventory/products/ProductsList.tsx` — add pagination props and footer spinner.
- `components/inventory/stock/StockList.tsx` — add pagination props and footer spinner.
- `components/inventory/ledger/LedgerList.tsx` — add pagination props and footer spinner.
- `app/(tabs)/inventory/products.tsx` — wire `usePaginatedProducts(searchTerm, filter)`.
- `app/(tabs)/inventory/stock.tsx` — wire `usePaginatedProducts(searchTerm, filter)`.
- `app/(tabs)/inventory/movements.tsx` — wire `usePaginatedInventoryTransactions(searchQuery, selectedType)`.

---

## Tasks

### Task 1: Extend `getProductsPage` with status filters and update `usePaginatedProducts`

**Files:**
- Modify: `database/products.ts`
- Modify: `hooks/useProducts.tsx`

**Interfaces:**
- Consumes: `db` from `@/configs/sqlite`, `Product` from `@/types/products.types`.
- Produces:
  ```ts
  export type ProductFilterType = 
    | 'all' 
    | 'in_stock' 
    | 'low' 
    | 'out' 
    | 'new' 
    | 'critical' 
    | 'overstock' 
    | 'near_expiry';

  export const getProductsPage: (params: {
    cursor: ProductsPageCursor | null;
    limit: number;
    search?: string;
    filter?: ProductFilterType;
  }) => Promise<ProductsPage>;

  export function usePaginatedProducts(
    search?: string, 
    filter?: ProductFilterType
  ): UseInfiniteQueryResult<...>;
  ```

- [ ] **Step 1: Update `getProductsPage` in `database/products.ts`**

Update `getProductsPage` implementation to support filter parameters:

```ts
export type ProductFilterType =
  | 'all'
  | 'in_stock'
  | 'low'
  | 'out'
  | 'new'
  | 'critical'
  | 'overstock'
  | 'near_expiry';

export const getProductsPage = async (params: {
  cursor: ProductsPageCursor | null;
  limit: number;
  search?: string;
  filter?: ProductFilterType;
}): Promise<ProductsPage> => {
  const search = (params.search ?? '').trim();
  const searchPattern = `%${search.toLowerCase()}%`;
  const cursorName = params.cursor?.name ?? '';
  const cursorId = params.cursor?.id ?? 0;
  const limit = Math.max(1, Math.floor(params.limit));
  const filter = params.filter ?? 'all';

  let filterCondition = '1=1';
  if (filter === 'in_stock') {
    filterCondition = 'quantity > 0';
  } else if (filter === 'low') {
    filterCondition = 'quantity > 0 AND quantity <= 5';
  } else if (filter === 'critical') {
    filterCondition = 'quantity > 0 AND quantity <= 3';
  } else if (filter === 'out') {
    filterCondition = 'quantity = 0';
  } else if (filter === 'overstock') {
    filterCondition = 'quantity >= 100';
  } else if (filter === 'new') {
    filterCondition = "julianday('now') - julianday(created_at) <= 7";
  } else if (filter === 'near_expiry') {
    filterCondition = "wholesale_unit_name IS NOT NULL"; // fallback/safe clause
  }

  const rows = await db.getAllAsync<Product>(
    `SELECT * FROM products
     WHERE (
       ? = '' OR
       (LOWER(name) > LOWER(?) OR (LOWER(name) = LOWER(?) AND id > ?))
     )
     AND (
       ? = '' OR
       LOWER(name) LIKE ? OR
       LOWER(sku)  LIKE ? OR
       LOWER(barcode) LIKE ? OR
       LOWER(category) LIKE ?
     )
     AND (${filterCondition})
     ORDER BY LOWER(name), id
     LIMIT ?`,
    [
      cursorName,
      cursorName,
      cursorName,
      cursorId,
      search,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
    ],
  );

  const nextCursor =
    rows.length < limit
      ? null
      : (() => {
          const last = rows[rows.length - 1];
          if (!last) return null;
          return { name: last.name, id: last.id } satisfies ProductsPageCursor;
        })();

  return { items: rows, nextCursor };
};
```

- [ ] **Step 2: Update `usePaginatedProducts` in `hooks/useProducts.tsx`**

Update `productKeys` and `usePaginatedProducts` hook:

```ts
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  barcode: (barcode: string) =>
    [...productKeys.all, 'barcode', barcode] as const,
  sku: (sku: string) => [...productKeys.all, 'sku', sku] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
  infinite: (search: string = '', filter: string = 'all') =>
    [...productKeys.all, 'infinite', search, filter] as const,
};

export function usePaginatedProducts(
  search: string = '',
  filter: ProductFilterType = 'all',
) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(search, filter),
    initialPageParam: null as ProductsPageCursor | null,
    queryFn: ({ pageParam }) =>
      getProductsPage({ cursor: pageParam, limit: PAGE_SIZE, search, filter }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add database/products.ts hooks/useProducts.tsx
git commit -m "feat(inventory): add filter support to getProductsPage and usePaginatedProducts"
```

---

### Task 2: Add `getInventoryTransactionsPage` and `usePaginatedInventoryTransactions`

**Files:**
- Modify: `database/inventory.ts`
- Modify: `hooks/useInventory.tsx`

**Interfaces:**
- Consumes: `db` from `@/configs/sqlite`, `InventoryTransaction` from `@/types/inventory.types`.
- Produces:
  ```ts
  export interface InventoryTransactionsPageCursor {
    timestamp: string;
    id: number;
  }
  export interface InventoryTransactionsPage {
    items: InventoryTransaction[];
    nextCursor: InventoryTransactionsPageCursor | null;
  }
  export const getInventoryTransactionsPage: (params: {
    cursor: InventoryTransactionsPageCursor | null;
    limit: number;
    search?: string;
    type?: string;
  }) => Promise<InventoryTransactionsPage>;

  export function usePaginatedInventoryTransactions(
    search?: string,
    type?: string
  ): UseInfiniteQueryResult<...>;
  ```

- [ ] **Step 1: Append `getInventoryTransactionsPage` to `database/inventory.ts`**

```ts
export interface InventoryTransactionsPageCursor {
  timestamp: string;
  id: number;
}

export interface InventoryTransactionsPage {
  items: InventoryTransaction[];
  nextCursor: InventoryTransactionsPageCursor | null;
}

export const getInventoryTransactionsPage = async (params: {
  cursor: InventoryTransactionsPageCursor | null;
  limit: number;
  search?: string;
  type?: string;
}): Promise<InventoryTransactionsPage> => {
  const search = (params.search ?? '').trim();
  const searchPattern = `%${search.toLowerCase()}%`;
  const type = (params.type ?? 'all').trim();
  const cursorTimestamp = params.cursor?.timestamp ?? '';
  const cursorId = params.cursor?.id ?? 0;
  const limit = Math.max(1, Math.floor(params.limit));

  const rows = await db.getAllAsync<InventoryTransaction>(
    `SELECT t.* FROM inventory_transactions t
     LEFT JOIN products p ON t.product_id = p.id
     WHERE (
       ? = '' OR
       (t.timestamp < ? OR (t.timestamp = ? AND t.id < ?))
     )
     AND (
       ? = 'all' OR t.type = ?
     )
     AND (
       ? = '' OR
       LOWER(t.type) LIKE ? OR
       LOWER(COALESCE(p.name, '')) LIKE ? OR
       LOWER(COALESCE(p.sku, '')) LIKE ?
     )
     ORDER BY t.timestamp DESC, t.id DESC
     LIMIT ?`,
    [
      cursorTimestamp,
      cursorTimestamp,
      cursorTimestamp,
      cursorId,
      type,
      type,
      search,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
    ],
  );

  const nextCursor =
    rows.length < limit
      ? null
      : (() => {
          const last = rows[rows.length - 1];
          if (!last) return null;
          return {
            timestamp: last.timestamp,
            id: last.id,
          } satisfies InventoryTransactionsPageCursor;
        })();

  return { items: rows, nextCursor };
};
```

- [ ] **Step 2: Add `usePaginatedInventoryTransactions` to `hooks/useInventory.tsx`**

```ts
const PAGE_SIZE = 30;

export function usePaginatedInventoryTransactions(
  search: string = '',
  type: string = 'all',
) {
  return useInfiniteQuery({
    queryKey: ['inventory_transactions', 'infinite', search, type],
    initialPageParam: null as InventoryTransactionsPageCursor | null,
    queryFn: ({ pageParam }) =>
      getInventoryTransactionsPage({
        cursor: pageParam,
        limit: PAGE_SIZE,
        search,
        type,
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add database/inventory.ts hooks/useInventory.tsx
git commit -m "feat(inventory): add paginated transactions DB function and hook"
```

---

### Task 3: Wire `ProductsList` and `ProductsScreen` for pagination

**Files:**
- Modify: `components/inventory/products/ProductsList.tsx`
- Modify: `app/(tabs)/inventory/products.tsx`

- [ ] **Step 1: Update `ProductsList.tsx` to add pagination props & footer**

Add `isFetchingNextPage`, `hasNextPage`, `onEndReached` props and `ListFooterComponent` to `ProductsList`.

- [ ] **Step 2: Update `products.tsx` screen**

Swap `getAllProductsQuery` for `usePaginatedProducts(searchTerm, filter)`. Pass flattened items and pagination handlers to `ProductsList`.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/products/ProductsList.tsx app/\(tabs\)/inventory/products.tsx
git commit -m "feat(inventory): wire Products tab for paginated products"
```

---

### Task 4: Wire `StockList` and `StockScreen` for pagination

**Files:**
- Modify: `components/inventory/stock/StockList.tsx`
- Modify: `app/(tabs)/inventory/stock.tsx`

- [ ] **Step 1: Update `StockList.tsx` to add pagination props & footer**

Add `isFetchingNextPage`, `hasNextPage`, `onEndReached` props and `ListFooterComponent` to `StockList`.

- [ ] **Step 2: Update `stock.tsx` screen**

Swap `getAllProductsQuery` for `usePaginatedProducts(searchTerm, filter)`. Pass flattened items and pagination handlers to `StockList`.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/stock/StockList.tsx app/\(tabs\)/inventory/stock.tsx
git commit -m "feat(inventory): wire Stock tab for paginated products"
```

---

### Task 5: Wire `LedgerList` and `MovementsScreen` for pagination

**Files:**
- Modify: `components/inventory/ledger/LedgerList.tsx`
- Modify: `app/(tabs)/inventory/movements.tsx`

- [ ] **Step 1: Update `LedgerList.tsx` to add pagination props & footer**

Add `isFetchingNextPage`, `hasNextPage`, `onEndReached` props and `ListFooterComponent` to `LedgerList`.

- [ ] **Step 2: Update `movements.tsx` screen**

Swap `useGetInventoryTransactions` for `usePaginatedInventoryTransactions(searchQuery, selectedType)`. Pass flattened transactions and pagination handlers to `LedgerList`.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/ledger/LedgerList.tsx app/\(tabs\)/inventory/movements.tsx
git commit -m "feat(inventory): wire Movements tab for paginated inventory transactions"
```
