# Cash and Stock Control

## Summary

Add an offline-first daily cashbook and owner-reviewed stock recommendations for a single sari-sari store. The feature uses existing sales, utang payments, inventory, product costs,
and supplier links to improve working-capital and restocking decisions.

## Key Changes

- Add daily cash sessions with opening cash, close count, status, and a computed expected-cash balance.
- Add cashbook entries for expenses, owner withdrawals, and owner cash additions; cash sales and cash utang payments remain source transactions and are included in the computed
  balance, not duplicated.

- Provide an end-of-day close flow that shows expected versus counted cash and records any variance without altering historic sales.
- Add a Stock Intelligence view with low/out-of-stock, slow-moving, and reorder recommendations.
- Calculate reorder quantity as max(0, 7 days of demand - on-hand stock), using the last 28 calendar days of local sales. Use whole units only.
- Show the recommendation’s reason, current quantity, recent sales, suggested units, preferred supplier when assigned, and estimated spend from product cost.
- Mark products with fewer than seven days of sales history as watch items; products without cost still receive quantity guidance but have no spend estimate.
- Let owners adjust, dismiss, or defer suggestions. No automatic stock updates, supplier orders, payment integrations, cloud dependency, or multi-branch behavior.
- Add typed database, hook, and UI surfaces following the existing database/ → hooks/ → app/ layering; all monetary values remain integer pesos.

## Public Interfaces

- Introduce CashSession, CashEntry, NewCashEntry, CashSessionSummary, and ReorderRecommendation domain types.
- Expose query/mutation hooks for opening and closing a session, recording/deleting manual entries, reading the current daily summary, and listing reorder recommendations.
- Add query-key roots that invalidate cashbook summaries after sales, cash payments, and manual cash-entry mutations.

## Test Plan

- Verify expected cash for cash sales, cash utang payments, expenses, withdrawals, owner additions, and close-count variance.
- Verify a session cannot be closed twice and manual entries cannot be written to a closed session.
- Verify recommendation quantities for fast-selling, low-stock, zero-stock, slow-moving, insufficient-history, and missing-cost products.
- Verify suggested spend uses integer-peso costs and supplier information is optional.
- Run the existing database, money, POS, inventory, utang, typecheck, and lint suites.

## Assumptions

- A business day follows the device’s local calendar day.
- Existing cash sales and payments are treated as cashbook inflows; credit sales are excluded.
- The recommendation window is 28 days and the stock target is seven days, with both treated as fixed v1 defaults.
- The owner enters physical cash counts and non-sale cash movements manually.
