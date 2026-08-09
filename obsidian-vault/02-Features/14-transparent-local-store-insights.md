# 14. Malinaw at Lokal na Pagsusuri ng Tindahan (Transparent Local Store Insights)

> Phase: Sa Haharapin (Later)

## Problema

Nakaipon ang may-ari ng isang taong data sa benta, restock, at kasaysayan ng suki, ngunit wala silang oras upang minahin ito. Naghihinala sila ng mga poll ("Palaging naubos ang Coke kapag Biyernes," "Problema ang account ni Mang Jose") ngunit hindi ito makumpirma. Ang mga external analytics tools ay naghihingi ng kanilang data; ayaw ng may-ari na i-upload ito. Ang data ay naroon mismo sa aparato, hindi nagagamit.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng maliit na hanay ng mga simpleng pahiwatig (insights) sa malinaw na wika na nanggagaling sa kasaysayan ng aking sariling tindahan, upang makakilos ako sa mga pola nang hindi gumagamit ng spreadsheet.

## Kasama sa Saklaw (In Scope)

- Isang "Tips" surface sa app, na nagkakalpula sa aparato lamang, na nagpapakita ng maikling listahan ng mga nakikitang obserbasyon:
  - Mga item na paulit-ulit na nawawalan ng stock (mga negatibong shelf days sa nakaraang 60 araw, batay sa `inventory_transactions` at kasalukuyang `products.quantity`).
  - Dead stock (walang benta sa nakaraang 90 araw, kumukuha ng kapital at lugar sa estante).
  - Mga pagbabago sa margin kung saan ang `cost_price` ay tumaas o bumaba nang malaki sa nakaraang 30 araw.
  - Pola ng pagbabayad ng suki: sinong suki ang nagbabayad sa oras, sino ang huli, at sino ang may lumalaking balanse.
- Bawat tip ay maipapaliwanag: ang pag-tap dito ay nagpapakita ng mga numerong nasa ilalim (panahon, mga produkto, suki, kabuuan) upang magtiwala ang may-ari sa tip.
- Ang mga tip ay nagre-regenerate sa gabi at kapag hiningi. Walang background work na hindi hiningi ng user.

## Hindi Kasama sa Saklaw (Out of Scope)

- Cross-store comparisons, benchmarks, o anumang nangangailangan ng data mula sa labas ng aparatong ito.
- Predictive o ML-based recommendations. Ang "Insight" dito ay nangangahulugang nagmula na katotohanan (derived fact), hindi output ng modelo.
- Push notifications para sa mga bagong tip.

## Mga Implikasyon sa Data (Data Implications)

- Walang bagong talahanayan. Lahat ng signal ay nakukuha mula sa umiiral na mga talahanayan (`sales`, `sale_items`, `inventory_transactions`, `products`, `credit_transactions`, `payment_allocations`).
- Isang computed view sa `database/stock-intelligence.ts` (o bagong `database/insights.ts`): `getStoreTips()` na nagbabalik ng maliit na listahan ng typed tip objects.
- Ang umiiral na `useStockIntelligence` hook ay maaaring palawakin, o magdagdag ng bagong `hooks/useInsights.tsx`.
- Walang migration.

## Mga Dependency (Dependencies)

- Nagbabahagi ng velocity at signal math sa tampok 9 (reorder suggestions) at tampok 10 (stock movement timeline).
- Tampok 15 (smarter credit profiles) ay nagbabahagi ng kalkulasyon sa pola ng pagbabayad ng suki.

## Mga Open Question

- Gaano kadalas nagre-regenerate ang listahan ng tips? Sa bawat pagbukas ng app.
- Ano ang maximum na bilang ng tips na ipinapakita? Limang hanggang pitong tip.
- Maaari bang i-dismiss ng may-ari ang tip ("Alam ko na ito")?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Bawat kalkulasyon ay lokal at pwedeng muling buuin mula sa data.
- Pera: Anumang tip na may hawak na pera (pagbabago sa margin, kapital sa dead stock) ay gumagamit ng integer-pesos at `formatPesos` para sa pagpapakita.
