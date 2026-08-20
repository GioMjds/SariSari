# Biometric Owner Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the shop owner approve owner-gated actions with a fingerprint or face instead of typing the owner PIN, add an opt-in lock at app launch, and put the previously ungated destructive backup actions behind the same gate.

**Architecture:** One module (`lib/auth/biometrics.ts`) owns the `expo-local-authentication` import and normalises every platform outcome into a five-value union, so no other file reasons about native error strings. Two `app_settings` rows, both seeded `'0'`, turn the two behaviours on. `OwnerPinGuardProvider` gains a biometric attempt in front of the existing PIN modal, and a new `AppLockGate` renders a full-screen lock driven by `useAuthStore`. The PIN stays reachable from every path: biometrics never replace it, they only front it.

**Tech Stack:** Expo SDK 54, React Native 0.81.5, React 19.1.0, `expo-local-authentication` 17.0.9, `expo-sqlite` with `PRAGMA user_version` migrations, Zustand 5, TanStack Query 5, react-i18next (`en` and `tl`), Jest 29.7 on `jest-environment-node`.

**Spec:** `docs/superpowers/specs/2026-08-19-biometric-owner-auth-design.md`

## Global Constraints

Values are copied verbatim from the spec. Every task's requirements implicitly include this section.

- `authenticateAsync` is always called with `disableDeviceFallback: true`. The device passcode must never substitute for the owner PIN.
- Biometric failures must never increment the PIN lockout counter.
- No biometric attempt is made while the PIN lockout is active.
- No biometric material is ever stored, transmitted, or backed up. The owner PIN stays "nakaimbak nang lokal ... at hindi kailanman ini-upload".
- Both features are off by default, and both require a configured owner PIN before they can be turned on.
- Only the `cancelled` result aborts the caller. Every other non-success result falls through to the PIN modal.
- `lockout` and `lockout_permanent` map to `unavailable`, not `failed`, so an OS hard-lock cannot strand the owner.
- The launch-lock grace window is exactly `300000` ms, fixed, with no settings picker.
- Flash-prevention colour is `#F7F6F2`, the app background.
- Screens never call SQLite. Data access goes through `hooks/`, with the two documented exceptions recorded in Task 5 and Task 8.
- One SQLite handle, imported from `configs/sqlite.ts`. Multi-statement writes use `db.withTransactionAsync`.
- No emojis in code or comments. Markdown filenames kebab-case.
- Vault writes follow `obsidian-vault/AGENTS.md`: read the existing note first, correct folder, never touch `.obsidian/`, no credentials, no auto-push, no auto-write.
- `pnpm verify` (`pnpm typecheck && pnpm test`) passes at the end of every task.

---

## File Structure

### Created

| File                                      | Responsibility                                                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/auth/biometrics.ts`                  | The only file that imports `expo-local-authentication`. Capability probe, prompt wrapper, native-error normaliser, and the in-flight prompt flag. |
| `lib/auth/appLock.ts`                     | Pure launch-lock policy: `APP_LOCK_GRACE_MS` and `shouldRelockOnResume`. No imports, so it is trivially testable.                                 |
| `components/auth/AppLockGate.tsx`         | Full-screen lock overlay. Owns the `resolving / locked / open` phase machine and the `AppState` resume decision.                                  |
| `tests/biometrics.test.ts`                | Covers the capability probe, the twelve error mappings, and the prompt flag.                                                                      |
| `tests/appLockGate.test.tsx`              | Covers the grace-window boundary, the re-lock loop guard, and the PIN fallback.                                                                   |
| `tests/authStoreAppLock.test.ts`          | Covers the three new store actions and the two new fields.                                                                                        |
| `tests/migrationV22.test.ts`              | Covers seeding, default values, and idempotency of migration v22.                                                                                 |
| `tests/localeSettingsParity.test.ts`      | Covers `en` / `tl` key parity for the `settings` namespace.                                                                                       |
| `tests/backupRestoreGate.test.tsx`        | Covers the restore and unlink gates.                                                                                                              |
| `tests/ownerPinBiometricToggles.test.tsx` | Covers the two settings toggles and the risk confirmation.                                                                                        |

### Modified

| File                                                   | Change                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `jest.setup.ts`                                        | Add the `expo-local-authentication` module mock.                |
| `types/settings.types.ts`                              | Extend `AppSettingKey` with the two new keys.                   |
| `database/migrations.ts`                               | Add the v22 block that seeds both keys to `'0'`.                |
| `stores/useAuthStore.ts`                               | Add `isAppUnlocked`, `lastBackgroundedAt`, and three actions.   |
| `components/auth/OwnerPinGuardProvider.tsx`            | Try biometrics before showing the PIN modal.                    |
| `app/_layout.tsx`                                      | Mount `AppLockGate` and record background timestamps.           |
| `components/settings/OwnerPinSettingsCard.tsx`         | Add the two toggle rows and the risk confirmation.              |
| `components/settings/backup/LocalSnapshotsSection.tsx` | Gate `handleConfirmRestore`.                                    |
| `components/settings/backup/CloudBackupSection.tsx`    | Gate `handleUnlink`.                                            |
| `locales/en/settings.json`, `locales/tl/settings.json` | Add the `biometrics` block and the missing `pin.verify_failed`. |
| `tests/useOwnerPinGuard.test.tsx`                      | Extend with the biometric path.                                 |

### Deleted

| File               | Reason                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `lib/biometric.ts` | Untracked, unreferenced, and the sole source of the three current `tsc` errors. Superseded by `lib/auth/biometrics.ts`. |

### Deviations from the spec

1. **One restore gate, not two.** The spec gates both `RestorePickerModal.handleConfirmYes` and `LocalSnapshotsSection.handleConfirmRestore`. The former awaits the latter through the `onConfirm` prop, so gating both would show two prompts for one restore. Only `LocalSnapshotsSection.handleConfirmRestore` is gated; `RestorePickerModal.tsx` is not modified.
2. **A module-scoped flag replaces the spec's `isAuthInFlight` ref.** A React ref cannot be read by both `AppLockGate` and the `AppState` listener in `app/_layout.tsx`, and the owner PIN guard raises prompts too. `lib/auth/biometrics.ts` owns a module-level `promptActive` boolean exposed as `isBiometricPromptActive()`.
3. **`app.json` needs no edit.** The spec lists a `faceIDPermission` string to add. Both the `expo-local-authentication` and `expo-secure-store` plugin blocks already carry it. Task 10 verifies rather than writes.
4. **The OS sheet's cancel button says "Cancel", not "Use PIN instead".** The spec states five times over (behaviour table note, guard pseudocode, the testing section, the manual-QA table, and acceptance criterion 3) that `cancelled` aborts the action and shows no PIN modal. A button labelled "Use PIN instead" that aborts instead of showing the PIN would be a lie in the one piece of UI the owner sees before approving. The behaviour is what the spec argues for, so the copy is what changes: `biometrics.cancel_label` is `Cancel` / `Kanselahin`. Both platforms give that sheet exactly one negative button, so there is no room for both an abort and a PIN affordance. An owner who wants the PIN on a specific action still gets it — every non-`cancelled` failure falls through, so a deliberately wrong finger reaches the PIN modal — and turning the toggle off in Settings restores PIN-only approval permanently. If you would rather the sheet route to the PIN, that is a one-line change in Task 5 (`cancelled` joins the fall-through branch) plus reverting this copy, but it contradicts the spec and its tests, so raise it before implementing.

### Resolved ambiguities

1. **`available` and `enrolled` stay separate fields.** The settings copy must distinguish "this phone has no sensor" from "nothing is enrolled yet", and only the second is fixable by the user.
2. **Launch lock with the flag on but nothing enrolled shows the PIN, it does not open.** Un-enrolling a fingerprint must not silently disable the lock the owner asked for.
3. **The two toggles stay independent.** Turning off "Use biometrics" does not turn off "Lock app on launch"; the lock then asks for the PIN.
4. **Prompt reasons.** The five pre-existing guard call sites keep their hardcoded English `actionDescription` strings, which become the prompt message unchanged. New `biometrics.reason_*` keys cover only the new gates (launch lock, restore, cloud unlink) plus a default.
5. **Reactive versus imperative setting reads.** The settings card uses `useAppSetting` so the toggles re-render. The guard, the gate, and the threshold inputs read imperatively through `getAppSetting` because they run inside event handlers and effects, not render.

---

### Task 1: The biometrics module

The only file in the codebase allowed to import `expo-local-authentication`. Everything downstream consumes the normalised five-value union, so no screen, hook, or provider ever sees a native error string.

**Files:**

- Create: `lib/auth/biometrics.ts`
- Create: `tests/biometrics.test.ts`
- Modify: `jest.setup.ts` (insert after line 329, the `}));` that closes the `expo-haptics` factory)
- Delete: `lib/biometric.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks. `i18n.t('biometrics.cancel_label', { ns: 'settings' })` returns the raw key string until Task 2 adds it, which is why the test asserts "non-empty" rather than an exact value.
- Produces:
  - `type BiometricLabel = 'face' | 'fingerprint' | 'iris' | 'none'`
  - `interface BiometricCapability { available: boolean; enrolled: boolean; label: BiometricLabel }`
  - `type BiometricAuthResult = 'success' | 'cancelled' | 'fallback' | 'unavailable' | 'failed'`
  - `getBiometricCapability(): Promise<BiometricCapability>`
  - `authenticateOwner(reason: string): Promise<BiometricAuthResult>`
  - `isBiometricPromptActive(): boolean`

- [ ] **Step 1: Delete the dead module**

`lib/biometric.ts` is untracked, has zero importers, and produces the only three errors `pnpm typecheck` currently reports (TS2366 at 30:53, TS2322 at 34:5 and 43:5). It is untracked, so `git rm` is not needed.

```bash
rm lib/biometric.ts
pnpm typecheck
```

Expected: no output from `tsc`, exit code 0.

- [ ] **Step 2: Mock the native module in the Jest setup**

`lib/auth/biometrics.ts` imports `expo-local-authentication` at module load, which has no JS implementation under `jest-environment-node`. Insert this after line 329 of `jest.setup.ts`. The defaults describe a phone with an enrolled fingerprint; individual tests override them.

```ts
// Mock expo-local-authentication -- lib/auth/biometrics.ts imports this
// module at load time. Defaults describe a phone with an enrolled
// fingerprint; individual tests override with mockResolvedValue.
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1]),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));
```

- [ ] **Step 3: Write the failing test**

Create `tests/biometrics.test.ts`. Note the explicit default restoration in `beforeEach`: `jest.clearAllMocks()` clears calls but keeps replaced implementations, and several tests replace them with `mockResolvedValue`.

```ts
import * as LocalAuthentication from 'expo-local-authentication';

import {
  authenticateOwner,
  getBiometricCapability,
  isBiometricPromptActive,
  type BiometricAuthResult,
} from '@/lib/auth/biometrics';
import { initI18n } from '@/lib/i18n';

const hasHardware = LocalAuthentication.hasHardwareAsync as jest.Mock;
const isEnrolled = LocalAuthentication.isEnrolledAsync as jest.Mock;
const supportedTypes =
  LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock;
const authenticate = LocalAuthentication.authenticateAsync as jest.Mock;

beforeAll(async () => {
  await initI18n();
});

beforeEach(() => {
  jest.clearAllMocks();
  hasHardware.mockResolvedValue(true);
  isEnrolled.mockResolvedValue(true);
  supportedTypes.mockResolvedValue([1]);
  authenticate.mockResolvedValue({ success: true });
});

describe('getBiometricCapability', () => {
  it('reports an enrolled fingerprint sensor', async () => {
    await expect(getBiometricCapability()).resolves.toEqual({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
  });

  it('reports available but not enrolled when nothing is registered', async () => {
    isEnrolled.mockResolvedValue(false);
    await expect(getBiometricCapability()).resolves.toEqual({
      available: true,
      enrolled: false,
      label: 'fingerprint',
    });
  });

  it('short circuits to label none when there is no sensor', async () => {
    hasHardware.mockResolvedValue(false);
    await expect(getBiometricCapability()).resolves.toEqual({
      available: false,
      enrolled: false,
      label: 'none',
    });
    expect(isEnrolled).not.toHaveBeenCalled();
  });

  it('prefers face over fingerprint when both are supported', async () => {
    supportedTypes.mockResolvedValue([1, 2]);
    await expect(getBiometricCapability()).resolves.toMatchObject({
      label: 'face',
    });
  });

  it('reports iris when it is the only supported type', async () => {
    supportedTypes.mockResolvedValue([3]);
    await expect(getBiometricCapability()).resolves.toMatchObject({
      label: 'iris',
    });
  });

  it('never throws when the native call rejects', async () => {
    hasHardware.mockRejectedValue(new Error('native boom'));
    await expect(getBiometricCapability()).resolves.toEqual({
      available: false,
      enrolled: false,
      label: 'none',
    });
  });
});

describe('authenticateOwner', () => {
  it('always disables the device passcode fallback', async () => {
    await authenticateOwner('Approve this void');
    expect(authenticate).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Approve this void',
        disableDeviceFallback: true,
      }),
    );
  });

  it('passes a non-empty cancel label so the PIN escape is visible', async () => {
    await authenticateOwner('Approve this void');
    const options = authenticate.mock.calls[0]?.[0] as {
      cancelLabel?: string;
    };
    expect(options.cancelLabel).toBeTruthy();
  });

  it('resolves success when the native call succeeds', async () => {
    authenticate.mockResolvedValue({ success: true });
    await expect(authenticateOwner('reason')).resolves.toBe('success');
  });

  it.each<[string, BiometricAuthResult]>([
    ['user_cancel', 'cancelled'],
    ['system_cancel', 'cancelled'],
    ['app_cancel', 'cancelled'],
    ['user_fallback', 'fallback'],
    ['not_available', 'unavailable'],
    ['not_enrolled', 'unavailable'],
    ['passcode_not_set', 'unavailable'],
    ['lockout', 'unavailable'],
    ['lockout_permanent', 'unavailable'],
    ['authentication_failed', 'failed'],
    ['unknown', 'failed'],
    ['no_space', 'failed'],
  ])('maps the native error %s to %s', async (error, expected) => {
    authenticate.mockResolvedValue({ success: false, error });
    await expect(authenticateOwner('reason')).resolves.toBe(expected);
  });

  it('maps a failure with no error string to failed', async () => {
    authenticate.mockResolvedValue({ success: false });
    await expect(authenticateOwner('reason')).resolves.toBe('failed');
  });

  it('resolves unavailable when the native call throws', async () => {
    authenticate.mockRejectedValue(new Error('native boom'));
    await expect(authenticateOwner('reason')).resolves.toBe('unavailable');
  });
});

describe('isBiometricPromptActive', () => {
  it('is false before any prompt is raised', () => {
    expect(isBiometricPromptActive()).toBe(false);
  });

  it('is true while the prompt is open and false once it closes', async () => {
    let observed = false;
    authenticate.mockImplementation(async () => {
      observed = isBiometricPromptActive();
      return { success: true };
    });
    await authenticateOwner('reason');
    expect(observed).toBe(true);
    expect(isBiometricPromptActive()).toBe(false);
  });

  it('clears the flag when the prompt throws', async () => {
    authenticate.mockRejectedValue(new Error('native boom'));
    await authenticateOwner('reason');
    expect(isBiometricPromptActive()).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm jest tests/biometrics.test.ts`
Expected: FAIL, `Cannot find module '@/lib/auth/biometrics'`.

- [ ] **Step 5: Write the implementation**

Create `lib/auth/biometrics.ts`.

```ts
import * as LocalAuthentication from 'expo-local-authentication';
import i18n from 'i18next';

export type BiometricLabel = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  label: BiometricLabel;
}

export type BiometricAuthResult =
  'success' | 'cancelled' | 'fallback' | 'unavailable' | 'failed';

// Module scope, not a React ref: AppLockGate, the AppState listener in
// app/_layout.tsx, and the owner PIN guard all have to see this. The OS
// prompt backgrounds the app on some devices, which would otherwise look
// like a resume and re-arm the launch lock behind the open prompt.
let promptActive = false;

export const isBiometricPromptActive = (): boolean => promptActive;

const pickLabel = (
  types: LocalAuthentication.AuthenticationType[],
): BiometricLabel => {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
};

export const getBiometricCapability =
  async (): Promise<BiometricCapability> => {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      if (!available) {
        return { available: false, enrolled: false, label: 'none' };
      }
      const [enrolled, types] = await Promise.all([
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      return { available: true, enrolled, label: pickLabel(types) };
    } catch {
      return { available: false, enrolled: false, label: 'none' };
    }
  };

const mapError = (error: string | undefined): BiometricAuthResult => {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'cancelled';
    case 'user_fallback':
      return 'fallback';
    case 'not_available':
    case 'not_enrolled':
    case 'passcode_not_set':
    // A hard OS lockout has to fall through to the PIN rather than read as a
    // wrong finger, or the owner is locked out of their own shop.
    case 'lockout':
    case 'lockout_permanent':
      return 'unavailable';
    default:
      return 'failed';
  }
};

export const authenticateOwner = async (
  reason: string,
): Promise<BiometricAuthResult> => {
  promptActive = true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: i18n.t('biometrics.cancel_label', { ns: 'settings' }),
      disableDeviceFallback: true,
    });
    if (result.success) {
      return 'success';
    }
    return mapError(result.error);
  } catch {
    return 'unavailable';
  } finally {
    promptActive = false;
  }
};
```

`LocalAuthenticationResult` is a discriminated union, so the `if (result.success)` early return narrows the remainder to the failure variant and `result.error` typechecks without a cast.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm jest tests/biometrics.test.ts`
Expected: PASS, 26 tests.

- [ ] **Step 7: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, whole Jest suite green. If `tsc` still reports `lib/biometric.ts` errors, Step 1 was skipped.

- [ ] **Step 8: Commit**

```bash
git add lib/auth/biometrics.ts tests/biometrics.test.ts jest.setup.ts
# lib/biometric.ts was untracked, so its removal needs no git command.
git commit -m "feat: add normalised biometric authentication module"
```

---

### Task 2: Localisation

Every string the two features show. This lands before the UI tasks so no later task ever writes a hardcoded label, and so Task 1's `cancel_label` lookup starts returning real copy. It also fixes a live defect: `components/auth/OwnerPinModal.tsx:90` calls `t('pin.verify_failed')`, and that key exists in neither locale file, so the owner currently sees the raw key string when PIN verification throws.

**Files:**

- Modify: `locales/en/settings.json`
- Modify: `locales/tl/settings.json`
- Create: `tests/localeSettingsParity.test.ts`

**Interfaces:**

- Consumes: `biometrics.cancel_label` from Task 1, which reads it through `i18n.t('biometrics.cancel_label', { ns: 'settings' })`.
- Produces: twenty `biometrics.*` keys plus `pin.verify_failed`, in both locales. Later tasks reference them as `t('biometrics.<key>')` from `OwnerPinSettingsCard` and `AppLockGate` (both use `useTranslation('settings')`, so keys are bare) and as `t('settings:biometrics.<key>')` from `LocalSnapshotsSection` (which calls `useTranslation()` with no namespace).

Both files are 32 lines, use CRLF line endings, and end with the `pin` object as the last top-level key. Preserve the CRLF endings; do not reformat the files.

- [ ] **Step 1: Write the failing parity test**

Create `tests/localeSettingsParity.test.ts`. The suite has two halves: a structural assertion that `en` and `tl` carry an identical key set, and a per-key assertion that each string this feature needs is non-empty in both. The first half guards against a future contributor adding a key to one locale only; the second names the keys this plan is responsible for so a partial edit fails loudly.

```ts
import en from '@/locales/en/settings.json';
import tl from '@/locales/tl/settings.json';

type FlatLocale = Record<string, string>;

// react-i18next resolves 'biometrics.cancel_label' through the nested
// object, so parity has to be checked on flattened dotted paths rather
// than on top-level keys.
const flatten = (input: unknown, prefix = ''): FlatLocale => {
  const out: FlatLocale = {};
  if (typeof input !== 'object' || input === null) {
    return out;
  }
  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out[path] = value;
    } else {
      Object.assign(out, flatten(value, path));
    }
  }
  return out;
};

const flatEn = flatten(en);
const flatTl = flatten(tl);

const REQUIRED_KEYS = [
  'pin.verify_failed',
  'biometrics.cancel_label',
  'biometrics.toggle_use_biometrics',
  'biometrics.toggle_use_biometrics_help',
  'biometrics.toggle_launch_lock',
  'biometrics.toggle_launch_lock_help',
  'biometrics.requires_pin',
  'biometrics.not_available',
  'biometrics.not_enrolled',
  'biometrics.risk_title',
  'biometrics.risk_body',
  'biometrics.risk_confirm',
  'biometrics.risk_cancel',
  'biometrics.reason_unlock',
  'biometrics.reason_restore',
  'biometrics.reason_unlink',
  'biometrics.reason_default',
  'biometrics.lock_title',
  'biometrics.lock_subtitle',
  'biometrics.lock_retry',
  'biometrics.lock_use_pin',
] as const;

describe('settings locale parity', () => {
  it('carries an identical key set in en and tl', () => {
    expect(Object.keys(flatTl).sort()).toEqual(Object.keys(flatEn).sort());
  });

  it.each(REQUIRED_KEYS)('has a non-empty en and tl value for %s', (key) => {
    expect(flatEn[key]).toBeTruthy();
    expect(flatTl[key]).toBeTruthy();
  });
});
```

`flatEn[key]` is `string | undefined` under `noUncheckedIndexedAccess`, which `toBeTruthy()` accepts without a cast. `resolveJsonModule` is inherited from `expo/tsconfig.base` and `lib/i18n.ts` already default-imports these same files, so the two JSON imports need no new configuration.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest tests/localeSettingsParity.test.ts`
Expected: the parity test passes (the two files are already in sync), and 21 of the `it.each` rows fail because none of the required keys exist yet.

- [ ] **Step 3: Add the English copy**

In `locales/en/settings.json`, append `verify_failed` to the `pin` object, add a comma after that object's closing brace, and add `biometrics` as a new sibling. The tail of the file becomes exactly this. Keep the file's CRLF line endings.

```json
    "btn_reset": "Reset with Recovery Code",
    "verify_failed": "Could not verify your PIN. Please try again."
  },
  "biometrics": {
    "cancel_label": "Cancel",
    "toggle_use_biometrics": "Use fingerprint or face",
    "toggle_use_biometrics_help": "Approve owner actions with your fingerprint or face instead of typing the PIN. The PIN always still works.",
    "toggle_launch_lock": "Lock app on launch",
    "toggle_launch_lock_help": "Ask for your fingerprint, face, or PIN when the app opens. Reopening within five minutes will not ask again.",
    "requires_pin": "Set up an Owner PIN first.",
    "not_available": "This phone has no fingerprint or face sensor.",
    "not_enrolled": "Register a fingerprint or face in your phone settings first.",
    "risk_title": "Anyone enrolled on this phone can approve",
    "risk_body": "Every fingerprint and face registered on this phone will be able to approve voids, refunds, credit limit overrides, stock adjustments, and restores without knowing your PIN. Turn this on only if you are the only person enrolled.",
    "risk_confirm": "I understand, turn it on",
    "risk_cancel": "Cancel",
    "reason_unlock": "Unlock SariSari",
    "reason_restore": "Approve restoring a backup",
    "reason_unlink": "Approve unlinking cloud backup",
    "reason_default": "Approve this owner action",
    "lock_title": "SariSari is locked",
    "lock_subtitle": "Confirm it is you to continue.",
    "lock_retry": "Try again",
    "lock_use_pin": "Use Owner PIN"
  }
}
```

`risk_body` is the copy the owner reads before turning biometrics on. It names the actual consequence rather than a generic security warning, because the owner explicitly chose full substitution everywhere and has to be able to make that choice knowingly.

- [ ] **Step 4: Add the Tagalog copy**

Same shape in `locales/tl/settings.json`. The tail of the file becomes exactly this. Keep the file's existing line endings.

```json
    "btn_reset": "I-reset gamit ang Recovery Code",
    "verify_failed": "Hindi na-verify ang PIN. Pakisubukan muli."
  },
  "biometrics": {
    "cancel_label": "Kanselahin",
    "toggle_use_biometrics": "Gamitin ang fingerprint o mukha",
    "toggle_use_biometrics_help": "Aprubahan ang owner actions gamit ang fingerprint o mukha, hindi na kailangang i-type ang PIN. Gumagana pa rin ang PIN palagi.",
    "toggle_launch_lock": "I-lock ang app kapag binuksan",
    "toggle_launch_lock_help": "Magtatanong ng fingerprint, mukha, o PIN kapag binuksan ang app. Hindi na magtatanong kung babalik sa loob ng limang minuto.",
    "requires_pin": "Mag-set up muna ng Owner PIN.",
    "not_available": "Walang fingerprint o face sensor ang teleponong ito.",
    "not_enrolled": "Magrehistro muna ng fingerprint o mukha sa settings ng telepono.",
    "risk_title": "Kahit sino na nakarehistro ay makaka-aprubahan",
    "risk_body": "Lahat ng fingerprint at mukha na nakarehistro sa teleponong ito ay makaka-aprubahan ng void, refund, credit limit override, stock adjustment, at restore kahit hindi alam ang PIN. I-on lamang ito kung ikaw lang ang nakarehistro.",
    "risk_confirm": "Naiintindihan ko, i-on",
    "risk_cancel": "Huwag",
    "reason_unlock": "I-unlock ang SariSari",
    "reason_restore": "Aprubahan ang pag-restore ng backup",
    "reason_unlink": "Aprubahan ang pag-unlink ng cloud backup",
    "reason_default": "Aprubahan ang owner action na ito",
    "lock_title": "Naka-lock ang SariSari",
    "lock_subtitle": "Kumpirmahin na ikaw ito para magpatuloy.",
    "lock_retry": "Subukang muli",
    "lock_use_pin": "Gamitin ang Owner PIN"
  }
}
```

The Tagalog keeps the English loanwords the owner already reads elsewhere in this app (`fingerprint`, `void`, `refund`, `backup`, `restore`, `Owner PIN`), matching the existing `pin` block rather than inventing translations.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm jest tests/localeSettingsParity.test.ts`
Expected: PASS, 22 tests.

- [ ] **Step 6: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, whole Jest suite green. `tests/biometrics.test.ts` still passes; its `cancelLabel` assertion was written as "non-empty" precisely so it holds both before and after this task, and it now resolves to "Use PIN instead" rather than the raw key.

- [ ] **Step 7: Commit**

```bash
git add locales/en/settings.json locales/tl/settings.json tests/localeSettingsParity.test.ts
git commit -m "feat: add biometric settings copy and fix missing pin.verify_failed key"
```

---

### Task 3: Persistence — migration v22 and the setting keys

The two toggles need a place to live. `app_settings` already exists (created and seeded by the v21 block), and `AppSettingKey` is a closed union, so a new key is a compile error until the union grows. Both flags default to `'0'` — off — which is the behaviour the owner asked for.

**Files:**

- Modify: `types/settings.types.ts:1-4`
- Modify: `database/migrations.ts` (insert a new block between line 1017 `}` and line 1018 `}`)
- Test: `tests/migrationV22.test.ts` (create)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: two literals on `AppSettingKey` — `'biometric_unlock_enabled'` and `'app_launch_lock_enabled'` — and two `app_settings` rows seeded to the string `'0'`. Task 5 and Task 6 read them imperatively with `getAppSetting(key)`; Task 9 reads and writes them through `useAppSetting(key)` / `useSetAppSetting(key)`. Values are always the strings `'0'` and `'1'`, never booleans, because `app_settings.value` is `TEXT NOT NULL` and every existing consumer compares against `'1'`.

Neither key is listed in the `assertOwnerAuthorized()` branch inside `database/settings.ts:39` and `:53` — only `void_window_hours` is — so reads and writes of these two keys work before onboarding completes. That is deliberate: `AppLockGate` (Task 6) reads `app_launch_lock_enabled` at cold start, which can happen before onboarding finishes, and a thrown `UnauthorizedError` there would either lock the owner out of their own onboarding or crash the tree. Do not add these keys to those branches.

- [ ] **Step 1: Write the failing test**

Create `tests/migrationV22.test.ts`. The `beforeEach` is copied from `tests/migrationV21.test.ts:17-30` — the `resetMockDb()` sandwiched between the two `PRAGMA foreign_keys` statements, `PRAGMA user_version = 0`, then the table initialisers, then `runMigrations()`.

```ts
import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initCashTables,
  initCorrectionsTable,
  runMigrations,
} from '../database';
import { getAppSetting, setAppSetting } from '../database/settings';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Migration v22 biometric settings', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA user_version = 0;');
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await initCashTables();
    await initCorrectionsTable();
    await runMigrations();
    await AsyncStorage.clear();
  });

  it('raises the schema version to 22', async () => {
    const rows = await db.getAllAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(rows[0]?.user_version).toBe(22);
  });

  it('seeds both biometric flags to off', async () => {
    await expect(getAppSetting('biometric_unlock_enabled')).resolves.toBe('0');
    await expect(getAppSetting('app_launch_lock_enabled')).resolves.toBe('0');
  });

  it('leaves the settings seeded by earlier migrations alone', async () => {
    await expect(getAppSetting('void_window_hours')).resolves.toBe('24');
    await expect(
      getAppSetting('owner_pin_discount_threshold_pesos'),
    ).resolves.toBe('50');
  });

  it('round-trips a value written by the settings toggle', async () => {
    await setAppSetting('biometric_unlock_enabled', '1');
    await expect(getAppSetting('biometric_unlock_enabled')).resolves.toBe('1');
    await expect(getAppSetting('app_launch_lock_enabled')).resolves.toBe('0');
  });

  it('reads the flags without owner authorization while onboarding is incomplete', async () => {
    await AsyncStorage.setItem(
      'onboarding_state_v1',
      JSON.stringify({
        completed: false,
        profile: { ownerName: 'Owner', storeName: 'My Store' },
      }),
    );

    await expect(getAppSetting('app_launch_lock_enabled')).resolves.toBe('0');
    await expect(
      setAppSetting('biometric_unlock_enabled', '1'),
    ).resolves.toBeUndefined();
  });

  it('never re-disables a flag the owner already turned on', async () => {
    await setAppSetting('biometric_unlock_enabled', '1');
    await db.execAsync('PRAGMA user_version = 21;');

    await runMigrations();

    const rows = await db.getAllAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(rows[0]?.user_version).toBe(22);
    await expect(getAppSetting('biometric_unlock_enabled')).resolves.toBe('1');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest tests/migrationV22.test.ts`
Expected: FAIL. `raises the schema version to 22` gets `21`; the seed, round-trip, and idempotency tests get `null` where they expect `'0'` or `'1'`. The onboarding test passes already, because the keys are ungated by construction — it is a regression guard, not a red test.

`pnpm typecheck` at this point reports TS2345 on every `'biometric_unlock_enabled'` and `'app_launch_lock_enabled'` argument, since `AppSettingKey` does not yet include them. Step 3 clears that.

- [ ] **Step 3: Extend the setting key union**

Replace `types/settings.types.ts:1-4` with:

```ts
export type AppSettingKey =
  | 'void_window_hours'
  | 'owner_pin_discount_threshold_pesos'
  | 'owner_pin_discount_threshold_percent'
  | 'biometric_unlock_enabled'
  | 'app_launch_lock_enabled';
```

Leave `AppSettingRow` untouched. The union is re-exported through `types/index.ts`, which `database/settings.ts:2` imports as `@/types`, so no export plumbing changes.

- [ ] **Step 4: Add the v22 migration block**

Insert this between `database/migrations.ts:1017` (the `}` that closes the `if (currentVersion < 21)` block) and line 1018 (the `}` that closes `runMigrations`). It is the v21 block's shape with new keys: a defensive `CREATE TABLE IF NOT EXISTS` in case a database somehow reaches v22 without the table, then `INSERT OR IGNORE` seeds, then the version bump — all inside one `withTransactionAsync`.

```ts
if (currentVersion < 22) {
  console.log('Running migration to v22 (Biometric owner auth settings)...');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('biometric_unlock_enabled', '0', CAST(strftime('%s','now') AS INTEGER) * 1000)",
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('app_launch_lock_enabled', '0', CAST(strftime('%s','now') AS INTEGER) * 1000)",
    );

    await db.execAsync('PRAGMA user_version = 22;');
  });
  console.log('Database migrated to v22.');
}
```

`INSERT OR IGNORE` rather than `INSERT ... ON CONFLICT DO UPDATE` is what makes the idempotency test pass: a re-run must never push an owner's `'1'` back to `'0'`. `currentVersion` is read once at `database/migrations.ts:7`, so entering with a v21 database skips the v21 block and runs only this one.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm jest tests/migrationV22.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, whole suite green. Watch `tests/migrationV21.test.ts` and `tests/appSettingsAuthorization.test.ts` in particular — both run `runMigrations()` in `beforeEach` and now walk through v22 as well.

- [ ] **Step 7: Commit**

```bash
git add types/settings.types.ts database/migrations.ts tests/migrationV22.test.ts
git commit -m "feat: add migration v22 seeding biometric and app lock settings"
```

---

### Task 4: App-lock state in the auth store

`AppLockGate` (Task 6) needs to know two things across renders and across the `AppState` listener in `app/_layout.tsx` (Task 7): whether the app is currently unlocked, and when it was last backgrounded. Both belong in `useAuthStore` rather than component state, because the listener that writes the timestamp lives in the root layout while the reader lives in the gate.

The existing PIN-lockout members stay exactly as they are. Biometric and app-lock activity must never touch `failedAttempts` or `lockoutUntil` — those count _PIN_ failures and drive the 60-second lockout, and a failed fingerprint scan is not a wrong PIN. That is a stated constraint, so it gets a test.

**Files:**

- Modify: `stores/useAuthStore.ts` (`AuthState` interface at `:3-13`, initial state at `:16-18`, actions after `:31`)
- Test: `tests/authStoreAppLock.test.ts` (create)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces, on `useAuthStore`:
  - `isAppUnlocked: boolean` — starts `false`
  - `lastBackgroundedAt: number | null` — starts `null`
  - `markUnlocked: () => void` — sets `isAppUnlocked: true`, `lastBackgroundedAt: null`
  - `markBackgrounded: () => void` — sets `lastBackgroundedAt: Date.now()`, leaves `isAppUnlocked` alone
  - `requireUnlock: () => void` — sets `isAppUnlocked: false`

  Task 6 reads `isAppUnlocked` / `lastBackgroundedAt` and calls `markUnlocked` / `requireUnlock`. Task 7 calls `markBackgrounded` from the `AppState` listener. `useAuthStore` is _not_ re-exported from `stores/index.ts`, so every consumer imports it as `import { useAuthStore } from '@/stores/useAuthStore';` — the path all five existing consumers already use.

`markBackgrounded` deliberately does not lock. If it did, the lock screen would render into the OS app-switcher snapshot, and the grace window could never be honoured. Locking is decided on the way back in, by `shouldRelockOnResume` in Task 6.

- [ ] **Step 1: Write the failing test**

Create `tests/authStoreAppLock.test.ts`. `useAuthStore` is a module-level singleton, so `beforeEach` resets the slice under test explicitly rather than relying on fresh-module state.

```ts
import { useAuthStore } from '@/stores/useAuthStore';

const NOW = 1_700_000_000_000;

describe('useAuthStore app lock state', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    useAuthStore.setState({
      isAppUnlocked: false,
      lastBackgroundedAt: null,
      failedAttempts: 0,
      lockoutUntil: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts locked with no backgrounded timestamp', () => {
    const state = useAuthStore.getState();
    expect(state.isAppUnlocked).toBe(false);
    expect(state.lastBackgroundedAt).toBeNull();
  });

  it('markUnlocked opens the app and clears the timestamp', () => {
    useAuthStore.setState({ lastBackgroundedAt: NOW - 1000 });

    useAuthStore.getState().markUnlocked();

    const state = useAuthStore.getState();
    expect(state.isAppUnlocked).toBe(true);
    expect(state.lastBackgroundedAt).toBeNull();
  });

  it('markBackgrounded records the time without locking', () => {
    useAuthStore.getState().markUnlocked();

    useAuthStore.getState().markBackgrounded();

    const state = useAuthStore.getState();
    expect(state.lastBackgroundedAt).toBe(NOW);
    expect(state.isAppUnlocked).toBe(true);
  });

  it('requireUnlock closes the app again', () => {
    useAuthStore.getState().markUnlocked();

    useAuthStore.getState().requireUnlock();

    expect(useAuthStore.getState().isAppUnlocked).toBe(false);
  });

  it('leaves the PIN lockout counters untouched', () => {
    useAuthStore.setState({ failedAttempts: 2, lockoutUntil: NOW + 60_000 });

    useAuthStore.getState().markBackgrounded();
    useAuthStore.getState().requireUnlock();
    useAuthStore.getState().markUnlocked();

    const state = useAuthStore.getState();
    expect(state.failedAttempts).toBe(2);
    expect(state.lockoutUntil).toBe(NOW + 60_000);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest tests/authStoreAppLock.test.ts`
Expected: FAIL. The first test fails on `expect(undefined).toBe(false)`; the other four fail with `useAuthStore.getState().markUnlocked is not a function`. `pnpm typecheck` also reports TS2345 on the `beforeEach` `setState` object, because `isAppUnlocked` and `lastBackgroundedAt` are not yet on `AuthState`.

- [ ] **Step 3: Add the app-lock members**

`stores/useAuthStore.ts` in full after the change:

```ts
import { create } from 'zustand';

interface AuthState {
  isPinConfigured: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  isAppUnlocked: boolean;
  lastBackgroundedAt: number | null;
  setIsPinConfigured: (status: boolean) => void;
  registerFailedAttempt: () => void;
  resetFailedAttempts: () => void;
  clearExpiredLockout: () => void;
  isLockedOut: () => boolean;
  getLockoutSecondsRemaining: () => number;
  markUnlocked: () => void;
  markBackgrounded: () => void;
  requireUnlock: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isPinConfigured: false,
  failedAttempts: 0,
  lockoutUntil: null,
  isAppUnlocked: false,
  lastBackgroundedAt: null,
  setIsPinConfigured: (status: boolean) => set({ isPinConfigured: status }),
  registerFailedAttempt: () => {
    const nextAttempts = get().failedAttempts + 1;
    if (nextAttempts >= 3) {
      set({
        failedAttempts: nextAttempts,
        lockoutUntil: Date.now() + 60_000,
      });
    } else {
      set({ failedAttempts: nextAttempts });
    }
  },
  resetFailedAttempts: () => set({ failedAttempts: 0, lockoutUntil: null }),
  clearExpiredLockout: () => {
    const lockoutUntil = get().lockoutUntil;
    if (lockoutUntil && Date.now() > lockoutUntil) {
      set({ lockoutUntil: null, failedAttempts: 0 });
    }
  },
  isLockedOut: () => {
    const lockoutUntil = get().lockoutUntil;
    if (!lockoutUntil) return false;
    if (Date.now() > lockoutUntil) {
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
  markUnlocked: () => set({ isAppUnlocked: true, lastBackgroundedAt: null }),
  markBackgrounded: () => set({ lastBackgroundedAt: Date.now() }),
  requireUnlock: () => set({ isAppUnlocked: false }),
}));
```

Nothing above `markUnlocked` changed except the two new fields in the interface and the two new initial values. The file has no trailing semicolon after `}))` and no trailing newline; leave both as they are so the diff stays to the lines you actually touched.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm jest tests/authStoreAppLock.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, whole suite green. `tests/useOwnerPinGuard.test.tsx` calls `useAuthStore.setState({ isPinConfigured: false })` — a partial `setState`, so the two new required fields do not break it.

- [ ] **Step 6: Commit**

```bash
git add stores/useAuthStore.ts tests/authStoreAppLock.test.ts
git commit -m "feat: track app lock state in the auth store"
```

---

### Task 5: Biometric substitution in the owner PIN guard

The gate that covers all five existing sensitive actions. `GuardOptions` and `OwnerPinGuardContextType` do not change, so none of the four consumer files is touched: `app/(edit-forms)/sale-correction/[id].tsx:88`, `components/sales/price-correction/usePriceCorrectionForm.ts:213`, `components/utang/credit-guardrails/OverrideReasonModal.tsx:69` and `:86`, and `components/inventory/ledger/LogTransactionForm.tsx:85` all keep calling `runWithPinGuard` exactly as they do now and silently gain the biometric path.

**Files:**

- Modify: `components/auth/OwnerPinGuardProvider.tsx` (imports `:1-7`, new helper after the `useEffect` that ends at `:49`, restructured `runWithPinGuard` `:51-68`)
- Test: `tests/useOwnerPinGuard.test.tsx` (extend: imports `:1-9`, the file-level `beforeEach` `:18-22`, and a new sibling `describe` after the existing `runWithPinGuard guard flow` block closes at `:195`)

**Interfaces:**

- Consumes: `getBiometricCapability()` and `authenticateOwner(reason)` from Task 1; `biometrics.reason_default` from Task 2; `'biometric_unlock_enabled'` from Task 3. Nothing from Task 4 — the launch lock is a separate surface.
- Produces: no new exports. `tryBiometricApproval` stays module-private inside the provider and returns `'approved' | 'aborted' | 'fall-through'`. Later tasks depend only on the unchanged `runWithPinGuard` signature.

Three things about this task are load-bearing and easy to get wrong.

**`cancelled` is the only outcome that aborts.** `failed`, `fallback`, and `unavailable` all fall through to the PIN modal. That is what keeps the PIN a complete fallback path: no device state, including an OS biometric lockout, can leave the owner unable to approve. See Deviation 4 for why the sheet's button reads `Cancel`.

**Biometric activity must never touch the PIN lockout counters.** `registerFailedAttempt` is not called on a failed biometric attempt, so three wrong fingers do not lock the owner out of the PIN. A live PIN lockout, however, suppresses the biometric prompt entirely and goes straight to the PIN modal with its countdown banner — otherwise biometrics would be a way around the lockout. Both directions get a test.

**The existing try/catch gets narrowed, not widened.** Today the whole body of `runWithPinGuard` sits inside one `try` whose `catch` raises `Alert.alert('Owner PIN Unavailable', ...)`. If `await options.onApproved()` were added inside that `try`, any error thrown by the caller's own approved action would surface as a false "Owner PIN verification is currently unavailable" alert. So the `try` shrinks to wrap only the `isOwnerPinConfigured()` call it was always about. Every existing assertion in `tests/useOwnerPinGuard.test.tsx` still holds, including that a throw leaves `isPinConfigured` at `true` — `setIsPinConfigured` stays after the `catch`.

- [ ] **Step 1: Extend the test file**

First, the imports and the shared `beforeEach`. Replace `tests/useOwnerPinGuard.test.tsx:1-22` with this. The three new spies matter: the suite never calls `resetMockDb()`, so an unmocked `getAppSetting` would hit a database with no `app_settings` table, and `jest.clearAllMocks()` does not remove implementations installed after it.

```tsx
import React from 'react';
import { Button } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { OwnerPinGuardProvider } from '@/components/auth/OwnerPinGuardProvider';
import * as authDb from '@/database/auth';
import * as settingsDb from '@/database/settings';
import * as biometrics from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { Alert } from '@/utils';
import { initI18n } from '@/lib/i18n';

describe('useOwnerPinGuard & OwnerPinGuardProvider', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    useAuthStore.setState({
      isPinConfigured: false,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    jest.clearAllMocks();
    // Installed after clearAllMocks so the implementations survive it.
    // Flag off by default keeps every pre-existing test on the PIN path.
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('0');
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
  });
```

Leave `afterEach` and the three existing `describe` blocks exactly as they are. Then add this fourth `describe` as a sibling, after the `runWithPinGuard guard flow` block closes and before the final `});` of the outer describe.

```tsx
describe('biometric substitution', () => {
  const BioConsumer = ({
    onApproved,
    actionDescription,
  }: {
    onApproved: () => void;
    actionDescription?: string;
  }) => {
    const { runWithPinGuard } = useOwnerPinGuard();
    return (
      <Button
        title="Trigger Action"
        onPress={() =>
          runWithPinGuard({
            title: 'Sensitive Operation',
            onApproved,
            ...(actionDescription ? { actionDescription } : {}),
          })
        }
      />
    );
  };

  beforeEach(() => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('1');
    useAuthStore.setState({ isPinConfigured: true });
  });

  it('does not prompt when the biometric flag is off', async () => {
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('0');
    const bioSpy = jest.spyOn(biometrics, 'authenticateOwner');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(bioSpy).not.toHaveBeenCalled();
    expect(onApproved).not.toHaveBeenCalled();
  });

  it('runs the action without the PIN modal when biometrics succeed', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(onApproved).toHaveBeenCalledTimes(1);
    });

    expect(queryByText('Sensitive Operation')).toBeNull();
    expect(queryByText(/Set Up Owner PIN|Mag-set up ng Owner PIN/i)).toBeNull();
  });

  it('aborts silently when the owner cancels the OS sheet', async () => {
    const bioSpy = jest
      .spyOn(biometrics, 'authenticateOwner')
      .mockResolvedValue('cancelled');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(bioSpy).toHaveBeenCalledTimes(1);
    });

    expect(onApproved).not.toHaveBeenCalled();
    expect(queryByText('Sensitive Operation')).toBeNull();
    expect(queryByText(/Set Up Owner PIN|Mag-set up ng Owner PIN/i)).toBeNull();
  });

  it.each(['failed', 'unavailable', 'fallback'] as const)(
    'falls through to the PIN modal when the result is %s',
    async (result) => {
      jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue(result);
      const onApproved = jest.fn();

      const { getByText, queryByText } = await render(
        <OwnerPinGuardProvider isReady={false}>
          <BioConsumer onApproved={onApproved} />
        </OwnerPinGuardProvider>,
      );

      fireEvent.press(getByText('Trigger Action'));

      await waitFor(() => {
        expect(queryByText('Sensitive Operation')).toBeTruthy();
      });

      expect(onApproved).not.toHaveBeenCalled();
    },
  );

  it('does not prompt when nothing is enrolled', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: false,
      label: 'none',
    });
    const bioSpy = jest.spyOn(biometrics, 'authenticateOwner');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(bioSpy).not.toHaveBeenCalled();
  });

  it('does not prompt when the device has no biometric hardware', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: false,
      enrolled: false,
      label: 'none',
    });
    const bioSpy = jest.spyOn(biometrics, 'authenticateOwner');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(bioSpy).not.toHaveBeenCalled();
  });

  it('does not prompt while a PIN lockout is active', async () => {
    useAuthStore.setState({
      failedAttempts: 3,
      lockoutUntil: Date.now() + 60_000,
    });
    const bioSpy = jest.spyOn(biometrics, 'authenticateOwner');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(bioSpy).not.toHaveBeenCalled();
    expect(onApproved).not.toHaveBeenCalled();
  });

  it('falls through to the PIN modal when reading the flag throws', async () => {
    jest
      .spyOn(settingsDb, 'getAppSetting')
      .mockRejectedValue(new Error('no such table: app_settings'));
    const bioSpy = jest.spyOn(biometrics, 'authenticateOwner');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(bioSpy).not.toHaveBeenCalled();
  });

  it('leaves the PIN failure counter untouched when biometrics fail', async () => {
    useAuthStore.setState({ failedAttempts: 2 });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('failed');
    const onApproved = jest.fn();

    const { getByText, queryByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(queryByText('Sensitive Operation')).toBeTruthy();
    });

    expect(useAuthStore.getState().failedAttempts).toBe(2);
    expect(useAuthStore.getState().lockoutUntil).toBeNull();
  });

  it('clears the PIN failure counter on biometric success', async () => {
    useAuthStore.setState({ failedAttempts: 2 });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
    const onApproved = jest.fn();

    const { getByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(onApproved).toHaveBeenCalledTimes(1);
    });

    expect(useAuthStore.getState().failedAttempts).toBe(0);
  });

  it("passes the caller's actionDescription to the prompt verbatim", async () => {
    const bioSpy = jest
      .spyOn(biometrics, 'authenticateOwner')
      .mockResolvedValue('success');
    const onApproved = jest.fn();

    const { getByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer
          onApproved={onApproved}
          actionDescription="Needs owner permission"
        />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(bioSpy).toHaveBeenCalledWith('Needs owner permission');
    });
  });

  it('falls back to a translated reason when the caller supplies none', async () => {
    const bioSpy = jest
      .spyOn(biometrics, 'authenticateOwner')
      .mockResolvedValue('success');
    const onApproved = jest.fn();

    const { getByText } = await render(
      <OwnerPinGuardProvider isReady={false}>
        <BioConsumer onApproved={onApproved} />
      </OwnerPinGuardProvider>,
    );

    fireEvent.press(getByText('Trigger Action'));

    await waitFor(() => {
      expect(bioSpy).toHaveBeenCalledTimes(1);
    });

    const reason = bioSpy.mock.calls[0]?.[0];
    expect(reason).toBeTruthy();
    // Asserts the key resolved, not which language won. i18next echoes the
    // key back when a translation is missing.
    expect(reason).not.toContain('reason_default');
  });
});
```

Two notes on why these tests look the way they do. `queryByText('Sensitive Operation')` is the existing suite's tell for "the PIN challenge modal is up" — it is the caller-supplied `title`, so it is locale-independent, unlike the setup modal which needs the `/Set Up Owner PIN|Mag-set up ng Owner PIN/i` alternation. And the last test does not assert the literal string "Approve this owner action": the default language under test is not pinned, so it checks that i18next resolved the key at all rather than echoing it back.

- [ ] **Step 2: Run the suite to see which of the new tests fail**

Run: `pnpm jest tests/useOwnerPinGuard.test.tsx`

Expected: **21 tests, 5 failing.** This is the one task where most new tests pass before the implementation, so check the failures by name rather than the count:

- `runs the action without the PIN modal when biometrics succeed` — fails on `expect(jest.fn()).toHaveBeenCalledTimes(1)`, received 0
- `aborts silently when the owner cancels the OS sheet` — fails the same way on `bioSpy`
- `clears the PIN failure counter on biometric success` — fails on `onApproved`
- `passes the caller's actionDescription to the prompt verbatim` — fails on `bioSpy`
- `falls back to a translated reason when the caller supplies none` — fails on `bioSpy`

The other nine pass vacuously: today `runWithPinGuard` always shows the PIN modal, which is exactly what "falls through" asserts. They are regression guards, not drivers — they must still pass in Step 4, and they are the tests that would catch a Step 3 that prompts when the flag is off, when nothing is enrolled, or during a lockout.

`pnpm typecheck` should be clean at this point: every symbol the new tests reference already exists after Tasks 1-3.

- [ ] **Step 3: Add the biometric path to the provider**

Add three imports to `components/auth/OwnerPinGuardProvider.tsx`, keeping the existing grouping (React first, then app modules):

```tsx
import i18n from 'i18next';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
} from '@/lib/auth/biometrics';
```

`@/database/settings` is the same specifier `hooks/useAppSetting.ts:2` uses. This is a deliberate, documented exception to "screens never call SQLite" — see Deviation 2 — because the guard needs the flag inside an event handler, not as rendered state, and a React Query read would either race the first press or force the provider to re-render on every settings change.

Then replace `runWithPinGuard` (`:51-68`) with the helper plus the restructured caller:

```tsx
const tryBiometricApproval = async (
  options: GuardOptions,
): Promise<'approved' | 'aborted' | 'fall-through'> => {
  // A live PIN lockout must not be bypassable by a fingerprint.
  if (useAuthStore.getState().isLockedOut()) return 'fall-through';

  let enabled = false;
  try {
    enabled = (await getAppSetting('biometric_unlock_enabled')) === '1';
  } catch {
    return 'fall-through';
  }
  if (!enabled) return 'fall-through';

  const capability = await getBiometricCapability();
  if (!capability.available || !capability.enrolled) return 'fall-through';

  const reason =
    options.actionDescription ??
    i18n.t('biometrics.reason_default', { ns: 'settings' });
  const result = await authenticateOwner(reason);

  if (result === 'success') {
    // Biometric success is an owner approval, so it clears PIN failures.
    // A biometric failure never touches them.
    useAuthStore.getState().resetFailedAttempts();
    setActiveOptions(null);
    await options.onApproved();
    return 'approved';
  }
  if (result === 'cancelled') {
    setActiveOptions(null);
    return 'aborted';
  }
  return 'fall-through';
};

const runWithPinGuard = async (options: GuardOptions) => {
  setActiveOptions(options);
  let configured = false;
  try {
    configured = await isOwnerPinConfigured();
  } catch {
    setActiveOptions(null);
    Alert.alert(
      'Owner PIN Unavailable',
      'Owner PIN verification is currently unavailable. Please try again.',
    );
    return;
  }
  setIsPinConfigured(configured);
  if (!configured) {
    setShowSetup(true);
    return;
  }
  if ((await tryBiometricApproval(options)) === 'fall-through') {
    setShowChallenge(true);
  }
};
```

Four details that are not cosmetic:

`getBiometricCapability` and `authenticateOwner` both swallow their own exceptions (Task 1 wraps each in `try/catch` and returns the unavailable shape), so the helper needs no further guarding. `getAppSetting` is the only call here that can reject, and it is wrapped.

`let configured = false` rather than `const configured = await ...` inside the `try`: the value has to outlive the block, and initialising it keeps TypeScript's definite-assignment analysis quiet without a non-null assertion.

The `catch` now `return`s. Previously the whole body was inside the `try`, so control simply fell off the end; with the narrowed block an early return is what stops the setup modal from opening after a database failure.

`setIsPinConfigured` stays _after_ the `catch`, so the existing "fails closed when isOwnerPinConfigured throws" test still sees `isPinConfigured` at `true`.

- [ ] **Step 4: Run the suite to verify it passes**

Run: `pnpm jest tests/useOwnerPinGuard.test.tsx`
Expected: PASS, 21 tests.

If `jest.spyOn(settingsDb, 'getAppSetting')` throws "Cannot redefine property", the module is not spy-able — but it is: this same file already spies `authDb.isOwnerPinConfigured` while the provider imports it as a named binding, and babel-preset-expo compiles that binding to a property read on the module object at each call site. `settingsDb` and `biometrics` behave identically.

- [ ] **Step 5: Run the full gate**

Run: `pnpm verify`
Expected: typecheck clean, all suites pass.

The five existing guard call sites are worth a moment's thought here even though they compile untouched: `GuardOptions` and `runWithPinGuard`'s signature did not change, so `app/(edit-forms)/sale-correction/[id].tsx`, `components/sales/price-correction/usePriceCorrectionForm.ts`, `components/utang/credit-guardrails/OverrideReasonModal.tsx`, and `components/inventory/ledger/LogTransactionForm.tsx` all pick up biometrics with no diff. If typecheck flags any of them, the signature drifted — fix the provider, not the callers.

- [ ] **Step 6: Commit**

```bash
git add components/auth/OwnerPinGuardProvider.tsx tests/useOwnerPinGuard.test.tsx
git commit -m "feat: allow biometrics to substitute for the owner PIN"
```

---

### Task 6: The launch-lock policy and the lock screen

The launch lock is two pieces, deliberately kept apart. `lib/auth/appLock.ts` holds the resume decision as a pure function with no imports, so the five-minute boundary and the re-lock loop guard can be unit tested without React, `AppState`, or SQLite. `components/auth/AppLockGate.tsx` holds everything else: the phase machine, the automatic prompt, and the PIN fallback.

**Files:**

- Create: `lib/auth/appLock.ts`
- Create: `components/auth/AppLockGate.tsx`
- Create: `tests/appLockGate.test.tsx`

**Interfaces:**

- Consumes: `authenticateOwner(reason)` and `getBiometricCapability()` (Task 1); `biometrics.reason_unlock`, `biometrics.lock_title`, `biometrics.lock_subtitle`, `biometrics.lock_retry`, `biometrics.lock_use_pin` (Task 2); `'app_launch_lock_enabled'` and `'biometric_unlock_enabled'` (Task 3); `isAppUnlocked` and `markUnlocked` (Task 4). Nothing from Task 5 — the lock screen renders `OwnerPinModal` directly rather than going through `runWithPinGuard`, because the guard assumes a cancellable action and the lock has no cancel.
- Produces:
  - `APP_LOCK_GRACE_MS: number` — exactly `300_000`
  - `shouldRelockOnResume(lastBackgroundedAt: number | null, now: number, promptActive: boolean): boolean`
  - `AppLockGate: FC<{ isReady: boolean; children: ReactNode }>`

  Task 7 imports all three: the first two plus `isBiometricPromptActive()` for the `AppState` handler, and `AppLockGate` to wrap the tree.

Five design decisions are settled here, because each one is a place where the obvious implementation is wrong.

**The locked phase keeps its children mounted.** Rendering the lock _instead of_ children would unmount `<Stack>`, and remounting it on unlock resets the navigator to its initial route. An owner who steps away mid-sale for six minutes would come back to an empty cart. So the locked phase renders `{children}` plus an opaque full-screen overlay above them. The overlay and the children commit in the same render, so there is no frame in which protected content is visible.

**Only the resolving phase hides children, and only once `isReady` is true.** That is the exact window the spec names: "Between `isReady` turning true and the flag read resolving." While `isReady` is still false the gate renders children untouched, preserving today's cold-start behaviour — the database is not up yet, so there is nothing to protect, and blanking the app for the whole of database initialisation would be a visible regression for every user including those with the lock off.

**The prompt-active check is a parameter, not a branch in the caller.** The spec puts it inside the `AppState` handler. Passing it as `shouldRelockOnResume`'s third argument instead keeps the entire resume decision in one pure, testable place, which matters because Task 7 (the `app/_layout.tsx` wiring) has no automated test. Deviation 2 already replaced the spec's `isAuthInFlight` ref with the module-scoped flag behind `isBiometricPromptActive()`.

**The flag read fails open.** If `getAppSetting` or `isOwnerPinConfigured` throws, the gate becomes inert. This is the same reasoning the spec applies to a missing PIN: a lock the owner cannot get past is worse than no lock. It also costs nothing against the actual threat, since a thief holding the phone has no way to make a local SQLite read throw, and a genuinely broken database already routes to `DatabaseErrorScreen` before `isReady` is ever true.

**The gate reads two settings keys at two different times.** `app_launch_lock_enabled` is read once, at resolution, to decide whether the lock is armed for the session. `biometric_unlock_enabled` is read at each attempt, to decide whether to prompt at all. The two toggles are independent (see Resolved ambiguities), so "lock on, biometrics off" is a legitimate configuration that must go straight to the PIN.

- [ ] **Step 1: Write the failing test for the resume policy**

Create `tests/appLockGate.test.tsx` with the pure-policy block only. The component block arrives in Step 5.

```tsx
import { APP_LOCK_GRACE_MS, shouldRelockOnResume } from '@/lib/auth/appLock';

describe('shouldRelockOnResume', () => {
  const away = 1_700_000_000_000;

  it('exposes a five-minute grace window', () => {
    expect(APP_LOCK_GRACE_MS).toBe(300_000);
  });

  it('does not relock when the app was never backgrounded', () => {
    expect(shouldRelockOnResume(null, away + 999_999, false)).toBe(false);
  });

  it('does not relock after 299 seconds away', () => {
    expect(shouldRelockOnResume(away, away + 299_000, false)).toBe(false);
  });

  it('does not relock at exactly 300 seconds away', () => {
    expect(shouldRelockOnResume(away, away + 300_000, false)).toBe(false);
  });

  it('relocks one millisecond past the grace window', () => {
    expect(shouldRelockOnResume(away, away + 300_001, false)).toBe(true);
  });

  it('relocks after 301 seconds away', () => {
    expect(shouldRelockOnResume(away, away + 301_000, false)).toBe(true);
  });

  it('does not relock while a biometric prompt is on screen', () => {
    expect(shouldRelockOnResume(away, away + 900_000, true)).toBe(false);
  });

  it('does not relock when the clock has gone backwards', () => {
    expect(shouldRelockOnResume(away, away - 900_000, false)).toBe(false);
  });
});
```

The exact-boundary and one-millisecond-past cases pin the comparison to a strict `>`. Write them both; a plain `>=` passes seven of these eight tests.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest tests/appLockGate.test.tsx`
Expected: FAIL, `Cannot find module '@/lib/auth/appLock'`. All eight cases fail on the missing module, not on assertions.

- [ ] **Step 3: Write the resume policy**

Create `lib/auth/appLock.ts`:

```ts
/**
 * Resume policy for the optional app-launch lock.
 *
 * Deliberately import-free. The grace boundary and the re-lock loop guard are
 * the two places this feature is most likely to break, and a pure module lets
 * both be tested without React, AppState, or SQLite.
 */

export const APP_LOCK_GRACE_MS = 300_000;

export const shouldRelockOnResume = (
  lastBackgroundedAt: number | null,
  now: number,
  promptActive: boolean,
): boolean => {
  // A biometric prompt backgrounds the app on some Android skins. Relocking on
  // the way back would re-fire the prompt, which backgrounds the app again.
  if (promptActive) return false;

  // Nothing recorded means the app has not been away since it was unlocked.
  if (lastBackgroundedAt === null) return false;

  // Strict `>`: exactly five minutes is still inside the grace window. A
  // negative difference (clock moved backwards) also lands on false.
  return now - lastBackgroundedAt > APP_LOCK_GRACE_MS;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm jest tests/appLockGate.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the failing tests for the lock screen**

Replace line 1 of `tests/appLockGate.test.tsx` (the single `import` of the policy module) with this import block. The `flags` record behind a key-switching `getAppSetting` implementation is what lets one test move the launch-lock toggle and another move the biometric toggle without either fighting the shared `beforeEach`.

```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { AppLockGate } from '@/components/auth/AppLockGate';
import { APP_LOCK_GRACE_MS, shouldRelockOnResume } from '@/lib/auth/appLock';
import * as authDb from '@/database/auth';
import * as settingsDb from '@/database/settings';
import * as biometrics from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { initI18n } from '@/lib/i18n';
```

Then append this second `describe` after the `shouldRelockOnResume` block closes.

```tsx
describe('AppLockGate', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let flags: Record<string, string | null>;

  const Child = () => <Text testID="protected-child">Sales</Text>;

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    flags = {
      app_launch_lock_enabled: '1',
      biometric_unlock_enabled: '1',
    };
    useAuthStore.setState({
      isAppUnlocked: false,
      lastBackgroundedAt: null,
      isPinConfigured: true,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    jest.clearAllMocks();
    // Installed after clearAllMocks so the implementations survive it.
    jest
      .spyOn(settingsDb, 'getAppSetting')
      .mockImplementation(async (key) => flags[key] ?? null);
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders children and stays inert when the launch lock is off', async () => {
    flags.app_launch_lock_enabled = '0';

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('protected-child')).toBeTruthy();
    });

    expect(queryByTestId('app-lock-overlay')).toBeNull();
    expect(queryByTestId('app-lock-flash')).toBeNull();
    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it('hides children behind an opaque view while the flag read is in flight', async () => {
    let release: (value: string | null) => void = () => {};
    jest.spyOn(settingsDb, 'getAppSetting').mockImplementation(
      () =>
        new Promise<string | null>((resolve) => {
          release = resolve;
        }),
    );

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    expect(queryByTestId('app-lock-flash')).toBeTruthy();
    expect(queryByTestId('protected-child')).toBeNull();

    await act(async () => {
      release('0');
    });

    await waitFor(() => {
      expect(queryByTestId('protected-child')).toBeTruthy();
    });
    expect(queryByTestId('app-lock-flash')).toBeNull();
  });

  it('leaves children alone while the database is not ready', async () => {
    const { queryByTestId } = await render(
      <AppLockGate isReady={false}>
        <Child />
      </AppLockGate>,
    );

    expect(queryByTestId('protected-child')).toBeTruthy();
    expect(queryByTestId('app-lock-flash')).toBeNull();
    expect(queryByTestId('app-lock-overlay')).toBeNull();
    expect(settingsDb.getAppSetting).not.toHaveBeenCalled();
  });

  it('stays inert when no owner PIN is configured', async () => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('protected-child')).toBeTruthy();
    });

    expect(queryByTestId('app-lock-overlay')).toBeNull();
    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it('fails open when reading the launch-lock flag throws', async () => {
    jest
      .spyOn(settingsDb, 'getAppSetting')
      .mockRejectedValue(new Error('no such table: app_settings'));

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('protected-child')).toBeTruthy();
    });

    expect(queryByTestId('app-lock-overlay')).toBeNull();
    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it('fires one prompt with a non-empty reason and keeps children mounted', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('failed');

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });

    const reason = jest.mocked(biometrics.authenticateOwner).mock.calls[0]?.[0];
    expect(typeof reason).toBe('string');
    expect(reason).not.toBe('');

    // The navigator must survive the lock. Unmounting it would reset the
    // route stack and drop in-progress state such as an open cart.
    expect(queryByTestId('protected-child')).toBeTruthy();
    expect(queryByTestId('app-lock-overlay')).toBeTruthy();
  });

  it('reveals the app on biometric success', async () => {
    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('app-lock-overlay')).toBeNull();
    });

    expect(queryByTestId('protected-child')).toBeTruthy();
    expect(useAuthStore.getState().isAppUnlocked).toBe(true);
  });

  it('keeps the lock up when the attempt fails', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('failed');

    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('app-lock-retry')).toBeTruthy();
    });

    expect(useAuthStore.getState().isAppUnlocked).toBe(false);
  });

  it('prompts again when retry is pressed', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('failed');

    const { getByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByTestId('app-lock-retry'));

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(2);
    });
  });

  it('goes straight to the PIN modal when the biometric toggle is off', async () => {
    flags.biometric_unlock_enabled = '0';

    const { queryByText, queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByText('Submit')).toBeTruthy();
    });

    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
    expect(queryByTestId('app-lock-overlay')).toBeTruthy();
  });

  it('goes straight to the PIN modal when nothing is enrolled', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: false,
      label: 'none',
    });

    const { queryByText } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByText('Submit')).toBeTruthy();
    });

    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it.each(['fallback', 'unavailable'] as const)(
    'opens the PIN modal when the result is %s',
    async (result) => {
      jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue(result);

      const { queryByText } = await render(
        <AppLockGate isReady>
          <Child />
        </AppLockGate>,
      );

      await waitFor(() => {
        expect(queryByText('Submit')).toBeTruthy();
      });

      expect(useAuthStore.getState().isAppUnlocked).toBe(false);
    },
  );

  it('returns to the lock screen when the PIN modal is cancelled', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('fallback');

    const { getByText, queryByText, queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByText('Submit')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      expect(queryByText('Submit')).toBeNull();
    });

    // Cancelling the PIN escapes to the lock screen, never into the app.
    expect(queryByTestId('app-lock-overlay')).toBeTruthy();
    expect(queryByTestId('app-lock-retry')).toBeTruthy();
    expect(useAuthStore.getState().isAppUnlocked).toBe(false);
  });

  it('unlocks when the owner enters the correct PIN', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('fallback');
    jest.spyOn(authDb, 'verifyOwnerPin').mockResolvedValue(true);

    const { getByText, queryByText, queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByText('Submit')).toBeTruthy();
    });

    for (const digit of ['1', '2', '3', '4']) {
      fireEvent.press(getByText(digit));
    }
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(queryByTestId('app-lock-overlay')).toBeNull();
    });

    expect(useAuthStore.getState().isAppUnlocked).toBe(true);
    expect(queryByTestId('protected-child')).toBeTruthy();
  });

  it('re-arms and prompts once more after requireUnlock', async () => {
    const { queryByTestId } = await render(
      <AppLockGate isReady>
        <Child />
      </AppLockGate>,
    );

    await waitFor(() => {
      expect(queryByTestId('app-lock-overlay')).toBeNull();
    });

    await act(async () => {
      useAuthStore.getState().requireUnlock();
    });

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(2);
    });
  });
});
```

- [ ] **Step 6: Run the tests to verify the new ones fail**

Run: `pnpm jest tests/appLockGate.test.tsx`

Expected: the eight `shouldRelockOnResume` cases still PASS. Every `AppLockGate` case FAILS with `Cannot find module '@/components/auth/AppLockGate'`.

- [ ] **Step 7: Write the gate**

Create `components/auth/AppLockGate.tsx` with exactly this content.

```tsx
import { useCallback, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { StyledText } from '@/components/elements/StyledText';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
} from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  isReady: boolean;
  children: ReactNode;
}

/**
 * `pending` - the launch-lock flag has not been read yet.
 * `armed`   - the lock is on; the tree stays covered until markUnlocked() runs.
 * `inert`   - the lock is off for this session and never engages again.
 */
type Resolution = 'pending' | 'armed' | 'inert';

export const AppLockGate: FC<Props> = ({ isReady, children }) => {
  const { t } = useTranslation('settings');
  const isAppUnlocked = useAuthStore((state) => state.isAppUnlocked);
  const markUnlocked = useAuthStore((state) => state.markUnlocked);
  const [resolution, setResolution] = useState<Resolution>('pending');
  const [showPin, setShowPin] = useState(false);
  const autoPromptedRef = useRef(false);

  // Resolve the lock once per app session. A launch lock with no owner PIN
  // would have no fallback, so "no PIN" resolves the same way as "flag off".
  useEffect(() => {
    if (!isReady || resolution !== 'pending') return;
    let isMounted = true;
    Promise.all([
      getAppSetting('app_launch_lock_enabled'),
      isOwnerPinConfigured(),
    ])
      .then(([flag, hasPin]) => {
        if (!isMounted) return;
        if (flag === '1' && hasPin) {
          setResolution('armed');
        } else {
          setResolution('inert');
          markUnlocked();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        // Fail open. A lock the owner cannot get past is worse than no lock,
        // and a database broken enough to throw here has already routed to
        // DatabaseErrorScreen before isReady ever turned true.
        setResolution('inert');
        markUnlocked();
      });
    return () => {
      isMounted = false;
    };
  }, [isReady, resolution, markUnlocked]);

  const phase: 'resolving' | 'locked' | 'open' =
    resolution === 'pending'
      ? isReady
        ? 'resolving'
        : 'open'
      : resolution === 'inert' || isAppUnlocked
        ? 'open'
        : 'locked';

  const attempt = useCallback(async () => {
    // Read the biometric toggle on every attempt, not once at resolution:
    // "lock on, biometrics off" must go straight to the PIN.
    const [flag, capability] = await Promise.all([
      getAppSetting('biometric_unlock_enabled').catch(() => null),
      getBiometricCapability(),
    ]);

    if (flag !== '1' || !capability.available || !capability.enrolled) {
      setShowPin(true);
      return;
    }

    const result = await authenticateOwner(t('biometrics.reason_unlock'));

    if (result === 'success') {
      markUnlocked();
      return;
    }

    if (result === 'fallback' || result === 'unavailable') {
      setShowPin(true);
      return;
    }

    // 'cancelled' and 'failed' leave the lock screen up with its retry button.
  }, [markUnlocked, t]);

  // Prompt once per lock, then hand control to the retry button.
  useEffect(() => {
    if (phase !== 'locked') {
      autoPromptedRef.current = false;
      return;
    }
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void attempt();
  }, [phase, attempt]);

  if (phase === 'resolving') {
    return <View testID="app-lock-flash" style={styles.flash} />;
  }

  return (
    <>
      {children}
      {phase === 'locked' ? (
        <View testID="app-lock-overlay" style={styles.overlay}>
          <StyledText variant="semibold" style={styles.title}>
            {t('biometrics.lock_title')}
          </StyledText>
          <StyledText variant="regular" style={styles.subtitle}>
            {t('biometrics.lock_subtitle')}
          </StyledText>
          <TouchableOpacity
            testID="app-lock-retry"
            style={styles.primaryBtn}
            onPress={() => void attempt()}
          >
            <StyledText variant="semibold" style={styles.primaryText}>
              {t('biometrics.lock_retry')}
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            testID="app-lock-use-pin"
            style={styles.secondaryBtn}
            onPress={() => setShowPin(true)}
          >
            <StyledText variant="semibold" style={styles.secondaryText}>
              {t('biometrics.lock_use_pin')}
            </StyledText>
          </TouchableOpacity>
          <OwnerPinModal
            visible={showPin}
            title={t('biometrics.lock_title')}
            onSuccess={() => {
              setShowPin(false);
              markUnlocked();
            }}
            onCancel={() => setShowPin(false)}
          />
          />
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F6F2',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F6F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: { fontSize: 22, color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#4B5563', marginBottom: 32, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryText: { color: '#374151', fontSize: 15 },
});
```

- [ ] **Step 8: Run the gate tests to verify they pass**

Run: `pnpm jest tests/appLockGate.test.tsx`
Expected: PASS, 24 tests (8 policy + 16 gate).

- [ ] **Step 9: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, all suites green.

- [ ] **Step 10: Commit**

```bash
git add lib/auth/appLock.ts components/auth/AppLockGate.tsx tests/appLockGate.test.tsx
git commit -m "feat: add launch lock policy and full-screen lock gate"
```

---

### Task 7: Wire the lock gate and resume detection into the root layout

Mount `AppLockGate` so it covers every route (including modals) and extend the existing `AppState` listener so it records the background timestamp and re-arms the lock when the owner has been away more than five minutes.

**Files:**

- Modify: `app/_layout.tsx` (imports after `:27`, store reads after `:65`, listener `useEffect` `:111-124`, JSX `:161-178`)

**Interfaces:**

- Consumes: `AppLockGate` (Task 6); `markBackgrounded`, `requireUnlock` (Task 4); `isBiometricPromptActive` (Task 1); `shouldRelockOnResume` (Task 6).
- Produces: no new exports. The change is purely structural — the same child tree now lives inside `AppLockGate`.

Two decisions shape this task.

**Why `AppLockGate` wraps `<Stack>` inside `OwnerPinGuardProvider`.** The spec says the lock covers every route including modals. The gate achieves that by rendering an overlay above `children` (the route tree), not by conditionally mounting them. `OwnerPinGuardProvider` must be its ancestor so the PIN fallback inside the lock screen can open `OwnerPinModal` through the provider's context. The resulting order is: `OwnerPinGuardProvider` → `AppLockGate` → `<Stack>`.

**The `AppState` listener is extended, not replaced.** The file already has one `AppState.addEventListener('change', ...)` subscription at `:115`. Adding a second independent subscription risks firing out of order. Instead, the existing handler gains two branches: `background`/`inactive` → `markBackgrounded()`; `active` → check the grace window. The existing `consumeQueue(schedulerInputs)` call on `active` stays in place after the new branches.

- [ ] **Step 1: Extend the imports**

After the existing `OwnerPinGuardProvider` import at `:27`, insert:

```ts
import { AppLockGate } from '@/components/auth/AppLockGate';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBiometricPromptActive } from '@/lib/auth/biometrics';
import { shouldRelockOnResume } from '@/lib/auth/appLock';
```

- [ ] **Step 2: Read the store actions inside the component**

Inside `RootLayout`, below the existing `const schedulerInputs = useSchedulerInputs();` line (`:65`), add:

```ts
const markBackgrounded = useAuthStore((s) => s.markBackgrounded);
const requireUnlock = useAuthStore((s) => s.requireUnlock);
```

- [ ] **Step 3: Extend the AppState listener**

Replace `app/_layout.tsx:111-124` (the `useEffect` that registers the `AppState` listener) with:

```ts
useEffect(() => {
  if (!fontsLoaded || !i18nReady || !dbReady || dbInitError) return;
  void runStartupChecks(schedulerInputs);
  const unsubCounter = subscribeCounter(schedulerInputs);
  const subAppState = AppState.addEventListener('change', (state) => {
    if (state === 'background' || state === 'inactive') {
      markBackgrounded();
    } else if (state === 'active') {
      const { lastBackgroundedAt } = useAuthStore.getState();
      if (
        shouldRelockOnResume(
          lastBackgroundedAt,
          Date.now(),
          isBiometricPromptActive(),
        )
      ) {
        requireUnlock();
      }
      void consumeQueue(schedulerInputs);
    }
  });
  return () => {
    unsubCounter();
    subAppState.remove();
  };
}, [
  fontsLoaded,
  i18nReady,
  dbReady,
  dbInitError,
  schedulerInputs,
  markBackgrounded,
  requireUnlock,
]);
```

`useAuthStore.getState()` is called imperatively inside the event handler, not as a hook.

- [ ] **Step 4: Mount AppLockGate in the JSX**

Replace `app/_layout.tsx:161-178` (the `<OwnerPinGuardProvider>` and its children) with:

```tsx
<OwnerPinGuardProvider isReady={dbReady}>
  <AppLockGate isReady={dbReady}>
    <View style={{ flex: 1, backgroundColor: '#F7F6F2' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F7F6F2' },
        }}
      />
      {fontsLoaded && i18nReady && !bannerDismissed ? (
        <CloudNewerBanner
          onRestorePress={handleBannerRestore}
          onDismiss={handleBannerDismiss}
        />
      ) : null}
    </View>
    <Toast />
    <GlobalModal />
  </AppLockGate>
</OwnerPinGuardProvider>
```

- [ ] **Step 5: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, all suites green. The wiring has no dedicated unit test — correctness is verified through typecheck plus manual QA at acceptance.

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: mount AppLockGate and extend AppState listener for resume detection"
```

---

### Task 8: Gate the destructive backup actions

Three backup entry points currently run without any owner authorization. Each gets a `runWithPinGuard` call with an action-specific reason string from the `biometrics.reason_*` keys added in Task 2.

**Files:**

- Modify: `components/settings/backup/LocalSnapshotsSection.tsx` (imports `:10-24`, `handleConfirmRestore` `:116-125`)
- Modify: `components/settings/backup/CloudBackupSection.tsx` (imports `:20-40`, `handleUnlink` `:228-234`)
- Create: `tests/backupRestoreGate.test.tsx`

**Interfaces:**

- Consumes: `runWithPinGuard` via `useOwnerPinGuard()` (unchanged hook from Task 5); `biometrics.reason_restore` and `biometrics.reason_unlink` (Task 2).
- Produces: no new exports.

`handleBackupNow` in `CloudBackupSection.tsx` is **not gated**. Creating a backup is non-destructive. The spec names it explicitly in §Backup and restore gating, and acceptance criterion 9 tests for it.

Both components use `useTranslation()` without a namespace argument, so they reference settings keys as `t('settings:biometrics.reason_restore')` rather than the bare `t('biometrics.reason_restore')` form used by components that call `useTranslation('settings')`.

- [ ] **Step 1: Write the failing tests**

Create `tests/backupRestoreGate.test.tsx`.

```tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { LocalSnapshotsSection } from '@/components/settings/backup/LocalSnapshotsSection';
import { CloudBackupSection } from '@/components/settings/backup/CloudBackupSection';
import * as ownerPinGuardHook from '@/hooks/useOwnerPinGuard';
import * as authDb from '@/database/auth';
import * as settingsDb from '@/database/settings';
import * as biometrics from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { initI18n } from '@/lib/i18n';

jest.mock('@/hooks/useBackup', () => ({
  useLocalSnapshots: () => ({ data: [], isLoading: false }),
  useCloudBackups: () => ({ data: [] }),
  useRestoreFromSnapshot: () => ({ mutateAsync: jest.fn() }),
  useRestoreFromCloud: () => ({ mutateAsync: jest.fn() }),
  useBackupNow: () => ({ mutateAsync: jest.fn() }),
  useDriveLinkStatus: () => ({ data: 'LINKED' }),
  useGoogleAuthRequest: () => [null, null, jest.fn()],
  useLinkGoogleDrive: () => ({ mutateAsync: jest.fn() }),
  useUnlinkGoogleDrive: () => ({ mutateAsync: jest.fn() }),
  useSchedulerInputs: () => ({}),
}));

jest.mock('@/stores', () => ({
  useToastStore: () => ({ addToast: jest.fn() }),
}));

describe('backup restore gates', () => {
  let runWithPinGuard: jest.Mock;

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    runWithPinGuard = jest.fn();
    jest.spyOn(ownerPinGuardHook, 'useOwnerPinGuard').mockReturnValue({
      runWithPinGuard,
    } as ReturnType<typeof ownerPinGuardHook.useOwnerPinGuard>);
    useAuthStore.setState({
      isPinConfigured: true,
      failedAttempts: 0,
      lockoutUntil: null,
      isAppUnlocked: true,
      lastBackgroundedAt: null,
    });
    jest.clearAllMocks();
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('0');
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
  });

  it('gates LocalSnapshotsSection restore behind runWithPinGuard', async () => {
    const { getByText } = render(<LocalSnapshotsSection />);

    fireEvent.press(getByText(/Restore/i));

    await waitFor(() => {
      expect(runWithPinGuard).toHaveBeenCalledTimes(1);
    });

    const call = runWithPinGuard.mock.calls[0]?.[0] as {
      actionDescription?: string;
    };
    expect(call.actionDescription).toBeTruthy();
    expect(call.actionDescription).not.toContain('reason_restore');
  });

  it('does not gate LocalSnapshotsSection backup now', async () => {
    const { getByText } = render(<LocalSnapshotsSection />);
    fireEvent.press(getByText(/Backup now/i));
    await waitFor(() => {}, { timeout: 100 });
    expect(runWithPinGuard).not.toHaveBeenCalled();
  });

  it('gates CloudBackupSection unlink behind runWithPinGuard', async () => {
    const { getByText } = render(<CloudBackupSection />);

    fireEvent.press(getByText(/Unlink/i));

    await waitFor(() => {
      expect(runWithPinGuard).toHaveBeenCalledTimes(1);
    });

    const call = runWithPinGuard.mock.calls[0]?.[0] as {
      actionDescription?: string;
    };
    expect(call.actionDescription).toBeTruthy();
    expect(call.actionDescription).not.toContain('reason_unlink');
  });

  it('does not gate CloudBackupSection backup now', async () => {
    const { getByText } = render(<CloudBackupSection />);
    fireEvent.press(getByText(/Backup now/i));
    await waitFor(() => {}, { timeout: 100 });
    expect(runWithPinGuard).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm jest tests/backupRestoreGate.test.tsx`
Expected: FAIL. The restore and unlink tests fail on `expect(runWithPinGuard).toHaveBeenCalledTimes(1)`.

- [ ] **Step 3: Gate `handleConfirmRestore` in LocalSnapshotsSection**

In `components/settings/backup/LocalSnapshotsSection.tsx`, add to the import block (after `:23`):

```tsx
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
```

Inside the component function, below the existing `const { t } = useTranslation();` call, add:

```tsx
const { runWithPinGuard } = useOwnerPinGuard();
```

Replace `handleConfirmRestore` (`:116-125`) with:

```tsx
const handleConfirmRestore = () => {
  void runWithPinGuard({
    title: t('settings:biometrics.lock_title'),
    actionDescription: t('settings:biometrics.reason_restore'),
    onApproved: async () => {
      if (!pickerSelection) return;
      if ('path' in pickerSelection) {
        await restore.mutateAsync(pickerSelection);
      } else {
        await restoreCloud.mutateAsync(pickerSelection.fileId);
      }
      setPickerOpen(false);
      setPickerSelection(null);
    },
  });
};
```

The function is no longer `async` — `runWithPinGuard` is fire-and-forget from the call site; async work lives in `onApproved`.

- [ ] **Step 4: Gate `handleUnlink` in CloudBackupSection**

In `components/settings/backup/CloudBackupSection.tsx`, add after the last existing import:

```tsx
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
```

Inside the component function, below the existing `const { t } = useTranslation();` call, add:

```tsx
const { runWithPinGuard } = useOwnerPinGuard();
```

Replace `handleUnlink` (`:228-234`) with:

```tsx
const handleUnlink = () => {
  void runWithPinGuard({
    title: t('settings:biometrics.lock_title'),
    actionDescription: t('settings:biometrics.reason_unlink'),
    onApproved: async () => {
      try {
        await unlink.mutateAsync();
      } catch {
        // Toast surfaced by useUnlinkGoogleDrive.
      }
    },
  });
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm jest tests/backupRestoreGate.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, all suites green.

- [ ] **Step 7: Commit**

```bash
git add components/settings/backup/LocalSnapshotsSection.tsx \
        components/settings/backup/CloudBackupSection.tsx \
        tests/backupRestoreGate.test.tsx
git commit -m "feat: gate restore and unlink behind the owner PIN guard"
```

---

### Task 9: Settings UI — the two toggle rows

Two new rows in `OwnerPinSettingsCard`: one for biometric unlock, one for the launch lock. Each is a `Switch` bound to its `app_settings` key via `useAppSetting` / `useSetAppSetting`. Enabling biometrics requires a one-time verification preceded by the risk confirmation modal.

**Files:**

- Modify: `components/settings/OwnerPinSettingsCard.tsx`
- Create: `tests/ownerPinBiometricToggles.test.tsx`

**Interfaces:**

- Consumes: `getBiometricCapability`, `authenticateOwner` (Task 1); all `biometrics.*` locale keys (Task 2); `biometric_unlock_enabled`, `app_launch_lock_enabled` (Task 3); `useAppSetting`, `useSetAppSetting` from `@/hooks/useAppSetting`.
- Produces: no new exports.

Three rules govern toggle disabled states:

1. **`biometric_unlock_enabled`** is disabled when: no PIN configured, `capability.available === false`, or `capability.enrolled === false`.
2. **`app_launch_lock_enabled`** is disabled only when no PIN is configured.
3. The two toggles are **fully independent**. Turning off biometrics does not touch the launch lock.

Turning biometrics **on** requires: (a) show the risk confirmation modal, (b) only if confirmed, call `authenticateOwner()`, (c) only if that succeeds, persist `'1'`. Turning biometrics **off** requires no confirmation.

- [ ] **Step 1: Write the failing tests**

Create `tests/ownerPinBiometricToggles.test.tsx`.

```tsx
import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { OwnerPinSettingsCard } from '@/components/settings/OwnerPinSettingsCard';
import * as authDb from '@/database/auth';
import * as settingsDb from '@/database/settings';
import * as biometrics from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { initI18n } from '@/lib/i18n';

jest.mock('@/hooks/useAppSetting', () => ({
  useAppSetting: (key: string) => {
    const { useEffect, useState } = require('react');
    const [val, setVal] = useState<string | null>(null);
    useEffect(() => {
      require('@/database/settings')
        .getAppSetting(key)
        .then(setVal)
        .catch(() => setVal(null));
    }, [key]);
    return val;
  },
  useSetAppSetting: (key: string) => async (value: string) => {
    await require('@/database/settings').setAppSetting(key, value);
  },
}));

describe('OwnerPinSettingsCard biometric toggles', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isPinConfigured: true,
      failedAttempts: 0,
      lockoutUntil: null,
      isAppUnlocked: true,
      lastBackgroundedAt: null,
    });
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('0');
    jest.spyOn(settingsDb, 'setAppSetting').mockResolvedValue(undefined);
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
  });

  it('disables the biometric toggle when no PIN is configured', async () => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);
    useAuthStore.setState({ isPinConfigured: false });

    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(true);
    });
  });

  it('disables the biometric toggle when hardware is absent', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: false,
      enrolled: false,
      label: 'none',
    });

    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(true);
    });
  });

  it('disables the biometric toggle when hardware is present but nothing is enrolled', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: false,
      label: 'fingerprint',
    });

    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(true);
    });
  });

  it('shows the risk confirmation before enabling biometrics', async () => {
    const { getByTestId, queryByText } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });

    await waitFor(() => {
      expect(queryByText(/Anyone enrolled/i)).toBeTruthy();
    });

    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it('calls authenticateOwner after the risk confirmation is accepted', async () => {
    const { getByTestId, getByText } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });
  });

  it('persists the flag only when biometric verification succeeds', async () => {
    const { getByTestId, getByText } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'biometric_unlock_enabled',
        '1',
      );
    });
  });

  it('leaves the toggle off when the verification is cancelled', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('cancelled');

    const { getByTestId, getByText } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });

    expect(settingsDb.setAppSetting).not.toHaveBeenCalledWith(
      'biometric_unlock_enabled',
      '1',
    );
  });

  it('disables the launch lock toggle when no PIN is configured', async () => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);
    useAuthStore.setState({ isPinConfigured: false });

    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('launch-lock-toggle').props.disabled).toBe(true);
    });
  });

  it('saves the launch lock flag when toggled on', async () => {
    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('launch-lock-toggle').props.disabled).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('launch-lock-toggle'), 'valueChange', true);
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'app_launch_lock_enabled',
        '1',
      );
    });
  });

  it('turning off biometrics does not turn off the launch lock', async () => {
    jest.spyOn(settingsDb, 'getAppSetting').mockImplementation(async (key) => {
      if (key === 'biometric_unlock_enabled') return '1';
      if (key === 'app_launch_lock_enabled') return '1';
      return '0';
    });

    const { getByTestId } = render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props.value).toBe(true);
      expect(getByTestId('launch-lock-toggle').props.value).toBe(true);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', false);
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'biometric_unlock_enabled',
        '0',
      );
    });

    expect(settingsDb.setAppSetting).not.toHaveBeenCalledWith(
      'app_launch_lock_enabled',
      '0',
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm jest tests/ownerPinBiometricToggles.test.tsx`
Expected: FAIL. The `testID`s `biometric-toggle` and `launch-lock-toggle` do not exist yet.

- [ ] **Step 3: Add imports to OwnerPinSettingsCard**

In `components/settings/OwnerPinSettingsCard.tsx`, replace `:2` (the `View, TextInput, TouchableOpacity, StyleSheet` import) with:

```tsx
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
```

Then add the following import lines after `:6` (the `useAuthStore` import):

```tsx
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import {
  authenticateOwner,
  getBiometricCapability,
  type BiometricCapability,
} from '@/lib/auth/biometrics';
```

- [ ] **Step 4: Add state and handlers inside the component**

Inside `OwnerPinSettingsCard`, below the existing `const [showRecovery, setShowRecovery] = useState(false);` line, add:

```tsx
const biometricRaw = useAppSetting('biometric_unlock_enabled');
const biometricEnabled = biometricRaw === '1';
const setBiometricEnabled = useSetAppSetting('biometric_unlock_enabled');
const launchLockRaw = useAppSetting('app_launch_lock_enabled');
const launchLockEnabled = launchLockRaw === '1';
const setLaunchLockEnabled = useSetAppSetting('app_launch_lock_enabled');
const [capability, setCapability] = useState<BiometricCapability>({
  available: false,
  enrolled: false,
  label: 'none',
});
const [showRiskConfirm, setShowRiskConfirm] = useState(false);
```

Extend the existing `useEffect` at `:19-27` to also fetch capability:

```tsx
useEffect(() => {
  isOwnerPinConfigured().then(setIsPinConfigured);
  getBiometricCapability().then(setCapability);
  getAppSetting('owner_pin_discount_threshold_pesos').then((v) => {
    if (v) setPesosLimit(v);
  });
  getAppSetting('owner_pin_discount_threshold_percent').then((v) => {
    if (v) setPercentLimit(v);
  });
}, [setIsPinConfigured]);
```

Add the handlers after the existing `handleSaveThresholds`:

```tsx
const handleBiometricToggle = async (next: boolean) => {
  if (!next) {
    await setBiometricEnabled('0');
    return;
  }
  setShowRiskConfirm(true);
};

const handleRiskConfirmed = async () => {
  setShowRiskConfirm(false);
  const result = await authenticateOwner(t('biometrics.reason_default'));
  if (result === 'success') {
    await setBiometricEnabled('1');
  }
};

const handleLaunchLockToggle = async (next: boolean) => {
  await setLaunchLockEnabled(next ? '1' : '0');
};
```

Compute disabled reasons:

```tsx
const biometricDisabledReason: string | null = !isPinConfigured
  ? t('biometrics.requires_pin')
  : !capability.available
    ? t('biometrics.not_available')
    : !capability.enrolled
      ? t('biometrics.not_enrolled')
      : null;

const launchLockDisabledReason: string | null = !isPinConfigured
  ? t('biometrics.requires_pin')
  : null;
```

- [ ] **Step 5: Insert the two toggle rows into the JSX**

Insert after the `</View>` closing the existing `btnRow` at `:87` and before the `<View style={styles.divider} />` at `:89`:

```tsx
<View style={styles.divider} />

<View style={styles.toggleRow}>
  <View style={styles.toggleText}>
    <StyledText variant="semibold" style={styles.toggleTitle}>
      {t('biometrics.toggle_use_biometrics')}
    </StyledText>
    <StyledText variant="regular" style={styles.toggleSubtitle}>
      {biometricDisabledReason ?? t('biometrics.toggle_use_biometrics_help')}
    </StyledText>
  </View>
  <Switch
    testID="biometric-toggle"
    value={biometricEnabled}
    disabled={biometricDisabledReason !== null}
    onValueChange={(v) => { void handleBiometricToggle(v); }}
  />
</View>

<View style={styles.toggleRow}>
  <View style={styles.toggleText}>
    <StyledText variant="semibold" style={styles.toggleTitle}>
      {t('biometrics.toggle_launch_lock')}
    </StyledText>
    <StyledText variant="regular" style={styles.toggleSubtitle}>
      {launchLockDisabledReason ?? t('biometrics.toggle_launch_lock_help')}
    </StyledText>
  </View>
  <Switch
    testID="launch-lock-toggle"
    value={launchLockEnabled}
    disabled={launchLockDisabledReason !== null}
    onValueChange={(v) => { void handleLaunchLockToggle(v); }}
  />
</View>
```

The existing `<View style={styles.divider} />` at `:89` becomes the divider before the **Discount PIN Thresholds** section — no additional divider is needed there.

- [ ] **Step 6: Insert the risk confirmation modal into the JSX**

Place it alongside the existing `<OwnerPinSetupModal>` and `<OwnerPinRecoveryModal>` at the bottom of the return, just before the closing `</View>`:

```tsx
{
  showRiskConfirm ? (
    <View style={styles.riskOverlay}>
      <View style={styles.riskCard}>
        <StyledText variant="semibold" style={styles.riskTitle}>
          {t('biometrics.risk_title')}
        </StyledText>
        <StyledText variant="regular" style={styles.riskBody}>
          {t('biometrics.risk_body')}
        </StyledText>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            void handleRiskConfirmed();
          }}
        >
          <StyledText variant="semibold" style={styles.btnText}>
            {t('biometrics.risk_confirm')}
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 8 }]}
          onPress={() => setShowRiskConfirm(false)}
        >
          <StyledText variant="semibold" style={styles.secondaryBtnText}>
            {t('biometrics.risk_cancel')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;
}
```

- [ ] **Step 7: Add the new style entries**

Inside `StyleSheet.create({...})`, append after the existing `input` block:

```tsx
toggleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 12,
},
toggleText: { flex: 1, marginRight: 12 },
toggleTitle: { fontSize: 14, color: '#1F2937', marginBottom: 2 },
toggleSubtitle: { fontSize: 12, color: '#6B7280' },
riskOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  padding: 24,
},
riskCard: {
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 24,
},
riskTitle: { fontSize: 16, color: '#1F2937', marginBottom: 12 },
riskBody: { fontSize: 13, color: '#4B5563', marginBottom: 24, lineHeight: 20 },
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm jest tests/ownerPinBiometricToggles.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 9: Run the full verification**

Run: `pnpm verify`
Expected: `tsc` silent, all suites green.

- [ ] **Step 10: Commit**

```bash
git add components/settings/OwnerPinSettingsCard.tsx tests/ownerPinBiometricToggles.test.tsx
git commit -m "feat: add biometric and launch lock toggles to the owner PIN settings card"
```

---

### Task 10: Verify app.json and update the vault notes

The spec lists two vault note updates as required deliverables (acceptance criterion 11), and asks for a `faceIDPermission` string in `app.json`. Deviation 3 in the plan header records that both plugin blocks already carry the correct string — verify rather than write.

**Files:**

- Read: `app.json` (verify, no change expected)
- Modify: `obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md`
- Modify: `obsidian-vault/07-Planning/biometrics-implementation.md`

**Interfaces:**

- Consumes: nothing from earlier tasks (no code changes).
- Produces: two updated vault notes with no remaining claim that biometrics is out of scope.

Vault writes follow `obsidian-vault/AGENTS.md` write etiquette: read the existing note first, correct folder, never touch `.obsidian/`, no credentials, no auto-push.

- [ ] **Step 1: Verify app.json**

```bash
grep -A3 '"expo-local-authentication"' app.json
```

Expected output:

```json
"expo-local-authentication",
{
  "faceIDPermission": "Allow SariSari to approve owner actions like voids, refunds, and restores."
}
```

The current string matches the spec. No change is needed. If the string is absent or different, replace the plugin entry with the block above before continuing.

- [ ] **Step 2: Update the feature 11 vault note**

In `obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md`, replace the **Hindi Kasama sa Saklaw** section (`:28-33`) with:

```markdown
## Hindi Kasama sa Saklaw (Out of Scope) — Updated

- ~~Biometric unlock (ang telepono ng tindahan ay maaaring walang maaasahang biometrics; ang PIN ay sapat na).~~ **Scope change:** Implemented as opt-in biometric authentication in `docs/superpowers/specs/2026-08-19-biometric-owner-auth-design.md`. The PIN remains the fallback; biometrics are off by default and require a configured PIN.
- Per-user PINs. Single-owner model; ang tampok 16 (shift tracking) ang lugar kung saan idadagdag ang per-cashier attribution kung kinakailangan.
- Server-side PIN validation. Walang server (offline-first).
```

- [ ] **Step 3: Mark the planning note superseded**

Replace the entire content of `obsidian-vault/07-Planning/biometrics-implementation.md` with:

```markdown
# Biometrics Implementation

> **Status: Superseded**
>
> This planning note has been superseded by the accepted design spec at
> `docs/superpowers/specs/2026-08-19-biometric-owner-auth-design.md`
> and the implementation plan at
> `docs/superpowers/plans/2026-08-19-biometric-owner-auth.md`.
>
> The original request (fingerprint or face authentication) is implemented
> as described in those documents.
```

- [ ] **Step 4: Run pnpm verify to confirm no regressions**

Run: `pnpm verify`
Expected: `tsc` silent, all suites green. Vault files are `.md` and do not affect typecheck.

- [ ] **Step 5: Commit**

```bash
git add "obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md" \
        "obsidian-vault/07-Planning/biometrics-implementation.md"
git commit -m "docs: update vault notes — biometrics is no longer out of scope"
```

---

### Task 11: Final acceptance verification

Run every acceptance criterion from the spec in order and confirm each passes before declaring the feature complete.

**Files:**

- No file changes. This task is a checklist run.

**Interfaces:**

- Consumes: everything from Tasks 1-10.
- Produces: a confirmed `pnpm verify` pass and evidence that every criterion is met.

- [ ] **Step 1: Run the full suite one final time**

```bash
pnpm verify
```

Expected: `tsc` exits with code 0 (no output), `jest` reports all suites passing.

- [ ] **Step 2: Check each acceptance criterion against the test suite**

| #   | Criterion                                                                              | Test(s) that cover it                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Both toggles off → identical behaviour at every existing gate                          | All pre-existing `useOwnerPinGuard.test.tsx` cases pass; `beforeEach` mocks the flag to `'0'`.                                                                |
| 2   | Biometrics on → successful prompt at all 5 existing call sites + 3 backup entry points | `useOwnerPinGuard.test.tsx` → `runs the action without the PIN modal when biometrics succeed`; `backupRestoreGate.test.tsx` (guard called with `onApproved`). |
| 3   | Cancel aborts; every other failure falls through to PIN                                | `useOwnerPinGuard.test.tsx` → `aborts silently when the owner cancels` + `falls through to the PIN modal when the result is %s`.                              |
| 4   | No device state blocks an owner who knows the PIN                                      | `useOwnerPinGuard.test.tsx` → `falls through to the PIN modal` for `unavailable`; `appLockGate.test.tsx` → `unlocks when the owner enters the correct PIN`.   |
| 5   | Failed biometric attempts never increment PIN lockout; no biometric during lockout     | `useOwnerPinGuard.test.tsx` → `leaves the PIN failure counter untouched when biometrics fail` + `does not prompt while a PIN lockout is active`.              |
| 6   | Neither toggle enabled without PIN; biometrics requires verification + risk confirm    | `ownerPinBiometricToggles.test.tsx` → three disable tests + `shows the risk confirmation` + `persists the flag only when verification succeeds`.              |
| 7   | Lock prompts on cold start and after > 5 min; never < 5 min; no re-lock loop           | `appLockGate.test.tsx` → `does not relock after 299 seconds`, `relocks after 301 seconds`, `does not relock while a biometric prompt is on screen`.           |
| 8   | No protected frame visible before lock paints                                          | `appLockGate.test.tsx` → `hides children behind an opaque view while the flag read is in flight`.                                                             |
| 9   | `handleBackupNow` remains ungated                                                      | `backupRestoreGate.test.tsx` → `does not gate LocalSnapshotsSection backup now` + `does not gate CloudBackupSection backup now`.                              |
| 10  | `pnpm verify` passes; new tests fail if guard logic removed                            | Step 1 above; remove `tryBiometricApproval` from Task 5 and rerun to confirm red.                                                                             |
| 11  | Both vault notes updated — no note still claims biometrics is out of scope             | Task 10 Steps 2-3; confirmed by grep below.                                                                                                                   |

- [ ] **Step 3: Grep for the vault residual**

```bash
grep -r "Biometric unlock" obsidian-vault/
```

Expected: one match in `obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md`, on the struck-through line with the "Scope change:" annotation. No other file should assert that biometrics is out of scope.

- [ ] **Step 4: Final commit (only if Step 1 or 3 required a fix)**

```bash
git add <any files changed>
git commit -m "chore: final acceptance fixes for biometric owner auth"
```

If no changes were needed, no commit is required.
