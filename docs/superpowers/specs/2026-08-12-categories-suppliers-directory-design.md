# Inventory Category & Supplier Directory — Design

**Status:** approved
**Date:** 2026-08-12
**Vault sources:** `obsidian-vault/05-bugs-issues/no-category-and-supplier-viewing.md`, `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` §5 (target Inventory tab IA)

## Problem

Store owners using the Inventory tab can filter products by category (via `CategoryFilterBar`) and by supplier (via `?supplier=` URL param), but there is no surface to **browse**, **manage**, or **drill into** the categories and suppliers themselves. The bug report (`no-category-and-supplier-viewing.md`) frames this as owners wanting to "know their current product categories and suppliers to view."

The closest existing surfaces:

- `app/(edit-forms)/add-category/index.tsx` — single-purpose add-only form
- `app/(edit-forms)/edit-supplier/[id].tsx` — edit-only form, no list
- `components/inventory/CategoryFilterBar.tsx` — shows category chips with `product_count`, but does not let users drill in, rename, or delete
- A `feat/supplier-directory` remote branch exists, but the local working tree has no equivalent directory surface

## Goals

Add a discoverable, in-tab surface for owners to:

1. **Browse** the full list of categories and the full list of suppliers, each with their product count
2. **Manage** each (rename, delete) from the list, with a confirm step before destructive actions
3. **Drill in** to see the products attached to a specific category or supplier, with no data duplication

## Non-goals

- Multi-supplier consolidation in a single delivery (Feature #8 partial)
- Receiving-delivery flow or shortage report (Feature #8 partial)
- Bulk delete of categories
- Per-row category merge
- Perishable / expiry tracking (Feature #13 partial)
- Reorder suggestions (Feature #9 done, orphaned route — out of scope here)
- Move or consolidate `analytics.tsx` / `stock.tsx` / `modals.tsx` (IA backlog items §7)

## Architecture

Two new top-level directory routes inside the Inventory tab stack, plus two lightweight drilldown routes that mount the existing `ProductsList` with a pre-applied filter.

```folder
Inventory tab (stack)
  ├─ products.tsx               [existing, gains header icons + overflow]
  ├─ categories.tsx             [new, browse + manage categories]
  ├─ category-products/[name]   [new, ProductsList filtered by category name]
  ├─ suppliers.tsx              [new, browse + manage suppliers]
  ├─ supplier-products/[id]     [new, ProductsList filtered by supplier_id + last-delivery chip]
  ├─ movements.tsx              [existing, untouched]
  └─ stocktake.tsx              [existing, untouched]
```

Unidirectional flow per `obsidian-vault/CONTEXT.md`: routes → hooks → `database/*` → SQLite. No business data in `stores/`.

## Components

### New routes (under `app/(tabs)/inventory/`)

| Route                          | Owns                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `categories.tsx`               | Reads `useCategories().getCategoriesWithCountQuery`; renders `<CategoryDirectoryList>` with search + FAB; long-press → action sheet; tap → drilldown; FAB → existing `add-category`                           |
| `category-products/[name].tsx` | Reads `usePaginatedProducts('', 'all')`; filters client-side by category name; renders existing `<ProductsList>` with `no-filter` empty variant                                                               |
| `suppliers.tsx`                | Reads `useSuppliersWithCountQuery`; renders `<SupplierDirectoryList>` with search + FAB; tap → drilldown; swipe-left → delete confirm; FAB → existing `add-supplier`                                          |
| `supplier-products/[id].tsx`   | Resolves supplier name via existing `getSupplierByIdQuery`; reads `useGetLastDeliveryForSupplier(id)`; renders existing `<ProductsList>` filtered by `supplier_id`; renders `<LastDeliveryChip>` below header |

### New components (under `components/inventory/directory/`)

| File                              | Purpose                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| `CategoryDirectoryList.tsx`       | ScrollView + debounced search + render rows + empty state         |
| `CategoryDirectoryRow.tsx`        | Row: name, product count chip, press + long-press handlers        |
| `CategoryDirectorySkeleton.tsx`   | 5-row loading state                                               |
| `CategoryDirectoryEmptyState.tsx` | "Add your first category" CTA                                     |
| `CategoryRowActionSheet.tsx`      | Bottom sheet for rename / delete actions                          |
| `SupplierDirectoryList.tsx`       | Same shape as Category but for suppliers; swipe-to-delete         |
| `SupplierDirectoryRow.tsx`        | Row: name, contact preview, product count, last-delivered chip    |
| `SupplierDirectorySkeleton.tsx`   | Loading state                                                     |
| `SupplierDirectoryEmptyState.tsx` | "Add your first supplier" CTA                                     |
| `DirectoryEntryHeader.tsx`        | Shared header: back button + title + count, for drilldown screens |
| `LastDeliveryChip.tsx`            | "Last delivery: 2 days ago" or "No deliveries yet"                |
| `index.ts`                        | Re-exports                                                        |

### Touched files

- `components/inventory/InventoryHeader.tsx` — add two icon buttons (folder + truck) and a 3-dot overflow menu
- `app/(edit-forms)/add-category/index.tsx` — when `?editId=` is present, prefill fields and swap to `useUpdateCategoryMutation`
- `hooks/useCategories.ts` — add `useRenameCategoryMutation({ id, name })` and `useDeleteCategoryMutation(id)`
- `hooks/useSuppliers.ts` — add `useSuppliersWithCountQuery()`; verify and add `useDeleteSupplierMutation(id)` if missing
- `database/categories.ts` — add `renameCategory(id, name)` and `deleteCategory(id)` in a transaction
- `database/suppliers.ts` — add `getSuppliersWithCount()`
- `database/inventory.ts` — add `getLastDeliveryForSupplier(supplierId)`
- `hooks/useInventory.tsx` — add `useGetLastDeliveryForSupplier(supplierId)`
- `lib/i18n.ts` and `locales/{en,tl}/inventory.json` — 18 new keys

## Data flow

### Reads

| Hook                                                          | Source function                        | Shape                                                     |
| ------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| `useCategories().getCategoriesWithCountQuery` (existing)      | existing                               | `{ id, name, product_count }[]`                           |
| `useSuppliersWithCountQuery()` (new)                          | `getSuppliersWithCount()` (new)        | `{ id, name, contact, notes, createdAt, productCount }[]` |
| `useGetSupplierByIdQuery(id)` (verify exists; add if missing) | `getSupplierById(id)`                  | `Supplier`                                                |
| `useGetLastDeliveryForSupplier(id)` (new)                     | `getLastDeliveryForSupplier(id)` (new) | `{ date, transactionId } \| null`                         |
| `usePaginatedProducts('', 'all')` (existing)                  | existing                               | unchanged                                                 |

Stale time: 60s for all new queries, matching the existing pattern.

### Mutations

| Mutation                    | DB transaction                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `useRenameCategoryMutation` | single `UPDATE categories SET name = ?`                                                                                   |
| `useDeleteCategoryMutation` | `withTransactionAsync` → re-point `products.category` to `null` where `category = oldName`, then `DELETE FROM categories` |
| `useDeleteSupplierMutation` | `withTransactionAsync` → re-point `products.supplier_id` to `null`, then `DELETE FROM suppliers`                          |

**Re-point to null on delete** is the deliberate choice — it preserves user data and keeps the products list rendering correctly. The cascade-delete alternative would surprise owners; the refuse-if-attached alternative would block the most common cleanup case.

### Cache invalidation

- `useRenameCategoryMutation` → invalidate `getCategoriesWithCountQuery` _and_ `usePaginatedProducts`
- `useDeleteCategoryMutation` → invalidate the same two keys
- `useDeleteSupplierMutation` → invalidate `useSuppliersWithCountQuery` _and_ `usePaginatedProducts`
- `useReceiveStock` (existing) → add `useGetLastDeliveryForSupplier` invalidation

### Search

Both `categories.tsx` and `suppliers.tsx` use a 250ms-debounced client-side filter (matching the POS debounce per Feature #1 in the IA doc). Lists are small enough (a store has ~5-30 categories, <50 suppliers) that a server-side `LIKE` adds complexity for no measurable win.

### Drilldown screens

Reuse the existing `usePaginatedProducts` cache. The drilldown screen filters the result client-side via `useMemo`, identical to the pattern at `app/(tabs)/inventory/products.tsx:62-73`. The cache is already warm when navigating `products.tsx → categories.tsx → category-products/[X]`, and the back button shows the same list immediately.

## Error handling

- **Read failures** (categories, suppliers, last-delivery): existing `InventoryErrorState` with a "Try again" wired to `query.refetch()`. No new error component.
- **Mutation failures**: existing `useToastStore` pattern — `mutation.onError` posts an `error` toast with a user-friendly message ("Could not rename — name already exists"); `mutation.onSuccess` posts a `success` toast.
- **Confirm-before-destructive**: a delete on a row with attached products triggers a confirm dialog with a count ("Delete 'Soft Drinks'? 12 products will lose their category."). Reuses `app/modal/confirm-action.tsx`.
- **Empty rename**: client-side form validation. The Save button stays disabled until the trimmed new name is non-empty _and_ differs from the current name.

## Empty states

| Screen                                      | Variant                                   | CTA                                        |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| `categories.tsx` (no categories)            | `<CategoryDirectoryEmptyState>`           | "Add your first category" → `add-category` |
| `categories.tsx` (no search results)        | adapted `no-search` empty state           | "Clear search"                             |
| `suppliers.tsx` (no suppliers)              | `<SupplierDirectoryEmptyState>`           | "Add your first supplier" → `add-supplier` |
| `category-products/[name]`                  | existing `ProductsEmptyState` `no-filter` | "Back to categories" → `router.back()`     |
| `supplier-products/[id]`                    | same as above                             | same                                       |
| `supplier-products/[id]` (no last delivery) | `<LastDeliveryChip variant="never">`      | —                                          |

## Loading states

- `categories.tsx` / `suppliers.tsx`: 5-row skeleton (`CategoryDirectorySkeleton` / `SupplierDirectorySkeleton`)
- Drilldown screens: existing `ProductsSkeleton`
- Last-delivery chip: inline `activityIndicator` size='small', flips to chip on resolve

## Accessibility

- Every `Pressable` row: `accessibilityRole="button"`, `accessibilityLabel="<Category name>, <N> products"`, `accessibilityHint="Opens products in this category"`
- Supplier rows append contact info to the label if present
- Header icon buttons: `accessibilityLabel="Categories"` / `accessibilityLabel="Suppliers"`
- Action sheet items: `accessibilityRole="button"` on Rename / Delete
- All new i18n strings in `locales/{en,tl}/inventory.json` — no hard-coded English in components
- Colors: reuse existing `ink-700` / `paper-50` / `persimmon-600` palette tokens from `CategoryFilterBar`

## i18n keys (19 new)

- `directoryTitle`
- `directoryCategories`
- `directorySuppliers`
- `directoryCategoryProductsTitle`
- `directorySupplierProductsTitle`
- `directoryLastDelivery`
- `directoryNeverDelivered`
- `directoryEmptyCategories`
- `directoryEmptySuppliers`
- `directorySearchCategoriesPlaceholder`
- `directorySearchSuppliersPlaceholder`
- `directoryCategoryDeleteConfirmTitle`
- `directoryCategoryDeleteConfirmMessage`
- `directoryCategoryRenameHint`
- `directoryCategoryDeleteHint`
- `directoryOverflowViewCategories`
- `directoryOverflowViewSuppliers`
- `directoryA11yHeaderCategories`
- `directoryA11yHeaderSuppliers`

## Entry points

`app/(tabs)/inventory/products.tsx` gains two affordances, both wired to the same two routes:

1. Two `Pressable` icon buttons in the `InventoryHeader` (folder + truck) → `categories.tsx` / `suppliers.tsx`
2. A 3-dot overflow menu with the same two items → `categories.tsx` / `suppliers.tsx`

This duplication is intentional — discoverable icons for first-time users, muscle-memory menu for repeat visitors.

## Testing

### In scope

| Test                                                              | What it covers                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tests/database/get-suppliers-with-count.test.ts`                 | Counts correct for 0/1/many; sorted by name asc                                                        |
| `tests/database/rename-category.test.ts`                          | Updates row; reflected on refetch; rejects duplicate name                                              |
| `tests/database/delete-category-repoints-products.test.ts`        | Re-points `products.category` to `null` in one transaction; no products deleted                        |
| `tests/database/delete-supplier-repoints-products.test.ts`        | Same for `supplier_id`                                                                                 |
| `tests/database/get-last-delivery-for-supplier.test.ts`           | Most recent `inventory_transactions` row by `date DESC LIMIT 1`; `null` when none; ignores other types |
| `tests/components/inventory/CategoriesScreen.test.tsx`            | Renders list; long-press → sheet; tap → drilldown; FAB → `add-category`                                |
| `tests/components/inventory/SuppliersScreen.test.tsx`             | Same shape for suppliers; swipe-delete → confirm; confirm → mutation fires                             |
| `tests/components/inventory/CategoryDirectoryEmptyState.test.tsx` | Renders CTA                                                                                            |
| `tests/components/inventory/SupplierDirectoryEmptyState.test.tsx` | Same                                                                                                   |

### Out of scope

- TanStack Query cache invalidation tests (covered by existing mutations of the same shape)
- Drilldown screens (thin shells mounting `ProductsList`, which has its own coverage)
- i18n key completeness (no existing test pattern in the project for this)
- A11y strings (covered by `CategoryFilterBar` snapshot tests using the same tokens)

### Manual smoke before merge

1. Empty-state for new categories list
2. Tap into drilldown, back
3. Rename a category
4. Delete a category with products attached (confirm modal)
5. Same four for suppliers
6. Last-delivery chip on supplier drilldown (delivered + never-delivered cases)

## Risks

- **Concurrent edits** to the same category name across two devices: out of scope (single-device per `CONTEXT.md`)
- **Large supplier lists** (>200): not a realistic concern for sari-sari stores; pagination not needed
- **Empty category name in `add-category`**: existing client-side validation in that form already handles this; we don't re-validate in the new mutation
- **Touched `add-category` for edit mode** is a small risk because the screen currently only handles create — verify the diff carefully during implementation

## Open questions

None. All decisions made during brainstorming: browse + manage + drill (yes), Inventory tab placement (yes), header icons + overflow (yes), lightweight drilldown (yes).
