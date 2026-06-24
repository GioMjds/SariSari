# Summary

The project is a solid practical idea, but it is only defensible in a capstone defence if the five
routes map to a clear data model, clear ownership of truth, and realistic scope. Right now, the
weakest part is not the app idea itself, but the risk that it overclaims what it can reliably do
offline.

## Key Issues

- Inventory vs Products is a likely overlap problem. If both screens can edit stock, item details,
  or quantities, you have duplicated truth. In a defence, that becomes a consistency question
  immediately. Products should be master data; Inventory should be stock movement and current
  counts.

- Sales must be transactional, not just a form that saves data. A single sale should update stock,
  cash totals, and any utang entry in one atomic action. If those updates can split apart, one
  crash or failed write can corrupt the business record.

- Credits (Utang/Debt) needs a ledger model, not only a running balance. A cached balance is fine,
  but only if every payment, sale on credit, reversal, and adjustment is recorded as a traceable
  entry. Without that, disputes become impossible to audit.

- Reports is where the project can easily overpromise. Profit, margin, and forecasting are not
  credible unless you also capture purchase cost, stock movements, wastage, and adjustments. If
  that data is not in the system, the report must stay factual, not predictive.

- The sari-sari workflow is more complex than generic retail. Sachet, pack, bundle, damaged goods,
  returns, partial payments, and price changes are not edge cases in this domain. If the model
  ignores them, the app will look unrealistic to actual store owners.

- Offline-first is a strength, but it creates a recovery problem. If the phone is lost, damaged, or
  the database is corrupted, the whole store record can disappear. Without backup, export, or
  import, the solution is incomplete for real use.

- The project becomes non-feasible if it tries to do everything at once. Real-time sync, AI
  forecasting, multi-branch control, and full accounting are too broad unless you already have a
  strong data pipeline and validation strategy. A capstone panel will push back on that scope.

## Questions to Probe

- What is the exact source of truth for stock after a sale, restock, return, or manual adjustment?
- Can one product be sold in multiple units, like piece, pack, or sachet, and if so how are
  conversions handled?

- Which reports are based on recorded data, and which are estimates or assumptions?
- What happens when a customer partially pays, overpays, or disputes a debt entry?
- What is your recovery plan if the device is lost or the local database gets corrupted?

## Make It Feasible

- Replace demand forecasting with simple trend-based low-stock warnings.
- Replace cloud sync with local backup, export, and import.
- Replace full accounting with sales, collections, expenses, and debt tracking.
- Replace multi-branch support with one-store, one-device reliability.

## Bottom Line

The project is defensible if you narrow the scope, separate master data from transactions, and keep
reports limited to what the local data can genuinely prove. If you keep the current framing without
those rules, the panel will correctly call it under-specified and over-claimed
