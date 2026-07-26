# SariSari Store Application Flow and Route Architecture Analysis

## 1. Overview and Entry Gate Architecture

The application is built using Expo Router with a file-based routing model under the `app/` directory.

### Root Entry Flow

```diagram
[App Launch]
     │
     ▼
app/index.tsx (Entry Gate)
     │
     ├── (Onboarding Incomplete) ──> app/onboarding/index.tsx
     │                                      │
     │                                      ▼ (Complete Onboarding)
     │                                 loadOnboardingState() -> set true
     │                                      │
     └── (Onboarding Completed) ───────────┴──> app/(tabs)/index.tsx (Dashboard)
```

1. **`app/_layout.tsx`**: Root stack navigator providing global providers (QueryClientProvider, SafeAreaProvider, GestureHandlerRootView, PaperProvider). Sets default screen headers to hidden (`headerShown: false`) and configures system navigation bar styling.
2. **`app/index.tsx` (Entry Gate)**: Initial splash and routing guard. Reads persistent onboarding status via `loadOnboardingState()`. If incomplete (or forced via `EXPO_PUBLIC_FORCE_ONBOARDING`), redirects to `/onboarding`. Otherwise, redirects to `/(tabs)`.
3. **`app/onboarding/index.tsx`**: Multi-slide interactive store setup and feature tutorial for new store owners.

---

## 2. Main Tab Navigation (`app/(tabs)`)

The primary tab bar uses custom material top-tabs (`TopTabs`) with 4 main top-level operational domains:

```diagram
                  ┌─────────────────────────────────────────┐
                  │          app/(tabs)/_layout.tsx         │
                  └────────────────────┬────────────────────┘
                                       │
     ┌──────────────────┬──────────────┴───────┬──────────────────┐
     ▼                  ▼                      ▼                  ▼
Dashboard             Sell                 Inventory            Utang            Reports
/(tabs)/index.tsx     /(tabs)/sell          /(tabs)/inventory    /(tabs)/utang    /(tabs)/reports
```

### 2.1 Dashboard (`app/(tabs)/index.tsx`)

- **Primary Role**: Store Counter Command center.
- **Core Functionality**:
  - Displays real-time today revenue (₱), transaction count, and active cash register drawer state.
  - Computes smart Store Assistant recommendations via `resolveHomeState` (e.g. stock risks, overdue customer debts, drawer session status, sales goals).
  - Surfaces low-stock alert banners with direct restock action triggers.
  - Contains full-width "New Sale" hero CTA button and a 2x2 shortcut grid (Add Product, Add Stock, Utang / Credits, Reports).
  - Renders recent 3 activity sales rows with navigation to sale detail views.
- **Intersections**: Pushes to `/(edit-forms)/add-sales`, `/inventory`, `/utang`, `/reports`, `/settings`, `/(edit-forms)/cash-session`, and `/(edit-forms)/sale-details/[id]`.

### 2.2 Sell / POS (`app/(tabs)/sell/index.tsx`)

- **Primary Role**: Sales history ledger and POS entry point.
- **Core Functionality**:
  - Top "Today's Slip" hero card highlighting today's gross revenue, items sold count, and credit sales total.
  - Multi-criteria filter engine (Payment Type: Cash/Utang/GCash; Date Range: Today, Yesterday, 7 Days, 30 Days, This Month, Last Month).
  - Timestamp-sorted transaction feed with 10-item pagination.
  - Filter modal sheet (`SalesFilterModal`) and quick horizontal chip bar (`FilterChips`).
- **Intersections**: Pushes to `/(edit-forms)/add-sales` (POS checkout) and `/(edit-forms)/sale-details/[id]` (digital receipt).

### 2.3 Inventory (`app/(tabs)/inventory/index.tsx` & `/inventory/recommendations`)

- **Primary Role**: Master catalog, stock control, category hierarchy, supplier ledger, and AI stock intelligence.
- **Core Functionality**:
  - 3-tab segmented navigation:
    1. **Products Tab**: Catalog items with stock status badges, search debouncing, category filter, and List/Grid layout toggle (`useInventoryViewStore`).
    2. **Categories Tab**: Product groupings with item counts.
    3. **Suppliers Tab**: Supplier contact registry and catalog links.
  - **Barcode Scanner**: Header barcode icon opens camera modal (`BarcodeScannerModal`), prefilling `/(edit-forms)/add-product?prefillBarcode=...`.
  - **Stock Advice Warning**: Banner link to `/inventory/recommendations` (AI-suggested reorder quantities, slow-mover analysis, and watch lists).
  - **Deep-Link Restock**: Consumes `params.restock` to open immediate quantity adjustment dialogs.
- **Intersections**: Pushes to `/(edit-forms)/add-product`, `/(edit-forms)/edit-product/[id]`, `/(edit-forms)/product-details/[id]`, `/(edit-forms)/inventory-ledger/[id]`, `/(edit-forms)/add-supplier`, `/(edit-forms)/edit-supplier/[id]`, and `/inventory/recommendations`.

### 2.4 Utang / Suki Ledger (`app/(tabs)/utang/index.tsx`)

- **Primary Role**: Customer credit balance tracking, overdue debt collection, and credit purchase management.
- **Core Functionality**:
  - **Priority Overdue Hero**: Automatically pins the most urgent overdue customer or highest debtor to the top card with direct payment/credit action buttons.
  - **Compact KPI Metrics**: Live totals for Total Outstanding Balance (₱), Collected Today (₱), Active Debtors Count, and Overdue Accounts Count.
  - **Search & Sort**: Debounced search by customer name/phone; sort by balance, name, or recent activity.
  - **Filter Chips**: All, With Balance, Paid Up, Overdue.
- **Intersections**: Pushes to `/(edit-forms)/add-customer`, `/(edit-forms)/credit-details/[id]`, `/(edit-forms)/add-payment/[id]`, and `/(edit-forms)/add-credit/[id]`.

### 2.5 Reports & Financials (`app/(tabs)/reports/index.tsx` & `/gastos-kaha`)

- **Primary Role**: Store financial almanac, operating profit analysis, and expense/cash drawing ledger.
- **Core Functionality**:
  - Read-only store analytics: Date range selectors, Bento KPI grid (Total Sales, Operating Profit, COGS, Expenses, Margin %).
  - Sales over time charts, payment method split, aging credit buckets, top-selling products, and product profitability ranks.
  - Direct navigation section link (`FinancialResultSection`) to `/gastos-kaha` for daily operating expenses (Gastos) and owner cash drawings (Kaha) with receipt photo attachments (up to 5 images per entry).
- **Intersections**: Pushes to `/gastos-kaha`.

---

## 3. Edit Forms and Detail Stack Routes (`app/(edit-forms)`)

All form workflows and detailed inspection views are configured under `app/(edit-forms)/_layout.tsx` as full-screen card routes:

| Route Path                            | Screen Function        | Primary Operations                                                                           |
| :------------------------------------ | :--------------------- | :------------------------------------------------------------------------------------------- |
| `/(edit-forms)/add-sales`             | POS Checkout           | Cart selection, barcode scanner, discount entry, customer credit assignment, sale submission |
| `/(edit-forms)/sale-details/[id]`     | Digital Receipt        | Read-only item breakdown, payment mode, receipt print/share, refund/reversal options         |
| `/(edit-forms)/add-product`           | Catalog Addition       | Name, barcode, category, cost price, selling price, initial quantity, supplier assignment    |
| `/(edit-forms)/edit-product/[id]`     | Catalog Editing        | Update item specs, category, prices, or barcode                                              |
| `/(edit-forms)/product-details/[id]`  | Product Inspection     | Stock level history, cost margin analysis, quick stock adjustments, navigation to ledger     |
| `/(edit-forms)/inventory-ledger/[id]` | Stock Audit Log        | Chronological stock movement log (sales, restocks, manual adjustments)                       |
| `/(edit-forms)/add-customer`          | Suki Profile Creation  | Name, phone number, credit limit, address, initial notes                                     |
| `/(edit-forms)/credit-details/[id]`   | Customer Credit Ledger | Outstanding balance, transaction history, statement sharing via `expo-clipboard`             |
| `/(edit-forms)/add-payment/[id]`      | Debt Repayment Form    | Log partial or full cash/GCash debt payment into customer ledger                             |
| `/(edit-forms)/add-credit/[id]`       | Debt Charge Form       | Add manual credit transaction to customer ledger                                             |
| `/(edit-forms)/add-supplier`          | Supplier Addition      | Name, contact number, address, notes                                                         |
| `/(edit-forms)/edit-supplier/[id]`    | Supplier Editing       | Update supplier contact details                                                              |
| `/(edit-forms)/category`              | Category Manager       | Add/edit product category classifications                                                    |
| `/(edit-forms)/cash-session`          | Legacy Drawer View     | Read-only audit log for historical cash drawer sessions                                      |
| `/(edit-forms)/cash-entry`            | Cash Audit Entry       | Legacy cash adjustment entry                                                                 |

---

## 4. Settings and Auxiliary Routes

- **`app/settings/index.tsx`**: Application configuration sheet including store profile, language selection (English / Tagalog), database backup packaging (`fflate` ZIP bundle generation), and full database restore with rollback protection.
- **`app/gastos-kaha/index.tsx`**: Operating expenses and owner drawing entry ledger with date filters and photo attachments.
- **`app/inventory/recommendations.tsx`**: AI stock reorder recommendations screen.
- **`app/+not-found.tsx`**: Fallback screen for unmatched route URLs.

---

## 5. Architectural Recommendations for Future Revamp

### A. Navigation & Router Hierarchy Consolidation

- **Type-Safe Route Parameters**: Replace `any` casts in `router.push` calls across screens with strictly typed `Href<AllRoutes>` route maps to prevent missing parameter errors during navigation.
- **Nested Route Group Restructuring**: Group related edit forms under their domain folders (e.g. `app/(inventory)/edit/[id]`, `app/(sales)/checkout`, `app/(utang)/customer/[id]`) rather than keeping all 15 forms flat inside `app/(edit-forms)`.

### B. State Management & Form Decoupling

- **Shared POS Cart Store**: Extract POS checkout state from `useAddSalesForm` into a dedicated Zustand store so cart items persist if a user temporarily switches tabs during a checkout.
- **Modal vs Screen Standardization**: Explicitly separate quick inline quick-action dialogs (e.g. quick restock) from full-screen workflows (e.g. full product editing) to avoid modal stacking issues.

### C. Performance & Data Query Optimization

- **Query Key Namespace Hygiene**: Standardize query keys across React Query hooks (`sales`, `products`, `customers`, `financials`, `reports`) to prevent redundant query invalidations during background refreshes.
- **Virtualized List Optimization**: Enforce strict `getItemLayout` and windowing parameters on long list views (`Sell`, `Inventory`, `Utang`) to ensure smooth 60 FPS scrolling performance on low-spec Android devices.
