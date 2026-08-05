# 03. Daily Cash Close-Out

> Phase: Now

## Problem

At the end of the day the owner needs to reconcile the till. They open
the drawer, count what is actually there, and compare it to what the
register says should be there. Today this is a mental exercise against
an Excel sheet or a notebook. Cash that disappears into the
household budget, into suki change, or into a counting mistake is
invisible. Over a month that can be a meaningful amount, and the
owner has no audit trail to investigate.

## User Story

As a store owner closing up for the night, I want to record the day's
opening float, every cash-in and cash-out, the counted drawer, and the
expected vs. actual variance with a reason, so I can spot and stop
silent cash loss.

## In Scope

- A daily close-out record capturing: opening float, total cash sales
  (computed from `sales`), total cash refunds/voids (when feature 7
  lands), total cash received for utang payments, total cash paid out
  (gastos, owner cash draws), closing count, and variance.
- A "Cash In / Cash Out" log for non-sale cash movements
  (withdrawals, supplier cash purchases, change brought in from
  home), each with a reason code and optional note.
- Variance reason codes (counting error, suki change, suspect, etc.)
  that surface in a simple monthly summary.
- A "Close day" confirmation that locks the record and shows it on a
  history list.

## Out of Scope

- Real-time cash-register tracking. Counts only happen at close.
- Multi-shift handover (this is single-owner; shift tracking is
  feature 16).
- Bank reconciliation, deposit tracking, or any banking integration.

## Data Implications

- New table `cash_ledger_entries`: `id`, `date`, `direction` ('in' /
  'out'), `amount` INTEGER, `reason_code` TEXT, `note` TEXT, `sale_id`
  (nullable FK to `sales`), `created_at`. Backfill from existing
  `sales` so the close-out math is reproducible.
- New table `daily_close_outs`: `id`, `date` (UNIQUE), `opening_float`
  INTEGER, `closing_count` INTEGER, `expected_cash` INTEGER,
  `variance` INTEGER, `variance_reason_code` TEXT, `variance_note`
  TEXT, `closed_at` TEXT.
- New functions in `database/cash.ts` (which already exists):
  `getCashMovementForDate(date)`,
  `insertCashLedgerEntry(entry)`,
  `closeDay({ date, openingFloat, closingCount, varianceReason })`.
- New hook in `hooks/useCash.tsx` for the close-out screen.
- The "expected cash" is computed at close time from
  `opening_float + SUM(cash_in) - SUM(cash_out)`, all integer
  arithmetic. The new code path must go through `lib/money.ts` for
  any input/display formatting.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 7 (safe voids/refunds) — voids and refunds need to flow
  into the daily cash movement so the close-out math stays correct.
  For the initial cut, the close-out can assume no voids and
  document the dependency for later.

## Open Questions

- Does the owner need to be able to edit a previous close-out (in
  case of a miscount they discover the next morning)? If so, edits
  must be append-only with a `corrected_by` row rather than
  overwriting.
- What is the retention policy for cash ledger entries? Indefinite
  on-device is fine until feature 17 (backup) ships; after that,
  consider a "compact after N years" path.
- How do we handle a day that was never closed? The dashboard should
  surface a stale-day warning, not invent a close-out.

## Feasibility Notes

- All data is local SQLite, fits the offline-first model.
- Money flows only through integer-pesos columns and `lib/money.ts`.
- A close-out is a single multi-statement transaction wrapping the
  close-out row insert and the variance calculation; existing
  `db.withTransactionAsync` covers it.
- The close-out screen becomes the natural anchor for the existing
  `app/gastos-kaha/` flow (gastos) — they can share the cash ledger.
