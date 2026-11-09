---
title: ADR-003 Unified Physical-Cash Movement Ledger
description: Replaces the retired cash-session model with a single derived ledger (the cash_movements SQL view) that gives every physical drawer effect one auditable row. First new source is e-services.
type: adr
status: accepted
tags: [adr, architecture, cash, financial, sqlite, offline-first]
created: 2026-11-09
---

## Status

Accepted on 2026-11-09. Resolves Task 0 of [[2026-08-22-selective-more-operations-tools-plan]].

## Context

The authoritative model for expected drawer cash was undecided. Three things coexist today:

- Legacy `cash_sessions` and `cash_entries` (`database/cash.ts`). New sessions can no longer be opened. `getCashSessionSummary` computes `expectedCash` as opening cash, plus cash sales, plus cash utang payments, plus owner additions, minus expenses, owner drawings and cash refunds.
- The newer `financial_entries` ledger (`database/financial.ts`) for expenses and owner drawings.
- Cash corrections (see [[ADR-002-safe-voids-refunds-corrections]]) still gate on `cash_sessions.status`.

Upcoming features need the same number: [[16-shift-tracking-on-one-device]], [[owner-inventory-consumption-pang-ulam]] and [[e-loading-and-digital-cash-services]]. Without one model, each feature would reconcile drawer cash in its own way.

## Decision

Replace sessions with a unified physical-cash movement ledger. The ledger is derived, not copied.

1. **`cash_movements` is a SQL view**, defined in `database/digitalServices.ts` (`initDigitalServicesTables`). Each row is one signed drawer effect with `source`, `source_id`, `business_date`, `amount_delta` and `label`. No data is duplicated, so no source row can drift from the ledger.
2. **Sources in the first version**:
   - `cash_sale`: `sales` where `payment_type = 'cash'` and `cancelled_at IS NULL`. Positive.
   - `utang_payment`: `payments` where `payment_method = 'cash'`. Positive.
   - `expense` and `owner_drawing`: `financial_entries`. Negative.
   - `e_service`: `digital_transactions.cash_drawer_delta` where not voided. Signed.
3. **Expected drawer cash** over a period equals the counted opening cash plus the sum of `amount_delta`. Only the physical-cash delta of an e-service enters the ledger. The digital principal never counts twice.
4. **Add new sources by extending the view.** A feature that moves physical cash adds one `UNION ALL` branch and an index on its date column. Tables are not altered.
5. **Legacy `cash_sessions` and `cash_entries` stay readable for history.** They are not a source of the view. New code must not call `openSession`, `insertCashEntry` or `closeSession`.

## Deferred

- **Opening and closing count.** The session carried the opening float. A replacement `drawer_counts` table is needed for the closing count and discrepancy review. It belongs with [[16-shift-tracking-on-one-device]].
- **Cash refunds.** Corrections still write `cash_entries` with `cash_refund`. They must move to a ledger-visible source, either a `refund` branch of the view keyed on `sale_corrections.refund_payment_type = 'cash'` or a financial entry type. Tracked under Task 0 acceptance criteria in the planning note. Until then, cash refunds are not in `cash_movements`.
- **Owner additions** (cash put into the drawer) have no non-legacy source yet.
- **Reports integration** (service income on the Income Statement) is a follow-up. `getDigitalServicesSummary` already returns fee totals by date range.

## Consequences

- One auditable, queryable list answers "what changed the drawer". It never needs a migration to a new source.
- No `user_version` bump. The view and the e-service tables are created idempotently at startup, which avoids colliding with the pending delivery-receiving migration (v23).
- Views cannot enforce constraints. Each source table keeps its own validation.
- The expected-cash number is only correct for the sources listed. The Deferred list is the known gap.

## Alternatives considered

- **Restore cash sessions.** Revives a retired flow and keeps two overlapping models.
- **Materialized movement table.** Requires back-filling history and dual writes from sales, payments and entries. A view gives the same read model without either.
- **Standalone e-services.** Stores a drawer delta that nothing reads.

## Related

- [[e-loading-and-digital-cash-services]]
- [[03-daily-cash-close-out|03. Daily Cash Close-Out]]
- [[decisions-moc]]
