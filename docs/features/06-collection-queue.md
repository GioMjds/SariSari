# 06. Collection Queue

> Phase: Now

## Problem

Collecting utang is awkward. The owner has to remember who owes what,
who's late, and who's near their limit, then ask each one face-to-face
without a record. The mental load is real — every suki they see all
day, they have to compute the balance from memory before deciding
whether to push for a payment. Some owners keep a paper notebook. Most
don't, and the receivables quietly age.

## User Story

As a store owner, I want a clear list of suki who are overdue or near
their limit, with a one-tap way to record a partial or full payment,
so I can collect with confidence and without doing the math in my
head.

## In Scope

- A "Collection" surface under the Customers/Utang tab showing suki
  ranked by collection urgency: overdue first, then near-limit, then
  oldest unpaid balance.
- Per-row summary: outstanding balance, days since last payment,
  oldest unpaid credit age, near-limit flag.
- A "Record payment" action that opens a small amount-and-method
  sheet and writes through the existing `payments` +
  `payment_allocations` flow (FIFO allocation is preserved).
- An optional "Follow up by" date per suki, surfaced as a small
  reminder chip. Local-only; no notifications.
- A "Mark contacted" log entry per follow-up, so the owner can see
  they have already nudged someone today.

## Out of Scope

- SMS, call, or any outbound communication.
- Auto-reminders or push notifications. Single-device, no backend.
- Collections agencies or third-party workflows.

## Data Implications

- New table `collection_followups`: `id`, `customer_id` (FK),
  `follow_up_by` TEXT (date), `status` ('open' | 'contacted' |
  'closed'), `note` TEXT, `created_at` TEXT.
- A new function in `database/credits.ts`:
  `getCollectionQueue({ overdueDays, nearLimitPct })` returns the
  ranked list using the same `credit_transactions` /
  `payment_allocations` SQL the rest of the app uses.
- New hook in `hooks/useCredits.tsx` returning the queue.
- "Record payment" reuses the existing payment recording path
  (`add-payment` route under `app/(edit-forms)/`). No new mutation
  is needed; this feature is primarily a presentation layer over
  what already exists.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 5 (utang guardrails at checkout) — the per-suki
  balance, limit, and overdue data are the same; this feature
  reads them. The schemas need to align, but the queue itself can
  ship first with simpler "balance + days overdue" criteria.
- Feature 15 (smarter credit profiles) — once profiles exist, the
  queue can rank by profile as well as by raw balance/age.

## Open Questions

- How aggressive is the default ranking? Pure "overdue first" or a
  weighted score?
- Does the queue live under the Customers tab or as a separate top-
  level tab? Index.md implies "under customers / utang"; the
  routing decision can be made at implementation time.
- Is the "Follow up by" date a soft chip (just shown) or does it
  require notifications? Per scope, soft chip only.

## Feasibility Notes

- The credit/payment tables are already correct: `payment_allocations`
  with FIFO, reversible on payment delete. This feature does not
  introduce new money math — it surfaces what exists.
- The "Record payment" tap can deep-link to the existing
  `add-payment` screen with the customer pre-selected, so no new
  payment form is needed.
- Follow-ups are local, single-device, single-user. No sync.
- Performance: with the existing
  `idx_credit_transactions_status_date` index, the queue query is a
  cheap range scan.
