# 08. Supplier Delivery Receiving

> Phase: Next

## Problem

When a delivery arrives, the owner matches it to the shelf in their
head: which boxes came, which were short, which price changed, which
invoice line to record. They rarely write it down. So when margin
moves unexpectedly, or stock runs low faster than expected, the cause
is invisible. The data needed to debug it — actual purchase cost,
shortage quantity, supplier identity — was lost at the doorstep.

## User Story

As a store owner accepting a supplier delivery, I want to record what
actually arrived, at what cost, with which shortages, so the catalog
and the cost basis stay accurate.

## In Scope

- A "Receive delivery" flow that lets the owner pick a supplier
  (existing `suppliers` table, added in migration v7) and then a list
  of products expected on the delivery.
- Per-line actual quantity received vs. quantity expected
  (shortage detection), actual unit cost (vs. expected cost in
  `products.cost_price` or the supplier's last cost).
- A supplier invoice number and optional photo of the paper invoice
  (saved as a URI on the device, not uploaded).
- Commit writes through the existing
  `inventory_transactions` path as `type = 'restock'`, with
  `unit_cost` set to the actual cost. Catalog `quantity` and
  `cost_price` update accordingly.
- Shortages are stored separately so a "shortages by supplier"
  report can rank suppliers by reliability.

## Out of Scope

- Purchase orders or pre-arrival documents. The flow is
  post-delivery only.
- Multi-supplier consolidation of a single delivery (one delivery
  = one supplier for now).
- Auto-emailing or auto-uploading the invoice photo. The photo URI
  is local.

## Data Implications

- New table `delivery_receipts`: `id`, `supplier_id` (FK), `invoice_no`
  TEXT, `invoice_photo_uri` TEXT, `received_at` TEXT, `note` TEXT,
  `created_at` TEXT.
- New table `delivery_receipt_lines`: `id`, `receipt_id` (FK),
  `product_id` (FK), `expected_qty` INTEGER, `received_qty` INTEGER,
  `expected_unit_cost` INTEGER, `actual_unit_cost` INTEGER,
  `shortage_qty` INTEGER (computed column or maintained on write).
- The commit path writes both the `inventory_transactions` row
  (per CLAUDE.md rules, inside `withTransactionAsync`) and updates
  `products.quantity` and `products.cost_price` if the actual
  cost differs from the current one. Decide policy: latest-cost
  wins, or weighted average? Recommend latest-cost for simplicity;
  make the choice a follow-up decision if not the recommended
  default.
- New functions in `database/suppliers.ts` and
  `database/inventory.ts`:
  `createDeliveryReceipt(header, lines)`,
  `listDeliveryReceipts({ supplierId, since })`,
  `getDeliveryShortageReport({ since })`.
- New hook in `hooks/useSuppliers.tsx` and
  `hooks/useInventory.tsx`.
- New migration bumping `user_version` past 9.

## Dependencies

- Feature 9 (offline reorder suggestions) builds on the delivery
  history. Reorder math benefits from actual restock cost, not just
  list cost.
- Feature 14 (local store insights) can derive "supplier
  reliability" from the shortages once they exist.

## Open Questions

- Cost basis policy: latest cost vs. weighted average. Sari-sari
  operations are usually simple enough that latest cost is fine,
  but a small subset of owners may want weighted average.
- Is the delivery receipt the source of truth for the restock, or
  is it a record of something that was already manually entered?
  Strongly recommend "the receipt is the source of truth" — no
  duplicate entry, no drift.
- What happens if a delivery is for a product not yet in the
  catalog? Support quick-add-from-delivery.

## Feasibility Notes

- `suppliers` and `products.supplier_id` already exist (migration
  v7). The receiving flow plugs into that.
- Money: `unit_cost` and `cost_price` are already integer-pesos.
  No money parsing outside `lib/money.ts`.
- The `withTransactionAsync` rule is critical here: a partial
  commit (receipt line written but catalog not updated) would
  desync the very thing this feature is meant to keep accurate.
- Performance: a single delivery has tens of lines, not thousands.
  No pagination needed.
