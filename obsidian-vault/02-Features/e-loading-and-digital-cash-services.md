---
title: E-Loading and Digital Cash Services Spec
created: 2026-08-22
tags: [feature, services, gcash, maya, eload, financial]
type: feature-spec
status: active
---

> Phase: Susunod (Next)
> Category: Store Operations & Services

## Problema

Higit sa 80% ng mga modernong sari-sari store sa Pilipinas ay nag-aalok ng mga digital na serbisyo: GCash Cash-In, GCash Cash-Out, Maya, at Smart/Globe/DITO telco load. Ang mga serbisyong ito ay hindi tradisyunal na paninda; ang mga ito ay transaksyon ng palitan ng pera (digital float laban sa physical cash) kung saan ang kita ay nagmumula lamang sa service charge o "patong" (hal. ₱10 kada ₱500 cash-in).

Kasalukuyan, kapag nagtala ang may-ari ng digital transaction bilang regular product sale sa POS:

1. Tumataas nang mali ang Gross Sales at Cost of Goods Sold (COGS) ng tindahan, kaya nadidistort ang kabuuang profit margin.
2. Kapag hindi naman ito itinala sa app, nagkakaroon ng malaking variance sa pagsasara ng kaha ([[03-daily-cash-close-out|03. Daily Cash Close-Out]]) dahil nagbago ang physical cash sa drawer nang walang kaukulang rekord.
3. Walang paraan upang subaybayan ang natitirang digital balance o float sa bawat e-wallet app.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto kong magkaroon ng nakalaang digital ledger para sa GCash, Maya, at telco load, upang masubaybayan ko ang aking float balances, maitugma ang pisikal na pera sa kaha tuwing cash-in/out, at maihiwalay ang kita sa service fee (patong) mula sa benta ng pisikal na paninda.

## Kasama sa Saklaw (In Scope)

- **Pamamahala ng Digital Wallets / Floats**:
  - Pagtatakda ng mga digital account (hal. "GCash Float", "Maya Float", "Smart Load Float", "Globe Load Float") na may panimulang balanse.
  - Manual na float replenishment (pag-cash in o paglipat ng pondo mula sa kaha o personal bank account patungo sa digital wallet).
- **Mga Uri ng Transaksyon**:
  - **Cash-In (Customer nagbigay ng Cash, natanggap ang Digital GCash/Maya)**:
    - Bawas sa Digital Float: `-Halaga`
    - Dagdag sa Kaha (Cash Drawer): `+Halaga + Service Fee`
    - Kita ng Tindahan (Pure Service Revenue): `+Service Fee`
  - **Cash-Out (Customer nagpadala ng Digital GCash/Maya, natanggap ang Cash)**:
    - Dagdag sa Digital Float: `+Halaga`
    - Bawas sa Kaha (Cash Drawer): `-Halaga` (o ibabawas ang fee sa ibibigay na pera)
    - Dagdag sa Kaha (mula sa Service Fee kung hiwalay na ibinayad): `+Service Fee`
    - Kita ng Tindahan: `+Service Fee`
  - **Telco E-Load**:
    - Bawas sa Load Float: `-Halaga ng Load`
    - Dagdag sa Kaha: `+Bayad ng Customer (Load + Patong)`
    - Kita ng Tindahan: `+Patong`
- **Pagsasama sa Daily Cash Close-Out**:
  - Ang physical cash net movement (`cashInAmount - cashOutAmount + totalServiceFees`) ay awtomatikong isinasama sa `expectedCash` calculation sa [[03-daily-cash-close-out|03. Daily Cash Close-Out]].
- **Hiwalay na Ulat ng Kita (Separate Revenue Reporting)**:
  - Ang kinita mula sa service charges (_patong_) ay iniuulat bilang "Service Income" o "Komisyon sa E-Services" sa Income Statement, hiwalay sa Product Gross Sales.
- **Offline at Mabilisang Entry Interface**:
  - Nakalaang screen o tab sa ilalim ng POS o More: "E-Services / Loading".
  - Mabilisang computation ng karaniwang tier fee (hal. ₱10 bawat ₱500).

## Hindi Kasama sa Saklaw (Out of Scope)

- Direct API integration o SMS scraping sa GCash / Maya / Telco gateways (100% offline manual logging upang maiwasan ang account suspension at dependency sa internet).
- Pautang na digital load (kung pautang, itatala ito sa ilalim ng suki credit ledger).
- Automated OTP handling o digital wallet password storage.

## Mga Implikasyon sa Data (Data Implications)

- **Bagong Talahanayan `digital_wallets`**:
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `name` TEXT NOT NULL (hal. 'GCash', 'Maya', 'Globe Load')
  - `wallet_type` TEXT NOT NULL CHECK(wallet_type IN ('gcash', 'maya', 'telco_load', 'bank', 'other'))
  - `current_balance` INTEGER NOT NULL DEFAULT 0 (sa integer pesos o centavos)
  - `is_active` INTEGER NOT NULL DEFAULT 1
  - `created_at` TEXT NOT NULL
- **Bagong Talahanayan `digital_transactions`**:
  - `id` INTEGER PRIMARY KEY AUTOINCREMENT
  - `wallet_id` INTEGER NOT NULL REFERENCES digital_wallets(id)
  - `transaction_type` TEXT NOT NULL CHECK(transaction_type IN ('cash_in', 'cash_out', 'eload', 'replenish', 'adjustment'))
  - `principal_amount` INTEGER NOT NULL (halaga ng ipinadala/tinanggap)
  - `service_fee` INTEGER NOT NULL DEFAULT 0 (patong/kita)
  - `cash_drawer_delta` INTEGER NOT NULL (epekto sa physical drawer cash)
  - `reference_number` TEXT (opsyonal na reference code ng GCash/Maya)
  - `customer_phone` TEXT (opsyonal)
  - `note` TEXT
  - `created_at` TEXT NOT NULL
- **Mga Database Function (`database/digitalServices.ts`)**:
  - `createDigitalTransaction(...)` na nagpapatakbo sa loob ng `db.withTransactionAsync` (nag-a-update ng `digital_wallets.current_balance` at nagla-log ng row sa `digital_transactions`).
  - `getDigitalServicesSummary({ from, to })`
  - `getWalletsWithBalances()`
- **Hooks (`hooks/useDigitalServices.ts`)**:
  - `useWallets()`, `useDigitalTransactions()`, `useRecordDigitalTransaction()`, `useReplenishWallet()`

## Mga Dependency (Dependencies)

- [[03-daily-cash-close-out|03. Daily Cash Close-Out]]: Ginagamit ang `cash_drawer_delta` upang tumpak na ma-reconcile ang opening float at closing cash.
- [[11-owner-pin-for-sensitive-actions|11. Owner PIN]]: Maaaring i-gate ang manual float adjustments o balance edits.

## Mga Kaugnay na Tampok

- **Pagsasara ng Kaha:** [[03-daily-cash-close-out|03. Daily Cash Close-Out]] — kailangang malaman kung magkano ang pisikal na perang pumasok o lumabas dahil sa GCash.
- **Pagtatala ng Benta:** [[01-pos-fast-lane|01. POS Fast Lane]] — pinapanatiling hiwalay ang digital transactions sa shopping cart ng regular na paninda.
- **Pagsusuri ng Kita:** [[14-transparent-local-store-insights|14. Transparent Local Store Insights]] — ipinapakita kung magkano ang naiambag ng digital commissions sa kabuuang kita.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang modelong ito ay nagliligtas sa tindahan mula sa pinakamalaking sanhi ng cash discrepancy sa kasalukuyang panahon.
- Pera: Lahat ng balance, principal, at fee ay integer pesos na pinamamahalaan ng `lib/money.ts`.
