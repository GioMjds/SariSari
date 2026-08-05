# 08. Pagtanggap ng Delivery mula sa Supplier (Supplier Delivery Receiving)

> Phase: Susunod (Next)

## Problema

Kapag dumating ang isang delivery, ikinukumpara ito ng may-ari sa estante sa pamamagitan ng isip: aling mga kahon ang dumating, alin ang kulang, aling presyo ang nagbago, aling linya ng resibo ang itatala. Bihira nilang isulat ito. Kaya kapag nagbago ang margin nang hindi inaasahan, o mabilis na naubos ang stock kaysa sa inaasahan, ang dahilan ay hindi nakikita. Ang data na kailangan upang maiwasto ito — aktwal na puhunan, dami ng kulang (shortage), pagkakakilanlan ng supplier — ay nawala sa pintuan pa lamang.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na tumatanggap ng delivery ng supplier, gusto kong maitala kung ano ang aktwal na dumating, sa anong puhunan, at ano ang mga kulang, upang manatiling tumpak ang catalog at ang batayan ng puhunan.

## Kasama sa Saklaw (In Scope)

- Isang "Receive delivery" flow na nagpapahintulot sa may-ari na pumili ng supplier (umiiral na `suppliers` table) at pagkatapos ay ang listahan ng mga produktong inaasahan sa delivery.
- Per-line actual quantity received vs. quantity expected (shortage detection), actual unit cost (vs. expected cost sa `products.cost_price` o huling cost ng supplier).
- Isang supplier invoice number at opsyonal na larawan ng papel na resibo (na-save bilang URI sa aparato, hindi ini-upload).
- Ang commit writes ay dumadaan sa umiiral na `inventory_transactions` path bilang `type = 'restock'`, kung saan ang `unit_cost` ay naka-set sa aktwal na puhunan. Ang catalog `quantity` at `cost_price` ay nag-u-update ayon dito.
- Ang mga shortage ay nakaimbak nang hiwalay upang ang "shortages by supplier" report ay makapag-rank sa mga supplier ayon sa pagiging maaasahan.

## Hindi Kasama sa Saklaw (Out of Scope)

- Purchase orders o pre-arrival documents. Ang flow ay post-delivery lamang.
- Multi-supplier consolidation sa iisang delivery (isang delivery = isang supplier sa ngayon).
- Auto-emailing o auto-uploading ng larawan ng resibo. Ang photo URI ay lokal.

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `delivery_receipts`: `id`, `supplier_id` (FK), `invoice_no` TEXT, `invoice_photo_uri` TEXT, `received_at` TEXT, `note` TEXT, `created_at` TEXT.
- Bagong talahanayan na `delivery_receipt_lines`: `id`, `receipt_id` (FK), `product_id` (FK), `expected_qty` INTEGER, `received_qty` INTEGER, `expected_unit_cost` INTEGER, `actual_unit_cost` INTEGER, `shortage_qty` INTEGER.
- Ang commit path ay nagsusulat pareho sa `inventory_transactions` row (sa loob ng `withTransactionAsync`) at nag-u-update sa `products.quantity` at `products.cost_price` kung ang aktwal na puhunan ay iba sa kasalukuyan.
- Bagong mga function sa `database/suppliers.ts` at `database/inventory.ts`: `createDeliveryReceipt(header, lines)`, `listDeliveryReceipts({ supplierId, since })`, `getDeliveryShortageReport({ since })`.
- Bagong hooks sa `hooks/useSuppliers.tsx` at `hooks/useInventory.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 9 (offline reorder suggestions) ay nagtatayo sa kasaysayan ng delivery.
- Tampok 14 (local store insights) ay makakakuha ng "supplier reliability" mula sa mga shortage kapag umiiral na ang mga ito.

## Mga Open Question

- Patakaran sa cost basis: latest cost vs. weighted average. Inirerekomenda ang latest cost para sa pagiging simple.
- Ang delivery receipt ba ang source of truth para sa restock? Inirerekomenda: oo — walang duplicate entry, walang drift.
- Ano ang mangyayari kung ang delivery ay para sa produktong wala pa sa catalog? Sumuporta sa quick-add-from-delivery.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Umiiral na ang `suppliers` at `products.supplier_id` (migration v7). Ang receiving flow ay nakakabit doon.
- Pera: ang `unit_cost` at `cost_price` ay integer-pesos na.
- Ang patakaran ng `withTransactionAsync` ay kritikal dito.
