# 06. Pila ng Paniningil ng Utang (Collection Queue)

> Phase: Kasalukuyan (Now)

## Problema

Ang paghingi ng utang ay nakakailang. Kailangang alalahanin ng may-ari kung sino ang may utang, sino ang huli na sa pagbabayad, at sino ang malapit na sa kanilang limit, at pagkatapos ay tanungin ang bawat isa nang mukhaan nang walang malinaw na talaan. Mabigat ang mental load — bawat suki na nakikita nila sa buong araw, kailangan nilang kalkulahin ang balanse mula sa memorya bago magdesisyon kung magpapaalala ng bayad. Ang ilang may-ari ay nagtatago ng kuwaderno. Karamihan ay hindi, at ang mga utang ay unti-unting tumatanda at nalilimutan.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng malinaw na listahan ng mga suki na overdue o malapit na sa kanilang limit, na may isang-tap na paraan upang maitala ang bahagya o buong bayad, upang makapaningil ako nang may kumpiyansa at nang hindi nagkakalpyula sa aking isip.

## Kasama sa Saklaw (In Scope)

- Isang "Collection" surface sa ilalim ng Customers/Utang tab na nagpapakita ng mga suki na naka-rank ayon sa kahalagahan ng paniningil: overdue muna, kasunod ang malapit sa limit, at pagkatapos ay ang pinakamatagal na hindi paid balance.
- Summary bawat row: outstanding balance, mga araw mula huling bayad, edad ng pinakamatandang hindi paid credit, near-limit flag.
- Isang "Record payment" action na nagbubukas ng maliit na amount-and-method sheet at nagsusulat sa umiiral na `payments` + `payment_allocations` flow (pinananatili ang FIFO allocation).
- Isang opsyonal na "Follow up by" date bawat suki, na lalabas bilang maliit na reminder chip. Lokal lamang; walang notifications.
- Isang "Mark contacted" log entry bawat follow-up, upang makita ng may-ari na napaalalahanan na nila ang isang tao ngayong araw.

## Hindi Kasama sa Saklaw (Out of Scope)

- SMS, tawag, o anumang outbound communication.
- Auto-reminders o push notifications. Single-device, walang backend.
- Collections agencies o third-party workflows.

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `collection_followups`: `id`, `customer_id` (FK), `follow_up_by` TEXT (date), `status` ('open' | 'contacted' | 'closed'), `note` TEXT, `created_at` TEXT.
- Isang bagong function sa `database/credits.ts`: `getCollectionQueue({ overdueDays, nearLimitPct })` na nagbabalik ng naka-rank na listahan gamit ang parehong `credit_transactions` / `payment_allocations` SQL na ginagamit ng natitirang app.
- Bagong hook sa `hooks/useCredits.tsx` na nagbabalik ng queue.
- Ang "Record payment" ay muling gumagamit ng umiiral na payment recording path (`add-payment` route sa ilalim ng `app/(edit-forms)/`).
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 5 (utang guardrails at checkout) — ang per-suki balance, limit, at overdue data ay pareho; binabasa ito ng tampok na ito.
- Tampok 15 (smarter credit profiles) — kapag mayroon nang profiles, maaari ding i-rank ng queue ang suki ayon sa profile.

## Mga Open Question

- Gaano ka-aggressive ang default ranking? Pure "overdue first" o weighted score?
- Ang queue ba ay nakatira sa ilalim ng Customers tab o bilang hiwalay na top-level tab?
- Ang "Follow up by" date ba ay isang soft chip lamang o nangangailangan ng notifications? (Soft chip lamang).

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang credit/payment tables ay tama na: `payment_allocations` na may FIFO, reversible sa pagbura ng payment. Hindi ito nagpapakilala ng bagong money math — ipinapakita lamang nito ang umiiral na.
- Ang "Record payment" tap ay pwedeng mag-deep-link sa umiiral na `add-payment` screen kung saan naka-pre-select na ang customer.
- Ang mga follow-up ay lokal, single-device, single-user. Walang sync.
