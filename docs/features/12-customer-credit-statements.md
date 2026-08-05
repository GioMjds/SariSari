# 12. Pahayag ng Utang ng Suki (Customer Credit Statements)

> Phase: Susunod (Next)

## Problema

Nagtatanong ang suki ng kanilang balanse. "Ano na utang ko?" Kailangang ihinto ng may-ari ang kanilang ginagawa, kalkulahin ang kwenta, at sumagot. Minsan tinututulan ng suki ang isang halaga, o kailangang i-settle ng may-ari ang mga account sa dulo ng isang mahabang relasyon. Walang portable at on-the-spot na paraan upang ipakita sa suki "eto ang binili mo, eto ang ibinayad mo, eto ang natitira." Ang tindahan ay kailangang mag-handwrite ng listahan o sabihin sa suki na magtiwala na lang sa salita ng may-ari.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong mag-print o mag-share ng credit statement para sa isang suki, upang ang suki ay magkaroon ng nakasulat na rekord at ang may-ari ay magkaroon ng patunay kung ano ang ipinautang at ano ang naibayad.

## Kasama sa Saklaw (In Scope)

- Isang "Statement" action sa profile ng suki na gumagawa ng printable / shareable document na sumasaklaw sa napiling date range (default: huling 30 araw, o mula sa huling statement).
- Ang statement ay nagpapakita, ayon sa pagkakasunod-sunod: opening balance, bawat credit transaction na may petsa at halaga, bawat bayad na may petsa at halaga, at closing balance.
- Dalawang output formats:
  - PDF, na ginawa sa pamamagitan ng umiiral na `lib/pdfGenerator.ts` helper. Ang PDF ay nabubuksan sa anumang device PDF viewer.
  - Isang simpleng text-only "share" payload (plain text o HTML) para sa mga messaging app na hindi mahusay mag-render ng PDF.
- Ang statement ay mai-share sa pamamagitan ng native share sheet ng aparato (walang in-app messaging, walang email server).
- Ang paggawa nito ay 100% offline.

## Hindi Kasama sa Saklaw (Out of Scope)

- Pag-print sa isang thermal printer mula sa loob ng app (ang share sheet ay pwedeng mag-route sa printer).
- Watermarking o pag-sign sa PDF. Ang statement ay informal at nakabatay sa tiwala ng relasyon.
- Bulk statements. Isang suki sa bawat pagkakataon ang workflow.

## Mga Implikasyon sa Data (Data Implications)

- Walang bagong talahanayan. Ang data ay naroon na sa `credit_transactions` at `payment_allocations`.
- Bagong function sa `database/credits.ts`: `getCustomerStatement(customerId, { from, to })` na nagbabalik ng `{ openingBalance, lines: Array<{ date, kind, amount, refId }>, closingBalance }`.
- Bagong function (o extension) sa `lib/pdfGenerator.ts` para sa statement layout.
- Bagong hook sa `hooks/useCredits.tsx` na naglalabas ng statement builder at "share" trigger.
- Walang migration.

## Mga Dependency (Dependencies)

- Ang `lib/pdfGenerator.ts` module ay dapat sumusuporta sa mga primitives na kailangan ng tampok na ito (mga talahanayan, kabuuan, page breaks).

## Mga Open Question

- Default na date range: huling 30 araw.
- Kasama ba sa statement ang per-line item breakdown (anong mga produkto ang binili), o ang credit total lamang bawat transaksyon? Inirerekomenda ang may detalyeng bersyon na may toggle para i-collapse.
- Ang statement ba ay ginagawa on demand o nino-note sa cache? On demand ang mas simple.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang patakaran sa integer-pesos ay nag-aaplay: ang mga halaga ng statement ay naka-format sa pamamagitan ng `formatPesos` sa pag-render.
- Walang bagong external libraries na kinakailangan. Ang umiiral na `lib/pdfGenerator.ts` plus ang standard React Native share APIs ay sapat na.
