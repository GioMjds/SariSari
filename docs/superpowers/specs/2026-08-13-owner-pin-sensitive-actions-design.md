# Design Spec: Owner PIN for Sensitive Actions

**Date:** 2026-08-13  
**Status:** Approved Design Spec  
**Target Migration Version:** `v20`

---

## 1. Overview & Goals

In a sari-sari store environment, a single device is often shared between store owners, staff, family members, or helping hands. Certain operations—such as voiding sales, issuing cash refunds, correcting prices, overriding customer credit limits, manually adjusting stock levels, or applying large discounts—can cause significant financial loss if performed accidentally or maliciously.

### Primary Goals

1. Provide a single-owner 4–6 digit PIN mechanism to gate sensitive store operations.
2. Store PIN credentials securely on-device using salted SHA-256 hashes (`expo-crypto`) in SQLite (`auth_settings`).
3. Offer an **on-demand setup flow** (prompts user to set up a PIN on their first sensitive action attempt or in Settings) alongside a 1-time display of an 8-character recovery code.
4. Implement an in-memory 60-second cooldown lockout after 3 consecutive failed PIN attempts.
5. Provide a "Forgot PIN?" recovery path using the 8-character recovery code.
6. Gate 4 primary sensitive action categories:
   - Sale Voids, Refunds, and Price Corrections
   - Standalone Manual Stock Adjustments (outside physical stocktake)
   - Utang Credit-Limit & Overdue Overrides
   - Large Manual Discounts (exceeding configurable thresholds, defaulting to ₱50 or 10%)

---

## 2. Scope & Non-Goals

### In Scope

- Single-owner PIN model (4 to 6 numeric digits).
- Offline-first local security architecture (salted hashes using `expo-crypto`).
- Database migration `v20` (`auth_settings` table & `app_settings` threshold seeds).
- On-demand PIN setup & 1-time recovery code generation.
- Action-level PIN challenge modal (`OwnerPinModal`).
- Recovery modal (`OwnerPinRecoveryModal`) to reset forgotten PINs using recovery codes.
- Lockout policy: 3 failed attempts trigger a 60-second in-memory cooldown.
- Settings page section (`components/settings/OwnerPinSettingsCard.tsx`) for setup, change, reset, and discount threshold configuration.

### Out of Scope

- Biometric authentication (fingerprint/face recognition).
- Multi-user / per-cashier individual PINs (deferred to shift tracking / multi-cashier feature).
- Server-side validation or cloud syncing of PINs (app is strictly offline-first local SQLite).
- Dev Database Reset/Seed PIN gating (excluded per user directive).

---

## 3. Database Schema & Migration (`v20`)

A new migration `v20` in `database/migrations.ts` creates the `auth_settings` singleton table and seeds default discount thresholds in `app_settings`.

### SQLite Schema (`auth_settings`)

```sql
CREATE TABLE IF NOT EXISTS auth_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  recovery_code_hash TEXT NOT NULL,
  recovery_code_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Seeded `app_settings` Keys

- `owner_pin_discount_threshold_pesos`: `'50'` (Default ₱50 limit)
- `owner_pin_discount_threshold_percent`: `'10'` (Default 10% limit)

---

## 4. Cryptography & Security Model (`lib/auth/crypto.ts`)

- **Salting & Hashing**:
  - Salt: 16-byte cryptographically secure random hex string generated via `expo-crypto` (`Crypto.getRandomBytesAsync`).
  - Hash: `Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt)`.
- **Recovery Code Generation**:
  - Generates an 8-character uppercase alphanumeric code formatted with a middle dash for readability (e.g. `K9X2-M7P4`).
- **Normalization**:
  - Strips spaces, dashes, and casing prior to hashing or verifying recovery codes (`code.replace(/[^A-Z0-9]/gi, '').toUpperCase()`).
- **Storage**:
  - Plain-text PINs and recovery codes are never stored. Only salted SHA-256 hashes are persisted in SQLite.

---

## 5. State Management & Cooldown Policy (`stores/useAuthStore.ts`)

A Zustand store manages transient in-memory authentication states and lockout timers:

### Store State

- `isPinConfigured`: `boolean`
- `failedAttempts`: `number` (Default: `0`)
- `lockoutUntil`: `number | null` (Epoch timestamp when lockout expires)

### Lockout Rules

1. On each incorrect PIN attempt, `failedAttempts` increments by 1.
2. When `failedAttempts >= 3`, `lockoutUntil` is set to `Date.now() + 60,000` (60 seconds) and `failedAttempts` resets to 0.
3. While `Date.now() < lockoutUntil`, PIN entry is disabled in the UI with a live countdown timer (_"Locked out. Try again in XXs"_).
4. Lockout is transient (in-memory) and automatically expires after 60 seconds or when the app process is restarted.
5. Entering the correct PIN resets `failedAttempts` to 0.

---

## 6. Auth Database API (`database/auth.ts`)

- `isOwnerPinConfigured(): Promise<boolean>`
- `setupOwnerPin(pin: string): Promise<{ recoveryCode: string }>`
- `verifyOwnerPin(pin: string): Promise<boolean>`
- `verifyAndResetOwnerPinWithRecoveryCode(code: string, newPin: string): Promise<boolean>`
- `changeOwnerPin(currentPin: string, newPin: string): Promise<boolean>`

---

## 7. UI Components & Settings

### 1. `OwnerPinModal` (`components/auth/OwnerPinModal.tsx`)

- Props: `visible`, `title`, `actionDescription`, `onSuccess`, `onCancel`.
- Custom 4–6 digit PIN keypad with dots representation, haptic feedback (`expo-haptics`), error notices, lockout timer display, and a "Forgot PIN?" link.

### 2. `OwnerPinSetupModal` (`components/auth/OwnerPinSetupModal.tsx`)

- Two-step flow: Enter PIN → Confirm PIN.
- Displays 1-time recovery code with copy-to-clipboard button and explicit warning prompt (_"Save this code! It will not be shown again."_).

### 3. `OwnerPinRecoveryModal` (`components/auth/OwnerPinRecoveryModal.tsx`)

- Input 8-character recovery code → Set & confirm new 4–6 digit PIN.

### 4. Settings Section (`components/settings/OwnerPinSettingsCard.tsx`)

- Integrated in `app/settings/index.tsx`.
- Displays PIN setup status badge (_"PIN Configured"_ / _"No PIN"_).
- Provides actions for initial setup, changing PIN, and resetting PIN via recovery code.
- Configurable inputs for Discount Thresholds (Pesos and Percentage).

---

## 8. Action Gating Points (`hooks/useOwnerPinGuard.ts`)

The `useOwnerPinGuard` hook provides an execution wrapper:

```typescript
const { runWithPinGuard } = useOwnerPinGuard();

runWithPinGuard({
  title: 'Authorization Required',
  actionDescription: 'Void Sale #104',
  onApproved: async () => {
    // Sensitive action logic
  },
});
```

### Integration Touchpoints

1. **Voids, Refunds & Corrections** (`app/(edit-forms)/sale-correction/[id].tsx`):
   - Gate void, cash refund, and price correction form submissions.
2. **Manual Stock Adjustments** (`components/inventory/ManualAdjustmentModal.tsx`):
   - Gate saving manual stock adjustments (damage/spoilage/found stock outside physical stocktake).
3. **Utang Credit-Limit Override** (`components/checkout/CreditLimitOverrideModal.tsx`):
   - Gate completing credit checkout override when customer exceeds limits.
4. **Large Discounts** (`components/cart/CartDiscountModal.tsx` & checkout):
   - Trigger PIN check if applied discount > ₱50 OR > 10%.

---

## 9. Testing & Verification Plan

### Test Suites

1. `tests/authDatabase.test.ts`:
   - Database migration `v20` verification.
   - Salted PIN hashing & verification tests.
   - Recovery code generation, normalization, verification, and PIN reset tests.
   - In-memory 3-strikes lockout cooldown timing tests.
2. `tests/ownerPinGating.test.ts`:
   - `useOwnerPinGuard` state transitions.
   - Discount threshold evaluation (₱50 or 10%).
   - Action blocking vs execution on successful PIN input.

### Execution

- `pnpm typecheck`
- `pnpm test`
