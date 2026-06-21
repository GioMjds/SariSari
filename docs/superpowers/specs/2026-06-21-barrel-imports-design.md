# Design Spec: Folder-Level Barrel Imports for SariSari

**Date:** 2026-06-21  
**Status:** Approved  
**Approach:** Approach 1 (Folder-Level Barrels)

---

## 1. Objective

Refactor the codebase to utilize barrel imports (`index.ts` / `index.tsx`) at the directory level for all core folders (`components/*`, `db/`, `hooks/`, `stores/`, `types/`, `constants/`, `lib/`, `utils/`). This will simplify and clean up import paths, improving code readability and developer experience.

---

## 2. Approach Description

We will implement folder-level barrels. Every core subdirectory will contain a single `index.ts` or `index.tsx` acting as its entry point. Imports across the codebase will be rewritten to import named exports directly from these directories.

We explicitly avoid a single global `@/components` barrel to:

1. Avoid namespace collisions (e.g., `FilterChips` exists in both `components/inventory/` and `components/sales/`).
2. Maintain clean boundary segregation.

---

## 3. Directory Barrels Mapping

Here is the exact set of barrel files to create and their exported components:

### components/

- **`components/ui/index.ts`**
  - `Avatar` (from `./Avatar`)
  - `Dialog` (from `./Dialog`)
  - `EmptyState` (from `./EmptyState`)
  - `GlobalModal` (from `./GlobalModal`)
  - `Modal` (from `./Modal`)
  - `MoneyText` (from `./MoneyText`)
  - `Pagination` (from `./Pagination`)
  - `ReceiptHero` (from `./ReceiptHero`)
  - `ScreenHeader` (from `./ScreenHeader`)
  - `SearchBar` (from `./SearchBar`)
  - `Skeleton` (from `./Skeleton`)
  - `Sonner` (from `./Sonner`)
  - `StatusPill` (from `./StatusPill`)
  - `StatusStamp` (from `./StatusStamp`)
  - `Toast` (from `./Toast`)
- **`components/elements/index.ts`**
  - `StyledText` (from `./StyledText`)
- **`components/layout/index.ts`**
  - `StyledTab` (from `./StyledTab`)
- **`components/inventory/index.ts`**
  - `FilterChips` (from `./FilterChips`)
  - `GuideModal` (from `./GuideModal`)
  - `InventoryActionModal` (from `./InventoryActionModal`)
  - `InventoryEmptyState` (from `./InventoryEmptyState`)
  - `InventoryHeader` (from `./InventoryHeader`)
  - `InventoryHero` (from `./InventoryHero`)
  - `InventoryRow` (from `./InventoryRow`)
  - `InventorySkeleton` (from `./InventorySkeleton`)
- **`components/products/index.ts`**
  - `CategoriesTab` (from `./CategoriesTab`)
  - `CategoryCard` (from `./CategoryCard`)
  - `ProductItem` (from `./ProductItem`)
  - `ProductsTab` (from `./ProductsTab`)
- **`components/credits/index.ts`**
  - `CustomerListItem` (from `./CustomerListItem`)
  - `FilterBar` (from `./FilterBar`)
  - `KPICard` (from `./KPICard`)
  - `SortDropdown` (from `./SortDropdown`)
- **`components/reports/index.ts`**
  - `DateRangeSelector` (from `./DateRangeSelector`)
  - `InsightCard` (from `./InsightCard`)
  - `ReportKPICard` (from `./ReportKPICard`)
  - `SectionHeader` (from `./SectionHeader`)
  - `SimpleBarChart` (from `./SimpleBarChart`)
- **`components/sales/index.ts`**
  - `FilterChips` (from `./FilterChips`)
  - `SaleRow` (from `./SaleRow`)
  - `SalesEmptyState` (from `./SalesEmptyState`)
  - `SalesFilterModal` (from `./SalesFilterModal`)
  - `SalesSkeleton` (from `./SalesSkeleton`)

### db/

- **`db/index.ts`**
  - All functions from `./categories`
  - All functions from `./credits`
  - All functions from `./inventory`
  - All functions from `./products`
  - All functions from `./reports`
  - All functions from `./sales`

### hooks/

- **`hooks/index.ts`**
  - All hooks from `./useCategories`
  - All hooks from `./useCredits`
  - All hooks from `./useInventory`
  - All hooks from `./useProducts`
  - All hooks from `./useReports`
  - All hooks from `./useSales`

### stores/

- **`stores/index.ts`**
  - All hooks/stores from `./DialogStore`
  - All hooks/stores from `./ModalStore`
  - All hooks/stores from `./ScrollStore`
  - All hooks/stores from `./ToastStore`
  - All hooks/stores from `./TooltipStore`

### types/

- **`types/index.ts`**
  - All types from `./categories.types`
  - All types from `./credits.types`
  - All types from `./inventory.types`
  - All types from `./onboarding.types`
  - All types from `./products.types`
  - All types from `./reports.types`
  - All types from `./sales.types`
  - All types from `./ui/Alert.types`
  - All types from `./ui/Modal.types`
  - All types from `./ui/Toast.types`
  - All types from `./ui/Tooltip.types`

### constants/

- **`constants/index.ts`**
  - All exports from `./categories`
  - All exports from `./filters`
  - All exports from `./guide`
  - All exports from `./sort-option`
  - All exports from `./stocks`
  - All exports from `./tabs`

### lib/

- **`lib/index.ts`**
  - All exports from `./onboardingStorage`

### utils/

- **`utils/index.ts`**
  - All exports from `./alert`
  - All exports from `./formatters`
  - All exports from `./timezone`

---

## 4. Refactoring Plan

1. Create all `index.ts`/`index.tsx` barrel files.
2. Search the codebase for imports matching:
   - `@/components/ui/`
   - `@/components/elements/`
   - `@/components/layout/`
   - `@/components/inventory/`
   - `@/components/products/`
   - `@/components/credits/` (updating old `index.ts` to named exports)
   - `@/components/reports/`
   - `@/components/sales/`
   - `@/db/`
   - `@/hooks/`
   - `@/stores/`
   - `@/types/`
   - `@/constants/`
   - `@/lib/`
   - `@/utils/`
3. Update imports to reference the barrel. For components that are default-exported, they are mapped to named exports inside their barrel, so imports like:

   ```typescript
   import MoneyText from '@/components/ui/MoneyText';
   ```

   will become:

   ```typescript
   import { MoneyText } from '@/components/ui';
   ```

4. Verify by running TypeScript compiler checks (`npx tsc --noEmit`) and testing the code.
