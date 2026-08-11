# 18. Printable na Price Label at Barcode Sheet (Offline Price-Label and Barcode Sheets)

> Phase: Sa Haharapin (Later)

## Problema

Karamihan sa mga produkto sa sari-sari store ay binibili nang tingi o repacked: ang isang sako ng kendi ay hinahati sa bawat pirasong pakete, ang sabon ay isinasalin sa maliliit na sachet, ang bigas ay isinasandok sa kalahating kilong bag. Ang presyo sa estante ay isinusulat lamang sa piraso ng papel, at ang barcode ay kung ano man ang ginawa ng may-ari (o wala man lang). Kapag nagbago ang mga presyo, bawat label ay kailangang ulitin. Nangyayari ang mga stockout dahil ang presyo sa estante ay hindi tumutugma sa presyo sa register, at kailangang magtalo ng cashier at customer sa till.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong mag-print ng malinis na maliliit na price label at barcode sheet mula sa aking catalog, upang ang estante ay tumugma sa register at makapagtigil ako sa kamay na pagsusulat ng mga presyo.

## Kasama sa Saklaw (In Scope)

- Isang "Labels" action sa Inventory na gumagawa ng printable PDF ng maliliit na price labels para sa mga napiling produkto.
- Bawat label ay nagpapakita ng: pangalan ng produkto, retail price, retail unit (hal. "Pc", "Sachet"), at opsyonal na wholesale price sa ikalawang linya.
- Isang "Barcodes" action na gumagawa ng printable sheet ng barcodes para sa mga produktong minarkahan ng may-ari na nangangailangan nito (karaniwan ay ang mga repacked tingi items kung saan ang barcode ng supplier ay wala sa unit na ibinebenta ng tindahan).
- Ang PDF ay mai-share / mai-print sa pamamagitan ng native share sheet ng aparato (parehong pattern sa statement sa tampok 12).
- Isang per-product "show wholesale bar" toggle upang ang mga label ay magawa alinman para sa retail unit o wholesale unit.

## Hindi Kasama sa Saklaw (Out of Scope)

- In-app thermal printer integration. Ang share sheet ay nag-u-route sa anumang printer na kilala ng aparato.
- Awtomatikong pagpapalit ng mga shelf label.
- Bulk price-change workflows. Ang tampok na ito ay nagpi-print ng mga label, hindi ito nagpapalit ng mga presyo.

## Mga Implikasyon sa Data (Data Implications)

- Walang bagong talahanayan. Ang data ay nasa `products` na (`name`, `price`, `wholesale_price`, `barcode`, `wholesale_barcode`, `retail_unit_name`, `wholesale_unit_name`).
- Bagong function sa bagong `lib/labels.ts` o extension sa `lib/pdfGenerator.ts`: `renderPriceLabels(productIds, options)` at `renderBarcodeSheet(productIds, options)`.
- Walang pagbabago sa hook; ang Inventory tab ang nagpapakita ng action at nagpasa ng selection sa PDF module.
- Walang migration.

## Mga Dependency (Dependencies)

- Ang PDF generator (umiiral na `lib/pdfGenerator.ts`) ay dapat sumusuporta sa small label layout.
- Ang barcode rendering ay nangangailangan ng font o library na makakapagguhit ng napiling barcode symbology (CODE-128 ang karaniwan para sa sari-sari repacks).

## Mga Kaugnay na Tampok

- **Barcode sa register:** [[01-pos-fast-lane|01. POS Fast Lane]] ang magre-resolve at magdadagdag ng produktong may barcode sa cart.
- **Parehong document pipeline:** [[12-customer-credit-statements|12. Customer Credit Statements]] ay gumagamit din ng local PDF generation at native share flow.

## Mga Open Question

- Laki ng label: ano ang mga karaniwang sukat ng label sa merkado? 30x20mm? 50x25mm?
- Dami ng label bawat produkto: gusto ba ng may-ari mag-print ng 1 label bawat produkto, o 5?
- Naka-auto-sort ba ang sheet ayon sa kategorya?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang kailangang data ay nasa produkto na. Ang mahirap na bahagi lamang ay ang rendering ng barcode. Gumamit ng vetted library; huwag mag-hand-roll ng barcode encoder.
- Ang pagpapakita ng pera ay `formatPesos`. Ang patakaran sa integer-pesos ay nag-aaplay.
