# SariSari Biometric Owner Authentication Design

**Date:** 2026-08-19

**Status:** Approved in chat; awaiting written-spec review

**Scope:** `lib/auth/`, `components/auth/`, the owner PIN guard, the
app-launch lifecycle in `app/_layout.tsx`, and the destructive entry
points in `components/settings/backup/`

## Summary

Add optional biometric authentication (Face ID, Touch ID, Android
fingerprint or face) as a substitute for the owner PIN, plus an optional
app-launch lock. Both are off by default and both require a configured
owner PIN before they can be enabled.

A successful biometric prompt substitutes for the owner PIN at every
gate the PIN currently protects. The PIN remains the fallback whenever
biometrics is unavailable, not enrolled, hard-locked by the OS, or
simply fails. Nothing about the PIN's storage, hashing, or recovery
flow changes.

Two independent settings toggles are introduced:

- **Use biometrics** - lets Face ID or fingerprint stand in for the
  owner PIN at sensitive-action gates.
- **Lock app on launch** - requires an unlock on cold start, and on
  resume when the app was backgrounded for more than five minutes.

The destructive backup and restore actions, which are currently
ungated, are brought under the same guard. This is a net increase in
protection rather than a convenience change.

## Decision record and scope change

This design reverses a previously recorded decision, so the reversal is
stated explicitly rather than left implicit.

`obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md`
(status: Done, PR #23, commit `ad1bd65`) lists biometric unlock under
_Hindi Kasama sa Saklaw_ with the rationale: "Biometric unlock (ang
telepono ng tindahan ay maaaring walang maaasahang biometrics; ang PIN
ay sapat na)."

`obsidian-vault/07-Planning/biometrics-implementation.md` asks for
basic biometric authentication and therefore conflicts with the above.

The owner resolved the conflict in favour of implementing biometrics,
with two conditions that answer the original objection directly:

1. Biometrics is opt-in behind a settings toggle, so a store phone with
   unreliable or absent biometrics is unaffected. The PIN stays
   sufficient on its own.
2. The PIN is never removed or weakened. Biometrics is an additional
   factor layered over it, never a replacement for it.

Both vault notes require updating as part of implementation: note 11's
out-of-scope line becomes a scope change pointing at this spec, and the
planning note is marked superseded.

## Problem

The owner PIN gate is correct but slow. It guards actions that happen
during a live transaction, with a customer waiting: voiding a sale,
correcting a price, overriding a suki's credit limit, adjusting stock.
A 4-6 digit keypad entry per action is friction at exactly the moment
the owner can least afford it, which pushes owners toward either
disabling the discipline or choosing a trivially short PIN.

Two smaller problems ride along:

- The app has no lock at all. Anyone who picks up an unlocked store
  phone sees full sales history, customer debts, and cash position
  without any challenge.
- Backup and restore is ungated. Restoring a snapshot overwrites the
  live ledger, and unlinking cloud backup drops the offsite copy.
  Neither currently asks for authorization.

## Goals

1. A successful biometric prompt substitutes for the owner PIN at every
   existing gate, with no change to `runWithPinGuard`'s public
   signature and therefore no change to its call sites.
2. Biometrics is opt-in, off by default, and requires a configured PIN.
3. The PIN remains a complete fallback path. No device state can leave
   the owner unable to authorize an action they know the PIN for.
4. An optional app-launch lock with a fixed five-minute resume grace.
5. Destructive backup and restore actions come under the guard.
6. The feature degrades cleanly on hardware without biometrics and on
   the `react-native-web` build, rather than erroring.
7. Full offline operation. Nothing about this feature contacts a
   server, and no biometric data ever leaves the OS enclave.

## Non-goals

- Replacing or removing the owner PIN. The PIN stays authoritative and
  remains the only recovery path.
- Per-user or per-cashier biometrics. This is a single-owner authority
  model; cashier attribution stays with feature 16 (shift tracking).
- Device-passcode fallback. Explicitly rejected; see the threat model.
- Biometric enrollment-change invalidation via Keystore or Keychain
  keys. Acknowledged as the correct long-term fix and deferred.
- Biometrics on web. `react-native-web` has no equivalent, and
  WebAuthn is out of scope.
- Storing, transmitting, or backing up any biometric material. The OS
  returns a boolean; the app never sees biometric data.

## Threat model and accepted risk

**What this defends against.** A stranger or opportunist who picks up
the store phone. With the launch lock on, they see nothing. Without a
biometric or the PIN they cannot void a sale, alter a price, override a
credit limit, adjust stock, restore a snapshot, or unlink the backup.

**What this deliberately does not defend against.** Any person with a
finger or face enrolled on that phone can approve every gated action
without knowing the PIN. On a shared family phone this typically means
a spouse, an adult child, or anyone who was handed the phone once to
enroll a finger. This was raised explicitly during design and accepted
by the owner as the correct trade-off for their household.

The mitigations for that accepted risk are:

- Biometrics is off by default, so the risk is never assumed silently.
- Enabling it shows a one-time confirmation stating the consequence in
  plain language, naming the specific actions it unlocks.
- The toggle can be switched off at any time, immediately, without the
  PIN changing.
- The corrections audit report (`app/reports/corrections.tsx`) already
  records every approved void, refund, and price correction, so
  approvals remain reviewable after the fact even though the
  authenticating identity is not distinguishable.

**Device passcode fallback is disabled** (`disableDeviceFallback:
true`). The phone's unlock code is not the owner PIN. Allowing it would
mean anyone who can unlock the phone at all could approve a void, which
is strictly weaker than the PIN gate this feature is layered onto. When
the OS offers no biometric path, the app falls back to its own PIN
modal instead.

**The OS handles biometric rate limiting.** Failed biometric attempts
must not feed `useAuthStore.registerFailedAttempt()`. The platform
already throttles and then hard-locks biometrics after repeated
failures; counting those failures again in our own three-strike
counter would strand an owner behind a sixty-second lockout for
failures the OS had already punished.

**Biometrics must not bypass the PIN lockout.** While our own
three-strike, sixty-second PIN lockout is active, the biometric path is
skipped entirely and the PIN modal is shown with its lockout banner.
Otherwise the lockout would be trivially circumvented.

## Native dependency and configuration

`expo-local-authentication@~17.0.9` is installed and satisfies the SDK
54 pinned baseline of `~17.0.8` recorded in
`node_modules/expo/bundledNativeModules.json`.

The `app.json` plugin entry is already present. One copy change is
recommended: `faceIDPermission` currently reads "Allow SariSari to use
Face ID for authentication," which is too vague for App Store review.
It should name the actions, matching the existing
`expo-local-authentication` permission style already used elsewhere in
the config:

```json
[
  "expo-local-authentication",
  {
    "faceIDPermission": "Allow SariSari to approve owner actions like voids, refunds, and restores."
  }
]
```

Android's `USE_BIOMETRIC` permission is contributed by the config
plugin; no manual manifest edit is needed. The feature requires a native
rebuild and is inert in Expo Go.

## Capability layer: `lib/auth/biometrics.ts`

A new module with no UI and no database access, so it can be unit
tested in isolation and mocked in one place.

```ts
export type BiometricLabel = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  label: BiometricLabel;
}

export type BiometricAuthResult =
  'success' | 'cancelled' | 'fallback' | 'unavailable' | 'failed';

export const getBiometricCapability: () => Promise<BiometricCapability>;
export const authenticateOwner: (
  reason: string,
) => Promise<BiometricAuthResult>;
```

`getBiometricCapability()` combines `hasHardwareAsync()`,
`isEnrolledAsync()`, and `supportedAuthenticationTypesAsync()`. The
label is derived by preference order facial, then fingerprint, then
iris, and drives copy only. Any thrown error resolves to
`{ available: false, enrolled: false, label: 'none' }` so callers never
need a try/catch.

`authenticateOwner(reason)` calls `authenticateAsync` with
`disableDeviceFallback: true`, `cancelLabel` from the translation
bundle, and `promptMessage: reason`. Expo's `{ success, error }` result
maps to the union as follows:

| Expo outcome                                        | Mapped result |
| --------------------------------------------------- | ------------- |
| `success: true`                                     | `success`     |
| `user_cancel`, `system_cancel`, `app_cancel`        | `cancelled`   |
| `user_fallback`                                     | `fallback`    |
| `not_available`, `not_enrolled`, `passcode_not_set` | `unavailable` |
| `lockout`, `lockout_permanent`                      | `unavailable` |
| `authentication_failed`, `unknown`, anything else   | `failed`      |
| thrown exception                                    | `unavailable` |

Mapping OS lockout to `unavailable` rather than `failed` is deliberate:
when the platform hard-locks biometrics, the app must fall through to
the PIN rather than dead-end.

Only `cancelled` aborts the caller's action. Every other non-success
result falls through to the PIN modal, which is what keeps goal 3 true.

## Persistence

**Migration v22.** The current `PRAGMA user_version` is 21, verified at
`database/migrations.ts:1014`. The new block mirrors the v20 pattern at
`database/migrations.ts:800`: a `db.withTransactionAsync` wrapper, two
`INSERT OR IGNORE` seeds into `app_settings`, then the version bump.

```text
biometric_unlock_enabled  default '0'
app_launch_lock_enabled   default '0'
```

Both keys are added to the `AppSettingKey` union in
`types/settings.types.ts`, which currently holds three keys.

`database/settings.ts` needs no change. `setAppSetting` only calls
`assertOwnerAuthorized()` for `key === 'void_window_hours'`, so the new
keys inherit the existing behaviour, and the `INSERT ... ON CONFLICT`
upsert already handles both seed and update.

No new hook is required. `hooks/useAppSetting.ts` already exposes
`useAppSetting(key)` and `useSetAppSetting(key)` with query-key
invalidation, which is exactly what the two toggle rows need.

Values are stored as the strings `'0'` and `'1'` to match how existing
`app_settings` numeric values are persisted.

## Owner PIN guard integration

`components/auth/OwnerPinGuardProvider.tsx` is the single integration
point. `GuardOptions` and `OwnerPinGuardContextType` are unchanged, so
all four consumer files and five call sites stay untouched:

- `app/(edit-forms)/sale-correction/[id].tsx:88` - one call covering
  both void and refund, branching on `isVoid`
- `components/sales/price-correction/usePriceCorrectionForm.ts:213`
- `components/utang/credit-guardrails/OverrideReasonModal.tsx:69` and
  `:86` - preset reason and "other" reason paths
- `components/inventory/ledger/LogTransactionForm.tsx:85`

New behaviour inside `runWithPinGuard`, after the existing
`isOwnerPinConfigured()` check resolves true:

```
if PIN not configured        -> show setup modal (unchanged)
if PIN lockout active        -> show PIN modal with lockout banner
if biometrics flag is off    -> show PIN modal
if capability unavailable    -> show PIN modal
otherwise:
  result = authenticateOwner(reason)
  success     -> resetFailedAttempts(); await onApproved()
  cancelled   -> abort, clear activeOptions, show nothing
  failed      -> show PIN modal
  fallback    -> show PIN modal
  unavailable -> show PIN modal
```

The prompt reason comes from `activeOptions.actionDescription` when the
caller supplied one, falling back to a generic translated string. This
makes the OS sheet state what is being approved rather than a bare
"Authenticate," which matters because the sheet is the only thing the
owner sees before approving. The existing call sites already pass
action-specific descriptions such as `Void for Sale #12` and
`Credit limit override (Other reason)`, so they are reused as-is.

Those existing strings are hardcoded English at the call sites rather
than translated. Translating them would mean editing all five call
sites, which this design otherwise avoids, so it is called out as an
optional follow-up rather than folded in here. The new
`biometrics.reason_*` keys therefore only cover the gates this design
adds.

The existing `catch` behaviour is preserved: a database failure while
reading configuration still shows the "Owner PIN Unavailable" alert
rather than silently approving.

**Convention note.** `obsidian-vault/CONTEXT.md` states that screens
never call SQLite and that all data access goes through `hooks/`. The
provider is a root-level provider rather than a screen, and it already
calls `isOwnerPinConfigured()` from `database/auth` directly because the
check must be imperative inside an async guard rather than reactive in a
render. Reading the biometric flag with `getAppSetting` follows that
same established precedent. The reactive path used by the settings UI
still goes through `hooks/useAppSetting.ts`.

## App-launch lock: `components/auth/AppLockGate.tsx`

A new component mounted inside `OwnerPinGuardProvider`, wrapping
`<Stack>` in `app/_layout.tsx`, so the lock covers every route
including modals.

**Store additions** to `stores/useAuthStore.ts`, alongside the existing
PIN lockout state:

```ts
isAppUnlocked: boolean;            // false initially
lastBackgroundedAt: number | null;
markBackgrounded: () => void;      // records Date.now()
markUnlocked: () => void;          // true, clears lastBackgroundedAt
requireUnlock: () => void;         // sets isAppUnlocked = false
```

**Resolution on mount.** The gate defers reading settings until the
`isReady` prop is true, matching how `OwnerPinGuardProvider` already
receives `isReady={dbReady}`. It then reads both the lock flag and
`isOwnerPinConfigured()`. If the lock is off, or no PIN is configured,
it calls `markUnlocked()` and becomes permanently inert for that
session. A launch lock with no configured PIN would be unrecoverable, so
"no PIN" always means "no lock."

**Flash prevention.** Between `isReady` turning true and the flag read
resolving, the gate renders an opaque view in the app background colour
`#F7F6F2` rather than its children, so there is no frame in which
protected content is visible before the lock paints.

**Resume detection** reuses the existing `AppState` listener at
`app/_layout.tsx:115` rather than adding a second subscription:

- `background` or `inactive` -> `markBackgrounded()`
- `active` -> if more than 300000 ms elapsed since
  `lastBackgroundedAt`, call `requireUnlock()`

iOS emits `inactive` for transient events such as a notification-centre
pull, but since the threshold is five minutes those round-trips never
trigger a lock.

**The re-lock loop hazard.** On several Android devices, and on iOS
during Face ID, the biometric prompt itself drives the app through
`inactive` or `background` and back to `active`. Without protection the
gate would record a background timestamp, re-lock on return, prompt
again, and loop indefinitely. An `isAuthInFlight` ref is set before
`authenticateOwner()` is called and cleared in a `finally`, and the
`AppState` handler ignores every transition while it is set. This is the
single most likely defect in the feature and it gets a dedicated test.

**Lock presentation.** A full-screen view, not a modal, with no cancel
affordance: the owner either authenticates or leaves the app. It fires
`authenticateOwner()` once automatically on becoming locked, and offers
a retry button plus an "Enter PIN instead" affordance that opens the
existing `OwnerPinModal`. When biometrics is disabled or unavailable the
lock screen goes straight to the PIN modal with no biometric attempt.
Successful unlock by either path calls `markUnlocked()`.

If the owner exhausts three PIN attempts on the lock screen, the
existing sixty-second lockout applies there too: the lock stays up with
the lockout banner and the timer counts down, since there is no cancel
to escape to. This is the intended behaviour, not a dead end, and it is
the same window the PIN gate already enforces elsewhere.

## Backup and restore gating

`app/(tabs)/more/backup.tsx` is a thin composition with no handlers, so
gating happens inside the section components. Three destructive entry
points are wrapped in `runWithPinGuard`, each with its own prompt
reason:

- `components/settings/backup/RestorePickerModal.tsx:89`
  `handleConfirmYes`
- `components/settings/backup/LocalSnapshotsSection.tsx:116`
  `handleConfirmRestore`
- `components/settings/backup/CloudBackupSection.tsx:228` `handleUnlink`

`CloudBackupSection.tsx:236` `handleBackupNow` stays ungated. Creating a
backup is non-destructive, and gating it would discourage the habit the
app most wants to encourage.

Unlinking is included because it silently drops the offsite copy, which
is destructive on a delay: nothing appears wrong until a restore is
needed and no snapshot exists.

## Settings UI

Two rows are added to `components/settings/OwnerPinSettingsCard.tsx`,
below the existing Setup/Change/Reset buttons and above the discount
threshold inputs, so the card reads as PIN first, then what is layered
on top of it.

**Row 1: Use biometrics.** Switch bound to `biometric_unlock_enabled`.
Disabled, with a reason line explaining why, when any of these hold:

- No owner PIN is configured.
- `capability.available` is false (no biometric hardware).
- `capability.enrolled` is false (hardware present, nothing enrolled).

Turning it on requires one successful `authenticateOwner()` first. This
prevents an owner enabling a factor that does not actually work on their
phone and then discovering it at a gate mid-transaction. If that
verification fails or is cancelled, the switch stays off.

Before that verification, a one-time confirmation states the accepted
risk in plain language: that anyone whose fingerprint or face is
enrolled on this phone will be able to approve voids, refunds, price
corrections, credit-limit overrides, stock adjustments, and restores
without knowing the PIN. Turning the switch off requires no
confirmation, since disabling only ever tightens security.

**Row 2: Lock app on launch.** Switch bound to
`app_launch_lock_enabled`. Disabled with a reason line when no PIN is
configured. Its subtitle states the five-minute grace explicitly, so the
behaviour is discoverable without experimentation. It does not require
biometrics; with biometrics off, the lock challenges with the PIN.

The two toggles are independent in both directions, as specified.

The card's copy uses the capability label so it reads "Use Face ID" or
"Use fingerprint" where the platform is known, falling back to a generic
"Use biometrics" string.

## Localization

A `biometrics.*` block is added beside the existing `pin.*` block in
`locales/en/settings.json` and `locales/tl/settings.json`. Those are the
only two locales in the project. Keys cover:

- Toggle titles, subtitles, and each disabled reason.
- The enable confirmation title, body, and buttons.
- Lock screen title, body, retry, and "Enter PIN instead."
- Capability labels for face, fingerprint, and the generic fallback.
- The `cancelLabel` shown on the OS prompt sheet.
- A prompt reason per gate this design adds: restore, cloud unlink, and
  app unlock, plus the generic default used when a caller supplies no
  `actionDescription`. The five pre-existing gates supply their own
  descriptions, as noted above.

Per-action reasons exist because the OS sheet is the last thing shown
before approval, and it should name the action being approved.

## Expected file impact

### **New**

- `lib/auth/biometrics.ts`
- `components/auth/AppLockGate.tsx`
- `tests/biometrics.test.ts`
- `tests/appLockGate.test.tsx`

### **Modified**

- `database/migrations.ts` - migration v22
- `types/settings.types.ts` - two `AppSettingKey` entries
- `stores/useAuthStore.ts` - app-lock state and actions
- `components/auth/OwnerPinGuardProvider.tsx` - biometric attempt path
- `components/settings/OwnerPinSettingsCard.tsx` - two toggle rows
- `components/settings/backup/RestorePickerModal.tsx`
- `components/settings/backup/LocalSnapshotsSection.tsx`
- `components/settings/backup/CloudBackupSection.tsx`
- `app/_layout.tsx` - mount `AppLockGate`, extend `AppState` handler
- `locales/en/settings.json`, `locales/tl/settings.json`
- `jest.setup.ts` - `expo-local-authentication` mock
- `tests/useOwnerPinGuard.test.tsx` - biometric branch coverage
- `app.json` - `faceIDPermission` copy

### **Unchanged, deliberately**

- `database/auth.ts` and `lib/auth/crypto.ts`. PIN storage, hashing, and
  recovery are untouched.
- `hooks/useOwnerPinGuard.ts` and all five guard call sites.
- `database/settings.ts`.
- `hooks/useAppSetting.ts`.

### **Vault**

- `obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md` -
  amend the out-of-scope biometric line into a recorded scope change
  citing this spec.
- `obsidian-vault/07-Planning/biometrics-implementation.md` - mark
  superseded by this spec.
- Mirror this decision record into the vault per the project's ADR
  convention.

## Verification strategy

### Automated tests

`jest.setup.ts` gains an `expo-local-authentication` mock in the same
style as the existing `expo-haptics` mock, exposing
`hasHardwareAsync`, `isEnrolledAsync`,
`supportedAuthenticationTypesAsync`, and `authenticateAsync` as
overridable jest mocks. There is currently no mock for this package.

**`tests/biometrics.test.ts`**

- Every row of the result-mapping table, including a thrown exception.
- `lockout` and `lockout_permanent` map to `unavailable`, not `failed`.
- Capability label preference order, and the all-false shape when
  `hasHardwareAsync` throws.
- `authenticateAsync` is always called with
  `disableDeviceFallback: true`.

**`tests/useOwnerPinGuard.test.tsx`** (extended)

- Biometric flag off: PIN modal shown, `authenticateAsync` never
  called.
- Flag on, capability unavailable: PIN modal shown.
- Flag on, success: `onApproved` runs, no PIN modal,
  `resetFailedAttempts` called.
- Flag on, `cancelled`: `onApproved` does not run and no PIN modal
  appears.
- Flag on, `failed`: PIN modal appears and `registerFailedAttempt` is
  not called.
- PIN lockout active: no biometric attempt, PIN modal shows the lockout
  banner.
- No PIN configured: setup modal, unchanged from today.

**`tests/appLockGate.test.tsx`**

- Cold start with the lock on renders the lock and not its children.
- Lock off, or no PIN configured, renders children immediately.
- Resume after 299 seconds does not lock; resume after 301 seconds
  does. Both sides of the boundary are asserted with faked timers.
- The prompt-backgrounds-the-app case: an `inactive` to `active`
  round-trip while `isAuthInFlight` is set produces exactly one
  `authenticateAsync` call and no re-lock.
- Successful unlock renders children; the "Enter PIN instead" path
  unlocks via `OwnerPinModal`.
- No protected frame is rendered before the flag read resolves.

`pnpm verify` (`tsc --noEmit` plus `jest`) must pass. New code follows
the conditional prop-spread pattern already used in
`OwnerPinGuardProvider` to satisfy `exactOptionalPropertyTypes`.

### Manual verification

Requires a native build; the feature is inert in Expo Go. Matrix:

| Device state                       | Expected                                  |
| ---------------------------------- | ----------------------------------------- |
| iOS with Face ID enrolled          | Prompt names the action; approves         |
| Android with fingerprint enrolled  | Prompt names the action; approves         |
| Hardware present, nothing enrolled | Toggle disabled with a reason             |
| No biometric hardware              | Toggle disabled with a reason             |
| Biometrics enrolled, toggle off    | PIN modal, no prompt                      |
| Wrong finger three times           | OS lockout, then PIN modal                |
| Cancel the sheet                   | Action aborts, no PIN modal               |
| Resume after 1 minute              | No lock                                   |
| Resume after 6 minutes             | Lock                                      |
| Restore a snapshot                 | Gated                                     |
| Backup now                         | Not gated                                 |
| Web build                          | Toggle disabled, PIN path works, no crash |

## Known limitations

**No enrollment-change detection.** `expo-local-authentication` exposes
no way to detect that a new fingerprint or face was added since the
owner enabled the feature, so a biometric enrolled later silently gains
approval rights. The correct fix is a Keystore or Keychain key
configured to invalidate on enrollment change, which requires native
code and is deferred. Mitigation is the setup warning plus the ability
to switch the toggle off at any time.

**Native rebuild required.** The feature cannot be validated in Expo
Go, and an over-the-air update alone will not deliver it.

**No web biometrics.** The `react-native-web` build degrades to the PIN
path.

**Approvals are not attributable.** A biometric approval records that
the gate was passed, not who passed it. This is the same limitation the
shared PIN already has, and per-cashier attribution belongs to feature 16.

## Acceptance criteria

1. With both toggles off, behaviour is byte-for-byte identical to today
   at every existing gate.
2. With biometrics on, a successful prompt substitutes for the PIN at
   all five existing call sites and at the three backup entry points.
3. Cancelling the prompt aborts the action without showing the PIN
   modal; every other failure mode falls through to the PIN modal.
4. No device or OS state can prevent an owner who knows the PIN from
   authorizing an action.
5. Failed biometric attempts never increment the PIN lockout counter,
   and no biometric attempt is made while a PIN lockout is active.
6. Neither toggle can be enabled without a configured owner PIN;
   enabling biometrics requires one successful verification first and
   shows the one-time risk confirmation.
7. The launch lock prompts on cold start and after a background of more
   than five minutes, never in under five minutes, and never enters a
   re-lock loop when the prompt itself backgrounds the app.
8. No protected content is visible for any frame before the lock
   paints.
9. `handleBackupNow` remains ungated.
10. `pnpm verify` passes, and the new tests fail if their guard logic is
    removed.
11. Both vault notes are updated so no note still claims biometrics is
    out of scope.
