# 18. Offline Price-Label and Barcode Sheets

> Phase: Later

## Problem

Most sari-sari products are bought loose or repacked: a sack of
candy split into per-piece packs, detergent refilled into smaller
sachets, rice scooped into half-kilo bags. The shelf price is
handwritten on a scrap of paper, the barcode is whatever the owner
generated (or not at all). When prices change, every label has to
be redone. Stockouts happen because the price on the shelf does
not match the price at the register, and the cashier has to argue
the difference at the till.

## User Story

As a store owner, I want to print small, clean price labels and
barcode sheets from my catalog, so the shelf matches the register
and I can stop rewriting prices by hand.

## In Scope

- A "Labels" action in Inventory that generates a printable PDF of
  small price labels for selected products.
- Each label shows: product name, retail price, retail unit
  (e.g. "Pc", "Sachet"), and optionally the wholesale price on a
  second line.
- A "Barcodes" action that generates a printable sheet of
  barcodes for products the owner has flagged as needing one
  (typically the repacked tingi items where the supplier's barcode
  is not at the unit the store sells).
- The PDF is shareable / printable through the device's native
  share sheet (same pattern as feature 12's statement).
- A per-product "show wholesale bar" toggle so labels can be
  generated for either the retail unit or the wholesale unit
  (existing `wholesale_barcode` and `wholesale_price` columns from
  migration v9).

## Out of Scope

- In-app thermal printer integration. The share sheet routes to
  any printer the device knows about.
- Auto-replacement of shelf labels (there is no way to know what
  is on the shelf).
- Bulk price-change workflows. This feature prints labels, it does
  not change prices.

## Data Implications

- No new tables. The data is in `products` (existing columns:
  `name`, `price`, `wholesale_price`, `barcode`, `wholesale_barcode`,
  `retail_unit_name`, `wholesale_unit_name`).
- New function in a new `lib/labels.ts` or extension to
  `lib/pdfGenerator.ts`: `renderPriceLabels(productIds, options)`
  and `renderBarcodeSheet(productIds, options)`.
- No hook changes; the Inventory tab surfaces the action and
  passes the selection to the PDF module.
- No migration.

## Dependencies

- The PDF generator (existing `lib/pdfGenerator.ts`) must support
  the small label layout. If it does not, expand the module
  first; feature 12 (customer credit statements) and this feature
  are the two primary consumers.
- The barcode rendering requires a font or library that can draw
  the chosen barcode symbology (CODE-128 is typical for sari-sari
  repacks). Confirm whether a library is already in the project;
  if not, this is the point where a new dependency may be
  justified.

## Open Questions

- Label size: what are the common label dimensions in the
  market? 30x20mm? 50x25mm? Multi-size support is friendly but
  adds layout work.
- Per-label quantity: does the owner want to print 1 label per
  product, or 5 (so the shelf stays labeled for a while)? A
  per-product count picker is enough.
- Does the sheet auto-sort by category? Helpful for the owner
  walking the shelf; recommend yes with a sort toggle.

## Feasibility Notes

- The data needed is already on the product. The only hard part
  is the barcode rendering. Use a vetted library; do not
  hand-roll a barcode encoder.
- Money display is `formatPesos`. The integer-pesos rule applies;
  the PDF stores the formatted string, never the raw integer
  alongside a decimal that could drift.
- This is the lowest-risk feature in the Later phase: it is
  read-only on the data, generates a print artifact, and has no
  audit-trail implications.
