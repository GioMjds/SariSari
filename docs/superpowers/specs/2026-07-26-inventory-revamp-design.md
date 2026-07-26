# Inventory Tab UI Revamp Design Specification

- **Date:** 2026-07-26
- **Status:** Approved
- **Target Location:** `app/(tabs)/inventory/`

---

## 1. Overview & Goals

The Inventory Tab is being revamped to transition from a monolithic index screen to a workflow-driven sub-route architecture aligned with the SariSari navigation master plan in `FUTURE_REVAMP.md`.

### Core Goals

- Enable fast, horizontal gesture swiping across 4 core inventory sub-workflows: **Products**, **Low Stock**, **Expiry**, and **Stock In**.
- Provide fast slide-up bottom sheets for **Category Management** and **Supplier Management** accessible from the top header.
- Provide a flexible **Hybrid Stock-In** experience supporting both 1-tap single-item scanning and multi-item batch supplier delivery sheets.
- Maintain offline-first data sync and clear visual indicators for stock health (Low stock, Expiring items, Out of stock).

---

## 2. Navigation & Directory Structure

The `app/(tabs)/inventory/` directory will be refactored into modular sub-routes:

```txt
app/(tabs)/inventory/
  ├── _layout.tsx        # Layout shell (Header bar + top swipeable sub-tab bar)
  ├── products.tsx       # Main product catalog (Grid/List, search, filter chips)
  ├── low-stock.tsx      # Low stock control list with 1-tap restock action
  ├── expiry.tsx         # Expiry timeline tracker with clearance markdown actions
  ├── stock-in.tsx       # Hybrid stock receiving (Quick restock + Batch delivery mode)
  └── [detail].tsx       # Product detail stack screen & stock audit movement log
```

---

## 3. Header Bar & Navigation Shell (`_layout.tsx`)

### Header Bar Elements

- **Store Title & Status:** Store name display with live sync status badge (Offline / Syncing / Synced).
- **Header Circle Buttons:**
  - `Category Icon`: Triggers `CategoryManagerSheet` (slide-up bottom sheet).
  - `Supplier Icon`: Triggers `SupplierManagerSheet` (slide-up bottom sheet).
  - `Barcode Icon`: Opens `BarcodeScannerModal`.
  - `Plus Icon`: Opens `AddProductModal`.

### Top Swipeable Sub-Tab Bar

- Horizontal sub-tabs: **Products** | **Low Stock** | **Expiry** | **Stock In**.
- Swipe gestures enabled between sub-tabs with active tab indicator highlighting.

---

## 4. Sub-Screen Specifications

### 4.1 Products Catalog (`products.tsx`)

- **Top Controls:** Search bar with clear button, barcode scanner launcher, grid/list layout view toggle, and sort bottom sheet trigger.
- **Filter Chips:** Horizontal filter bar (`All Items`, `Low Stock`, `Expiring Soon`, `Out of Stock`).
- **Product Cards:**
  - Displays thumbnail image/icon, item name, unit variant, selling price, and stock status badge.
  - Color-coded stock badges: Green (Healthy), Amber (Low stock), Red (Out of stock).
  - Tap card opens `[detail].tsx` stack screen.
  - Long press opens `ProductActionSheet`.

### 4.2 Low Stock Control (`low-stock.tsx`)

- **Summary Banner:** Total items requiring reorder and out-of-stock count.
- **Filtered List:** Displays products where `stockQuantity <= reorderPoint`.
- **Restock Action:** Prominent 1-tap "Restock Now" button on each card that navigates to `stock-in.tsx` with pre-filled item parameters.

### 4.3 Expiry Tracker (`expiry.tsx`)

- **Timeline Sections:** `Expired`, `Expiring in 7 Days`, `Expiring in 30 Days`.
- **Batch Cards:** Shows product name, batch ID, expiration date, and remaining stock quantity.
- **Quick Actions:**
  - _Apply Clearance Discount:_ Quick modal to discount sell price for fast sale before expiry.
  - _Stock Waste Write-off:_ Records stock adjustment event for expired goods.

### 4.4 Hybrid Stock-In (`stock-in.tsx`)

- **Top Mode Switch:** Segmented toggle for `Quick 1-Item Restock` vs `Full Supplier Delivery`.
- **Quick 1-Item Restock Mode:**
  - Scan barcode or search item.
  - Input added stock quantity and unit cost price.
  - 1-tap confirm stock update.
- **Full Supplier Delivery Mode:**
  - Select supplier from dropdown/sheet.
  - Add multiple items into receiving delivery invoice list.
  - Enter total cost price and batch expiration dates per item.
  - Save full delivery shipment in one transaction.

### 4.5 Product Detail Stack Screen (`[detail].tsx`)

- Detailed product metadata, pricing margins, category, and supplier assignment.
- **Stock Movement Log:** Sequential log of all inventory events (Sales, Restocks, Adjustments, Refunds).

---

## 5. Component & Modal Architecture

- **`CategoryManagerSheet.tsx`**: Bottom sheet for creating, editing, and deleting product categories with real-time product counts.
- **`SupplierManagerSheet.tsx`**: Bottom sheet for managing suppliers and contact details.
- **`SortBottomSheet.tsx`**: Options for sorting catalog items by Name, Stock, Price, Expiry, or Last Updated.
- **`BarcodeScannerModal.tsx`**: Reusable camera scanning modal.

---

## 6. Data Flow & State Management

- **Data Hooks:** Integrated with existing `useProducts()`, `useCategories()`, `useSuppliers()`, and `useStockRecommendations()`.
- **UI State Store:** `useInventoryViewStore` retains user preferences (grid/list mode, default search/sort).
- **Offline & Sync:** All operations write to local database first and queue for background sync when offline.

---

## 7. Spec Self-Review Checklist

- [x] **Placeholder scan:** No TBD or vague requirements remaining.
- [x] **Internal consistency:** Layout and routes match `FUTURE_REVAMP.md`.
- [x] **Scope check:** Focused specifically on `app/(tabs)/inventory/` revamp.
- [x] **Ambiguity check:** Navigation model, modal triggers, and stock-in modes explicitly defined.
