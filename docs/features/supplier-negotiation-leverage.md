# Supplier Negotiation Leverage — Near-Future Enhancement Checklist

## Summary

restock-plan drafts for products below the existing five-unit low-stock threshold.

## Key Changes

- Record an immutable purchase-price fact for every qualifying restock: product, supplier, acquisition cost, received quantity, purchase unit, conversion snapshot, and timestamp.
- Normalize retail and case purchases to a per-retail-unit cost; preserve the historical conversion so later product edits cannot alter price history.
- Add product and supplier views for last paid price, prior price, 90-day lowest recorded price, price change, and comparable supplier prices.
- Add a saved Restock Plan canvas:
  - Generate rows for products with fewer than five units.
  - Default each quantity to reach five units.
  - Recommend the lowest supplier price recorded in the past 90 days.
  - Allow manual supplier, quantity, add/remove-row, and draft-status changes.
  - Group rows by supplier and show line totals, estimated capital, and negotiation cues.

- Keep plan completion separate from stock receiving; recording actual stock and final cost remains in the existing restock workflow.
- Fix the legacy acquisition-cost storage inconsistency so all new monetary values use the app’s centralized integer-money representation.

## Gaps to Address First

- The wholesale ledger restock path currently does not reliably capture supplier and cost, so it cannot support trustworthy comparisons.
- Existing history with missing supplier, cost, or safe conversion data remains visible only as incomplete history and is excluded from recommendations.
- Current primary-supplier assignment is not enough for comparisons; the purchasing history becomes the source of supplier/product relationships.

## Explicit Limits

- No supplier quotes, purchase messaging, online price feeds, auto-orders, delivery tracking, supplier credit terms, partial receiving, or automatic inventory updates from a plan.
- No demand forecasting, price prediction, supplier reliability scoring, or delivery-fee/discount optimization in v1.
- Recommendations are labeled as the “lowest recorded in the last 90 days,” never as a guaranteed best current market price.

## Test Plan

- Verify retail and wholesale purchases normalize to the same per-unit cost.
- Verify 90-day supplier comparisons, price-change calculations, and missing/stale-data warnings.
- Verify generated quantities, editable rows, supplier grouping, and capital totals.
- Verify draft completion/discard never changes inventory.
- Verify all records and recommendations work offline, and all multi-table writes are atomic.

## Assumptions

- The existing global low-stock threshold of five units remains the v1 trigger and replenishment target.
- Only completed restocks provide price evidence.
- The lowest normalized completed price in the last 90 days is the initial supplier recommendation, always editable by the owner.
