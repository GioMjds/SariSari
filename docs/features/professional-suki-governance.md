# Professional Suki Governance

## Summary

Modernize utang as an offline micro-credit workflow: enforce customer credit limits with auditable exceptions, apply 15th/30th settlement cycles to new credit, provide a due-soon/
overdue follow-up queue, and share polite Taglish statements as text or receipt-style PNG. Keep VIP as a derived eligibility signal only.

## Key changes

- Document the approved design in docs/superpowers/specs/ and commit it before implementation.
- Extend customer terms with an optional settlement cycle: 15th, 30th, or both; unscheduled legacy customers retain manual due dates.
- Extend each new credit record with immutable governance audit data: limit snapshot, projected balance, due-date source, and required reason for a limit or date exception.
- Replace direct credit insertion with one transactional governed-credit operation: calculate current balance, determine next payday, validate limit/exception reason, then insert all
  ticket items atomically.

- Update Add Credit to preview due date and projected balance; require owner confirmation and reason on overrides.
- Add a query-backed Utang follow-up queue for credits due within three days, due today, and overdue; group by suki and order overdue first.
- Add offline receipt-image generation and sharing while retaining current text and PDF statement paths. Statement content includes only the selected suki’s relevant unpaid ledger
  items, balance, and due status.

- Surface Good Payor as a derived badge/filter; do not store loyalty state or alter sales, pricing, or inventory.

## Test plan

- Verify next-payday dates for 15th, 30th, both, month ends, and existing unscheduled customers.
- Verify terms changes affect only future credits; manual due-date and over-limit paths require reasons.
- Verify transactional creation prevents stale balance checks and preserves the computed-ledger balance invariant.
- Verify follow-up eligibility and ordering across due-soon, due-today, overdue, paid, malformed-date, and no-schedule cases.
- Verify text and PNG statements include correct integer-peso totals and exclude unrelated data; verify sharing failures fall back safely.
- Run existing credit, sales, and migration tests plus new governance cases with no network access.

## Assumptions and v1 boundaries

- Owners manually review and share reminders; no automated SMS, Messenger, Viber, or background-delivery guarantee.
- Existing PDF export remains available; PNG receipt image is the new primary visual export.
- A limit override and manual due date are permitted only with an owner-entered audit reason.
- VIP is eligibility visibility only: no automatic discounts, stock reservations, or credit-scoring claims
