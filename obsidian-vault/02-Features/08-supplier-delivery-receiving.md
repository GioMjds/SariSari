# 08. Pagtanggap ng Delivery mula sa Supplier (Supplier Delivery Receiving)

> Phase: Tapos na (Implemented)
> Status: implemented (2026-11-09)

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

## Mga Kaugnay na Tampok

- **Feedback loop sa restock:** [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]] ang nagpaplano ng bibilhin; ang receiving flow ang nagkukumpirma sa aktwal na dumating.
- **Traceable stock change:** [[10-stock-movement-timeline|10. Stock Movement Timeline]] ay nagpapakita ng restock transaction na nalikha sa pagtanggap ng delivery.
- **Supplier signals:** [[14-transparent-local-store-insights|14. Transparent Local Store Insights]] ay maaaring magpaliwanag ng shortage at supplier-reliability patterns mula sa receipts.

## Mga Open Question

- Patakaran sa cost basis: latest cost vs. weighted average. Inirerekomenda ang latest cost para sa pagiging simple.
- Ang delivery receipt ba ang source of truth para sa restock? Inirerekomenda: oo — walang duplicate entry, walang drift.
- Ano ang mangyayari kung ang delivery ay para sa produktong wala pa sa catalog? Sumuporta sa quick-add-from-delivery.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Umiiral na ang `suppliers` at `products.supplier_id` (migration v7). Ang receiving flow ay nakakabit doon.
- Pera: ang `unit_cost` at `cost_price` ay integer-pesos na.
- Ang patakaran ng `withTransactionAsync` ay kritikal dito.

## Implemented (2026-11-09)

Status: implemented. Final spec: `docs/superpowers/specs/2026-11-09-supplier-delivery-receiving-design.md`. Plan: `docs/superpowers/plans/2026-11-09-supplier-delivery-receiving.md`. Hindi dinoble ang spec dito; sundan ang link.

Code: `database/deliveries.ts`, `hooks/useDeliveryReceipts.ts`, `app/(edit-forms)/delivery-receipt/[id].tsx`, `app/(edit-forms)/delivery-receipts/index.tsx`, `app/reports/supplier-shortages.tsx`, `components/receiving/`, `database/inventory.ts` (`applyInventoryTransaction` lang).

- Data: `delivery_receipts.supplier_id` ay TEXT (UUID ng `suppliers.id`). Migration v23. Partial unique index: isang draft kada supplier.
- Cost basis: latest cost, may cost-change chip bago mag-commit. Walang weighted average.
- Ang receipt ang source of truth sa restock. Commit sa isang transaction sa pamamagitan ng `applyInventoryTransaction`.
- Quick-add ng bagong produkto (name, retail price, optional barcode), nalilikha sa loob ng commit transaction.
- "Fill from reorder plan" ay nagseseed mula sa `getPalengkeRestockPlan({ supplierId })`.
- Entry unit: retail o wholesale kada linya; parehong entered at converted values ang naka-store.
- Status: `draft | committed | voided`. Immutable ang receipt. Ang void ay PIN-gated sa UI sa pamamagitan ng `useOwnerPinGuard` (hindi nagga-gate ang DB function) at tinatanggihan kapag kulang ang stock (`VoidWouldGoNegativeError`).
- Single-flight: ang `commitDeliveryReceipt` at `voidDeliveryReceipt` ay may module-level in-flight Set at guarded status flip (`AND status = ...`, `changes === 1`). Overlapping duplicate ay nagtatapon ng `ReceiptNotDraftError` (commit) o `ReceiptAlreadyVoidedError` (void). Naka-disable rin ang buttons habang pending.
- Errors: `ReceiptNotDraftError`, `ReceiptEmptyError`, `DraftAlreadyExistsError`, `VoidWouldGoNegativeError`, `ReceiptAlreadyVoidedError`, `ReceiptNotCommittedError`, `QuickAddBarcodeExistsError`. May copy ang lahat sa en at tl; 36 dagdag na i18n keys sa `receiving` namespace.
- List: stack route `app/(edit-forms)/delivery-receipts/index.tsx`, hindi pang-apat na sub-tab.
- Shortage report: value = `shortage_qty * COALESCE(expected_unit_cost, actual_unit_cost)`; rate ay 0..1 fraction; ang `since`/`until` ay dapat full ISO timestamp (date-only `until` ay magbubukod sa buong araw); inclusive ang bounds; lumalabas ang supplier na walang shortage na may value 0.
- Lokasyon ng mga DB function: `database/deliveries.ts`, hindi `database/suppliers.ts`.
- Known discrepancy: `inventory_transactions.unit_cost` ay `REAL` sa migration; integer pesos lang ang isinusulat.
- Tests: `tests/` at `tests/database/`. Mock caveat: ang `withTransactionAsync` ng sqlite mock ay nagro-rollback gamit ang `ROLLBACK TO SAVEPOINT` pero hindi nagre-RELEASE, kaya nananatili sa transaction ang connection pagkatapos ng unang rollback at hindi na umeepekto ang `PRAGMA foreign_keys`.

## Known Risks

- Project-wide: hindi exclusive ang `withTransactionAsync` ng expo-sqlite. Ang POS sale na nag-o-overlap sa commit ay puwedeng tamaan ng parehong hazard. Walang global write lock sa release na ito.

## Known Limitations at Follow-ups

- Tinatanggihan ang Save draft habang may hindi kumpletong linya (NOT NULL ang `entered_*` columns), kaya hindi mai-park ang kalahating bilang na delivery; itinatapon ng back-navigation ang hindi na-save na linya.
- Hindi ini-swap ng unit toggle ang prefilled cost.
- Walang double-tap ref guard ang Save draft (maling toast lang ang epekto).
- Ilang hardcoded English accessibility label (Back to edit, Clear search, Go back) at English na mensahe ng `InvalidDeliveryLineError`.
- Hydration na may tinanggal na wholesale unit: nawawala ang toggle at nalalaglag ang linya sa review totals.
- Ang pagpapalit ng supplier sa bagong receipt ay nagtatapon ng na-type na linya.
- Tumatakbo ang `usePalengkeRestockPlan` bago pumili ng supplier.
- Maaaring i-purge ng OS ang invoice photo URI.
- Hindi pa tumakbo sa device ang delivery editor at shortage screens sa session na ito. Hindi pa beripikado: void sheet papunta sa PIN modal, scanner/sheet swap, `router.replace` mula `new` papunta sa numeric id, keyboard sa sheets.
