# Hinaharap na Roadmap ng mga Tampok

Ang bawat item sa ibaba ay isang maikling gabay patungo sa detalyadong dokumento. Basahin ang dokumento bago simulan ang gawain; inilalarawan nito ang problema, saklaw,
mga implikasyon sa data, mga dependency, mga open question, at mga tala sa pagiging posible na wala sa maikling buod sa ibaba.

> Para sa aktwal na pagkakasunod-sunod ng pag-ship, tingnan ang
> [[project-roadmap|SariSari Feature Release Roadmap]].

## Kasalukuyan (Now) — Pinakamataas na Halaga sa Araw-araw

1. [Mabilisang Pag-checkout sa POS](01-pos-fast-lane.md) — mga paborito, kamakailang
   nabentang paninda, karaniwang dami, mas mabilis na paghahanap, at barcode
   scanning.
2. [Pag-ihinto o Pag-iimbak ng Cart](02-parked-sales.md) — itabi muna ang cart ng isang
   customer at balikan ito mamaya nang hindi nawawala ang mga paninda.
3. [Pang-araw-araw na Pagre-reconcile ng Kaha](03-daily-cash-close-out.md) — itala ang
   opening float, pumasok/lumabas na pera, nabiling pera, expected cash, at
   variance kasama ang dahilan.
4. [Pag-imbentaryo sa Estante](04-physical-stocktake.md) — guided na pagbilang ayon sa
   kategorya, pagsusuri ng variance, at pag-adjust sa imbentaryo na may reason code.
5. [Mga Proteksyon sa Utang sa Checkout](05-utang-guardrails-at-checkout.md) —
   ipakita ang live balance, natitirang credit, status ng overdue, at
   ipatupad ang limit ng suki o hilingin ang override ng may-ari.
6. [Pila ng Paniningil ng Utang](06-collection-queue.md) — malinaw na listahan ng mga
   overdue at malapit sa limit na suki, na may isang-tap na pagtala ng buo o bahagyang bayad
   at opsyonal na petsa ng follow-up.

## Susunod (Next) — Pagpapatibay ng Kontrol at Pagre-stock

7. [Ligtas na Pagbawi, Pag-refund, at Pagtatama](07-safe-voids-refunds-corrections.md) —
   i-reverse ang benta sa pamamagitan ng auditable na workflow na nagbabalik ng
   stock at tama ang pag-adjust sa cash o utang.
8. [Pagtanggap ng Delivery mula sa Supplier](08-supplier-delivery-receiving.md) —
   itala ang dumating na dami, aktwal na puhunan, mga kulang (shortages),
   at resibo ng supplier kapag nagre-restock.
9. [Offline na Mungkahi sa Pagre-stock](09-offline-reorder-suggestions.md) —
   gumawa ng listahan ng bibilhin na nakapangkat sa supplier mula sa mababang stock,
   kasaysayan ng benta, at target stock level; ang may-ari ang laging nagkokonpirma.
10. [Timeline ng Paggalaw ng Imbentaryo](10-stock-movement-timeline.md) — simpleng
    pagtingin kung "bakit nagbago ang dami?" sa mga benta, restock, spoilage,
    returns, at manual adjustments.
11. [PIN ng May-ari para sa Maselang Aksyon](11-owner-pin-for-sensitive-actions.md) —
    protektahan ang price overrides, malalaking discount, voids, stock
    adjustments, at debt-limit exceptions sa shared na aparato.
12. [Pahayag ng Utang ng Suki (Credit Statements)](12-customer-credit-statements.md) —
    gumawa ng offline na resibo o PDF statement na nagpapakita ng
    mga binili, bayad, at natitirang utang.

## Sa Haharapin (Later) — Kapaki-pakinabang Kapag Matatag na ang Pundasyon

13. [Pagtala ng Panindang Pasado sa Expiry at Nasira](13-expiry-and-damaged-goods-tracking.md) —
    para lamang sa mga produktong kailangan ito, na may near-expiry at
    write-off reasons para makita ang mga lugi.
14. [Malinaw at Lokal na Pagsusuri ng Tindahan](14-transparent-local-store-insights.md) —
    mga praktikal na tip mula lamang sa kasaysayan sa aparato: mga panindang
    paulit-ulit na nawawalan ng stock, dead stock, pagbabago sa margin, at
    pola ng pagbabayad ng suki.
15. [Mas Matalino ngunit Naipapaliwanag na Credit Profile](15-smarter-but-explainable-credit-profiles.md) —
    magmungkahi — hindi tahimik na magdesisyon — ng credit limit mula sa
    kabilisan ng pagbabayad, balanse, at kasaysayan ng overdue.
16. [Pagtala ng Shift sa Iisang Aparato](16-shift-tracking-on-one-device.md) —
    lokal na cashier profile o shift handover upang ang mga variance at
    corrections sa kaha ay may kaugnay na tao nang walang multi-device account.
17. [Manwal at Nakatagong Backup at Restore](17-manual-encrypted-backup-and-restore.md) —
    i-export/import ang SQLite data gamit ang Files / share flow ng aparato.
    Walang cloud account o awtomatikong syncing na kailangan.
18. [Printable na Price Label at Barcode Sheet](18-offline-price-label-and-barcode-sheets.md) —
    gumawa ng mai-print na labels mula sa umiiral na catalog para sa
    mga estante at repacked tingi items.

## Mapa ng mga Kaugnayan

Gamitin ang mga link na ito bilang mabilis na entry point. Ang bawat detalyadong note ay may
Mga Kaugnay na Tampok section na nagpapaliwanag ng ugnayan nito.

- **POS at utang:** [[01-pos-fast-lane|01. POS Fast Lane]] at
  [[02-parked-sales|02. Parked Sales]] ay magkasamang nagpapabilis sa cart. Sa credit
  checkout, [[05-utang-guardrails-at-checkout|05. Utang Guardrails]] ay nagbibigay ng
  signal sa [[06-collection-queue|06. Collection Queue]],
  [[12-customer-credit-statements|12. Credit Statements]], at
  [[15-smarter-but-explainable-credit-profiles|15. Explainable Credit Profiles]].
- **Kaha, correction, at accountability:** [[03-daily-cash-close-out|03. Daily Cash
  Close-Out]] ay tumatanggap ng cash reversal mula sa
  [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, at Corrections]].
  [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] ang proteksiyon sa maselang
  aksyon, at [[16-shift-tracking-on-one-device|16. Shift Tracking]] ang nagdaragdag ng
  cashier attribution.
- **Inventory at supplier loop:** [[08-supplier-delivery-receiving|08. Supplier Delivery
  Receiving]] ang nagko-commit ng restock na pinaplano ng
  [[09-offline-reorder-suggestions|09. Offline Reorder Suggestions]].
  [[04-physical-stocktake|04. Physical Stocktake]],
  [[07-safe-voids-refunds-corrections|07. Safe Corrections]], at
  [[13-expiry-and-damaged-goods-tracking|13. Expiry at Damaged Goods]] ay bumubuo ng
  event trail na makikita sa [[10-stock-movement-timeline|10. Stock Movement Timeline]].
- **Paliwanag at output:** [[14-transparent-local-store-insights|14. Transparent Local
  Store Insights]] ay bumubuo ng maiintindihang tips mula sa sales, inventory, at credit
  data. [[18-offline-price-label-and-barcode-sheets|18. Price Label at Barcode Sheets]]
  ay kumokonekta sa POS barcode scan at sa PDF/share pattern ng statements.
- **Proteksyon ng data:** [[17-manual-encrypted-backup-and-restore|17. Encrypted Backup
  at Restore]] ay cross-cutting na nagpoprotekta sa mga local record ng pera, stock, suki,
  at supplier.
