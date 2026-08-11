# 07. Ligtas na Pagbawi, Pag-refund, at Pagtatama (Safe Voids, Refunds, and Corrections)

> Phase: Susunod (Next)

## Problema

Nangyayari ang mga pagkakamali. Nagkamali ang cashier sa sukli, nagbalik ang suki ng sirang item, o mali ang presyo sa estante. Ngayon, ang tanging paraan upang "iayos" ang benta ay burahin ang row, na nagtatanggal sa audit trail, nag-iiwan sa dami ng imbentaryo na hindi tugma, at tahimik na nagwawasak sa kalkulasyon ng pang-araw-araw na pagre-reconcile ng kaha. Ang may-ari ay nagtatapos sa pagkakaroon ng cash sa kamay na hindi tumutugma sa libro, at walang paraan upang malaman kung bakit.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong i-void o i-refund ang isang benta sa pamamagitan ng isang malinaw at maiimbestigahang flow na nagbabalik ng tamang dami ng paninda at nag-aayos ng cash o utang nang tama, upang maiwasto ko ang mga pagkakamali nang hindi nawawala ang kasaysayan.

## Kasama sa Saklaw (In Scope)

- Isang "Void" action sa isang kamakailang nabuo na benta (nasa loob ng pwedeng i-configure na time window ng may-ari, default 24h) na:
  - Nagbabalik ng mga nabentang dami sa `products.quantity` at nagsusulat ng reversal bilang `type = 'adjustment'` row sa `inventory_transactions` na may reason code na `void`.
  - Nag-i-reverse sa panig ng cash: kung cash ang benta, ang halaga ng cash ay itinatala bilang `direction = 'out'` row sa cash ledger (tampok 3).
  - Nag-i-reverse sa panig ng utang: ang nakaugnay na `credit_transactions` row ay pinalalabas na `status = 'cancelled'` sa halip na burahin, upang ang balanse ng suki ay bumalik sa nakaraang halaga nang hindi nasisira ang audit trail.
  - Nangangailangan ng Owner PIN (tampok 11) upang kumpirmahin.
- Isang "Refund" action na kumikilos tulad ng void ngunit may `reason_code = 'returned_damaged'` o `'returned_other'` na naitala sa inventory adjustment.
- Isang "Price correction" action na nag-e-edit sa unit price ng line item (at muling nagkakalpula sa kabuuan ng benta) nang hindi ginagalaw ang dami, na muling naka-gate sa PIN at may reason code.
- Isang auditable log ng lahat ng mga pagtatama na makikita sa sale detail screen at sa isang Corrections report.

## Hindi Kasama sa Saklaw (Out of Scope)

- Partial refunds kung saan ilang line items lamang ang ibinabalik (sa simula ay buong sale void/refund).
- Cross-day voids/refunds (ang time window ay sadyang mahigpit upang panatilihing simple ang kalkulasyon sa pagsasara).
- Refund-to-utang (pag-refund bilang credit sa account ng suki) — hindi kasama sa saklaw; ang mga refund ay bumabalik sa cash.

## Mga Implikasyon sa Data (Data Implications)

- Bagong columns sa `sales`: `cancelled_at` TEXT (nullable), `cancelled_by_reason_code` TEXT (nullable), `cancelled_by_note` TEXT (nullable).
- Bagong column sa `credit_transactions`: `cancelled_at` TEXT (nullable). Ang column na `status` ay sumusuporta na sa 'cancelled' value.
- Bagong talahanayan na `sale_corrections`: `id`, `sale_id` (FK), `kind` ('void' | 'refund' | 'price_correction'), `actor_reason_code` TEXT, `actor_note` TEXT, `actor_user` TEXT (para sa tampok 16 shift tracking), `created_at` TEXT.
- Lahat ng pagtatama ay nagbabalot sa kanilang inventory, cash, at (kapag may kaugnayan) credit writes sa loob ng isang solong `db.withTransactionAsync` block.
- Bagong mga function sa `database/sales.ts` at `database/credits.ts`: `voidSale(saleId, reason)`, `refundSale(saleId, reason)`, `correctSalePrice(saleId, newLineTotals, reason)`.
- Bagong hooks sa `hooks/useSales.tsx` at `hooks/useCredits.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 3 (daily cash close-out) — ang mga void/refund ay dumadaloy sa cash ledger.
- Tampok 11 (owner PIN) — ang mga void at price correction ay kailangang i-gate ng PIN.
- Tampok 13 (expiry/damaged tracking) — ang mga refund reason code ay may pagkakapareho sa damaged-goods reason codes.

## Mga Kaugnay na Tampok

- **Cash reconciliation:** [[03-daily-cash-close-out|03. Daily Cash Close-Out]] ay kumukuha ng cash reversal para manatiling tama ang expected cash.
- **PIN-protected correction:** [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] ang pumipigil sa hindi awtorisadong void, refund, at price correction.
- **Inventory audit:** [[10-stock-movement-timeline|10. Stock Movement Timeline]] ay nagpapakita ng void reversal sa timeline ng produkto.
- **Damaged returns:** [[13-expiry-and-damaged-goods-tracking|13. Expiry at Damaged-Goods Tracking]] ay nagbabahagi ng reason codes para sa returned damaged goods.
- **Cashier attribution:** [[16-shift-tracking-on-one-device|16. Shift Tracking]] ay nagdaragdag ng responsible cashier sa correction log.

## Mga Open Question

- Ang void window ba ay dapat pwedeng baguhin bawat may-ari, o naka-hard-code sa 24h?
- Ang void ba ay nangangailangan na ang cashier ay pisikal na naroroon kasama ang cash, o ang PIN lamang?
- Paano itatayo ang mga partial refund sa hinaharap?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang pagbabalik ng imbentaryo ay muling gumagamit ng umiiral na `inventory_transactions` write path.
- Ang pera ay integer-pesos mula sa umpisa hanggang dulo. Ang mga void amount ay nakaimbak bilang mga positibong integer sa cash ledger na may `direction`, hindi kailanman bilang negatibo.
- Ang audit log sa `sale_corrections` ay append-only.
