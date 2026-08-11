# 04. Pag-imbentaryo sa Estante (Physical Stocktake)

## Status: DONE

> Phase: Kasalukuyan (Now)

## Problema

Ang dami sa catalog ay unti-unting nag-iiba mula sa kung ano ang aktwal na nasa estante. Nangyayari ang shrinkage: shoplifting, nasirang paninda na hindi naitala, libreng "paminsu" sa kapitbahay, anak na kumuha para sa sarili, maling pagbilang sa pag-restock, o benta na hindi dumaan nang maayos. Kapag walang guided at regular na pagbilang, natutuklasan lamang ng may-ari ang pagkakaiba kapag nagbukas sila ng kahon at nakitang walang laman — huli na upang i-reconcile sa isang partikular na kaganapan.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng guided, category-by-category na pagbilang ng kung ano ang pisikal na nasa aking estante, ikinukumpara sa kung ano ang sinasabi ng catalog na dapat naroroon, upang maitala ko ang variance at maipaliwanag ang bawat kulang o sobra.

## Kasama sa Saklaw (In Scope)

- Isang "Stocktake" mode na gumagabay sa may-ari sa mga produkto na nakapangkat ayon sa kategorya (umiiral na `categories` table).
- Isang counted-quantity input bawat produkto na may quick-quantity chips (parehong bulk unit, dozzina, atbp. na kinabibilangan ng produkto).
- Isang variance summary sa dulo: per-category at per-product expected vs. counted, kasama ang delta at ang implikasyon sa pera gamit ang `cost_price`.
- Isang reason-coded adjustment flow sa variance summary: bawat linya ng variance ay nakakatanggap ng dahilan (shrinkage, spoilage, miscount, libre sa kapitbahay, return) at nagsusulat sa umiiral na `inventory_transactions` table bilang `type = 'adjustment'` row.
- Kino-kontra o pinala-lock ng mode ang natitirang bahagi ng app mula sa pag-log ng magkakasalungat na pagbabago habang nagbibilang (ang banner ay sapat na).

## Hindi Kasama sa Saklaw (Out of Scope)

- Continuous cycle counting automation (ito ay isang manual at periodic na gawain).
- Multi-device collaboration sa isang pagbilang.
- Barcode-driven scanning habang nagbibilang (keyboard/numeric input lamang para sa tampok na ito).

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `stocktake_sessions`: `id`, `started_at`, `ended_at`, `status` ('in_progress' | 'completed' | 'abandoned'), `note` TEXT.
- Bagong talahanayan na `stocktake_counts`: `id`, `session_id` (FK), `product_id` (FK), `expected_qty` INTEGER, `counted_qty` INTEGER, `reason_code` TEXT, `note` TEXT, `committed_at` TEXT.
- Sa pag-commit, ang bawat committed count row ay gumagawa ng isang `inventory_transactions` insert (`type = 'adjustment'`, ang `adjustment_sign` ay tumutugma sa direksyon ng variance, ang `note` ay nagdadala ng dahilan). Ginagawa sa loob ng isang `withTransactionAsync` block.
- Bagong mga function sa `database/inventory.ts`: `startStocktakeSession()`, `upsertStocktakeCount({ sessionId, productId, countedQty })`, `listStocktakeVariance(sessionId)`, `commitStocktake(sessionId, reasonPerLine)`.
- Bagong hook sa `hooks/useInventory.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Wala — malaya. Ang mga reason code ay may pagkakapareho sa tampok 13 (expiry/damaged tracking) ngunit ang stocktake reason code ay hiwalay.

## Mga Kaugnay na Tampok

- **Audit trail ng dami:** [[10-stock-movement-timeline|10. Stock Movement Timeline]] ay nagpapakita ng bawat adjustment na ginawa ng stocktake.
- **Pagkakapareho ng dahilan:** [[13-expiry-and-damaged-goods-tracking|13. Expiry at Damaged-Goods Tracking]] ay gumagamit ng kaugnay na reason-code vocabulary para maihiwalay ang spoilage sa ibang variance.
- **Maselang adjustments:** [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] ang nagga-gate sa manual adjustments sa labas ng stocktake.
- **Sino ang gumawa:** [[16-shift-tracking-on-one-device|16. Shift Tracking]] ay nag-a-attribute ng inventory adjustments sa active cashier.

## Mga Open Question

- Ano ang default na dalas ng pag-imbentaryo? Lingguhan? Buwanan?
- Ang mga reason code ba ay nagdadala ng `cost_price` snapshot sa oras ng stocktake, o ginagamit ang live `cost_price`? Mas ligtas ang snapshotting.
- Maaari bang i-pause at i-resume ang stocktake kapag nag-restart ang app? (Inirerekomenda: oo).

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang umiiral na `inventory_transactions` ay tumatanggap na ng `type = 'adjustment'` rows na may `note` — kaya handa na ang audit trail.
- Pera: ang epekto ng variance ay gumagamit ng `cost_price` mula sa `products` o `inventory_transactions.unit_cost`. Parehong integer-pesos.
