---
title: Owner Inventory Consumption and Pang-Ulam Tracker Spec
created: 2026-08-22
tags: [feature, inventory, financial, owner-drawing]
type: feature-spec
status: active
---

> Phase: Susunod (Next)
> Category: Store Operations & Cash Control

## Problema

Sa tradisyunal na tindahan, madalas kumukuha ang may-ari o pamilya ng mga paninda (delata, itlog, noodles, mantika, sabon, bigas) para sa pansariling konsumo sa bahay ("pang-ulam").

Kasalukuyan, walang tamang paraan upang itala ito:

1. Kung itatala ito bilang benta (cash sale), magkakaroon ng "multo" na benta at artipisyal na kikitain ang tindahan, habang magkakaroon naman ng shortage sa aktwal na pera sa kaha dahil walang pumasok na cash.
2. Kung itatala ito bilang damaged goods o manual loss adjustment, masisira ang ulat ng shrinkage/spoilage, kaya hindi malalaman ng may-ari kung may totoong nananakaw o nasisira sa tindahan.
3. Kung hindi ito itatala, magkakaroon ng unexplained discrepancy tuwing physical stocktake ([[04-physical-stocktake|04. Physical Stocktake]]).

Ang konsumo ng may-ari ay hindi operating expense ng tindahan, at lalong hindi revenue. Ito ay isang equity withdrawal (owner draw) na paninda sa halip na pera.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong magtala ng mga panindang kinuha ng aking pamilya para sa bahay sa halagang puhunan (cost price), upang mabawasan nang tama ang imbentaryo nang hindi dinadaya ang gross sales, at maipakita ang halaga ng konsumo bilang bahagi ng aking owner drawings sa ulat pinansyal.

## Kasama sa Saklaw (In Scope)

- **Bagong Stock Movement Type sa Inventory**:
  - `inventory_transactions.type = 'owner_consumption'` na may dami, `unit_cost` snapshot, at opsyonal na `note` (hal. "Para sa tanghalian", "Pang-ulam ng pamilya").
  - Awtomatikong binabawasan ang physical stock sa `products.stock_quantity`.
- **Valuation sa Cost Price (Puhunan)**:
  - Ang bawas ay palaging kinakalkula gamit ang pinakahuling `cost_price` (COGS) ng item, HINDI ang selling price.
  - Walang gross revenue o profit margin na nalilikha mula sa transaksyong ito.
- **Isahang Aksyon sa POS at Inventory**:
  - Button sa POS Quick Actions o Inventory Ledger: "Kunin para sa Bahay / Pang-Ulam" na nagbubukas ng mabilisang tagapili ng produkto at dami.
- **Pagsasama sa Ulat Pinansyal (Financial Reports Integration)**:
  - Ang kabuuang halaga ng `owner_consumption` (dami * puhunan) ay isinasama sa summary ng **Owner Drawings** kasama ng cash owner drawings ([[03-daily-cash-close-out|03. Daily Cash Close-Out]]).
  - Inihihiwalay sa Store Operating Expenses upang manatiling tumpak ang net operating profit ng tindahan.
- **Audit Trail**:
  - Lumalabas sa [[10-stock-movement-timeline|10. Stock Movement Timeline]] na may malinaw na badge: "Konsumo ng May-ari (Pang-Ulam)".

## Hindi Kasama sa Saklaw (Out of Scope)

- Pag-track ng nutritional values, recipe cooking, o pantry inventory management.
- Multi-household sharing o paghahati ng konsumo sa pagitan ng magkakaibang kamag-anak.
- Pautang sa sariling pamilya (kung nais itala bilang utang, gamitin ang standard suki credit flow).

## Mga Implikasyon sa Data (Data Implications)

- **Database Table (`inventory_transactions`)**:
  - Palawakin ang check constraint o tanggapin ang `type = 'owner_consumption'`.
  - Mag-record ng `unit_cost` sa oras ng pagkuha upang manatiling tumpak ang historical valuation kahit magbago ang puhunan sa hinaharap.
- **Database Function (`database/inventory.ts` & `database/financial.ts`)**:
  - `logOwnerConsumption({ productId, quantity, note })`
  - `getOwnerDrawingsSummary({ from, to })`:
    - `cashDrawings = SUM(financial_entries WHERE type = 'owner_drawing')`
    - `goodsDrawings = SUM(inventory_transactions.quantity * inventory_transactions.unit_cost WHERE type = 'owner_consumption')`
    - `totalOwnerDrawings = cashDrawings + goodsDrawings`
- **Hooks (`hooks/useInventory.ts`, `hooks/useFinancial.ts`)**:
  - `useRecordOwnerConsumption()`
  - `useOwnerDrawingsSummary()`

## Mga Dependency (Dependencies)

- [[03-daily-cash-close-out|03. Daily Cash Close-Out]]: Ginagamit ang parehong konseptwal na ledger para sa owner equity withdrawals.
- [[10-stock-movement-timeline|10. Stock Movement Timeline]]: Ipinapakita ang bawat transaksyon ng konsumo.
- [[04-physical-stocktake|04. Physical Stocktake]]: Tinitiyak na ang counted stock ay tumutugma dahil naitala ang mga kinuhang paninda.

## Mga Kaugnay na Tampok

- **Pang-araw-araw na Kaha:** [[03-daily-cash-close-out|03. Daily Cash Close-Out]] — inihihiwalay ang cash drawing sa goods drawing.
- **Timeline ng Imbentaryo:** [[10-stock-movement-timeline|10. Stock Movement Timeline]] — nagbibigay ng detalyadong audit trail kung kailan at ano ang kinuha.
- **Proteksyon ng Aksyon:** [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] — maaaring protektahan ang pagtatala ng pang-ulam kung ang nagpapatakbo ay katulong o bantay.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang pagpapatupad ay napakagaan at 100% offline.
- Pera: Ang lahat ng halaga ay integer pesos sa pamamagitan ng `lib/money.ts`.
