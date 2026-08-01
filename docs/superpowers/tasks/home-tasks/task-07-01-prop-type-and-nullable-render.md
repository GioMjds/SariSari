# Task 07-01: Slim DashboardKPIGrid props + render "—" for null profit

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Update the prop type from `profitMargin: number` to `profitMargin: number | null`, and render "—" when null inside the "EST. PROFIT" KPI tile.

## Dependencies

- [06-07](./task-06-07-verify-and-commit.md)

## Files

- Modify: `components/home/DashboardKPIGrid.tsx`

## Steps

- [ ] **Step 1: Update the prop type**

Replace:

```ts
export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number;
  ...
}
```

with:

```ts
export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number | null;
  ...
}
```

- [ ] **Step 2: Render "—" when profitMargin is null**

Inside the `kpis` array, the "EST. PROFIT" entry currently does:

```ts
value: formatCurrency(profitMargin),
```

Replace with:

```ts
value: profitMargin === null ? '—' : formatCurrency(profitMargin),
```

## Commit

None yet — verification + commit happen in `task-07-03`.