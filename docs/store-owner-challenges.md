# Sari-Sari Owner Challenges and Gap Map

Status: working draft, 2026-11-27. Every challenge below is a hypothesis from domain knowledge and a code scan. Validate each with pilot store owners before building. No pilot data is cited here.

Severity = money lost or trust broken per week, times how many stores hit it.

- S1: owner loses money or the store stops running.
- S2: owner loses margin or time every week.
- S3: friction or missed upside.

Coverage: Done, Partial, Gap. Based on `database/`, `lib/`, `app/` as of this date.

## S1: Store survival

| #   | Challenge                                                                     | Coverage | Evidence in repo                                   | Gap                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------- | -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Utang never collected; capital silently locked in the notebook                | Partial  | FIFO ledger, follow-ups, aging, limit meter        | Limit not enforced at sale time (planned). No risk profile. No suki-facing reminder flow beyond call/SMS.                                                                           |
| 2   | Phone lost, broken, or wiped; all records gone                                | Partial  | `lib/backup/*` (bundle, Drive, scheduler, restore) | `PRODUCT.md` says "no automatic cloud backup" but a scheduler and Drive code exist. Confirm real behavior and fix the doc. Restore-to-new-phone drill is untested with real owners. |
| 3   | Capital leak: owner takes cash and goods for home use, so "profit" is a guess | Partial  | `owner-draw.tsx`, cash entries                     | Goods taken for home use (not cash) is not a first-class event.                                                                                                                     |
| 4   | Supplier credit: owner owes the agent or wholesaler (utang sa supplier)       | Gap      | No payables table                                  | Largest blind spot. Cash flow looks fine until the supplier visit. Needs payable per delivery, due date, partial payment.                                                           |
| 5   | Helper or family theft, wrong change, unrecorded sales                        | Partial  | Owner PIN policy, corrections, cash sessions       | No per-helper identity on sales, so no accountability. Shrinkage cannot be traced to a person.                                                                                      |

## S2: Weekly margin and time loss

| #   | Challenge                                                                                  | Coverage | Evidence                                                | Gap                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Supplier prices rise (inflation); owner forgets to reprice and sells below cost            | Done     | `reprice.tsx`, `product_price_changes`, `reprice_flags` | Alert when a sale price falls below current cost at checkout.                                                                                                               |
| 7   | Expired or near-expiry goods (canned, noodles, dairy, soft drinks)                         | Gap      | No expiry field; "spoilage" has one hit                 | Needs optional expiry per delivery line, a near-expiry list, and write-off reason. Batch-level tracking is likely over-engineering; start with earliest-expiry per product. |
| 8   | Stockouts of fast movers; lost sales and suki going to the next store                      | Partial  | Days-of-stock-left, reorder plans, palengke sheet       | No simple "buy this today" shortlist tied to supplier visit days.                                                                                                           |
| 9   | Tingi math: sachet, stick, per-piece pricing, pakyaw packs                                 | Done     | Tingi calculator, units, wholesale price                | Pack-break flow (open a carton, stock moves to pieces) needs a check.                                                                                                       |
| 10  | E-load, GCash cash-in/out, bills payment: float and commission tracking                    | Partial  | `e-services-ledger.tsx`                                 | No float low alert. Commission per service not clear. Mismatch against the wallet balance.                                                                                  |
| 11  | Price competition from mini-marts and online apps; owner cannot see which items still earn | Partial  | Reports, category insights                              | No "items that lose money" or "slow capital" view.                                                                                                                          |
| 12  | Bottle deposits and returnables (softdrinks, gin, LPG)                                     | Gap      | Only generic "empty" hits                               | Returnable bottles tie up capital and cause disputes. Needs deposit and return counts per supplier.                                                                         |
| 13  | Delivery receipts do not match what arrives; short or wrong items                          | Done     | Delivery receipts, supplier shortages report            | None known.                                                                                                                                                                 |

## S3: Friction and upside

| #   | Challenge                                                                               | Coverage | Gap                                                                                                                        |
| --- | --------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| 14  | Items sold by weight or volume (rice per kilo, cooking oil, vinegar, ice)               | Partial  | Check decimal quantity support.                                                                                            |
| 15  | Power outage and ice or frozen stock loss                                               | Gap      | Low priority. A spoilage reason may be enough.                                                                             |
| 16  | No official receipt, permit, or tax records (barangay, BIR, DTI)                        | Gap      | Out of scope for the first release. Confirm with owners whether it is a real pain.                                         |
| 17  | Suki loyalty and pasuyo (errands, bulk orders by message)                               | Gap      | Order notes per suki. Not a POS job yet.                                                                                   |
| 18  | Owner cannot read or type well in English or small text                                 | Partial  | Tagalog locale exists. Insight messages still English (see activity log, Reports). Voice or icon-first flows not explored. |
| 19  | Shared phone: owner needs the phone for personal use while a helper sells               | Gap      | Fast lock, fast switch, no data loss on interruption. Parked carts exist.                                                  |
| 20  | Barangay events, payday, and seasonal demand swings (fiesta, Christmas, school opening) | Gap      | Seasonal stock hints.                                                                                                      |

## Recommended order

1. Supplier payables (4). Highest severity, zero coverage, clear data model.
2. Backup truth check (2). Cheap: verify behavior, fix the doc, run a restore drill.
3. Helper identity on sales (5). Small schema change, large trust gain. Touches auth, so confirm with the owner first.
4. Expiry per delivery line (7). Optional field, near-expiry list.
5. Credit-limit enforcement and below-cost sale warning (1, 6). Planned, mostly UI and one check.
6. Returnables (12), e-service float alerts (10), seasonal hints (20).

## Open questions for owner interviews

- How much do you owe suppliers on a typical week, and how do you track it today?
- What did you last throw away, and why?
- Who else rings up sales, and have you lost money to a mistake or theft?
- Which item did you run out of last, and what did the suki do?
- If your phone broke tomorrow, what would you lose?
- Which e-service costs you the most time or float?
