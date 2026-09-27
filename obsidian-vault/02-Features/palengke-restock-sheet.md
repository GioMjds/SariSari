---
title: Palengke Restock and Working Capital Sheet Spec
created: 2026-08-22
tags: [feature, inventory, restock, supplier, pdf, palengke]
type: feature-spec
status: active
---

> Phase: Susunod (Next)
> Category: Supply Chain & Stock Intelligence

## Problema

Ang pagre-restock ng sari-sari store ay karaniwang ginagawa tuwing madaling araw sa palengke o wholesale grocery (tulad ng Puregold, Super8, Divisoria, o lokal na bagsakan).

Bagama't may offline reorder engine ang SariSari ([[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]]), may dalawang malaking puwang ang kasalukuyang karanasan ng may-ari:

1. **Walang buod ng kabuuang badyet o puhunan**: Bago umalis ng bahay, kailangang malaman ng may-ari kung magkano eksaktong cash ang kailangang dalhin mula sa kaha o ipon upang mabili ang lahat ng critical at low-stock items.
2. **Kakulangan sa portable na listahan**: Sa loob ng siksikan at maingay na palengke o grocery, mahirap mag-navigate sa interactive app. Kailangan ng may-ari ng isang malinaw, mabilisang ma-print na PDF o ma-share na text checklist na may checkboxes at nakapangkat ayon sa supplier o klase ng produkto.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na nagpaplano ng palengke run, gusto kong makabuo ng isang pinagsama-samang shopping checklist na nakapangkat ayon sa supplier o palengke section, kasama ang kabuuang working capital na kailangan bago ako umalis, upang sapat ang aking dalang pera at mabilis kong mamarkahan ang mga nabiling paninda.

## Kasama sa Saklaw (In Scope)

- **Awtomatikong Pagsasama-sama mula sa Reorder Recommendations**:
  - Kinukuha ang lahat ng produktong `out_of_stock`, `low_stock`, at manual na `adjusted` na dami mula sa intelligence engine ng [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]].
- **Kalkulasyon ng Working Capital (Kabuuang Badyet)**:
  - `Kabuuan = SUM(suggested_quantity * cost_price)`
  - Malinaw na ipinapakita ang breakdown: Halaga para sa Out of Stock items vs. Low Stock items.
- **Pagpapangkat ayon sa Supplier / Palengke Section**:
  - Nakapangkat ang mga aytem ayon sa kanilang `preferred_supplier` o `category` upang organisado ang pag-ikot sa palengke.
- **Export at Printable Formats (100% Offline)**:
  - **Printable PDF Checklist via `expo-print`**:
    - Disenyo ng papel na resibo o A4 sheet na may malinaw na checkboxes (`[ ]`), pangalan ng produkto, SKU, kasalukuyang stock, iminumungkahing bibilhin, at inaasahang puhunan.
    - Header na nagpapakita ng kabuuang perang kailangan at petsa.
  - **Plain Text / SMS Format via Native Share**:
    - Simpleng text list na maaaring i-copy o i-send sa SMS/Viber kung ibang tao o kamag-anak ang bibili sa palengke.
- **Koneksyon sa Delivery Receiving**:
  - Pagbalik mula sa palengke, ang parehong restock plan ay maaaring magsilbing batayan para sa maramihang delivery receiving ([[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]]).

## Hindi Kasama sa Saklaw (Out of Scope)

- Online ordering o e-commerce checkout sa suppliers.
- Real-time commodity market price scraping (nakadepende sa huling nai-record na `cost_price` sa database).

## Mga Implikasyon sa Data (Data Implications)

- **Database Functions (`database/stock-intelligence.ts`)**:
  - `getPalengkeRestockPlan({ supplierId, categoryId })`:
    - Nagbabalik ng listahan ng mga aytem kasama ang `suggested_quantity`, `cost_price`, `subtotal`, `supplier_name`, at `category_name`.
    - Nagbabalik ng metadata: `totalEstimatedCapital`, `totalItemsCount`, `outOfStockCount`.
- **PDF Template Engine (`lib/pdfGenerator.ts`)**:
  - `generatePalengkeSheetPdf(restockPlan)`:
    - Gumagawa ng retro-styled, high-contrast black-and-white printable checklist na madaling basahin kahit sa maliit na papel o thermal output.
- **Hooks (`hooks/useStockIntelligence.ts`)**:
  - `usePalengkeRestockPlan()`
  - `useExportPalengkeSheet()`

## Mga Dependency (Dependencies)

- [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]]: Pinagmumulan ng sales velocity at demand calculations.
- [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]]: Tumatanggap ng mga aytem na nabili mula sa listahang ito upang maging opisyal na restock sa imbentaryo.

## Mga Kaugnay na Tampok

- **Mungkahi sa Pagre-stock:** [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]] — nagbibigay ng matalinong dami na isinasama sa listahan.
- **Pagtanggap ng Delivery:** [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]] — nagko-commit ng aktwal na dami at puhunan pagbalik mula sa palengke.
- **Pang-araw-araw na Kaha:** [[03-daily-cash-close-out|03. Daily Cash Close-Out]] — nagtatala ng cash withdrawal para sa pambili sa palengke.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Napakabilis ipatupad dahil ang mathematical engine ay umiiral na sa `database/stock-intelligence.ts`.
- Ang PDF generation ay gumagamit ng standard `expo-print` at `expo-sharing` na gumagana nang 100% offline.
- Pera: Lahat ng calculations ay integer pesos via `lib/money.ts`.
