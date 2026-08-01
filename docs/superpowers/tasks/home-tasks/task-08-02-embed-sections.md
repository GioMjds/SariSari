# Task 08-02: Embed KPI grid, GoalCard, StockAlert, QuickActions, Suggestions, RecentSales, TopSeller

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Replace the placeholder `<></>` in the Overview render tree with the seven remaining sections in the spec order.

## Dependencies

- [08-01](./task-08-01-rewrite-overview-shell.md)

## Files

- Modify: `app/(tabs)/home/index.tsx`

## Steps

- [ ] **Step 1: Replace the placeholder fragment with the seven sections**

In `app/(tabs)/home/index.tsx`, replace the line:

```tsx
{/* Sections 2–8 are added in task-08-02 */}
<></>
```

with:

```tsx
{/* 2. KPI 2x2 grid */}
<DashboardKPIGrid
  totalSales={stats.todaySalesTotal}
  transactionCount={stats.transactionCount}
  profitMargin={stats.profitMargin}
  cashSessionStatus={
    currentSession?.status === 'closed' ? 'Closed' : 'Open'
  }
  startingFloat={
    currentSession?.startingFloat
      ? currentSession.startingFloat / 100
      : 500
  }
  lowStockCount={stats.lowStockCount}
  totalCredits={stats.overdueAmount}
  creditCustomersCount={stats.overdueCount}
  onDetailsPress={() => router.push('/reports' as Href)}
  onKpiPress={(target) => {
    if (target === 'inventory') router.push('/inventory' as Href);
    else if (target === 'utang') router.push('/utang' as Href);
    else if (target === 'cash')
      router.push('/(edit-forms)/cash-session' as Href);
    else router.push('/reports' as Href);
  }}
/>

{/* 3. GoalCard */}
<DashboardGoalCard
  recommendation={goal}
  onPress={() => handleGoalAction(goal)}
/>

{/* 4. StockAlert (conditional) */}
{stats.lowStockCount > 0 && (
  <DashboardStockAlert
    lowStockCount={stats.lowStockCount}
    onRestock={() => router.push('/inventory' as Href)}
  />
)}

{/* 5. Quick Actions */}
<DashboardQuickActions
  onNewSale={() => router.push('/(tabs)/sales/pos' as Href)}
  onAddProduct={() => router.push('/(edit-forms)/add-product' as any)}
  onAddStock={() => router.push('/inventory' as Href)}
  onOpenCredits={() => router.push('/utang' as Href)}
  onOpenReports={() => router.push('/reports' as Href)}
  overdueCount={stats.overdueCount}
/>

{/* 6. Suggestions (conditional — already filtered by resolveHomeState) */}
{suggestions.length > 0 && (
  <DashboardSuggestions
    suggestions={suggestions}
    onPress={handleSuggestionPress}
  />
)}

{/* 7. Recent Activity */}
<DashboardRecentSales
  sales={recentSales}
  onOpenSale={(id) =>
    router.push(`/(edit-forms)/sale-details/${id}` as Href)
  }
  onSeeAll={() => router.push('/sales' as Href)}
/>

{/* 8. Top Seller */}
<MiniInsightsCard
  topProductName={topProduct.name}
  unitsSold={topProduct.unitsSold}
/>
```

## Commit

None yet — verification + commit happen in `task-08-03`.