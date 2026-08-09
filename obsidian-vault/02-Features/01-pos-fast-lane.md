# 01. Mabilisang Pag-checkout sa POS (POS Fast Lane)

## Status: DONE

> Phase: Kasalukuyan (Now)

## Problema

Sa oras ng dagsa ng customer, nakikipag-unahan ang tindero sa pila. Ang listahan ng POS ngayon (`app/(tabs)/sales/pos.tsx` kasama ang `ProductSearchCatalog` component) ay pantay-pantay ang pagtrato sa bawat produkto, kaya ang mga pinakakaraniwang benta — ang parehong 8-15 paninda bawat shift — ay nabaon sa mahabang listahan sa likod ng paghahanap. Sa maliit na telepono, kailangang maghanap ng mata ng cashier, mag-scroll ng daliri, at naghihintay ang suki sa harap nila. Ang mabagal na checkout ay nakakabawas ng benta at nakakasira ng tiwala.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan sa register, gusto ko na ang mga panindang totoong nabebenta ko araw-araw ay isang tap lang ang layo, upang maiproseso ko ang karaniwang transaksyon nang hindi nagta-type o nag-i-scroll.

## Kasama sa Saklaw (In Scope)

- Isang "Favorites" surface sa POS screen, na napupuno sa pamamagitan ng pagmamarka ng produkto bilang paborito (long-press o star icon sa row ng produkto).
- Isang "Recently sold" strip na pinapatakbo ng kasaysayan sa `sale_items` — ang pinakamabentang mga produkto sa nakaraang 14 araw.
- Mabilisang pindutan ng dami (common-quantity chips) para sa bawat fast-lane item (hal. 1, 2, 5, 1 dozzina) upang maidagdag agad ng cashier sa isang tap at laktawan ang hakbang ng pagpili ng dami.
- Mas mabilis na paghahanap: case-insensitive prefix match sa pangalan at `wholesale_barcode` / `barcode` na may debounced input.
- Suporta sa pag-scan ng barcode na direktang naglalagay ng katugmang produkto sa cart. Ang scanner hardware o camera scan sa pamamanan ng `expo-barcode-scanner` ay pumapasok sa parehong code path bilang isang search hit.

## Hindi Kasama sa Saklaw (Out of Scope)

- Personal na rekomendasyon o ML-based ranking.
- Preferensya sa maraming register / maraming user.
- Online catalog syncing — ang mga paborito ay mananatili sa aparato.

## Mga Implikasyon sa Data (Data Implications)

- Bagong columns sa `products`: `is_favorite INTEGER NOT NULL DEFAULT 0`, `last_sold_at TEXT` (opsyonal, nanggagaling sa benta ngunit mabilis i-materialize para sa strip).
- Bagong SQL view o function sa `database/products.ts`: `getFastLaneProducts({ limit })` na nagbabalik ng pinagsamang favorites at top-N pinakamabenta sa 14 araw, na walang duplicate.
- Bagong hook na `useFastLaneProducts()` sa `hooks/useProducts.tsx` na nakabakod sa TanStack Query para muling gumana kapag nagbago ang cart at kapag nag-toggle ng favorite.
- Ang pagresolba sa barcode ay umiiral na sa pamamagitan ng `useBarcodeResolver`; ikinokonekta ng tampok na ito ang resolver sa POS.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Ang Tampok 18 (printable price-label/barcode sheets) ay makikinabang sa parehong barcode plumbing ngunit hindi kinakailangan.

## Mga Open Question

- Saan nanggagaling ang karaniwang dami (common quantities)? Naka-define ba bawat produkto ng may-ari, o kinuha mula sa 25th/50th/75th percentile ng mga nakaraang benta?
- Lalabas ba ang fast-lane strip kahit naghahanap ang user, o napapalitan ito ng mga resulta kapag naghanap?
- Ang pag-scan ba ng barcode ay direktang nagdaragdag sa cart, o humihinto muna para sa kumpirmasyon ng dami?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Lahat ng data ay lokal. Walang backend, walang sync — angkop sa offline-first model ng proyekto.
- Ang "Recently sold" ay nangangailangan ng pagbasa sa `sale_items` na naka-aggregate ayon sa produkto; ang umiiral na `idx_sale_items_product_id` index ay nagpapanatili nitong mabilis.
- Ang patakaran sa integer-pesos ay nag-aaplay pa rin para sa anumang kabuuan na lumalabas sa fast-lane strip; ang favorites at quantities ay hindi humahawak ng pera.
- Walang bagong library na kailangan para sa strip; ang `expo-barcode-scanner` ay opsyonal.
