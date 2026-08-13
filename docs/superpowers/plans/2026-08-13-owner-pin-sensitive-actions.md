# Owner PIN for Sensitive Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline-first single-owner PIN mechanism that gates sensitive store operations (Voids/Refunds, Manual Stock Adjustments, Credit Overrides, and Large Discounts), with 1-time recovery codes and an in-memory 60s lockout timer.

**Architecture:** Database migration `v20` introduces a singleton `auth_settings` table storing salted SHA-256 hashes (`expo-crypto`). A Zustand store (`useAuthStore`) handles transient lockout timers and attempt counts. A unified `useOwnerPinGuard` hook triggers action challenge modals (`OwnerPinModal`) and setup/recovery workflows before permitting sensitive business logic to execute.

**Tech Stack:** React Native, Expo Crypto (`expo-crypto`), Expo Haptics (`expo-haptics`), SQLite (`expo-sqlite`), Zustand (`zustand`), i18next (`react-i18next`), Jest (`@testing-library/react-native`).

## Global Constraints

- **Storage**: SQLite (`auth_settings` table for salted hashes) and `app_settings` for discount thresholds. Plain-text PINs and recovery codes must NEVER be stored.
- **Crypto**: `expo-crypto` for SHA-256 digest hashing and 16-byte random hex salts.
- **Lockout Policy**: 3 failed attempts trigger a 60-second in-memory cooldown timer.
- **Languages**: Bilingual support (English in `locales/en/settings.json`, Tagalog/Filipino in `locales/tl/settings.json`).
- **Target Migration**: `v20` in `database/migrations.ts`.

---

### Task 1: Database Migration `v20` & Crypto Helpers

**Files:**

- Create: `lib/auth/crypto.ts`
- Modify: `database/migrations.ts:790-800`
- Test: `tests/authDatabase.test.ts`

**Interfaces:**

- Consumes: `expo-crypto` (`digestStringAsync`, `getRandomBytesAsync`), `database/migrations.ts`
- Produces: `lib/auth/crypto.ts` (`hashPin`, `generateRecoveryCode`, `hashRecoveryCode`, `verifyHash`)

- [ ] **Step 1: Write the failing test for crypto helpers & migration v20**

```typescript
// tests/authDatabase.test.ts
import {
  hashPin,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyHash,
} from '../lib/auth/crypto';
import { runMigrations } from '../database/migrations';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('Crypto & Auth Migration v20', () => {
  beforeEach(async () => {
    resetMockDb();
    await db.execAsync('PRAGMA user_version = 19;');
  });

  it('hashes pin with salt and verifies correctly', async () => {
    const salt = 'a1b2c3d4e5f67890';
    const hash = await hashPin('1234', salt);
    expect(hash).toBeTruthy();
    expect(hash.length).toBe(64); // SHA-256 hex length

    const isValid = await verifyHash('1234', salt, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyHash('9999', salt, hash);
    expect(isInvalid).toBe(false);
  });

  it('generates, normalizes and verifies recovery code', async () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    const salt = 'fedcba9876543210';
    const codeHash = await hashRecoveryCode(code, salt);

    // Test with spaces/lowercase
    const formattedInput = code.toLowerCase().replace('-', ' ');
    const isValid = await verifyHash(
      formattedInput.replace(/\s+/g, ''),
      salt,
      codeHash,
    );
    expect(isValid).toBe(true);
  });

  it('runs migration v20 and creates auth_settings table and seeds default thresholds', async () => {
    await runMigrations();
    const versionRows = await db.getAllAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(versionRows[0].user_version).toBe(20);

    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(auth_settings)',
    );
    expect(tableInfo.some((c) => c.name === 'pin_hash')).toBe(true);

    const pesoRow = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = "owner_pin_discount_threshold_pesos"',
    );
    expect(pesoRow?.value).toBe('50');

    const percentRow = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = "owner_pin_discount_threshold_percent"',
    );
    expect(percentRow?.value).toBe('10');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/authDatabase.test.ts`
Expected: FAIL with missing module `lib/auth/crypto`.

- [ ] **Step 3: Implement `lib/auth/crypto.ts` and `migration v20`**

Create `lib/auth/crypto.ts`:

```typescript
import * as Crypto from 'expo-crypto';

export async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${pin}:${salt}`,
  );
}

export function generateRecoveryCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars (0, O, 1, I)
  let result = '';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export function normalizeCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export async function hashRecoveryCode(
  code: string,
  salt: string,
): Promise<string> {
  const normalized = normalizeCode(code);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${normalized}:${salt}`,
  );
}

export async function verifyHash(
  input: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const normalized = normalizeCode(input);
  const calculatedHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${normalized}:${salt}`,
  );
  return calculatedHash === expectedHash;
}
```

Add migration v20 block in `database/migrations.ts`:

```typescript
if (currentVersion < 20) {
  console.log('Running migration to v20 (Owner PIN for Sensitive Actions)...');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS auth_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          pin_hash TEXT NOT NULL,
          pin_salt TEXT NOT NULL,
          recovery_code_hash TEXT NOT NULL,
          recovery_code_salt TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_pesos', '50', CAST(strftime('%s','now') AS INTEGER) * 1000)",
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_percent', '10', CAST(strftime('%s','now') AS INTEGER) * 1000)",
    );

    await db.execAsync('PRAGMA user_version = 20;');
  });
  console.log('Database migrated to v20.');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/authDatabase.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/crypto.ts database/migrations.ts tests/authDatabase.test.ts
git commit -m "feat(auth): add migration v20 and crypto helper functions"
```

---

### Task 2: Auth Database API & Zustand Lockout Store

**Files:**

- Create: `database/auth.ts`
- Create: `stores/useAuthStore.ts`
- Test: `tests/authStore.test.ts`

**Interfaces:**

- Consumes: `database/auth.ts`, `lib/auth/crypto.ts`, `configs/sqlite.ts`
- Produces: `database/auth.ts` (`isOwnerPinConfigured`, `setupOwnerPin`, `verifyOwnerPin`, `verifyAndResetOwnerPinWithRecoveryCode`, `changeOwnerPin`), `stores/useAuthStore.ts` (`useAuthStore`)

- [ ] **Step 1: Write the failing test for Database Auth API & Store**

```typescript
// tests/authStore.test.ts
import {
  isOwnerPinConfigured,
  setupOwnerPin,
  verifyOwnerPin,
  verifyAndResetOwnerPinWithRecoveryCode,
} from '../database/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { runMigrations } from '../database/migrations';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('Auth Database API & Zustand Store', () => {
  beforeEach(async () => {
    resetMockDb();
    await db.execAsync('PRAGMA user_version = 0;');
    await runMigrations();
    useAuthStore.setState({
      failedAttempts: 0,
      lockoutUntil: null,
      isPinConfigured: false,
    });
  });

  it('checks configured status, sets up PIN and verifies PIN', async () => {
    expect(await isOwnerPinConfigured()).toBe(false);

    const { recoveryCode } = await setupOwnerPin('1234');
    expect(recoveryCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(await isOwnerPinConfigured()).toBe(true);

    expect(await verifyOwnerPin('1234')).toBe(true);
    expect(await verifyOwnerPin('0000')).toBe(false);
  });

  it('resets PIN using recovery code', async () => {
    const { recoveryCode } = await setupOwnerPin('1234');
    const resetSuccess = await verifyAndResetOwnerPinWithRecoveryCode(
      recoveryCode,
      '5678',
    );
    expect(resetSuccess).toBe(true);

    expect(await verifyOwnerPin('1234')).toBe(false);
    expect(await verifyOwnerPin('5678')).toBe(true);
  });

  it('handles 3-failed-attempts lockout in Zustand store', () => {
    const store = useAuthStore.getState();
    store.registerFailedAttempt();
    store.registerFailedAttempt();
    expect(useAuthStore.getState().isLockedOut()).toBe(false);

    store.registerFailedAttempt(); // 3rd failure
    expect(useAuthStore.getState().isLockedOut()).toBe(true);
    expect(
      useAuthStore.getState().getLockoutSecondsRemaining(),
    ).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/authStore.test.ts`
Expected: FAIL with missing `database/auth` and `stores/useAuthStore`.

- [ ] **Step 3: Implement `database/auth.ts` & `stores/useAuthStore.ts`**

Create `database/auth.ts`:

```typescript
import { db } from '@/configs';
import {
  generateSalt,
  hashPin,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyHash,
} from '@/lib/auth/crypto';

export interface AuthSettingsRow {
  id: number;
  pin_hash: string;
  pin_salt: string;
  recovery_code_hash: string;
  recovery_code_salt: string;
  created_at: number;
  updated_at: number;
}

export const isOwnerPinConfigured = async (): Promise<boolean> => {
  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT id FROM auth_settings WHERE id = 1',
  );
  return Boolean(row);
};

export const setupOwnerPin = async (
  pin: string,
): Promise<{ recoveryCode: string }> => {
  const now = Date.now();
  const pinSalt = await generateSalt();
  const pinHash = await hashPin(pin, pinSalt);

  const recoveryCode = generateRecoveryCode();
  const recoverySalt = await generateSalt();
  const recoveryHash = await hashRecoveryCode(recoveryCode, recoverySalt);

  await db.runAsync(
    `INSERT INTO auth_settings (id, pin_hash, pin_salt, recovery_code_hash, recovery_code_salt, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       pin_hash = excluded.pin_hash,
       pin_salt = excluded.pin_salt,
       recovery_code_hash = excluded.recovery_code_hash,
       recovery_code_salt = excluded.recovery_code_salt,
       updated_at = excluded.updated_at`,
    [pinHash, pinSalt, recoveryHash, recoverySalt, now, now],
  );

  return { recoveryCode };
};

export const verifyOwnerPin = async (pin: string): Promise<boolean> => {
  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT pin_hash, pin_salt FROM auth_settings WHERE id = 1',
  );
  if (!row) return false;
  return await verifyHash(pin, row.pin_salt, row.pin_hash);
};

export const verifyAndResetOwnerPinWithRecoveryCode = async (
  code: string,
  newPin: string,
): Promise<boolean> => {
  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT recovery_code_hash, recovery_code_salt FROM auth_settings WHERE id = 1',
  );
  if (!row) return false;

  const codeValid = await verifyHash(
    code,
    row.recovery_code_salt,
    row.recovery_code_hash,
  );
  if (!codeValid) return false;

  const now = Date.now();
  const newPinSalt = await generateSalt();
  const newPinHash = await hashPin(newPin, newPinSalt);

  await db.runAsync(
    `UPDATE auth_settings SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = 1`,
    [newPinHash, newPinSalt, now],
  );
  return true;
};

export const changeOwnerPin = async (
  currentPin: string,
  newPin: string,
): Promise<boolean> => {
  const isValid = await verifyOwnerPin(currentPin);
  if (!isValid) return false;

  const now = Date.now();
  const newPinSalt = await generateSalt();
  const newPinHash = await hashPin(newPin, newPinSalt);

  await db.runAsync(
    `UPDATE auth_settings SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = 1`,
    [newPinHash, newPinSalt, now],
  );
  return true;
};
```

Create `stores/useAuthStore.ts`:

```typescript
import { create } from 'zustand';

interface AuthState {
  isPinConfigured: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  setIsPinConfigured: (status: boolean) => void;
  registerFailedAttempt: () => void;
  resetFailedAttempts: () => void;
  isLockedOut: () => boolean;
  getLockoutSecondsRemaining: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isPinConfigured: false,
  failedAttempts: 0,
  lockoutUntil: null,
  setIsPinConfigured: (status) => set({ isPinConfigured: status }),
  registerFailedAttempt: () => {
    const nextAttempts = get().failedAttempts + 1;
    if (nextAttempts >= 3) {
      set({
        failedAttempts: 0,
        lockoutUntil: Date.now() + 60_000,
      });
    } else {
      set({ failedAttempts: nextAttempts });
    }
  },
  resetFailedAttempts: () => set({ failedAttempts: 0, lockoutUntil: null }),
  isLockedOut: () => {
    const lockoutUntil = get().lockoutUntil;
    if (!lockoutUntil) return false;
    if (Date.now() >= lockoutUntil) {
      set({ lockoutUntil: null });
      return false;
    }
    return true;
  },
  getLockoutSecondsRemaining: () => {
    const lockoutUntil = get().lockoutUntil;
    if (!lockoutUntil) return 0;
    const remainingMs = lockoutUntil - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/authStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/auth.ts stores/useAuthStore.ts tests/authStore.test.ts
git commit -m "feat(auth): add database auth functions and zustand auth store"
```

---

### Task 3: UI Challenge, Setup & Recovery Modals

**Files:**

- Create: `components/auth/OwnerPinModal.tsx`
- Create: `components/auth/OwnerPinSetupModal.tsx`
- Create: `components/auth/OwnerPinRecoveryModal.tsx`
- Modify: `locales/en/settings.json`, `locales/tl/settings.json`
- Test: `tests/ownerPinModals.test.tsx`

**Interfaces:**

- Consumes: `database/auth.ts`, `stores/useAuthStore.ts`, `expo-haptics`, `expo-clipboard`
- Produces: `components/auth/OwnerPinModal.tsx`, `components/auth/OwnerPinSetupModal.tsx`, `components/auth/OwnerPinRecoveryModal.tsx`

- [ ] **Step 1: Add localization keys to `locales/en/settings.json` & `locales/tl/settings.json`**

In `locales/en/settings.json`:

```json
{
  "pin": {
    "title": "Owner PIN Required",
    "enter_pin": "Enter 4-6 digit Owner PIN",
    "wrong_pin": "Incorrect PIN. Try again.",
    "locked_out": "Too many failed attempts. Try again in {{seconds}}s.",
    "forgot_pin": "Forgot PIN?",
    "setup_title": "Set Up Owner PIN",
    "confirm_pin": "Confirm 4-6 digit PIN",
    "pin_mismatch": "PINs do not match. Try again.",
    "recovery_title": "Save Your Recovery Code",
    "recovery_desc": "Write down or copy this recovery code. It will only be shown once and is required if you forget your PIN.",
    "copy_code": "Copy Code",
    "code_copied": "Code copied to clipboard!",
    "reset_title": "Reset PIN with Recovery Code",
    "enter_recovery_code": "Enter 8-character Recovery Code",
    "invalid_code": "Invalid recovery code.",
    "status_configured": "PIN Set Up",
    "status_not_configured": "No PIN Set",
    "btn_setup": "Set Up Owner PIN",
    "btn_change": "Change Owner PIN",
    "btn_reset": "Reset with Recovery Code"
  }
}
```

In `locales/tl/settings.json`:

```json
{
  "pin": {
    "title": "Kailangan ng Owner PIN",
    "enter_pin": "Ilagay ang 4-6 digit Owner PIN",
    "wrong_pin": "Maling PIN. Subukang muli.",
    "locked_out": "Sobrang maling subok. Subukang muli sa {{seconds}}s.",
    "forgot_pin": "Nakalimutan ang PIN?",
    "setup_title": "Mag-set up ng Owner PIN",
    "confirm_pin": "Kumpirmahin ang 4-6 digit PIN",
    "pin_mismatch": "Hindi magkatugma ang PIN. Subukang muli.",
    "recovery_title": "I-save ang Recovery Code",
    "recovery_desc": "Isulat o kopyahin ang recovery code na ito. Ipinapakita lamang ito nang minsan at kailangan kung makalimutan ang PIN.",
    "copy_code": "Kopyahin ang Code",
    "code_copied": "Naka-copy na sa clipboard!",
    "reset_title": "I-reset ang PIN gamit ang Recovery Code",
    "enter_recovery_code": "Ilagay ang 8-character Recovery Code",
    "invalid_code": "Maling recovery code.",
    "status_configured": "PIN Naka-setup",
    "status_not_configured": "Walang PIN",
    "btn_setup": "Mag-set up ng Owner PIN",
    "btn_change": "Palitan ang PIN",
    "btn_reset": "I-reset gamit ang Recovery Code"
  }
}
```

- [ ] **Step 2: Implement `components/auth/OwnerPinModal.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  visible: boolean;
  title?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onForgotPin?: () => void;
}

export const OwnerPinModal: React.FC<Props> = ({
  visible,
  title,
  actionDescription,
  onSuccess,
  onCancel,
  onForgotPin,
}) => {
  const { t } = useTranslation('settings');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const {
    registerFailedAttempt,
    resetFailedAttempts,
    isLockedOut,
    getLockoutSecondsRemaining,
  } = useAuthStore();
  const [secondsLeft, setSecondsLeft] = useState(getLockoutSecondsRemaining());

  useEffect(() => {
    if (!visible) {
      setPin('');
      setErrorMsg('');
      return;
    }

    const interval = setInterval(() => {
      if (isLockedOut()) {
        setSecondsLeft(getLockoutSecondsRemaining());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, isLockedOut, getLockoutSecondsRemaining]);

  const locked = isLockedOut();

  const handleKeyPress = (num: string) => {
    if (locked || pin.length >= 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg('');
    const newPin = pin + num;
    setPin(newPin);
  };

  const handleBackspace = () => {
    if (locked || pin.length === 0) return;
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (locked || pin.length < 4) return;
    const isValid = await verifyOwnerPin(pin);
    if (isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetFailedAttempts();
      setPin('');
      onSuccess();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      registerFailedAttempt();
      setPin('');
      setErrorMsg(t('pin.wrong_pin'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title || t('pin.title')}</Text>
          {Boolean(actionDescription) && (
            <Text style={styles.subtext}>{actionDescription}</Text>
          )}

          {locked ? (
            <Text style={styles.errorText}>
              {t('pin.locked_out', { seconds: secondsLeft })}
            </Text>
          ) : (
            <>
              <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, pin.length > idx && styles.dotFilled]}
                  />
                ))}
              </View>

              {Boolean(errorMsg) && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}

              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(digit)}
                  >
                    <Text style={styles.keyText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => setPin('')}
                >
                  <Text style={styles.keyActionText}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => handleKeyPress('0')}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={handleBackspace}
                >
                  <Text style={styles.keyActionText}>⌫</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            {!locked && (
              <TouchableOpacity
                style={[styles.submitBtn, pin.length < 4 && styles.btnDisabled]}
                disabled={pin.length < 4}
                onPress={handleSubmit}
              >
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>

          {Boolean(onForgotPin) && (
            <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPin}>
              <Text style={styles.forgotText}>{t('pin.forgot_pin')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtext: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  dotsContainer: { flexDirection: 'row', marginVertical: 16, gap: 12 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  dotFilled: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginVertical: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  keyBtn: {
    width: 64,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: { fontSize: 22, fontWeight: '600', color: '#111827' },
  keyActionText: { fontSize: 18, fontWeight: '600', color: '#4B5563' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  forgotBtn: { marginTop: 14 },
  forgotText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
});
```

- [ ] **Step 3: Implement `components/auth/OwnerPinSetupModal.tsx` & `OwnerPinRecoveryModal.tsx`**

Create `components/auth/OwnerPinSetupModal.tsx`:

```tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { setupOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OwnerPinSetupModal: React.FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('settings');
  const [step, setStep] = useState<'create' | 'confirm' | 'code'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copied, setCopied] = useState(false);
  const setIsPinConfigured = useAuthStore((s) => s.setIsPinConfigured);

  const handleNext = async () => {
    if (step === 'create') {
      if (pin.length < 4 || pin.length > 6) return;
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin !== confirmPin) {
        setErrorMsg(t('pin.pin_mismatch'));
        return;
      }
      const res = await setupOwnerPin(pin);
      setIsPinConfigured(true);
      setRecoveryCode(res.recoveryCode);
      setStep('code');
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step !== 'code' ? (
            <>
              <Text style={styles.title}>{t('pin.setup_title')}</Text>
              <Text style={styles.label}>
                {step === 'create' ? t('pin.enter_pin') : t('pin.confirm_pin')}
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                value={step === 'create' ? pin : confirmPin}
                onChangeText={(val) => {
                  setErrorMsg('');
                  step === 'create' ? setPin(val) : setConfirmPin(val);
                }}
              />
              {Boolean(errorMsg) && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                  <Text style={styles.submitText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('pin.recovery_title')}</Text>
              <Text style={styles.subtext}>{t('pin.recovery_desc')}</Text>
              <View style={styles.codeCard}>
                <Text style={styles.codeText}>{recoveryCode}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                <Text style={styles.copyText}>
                  {copied ? t('pin.code_copied') : t('pin.copy_code')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={onSuccess}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
  codeCard: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#1E40AF',
  },
  copyBtn: { paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16 },
  copyText: { color: '#2563EB', fontWeight: '600' },
  doneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  doneText: { color: '#fff', fontWeight: '700' },
});
```

Create `components/auth/OwnerPinRecoveryModal.tsx`:

```tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { verifyAndResetOwnerPinWithRecoveryCode } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OwnerPinRecoveryModal: React.FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('settings');
  const [code, setCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const resetFailedAttempts = useAuthStore((s) => s.resetFailedAttempts);

  const handleReset = async () => {
    if (!code.trim() || newPin.length < 4) return;
    const success = await verifyAndResetOwnerPinWithRecoveryCode(code, newPin);
    if (success) {
      resetFailedAttempts();
      onSuccess();
    } else {
      setErrorMsg(t('pin.invalid_code'));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('pin.reset_title')}</Text>

          <Text style={styles.label}>{t('pin.enter_recovery_code')}</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            maxLength={10}
            value={code}
            onChangeText={(val) => {
              setErrorMsg('');
              setCode(val);
            }}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>
            {t('pin.enter_pin')}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            value={newPin}
            onChangeText={(val) => {
              setErrorMsg('');
              setNewPin(val);
            }}
          />

          {Boolean(errorMsg) && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleReset}>
              <Text style={styles.submitText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/auth/OwnerPinModal.tsx components/auth/OwnerPinSetupModal.tsx components/auth/OwnerPinRecoveryModal.tsx locales/
git commit -m "feat(auth): add OwnerPinModal, SetupModal, and RecoveryModal UI components"
```

---

### Task 4: Unified Guard Hook & Settings Component

**Files:**

- Create: `hooks/useOwnerPinGuard.tsx`
- Create: `components/settings/OwnerPinSettingsCard.tsx`
- Modify: `app/settings/index.tsx`
- Test: `tests/useOwnerPinGuard.test.tsx`

**Interfaces:**

- Consumes: `database/auth.ts`, `stores/useAuthStore.ts`, `database/settings.ts`
- Produces: `hooks/useOwnerPinGuard.tsx` (`useOwnerPinGuard`, `OwnerPinGuardProvider`), `components/settings/OwnerPinSettingsCard.tsx`

- [ ] **Step 1: Create `hooks/useOwnerPinGuard.tsx`**

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isOwnerPinConfigured } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';

interface GuardOptions {
  title?: string;
  actionDescription?: string;
  onApproved: () => Promise<void> | void;
}

interface GuardContextType {
  runWithPinGuard: (options: GuardOptions) => Promise<void>;
}

const GuardContext = createContext<GuardContextType | null>(null);

export const OwnerPinGuardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isPinConfigured, setIsPinConfigured } = useAuthStore();
  const [activeOptions, setActiveOptions] = useState<GuardOptions | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
  }, [setIsPinConfigured]);

  const runWithPinGuard = async (options: GuardOptions) => {
    setActiveOptions(options);
    const configured = await isOwnerPinConfigured();
    setIsPinConfigured(configured);
    if (!configured) {
      setShowSetup(true);
    } else {
      setShowChallenge(true);
    }
  };

  const handleChallengeSuccess = async () => {
    setShowChallenge(false);
    if (activeOptions) {
      await activeOptions.onApproved();
      setActiveOptions(null);
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetup(false);
    setIsPinConfigured(true);
    if (activeOptions) {
      await activeOptions.onApproved();
      setActiveOptions(null);
    }
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setShowChallenge(true);
  };

  return (
    <GuardContext.Provider value={{ runWithPinGuard }}>
      {children}
      <OwnerPinModal
        visible={showChallenge}
        title={activeOptions?.title}
        actionDescription={activeOptions?.actionDescription}
        onSuccess={handleChallengeSuccess}
        onCancel={() => {
          setShowChallenge(false);
          setActiveOptions(null);
        }}
        onForgotPin={() => {
          setShowChallenge(false);
          setShowRecovery(true);
        }}
      />
      <OwnerPinSetupModal
        visible={showSetup}
        onSuccess={handleSetupSuccess}
        onCancel={() => {
          setShowSetup(false);
          setActiveOptions(null);
        }}
      />
      <OwnerPinRecoveryModal
        visible={showRecovery}
        onSuccess={handleRecoverySuccess}
        onCancel={() => {
          setShowRecovery(false);
          setActiveOptions(null);
        }}
      />
    </GuardContext.Provider>
  );
};

export const useOwnerPinGuard = () => {
  const ctx = useContext(GuardContext);
  if (!ctx) {
    throw new Error(
      'useOwnerPinGuard must be used within an OwnerPinGuardProvider',
    );
  }
  return ctx;
};
```

- [ ] **Step 2: Create `components/settings/OwnerPinSettingsCard.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting, setAppSetting } from '@/database/settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';

export const OwnerPinSettingsCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const { isPinConfigured, setIsPinConfigured } = useAuthStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [pesosLimit, setPesosLimit] = useState('50');
  const [percentLimit, setPercentLimit] = useState('10');

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
    getAppSetting('owner_pin_discount_threshold_pesos' as any).then((v) => {
      if (v) setPesosLimit(v);
    });
    getAppSetting('owner_pin_discount_threshold_percent' as any).then((v) => {
      if (v) setPercentLimit(v);
    });
  }, [setIsPinConfigured]);

  const handleSaveThresholds = async () => {
    await setAppSetting(
      'owner_pin_discount_threshold_pesos' as any,
      pesosLimit,
    );
    await setAppSetting(
      'owner_pin_discount_threshold_percent' as any,
      percentLimit,
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Owner PIN Settings</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <View
          style={[
            styles.badge,
            isPinConfigured ? styles.badgeSuccess : styles.badgeMuted,
          ]}
        >
          <Text style={styles.badgeText}>
            {isPinConfigured
              ? t('pin.status_configured')
              : t('pin.status_not_configured')}
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        {!isPinConfigured ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowSetup(true)}
          >
            <Text style={styles.btnText}>{t('pin.btn_setup')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowSetup(true)}
            >
              <Text style={styles.secondaryBtnText}>{t('pin.btn_change')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowRecovery(true)}
            >
              <Text style={styles.secondaryBtnText}>{t('pin.btn_reset')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionSubTitle}>Discount PIN Thresholds</Text>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Max Discount (₱):</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={pesosLimit}
          onChangeText={setPesosLimit}
          onBlur={handleSaveThresholds}
        />
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Max Discount (%):</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={percentLimit}
          onChangeText={setPercentLimit}
          onBlur={handleSaveThresholds}
        />
      </View>

      <OwnerPinSetupModal
        visible={showSetup}
        onSuccess={() => {
          setShowSetup(false);
          setIsPinConfigured(true);
        }}
        onCancel={() => setShowSetup(false)}
      />
      <OwnerPinRecoveryModal
        visible={showRecovery}
        onSuccess={() => setShowRecovery(false)}
        onCancel={() => setShowRecovery(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 14, color: '#4B5563', marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeMuted: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  btnRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: { fontSize: 13, color: '#4B5563' },
  input: {
    width: 80,
    height: 36,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
  },
});
```

- [ ] **Step 3: Integrate `OwnerPinSettingsCard` into `app/settings/index.tsx`**

Add `OwnerPinSettingsCard` to `app/settings/index.tsx` screen inside the settings scroll view.

- [ ] **Step 4: Wrap top layout or test Provider**

Ensure `OwnerPinGuardProvider` is mounted in root app tree or layout.

- [ ] **Step 5: Run typecheck & tests**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add hooks/useOwnerPinGuard.tsx components/settings/OwnerPinSettingsCard.tsx app/settings/index.tsx
git commit -m "feat(auth): add useOwnerPinGuard hook and OwnerPinSettingsCard component"
```

---

### Task 5: Sensitive Action Touchpoint Integrations

**Files:**

- Modify: `app/(edit-forms)/sale-correction/[id].tsx`
- Modify: `components/inventory/ManualAdjustmentModal.tsx`
- Modify: `components/checkout/CreditLimitOverrideModal.tsx`
- Modify: `components/cart/CartDiscountModal.tsx`
- Test: `tests/ownerPinGating.test.ts`

**Interfaces:**

- Consumes: `useOwnerPinGuard`, `database/settings.ts`
- Produces: Gated action submissions across the 4 sensitive feature entrypoints.

- [ ] **Step 1: Write integration tests in `tests/ownerPinGating.test.ts`**

```typescript
// tests/ownerPinGating.test.ts
import { getAppSetting } from '../database/settings';
import { runMigrations } from '../database/migrations';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('Owner PIN Gating Thresholds', () => {
  beforeEach(async () => {
    resetMockDb();
    await db.execAsync('PRAGMA user_version = 0;');
    await runMigrations();
  });

  it('reads default discount thresholds correctly', async () => {
    const pesoSetting = await getAppSetting(
      'owner_pin_discount_threshold_pesos' as any,
    );
    const percentSetting = await getAppSetting(
      'owner_pin_discount_threshold_percent' as any,
    );
    expect(Number(pesoSetting)).toBe(50);
    expect(Number(percentSetting)).toBe(10);
  });
});
```

- [ ] **Step 2: Gate Voids, Refunds & Corrections (`app/(edit-forms)/sale-correction/[id].tsx`)**

In `app/(edit-forms)/sale-correction/[id].tsx`:
Import `useOwnerPinGuard`:

```tsx
const { runWithPinGuard } = useOwnerPinGuard();

const handleSubmit = async () => {
  runWithPinGuard({
    title: 'Authorization Required',
    actionDescription: `Confirm ${kind} for Sale #${saleId}`,
    onApproved: async () => {
      // Execute original correction submit logic
      await executeCorrection();
    },
  });
};
```

- [ ] **Step 3: Gate Manual Stock Adjustments (`components/inventory/ManualAdjustmentModal.tsx`)**

In `components/inventory/ManualAdjustmentModal.tsx`:

```tsx
const { runWithPinGuard } = useOwnerPinGuard();

const handleSaveAdjustment = async () => {
  runWithPinGuard({
    title: 'Authorization Required',
    actionDescription: `Manual inventory adjustment for ${product.name}`,
    onApproved: async () => {
      await saveManualAdjustment();
    },
  });
};
```

- [ ] **Step 4: Gate Credit Limit Override (`components/checkout/CreditLimitOverrideModal.tsx`)**

In `components/checkout/CreditLimitOverrideModal.tsx`:

```tsx
const { runWithPinGuard } = useOwnerPinGuard();

const handleConfirmOverride = async () => {
  runWithPinGuard({
    title: 'Authorization Required',
    actionDescription: `Credit limit override for ${customerName}`,
    onApproved: async () => {
      await processCreditOverride();
    },
  });
};
```

- [ ] **Step 5: Gate Large Discounts (`components/cart/CartDiscountModal.tsx`)**

In `components/cart/CartDiscountModal.tsx`:
Check applied discount against `owner_pin_discount_threshold_pesos` (default 50) and `owner_pin_discount_threshold_percent` (default 10). If exceeded, invoke `runWithPinGuard`.

- [ ] **Step 6: Run full verification suite**

Run: `pnpm typecheck && pnpm test`
Expected: ALL PASS.

- [ ] **Step 7: Commit**

```bash
git add app/\(edit-forms\)/sale-correction/\[id\].tsx components/inventory/ManualAdjustmentModal.tsx components/checkout/CreditLimitOverrideModal.tsx components/cart/CartDiscountModal.tsx tests/ownerPinGating.test.ts
git commit -m "feat(auth): gate voids, inventory adjustments, credit overrides, and large discounts with Owner PIN"
```
