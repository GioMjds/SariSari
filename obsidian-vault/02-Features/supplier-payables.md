---
title: Supplier Payables Spec
created: 2026-11-13
tags: [feature, supplier, payables, money-flow, utang]
type: feature-spec
status: draft
---

> Phase: Susunod (Next)
> Category: Money Flow

Buong teknikal na disenyo: `docs/superpowers/specs/2026-11-13-supplier-payables-design.md`. Ang note na ito ang buod; ang design doc ang awtoridad sa detalye ng schema at code.

## Problema

Madalas kumukuha ng paninda ang may-ari sa supplier at ahente nang utang at nagbabayad sa ibang araw. Naitatala na ng [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]] kung magkano ang delivery, pero walang talaan kung bayad na ito, kung kailan ang due date, o kung magkano pa ang utang sa bawat supplier.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong itala kung ang delivery ay bayad na, utang, o bahagyang bayad, at makita agad kung sino ang may utang pa ako at alin ang lampas na sa due date, upang hindi ako makalimot magbayad at hindi masira ang relasyon sa supplier.

## Mga Napagpasyahan (2026-11-13)

- **Pinagmumulan ng payable:** pareho. Ang delivery commit ay may pagpipiliang Paid now, Utang, o Partial. May manual na "Add utang" para sa ahente o paninda na walang resibo.
- **Paglalapat ng bayad:** pinakaluma muna (FIFO), kapareho ng suki ledger. Nababawi ang allocation kapag binura ang bayad.
- **Pera at gastos:** hiwalay ito sa expense log. Hindi nagsusulat sa `financial_entries` ang payables o payments, dahil puhunan sa paninda ito at hindi gastos sa operasyon.
- **Due date:** opsyonal na default terms (araw) bawat supplier ang nagpa-pre-fill ng due date. Puwedeng baguhin o alisin ng may-ari.
- **Data model:** tatlong table na kahawig ng suki ledger: payables, payments, allocations.

## Kasama sa Saklaw (In Scope)

- `supplier_payables`, `supplier_payments`, `supplier_payment_allocations`, at `suppliers.payment_terms_days`.
- Pagpili ng bayad sa delivery commit: Paid now, Utang, Partial.
- Manual na "Add utang".
- Pagtala at pagbura ng bayad sa supplier, FIFO, nababawi.
- Listahan ng payables na may balanse bawat supplier at overdue na estado, supplier detail screen, at More tab row na may overdue badge.
- Payment terms na field sa supplier form.

## Hindi Kasama (Out of Scope)

- Interes o multa.
- Post-dated checks.
- Push o naka-iskedyul na paalala.
- Hiwalay na ahente na entity. Ang ahente ay supplier.
- Bagong owner PIN gate sa pagbabayad.
- Koneksyon sa daily close-out, savings goal, o capital split.
- Backfill ng mga resibong na-commit bago ang migration 25. Ituturing silang bayad na.
- Pagsulat ng supplier payments sa `financial_entries`.

## Mga Implikasyon sa Data

- Migration 25: tatlong bagong table at `payment_terms_days` sa `suppliers`. Integer pesos ang lahat ng halaga.
- Balanse, bayad, at overdue ay kinukuwenta sa tuwing babasahin. Hindi ito iniimbak.
- Mga write path na babaguhin: `commitDeliveryReceipt` at `voidDeliveryReceipt` sa `database/deliveries.ts`.
- Hindi puwedeng i-void ang delivery na may bayad na naka-allocate sa payable nito. Buburahin muna ang mga bayad.
- Bagong module: `database/supplierPayables.ts`, `lib/payables.ts`, `hooks/useSupplierPayables.ts`.
- Screen: `app/settings/payables.tsx` at `app/settings/payables/[supplierId].tsx`; mga component sa `components/payables/`.

## Mga Kaugnay na Tampok

- [[08-supplier-delivery-receiving|08. Supplier Delivery Receiving]] — pinagmumulan ng resibo at ng commit at void flow.
- [[06-collection-queue|06. Collection Queue]] — ang panig ng suki na ginagaya ng feature na ito.
- [[price-history-and-margin-alert|Kasaysayan ng Presyo at Babala sa Tubo]] — kapatid na money-flow feature, hindi apektado.

## Status

- [x] Proposed
- [ ] Approved
- [ ] In Development
- [ ] Testing
- [ ] Completed
- [ ] Released
