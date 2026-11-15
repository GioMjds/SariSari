# Owner PIN Policy: Configurable Approval Actions

Date: 2026-11-14
Status: Draft, awaiting owner review

## Goal

Let the store owner choose which actions require owner PIN approval. Ship safe defaults per action, protect destructive actions from being switched off, and make it cheap to add and recommend new guarded actions as the app grows.

## Decisions (agreed in brainstorming)

- Both directions: owner can turn the PIN off for low-risk actions and on for actions that are open today. Defaults ship per action; the owner overrides.
- Locked core: restore backup, unlink Google Drive, change PIN, and change PIN policy always require the PIN. They show as locked and cannot be toggled.
- Recommendations: a code registry with defaults and risk levels. Actions the owner has not reviewed show a "New" badge. No server involved.
- Storage: one `app_settings` row per action. No schema migration.

## Assumptions

- Toggles are unavailable until an owner PIN is configured.
- Existing `owner_pin_discount_threshold_pesos` and `owner_pin_discount_threshold_percent` settings are out of scope and keep working as they do today.
- Behavior for existing installs is unchanged: every action currently guarded keeps its guard by default.

## Design

### 1. Registry

New file `lib/auth/pin-actions.ts`, the single source of truth.

```ts
export type PinActionRisk = 'low' | 'high' | 'locked';

export interface PinAction {
  id: string;
  labelKey: string;
  risk: PinActionRisk;
  defaultEnabled: boolean;
}
```

Initial entries:

| id                      | risk   | default |
| ----------------------- | ------ | ------- |
| `sale_void`             | high   | on      |
| `sale_refund`           | high   | on      |
| `sale_price_correction` | high   | on      |
| `stock_adjustment`      | low    | on      |
| `delivery_receipt_void` | high   | on      |
| `credit_limit_override` | high   | on      |
| `backup_restore`        | locked | on      |
| `drive_unlink`          | locked | on      |
| `pin_change`            | locked | on      |
| `pin_policy_change`     | locked | on      |

Adding a new guarded action means adding one registry entry and passing its id at the call site.

### 2. Storage

Key `owner_pin_action.<id>` in `app_settings`, value `1` (PIN required) or `0` (PIN not required). A missing row means the owner has not reviewed the action: the registry default applies and the "New" badge shows. Locked actions never read the setting. Access goes through existing `getAppSetting` and `setAppSetting` in `database/settings.ts`, with two thin helpers in `database/auth.ts` or a new `database/pin-policy.ts`.

### 3. Guard change

`GuardOptions` in `components/auth/OwnerPinGuardProvider.tsx` gains a required `actionId`. `runWithPinGuard` resolves the policy first:

1. Locked action: continue to the PIN flow.
2. Otherwise read `owner_pin_action.<id>`, falling back to the registry default.
3. If not required: call `onApproved` directly, no modal.
4. If required: existing flow (setup if no PIN, biometric, then PIN challenge).

If the policy read fails, fail closed and require the PIN.

Existing call sites to update (title and description stay as they are):

- `app/(edit-forms)/sale-correction/[id].tsx` (`sale_void`, `sale_refund`)
- `components/sales/price-correction/usePriceCorrectionForm.ts`
- `components/inventory/ledger/LogTransactionForm.tsx`
- `app/(edit-forms)/delivery-receipt/[id].tsx`
- `components/utang/credit-guardrails/OverrideReasonModal.tsx`
- `components/settings/backup/LocalSnapshotsSection.tsx`
- `components/settings/backup/CloudBackupSection.tsx`

### 4. Settings UI

New section "PIN approvals" in `app/settings/settings.tsx`, rendered by a new `components/settings/PinPolicyCard.tsx` using existing `SettingsSection` primitives. Actions are grouped by risk. Each row has a label, a switch, a lock icon when locked, and a "New" badge when unreviewed. Toggling any action runs `runWithPinGuard` with `pin_policy_change`. Setting a value, including accepting the default, writes the row, which clears the badge. All strings go through i18n (`en` and `tl`).

## Error handling

- No PIN configured: switches are disabled with a hint to set a PIN.
- Setting write fails: revert the switch and show a toast.
- Unknown action id in storage: ignored.

## Testing

- Registry: ids unique, locked entries default on.
- Guard: off action skips the modal and calls `onApproved`; on action opens the flow; locked action ignores a stored `0`; policy read failure requires the PIN.
- Settings: toggle requires PIN; "New" badge clears after a write; locked rows have no switch.

## Out of scope

- Remote or server-driven catalog.
- Sari suggestion banner for newly added high-risk actions (possible later).
- Changes to the discount threshold settings.
