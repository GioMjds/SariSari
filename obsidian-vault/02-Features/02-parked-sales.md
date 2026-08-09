# 02. Pag-ihinto o Pag-iimbak ng Cart (Parked Sales)

> Phase: Kasalukuyan (Now)

## Problema

Ang isang suki ay umaalis sandali mid-cart upang kumuha ng iba pang paninda, humahaba ang pila, o kailangang mag-iba ng konteksto ang cashier (sumagot sa tanong, mag-check ng stock, mag-receive ng mabilis na bayad para sa iba). Ngayon, ang tanging pagpipilian ay i-ring up nang hindi kumpleto o lumabas sa cart at mawala ang lahat. Parehong nag-uudyok sa cashier na isaulo o isulat sa papel ang mga paninda, na madaling magkaroon ng mali at nakakasira sa audit trail ng nabenta.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong maitabi muna ang cart ng isang customer kapag naantala at maibalik ito nang eksakto kung ano ito, upang makapaglingkod ako sa sinumang nasa harap ko nang hindi nawawala ang mga pinili ng unang suki.

## Kasama sa Saklaw (In Scope)

- Isang "Park cart" action sa POS screen na nag-o-snapshot ng kasalukuyang cart sa isang may-pangalang slot.
- Isang maliit at nakikitang listahan ng mga naka-park na cart (karaniwan ay isa lang, ngunit sumusuporta hanggang 3) na naa-access mula sa POS tab.
- Isang "Resume" action na naglo-load ng naka-park na cart pabalik sa active cart, kabilang ang line items, quantities, sold-unit metadata, at anumang napiling customer para sa utang.
- Awtomatikong pagtapon ng naka-park na cart pagkatapos ng pwedeng i-configure na retention window (default: hanggang sa katapusan ng araw), na may manual na "Discard" option.

## Hindi Kasama sa Saklaw (Out of Scope)

- Cross-device sync ng mga naka-park na cart (single-device, offline-only).
- Mga notification o paalala para sa mga naka-park na cart na matagal nang nakatengga.
- Pagpapanatili ng naka-park na cart sa kabila ng pag-uninstall ng app (nangangailangan ng backup, na tampok 17).

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `parked_carts` na may: `id`, `label` (pangalan ng suki o auto-generated na "Cart 1"), `customer_id` (nullable FK sa `customers`), `created_at`, `expires_at`, `payload_json` (ang serialized cart line items).
- Bagong talahanayan na `parked_cart_items` kung gusto natin ng first-class queryability, ngunit sapat na ang JSON column dahil ang mga cart ay panandalian lamang at hindi ini-aggregate. Mas gusto ang JSON para sa pagiging simple.
- Bagong mga function sa `database/sales.ts`: `parkCart(cart, meta)`, `listParkedCarts()`, `resumeParkedCart(id)`, `discardParkedCart(id)`.
- Bagong hook sa `hooks/useSales.tsx`: `useParkedCarts()` at mutation pair na `useParkCart()` / `useResumeCart()`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.
- Isang maliit na store flag sa `stores/pos.ts` (o katumbas) para sa "active parked cart id" upang maibalik ang flow nang walang extra query.

## Mga Dependency (Dependencies)

- Wala — ganap na malaya. Nagtatayo sa umiiral na `useCart` hook ngunit hindi nangangailangan ng iba pang tampok sa roadmap.

## Mga Open Question

- Dapat bang isama sa naka-park na cart ang pangalan ng suki, o auto label lamang? Maaaring gusto ng may-ari ng mabilis na paraan para matandaan "ang may dalang bata."
- Sapat na ba ang isang naka-park na cart, o kailangan sa totoong workflow ang 2-3 sabay-sabay?
- Ano ang mangyayari sa naka-park na cart kung ang produktong naroon ay nabura, nabago ang presyo sa restock, o dumaan sa wholesale re-pack? Kailangan ng malinaw na policy sa Resume.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Single-device, lokal na SQLite — napakadaling ipatupad.
- Ang naka-park na cart ay isang row lamang; hawak na ng umiiral na `useCart` ang state na kailangan nating i-serialize.
- Patakaran sa pera: ang mga naka-park na cart ay nag-iimbak lamang ng integer pesos; hindi muling nagpo-parse sa resume. Ang formatting para sa display ay dumadaan sa `lib/money.ts`.
