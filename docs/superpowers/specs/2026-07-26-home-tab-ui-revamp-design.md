# Home Tab UI Revamp Design Specification

- **Date**: 2026-07-26
- **Status**: Approved
- **Target Area**: `app/(tabs)/home`

## 1. Goal and Overview

Revamp the SariSari mobile application Home Tab into an action-first operational dashboard and control center. The home tab transitions from a single scrolling layout into a multi-tab swipeable interface with three dedicated sub-screens (`Overview`, `Today`, `Alerts`), paired with stack push navigation for deep inspection and editing.

---

## 2. Navigation Architecture and File Structure

### File Hierarchy

```txt
app/(tabs)/home/
  ├── _layout.tsx         # Top Header + Pager Layout Wrapper
  ├── overview.tsx        # Operational Overview (KPIs, Quick Actions, Activity, Insights)
  ├── today.tsx           # Daily Summary (Sales progress, Cash Session, Hourly timeline, Log)
  ├── alerts.tsx          # Action Hub (Low stock, Expiring, Overdue customer credit, Unsynced queue)
  └── [detail].tsx        # Stack Detail Route (Drill-down views)
```

### Routing Rules

- Bottom Navigation Tab connects directly to `app/(tabs)/home/_layout.tsx`.
- Horizontal swiping navigates natively between `overview`, `today`, and `alerts`.
- Tapping any transaction, product, customer debt, or alert item triggers a stack navigation push (`[detail].tsx` or specialized modal routes), keeping deep screens out of the horizontal swipe lane.

---

## 3. Screen Specifications

### Top Header (`DashboardHeader`)

- **Store Name & Branch**: Primary store title display.
- **Sync Status**: Live status badge (`Synced`, `Syncing...`, `X Unsynced`).
- **Network Badge**: Real-time `Online` / `Offline` status indicator.
- **Sub-Tab Indicator Bar**: Segmented navigation switcher (`Overview` | `Today` | `Alerts` with active alert count badge).
- **Settings Button**: Quick link to app settings.

### 1. `overview.tsx` (Operational Control Center)

- **KPI Summary Cards (2x2 Grid)**:
  - Total Sales (Today Pesos + count)
  - Estimated Margin/Profit
  - Low Stock Count
  - Total Credits Due
- **Quick Action Grid**:
  - Hero Primary CTA: "New Sale" (Checkout entry point)
  - Secondary Actions: "Scan Barcode", "Add Stock", "Add Customer", "View Reports"
- **Recent Activity Feed**:
  - Displays latest 5 transactions with time, payment method (Cash/Credit), item count preview, and total amount.
- **Mini Insights Card**:
  - Automated product insight (e.g. best-selling item of the day).

### 2. `today.tsx` (Daily Performance & Cash Session)

- **Sales vs Target Goal Card**:
  - Revenue progress bar relative to daily sales target.
- **Cash Session Status Card**:
  - Active register session status (Open/Closed), starting float, expected cash, variance indicator, and open/close session button.
- **Hourly Sales Timeline**:
  - Peak sales hours breakdown chart.
- **Today's Transaction Log**:
  - Full filterable list of all sales recorded during the current day.

### 3. `alerts.tsx` (Action Hub)

- **Filter Pills**: `All`, `Low Stock`, `Expiring`, `Overdue Debts`, `Unsynced Queue`.
- **Alert Cards**:
  - _Low Stock Alert_: Item name, current quantity, threshold, with primary `[Restock]` action button.
  - _Expiring Item Alert_: Item name, expiration countdown, with `[Discount / Manage]` action button.
  - _Overdue Customer Debt Alert_: Customer name, total balance, days overdue, with `[Remind / Collect]` action button.
  - _Unsynced Queue Alert_: Unsynced record count, last sync timestamp, with `[Sync Now]` action button.

---

## 4. Data Flow and State Integration

- **Sales Stats Hook**: `useSales()` and `getTodayStatsQuery` for daily totals and hourly charts.
- **Products Hook**: `useProducts()` and `getAllProductsQuery` for stock thresholds and expiring items.
- **Credit KPIs Hook**: `useCreditKPIs()` for customer overdue balances.
- **Cash Session Hook**: `useCurrentSession()` for cash register drawer tracking.
- **Network & Queue**: NetInfo listener + `useOfflineQueue()` for unsynced queue count.
- **Pull to Refresh**: Refetches and invalidates React Query caches across `sales-stats`, `sales`, `products`, `credit-kpis`, `cash`, and `offline-queue`.

---

## 5. Error Handling and Resilience

- **Non-blocking Warnings**: Offline connection errors or remote sync check failures display degraded status badges without disabling local offline features.
- **Critical Data Error State**: If local storage fails to read, presents `DashboardErrorState` with an interactive "Retry" button.

---

## 6. Testing Strategy

- **Unit Tests**:
  - Utility logic for low stock threshold filtering, profit margin calculations, and debt overdue grouping.
- **Component Tests**:
  - `DashboardHeader`, KPI Cards, Quick Action navigation triggers, and Alert Cards.
- **Integration Tests**:
  - Swipe navigation between `overview`, `today`, and `alerts` sub-tabs, and push navigation to `[detail].tsx`.
