# 09. Offline na Mungkahi sa Pagre-stock (Offline Reorder Suggestions)

> Phase: Susunod (Next)

## Problema

Ang pagre-restock ay isang pagsasanay sa memorya. Ang may-ari ay naglalakad sa estante, tinitingnan kung ano ang mababa, at sinusubukang alalahanin kung ano ang mabilis na nabenta ngayong linggo. Madalas silang nakakalimot, o sobra ang nabibili sa mga mabagal mabenta at kulang naman sa mabilis mabenta. Pagbalik nila mula sa supplier gamit ang resibo, natutuklasan nilang may mga shortage sa mga item na sigurado silang marami sana.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na nagpaplano ng pagbili sa supplier, gusto ko ng shopping list na nakapangkat ayon sa supplier at sakto ang dami sa aking target stock levels, upang makapasok ako sa supplier at makalabas na may tamang dami ng bibilhin.

## Kasama sa Saklaw (In Scope)

- Isang "Reorder suggestions" view, na binuo nang buo sa aparato, na naglilista ng mga produktong:
  - Nasa o mababa sa kanilang target stock level (per-product, pwedeng baguhin sa `products`).
  - Pababa ang trend sa sales velocity (nakaraang 14 araw vs. naunang 14 araw).
- Ang listahan ay nakapangkat ayon sa supplier upang makapag-order ang may-ari sa bawat supplier o mabisita sila sa nakaplanong pagkakasunod-sunod.
- Mungkahing dami = `target_stock - current_stock + buffer`, kung saan ang `buffer` ay nag-aaccount sa lead time ng supplier kung alam.
- Ang may-ari ay laging nagkokonpirma bago ang anumang pagbabago sa catalog o imbentaryo. Walang awtomatikong pag-order.
- Isang "Mark as ordered" toggle bawat linya na hindi pa nagko-commit ng delivery (ang delivery receiving flow sa tampok 8 ang nagko-commit na action).

## Hindi Kasama sa Saklaw (Out of Scope)

- Predictive demand forecasting (ang "trending down" signal ay isang simpleng velocity diff, hindi isang AI model).
- Auto-submitted orders sa supplier. Ito ay isang isang-tap na "ipakita kung ano ang bibilhin" surface lamang.
- Cross-store benchmarking (single store lamang).

## Mga Implikasyon sa Data (Data Implications)

- Bagong columns sa `products`: `target_stock_level` INTEGER (nullable — null ibig sabihin "huwag magmungkahi para sa reorder"), `reorder_buffer_qty` INTEGER.
- Bagong talahanayan na `reorder_suggestions` (opsyonal): `id`, `generated_at`, `supplier_id`, `product_id`, `current_qty`, `suggested_qty`, `reason` ('below_target' | 'velocity_drop' | 'manual_pin'), `status` ('open' | 'ordered' | 'dismissed').
- Bagong SQL view o function sa `database/stock-intelligence.ts`: `getReorderSuggestions({ lookbackDays })` na nagbabalik ng naka-rank na listahan.
- Bagong hook sa `hooks/useStockIntelligence.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 8 (supplier delivery receiving) — kung wala ito, nabubuo ang listahan ng reorder ngunit nawawala ang feedback loop ng "ano ang aktwal na dumating".
- Tampok 14 (local store insights) ay nagbabahagi ng velocity signal source.

## Mga Open Question

- Ano ang default na `target_stock_level` para sa umiiral na mga produkto? Null ang pinakaligtas.
- Dapat din bang isaalang-alang sa mungkahi ang mga darating na kaganapan (araw ng sweldo, katapusan ng linggo)?
- Gaano kadalas na-re-regenerate ang listahan? Sa bawat pagbukas ng app.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Lahat ng data ay lokal; ang offline-first model ay napakaangkop.
- Pera: ang reorder math ay nasa integer quantities, hindi pera. Walang money parsing na kailangan.
- Ang patakarang "may-ari ang laging nagkokonpirma" ay isang matigas na patakaran sa produkto.
