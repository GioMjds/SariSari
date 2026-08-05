# 15. Mas Matalino ngunit Naipapaliwanag na Credit Profile (Smarter but Explainable Credit Profiles)

> Phase: Sa Haharapin (Later)

## Problema

Ngayon, inilalagay ng may-ari ang credit limit ng suki mula sa pakiramdam, o hindi man lang naglalagay nito. Ang ilang suki ay mabubuting tagabayad na ligtas sanang makakakuha ng higit pang utang. Ang ilan ay delikado at ang may-ari ay patuloy na nagpapalawig ng tiwala dahil sa personal na loyalty o social pressure, nang walang signal upang makapagtulak pabalik. Ang panganib ay hindi nakikita. Nanggagaling dito ang lokal at maiintindihang realizasyon ng mga profile ng suki.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng mungkahing credit limit para sa bawat suki, na may simpleng paliwanag kung bakit ginawa ang mungkahi, upang makapaglagay ako ng mga limitasyon na tumutugma sa kung paano totoong nagbabayad ang bawat suki.

## Kasama sa Saklaw (In Scope)

- Isang "Credit profile" bawat suki, na ginawa nang buo sa aparato, na nagpapakita ng:
  - Average na mga araw bago magbayad sa nakaraang 6 na buwan.
  - Bilang ng overdue credits (lumampas sa threshold ng may-ari, tingnan ang tampok 5).
  - Kasalukuyang balanse at trend ng balanse (tumataas, steady, bumababa).
  - Isang mungkahing credit limit (na may limitasyon sa lalagyan na itinatakda ng may-ari) kasama ang mga salik na nag-ambag.
- Ang mungkahi ay ipinapakita bilang rekomendasyon, hindi ipinapatupad nang awtomatiko. Ang may-ari ang laging nagtatakda ng aktwal na limit (o iniiwang walang limit).
- Isang "Why this suggestion?" explainer screen na nagpapakita ng mga input (averages, counts, caps) at kung paano nag-ambag ang bawat isa.

## Hindi Kasama sa Saklaw (Out of Scope)

- Awtomatikong pagpapatupad ng mungkahing limit (Tampok 5 ang humahawak ng pagpapatupad).
- Cross-suki risk scoring na nagra-rank sa "gaano kadelikado ang taong ito kumpara sa populasyon".
- Isang trained model. Ang mungkahi ay isang transparent na pormula sa maliit na bilang ng mga input.

## Mga Implikasyon sa Data (Data Implications)

- Walang bagong talahanayan na kinakailangan. Ang profile ay isang derived view sa `credit_transactions` at `payment_allocations`.
- Bagong function sa `database/credits.ts`: `computeCreditProfile(customerId, { lookbackDays, ceiling })` na nagbabalik ng typed profile object na may lahat ng intermediate values.
- Bagong hook sa `hooks/useCredits.tsx`.
- Ang resulta ng profile ay kinakalkula on demand.
- Walang migration.

## Mga Dependency (Dependencies)

- Tampok 5 (utang guardrails) ay nagse-set ng per-suki `credit_limit` column na iminumungkahi ng tampok na ito.
- Tampok 6 (collection queue) ay nagbabahagi ng overdue at "near limit" signal.
- Tampok 14 (local store insights) ay nagbabahagi ng kalkulasyon sa pola ng pagbabayad.

## Mga Open Question

- Ano ang pormula? Halimbawa: `suggestedLimit = min(ceiling, max(recentAverageMonthlyPurchases * 1.5, recentMaxBalance * 1.2))` na iniaayos pababa sa pamamagitan ng penalty para sa overdue count.
- Nag-a-update ba ang profile sa bawat pagbisita, o sa manual na "recompute" tap lamang?
- Nakikita ba ng may-ari ang profile para sa suki na wala pang kasaysayan ng utang?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang pormula ay maliit at maipapaliwanag. Huwag itong gawing "black box".
- Ang ceiling default ay dapat tumugma sa pinakamataas na limit na ibinigay ng may-ari, naka-cap sa makatwirang numero (hal. 10,000 pesos).
