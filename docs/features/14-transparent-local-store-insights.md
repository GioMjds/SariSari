# 14. Transparent Local Store Insights

> Phase: Later

## Problem

The owner accumulates a year of sales data, restock data, and suki
history, and has no time to mine it. They suspect patterns
("Coke always runs out by Friday," "Mang Jose's account is
trouble") but cannot confirm them. External analytics tools ask for
their data; the owner does not want to upload it. The data is right
there on the device, unused.

## User Story

As a store owner, I want a small set of plain-language insights
derived from my own store's history, so I can act on the patterns
without a spreadsheet.

## In Scope

- A "Tips" surface in the app, computing on-device only, showing a
  short list of actionable observations:
  - Items that repeatedly stock out (negative shelf days in the
    last 60 days, based on `inventory_transactions` and current
    `products.quantity`).
  - Dead stock (no sales in the last 90 days, occupying capital and
    shelf).
  - Margin changes where `cost_price` rose or fell materially over
    the last 30 days.
  - Suki payment patterns: which suki pay on time, which are late,
    which have ballooning balances.
- Each tip is explainable: tapping it shows the underlying numbers
  (period, products, suki, sums) so the owner trusts the tip.
- Tips regenerate nightly and on demand. No background work that
  the user did not ask for.

## Out of Scope

- Cross-store comparisons, benchmarks, or anything that needs data
  from outside this device.
- Predictive or ML-based recommendations. "Insight" here means a
  derived fact, not a model output.
- Push notifications for new tips.

## Data Implications

- No new tables. All signals are derivable from existing tables
  (`sales`, `sale_items`, `inventory_transactions`, `products`,
  `credit_transactions`, `payment_allocations`).
- A computed view in `database/stock-intelligence.ts` (or a new
  `database/insights.ts`): `getStoreTips()` returning a small list
  of typed tip objects. Each tip is fully self-describing so the UI
  can render its explainer without a second query.
- The existing `useStockIntelligence` hook can be extended, or a
  new `hooks/useInsights.tsx` can be added.
- No migration.

## Dependencies

- Shares velocity and signal math with feature 9 (reorder
  suggestions) and feature 10 (stock movement timeline). The three
  should agree on a common "what is a stockout" / "what is dead
  stock" definition; coordinate early to avoid drift.
- Feature 15 (smarter credit profiles) shares the suki payment
  pattern computation.

## Open Questions

- How often does the tips list regenerate? On every app open is
  fine, but a heavy regeneration could be jarring. A nightly
  cache plus on-demand "refresh" is friendlier.
- What is the max number of tips shown? Five to seven is a
  reasonable cap; more becomes noise.
- Can the owner dismiss a tip ("I already know this")? Dismissal
  is a UI preference, not a domain fact; recommend not persisting
  it for v1.

## Feasibility Notes

- Every computation is local and reproducible from the data. This
  is the single most important property of the feature: trust
  comes from "I can tap and see the numbers," not from the tip
  being right.
- Money: any money-bearing tip (margin change, dead stock capital
  tied up) uses integer-pesos and `formatPesos` for display.
- Performance: a single device with a year of data is still a
  small dataset for SQLite. The existing indexes from migration
  v4 are sufficient for v1.
