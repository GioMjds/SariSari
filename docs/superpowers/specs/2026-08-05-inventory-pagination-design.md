# Inventory Pagination (Products, Stock, Movements) — Design Spec

**Date:** 2026-08-05  
**Goal:** Add cursor-based SQL pagination and infinite scroll to the first 3 tabs in `app/(tabs)/inventory` (`Products`, `Stock`, and `Movements`).

---

## 1. Architecture Overview

Currently, `ProductsScreen` (`products.tsx`), `StockScreen` (`stock.tsx`), and `MovementsScreen` (`movements.tsx`) fetch full dataset arrays into memory and apply client-side array filtering for search and status chips.

We will transition all 3 tabs to cursor-based SQL pagination powered by TanStack Query `useInfiniteQuery`.

### Target Queries & Keys:
- **Products & Stock Tabs**: Shared DB function `getProductsPage({ cursor, limit, search, filter })` in `database/products.ts` wrapped by `usePaginatedProducts(search, filter)` in `hooks/useProducts.tsx`.
  - Query Key: `['products', 'infinite', search, filter]`
  - Page size: 30 items
- **Movements Tab**: DB function `getInventoryTransactionsPage({ cursor, limit, search, type })` in `database/inventory.ts` wrapped by `usePaginatedInventoryTransactions(search, type)` in `hooks/useInventory.tsx`.
  - Query Key: `['inventory_transactions', 'infinite', search, type]`
  - Page size: 30 items

---

## 2. Database Layer

### 2.1 `database/products.ts`
Extend `getProductsPage` to accept an optional `filter` string:
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
}): Promise<ProductsPage>;
```

#### Filter Clause Mapping in SQL:
- `in_stock`: `quantity > 0`
- `low`: `quantity > 0 AND quantity <= 5`
- `critical`: `quantity > 0 AND quantity <= 3`
- `out`: `quantity = 0`
- `overstock`: `quantity >= 100`
- `new`: `julianday('now') - julianday(created_at) <= 7`
- `near_expiry`: `expiry_date IS NOT NULL AND (julianday(expiry_date / 1000, 'unixepoch') - julianday('now')) BETWEEN 0 AND 7` (or corresponding column check if expiry exists)
- `all` / fallback: `1=1`

### 2.2 `database/inventory.ts`
Add cursor pagination for inventory transactions:
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
}): Promise<InventoryTransactionsPage>;
```
Ordered by `(timestamp DESC, id DESC)`.

---

## 3. Hook Layer

### 3.1 `hooks/useProducts.tsx`
Update `usePaginatedProducts`:
```ts
export function usePaginatedProducts(search: string = '', filter: ProductFilterType = 'all') {
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

### 3.2 `hooks/useInventory.tsx`
Add `usePaginatedInventoryTransactions`:
```ts
export function usePaginatedInventoryTransactions(search: string = '', type: string = 'all') {
  return useInfiniteQuery({
    queryKey: ['inventory_transactions', 'infinite', search, type],
    initialPageParam: null as InventoryTransactionsPageCursor | null,
    queryFn: ({ pageParam }) =>
      getInventoryTransactionsPage({ cursor: pageParam, limit: PAGE_SIZE, search, type }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
```

---

## 4. UI Layer

### 4.1 Products Screen (`app/(tabs)/inventory/products.tsx`)
- Swap `getAllProductsQuery` for `usePaginatedProducts(searchTerm, filter)`.
- Flatten pages: `productsQuery.data?.pages.flatMap(p => p.items) ?? []`.
- Pass `isFetchingNextPage`, `hasNextPage`, `onEndReached` to `ProductsList`.

### 4.2 Stock Screen (`app/(tabs)/inventory/stock.tsx`)
- Swap `getAllProductsQuery` for `usePaginatedProducts(searchTerm, filter)`.
- Flatten pages and pass pagination props to `StockList`.

### 4.3 Movements Screen (`app/(tabs)/inventory/movements.tsx`)
- Swap `useGetInventoryTransactions` for `usePaginatedInventoryTransactions(searchQuery, selectedType)`.
- Flatten pages and pass pagination props to `LedgerList`.

### 4.4 List Components Footer
Add loading indicator / "End of list" state in list footers for `ProductsList`, `StockList`, and `LedgerList`.

---

## 5. Verification & Testing Strategy

- Code quality: `tsc --noEmit` checks with strict flags.
- Manual smoke test on Expo dev client for list scrolling, search reactivity, filter chips, and footers.
