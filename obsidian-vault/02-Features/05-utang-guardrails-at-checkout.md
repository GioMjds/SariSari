# 05. Mga Proteksyon sa Utang sa Checkout (Utang Guardrails at Checkout)

## Status: In Progress

> Phase: Kasalukuyan (Now)

## Problema

Ang utang ay ang panlipunang kasunduan (social contract) sa sari-sari store. Ngunit ang parehong kasunduan ay nagpapadali rin sa pagpapautang nang higit sa kaya o gustong bayaran ng suki. Ngayon, nakikita ng cashier ang pangalan ng customer sa credit sale ngunit walang live signal: ang kasalukuyang balanse, ang credit limit (kung mayroon man), ang mga araw na overdue sa pinakamatandang hindi paid credit, o kung ang suki ay nasa peligro. Ang mga desisyon ay ginagawa lamang mula sa memorya. Sa paglipas ng panahon, lumalaki ang mga utang at ang bad debt ay nagiging pinakamalaking panganib sa negosyo.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan na nagpoproseso ng credit sale, gusto kong makita ang kasalukuyang balanse ng suki, available credit, at overdue status sa mismong checkout screen, upang makapagdesisyon ako sa sandaling iyon kung magpapautang pa o hihingi muna ng bahagyang bayad.

## Kasama sa Saklaw (In Scope)

- Isang live suki panel sa credit-payment path na nagpapakita ng: kasalukuyang outstanding balance, credit limit (kung naka-configure bawat customer), available credit, at isang overdue badge kung may unpaid credit na lumampas sa N araw (default 30, pwedeng baguhin ng may-ari).
- Isang "Limit exceeded" warning na nagha-harang sa kumpirmasyon sa default at nangangailangan ng malinaw na owner override (PIN entry — umaasa sa tampok 11) upang magpatuloy.
- Isang non-blocking warning kapag ang suki ay "malapit na sa limit" (hal. nasa loob ng 20%) upang makapamili pa rin ang cashier na magpautang.
- Isang "Override reason" picker kapag ginamit ang owner override, kung saan ang dahilan ay maitatala sa benta para sa audit mamaya.

## Hindi Kasama sa Saklaw (Out of Scope)

- Risk scoring o auto-decisioning (Tampok 15 ang humahawak ng mas matalinong pagsusuri).
- Pagpapadala ng SMS sa suki. Walang outbound communication.
- Hard-blocking sa lahat ng credit sales; ang may-ari ay laging may huling pasya sa pamamanan ng override.

## Mga Implikasyon sa Data (Data Implications)

- Bagong columns sa `customers`: `credit_limit` INTEGER (nullable — null ibig sabihin "walang limit, i-track lang ang balanse"), `overdue_threshold_days` INTEGER.
- Bagong computed view o function sa `database/credits.ts`: `getCustomerCreditSummary(customerId)` na nagbabalik ng `{ balance, availableCredit, oldestUnpaidDate, overdueDays, isOverdue }`.
- Bagong hook sa `hooks/useCredits.tsx` para magpakain sa checkout screen.
- Ang override ay naitala bilang column sa `sales` row: `override_reason_code` TEXT (nullable).
- Bagong migration na nagtataas ng `user_version` lampas sa 9.

## Mga Dependency (Dependencies)

- Tampok 11 (owner PIN) ay isang hard dependency para sa override flow. Kung walang PIN, ang override ay isang "reason" picker lamang na walang gate. Ang natitirang bahagi ng tampok na ito (display + warn, walang override) ay maaaring maipalabas nang mas maaga sa 11.
- Tampok 15 (smarter credit profiles) ay nagtatayo rito.

## Mga Open Question

- Ang credit limit ba ay isang hard cap ("hindi pwedeng lumampas ang balanse") o soft cap ("magbabala kapag lumampas")? Ang default ay dapat soft na may per-owner toggle sa hard.
- Ano ang default overdue threshold (mga araw)? Default na 30 araw.
- Lumalabas ba ang suki panel sa cash sale din (informational) o kapag naka-attach lamang ang suki sa credit path?

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang balanse ng suki ay kinakalkula na nang live ayon sa mga patakaran ng financial guardrails sa CLAUDE.md: `SUM(amount) - SUM(amount_paid)` sa mga hindi pa bayad na `credit_transactions`.
- Ang logic ng `payment_allocations` FIFO mula sa migration v3 ang nagpapawasto sa live balance.
- Ang pagpapakita ng pera ay dumadaan sa `lib/money.ts`. Ang column na `credit_limit` ay integer-pesos.
