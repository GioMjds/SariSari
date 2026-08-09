# 16. Pagtala ng Shift sa Iisang Aparato (Shift Tracking on One Device)

> Phase: Sa Haharapin (Later)

## Problema

Ang tindahan ay pinapatakbo ng isang tao sa iisang aparato, ngunit sa maraming kabahayan mayroong may-ari sa umaga at katulong sa gabi, o kasama na nagbabantay sa umaga. Kapag may lumabas na variance sa pera sa pagsasara (tampok 3) o kapag may kailangang imbestigahang void (tampok 7), walang ideya ang may-ari kung kaninong shift iyon. Ang sisi ay napupunta sa kung sinong katulong ang pinakahuling naroon, na hindi patas at hindi nakatutulong. Ang multi-device accounts ay labis; sa iisang aparato, ang magaan na shift model ay sapat na.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong markahan kung sinong cashier ang nasa register para sa kasalukuyang shift, upang ang mga variance sa pera at mga pagtatama ay may kaugnay na tao.

## Kasama sa Saklaw (In Scope)

- Isang maliit na listahan ng "Cashiers" na idinaragdag ng may-ari (pangalan + opsyonal na maikling PIN — hiwalay sa PIN ng may-ari, nakatutok lamang sa aksyon ng cashier).
- Isang "Active cashier" indicator sa POS tab; isang tap upang lumipat ng active cashier (o mag-sign out sa isang pangkalahatang "owner direct" state).
- Isang "Shift open" / "Shift close" pair ng mga aksyon. Ang pagbubukas ay nagtatala ng active cashier at opening float. Ang pagsasara ay nagtatala ng closing float at variance.
- Lahat ng voids (tampok 7), stock adjustments (tampok 4), at cash ledger entries (tampok 3) ay nagtatala ng active cashier sa oras na iyon.
- Isang "Shifts" report na naglilista ng mga kamakailang shift kasama ang kanilang variance.

## Hindi Kasama sa Saklaw (Out of Scope)

- Multi-device accounts. Isang aparato, isang tindahan, isa o dalawang taong nagbabahagi ng register.
- Payroll, scheduling, o attendance. Ang shift ay label lamang para sa attribution.
- Cashier-specific permissions lampas sa per-cashier PIN para sa pagkakakilanlan. Ang mga maselang aksyon ay nananatiling gated ng PIN ng may-ari (tampok 11).

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `cashiers`: `id`, `name`, `pin_hash` TEXT, `pin_salt` TEXT, `is_active` INTEGER, `created_at` TEXT.
- Bagong talahanayan na `shifts`: `id`, `cashier_id` (FK), `opened_at` TEXT, `closed_at` TEXT, `opening_float` INTEGER, `closing_count` INTEGER, `variance` INTEGER, `variance_reason_code` TEXT.
- Magdagdag ng `cashier_id` column sa `sale_corrections` (tampok 7), `inventory_transactions` (dagdagan ng nullable `actor_cashier_id` column), at `cash_ledger_entries` (tampok 3).
- Bagong mga function sa `database/shifts.ts`: `openShift({ cashierId, openingFloat })`, `closeShift({ closingCount, varianceReason })`, `getActiveShift()`, `listShifts({ from, to })`.
- Bagong hook sa `hooks/useShifts.tsx`.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Nagtatayo sa tampok 3 (daily cash close-out) — ang shift close ay kapareho ng per-shift close-out.
- Nagtatayo sa tampok 7 (voids/refunds) — ang `sale_corrections` ay kailangang kumuha ng cashier_id.
- Nagbabahagi ng hashing model sa tampok 11 (owner PIN).

## Mga Open Question

- Kailangan ba talaga ang cashier PIN, o sapat na ang pagpili ng pangalan sa listahan?
- Paano tumatawid ang mga shift sa hatinggabi? Ang "shift" ay nakakabit sa tao, hindi sa araw ng kalendaryo.
- Mayroon bang "no active cashier" mode para sa may-ari kapag nagtatrabaho nang mag-isa? Inirerekomenda: oo — isang malinaw na "Owner direct" pseudo-cashier.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang data model ay maliit. Ang panganib ay ang paglaki: ang tampok na ito ay maaaring lumaki sa isang buong HR system. Ang saklaw sa itaas ang proteksyon.
- Pera: ang opening at closing floats ay integer-pesos; walang money parsing sa labas ng `lib/money.ts`.
