# 05. Utang Guardrails at Checkout

> Phase: Now

## Problem

Utang is the social contract of the sari-sari store. But the same
contract makes it easy to extend more credit than the suki can or
will pay back. Today the cashier sees a customer name on the credit
sale but no live signal: the running balance, the credit limit (if
any), the days-overdue on the oldest unpaid credit, or whether this
suki is at risk. Decisions are made from memory. Over time the
owner's receivables balloon and bad debt becomes the single largest
risk to the business.

## User Story

As a store owner ringing up a credit sale, I want to see the suki's
current balance, available credit, and overdue status right on the
checkout screen, so I can decide in the moment whether to extend
more utang or ask for a partial payment.

## In Scope

- A live suki panel on the credit-payment path showing: current
  outstanding balance, credit limit (if configured per customer),
  available credit, and an overdue badge if any unpaid credit is
  past N days (default 30, configurable per owner).
- A "Limit exceeded" warning that blocks confirmation by default and
  requires an explicit owner override (PIN entry — relies on feature
  11) to proceed.
- A non-blocking warning when the suki is "near limit" (e.g. within
  20%) so the cashier can still choose to extend.
- An "Override reason" picker when the owner override is used, with
  the reason recorded on the resulting sale for later audit.

## Out of Scope

- Risk scoring or auto-decisioning. (Feature 15 covers the
  "smarter but explainable" path; this feature is the
  display-and-warn foundation.)
- Notifying suki via SMS. No outbound communication at all.
- Hard-blocking all credit sales; the owner always has the final
  say via override.

## Data Implications

- New columns on `customers`: `credit_limit` INTEGER (nullable —
  null means "no limit, just track balance"), `overdue_threshold_days`
  INTEGER (per-owner default, can be overridden per suki).
- New computed view or function in `database/credits.ts`:
  `getCustomerCreditSummary(customerId)` returning `{ balance,
  availableCredit, oldestUnpaidDate, overdueDays, isOverdue }`. This
  is already a derived value from `credit_transactions` and
  `payment_allocations`; this feature just packages it.
- New hook in `hooks/useCredits.tsx` to feed the checkout screen.
- The override is recorded as a column on the `sales` row:
  `override_reason_code` TEXT (nullable). Requires a small migration
  adding that column to `sales`.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 11 (owner PIN) is a hard dependency for the override
  flow. Without PIN, the override is just a "reason" picker with no
  gate, which defeats the point. The rest of this feature (display
  + warn, no override) can ship ahead of 11.
- Feature 15 (smarter credit profiles) builds on this and can be
  retrofitted without schema churn.

## Open Questions

- Is the credit limit a hard "balance cannot exceed" cap, or a
  soft "warn when exceeded" cap? Default should be soft with
  per-owner toggle to hard.
- What is the default overdue threshold (days)? The CLAUDE.md and
  index.md do not pin this; the implementation plan should pick a
  sensible default (30 days) and let the owner change it.
- Does the suki panel show on a cash sale too (informational) or
  only when the suki is already attached to the credit path?
  Showing on cash sales is friendlier but adds visual weight.

## Feasibility Notes

- Suki balance is already computed live per the CLAUDE.md
  financial-guardrail rules: `SUM(amount) - SUM(amount_paid)` over
  unpaid `credit_transactions`. This feature does not change that
  computation, it surfaces it.
- The `payment_allocations` FIFO logic from migration v3 is what
  makes the live balance correct; this feature relies on it
  without modification.
- Money display goes through `lib/money.ts`. The `credit_limit`
  column is integer-pesos, matching the project's invariant.
- Owner override ties into feature 11, so the UI for that override
  should be built so it can adopt the PIN prompt later without
  rework.
