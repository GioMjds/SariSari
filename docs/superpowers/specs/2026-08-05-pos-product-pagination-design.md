# POS Product Pagination — Design

Date: 2026-08-05
Status: Approved (sections 1–4 LGTM)

## Goal

Reduce the data and rendering load on the POS tab's product list. Today,
`app/(tabs)/sales/pos.tsx` calls `useProducts().getAllProductsQuery`, which
loads every product in the local SQLite catalog into memory and renders them
all in a single `FlatList`. As catalogs grow, this slows first paint, jank-
scrolls on long lists, and inflates search-filter cost. Pagination fixes that
without changing the UX shape (still one continuous scrolling list).

## Scope

In scope:

- POS tab only (`app/(tabs)/sales/pos.tsx` + the components it uses).
- New DB function for paged reads.
- New hook return value for paged reads.
- Infinite-scroll wiring on the existing `FlatList` in
  `ProductSearchCatalog`.

Out of scope:

- The Inventory tab still uses `getAllProductsQuery`. Leave it alone.
- The `useCatalog` hook (the barcode-lookup library) is a different product
  table and is not touched.
- No jump-to-page UI, no virtualization beyond `FlatList`.

## Decisions

- **Infinite scroll** with `onEndReached` (not "Load more" button, not numbered
  pages). Matches the existing single-list UX and typical POS apps.
- **30 products per page.** Roughly fills more than one screen of
  `ProductRow` cards; fast to render.
- **Cursor-based SQL pagination** keyed on `(name COLLATE NOCASE, id)`.
  Cursor-based avoids the offset-shifting bug where a product added/deleted/
  renamed mid-scroll causes duplicates or skipped rows.
- **Search is server-side** (SQL `LIKE`) and paginates the same way. The
  current in-memory filter in `pos.tsx` is removed.
- Page size is a constant, not a runtime knob. YAGNI.

## Architecture

Strict unidirectional flow, consistent with the codebase:

```
Screen (app/(tabs)/sales/pos.tsx)
  └─ reads search + paged products from ─▶ Hook (hooks/useProducts.tsx)
  └─ renders via ─▶ Component (components/sales/pos/ProductSearchCatalog.tsx)
                                                 │
                                                 └─ DB function (database/products.ts) → SQLite
```

### Database layer (`database/products.ts`)

New function:

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
}): Promise<ProductsPage>;
```

SQL shape (single statement, no transactions):

```sql
SELECT * FROM products
WHERE (
  :cursorName = '' OR
  (LOWER(name) > LOWER(:cursorName) OR
   (LOWER(name) = LOWER(:cursorName) AND id > :cursorId))
)
AND (
  :search = '' OR
  LOWER(name) LIKE :searchPattern OR
  LOWER(sku)  LIKE :searchPattern
)
ORDER BY LOWER(name), id
LIMIT :limit
```

Notes:

- `name COLLATE NOCASE` could be used directly, but parameterizing through
  `LOWER(name)` keeps a single index-less query simple. If perf demands it
  later, add an index on `LOWER(name)` — not part of this change.
- `cursor = null` is encoded as `cursorName = ''` so the first page matches
  everything via the first `OR` branch.
- `nextCursor` is `null` when `items.length < limit`. Otherwise it is the last
  item's `{ name, id }`.

The existing `getAllProducts` is left in place — other call sites still use
it.

### Hook layer (`hooks/useProducts.tsx`)

Add `productKeys.infinite` and a new hook `usePaginatedProducts(search)` that
owns the infinite query. Do not change the existing `useProducts()` return
shape — other callers still depend on it.

```ts
export const productKeys = {
  // ...existing keys...
  infinite: (search: string) =>
    [...productKeys.all, 'infinite', search] as const,
};

export function usePaginatedProducts(search: string) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(search),
    initialPageParam: null as ProductsPageCursor | null,
    queryFn: ({ pageParam }) =>
      getProductsPage({ cursor: pageParam, limit: 30, search }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });
}
```

The hook lives next to `useProducts` in `hooks/useProducts.tsx` (or a
sibling file in `hooks/`). It exposes the standard
`useInfiniteQuery` shape so callers can read `data`, `isLoading`,
`isFetchingNextPage`, `hasNextPage`, `fetchNextPage`, and `error`.

`useCart()` swaps `getAllProductsQuery` for `usePaginatedProducts(search)`,
where `search` is the current search text from the screen's `useForm`.

### Screen layer (`app/(tabs)/sales/pos.tsx`)

- Remove the `useMemo` in-memory filter.
- Pass `search` to `usePaginatedProducts`.
- Pass `data` (flattened pages), `isLoading`, `isFetchingNextPage`,
  `hasNextPage`, and `fetchNextPage` into `ProductSearchCatalog`.

### Component layer (`components/sales/pos/ProductSearchCatalog.tsx`)

New props (additive, default-compatible):

```ts
interface ProductSearchCatalogProps {
  // ...existing...
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
  onRetryFetchNext?: () => void;
}
```

FlatList wiring:

- `data` = `filteredProducts` (already passed in, the screen will now pass
  the flattened page items).
- `onEndReached={onEndReached}` with guard inside the caller (FlatList calls
  this every render that hits the threshold, so the hook is responsible for
  short-circuiting when `isFetchingNextPage` is true).
- `onEndReachedThreshold={0.4}`.
- `ListFooterComponent`:
  - `isFetchingNextPage` → `<ActivityIndicator size="small" />` + "Loading
    more..."
  - `!hasNextPage && items.length > 0` → muted "End of list" text.
  - Otherwise → `null`.
- `ListEmptyComponent` unchanged.
- Error toast (fetch-next error): posted from the screen via
  `useToastStore`. Tap-to-retry calls `onRetryFetchNext()`.

## Error handling & edge cases

- **Empty catalog**: existing `ListEmptyComponent` shows "No products found".
- **Search returns zero**: same path as empty catalog.
- **Fetch-next error**: keep already-rendered items visible. Post a danger
  toast with the text "Couldn't load more products — tap to retry" and a
  `onPress` that calls `fetchNextPage()`.
- **First-page error**: existing `InventoryErrorState`-style is overkill
  here; show a muted "Couldn't load products" with a "Retry" button that
  calls `refetch()`. (Matches the error UX the codebase already uses.)
- **Mutation during scroll**: TanStack invalidates `productKeys.all` on
  insert/update/delete. The infinite query's key is
  `['products', 'infinite', search]`, which is a subset, so the next
  mount/refetch picks up the change. If a cursor row vanishes, the next
  page may briefly duplicate one row at the seam. Acceptable; self-
  corrects on the following page. Documented in a code comment.
- **Duplicate case-insensitive name** (rare): tiebreaker on `id` prevents
  skips/duplicates.
- **Race while typing**: search is part of the query key; rapid key
  changes cancel in-flight requests for stale keys.

## Testing

### Unit / hook tests (Jest)

In `components/sales/pos/__tests__/ProductSearchCatalog.test.tsx`:

- Renders with mock `data` shaped like the hook return.
- `onEndReached` → calls `onEndReached` prop.
- `ListFooterComponent`:
  - shows spinner when `isFetchingNextPage` is true.
  - shows "End of list" when `!hasNextPage && items.length > 0`.
  - shows nothing otherwise.

In `hooks/__tests__/usePaginatedProducts.test.tsx`:

- Mock `getProductsPage`.
- Assert `data.pages[0]` resets when `search` changes.
- Assert `getNextPageParam` returns the cursor from the last page.

### DB integration tests (`tests/sqlite/`)

In `tests/sqlite/products-pagination.test.ts`:

- Seed 50 products named "Product 01"..."Product 50" (and a duplicate
  "apple" id=1, "apple" id=2 to test the tiebreaker).
- Page 1 (cursor=null, limit=20) → 20 items, nextCursor not null.
- Page 2 (cursor = last item from page 1, limit=20) → next 20 items, no
  overlap with page 1.
- Page 3 (cursor = last item from page 2, limit=20) → 10 items,
  nextCursor null.
- Search `"product 1"` → all 11 matches ("Product 10"…"Product 19")
  paginate correctly across pages.
- Empty `search` argument → all 50 items paginate.
- Duplicate-name tiebreaker: both "apple" rows appear, in id order, no
  duplicates, no skips.

### Manual smoke test (documented in PR, not in CI)

- Seed 200 products via `scripts/sample-mock-datas.ts`.
- Open POS tab. Verify first 30 render quickly. Scroll: next page loads
  before the absolute bottom. Reach end: "End of list" appears.
- Type in search: list resets to page 1 of filtered results. Clear
  search: list returns to unfiltered paginated state.
- Insert a new product from another tab while POS is open: returning to
  POS triggers a refetch on focus, the new product appears at the right
  alphabetical spot.

## Files touched (summary)

- `database/products.ts` — add `getProductsPage` + cursor types.
- `hooks/useProducts.tsx` — add `productKeys.infinite`, `usePaginatedProducts`,
  export the new query through `useProducts()`.
- `components/sales/pos/ProductSearchCatalog.tsx` — add `isFetchingNextPage`,
  `hasNextPage`, `onEndReached`, `onRetryFetchNext` props; add
  `ListFooterComponent`; wire `onEndReached`.
- `components/sales/pos/useCart.ts` — swap `getAllProductsQuery` for
  `usePaginatedProducts(search)`.
- `app/(tabs)/sales/pos.tsx` — remove in-memory filter, pass search through
  to the hook, pass new pagination props to the catalog.
- New test files (DB integration test, hook test, component test).

No changes to types, stores, or other tabs.