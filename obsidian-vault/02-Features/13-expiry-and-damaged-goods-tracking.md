# 13. Pagtala ng Panindang Pasado sa Expiry at Nasira (Expiry and Damaged-Goods Tracking)

> Phase: Sa Haharapin (Later)

## Problema

Ang malaking bahagi ng imbentaryo sa sari-sari store ay nasisira o nabubulok: delata, sachet, tinapay, gatas, sabon na kumukuha ng basa, biskwit. Karamihan nito ay hindi man lang nasusuri ang expiry label. Ang spoilage at sira ay hindi consistent na naitala, kaya ang lugi ay hindi nakikita — ilang piso sa isang araw, araw-araw, na nagiging malaking bawas sa margin. Alam ng mga may-ari na naroon ang lugi; hindi lang nila maituro ang eksaktong numero nito.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong i-track ang expiry dates sa mga perishable products na mahalaga, at i-log ang nasirang paninda na may dahilan, upang makita ko kung ano ang nawala, bakit, at paano ito mababawasan.

## Kasama sa Saklaw (In Scope)

- Isang opt-in `perishable` flag at opsyonal na `expiry_date` sa `products` (para lamang sa mga produktong minarkahan ng may-ari; huwag ipilit ang field sa bawat item).
- Isang near-expiry view (configurable threshold, default 14 araw) na nagpapakita ng mga produktong malapit nang ma-expire, na naka-sort ayon sa petsa, kasama ang apektadong dami at mabilisang "discounted" o "write-off" action.
- Isang damaged-goods log: kapag nagmarka ang may-ari ng dami bilang damaged sa isang produkto, may row na isinusulat sa `inventory_transactions` na may `type = 'damaged'`, a `reason_code` ('expired' | 'physical' | 'pest' | 'moisture' | 'other'), at free-text note.
- Isang "Damaged goods" report na nag-a-aggregate ng mga lugi (sa dami at sa `cost_price` money impact) ayon sa dahilan at panahon.
- Isang write-off action na pinagsasama ang near-expiry + damaged sa iisang recorded loss na may parehong audit trail.

## Hindi Kasama sa Saklaw (Out of Scope)

- Auto-expiry notifications. Inaasahang titingnan ng may-ari ang listahan.
- Batch-level expiry tracking. Per-product expiry ay sapat na para sa v1.
- Predictive spoilage modeling.

## Mga Implikasyon sa Data (Data Implications)

- Bagong columns sa `products`: `perishable` INTEGER NOT NULL DEFAULT 0, `expiry_date` TEXT (nullable ISO date).
- Ang umiiral na `inventory_transactions` table ay sumusuporta na sa `type = 'damaged'`. Dagdagan ng `reason_code` column kung wala pa.
- Bagong talahanayan na `damaged_goods_log`: `id`, `product_id` (FK), `reason_code` TEXT, `note` TEXT, `quantity` INTEGER, `cost_price_snapshot` INTEGER, `created_at` TEXT.
- Bagong mga function sa `database/inventory.ts`: `getNearExpiry({ withinDays })`, `logDamagedGoods({ productId, quantity, reasonCode, note })`, `getDamagedGoodsReport({ from, to, groupBy })`.
- Bagong hook sa `hooks/useInventory.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 7 (voids/refunds) — ang damaged return ay maaari ding maging refund.
- Tampok 4 (physical stocktake) — ang stocktake ay makakagawa ng damaged rows gamit ang parehong reason code vocabulary.

## Mga Kaugnay na Tampok

- **Pisikal na variance:** [[04-physical-stocktake|04. Physical Stocktake]] ay maaaring magtala ng spoilage bilang bahagi ng counted-stock adjustment.
- **Returned item:** [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, at Corrections]] ay nag-aayos ng sale kapag ang nasirang item ay ibinalik ng customer.
- **Makikitang audit trail:** [[10-stock-movement-timeline|10. Stock Movement Timeline]] ay nagpapakita ng damaged at write-off transaction.
- **Protektadong write-off:** [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] ang natural na gate para sa sensitibong pagkawala ng stock.

## Mga Open Question

- Paano ina-configure ang "near expiry" window bawat may-ari?
- Ang `cost_price_snapshot` ba ay redundant sa `inventory_transactions.unit_cost`?
- Ang "write-off" action ba ay nangangailangan ng PIN gating (tampok 11)?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang data model ay magaan. Ang pinakamahirap na bahagi ay ang UI: pagpapanatiling opsyonal ng per-product expiry field.
- Ang epekto sa pera ay display-only; ang cost ay nakaimbak bilang integer pesos sa `cost_price_snapshot`.
