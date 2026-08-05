# 12. Customer Credit Statements

> Phase: Next

## Problem

Suki ask for their balance. "Ano na utang ko?" The owner has to stop
what they are doing, run the math, and answer. Sometimes the suki
disputes an amount, or the owner needs to settle accounts at the end
of a long relationship. There is no portable, on-the-spot way to
show a suki "here is what you bought, here is what you paid, here
is what remains." The store either has to handwrite a list or tell
the suki to trust the owner's word.

## User Story

As a store owner, I want to print or share a credit statement for a
suki, so the suki has a written record and the owner has proof of
what was extended and what was paid.

## In Scope

- A "Statement" action on a suki profile that generates a printable
  / shareable document covering a chosen date range (default: last
  30 days, or since last statement).
- The statement shows, in order: opening balance, every credit
  transaction with date and amount, every payment with date and
  amount, closing balance.
- Two output formats:
  - PDF, generated through the existing `lib/pdfGenerator.ts`
    helper. The PDF is openable in any device PDF viewer.
  - A simple, text-only "share" payload (plain text or HTML) for
    messaging apps that do not render PDFs well.
- The statement is shareable through the device's native share
  sheet (no in-app messaging, no email server).
- Generation is fully offline.

## Out of Scope

- Printing on a thermal printer from inside the app. The share
  sheet can route to a printer, but the app does not need a
  printer driver.
- Watermarking or signing the PDF. The statement is informal and
  trusted by the relationship, not by crypto.
- Bulk statements. One suki at a time is the workflow.

## Data Implications

- No new tables. The data is already in `credit_transactions` and
  `payment_allocations`, with the FIFO allocation from migration
  v3.
- New function in `database/credits.ts`:
  `getCustomerStatement(customerId, { from, to })` returning
  `{ openingBalance, lines: Array<{ date, kind, amount, refId }>,
  closingBalance }`. The opening balance is computed at the
  cutoff date using the same `SUM(amount) - SUM(amount_paid)`
  formula used everywhere else.
- New function (or extension) in `lib/pdfGenerator.ts` for the
  statement layout. The existing module is the integration point;
  follow its conventions.
- New hook in `hooks/useCredits.tsx` exposing the statement
  builder and a "share" trigger using `expo-sharing` (if already
  in the project) or a comparable native share API.
- No migration.

## Dependencies

- The `lib/pdfGenerator.ts` module must already support the
  primitives this feature needs (tables, totals, page breaks).
  If it does not, expand the module first.

## Open Questions

- Date range default: since-last-statement is friendly, but
  requires a "last statement generated at" column. Cheaper
  default: trailing 30 days.
- Does the statement include a per-line item breakdown (what
  products were bought), or only the credit total per
  transaction? The richer version is more useful for disputes
  but more work to render and more space on the page. Recommend
  the rich version with a toggle to collapse.
- Is the statement generated on demand, or cached? On demand is
  simpler and the data is local.

## Feasibility Notes

- The integer-pesos rule applies: statement amounts are
  `formatPesos`-formatted on render, never re-parsed.
- The PDF generator should be tested with edge cases: zero
  transactions in the range, a payment that closes multiple
  credits, a credit that was partially voided (feature 7).
- No new external libraries required. The existing
  `lib/pdfGenerator.ts` plus the standard React Native share
  APIs are enough.
