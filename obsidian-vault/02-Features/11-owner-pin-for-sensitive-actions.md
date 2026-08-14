# 11. PIN ng May-ari para sa Maselang Aksyon (Owner PIN for Sensitive Actions)

## Status: In Progress

> Phase: Susunod (Next)

## Problema

Ang sari-sari store ay may shared device. Ang isang katulong, kamag-anak, anak na tumutulong, o suki na humahawak ng kanilang sariling cart ay maaaring humawak ng telepono. Ang ilang aksyon — pag-void ng benta, paglalagay ng discount, pagpapalawig ng utang lagpas sa limit ng suki, pag-adjust ng stock — ay maaaring mabilis na makawala ng totoong pera kung casually o malisyosong ginawa. Walang harang.

## Kuwento ng Gumagamit (User Story)

Bilang may-ari ng tindahan, gusto ko ng PIN na nagha-harang sa mga pinakamahahalagang aksyon, upang magamit ng aking staff at pamilya ang register nang hindi nakakagawa ng mga pagbabagong nakakasama sa negosyo.

## Kasama sa Saklaw (In Scope)

- Isang 4-6 digit na PIN ng may-ari, na naka-set up nang minsan sa unang maselang aksyon o sa Settings, nakaimbak nang lokal (hashed, hindi plain text) at hindi kailanman ini-upload.
- Isang PIN prompt na humaharang sa mga sumusunod na aksyon:
  - Voids, refunds, price corrections (tampok 7).
  - Manual stock adjustments sa labas ng stocktake flow.
  - Credit-limit override (tampok 5).
  - Malalaking discounts (threshold na tinukoy bawat may-ari, hal. > 10% o > 50 pesos).
  - Database reset / seed sa `app/(tabs)/dev/reset.tsx`.
- Isang maikling lockout window pagkatapos ng N na nabigong subok (hal. 3 subok, 60-segundong cooldown). Ang lockout state ay in-memory at nagre-reset kapag nag-restart ang app.
- "Forgot PIN" flow na gumagamit ng hiwalay na owner-only recovery code na ginawa sa setup; ang recovery code ay ipinapakita nang minsan at hindi na muling ipinapakita.

## Hindi Kasama sa Saklaw (Out of Scope)

- Biometric unlock (ang telepono ng tindahan ay maaaring walang maaasahang biometrics; ang PIN ay sapat na).
- Per-user PINs. Single-owner model; ang tampok 16 (shift tracking) ang lugar kung saan idadagdag ang per-cashier attribution kung kinakailangan.
- Server-side PIN validation. Walang server.

## Mga Implikasyon sa Data (Data Implications)

- Bagong talahanayan na `auth_settings`: `id` (singleton row, id = 1), `pin_hash` TEXT (Argon2 o scrypt/PBKDF2 hash), `pin_salt` TEXT, `recovery_code_hash` TEXT, `recovery_code_salt` TEXT, `created_at` INTEGER, `updated_at` INTEGER.
- Paggamit ng `app_settings` (mula sa tampok 7 / ADR-002) para sa configurable discount thresholds: `owner_pin_discount_threshold_pesos` (default: 50) at `owner_pin_discount_threshold_percent` (default: 10).
- Ang lockout state (in-memory cooldown) ay nakatira sa Zustand store sa ilalim ng `stores/useAuthStore.ts`.
- Mga function sa `database/auth.ts`: `initAuthTable()`, `isOwnerPinConfigured()`, `setupOwnerPin(pin)`, `verifyOwnerPin(pin)`, `verifyAndResetOwnerPinWithRecoveryCode(code, newPin)`, `changeOwnerPin(currentPin, newPin)`.
- Mga hook at provider sa `hooks/useOwnerPin.ts`, `hooks/useOwnerPinGuard.ts`, at `components/auth/OwnerPinGuardProvider.tsx`.
- Migration v20 para sa `auth_settings` at `app_settings` seeding.


## Mga Dependency (Dependencies)

- Kinakailangan ng tampok 5 (credit override), tampok 7 (voids/refunds), at tampok 4 (manual stock adjustments).
- Dapat idisenyo kasabay ng tampok 16 (shift tracking).

## Mga Kaugnay na Tampok

- **Credit-limit exception:** [[05-utang-guardrails-at-checkout|05. Utang Guardrails at Checkout]] ay humihingi ng PIN bago pahintulutan ang owner override.
- **Sale correction:** [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, at Corrections]] ay nangangailangan ng PIN para sa void, refund, at price correction.
- **Inventory adjustment:** [[04-physical-stocktake|04. Physical Stocktake]] ang hiwalay sa manual adjustment; ang huli ang PIN-protected.
- **Write-off decision:** [[13-expiry-and-damaged-goods-tracking|13. Expiry at Damaged-Goods Tracking]] ay may open question kung ang damaged-goods write-off ay dapat i-gate ng PIN.
- **Shared-device identity:** [[16-shift-tracking-on-one-device|16. Shift Tracking]] ay nagdadagdag ng cashier identity habang ang PIN ay nananatiling owner authority.

## Mga Open Question

- Hashing algorithm: Argon2 ang modernong piliin; ang scrypt ay katanggap-tanggap sa resource-constrained devices.
- Ilang failed attempts bago mag-lockout? Default ay 3.
- Ang PIN ba ay hihilingin lamang sa aksyon, o bilang session unlock din? Inirerekomenda ang action-level lamang para sa v1.

## Mga Tala sa Pagiging Posible (Feasibility Notes)

- Ang security model ng proyekto ay local-only.
- Gumamit ng vetted library para sa hashing; huwag mag-hand-roll.
- Ang recovery code ay ipinapakita nang minsan lamang.
