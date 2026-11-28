---
title: ADR-006 Supplier Empties Ledger
description: Tracks softdrink bottles and crates owed back to each supplier, with a swap-time physical count that shows the shortfall in pesos.
type: adr
status: accepted
tags: [adr, architecture, suppliers, returnables, sqlite, offline-first]
created: 2026-11-28
---

## Status

Accepted on 2026-11-28. Resolves the supplier side of challenge #12 in `docs/store-owner-challenges.md`. Data layer and swap screen are built; the screen has not been run on a device.

## Context

Softdrink agents swap full bottles and crates for empties one-for-one. Customers take bottles home without a deposit, so the owner comes up short at the next swap and pays the shortfall with no record to dispute it. The owner will not tap anything per sale during rush, so the fix works from a weekly count at swap time.

## Decision

1. **Two tables, migration v30.** `supplier_empties` holds one row per empties type per supplier (for example "1L bottle", "crate") with a whole-peso deposit. `empties_movements` is an append-only signed ledger with kinds `received_full`, `handed_back`, `written_off`, `count_adjust`.
2. **Balance is the sum of movements.** Expected owed after a swap is the prior balance plus full received minus empties handed back.
3. **Swap count.** The owner enters the physical count. Shortfall is expected minus counted, and shortfall pesos is shortfall times deposit. The shortfall is written as a `count_adjust` movement, so the ledger matches what the owner holds and the record stays for disputes.
4. **No payable posting in v1.** A payable with `receipt_id NULL` is read as the supplier's single opening balance (`hasOpeningBalance`), so a shortfall payable would collide with it.
5. **No checkout changes.** Per-customer bottle tracking is out of scope.

## Consequences

- Owner sees empties owed and pesos at risk per supplier, and a dated record of each swap.
- Success is a hypothesis: a swap count under a minute and fewer unexplained shortfalls. Validate in owner interviews.

## Deferred

- Posting shortfall to supplier payables (needs a non-opening-balance payable kind).
- Gin, LPG, customer deposits, reminders.

## Related

- [[ADR-004-supplier-payables]]
- [[decisions-moc]]
