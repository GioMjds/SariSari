---
title: ADR-004 Supplier Payables Ledger
description: Records what the owner owes each supplier (utang sa supplier) as payables created from committed delivery receipts and one-time opening balances, paid FIFO, with cash payments flowing into the cash_movements view.
type: adr
status: accepted
tags: [adr, architecture, suppliers, deliveries, cash, sqlite, offline-first]
created: 2026-11-28
---

## Status

Accepted on 2026-11-28. Resolves challenge #4 in `docs/store-owner-challenges.md`.

## Context

Owners take goods on credit from agents and wholesalers. Until now the app had no record of this, so cash flow looked fine until the agent came to collect. Delivery receipts (migration v23) record what arrived and its cost, but not whether it was paid.

## Decision

1. **Three tables, migration v28.** `supplier_payables` holds one debt per committed receipt (`receipt_id UNIQUE`), or an opening balance (`receipt_id IS NULL`, at most one active per supplier). `supplier_payments` holds each payment. `supplier_payment_allocations` links payments to payables, so a payment can be reversed exactly. `suppliers.payment_terms_days` is a new nullable column, where null means pay on delivery.
2. **Amount owed is the invoice amount**, `SUM(entered_received_qty * entered_unit_cost)`, not the rounded per-piece `received_qty * actual_unit_cost`.
3. **Created inside the commit transaction.** `commitDeliveryReceipt(receiptId, payment?)` inserts the payable after the status flip. When no choice is passed, a supplier with terms defaults to Pay later (due on received date plus terms), and a supplier without terms defaults to Paid now. Paid now also writes a full cash payment in the same transaction. It needs no PIN, because it is part of receiving.
4. **FIFO allocation**, ordered by due date with nulls last, then created time. This mirrors `insertPayment` in `database/credits.ts`. An overpayment is refused with `SupplierOverpaymentError`.
5. **Drawer effect through `cash_movements`** (see [[ADR-003-unified-physical-cash-ledger]]): a `supplier_payment` branch, negative, only when `payment_method = 'cash'`. Legacy `cash_entries` is not written.
6. **Void safety.** Voiding a receipt cancels its unpaid payable. If any payment is allocated to it, the void is refused with `ReceiptHasPaymentsError` until the owner reverses the payment.
7. **Owner PIN** gates recording or reversing a payment (`supplier_payment`) and setting an opening balance (`supplier_opening_balance`). Anyone can view balances.
8. **Home attention card** gains a `supplierDue` item: danger when anything is overdue, warning when something is due within 3 days.

## Consequences

- Owners see per-supplier debt and due dates on the Supplier payables screen, opened from Restock or the Home card.
- Expected drawer cash now drops when the owner pays an agent in cash, including on delivery. Before this, deliveries never touched the drawer number.
- Receipts committed before v28 have no payable. Debt that existed before the upgrade goes in as an opening balance.
- Profit and COGS are unchanged. Payables track cash obligations only.

## Deferred

- Push reminders before the due date.
- Payable aging report and a supplier statement.
- Editing a single payable's due date after commit.
- Returnable bottle deposits (challenge #12). Supplier-side empties ledger: see ADR-006.

## Related

- [[ADR-003-unified-physical-cash-ledger]]
- [[decisions-moc]]
