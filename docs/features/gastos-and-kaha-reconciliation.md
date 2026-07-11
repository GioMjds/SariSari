# Gastos & Kaha Reconciliation

## Summary

Build an offline financial ledger for paid business expenses and owner drawings. Reports will show true operating profit as all completed sales − COGS − operating expenses, while
displaying owner drawings separately. Full opening/closing cash reconciliation remains a later phase.

## Key Changes

- Add a version-10 migration and FinancialEntry / FinancialEntryReceipt contracts:
  - Entry types: expense and owner_drawing.
  - Positive integer-peso amounts; date, note, timestamps; fixed expense categories only.
  - Multiple receipt records per expense; max five receipt photos.

- Create the database and TanStack Query layers for listing, creating, updating, deleting, and date-range aggregation. Mutations invalidate both financial and reports query roots.
- Add a Reports entry point for a Gastos & Drawings ledger with fast entry actions and editable activity history. Expense forms include category and optional receipt photos; drawing
  forms do not.

- Update report KPIs and UI:
  - Show gross profit, paid operating expenses, and true operating profit.
  - Show owner drawings beside—not inside—the profit calculation.
  - Withhold gross/true profit unless every sold unit in the selected period has a recorded cost price; retain expense and drawing totals with an actionable explanation.
  - Treat inventory restocks as COGS inputs, never operating expenses.

- Store receipt media in an app-owned directory and extend backup/restore to a versioned bundle containing database, receipt files, and a manifest. Preserve transactional restore
  safety and support legacy database-only backups without receipts.

- Update the Google Drive backup artifact to upload/download the same bundle; no network call is added to core ledger or report flows.

## Test Plan

- Database tests for integer-peso validation, entry/category rules, backdating, edits, confirmed deletes, and date-range totals.
- Report tests for cash and utang sales, expense subtraction, drawings exclusion, no sales, and incomplete versus complete cost coverage.
- Receipt tests for five-photo limit, cleanup on deletion, and inaccessible/missing media handling.
- Backup tests for local/cloud bundle round-trips, failed-restore rollback, and legacy database-only restores.
- Run typecheck, lint, and the full Jest suite.

## Assumptions

- Expenses are recorded only when paid; unpaid bills, capital injections, taxes, budgets, recurring expenses, and accounts are out of scope.
- Starter categories are Transport, Utilities, Supplies & Packaging, Rent, Repairs, and Other; notes remain optional.
- Revenue includes completed utang sales at sale time; collections do not change profit.
- Physical cash counting, daily sessions, variance reconciliation, and a running capital balance are phase-two work.
- The approved design should be saved as docs/superpowers/specs/2026-07-11-gastos-kaha-design.md and committed when Plan Mode ends, before implementation begins.
