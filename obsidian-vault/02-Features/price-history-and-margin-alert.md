---
title: Price History and Margin Alert Spec
created: 2026-11-13
tags: [feature, pricing, inventory, supplier, margin]
type: feature-spec
status: active
---

> Phase: Susunod (Next)
> Category: Money Flow & Pricing

Buong teknikal na disenyo: `docs/superpowers/specs/2026-11-13-price-history-margin-alert-design.md`. Ang note na ito ang buod; ang design doc ang awtoridad sa detalye ng schema at code.

## Problema

Kapag tumaas ang puhunan mula sa supplier pero hindi nabago ang presyo ng benta, lumiliit ang tubo nang hindi napapansin ng may-ari. Naitatala na ang aktwal na puhunan sa [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]], pero walang kasaysayan ng pagbabago ng puhunan at presyo, at walang babala kung aling paninda ang dapat nang i-reprice.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong makita agad pagkatapos kong i-save ang delivery kung aling mga paninda ang tumaas ang puhunan, kasama ang mungkahing bagong presyo, upang ma-update ko ang presyo sa isang tap at hindi malugi ang tubo ko.

## Mga Napagpasyahan (2026-11-13)

- **Saan lalabas ang babala:** review sheet pagkatapos mag-commit ng delivery, at isang listahan ng "kailangang i-reprice" na may bilang sa More tab.
- **Kailan mafa-flag:** tumaas ang unit cost at hindi nabago ang presyo ng benta. Walang threshold setting.
- **Mungkahing presyo:** panatilihin ang parehong markup percent, naka-round up sa buong piso. `ceil(new_cost * price_at_flag / baseline_cost)`.
- **Imbakan ng kasaysayan:** sariling table na isinusulat ng application code sa loob ng parehong transaction. Hindi derived at hindi SQLite trigger.
- Ang may-ari ang laging nagkokonpirma. Hindi kailanman tahimik na binabago ng app ang presyo.

## Kasama sa Saklaw (In Scope)

- Kasaysayan ng pagbabago ng retail cost at retail price bawat produkto (`product_price_changes`).
- Reprice flag bawat produkto na may mungkahing presyo (`reprice_flags`).
- Review sheet pagkatapos ng delivery commit: lumang puhunan, bagong puhunan, lumang markup, bagong markup, at mungkahing presyo na puwedeng i-edit.
- Mga aksyon: "Update price", "Keep price", at "Later".
- Listahan ng kailangang i-reprice mula sa More tab.
- Huling 10 pagbabago ng puhunan at presyo sa product edit form.

## Hindi Kasama (Out of Scope)

- Wholesale cost at wholesale price.
- Babala kapag bumaba ang puhunan. Naitatala lamang ito sa kasaysayan.
- Pag-rollback ng puhunan o flag kapag na-void ang delivery.
- Backfill ng kasaysayan bago ang migration 24.
- Bagong owner PIN gate.

## Mga Implikasyon sa Data

- Migration 24: `product_price_changes` at `reprice_flags`, parehong may `ON DELETE CASCADE` sa `products`.
- Integer pesos ang lahat ng halaga.
- Mga write path na madadagdagan: `database/inventory.ts` (`applyInventoryTransaction`) at `database/products.ts` (`updateProduct`).
- Bagong module: `database/priceHistory.ts`, `lib/repricing.ts`, `hooks/usePriceHistory.ts`.

## Mga Kaugnay na Tampok

- [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]] — pinagmumulan ng pagbabago ng puhunan.
- [[14-transparent-local-store-insights|14. Transparent Local Store Insights]] — ang margin-change signal nito ay maaaring bumasa sa `product_price_changes`.
- [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] — sinusunod ng reprice ang kasalukuyang gate ng price edit.

## Status

- [x] Proposed
- [x] Approved
- [ ] In Development
- [ ] Testing
- [ ] Completed
- [ ] Released
