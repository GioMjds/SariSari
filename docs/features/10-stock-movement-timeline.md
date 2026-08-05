# 10. Timeline ng Paggalaw ng Imbentaryo (Stock Movement Timeline)

> Phase: Susunod (Next)

## Problema

Tinitingnan ng may-ari ang isang produkto, nakikitang ang dami sa kamay ay X, at nagtatanong "bakit hindi ito Y?" Ngayon, ang sagot ay nakatago. Pwede silang mag-scroll sa `inventory_transactions` kung marunong sila sa SQL, ngunit walang surface na umiiral upang gabayan ang tao sa bakas nito. Kapag nagkaroon ng pagkakaiba sa panahon ng stocktake (tampok 4) o restock, walang mabilis na paraan ang may-ari upang i-trace ito pabalik sa kaganapan na nagdulot nito.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na nakatingin sa isang produkto, gusto kong makita ang simpleng timeline ng bawat pagbabago sa dami — ano ang nangyari, kailan, at bakit — upang masagot ko ang "bakit ganito ang numerong ito?" nang hindi lumalabas sa app.

## Kasama sa Saklaw (In Scope)

- Isang per-product timeline screen, na naaabot mula sa anumang row ng produkto, na naglilista ng bawat `inventory_transactions` row para sa produktong iyon, pinakabago muna.
- Bawat timeline entry ay nagpapakita ng: timestamp, uri ng kaganapan (sale, restock, damaged, adjustment, void reversal mula sa tampok 7), quantity delta, at ang madaling basahing dahilan / note.
- Isang maikling summary ng panahon sa itaas: net change sa nakaraang 7 at 30 araw, na nakahiwalay ayon sa uri ng kaganapan.
- Isang "Linked sale" affordance sa mga entry na nanggagaling sa benta o void, na nagbubukas sa umiiral na sale detail screen.
- Filter ayon sa uri ng kaganapan (hal. "ipakita lamang sa akin ang mga adjustment") para sa pag-debug ng isang partikular na alalahanin.

## Hindi Kasama sa Saklaw (Out of Scope)

- Pag-edit o pagbura ng mga timeline entry. Ang timeline ay read-only at append-only.
- Isang global timeline sa lahat ng produkto. Ang per-product ay sapat na para sa v1.
- Predictive o projected na hinaharap na dami.

## Mga Implikasyon sa Data (Data Implications)

- Walang bagong talahanayan. Ang `inventory_transactions` na ang source of truth.
- Bagong function sa `database/inventory.ts`: `getProductTimeline(productId, { from, to, eventType })` na nagbabalik ng mga row na pinalawak ng mga detalye ng nakakabit na sale/void.
- Bagong hook sa `hooks/useInventory.tsx`.
- Walang migration na kailangan para sa data layer. UI lamang.

## Mga Dependency (Dependencies)

- Tampok 4 (physical stocktake) ay naglalagay ng mga adjustment row sa timeline.
- Tampok 7 (safe voids/refunds) ay naglalagay ng mga reversal row sa timeline.
- Tampok 13 (expiry/damaged tracking) ay naglalagay ng mga damaged row.

## Mga Open Question

- Pagination: ang isang mabilis mabentang produkto ay maaaring magkaroon ng daan-daang timeline entry sa isang taon. Dapat magkaroon ng pagination ang timeline.
- Grouping: idi-discount ba natin ang mga kaparehong kaganapan na nangyayari nang magkakasunod? Inirerekomenda na panatilihin silang hiwalay para sa audit.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Read-only, single-table query.
- Walang pera sa timeline; dami lamang at dahilan.
- Ito ay isang mababang-gastos ngunit mataas-ang-tiwala na tampok: hindi ito nagpapakilala ng bagong state, ipinapakita lamang kung ano na ang naroon.
