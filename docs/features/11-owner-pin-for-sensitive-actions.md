# 11. Owner PIN for Sensitive Actions

> Phase: Next

## Problem

A sari-sari store is a shared device. A helper, a relative, a child
helping out, or a suki handling their own cart may all pick up the
phone. Some actions — voiding a sale, applying a discount, extending
credit past a suki's limit, adjusting stock — can lose real money
quickly if done casually or maliciously. There is no gate.

## User Story

As a store owner, I want a PIN that gates the most consequential
actions, so my staff and family can use the register without being
able to make changes that hurt the business.

## In Scope

- A 4-6 digit owner PIN, set up once on first sensitive action or
  in Settings, stored locally (hashed, not plaintext) and never
  uploaded.
- A PIN prompt that intercepts the following actions:
  - Voids, refunds, price corrections (feature 7).
  - Manual stock adjustments outside the stocktake flow.
  - Credit-limit override (feature 5).
  - Large discounts (threshold defined per owner, e.g. > 10% or >
    50 pesos).
  - Database reset / seed in `app/(tabs)/dev/reset.tsx`.
- A short lockout window after N failed attempts (e.g. 3 attempts,
  60-second cooldown). Lockout state is in-memory and resets on
  app restart.
- "Forgot PIN" flow that uses a separate owner-only recovery code
  generated at setup; the recovery code is shown once and never
  re-displayed.

## Out of Scope

- Biometric unlock. The store phone may not have reliable
  biometrics and the owner may not trust them; a PIN is enough.
- Per-user PINs. Single-owner model; feature 16 (shift tracking)
  is the place where per-cashier attribution would be added if
  ever.
- Server-side PIN validation. There is no server.

## Data Implications

- New table `auth_settings`: `id` (singleton row, id = 1),
  `pin_hash` TEXT (Argon2 or scrypt hash; do not roll our own),
  `pin_salt` TEXT, `recovery_code_hash` TEXT, `failed_attempts`
  INTEGER, `lockout_until` INTEGER (epoch), `set_at` TEXT,
  `updated_at` TEXT.
- Lockout state (in-memory cooldown) lives in a small Zustand
  store under `stores/auth.ts`. Per CLAUDE.md, this is UI state,
  not business state — Zustand is the right home.
- New functions in a new `database/auth.ts`:
  `isPinConfigured()`,
  `setPin(pin)`,
  `verifyPin(pin)`,
  `verifyRecoveryCode(code)`.
- New hook in a new `hooks/useAuth.tsx` exposing the prompt and
  verification helpers.
- New migration bumping `user_version` past 9.

## Dependencies

- Required by feature 5 (credit override), feature 7
  (voids/refunds), feature 4 (manual stock adjustments). The
  underlying features can ship without PIN, but the
  control value of the feature is much lower without it.
- Should be designed alongside feature 16 (shift tracking) so
  the two do not collide on how they identify "who did this."

## Open Questions

- Hashing algorithm: Argon2 is the modern choice; scrypt is
  acceptable on resource-constrained devices. Choose one and pin
  it; do not switch later without a migration.
- How many failed attempts before lockout? 3 is friendly, 5 is
  safer. Default 3.
- Is the PIN prompted only on the action, or also as a session
  unlock (i.e. on app open)? Session unlock is friendlier but
  heavier. Recommend action-level only for v1.

## Feasibility Notes

- The project's security model is local-only: the threat model
  is "someone picked up the unlocked phone," not "an attacker
  with a dump of the database." Argon2 still adds real value
  against the latter, but is not a substitute for device-level
  lock.
- Use a vetted library for hashing; do not hand-roll. Confirm
  any new dependency is added to `package.json` and follows the
  project's "no external libraries unless absolutely necessary"
  rule.
- The recovery code is shown once and never again; document the
  flow clearly so a forgetful owner is not locked out of their
  own store.
