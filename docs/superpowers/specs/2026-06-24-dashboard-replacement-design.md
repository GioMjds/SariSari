# Dashboard Replacement Design Spec

## Summary

Replace the current stock screen at `app/(tabs)/index.tsx` with an action-first **Dashboard**.
The approved layout direction is **Counter Command Center**: a mobile-first home screen that helps a
sari-sari store owner see today's counter status and jump into the next action quickly.

The Dashboard is not a mini Reports tab. It should answer:

- `How much did I sell today?`
- `What needs attention now?`
- `What action should I take next?`

## Goals

- Make `/` the real Dashboard route while preserving the existing five-tab structure.
- Prioritize one-handed daily use with large, obvious actions.
- Surface urgent stock and utang context without duplicating full Inventory, Utang, Sales, or Reports
  screens.
- Use existing offline local data hooks and TanStack Query.
- Keep money as integer centavos in app data and props, formatting only at render time.

## Non-Goals

- Do not change the SQLite schema.
- Do not add network calls or online-only behavior.
- Do not add dashboard business data to Zustand.
- Do not build a standalone Add Stock form in this pass.
- Do not build a customer-picker payment flow in this pass.
- Do not redesign the Sales, Inventory, Utang, or Reports tabs as part of this spec.

## Screen Structure

The Dashboard should use this hierarchy:

1. **Cinnamon dashboard hero**
   - Eyebrow: `Today`
   - Primary number: today's sales total.
   - Supporting metrics: transaction count, items sold, and credit/utang sales.
   - Empty data should render `₱0`/zero-state copy without implying an error.

2. **Primary quick actions**
   - `New Sale`
   - `Add Stock`
   - `Record Payment`
   - Actions should be large, thumb-friendly, and visible near the top of the screen.

3. **Compact alert cards**
   - Low/out stock alert.
   - Outstanding utang alert.
   - These cards summarize urgency and route to the owning tab for deeper action.

4. **Attention queue**
   - Top 3 low/out stock items.
   - Top 3 priority suki/utang items.
   - Top 3 recent sales.
   - Each section includes a compact `View All` affordance to the owning tab.

## Quick Action Routing

- `New Sale` routes directly to `/(edit-forms)/add-sales`.
- `Add Stock` routes to `/products`, because the current app restocks from a selected product and
  does not have a standalone stock-entry form.
- `Record Payment` routes to `/credits`, because the current payment form requires a selected suki.
- Section `View All` links route to:
  - Stock attention -> `/products`
  - Utang attention -> `/credits`
  - Recent sales -> `/sales`

## Data Sources

Use existing offline hooks where possible:

- Sales hero:
  - `useSales().getTodayStatsQuery`
  - Use the current DB return fields: `total`, `items_sold`, and `credit_sales`.
- Stock alerts and stock attention:
  - `useProducts().getAllProductsQuery`
  - Derive low stock and out-of-stock products locally using `LOW_STOCK_THRESHOLD`.
  - Sort attention rows with out-of-stock first, then lowest quantity.
- Utang alerts and priority suki:
  - `useCredits().useCreditKPIs()`
  - Use `useCredits().useCustomers('with_balance', 'balance_desc')` or the nearest existing customer
    query shape for top outstanding balances.
  - Prioritize overdue suki first when available, then highest outstanding balance.
- Recent sales:
  - `useSales().getAllSalesQuery`
  - Show the three newest sales by stored timestamp.

Only use `useReports()` if implementation reveals a required metric is not available from the simpler
domain hooks.

## Component Design

Add dashboard-specific presentational components under `components/dashboard/`:

- `DashboardHero`
- `DashboardQuickActions`
- `DashboardAlertCards`
- `DashboardAttentionSection`
- `DashboardEmptyState`
- Optional `DashboardSkeleton` if the loading layout becomes clearer as a separate component.

The route should compose these components in `app/(tabs)/index.tsx`. Derived data may live in the
route file or a small local helper under `components/dashboard/` if it improves readability. Do not
create a new global store or dashboard DB layer for this pass.

Use the new Sari Dashboard emotion from `master-prompt-for-sari.md` as the screen companion when a
generated `sari-dashboard-state.png` asset is available. The companion should support the hero,
empty/setup nudges, or attention queue microcopy without blocking use of the primary actions.

## States And Behavior

### Loading

- Show skeleton surfaces matching the final Dashboard hierarchy.
- Avoid a centered spinner-only screen.

### Empty Setup State

When there are no products or sales yet:

- Keep the Dashboard shell visible.
- Show setup nudges in place of empty modules.
- Primary nudges:
  - Add Product
  - Start First Sale
- Do not add a full onboarding checklist.

### Refresh

- Pull-to-refresh refetches the dashboard's local queries.
- Refresh should cover sales stats, sales list, products, credit KPIs, and customer balance data.

### Android Back

- Preserve the existing home-screen exit confirmation behavior if it remains needed after the screen
  replacement.

## Visual Direction

- Follow the current app's warm paper/receipt system.
- Use existing tokens such as `paper-*`, `ink-*`, `cinnamon-*`, `persimmon-*`, `sage-*`, and semantic
  danger/success colors.
- The hero should be the strongest visual element on the screen.
- Quick actions should feel more important than KPI tiles.
- Alert cards should be compact and actionable, not report-like.
- Sari's dashboard emotion should make the screen feel attentive and friendly, but should not occupy
  space needed by today's sales or the three quick actions.
- Motion may use Moti for subtle entrance animation, following existing tab patterns.

## Acceptance Criteria

- `/` renders a Dashboard, not the stock list.
- The bottom tab still labels `/` as Dashboard.
- Today's sales hero renders with real local sales data.
- New Sale opens the add-sales form.
- Add Stock opens the Inventory tab.
- Record Payment opens the Utang tab.
- Low/out stock counts match product quantities and `LOW_STOCK_THRESHOLD`.
- Outstanding utang matches credit KPI/customer data.
- Attention sections show at most three rows each.
- Empty setup state is useful with no products or sales.
- No DB schema changes are introduced.
- No network calls are introduced.
- No business data is cached in Zustand.

## Test Scenarios

- Empty database renders Dashboard shell plus setup nudges.
- Seeded products with no sales render stock alerts and zero sales.
- Products below threshold appear in the stock attention section.
- Out-of-stock products sort before low-stock products.
- Customers with outstanding balances render utang alert and priority suki rows.
- Overdue suki, when present, take priority over merely high-balance suki.
- Recent sales show the newest three transactions.
- Pull-to-refresh refetches all dashboard queries.
- All three quick actions route to the approved destinations.
- Money values render through existing money formatting helpers.
- If the dashboard Sari asset is present, it renders in the Dashboard without covering primary
  metrics or actions.

## Assumptions

- Approved layout direction is **Counter Command Center**.
- Dashboard priority is **Act Fast**.
- Content depth is **top 3 only** per attention section.
- Attention queue order is **Stock**, then **Utang**, then **Sales**.
- Add Stock and Record Payment route to their owning tabs because existing form routes require product
  or customer context.
- The dashboard Sari image asset is not generated as part of this spec unless requested separately.
