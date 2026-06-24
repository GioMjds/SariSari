# General Reports Redesign Spec — 2026-06-24

## 1. Objective
Redesign the mobile UI/UX of `app/(tabs)/reports` to transition from a simple "Sales Reports" page into a comprehensive, professional, and accessible **General Reports** screen. The design focuses on high-impact analytical insights, a modern Bento Grid KPI layout, and interactive, collapsible detail panels. It is designed to be highly readable for sari-sari store owners of all age groups (e.g., from tech-savvy youth to older "Lolas").

## 2. Key Differences from Counter Dashboard
To avoid repetitive functionality with the Counter Dashboard (`app/(tabs)/index.tsx`), the General Reports screen enforces these boundaries:
- **No Operations**: No buttons/shortcuts for recording transactions, adding stock, or recording credit collections.
- **Analytical & Time-Scoped**: The Dashboard displays real-time data for "Today". Reports allows toggling between "Today", "This Week", "This Month", and custom calendar scopes.
- **Deeper Business Analytics**: Reports provides margin calculation (Tubo), credit risk analysis (Aging buckets), inventory asset value calculation, and lists of fast- or slow-moving items.

---

## 3. Visual & Layout Design

### 3.1 Date Selection & Header
- **Header**: Shows title "General Reports" with subtitle "Offline Store Analytics" and a pull-to-refresh / manual refresh button.
- **Date Selector**: Utilizes the existing `DateRangeSelector` styled with capsule badges. Active range is visually highlighted with a solid dark theme (`bg-warm-900` or similar).

### 3.2 Smart Alerts & Insights
- A high-priority banner at the top of the dashboard.
- Displays key actionable notifications derived from report data (e.g., *"Mang Jose is overdue on ₱500 credit"* or *"Canned Sardines is low on stock (2 left)"*).
- Displayed only when relevant items exist.

### 3.3 Bento KPI Grid
A 2x2 grid containing 4 cards representing the pillars of the business:

| KPI Card | Theme / Icon | Subtext Indicator | Purpose / Formula |
| :--- | :--- | :--- | :--- |
| **Total Sales** | **Green** / `shopping-cart` | Cash vs. Credit split | Displays sum of all sales in the date range. |
| **Profit (Tubo)** | **Amber** / `line-chart` | Margin % & Cost Coverage | Gross Sales minus Wholesale Cost of items sold. Shows "Add cost prices" warning if coverage is 0. |
| **Active Utang** | **Orange-Red** / `credit-card` | Number of active suki debt accounts | Sum of outstanding customer credit transactions. |
| **Stock Value** | **Blue** / `archive` | Potential retail sales value | Displays current wholesale cost of items in stock vs. potential retail revenue. |

### 3.5 Collapsible Detail Accordions
To prevent screen clutter and avoid overwhelming users, analytical details are split into collapsible panels (using Moti or Reanimated for smooth transitions):
1. **Sales Trend & Payments (Expanded by Default)**: Shows a `SimpleBarChart` of daily sales trend and a payment method breakdown (Cash vs. Credit).
2. **Top Products & Profitability**: Ranks top products by revenue and units sold, alongside the most profitable products (tubo/pc) to help maximize profit margins.
3. **Stock Levels & Movement**: Shows items sold, low stock, out of stock, and lists of fast vs. slow-moving products.
4. **Suki Credit Aging**: A progress-bar based chart showing outstanding debt distributed across chronological buckets (0-30 days, 30-60 days, 60+ days) and active/collected counts.

---

## 4. Components & Layering

### 4.1 UI Component Architecture

```
Reports (app/(tabs)/reports/index.tsx)
 ├── DateRangeSelector (components/reports/DateRangeSelector.tsx)
 ├── InsightCard (components/reports/InsightCard.tsx)
 ├── BentoGrid (components/reports/BentoGrid.tsx)
 │    └── BentoKPICard (components/reports/BentoKPICard.tsx)
 └── CollapsibleSection (components/reports/CollapsibleSection.tsx)
      ├── SimpleBarChart (components/reports/SimpleBarChart.tsx)
      ├── TopProductsList (co-located component)
      ├── StockMovementDetails (co-located component)
      └── CreditAgingChart (co-located component)
```

- **`BentoGrid`**: A custom wrapper styled with `flex-row flex-wrap gap-3` or `grid grid-cols-2 gap-3` via NativeWind.
- **`BentoKPICard`**: Card design with large text, visual icons, custom accent backgrounds, and subtext labels.
- **`CollapsibleSection`**: A Reanimated/Moti-powered accordion wrapper that animates height changes smoothly.

### 4.2 Guardrails & Styling
- **Style system**: Tailwind via `NativeWind` v4 classes, adhering to existing colors in `tailwind.config.js` (like `bg-background`, `text-warm-900`, `cinnamon-500`, etc.).
- **Typography**: Outfit or Outfit-based typography definitions (`font-extrabold`, `font-semibold`, `font-medium`, `font-regular`).
- **Money representation**: Always formatted at the render edge via `formatCompactCurrency` or `MoneyText` (which takes integer centavos).

---

## 5. Technical Data Flow

The screen retrieves all data using the existing hook `useReports()` which consumes `db/reports.ts` SQLite queries:

1. **KPI Stats**: `useReportKPIs(dateRange)` -> returns totalSales, totalProfit, totalCreditsIssued, totalCreditsCollected, and profitCoverage.
2. **Sales Trend**: `useSalesOverTime(dateRange)` -> returns daily sales points for charts.
3. **Top Products**: `useTopSellingProducts(dateRange, limit)` -> returns ranking by revenue.
4. **Payment Split**: `useSalesBreakdown(dateRange)` -> cash vs credit sales counts and averages.
5. **Inventory Movement**: `useInventoryMovement(dateRange)` -> items sold, low stock, out of stock.
6. **Stock Valuation**: `useInventoryValue()` -> current stock cost value, potential retail value, and cost coverage ratio.
7. **Credit Overview & Aging**: `useCreditsOverview(dateRange)` and `useAgingBuckets()`.
8. **Profitability details**: `useProfitability(dateRange)` and `useProductProfitability(dateRange, limit)`.
9. **Insights Feed**: `useReportInsights(dateRange)`.

All updates are offline-first and refreshed transactionally. Swiping down triggers `invalidateReports()` to invalidate all query cache queries under TanStack Query.

---

## 6. Implementation Stages
1. **Stage 1: Base Components**: Implement/Refactor components under `components/reports/` (`BentoGrid.tsx`, `BentoKPICard.tsx`, `CollapsibleSection.tsx`).
2. **Stage 2: General Screen Redesign**: Update `app/(tabs)/reports/index.tsx` to align with the new Bento layout structure and collapsible sections.
3. **Stage 3: Sub-component Implementations**: Wire the detail charts and tables (Sales Trend, Top Products, Inventory Movement, Credit Aging) inside their respective accordions.
4. **Stage 4: Validation & Styling Polish**: Fine-tune spacing, colors, font sizes, transitions, and test responsiveness across screens.

---

## 7. Verification Plan
- **Manual Verification**: Run `npx expo start` and exercise filters, pull-to-refresh, toggling accordions, and checking layout on simulate screens (iOS / Android / Web).
- **Offline Mode**: Turn on airplane mode to verify zero network requests and smooth offline database reads.
- **Unit / Integration Tests**: Check database hooks and mappings are intact via `pnpm test`.
