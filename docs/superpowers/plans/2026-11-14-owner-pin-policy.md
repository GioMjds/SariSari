# Owner PIN Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the store owner choose which actions require owner PIN approval, with locked core actions, per-action defaults, and a "New" badge for unreviewed actions.

**Architecture:** A code registry (`lib/auth/pin-actions.ts`) defines every guardable action with a risk level and default. Per-action overrides live in `app_settings` as `owner_pin_action.<id>` rows (no schema migration). `runWithPinGuard` resolves the policy before opening any modal and fails closed. A new Settings card edits overrides behind the PIN.

**Tech Stack:** Expo 54, React Native, expo-sqlite (`app_settings` key/value), TanStack Query, react-i18next, NativeWind, Jest + `@testing-library/react-native`. Package manager scripts use `pnpm`.

**Spec:** `docs/superpowers/specs/2026-11-14-owner-pin-policy-design.md`

## Global Constraints

- No schema migration. Reuse `app_settings` via `getAppSetting` / `setAppSetting`.
- Locked actions: `backup_restore`, `drive_unlink`, `pin_change`, `pin_policy_change`. They never read the stored setting and show no switch.
- Policy read failure, unknown action id, or locked action: PIN required (fail closed).
- Storage values: `1` = PIN required, `0` = not required. Missing row = registry default plus "New" badge.
- Existing installs: every currently guarded action keeps its guard (all defaults on).
- No external libraries. No emojis in comments. Comments are one sentence.
- All user-facing strings via i18n in both `locales/en/settings.json` and `locales/tl/settings.json`.
- Markdown files use kebab-case names. Do not commit anything under `docs/`.
- Commit with a pathspec (`git commit -m "..." -- <paths>`); never sweep unrelated staged work into a commit. Append the attribution lines from the session reminder to each commit message.
- Jest `testMatch` does not cover `lib/`, `database/`, or `hooks/`. Put tests for those under `tests/`. `tests/__setup__/expo-sqlite-mock` does not exist, so tests must `jest.mock` any module that imports `@/configs/sqlite` with an explicit factory.

## Review Focus

- Stored `0` on a locked action: PIN is still required (Task 1 test).
- Stored garbage value (`''`, `'2'`, `'true'`): registry default applies (Task 1 test).
- Unknown or removed action id: PIN required (Task 1 test).
- Policy read throws: PIN required, `onApproved` not called early (Task 2 test).
- Action turned off while no PIN is configured: `onApproved` runs directly, setup modal does not open (Task 2 test).
- Switches disabled until a PIN exists; failed write does not change the switch (Task 3 test).

## Pre-existing gap found while planning

`OwnerPinSettingsCard` pushes `/settings/owner-pin-setup` for "Change Owner PIN" with no PIN check, and `OwnerPinSetupFlow` calls `setupOwnerPin` without verifying the old PIN. Task 3 closes this by guarding the change button with the locked `pin_change` action. The recovery-code reset path is unchanged.

## File Structure

| File                                                                | Responsibility                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/auth/pin-actions.ts` (create)                                  | Registry, action id type, key helper, pure `isPinRequired`, pure `parsePinOverrides` |
| `tests/lib/pin-actions.test.ts` (create)                            | Registry and policy resolution tests                                                 |
| `types/settings.types.ts` (modify)                                  | Allow `owner_pin_action.*` keys in `AppSettingKey`                                   |
| `components/auth/OwnerPinGuardProvider.tsx` (modify)                | `actionId` in `GuardOptions`, policy check before modals                             |
| `components/auth/__tests__/OwnerPinGuardProvider.test.tsx` (create) | Guard behavior tests                                                                 |
| 7 call sites (modify)                                               | Pass `actionId`                                                                      |
| `database/pin-policy.ts` (create)                                   | Read all overrides, write one override                                               |
| `hooks/usePinPolicy.ts` (create)                                    | Query and mutation for overrides                                                     |
| `components/settings/PinPolicyCard.tsx` (create)                    | Settings UI                                                                          |
| `components/settings/__tests__/PinPolicyCard.test.tsx` (create)     | UI tests                                                                             |
| `components/settings/OwnerPinSettingsCard.tsx` (modify)             | Guard "Change Owner PIN"                                                             |
| `app/settings/settings.tsx` (modify)                                | Mount the new section                                                                |
| `locales/en/settings.json`, `locales/tl/settings.json` (modify)     | `pin_policy` strings                                                                 |

---

### Task 1: Registry and policy resolution

**Files:**

- Create: `lib/auth/pin-actions.ts`
- Create: `tests/lib/pin-actions.test.ts`
- Modify: `types/settings.types.ts:1-6`

**Interfaces:**

- Produces:
  - `type PinActionRisk = 'low' | 'high' | 'locked'`
  - `interface PinAction { id: string; labelKey: string; risk: PinActionRisk; defaultEnabled: boolean }`
  - `const PIN_ACTIONS: readonly PinAction[]`
  - `type PinActionId` (union of registry ids)
  - `const PIN_ACTION_KEY_PREFIX = 'owner_pin_action.'`
  - `pinActionKey(id: PinActionId): AppSettingKey`
  - `getPinAction(id: string): PinAction | undefined`
  - `isPinRequired(id: string, read: (key: AppSettingKey) => Promise<string | null>): Promise<boolean>`
  - `parsePinOverrides(rows: { key: string; value: string }[]): Record<string, boolean>`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/pin-actions.test.ts`:

```ts
import {
  PIN_ACTIONS,
  getPinAction,
  isPinRequired,
  parsePinOverrides,
  pinActionKey,
} from '@/lib/auth/pin-actions';

const LOCKED_IDS = [
  'backup_restore',
  'drive_unlink',
  'pin_change',
  'pin_policy_change',
];

describe('pin action registry', () => {
  it('has unique ids', () => {
    const ids = PIN_ACTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks exactly the core actions as locked', () => {
    const locked = PIN_ACTIONS.filter((a) => a.risk === 'locked').map(
      (a) => a.id,
    );
    expect(locked.sort()).toEqual([...LOCKED_IDS].sort());
  });

  it('defaults every action to on so existing installs keep their guards', () => {
    expect(PIN_ACTIONS.every((a) => a.defaultEnabled)).toBe(true);
  });

  it('builds the storage key from the id', () => {
    expect(pinActionKey('sale_void')).toBe('owner_pin_action.sale_void');
  });
});

describe('isPinRequired', () => {
  const reader = (value: string | null) => jest.fn().mockResolvedValue(value);

  it('uses the registry default when no row exists', async () => {
    expect(await isPinRequired('stock_adjustment', reader(null))).toBe(true);
  });

  it('honors an override of 0 for a non-locked action', async () => {
    expect(await isPinRequired('stock_adjustment', reader('0'))).toBe(false);
  });

  it('honors an override of 1', async () => {
    expect(await isPinRequired('stock_adjustment', reader('1'))).toBe(true);
  });

  it('ignores a stored 0 on a locked action and never reads it', async () => {
    const read = reader('0');
    expect(await isPinRequired('backup_restore', read)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it.each(['', '2', 'true'])(
    'falls back to the default for garbage value %p',
    async (raw) => {
      expect(await isPinRequired('sale_void', reader(raw))).toBe(true);
    },
  );

  it('requires the PIN for an unknown action id', async () => {
    expect(await isPinRequired('not_an_action', reader('0'))).toBe(true);
  });

  it('requires the PIN when the read throws', async () => {
    const read = jest.fn().mockRejectedValue(new Error('db down'));
    expect(await isPinRequired('stock_adjustment', read)).toBe(true);
  });
});

describe('parsePinOverrides', () => {
  it('maps known ids to booleans and drops unknown or malformed rows', () => {
    const result = parsePinOverrides([
      { key: 'owner_pin_action.sale_void', value: '0' },
      { key: 'owner_pin_action.stock_adjustment', value: '1' },
      { key: 'owner_pin_action.removed_action', value: '0' },
      { key: 'owner_pin_action.sale_refund', value: 'x' },
    ]);
    expect(result).toEqual({ sale_void: false, stock_adjustment: true });
  });
});

describe('getPinAction', () => {
  it('returns undefined for unknown ids', () => {
    expect(getPinAction('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/lib/pin-actions.test.ts`
Expected: FAIL, "Cannot find module '@/lib/auth/pin-actions'".

- [ ] **Step 3: Write minimal implementation**

In `types/settings.types.ts` add one member to the union:

```ts
export type AppSettingKey =
  | 'void_window_hours'
  | 'owner_pin_discount_threshold_pesos'
  | 'owner_pin_discount_threshold_percent'
  | 'biometric_unlock_enabled'
  | 'app_launch_lock_enabled'
  | `owner_pin_action.${string}`;
```

Create `lib/auth/pin-actions.ts`:

```ts
import type { AppSettingKey } from '@/types/settings.types';

export type PinActionRisk = 'low' | 'high' | 'locked';

export interface PinAction {
  id: string;
  labelKey: string;
  risk: PinActionRisk;
  defaultEnabled: boolean;
}

// Generic id keeps the literal type so PinActionId is a real union.
const action = <I extends string>(
  id: I,
  risk: PinActionRisk,
  defaultEnabled = true,
) => ({
  id,
  labelKey: `pin_policy.actions.${id}`,
  risk,
  defaultEnabled,
});

export const PIN_ACTIONS = [
  action('sale_void', 'high'),
  action('sale_refund', 'high'),
  action('sale_price_correction', 'high'),
  action('stock_adjustment', 'low'),
  action('delivery_receipt_void', 'high'),
  action('credit_limit_override', 'high'),
  action('backup_restore', 'locked'),
  action('drive_unlink', 'locked'),
  action('pin_change', 'locked'),
  action('pin_policy_change', 'locked'),
] as const satisfies readonly PinAction[];

export type PinActionId = (typeof PIN_ACTIONS)[number]['id'];

export const PIN_ACTION_KEY_PREFIX = 'owner_pin_action.';

export const pinActionKey = (id: PinActionId): AppSettingKey =>
  `${PIN_ACTION_KEY_PREFIX}${id}`;

export const getPinAction = (id: string): PinAction | undefined =>
  PIN_ACTIONS.find((a) => a.id === id);

export type PinSettingReader = (key: AppSettingKey) => Promise<string | null>;

// Fails closed: locked, unknown, or unreadable policy always requires the PIN.
export const isPinRequired = async (
  id: string,
  read: PinSettingReader,
): Promise<boolean> => {
  const def = getPinAction(id);
  if (!def || def.risk === 'locked') return true;
  try {
    const raw = await read(`${PIN_ACTION_KEY_PREFIX}${id}`);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return def.defaultEnabled;
  } catch {
    return true;
  }
};

// Keeps only rows for known, non-locked actions with a 0 or 1 value.
export const parsePinOverrides = (
  rows: { key: string; value: string }[],
): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  for (const row of rows) {
    if (!row.key.startsWith(PIN_ACTION_KEY_PREFIX)) continue;
    const id = row.key.slice(PIN_ACTION_KEY_PREFIX.length);
    const def = getPinAction(id);
    if (!def || def.risk === 'locked') continue;
    if (row.value === '1') out[id] = true;
    else if (row.value === '0') out[id] = false;
  }
  return out;
};
```

- [ ] **Step 4: Run test and typecheck**

Run: `pnpm jest tests/lib/pin-actions.test.ts && pnpm typecheck`
Expected: PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/pin-actions.ts tests/lib/pin-actions.test.ts types/settings.types.ts
git commit -m "feat: add owner PIN action registry and policy resolution" -- lib/auth/pin-actions.ts tests/lib/pin-actions.test.ts types/settings.types.ts
```

---

### Task 2: Guard honors policy, call sites pass `actionId`

**Files:**

- Modify: `components/auth/OwnerPinGuardProvider.tsx:2-23,90-111`
- Create: `components/auth/__tests__/OwnerPinGuardProvider.test.tsx`
- Modify (add `actionId`): `app/(edit-forms)/sale-correction/[id].tsx:88`, `components/sales/price-correction/usePriceCorrectionForm.ts:213`, `components/inventory/ledger/LogTransactionForm.tsx:85`, `app/(edit-forms)/delivery-receipt/[id].tsx:357`, `components/utang/credit-guardrails/OverrideReasonModal.tsx:69,86`, `components/settings/backup/LocalSnapshotsSection.tsx:95`, `components/settings/backup/CloudBackupSection.tsx:201`

**Interfaces:**

- Consumes: `isPinRequired`, `PinActionId` from Task 1; `getAppSetting` from `@/database/settings`.
- Produces: `GuardOptions.actionId: PinActionId` (required). `runWithPinGuard` calls `onApproved` directly when the policy says no PIN is needed.

- [ ] **Step 1: Write the failing test**

Create `components/auth/__tests__/OwnerPinGuardProvider.test.tsx`:

```tsx
import React, { useContext } from 'react';
import { act, render } from '@testing-library/react-native';
import {
  OwnerPinGuardContext,
  OwnerPinGuardProvider,
  type OwnerPinGuardContextType,
} from '@/components/auth/OwnerPinGuardProvider';
import { getAppSetting } from '@/database/settings';
import { isOwnerPinConfigured } from '@/database/auth';

jest.mock('@/database/settings', () => ({ getAppSetting: jest.fn() }));
jest.mock('@/database/auth', () => ({ isOwnerPinConfigured: jest.fn() }));
jest.mock('@/lib/auth/biometrics', () => ({
  authenticateOwner: jest.fn(),
  getBiometricCapability: jest.fn(),
}));
jest.mock('@/utils', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('@/stores/useAuthStore', () => {
  const state = {
    setIsPinConfigured: jest.fn(),
    isLockedOut: () => false,
    resetFailedAttempts: jest.fn(),
  };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
jest.mock('@/components/auth/OwnerPinModal', () => ({
  OwnerPinModal: () =>
    require('react').createElement('Text', null, 'PIN_CHALLENGE'),
}));
jest.mock('@/components/auth/OwnerPinSetupModal', () => ({
  OwnerPinSetupModal: () =>
    require('react').createElement('Text', null, 'PIN_SETUP'),
}));
jest.mock('@/components/auth/OwnerPinRecoveryModal', () => ({
  OwnerPinRecoveryModal: () =>
    require('react').createElement('Text', null, 'PIN_RECOVERY'),
}));

const mockGetSetting = getAppSetting as jest.Mock;
const mockConfigured = isOwnerPinConfigured as jest.Mock;

let guard: OwnerPinGuardContextType;
const Probe = () => {
  guard = useContext(OwnerPinGuardContext)!;
  return null;
};

const mount = () =>
  render(
    <OwnerPinGuardProvider>
      <Probe />
    </OwnerPinGuardProvider>,
  );

describe('OwnerPinGuardProvider policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigured.mockResolvedValue(true);
  });

  it('runs onApproved directly when the action is turned off', async () => {
    mockGetSetting.mockResolvedValue('0');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('PIN_CHALLENGE')).toBeNull();
  });

  it('opens the challenge when the action is on', async () => {
    mockGetSetting.mockResolvedValue('1');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('ignores a stored 0 on a locked action', async () => {
    mockGetSetting.mockResolvedValue('0');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'backup_restore', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('requires the PIN when the policy read throws', async () => {
    mockGetSetting.mockRejectedValue(new Error('db down'));
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('skips PIN setup when the action is off and no PIN exists', async () => {
    mockGetSetting.mockResolvedValue('0');
    mockConfigured.mockResolvedValue(false);
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('PIN_SETUP')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest components/auth/__tests__/OwnerPinGuardProvider.test.tsx`
Expected: FAIL, the "turned off" and "no PIN exists" cases fail because the modal or setup still opens.

- [ ] **Step 3: Implement the guard change**

In `components/auth/OwnerPinGuardProvider.tsx`, add imports after the existing ones:

```ts
import { isPinRequired, type PinActionId } from '@/lib/auth/pin-actions';
```

Change `GuardOptions`:

```ts
export interface GuardOptions {
  actionId: PinActionId;
  title?: string;
  actionDescription?: string;
  onApproved: () => Promise<void> | void;
}
```

Change the start of `runWithPinGuard` (keep the rest of the function as is):

```ts
  const runWithPinGuard = async (options: GuardOptions) => {
    if (!(await isPinRequired(options.actionId, getAppSetting))) {
      await options.onApproved();
      return;
    }
    setActiveOptions(options);
    let configured = false;
```

In `hooks/useOwnerPinGuard.ts` no change is needed.

Now add `actionId` as the first property of each call. Exact edits:

- `app/(edit-forms)/sale-correction/[id].tsx`: before `title: isVoid ? 'Authorize Void Sale' : 'Authorize Refund',` insert `actionId: isVoid ? 'sale_void' : 'sale_refund',`
- `components/sales/price-correction/usePriceCorrectionForm.ts`: before `title: 'Authorize Price Correction',` insert `actionId: 'sale_price_correction',`
- `components/inventory/ledger/LogTransactionForm.tsx`: before `title: 'Authorize Stock Adjustment',` insert `actionId: 'stock_adjustment',`
- `app/(edit-forms)/delivery-receipt/[id].tsx`: before `title: t('voidPinTitle'),` insert `actionId: 'delivery_receipt_void',`
- `components/utang/credit-guardrails/OverrideReasonModal.tsx`: before both `title: 'Authorize Credit Override',` insert `actionId: 'credit_limit_override',`
- `components/settings/backup/LocalSnapshotsSection.tsx`: before `title: t('settings:biometrics.lock_title'),` insert `actionId: 'backup_restore',`
- `components/settings/backup/CloudBackupSection.tsx`: before `title: t('settings:biometrics.lock_title'),` insert `actionId: 'drive_unlink',`

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm jest components/auth/__tests__/OwnerPinGuardProvider.test.tsx && pnpm typecheck`
Expected: PASS, typecheck clean (a missed call site fails typecheck on the required `actionId`).

- [ ] **Step 5: Commit**

```bash
git add components/auth/OwnerPinGuardProvider.tsx components/auth/__tests__/OwnerPinGuardProvider.test.tsx "app/(edit-forms)/sale-correction/[id].tsx" components/sales/price-correction/usePriceCorrectionForm.ts components/inventory/ledger/LogTransactionForm.tsx "app/(edit-forms)/delivery-receipt/[id].tsx" components/utang/credit-guardrails/OverrideReasonModal.tsx components/settings/backup/LocalSnapshotsSection.tsx components/settings/backup/CloudBackupSection.tsx
git commit -m "feat: resolve owner PIN policy in the approval guard" -- components/auth/OwnerPinGuardProvider.tsx components/auth/__tests__/OwnerPinGuardProvider.test.tsx "app/(edit-forms)/sale-correction/[id].tsx" components/sales/price-correction/usePriceCorrectionForm.ts components/inventory/ledger/LogTransactionForm.tsx "app/(edit-forms)/delivery-receipt/[id].tsx" components/utang/credit-guardrails/OverrideReasonModal.tsx components/settings/backup/LocalSnapshotsSection.tsx components/settings/backup/CloudBackupSection.tsx
```

---

### Task 3: Settings UI, storage helpers, guarded PIN change

**Files:**

- Create: `database/pin-policy.ts`
- Create: `hooks/usePinPolicy.ts`
- Create: `components/settings/PinPolicyCard.tsx`
- Create: `components/settings/__tests__/PinPolicyCard.test.tsx`
- Modify: `components/settings/OwnerPinSettingsCard.tsx` (change button, lines ~237-246)
- Modify: `app/settings/settings.tsx:103-105`
- Modify: `locales/en/settings.json`, `locales/tl/settings.json`

**Interfaces:**

- Consumes: `PIN_ACTIONS`, `PinAction`, `parsePinOverrides`, `pinActionKey`, `PIN_ACTION_KEY_PREFIX` (Task 1); `useOwnerPinGuard` with `actionId` (Task 2).
- Produces:
  - `getPinPolicyOverrides(): Promise<Record<string, boolean>>`
  - `setPinPolicyOverride(id: PinActionId, enabled: boolean): Promise<void>`
  - `usePinPolicy(): { overrides: Record<string, boolean>; isLoading: boolean; setOverride: (v: { id: PinActionId; enabled: boolean }) => Promise<void> }`
  - `PinPolicyCard: React.FC`

- [ ] **Step 1: Write the failing UI test**

Create `components/settings/__tests__/PinPolicyCard.test.tsx`:

```tsx
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PinPolicyCard } from '@/components/settings/PinPolicyCard';

const mockSetOverride = jest.fn().mockResolvedValue(undefined);
const mockRunWithPinGuard = jest.fn();
const mockAddToast = jest.fn();
let mockOverrides: Record<string, boolean> = {};
let mockPinConfigured = true;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@/hooks/usePinPolicy', () => ({
  usePinPolicy: () => ({
    overrides: mockOverrides,
    isLoading: false,
    setOverride: mockSetOverride,
  }),
}));
jest.mock('@/hooks/useOwnerPinGuard', () => ({
  useOwnerPinGuard: () => ({ runWithPinGuard: mockRunWithPinGuard }),
}));
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ isPinConfigured: mockPinConfigured }),
}));
jest.mock('@/stores', () => ({
  useToastStore: (sel: (s: unknown) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

describe('PinPolicyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOverrides = {};
    mockPinConfigured = true;
  });

  it('shows a switch for non-locked actions only', async () => {
    const screen = await render(<PinPolicyCard />);
    expect(screen.getByTestId('pin-policy-switch-sale_void')).toBeTruthy();
    expect(screen.queryByTestId('pin-policy-switch-backup_restore')).toBeNull();
    expect(screen.getAllByText('pin_policy.locked').length).toBe(4);
  });

  it('disables switches until a PIN is configured', async () => {
    mockPinConfigured = false;
    const screen = await render(<PinPolicyCard />);
    const sw = screen.getByTestId('pin-policy-switch-sale_void');
    expect(sw.props.disabled).toBe(true);
  });

  it('toggling asks for the PIN under pin_policy_change, then saves', async () => {
    const screen = await render(<PinPolicyCard />);
    fireEvent(
      screen.getByTestId('pin-policy-switch-stock_adjustment'),
      'valueChange',
      false,
    );
    const opts = mockRunWithPinGuard.mock.calls[0][0];
    expect(opts.actionId).toBe('pin_policy_change');
    expect(mockSetOverride).not.toHaveBeenCalled();
    await act(async () => {
      await opts.onApproved();
    });
    expect(mockSetOverride).toHaveBeenCalledWith({
      id: 'stock_adjustment',
      enabled: false,
    });
  });

  it('toasts and does not throw when the save fails', async () => {
    mockSetOverride.mockRejectedValueOnce(new Error('db'));
    const screen = await render(<PinPolicyCard />);
    fireEvent(
      screen.getByTestId('pin-policy-switch-sale_void'),
      'valueChange',
      false,
    );
    await act(async () => {
      await mockRunWithPinGuard.mock.calls[0][0].onApproved();
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'danger' }),
    );
  });

  it('shows New for unreviewed actions and clears it after keeping the default', async () => {
    const screen = await render(<PinPolicyCard />);
    expect(screen.getAllByText('pin_policy.new_badge').length).toBe(6);
    fireEvent.press(screen.getByTestId('pin-policy-new-sale_void'));
    expect(mockRunWithPinGuard).not.toHaveBeenCalled();
    expect(mockSetOverride).toHaveBeenCalledWith({
      id: 'sale_void',
      enabled: true,
    });
  });

  it('hides New for actions that already have an override', async () => {
    mockOverrides = { sale_void: false };
    const screen = await render(<PinPolicyCard />);
    expect(screen.queryByTestId('pin-policy-new-sale_void')).toBeNull();
    expect(screen.getByTestId('pin-policy-switch-sale_void').props.value).toBe(
      false,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest components/settings/__tests__/PinPolicyCard.test.tsx`
Expected: FAIL, "Cannot find module '@/components/settings/PinPolicyCard'".

- [ ] **Step 3: Implement storage, hook, and card**

Create `database/pin-policy.ts`:

```ts
import { db } from '@/configs/sqlite';
import { setAppSetting } from '@/database/settings';
import {
  PIN_ACTION_KEY_PREFIX,
  parsePinOverrides,
  pinActionKey,
  type PinActionId,
} from '@/lib/auth/pin-actions';

export const getPinPolicyOverrides = async (): Promise<
  Record<string, boolean>
> => {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings WHERE key GLOB ?',
    [`${PIN_ACTION_KEY_PREFIX}*`],
  );
  return parsePinOverrides(rows);
};

export const setPinPolicyOverride = (
  id: PinActionId,
  enabled: boolean,
): Promise<void> => setAppSetting(pinActionKey(id), enabled ? '1' : '0');
```

Create `hooks/usePinPolicy.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPinPolicyOverrides,
  setPinPolicyOverride,
} from '@/database/pin-policy';
import type { PinActionId } from '@/lib/auth/pin-actions';

const pinPolicyKey = ['pinPolicy'] as const;

export const usePinPolicy = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: pinPolicyKey,
    queryFn: getPinPolicyOverrides,
  });
  const mutation = useMutation({
    mutationFn: ({ id, enabled }: { id: PinActionId; enabled: boolean }) =>
      setPinPolicyOverride(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: pinPolicyKey }),
  });
  return {
    overrides: query.data ?? {},
    isLoading: query.isLoading,
    setOverride: mutation.mutateAsync,
  };
};
```

Create `components/settings/PinPolicyCard.tsx`:

```tsx
import { Pressable, Switch, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements/StyledText';
import { usePinPolicy } from '@/hooks/usePinPolicy';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores';
import {
  PIN_ACTIONS,
  type PinAction,
  type PinActionId,
  type PinActionRisk,
} from '@/lib/auth/pin-actions';

const GROUPS: PinActionRisk[] = ['high', 'low', 'locked'];

export const PinPolicyCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const addToast = useToastStore((s) => s.addToast);
  const isPinConfigured = useAuthStore((s) => s.isPinConfigured);
  const { runWithPinGuard } = useOwnerPinGuard();
  const { overrides, setOverride } = usePinPolicy();

  const save = async (id: PinActionId, enabled: boolean) => {
    try {
      await setOverride({ id, enabled });
    } catch {
      addToast({ message: t('save_failed'), variant: 'danger' });
    }
  };

  const toggle = (action: PinAction, next: boolean) => {
    void runWithPinGuard({
      actionId: 'pin_policy_change',
      title: t('pin_policy.guard_title'),
      actionDescription: t('pin_policy.guard_desc'),
      onApproved: () => save(action.id as PinActionId, next),
    });
  };

  return (
    <View>
      {GROUPS.map((risk) => (
        <View key={risk}>
          <StyledText
            variant="semibold"
            className="px-4 pt-3 pb-1 text-xs text-ink-500 uppercase"
          >
            {t(`pin_policy.group_${risk}`)}
          </StyledText>
          {PIN_ACTIONS.filter((a) => a.risk === risk).map((action) => {
            const locked = action.risk === 'locked';
            const reviewed = action.id in overrides;
            const value = overrides[action.id] ?? action.defaultEnabled;
            return (
              <View
                key={action.id}
                style={{ minHeight: 56 }}
                className="px-4 py-3 flex-row items-center border-t border-paper-300"
              >
                <View className="flex-1 mr-3">
                  <StyledText
                    variant="semibold"
                    className="text-sm text-ink-700"
                  >
                    {t(action.labelKey)}
                  </StyledText>
                  {locked ? (
                    <StyledText
                      variant="regular"
                      className="text-xs text-ink-500 mt-0.5"
                    >
                      {t('pin_policy.locked')}
                    </StyledText>
                  ) : null}
                </View>
                {!locked && !reviewed ? (
                  <Pressable
                    testID={`pin-policy-new-${action.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={t('pin_policy.keep_default_a11y')}
                    onPress={() =>
                      void save(action.id as PinActionId, action.defaultEnabled)
                    }
                    className="px-2 py-1 mr-3 rounded-full bg-persimmon-50"
                  >
                    <StyledText
                      variant="semibold"
                      className="text-xs text-persimmon-600"
                    >
                      {t('pin_policy.new_badge')}
                    </StyledText>
                  </Pressable>
                ) : null}
                {locked ? (
                  <FontAwesome name="lock" size={16} color="#7A7165" />
                ) : (
                  <Switch
                    testID={`pin-policy-switch-${action.id}`}
                    value={value}
                    disabled={!isPinConfigured}
                    accessibilityLabel={t(action.labelKey)}
                    onValueChange={(next) => toggle(action, next)}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
      {!isPinConfigured ? (
        <StyledText
          variant="regular"
          className="px-4 py-3 text-sm text-ink-600 border-t border-paper-300"
        >
          {t('pin_policy.requires_pin')}
        </StyledText>
      ) : null}
    </View>
  );
};
```

Decision recorded: pressing the "New" badge saves the registry default without a PIN, because the stored value equals what already applies, so no protection changes.

- [ ] **Step 4: Add i18n strings**

In `locales/en/settings.json` add this top-level key after the `biometrics` block (add a comma after the previous block):

```json
  "pin_policy": {
    "section": "PIN approvals",
    "intro": "Choose which owner actions ask for your PIN. Locked actions always ask.",
    "requires_pin": "Set up an Owner PIN to change these.",
    "new_badge": "New",
    "keep_default_a11y": "Keep the default for this action",
    "locked": "Always requires PIN",
    "group_high": "Sensitive",
    "group_low": "Everyday",
    "group_locked": "Always protected",
    "guard_title": "Change PIN approvals",
    "guard_desc": "Change which actions need your PIN",
    "actions": {
      "sale_void": "Void a sale",
      "sale_refund": "Refund a sale",
      "sale_price_correction": "Correct sale prices",
      "stock_adjustment": "Adjust stock",
      "delivery_receipt_void": "Void a delivery receipt",
      "credit_limit_override": "Override a credit limit",
      "backup_restore": "Restore a backup",
      "drive_unlink": "Unlink Google Drive",
      "pin_change": "Change Owner PIN",
      "pin_policy_change": "Change PIN approvals"
    }
  }
```

In `locales/tl/settings.json` add the same structure:

```json
  "pin_policy": {
    "section": "Mga kailangan ng PIN",
    "intro": "Piliin kung aling mga aksyon ng may-ari ang hihingi ng PIN. Laging hihingi ang mga naka-lock.",
    "requires_pin": "Mag-set up muna ng Owner PIN para mabago ito.",
    "new_badge": "Bago",
    "keep_default_a11y": "Panatilihin ang default para sa aksyong ito",
    "locked": "Laging kailangan ng PIN",
    "group_high": "Sensitibo",
    "group_low": "Araw-araw",
    "group_locked": "Laging protektado",
    "guard_title": "Baguhin ang mga kailangan ng PIN",
    "guard_desc": "Baguhin kung aling mga aksyon ang kailangan ng PIN",
    "actions": {
      "sale_void": "I-void ang benta",
      "sale_refund": "I-refund ang benta",
      "sale_price_correction": "Itama ang presyo ng benta",
      "stock_adjustment": "Ayusin ang stock",
      "delivery_receipt_void": "I-void ang delivery receipt",
      "credit_limit_override": "Lampasan ang credit limit",
      "backup_restore": "I-restore ang backup",
      "drive_unlink": "I-unlink ang Google Drive",
      "pin_change": "Palitan ang Owner PIN",
      "pin_policy_change": "Baguhin ang mga kailangan ng PIN"
    }
  }
```

- [ ] **Step 5: Mount the section and guard "Change Owner PIN"**

In `app/settings/settings.tsx` add the import `import { PinPolicyCard } from '@/components/settings/PinPolicyCard';` and insert after the Security section (after line 105):

```tsx
<SettingsSection
  title={t('settings:pin_policy.section')}
  subtitle={t('settings:pin_policy.intro')}
>
  <PinPolicyCard />
</SettingsSection>
```

In `components/settings/OwnerPinSettingsCard.tsx` add `import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';`, add `const { runWithPinGuard } = useOwnerPinGuard();` next to the other hooks, and change the "Change Owner PIN" button handler only:

```tsx
              onPress={() =>
                void runWithPinGuard({
                  actionId: 'pin_change',
                  title: t('pin.title'),
                  actionDescription: t('pin_policy.actions.pin_change'),
                  onApproved: () => router.push('/settings/owner-pin-setup'),
                })
              }
```

The first-time "Set Up Owner PIN" button and the recovery reset button stay unchanged.

- [ ] **Step 6: Run tests, typecheck, lint**

Run: `pnpm jest components/settings/__tests__/PinPolicyCard.test.tsx && pnpm typecheck && pnpm lint`
Expected: PASS, no type or lint errors.

- [ ] **Step 7: Commit**

```bash
git add database/pin-policy.ts hooks/usePinPolicy.ts components/settings/PinPolicyCard.tsx components/settings/__tests__/PinPolicyCard.test.tsx components/settings/OwnerPinSettingsCard.tsx app/settings/settings.tsx locales/en/settings.json locales/tl/settings.json
git commit -m "feat: add configurable PIN approvals settings and guard PIN change" -- database/pin-policy.ts hooks/usePinPolicy.ts components/settings/PinPolicyCard.tsx components/settings/__tests__/PinPolicyCard.test.tsx components/settings/OwnerPinSettingsCard.tsx app/settings/settings.tsx locales/en/settings.json locales/tl/settings.json
```

---

### Task 4: Verify and document

**Files:**

- Modify: `docs/activity-log.md` (append an entry; do not commit)

- [ ] **Step 1: Full verification**

Run: `pnpm verify`
Expected: typecheck clean, all Jest suites pass. Any failure unrelated to this work: report it, do not fix silently.

- [ ] **Step 2: Manual check on device or emulator**

1. Settings, "PIN approvals": new switches show "New" badges. Locked rows show a lock and no switch.
2. Turn off "Adjust stock", approve with PIN. Log an adjustment: no PIN prompt.
3. Turn it back on. Log an adjustment: PIN prompt appears.
4. Restore backup: always prompts, regardless of switches.
5. "Change Owner PIN" now prompts for the current PIN first.
6. With no PIN set: switches disabled with the hint.

- [ ] **Step 3: Log the change**

Append to `docs/activity-log.md`: what shipped, the files above, the decisions (locked core, "New" badge saves the default without a PIN, `pin_change` now guarded), and the pre-existing gap it closed. Do not commit this file.

---

## Self-Review

- **Spec coverage:** registry (Task 1), storage keys and no migration (Tasks 1, 3), guard resolution and fail closed (Tasks 1, 2), all seven call sites (Task 2), Settings section with locks, badges, PIN-gated toggles, disabled-without-PIN, failed-write toast, i18n en and tl (Task 3), testing list (Tasks 1 to 3). Locked `pin_change` is wired in Task 3.
- **Placeholders:** none.
- **Type consistency:** `PinActionId`, `PinAction`, `isPinRequired`, `parsePinOverrides`, `pinActionKey`, `usePinPolicy().setOverride({ id, enabled })` match across tasks. `action.id as PinActionId` casts in the card are needed because the card handles the wider `PinAction` type.
- **Review Focus:** every line maps to a test in Tasks 1 to 3. Mid-write double toggles are not covered; the switch is controlled by query state and the guard serializes through the modal.
