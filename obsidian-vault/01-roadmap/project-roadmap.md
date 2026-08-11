# SariSari Feature Release Roadmap

> Planning horizon: August 2026 to March 2027.
> Status source: [[feature-implementation-status-and-ia|Feature Status and Information Architecture]] and the linked notes in [[features|the 18-feature backlog]].

## Roadmap Rules

- Ship a complete, testable owner workflow in each release rather than a broad collection of unfinished screens.
- Follow the dependency order below. A later release does not start its financial or data-changing work until the prior release passes its gate.
- Treat the target month as a planning window, not a promise. Move the release rather than ship an unverified money, stock, or credit flow.
- At the start and end of every release, update the implementation-status note and the matching feature note so this roadmap stays true to the app.

## Current Baseline

The following capabilities are already marked Done in the current audit. Maintain and make them discoverable; do not schedule them as net-new feature releases.

- [[01-pos-fast-lane|01. POS Fast Lane]]
- [[02-parked-sales|02. Parked Sales]]
- [[03-daily-cash-close-out|03. Daily Cash Close-Out]]
- [[04-physical-stocktake|04. Physical Stocktake]]
- [[05-utang-guardrails-at-checkout|05. Utang Guardrails at Checkout]]
- [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]]
- [[10-stock-movement-timeline|10. Stock Movement Timeline]]
- [[12-customer-credit-statements|12. Customer Credit Statements]]
- [[17-manual-encrypted-backup-and-restore|17. Backup and Restore]]

## Chronological Release Plan

| Window   | Release                            | Features to ship                             | Why this comes now                                        |                                                                                                         |                                                                                                            |
| -------- | ---------------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Aug 2026 | R1: Collections                    | [[06-collection-queue                        | 06. Collection Queue]]                                    | It completes the current credit guardrails with a practical payment and follow-up workflow.             |                                                                                                            |
| Sep 2026 | R2: Safe corrections               | [[11-owner-pin-for-sensitive-actions         | 11. Owner PIN]], then [[07-safe-voids-refunds-corrections | 07. Safe Voids, Refunds, and Corrections]]                                                              | PIN is the required authority boundary before money, stock, and credit corrections can be safely released. |
| Oct 2026 | R3: Supplier receiving             | [[08-supplier-delivery-receiving             | 08. Supplier Delivery Receiving]]                         | It closes the reorder-to-delivery feedback loop and makes cost and shortage data trustworthy.           |                                                                                                            |
| Nov 2026 | R4: Loss control                   | [[13-expiry-and-damaged-goods-tracking       | 13. Expiry and Damaged Goods]]                            | It builds on correction safety and the existing stocktake and timeline audit trail.                     |                                                                                                            |
| Dec 2026 | R5: Shelf accuracy                 | [[18-offline-price-label-and-barcode-sheets  | 18. Price Label and Barcode Sheets]]                      | A bounded offline output feature that makes the catalog, shelf, and POS scan flow agree.                |                                                                                                            |
| Jan 2027 | R6: Explainable store insights     | [[14-transparent-local-store-insights        | 14. Transparent Local Store Insights]]                    | This is most useful after receiving and loss data are reliable enough to explain stock patterns.        |                                                                                                            |
| Feb 2027 | R7: Explainable credit decisions   | [[15-smarter-but-explainable-credit-profiles | 15. Explainable Credit Profiles]]                         | It reuses the completed collection signals and turns payment history into owner-controlled suggestions. |                                                                                                            |
| Mar 2027 | R8: Shared-register accountability | [[16-shift-tracking-on-one-device            | 16. Shift Tracking]]                                      | It depends on the cash close-out, PIN, and corrections model already proven in earlier releases.        |                                                                                                            |

### R1: Collections

Complete the overdue-first ranking, near-limit signal, payment handoff, and local follow-up log for [[06-collection-queue|Feature 6]]. Keep the workflow in the Customers area and make the completed surface easy to reach from Home.

Release gate:

- An owner can find overdue and near-limit suki, record a payment, and see the updated balance.
- FIFO payment allocation and the credit-statement history remain correct.
- The release has focused database and UI coverage for queue ranking and follow-ups.

### R2: Safe Corrections

Implement [[11-owner-pin-for-sensitive-actions|Feature 11]] first. Then ship [[07-safe-voids-refunds-corrections|Feature 7]] as one audited vertical flow for a sale correction, cash reversal, stock restoration, and credit cancellation where applicable.

Release gate:

- PIN setup, verification, lockout, and recovery code work locally without storing plain-text secrets.
- Void, refund, and price correction leave append-only audit data and use one transaction for ledger-changing writes.
- Cash close-out, product timeline, and suki balance reconcile after each correction type.

### R3: Supplier Receiving

Graduate [[08-supplier-delivery-receiving|Feature 8]] from one-product restock to a supplier delivery receipt with multiple lines, expected-versus-received quantities, actual cost, and shortage reporting. Make [[09-offline-reorder-suggestions|Feature 9]] reachable from Inventory before release so the buying-to-receiving loop is visible.

Release gate:

- A delivery commits each restock exactly once and updates stock and cost atomically.
- Shortages are retained against the supplier and appear in a useful report.
- Reorder suggestions remain correct after a delivery is received.

### R4: Loss Control

Complete [[13-expiry-and-damaged-goods-tracking|Feature 13]]: optional perishable and expiry data, a near-expiry surface, reason-coded damaged-goods entries, and a cost-impact report. Reuse the protection and audit surfaces from R2 and the stock timeline from the baseline.

Release gate:

- The owner can record, explain, and trace a write-off without corrupting stock quantity.
- Near-expiry and damaged reports use current data and display money through the shared money utility.
- Damaged return and refund policies are unambiguous in the UI.

### R5: Shelf Accuracy

Ship [[18-offline-price-label-and-barcode-sheets|Feature 18]] as a separate output release. Start with a small number of label sizes and one barcode symbology, then validate that labels scan into [[01-pos-fast-lane|the POS Fast Lane]].

Release gate:

- A selected catalog product produces a readable price label and barcode sheet offline.
- Printed or shared barcodes resolve to the intended product in POS.
- Statement PDF output remains unaffected by shared document-generation changes.

### R6: Explainable Store Insights

Finish the missing signals in [[14-transparent-local-store-insights|Feature 14]]: recurring shelf-outs, dead stock, material margin changes, and suki payment patterns. Every insight must open the data and date range that produced it.

Release gate:

- Each displayed insight has a plain-language explanation and drill-through evidence.
- All calculations stay local and are derived from existing sales, inventory, supplier, and credit records.
- The insight list is short, actionable, and does not introduce background network work.

### R7: Explainable Credit Decisions

Finish [[15-smarter-but-explainable-credit-profiles|Feature 15]] after the collection queue and insight calculations are stable. Show a suggested limit, its inputs, and its caps, but leave the final limit decision with the owner.

Release gate:

- The suggested limit is deterministic, capped, and fully explained.
- New or sparse credit histories get a safe, explicit fallback rather than a misleading score.
- The suggestion never changes a customer credit limit automatically.

### R8: Shared-Register Accountability

Implement [[16-shift-tracking-on-one-device|Feature 16]] only after the cash, PIN, and correction audit model is stable. Keep it deliberately small: local cashier identity, open and close shift, active-cashier attribution, and a shift variance report.

Release gate:

- Cash, inventory adjustments, and sale corrections capture the active cashier when present.
- Owner PIN authority remains separate from cashier identity.
- A shift can cross midnight without corrupting the daily cash close-out record.

## Deferred Decision: Backup Model

[[17-manual-encrypted-backup-and-restore|Feature 17]] is marked done in the current audit as a Google Drive variant, while its feature note describes manual passphrase-encrypted export. Do not mix a backup-model rewrite into the release train above. Make and document a separate product and security decision before scheduling any change to backup behavior.

## Release Discipline

Every release must include:

- A focused migration test where the feature changes SQLite schema.
- Unit or integration coverage for the new database and money or credit logic.
- Manual device smoke testing of the owner workflow, including offline behavior.
- A status update in the feature note, the implementation-status audit, and the activity log.

## Related Notes

- [[features|18-Feature Backlog and Relationship Map]]
- [[feature-implementation-status-and-ia|Feature Status and Information Architecture]]
