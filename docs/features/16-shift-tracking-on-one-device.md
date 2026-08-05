# 16. Shift Tracking on One Device

> Phase: Later

## Problem

The store is run by one person on one device, but in many households
there is a daytime owner and an evening helper, or a spouse who
covers the morning. When cash variances show up at close-out
(feature 3) or when a void (feature 7) needs investigating, the
owner has no idea whose shift it was. Blame drifts to whichever
helper was around most recently, which is unfair and unhelpful.
Multi-device accounts are overkill; on one device, a lightweight
shift model is enough.

## User Story

As a store owner, I want to mark which cashier is at the register
for the current shift, so cash variances and corrections have a
person attached.

## In Scope

- A small list of "Cashiers" the owner adds (name + optional
  short PIN — different from the owner PIN, scoped to the
  cashier's actions only).
- An "Active cashier" indicator on the POS tab; one tap to switch
  active cashier (or sign out to a generic "owner direct" state).
- A "Shift open" / "Shift close" pair of actions. Opening records
  the active cashier and the opening float. Closing records the
  closing float and the variance.
- All voids (feature 7), stock adjustments (feature 4), and cash
  ledger entries (feature 3) record the active cashier at the
  time, so corrections and variances have attribution.
- A "Shifts" report listing recent shifts with their variance.

## Out of Scope

- Multi-device accounts. One device, one store, one or two people
  sharing the register.
- Payroll, scheduling, or attendance. The shift is just a label
  for attribution.
- Cashier-specific permissions beyond a per-cashier PIN for "I am
  this person" identification. Sensitive actions remain owner-
  PIN-gated (feature 11).

## Data Implications

- New table `cashiers`: `id`, `name`, `pin_hash` TEXT, `pin_salt`
  TEXT, `is_active` INTEGER, `created_at` TEXT.
- New table `shifts`: `id`, `cashier_id` (FK), `opened_at` TEXT,
  `closed_at` TEXT, `opening_float` INTEGER, `closing_count`
  INTEGER, `variance` INTEGER, `variance_reason_code` TEXT.
- Add `cashier_id` column to `sale_corrections` (feature 7),
  `inventory_transactions` (already has a `note`; add a nullable
  `actor_cashier_id` column), and `cash_ledger_entries`
  (feature 3) for attribution.
- New functions in a new `database/shifts.ts`:
  `openShift({ cashierId, openingFloat })`,
  `closeShift({ closingCount, varianceReason })`,
  `getActiveShift()`,
  `listShifts({ from, to })`.
- New hook in a new `hooks/useShifts.tsx`.
- New migration bumping `user_version` past 9.

## Dependencies

- Builds on feature 3 (daily cash close-out) — a shift close is
  effectively a per-shift close-out, with the daily close-out
  rolling up the active shift(s) for that day.
- Builds on feature 7 (voids/refunds) — `sale_corrections` needs
  to capture cashier_id.
- Shares the hashing model with feature 11 (owner PIN).

## Open Questions

- Is the cashier PIN really needed, or is selecting a name from a
  list enough? A name-only list is faster but anyone can claim
  any name.
- How do shifts cross midnight? A "shift" is anchored to the
  person, not the calendar day; the daily close-out (feature 3)
  rolls up whatever shifts were open that day.
- Is there a "no active cashier" mode for the owner working solo?
  Recommend yes — an explicit "Owner direct" pseudo-cashier.

## Feasibility Notes

- The data model is small. The risk is creep: this feature could
  grow into a full HR system. The brief's scope check (above) is
  the guardrail.
- Money: opening and closing floats are integer-pesos; no money
  parsing outside `lib/money.ts`.
- Hashing of cashier PINs should use the same vetted algorithm as
  feature 11 to keep the security model consistent.
