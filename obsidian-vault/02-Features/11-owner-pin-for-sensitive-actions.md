# 11. PIN ng May-ari para sa Maselang Aksyon (Owner PIN for Sensitive Actions)

## Status: Done

> Phase: Susunod (Next)
> Implemented in PR #23 (commit `ad1bd65`)

## Problema

Ang sari-sari store ay may shared device. Ang isang katulong, kamag-anak, anak na tumutulong, o suki na humahawak ng kanilang sariling cart ay maaaring humawak ng telepono. Ang ilang aksyon — pag-void ng benta, paglalagay ng discount, pagpapalawig ng utang lagpas sa limit ng suki, pag-adjust ng stock — ay maaaring mabilis na makawala ng totoong pera kung casually o malisyosong ginawa. Walang harang.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng PIN na nagha-harang sa mga pinakamahahalagang aksyon, upang magamit ng aking staff at pamilya ang register nang hindi nakakagawa ng mga pagbabagong nakakasama sa negosyo.

## Kasama sa Saklaw (In Scope) — Implemented

- Isang 4-6 digit na PIN ng may-ari, na naka-set up nang minsan sa unang maselang aksyon o sa Settings, nakaimbak nang lokal (SHA-256 hash + 16-byte random salt via `expo-crypto`) at hindi kailanman ini-upload.
- Isang PIN prompt na humaharang sa mga sumusunod na aksyon:
  - Voids, refunds, price corrections (tampok 7).
  - Manual stock adjustments sa labas ng stocktake flow sa Inventory Ledger.
  - Credit-limit override (tampok 5).
  - Malalaking discounts (threshold na tinukoy bawat may-ari sa `app_settings`, default: > 10% o > 50 pesos).
  - Settings access at authorization checks.
- Isang maikling lockout window pagkatapos ng 3 nabigong subok (60-segundong in-memory cooldown via `stores/useAuthStore.ts`).
- "Forgot PIN" recovery flow gamit ang 8-character base-32 owner recovery code (`XXXX-XXXX`) na ginagawa sa setup at naka-hash sa database.

## Hindi Kasama sa Saklaw (Out of Scope) — Updated

- ~~Biometric unlock (ang telepono ng tindahan ay maaaring walang maaasahang biometrics; ang PIN ay sapat na).~~ **Scope change:** Implemented as opt-in biometric authentication in `docs/superpowers/specs/2026-08-19-biometric-owner-auth-design.md`. The PIN remains the fallback; biometrics are off by default and require a configured PIN.
- Per-user PINs. Single-owner model; ang tampok 16 (shift tracking) ang lugar kung saan idadagdag ang per-cashier attribution kung kinakailangan.
- Server-side PIN validation. Walang server (offline-first).

## Arkitektura at Implementasyon (Implementation Architecture)

### 1. Data Layer & Migrations

- **Migration v20 (`database/migrations.ts`):** Lumilikha ng talahanayang `auth_settings` (singleton row `id = 1`) na naglalaman ng `pin_hash`, `pin_salt`, `recovery_code_hash`, `recovery_code_salt`, `created_at`, `updated_at`. Nagse-seed din ng `owner_pin_discount_threshold_pesos` (50) at `owner_pin_discount_threshold_percent` (10) sa `app_settings`.
- **Database Module (`database/auth.ts`):** Naglalaman ng mga sumusunod na function:
  - `initAuthTable()`
  - `isOwnerPinConfigured()`
  - `setupOwnerPin(pin)`
  - `verifyOwnerPin(pin)`
  - `verifyAndResetOwnerPinWithRecoveryCode(code, newPin)`
  - `changeOwnerPin(currentPin, newPin)`
- **Settings Module (`database/settings.ts`):** `getAppSetting()`, `setAppSetting()`, `isOwnerAuthorized()`, `assertOwnerAuthorized()`.

### 2. Cryptography & Security (`lib/auth/crypto.ts`)

- **Salt Generation:** `generateSalt()` gamit ang `Crypto.getRandomBytesAsync(16)` (32 hex characters).
- **PIN & Recovery Code Hashing:** `hashPin(pin, salt)` at `hashRecoveryCode(code, salt)` gamit ang `Crypto.digestStringAsync` (SHA-256 may input format na `${value}:${salt}`).
- **Recovery Code Format:** 8-character unambiguous base-32 string (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`) sa format na `XXXX-XXXX`.

### 3. State Management (`stores/useAuthStore.ts`)

- Pinamamahalaan ang transient auth state: `isPinConfigured`, `failedAttempts`, `lockoutUntil`.
- Automatic 60-second cooldown kapag umabot sa 3 failed attempts (`registerFailedAttempt()`, `isLockedOut()`, `getLockoutSecondsRemaining()`).

### 4. Guard Hook & Provider Context

- **`components/auth/OwnerPinGuardProvider.tsx`:** Naka-mount sa root layout (`app/_layout.tsx`). Nagbibigay ng context method na `runWithPinGuard({ title, actionDescription, onApproved })`. Awtomatikong nagpapakita ng setup modal kung wala pang PIN, o challenge modal kung naka-configure na.
- **`hooks/useOwnerPinGuard.ts`:** Hook para sa consumer components upang magpatakbo ng protected actions.

### 5. UI Components & Modals

- **`components/auth/OwnerPinModal.tsx`:** Challenge modal na may keypad, lockout timer banner, error messages, at link patungo sa recovery modal.
- **`components/auth/OwnerPinSetupModal.tsx`:** Two-step PIN configuration modal (PIN entry + confirmation) at recovery code presentation screen.
- **`components/auth/OwnerPinRecoveryModal.tsx`:** Modal para sa pag-verify ng recovery code at pagtatakda ng bagong PIN.
- **`components/settings/OwnerPinSettingsCard.tsx`:** Card sa Settings screen na nagpapakita ng status (Configured / Not Configured), mga button para sa Setup/Change/Reset PIN, at configurable discount threshold inputs (pesos at percent).

### 6. Mga Gated Touchpoint at Screen Routes

- **Sale Voids & Cash Refunds:** `app/(edit-forms)/sale-correction/[id].tsx` — pinoprotektahan ang `voidSale` at `refundSale`.
- **Price Corrections:** `app/(edit-forms)/price-correction/[id].tsx` at `components/sales/price-correction/usePriceCorrectionForm.ts` — pinoprotektahan ang per-line price updates.
- **Credit-Limit Override:** `components/utang/credit-guardrails/OverrideReasonModal.tsx` — pinoprotektahan ang pag-override ng utang limit ng suki.
- **Manual Stock Adjustments:** `components/inventory/ledger/LogTransactionForm.tsx` — pinoprotektahan ang manual adjustment transactions sa inventory ledger.
- **Settings & Owner Preferences:** `app/(tabs)/more/settings.tsx` (Owner PIN card) at `app/settings/index.tsx` (Owner authorization).
- **Corrections Audit Report:** `app/reports/corrections.tsx` — audit trail ng mga naaprubahang void, refund, at price correction.

### 7. Test Suite

- `tests/ownerPinGating.test.ts`: Unit tests para sa DB auth functions, crypto hashing, recovery code verification, at PIN changing.
- `tests/useOwnerPinGuard.test.tsx`: Integration tests para sa `OwnerPinGuardProvider`, challenge flow, setup triggering, at lockout management.

## Mga Kaugnay na Tampok

- **Credit-limit exception:** [[05-utang-guardrails-at-checkout|05. Utang Guardrails at Checkout]] ay humihingi ng PIN bago pahintulutan ang owner override.
- **Sale correction:** [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, at Corrections]] ay nangangailangan ng PIN para sa void, refund, at price correction.
- **Inventory adjustment:** [[04-physical-stocktake|04. Physical Stocktake]] ang hiwalay sa manual adjustment; ang huli ang PIN-protected sa Inventory Ledger.
- **Write-off decision:** [[13-expiry-and-damaged-goods-tracking|13. Expiry at Damaged-Goods Tracking]] ay maaaring gumamit ng parehong PIN guard sa write-off.
- **Shared-device identity:** [[16-shift-tracking-on-one-device|16. Shift Tracking]] ay magdaragdag ng cashier identity habang ang PIN ay nananatiling owner authority.
