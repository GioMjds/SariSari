# Changelog

All notable changes to the **SariSari** project will be documented in this file.

---

## [2.1.0-preview] - 2026-08-07

### Added

- **POS Tactile Unit Action Buttons (`+ Tingi` / `+ Pakyaw`)**:
  - Replaced ambiguous unit toggle bars in `ProductRow.tsx` with explicit, high-contrast action buttons (`+ Tingi` for retail, `+ Pakyaw` for wholesale).
  - Single retail-only products present a clean `+ Add` button with dynamic inline quantity steppers when active in cart.
- **Awwwards-Tier Double-Bezel POS Layout**:
  - Upgraded product cards with hardware doppelrand enclosures, stacked-paper thumbnail icons for bundle items, package conversion badges (`1 PK = 12 PCs`), and bulk savings badges (`Save ₱24.00`) via `calculateBulkSavings`.
  - Upgraded `FastLaneCard.tsx` with fixed container heights (`h-[132px]`) to prevent layout shifts, wholesale micro-tags, and quick-add stepper buttons (`+1`, `+2`, `+5`).
- **POS Fast Lane & Barcode Scanning**:
  - Added pin-to-top favorite product strip, barcode scan toast feedback, and instant favorite toggling (`star`).
- **Native Device Push Notifications**:
  - Built local device status bar notification pipeline (`notifications.ts`) for Android/iOS triggering on low-stock thresholds and overdue suki debt limits.
- **App Badge Icon & Header Sync**:
  - Wired `useSystemNotifications.ts` into store navigation headers to sync real-time unread alert counts with system app launcher badges.
- **Unlimited Alert History Sheet**:
  - Refactored `NotificationSheet` to use paginated `FlatList` scrolling for infinite alert history rendering.
- **Unified Product Form Engine**:
  - Re-architected `/add-product` and `/edit-product` routes around modular cards: `ProductBasicInfoCard.tsx`, `ProductPricingCard.tsx`, and `ProductStockCard.tsx`.
  - Integrated camera barcode scanner modal, duplicate barcode conflict validation, quick profit margin presets (`+10%`, `+20%`, `+30%`, `+50%`), and non-blocking loss validation in `useEditProductForm.ts`.
- **Inline Category & Supplier Quick Creation**:
  - Integrated `AddCategoryModal` and `AddSupplierModal` directly into inventory workflows, complemented by horizontal category filter bar (`CategoryFilterBar`).
- **Full Inventory Pagination**:
  - Implemented infinite-scroll pagination across Products, Stock inventory, and Movement transaction ledgers (`getPaginatedMovements`).

### Changed & Refactored

- **Consolidated Stock Adjustment Forms**: Replaced deprecated stock sheets with a unified `LogTransactionForm.tsx` handling manual restocks, stock adjustments, and damaged goods logging.
- **Optimized Form State Watchers**: Migrated form state tracking from `watch()` to `useWatch()` across add/edit flows to isolate input re-renders.

### Performance & Optimization

- **Keystroke-Scoped POS Catalog Search**: Extracted Zustand-based `posSearchStore.ts`to decouple search input typing from the product catalog subtree, eliminating screen-wide re-renders per keystroke.
- **FlatList & Callback Reference Stabilization**:
  - Wrapped paginated catalog arrays in `useMemo` to maintain stable `data` prop identity across renders.
  - Converted POS row interaction handlers (`handleToggleUnit`, `onAdd`, `onFetchNextPage`) to stable `useCallback` references anchored by internal refs.
  - Pre-computed module-scoped `className` preset strings in `ProductRow.tsx`, preventing `css-interop` style recalculation loops.

### Fixed

- **POS Catalog Freeze on Large Datasets**: Eliminated JS thread freezes and `css-interop` fiber stringification warnings when toggling units (`PC` / `PK`) on catalog datasets containing 100s of products.
- **Add-Product Supplier Picker**: Fixed supplier selection state binding when creating new products.
