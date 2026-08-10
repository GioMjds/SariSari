# 03. Pang-araw-araw na Pagre-reconcile ng Kaha (Daily Cash Close-Out)

## Status: DONE

> Phase: Kasalukuyan (Now)

## Problema

Sa katapusan ng araw, kailangang i-reconcile ng may-ari ang kaha. Binubuksan nila ang drawer, binibilang ang aktwal na pera, at ikinukumpara sa sinasabi ng register na dapat naroroon. Ngayon, ito ay isang mental na ehersisyo lamang laban sa Excel sheet o kuwaderno. Ang perang nawawala sa badyet ng bahay, sa sukli ng suki, o sa mali sa pagbilang ay hindi nakikita. Sa loob ng isang buwan, maaari itong maging malaking halaga, at walang audit trail ang may-ari upang imbestigahan.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na nagsasara sa gabi, gusto kong maitala ang opening cash sa araw na iyon, bawat cash-in at cash-out, ang nabiling pera sa kaha, at ang inaasahan laban sa aktwal na variance na may dahilan, upang makita at mapatigil ko ang tahimik na pagkawala ng pera.

## Kasama sa Saklaw (In Scope)

- Isang daily close-out record na nagtatala ng: opening float, kabuuang cash sales (mula sa `sales`), kabuuang cash refunds/voids (kapag dumating ang tampok 7), kabuuang cash na natanggap para sa utang, kabuuang cash na ibinayad (gastos, kuha ng may-ari), closing count, at variance.
- Isang "Cash In / Cash Out" log para sa mga paggalaw ng pera na hindi benta (pagkuha ng pera, pagbili sa supplier gamit ang cash, sukli na dinala mula sa bahay), bawat isa ay may reason code at opsyonal na note.
- Variance reason codes (mali sa pagbilang, sukli ng suki, pinaghihinalaan, atbp.) na lumalabas sa simpleng monthly summary.
- Isang "Close day" confirmation na nag-lo-lock sa rekord at nagpapakita nito sa history list.

## Hindi Kasama sa Saklaw (Out of Scope)

- Real-time cash-register tracking. Ang pagbilang ay nangyayari lamang sa pagsasara.
- Multi-shift handover (ito ay single-owner; ang shift tracking ay tampok 16).
- Bank reconciliation, deposit tracking, o anumang banking integration.

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `cash_ledger_entries`: `id`, `date`, `direction` ('in' / 'out'), `amount` INTEGER, `reason_code` TEXT, `note` TEXT, `sale_id` (nullable FK sa `sales`), `created_at`.
- Bagong talahanayan na `daily_close_outs`: `id`, `date` (UNIQUE), `opening_float` INTEGER, `closing_count` INTEGER, `expected_cash` INTEGER, `variance` INTEGER, `variance_reason_code` TEXT, `variance_note` TEXT, `closed_at` TEXT.
- Bagong mga function sa `database/cash.ts`: `getCashMovementForDate(date)`, `insertCashLedgerEntry(entry)`, `closeDay({ date, openingFloat, closingCount, varianceReason })`.
- Bagong hook sa `hooks/useCash.tsx` para sa close-out screen.
- Ang "expected cash" ay kinakalkula sa oras ng pagsasara mula sa `opening_float + SUM(cash_in) - SUM(cash_out)`, lahat sa integer arithmetic. Ang bagong code path ay dapat dumating sa `lib/money.ts` para sa anumang input/display formatting.
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 7 (safe voids/refunds) — ang mga void at refund ay kailangang pumasok sa daily cash movement upang manatiling tama ang kalkulasyon sa pagsasara.

## Mga Open Question

- Kailangan bang ma-edit ng may-ari ang nakaraang close-out (kung may maling bilang na natuklasan kinaumagahan)? Kung oo, ang mga edit ay dapat append-only na may `corrected_by` row sa halip na i-overwrite.
- Ano ang retention policy para sa cash ledger entries?
- Paano natin hahawakan ang araw na hindi naisara? Ang dashboard ay dapat magpakita ng stale-day warning.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Lahat ng data ay lokal na SQLite, angkop sa offline-first model.
- Ang pera ay dumadaloy lamang sa integer-pesos columns at `lib/money.ts`.
- Ang close-out ay isang solong multi-statement transaction gamit ang `db.withTransactionAsync`.
