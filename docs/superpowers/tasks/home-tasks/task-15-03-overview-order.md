# Task 15-03: Verify Overview sections render in order

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Scroll the Overview from top to bottom and confirm the sections appear in the spec order with the right conditional rendering.

## Dependencies

- [15-01](./task-15-01-dev-server-up.md)

## Files

- None

## Steps

- [ ] **Step 1: Visual check**

Scroll the Overview from top to bottom and verify this order:

1. Slim total-sales hero (TOTAL SALES TODAY label + amount + transaction count + RECORDED badge).
2. KPI 2x2 grid (Est. Profit, Cash Session, Low Stock, Credits Due).
3. GoalCard with a single CTA reflecting the current state.
4. (Conditional) StockAlert slim banner — only when Low Stock count > 0.
5. Quick Actions ("+ New Sale" hero + 2x2 actions).
6. (Conditional) Suggestion strip — only when suggestions are non-empty.
7. Recent Activity (up to 3 sales + "View all sales").
8. Top Seller dark strip.

## Next

Proceed to [Task 15-04](./task-15-04-profit-no-912.md).