# Toast Revamp — Design

**Date:** 2026-06-22
**Status:** Approved (pending user review of written spec)
**Owner:** SariSari UI

## 1. Problem

The current toast implementation in `components/ui/Toast.tsx` is plain, dated, and ships with two real defects:

1. **Duplicate renderers.** `app/_layout.tsx` mounts both `ToastContainer` (from `Toast.tsx`) and `Sonner` (from `Sonner.tsx`). Both consume the same Zustand store. Callers that pass `position: 'top-*'` produce a visible toast at the top **and** a visible toast at the bottom. Callers that pass `position: 'bottom-*'` produce only the bottom toast. Behavior depends on the field the caller happened to set, which most don't think about.
2. **Broken exit animation.** `Toast.tsx` translates from `-150` to `0` on enter, but on exit it animates back to `-150` while remaining mounted, then is removed from the store. The result is a one-frame flash of the toast at the top of the screen just before it disappears.
3. **No design system alignment.** Colors use raw `bg-green-500`, `bg-red-500`, etc. (no use of the `persimmon`, `cinnamon`, `sage`, `paper-*`, or `semantic-*` tokens). The toast doesn't feel like part of the same app as the `ReceiptHero`, `MoneyText`, and inventory cards.
4. **No quality-of-life features.** No action button (e.g. "Undo" for destructive actions), no haptics, no progress indicator, no a11y labels, no reduced-motion support.

## 2. Goal

Replace both renderers with a single, well-designed toast component that:

- Is the **only** confirmation surface in the app (no duplicates).
- Visually matches the rest of the SariSari design system (paper aesthetic, brand-tinted icon chips, uppercase eyebrow labels).
- Supports a rich layout: icon chip + variant-derived eyebrow + message + optional action button + dismiss button.
- Uses Moti for a scale-in / fade-out feel that feels modern without being noisy.
- Fires appropriate haptics per variant.
- Honors reduced-motion accessibility settings.
- Survives a normal app-switch (Zustand state stays alive in JS context) and resets on a cold start (intentional — toasts are not persisted).

## 3. Non-goals

- **No persistence.** Toasts are not written to AsyncStorage. Backgrounded/killed apps do not replay queued toasts on return. (See §10 for the reasoning.)
- **No multi-position support.** The single supported position is top-center. `position` is dropped from the type. If a future feature needs a bottom toast, the field is re-introduced.
- **No swipe-to-dismiss.** The dismiss button and auto-expiry timer are the only dismiss paths.
- **No rich content.** Toasts take text only. No embedded images, progress bars, or custom JSX. (YAGNI — there are no current call sites that need this.)
- **No toast queue / history.** A toast fires, is visible for 4s (or until dismissed), and is gone. There is no "notification log."

## 4. Architecture

### Layering

The layering rule from `AGENTS.md` is preserved. Screens and hooks call the existing `useToastStore` action `addToast(...)`. The store mutates state. A single `<Toast />` component mounted in `app/_layout.tsx` subscribes to the store and renders the active list. No new cross-layer imports.

```
Screen / Hook
    │  addToast({ message, variant, action?, duration? })
    ▼
useToastStore  (Zustand)
    │  sets state.toasts, fires haptics, schedules auto-dismiss timer
    ▼
<Toast />  (mounted once in app/_layout.tsx)
    │  subscribes to state.toasts
    ▼
MotiView per toast → icon chip + eyebrow + message + action + dismiss
```

### File changes

| File | Change |
|---|---|
| `components/ui/Toast.tsx` | **Full rewrite.** Single renderer. Moti-powered. Rich layout. |
| `components/ui/Sonner.tsx` | **Delete.** Duplicate renderer, no longer needed. |
| `components/ui/index.ts` | Remove `Sonner` export. Keep `Toast`. |
| `app/_layout.tsx` | Mount `<Toast />` once. Remove `<Sonner />`. |
| `stores/ToastStore.ts` | Drop `position` handling. Add `action` shape. Per-toast timer stored in a `WeakMap`. Default duration raised to 4000ms. Haptics fire on add. |
| `types/ui/Toast.types.ts` | Drop `position`. Add `action?: { label: string; onPress: () => void }`. Allow `duration: 0` for sticky toasts. |
| `components/ui/__tests__/Toast.test.tsx` | **New.** 13 test cases (see §9). |
| `hooks/useProducts.tsx`, `useCategories.tsx`, `useInventory.tsx`, `useCredits.tsx`, `app/(tabs)/index.tsx`, `app/onboarding/index.tsx` | **Mechanical edit.** Remove `position: 'top-center',` from every `addToast({...})` call. No other changes. |

### Renderer structure

```tsx
// components/ui/Toast.tsx — outline
export const Toast = () => {
  const toasts = useToastStore(s => s.toasts);
  const removeToast = useToastStore(s => s.removeToast);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingTop: insets.top + 12,
        zIndex: 9999,
        alignItems: 'center',
      }}
    >
      {toasts.map((t, i) => (
        <ToastItem
          key={t.id}
          toast={t}
          index={i}
          onDismiss={removeToast}
        />
      ))}
    </View>
  );
};
```

Each `ToastItem` wraps its content in a `MotiView` (entrance + exit) and computes its own `translateY` from its index for the stacking shift.

## 5. Visual specification

### Container

- `bg-paper-50` (`#FBF7EE`)
- `border border-paper-300` (`#E5D8BC`), 1px
- `rounded-2xl` (16px)
- `shadow-paper-lift` (layered warm-tone drop shadow)
- `padding 14px 16px`, `gap 12px`
- Width: `min(560px, screen - 32)`, centered with `mx-4`
- Min height ~52px (message only) / ~64px (with action)

### Skeleton (all variants)

```
┌────────────────────────────────────────────────────────────────┐
│  ┌────┐   EYEBROW                                              │
│  │ 36 │   Message body, ink-700, semibold, 14px                │
│  │ px │   (max 2 lines, ellipsized)                            │
│  └────┘                                          [ACTION]  [✕] │
└────────────────────────────────────────────────────────────────┘
```

- Icon chip: 36px circular, variant-tinted bg
- Icon: `FontAwesome` 18px, variant-tinted stroke
- Eyebrow: 11px, `font-bold`, `letter-spacing: 0.14em`, uppercase
- Message: 14px, `font-semibold` (StackSansText-SemiBold), `text-ink-700`, `numberOfLines: 2`
- Action button (optional): right of message, 12px bold uppercase, transparent bg, 1px border in variant accent at 35% opacity, `rounded-lg` (10px)
- Dismiss: 24×24 hit area (8px hitSlop), `FontAwesome` "times" 14px, `text-ink-300`, `active:opacity-60`

### Per-variant mapping

| Variant | Icon (FA) | Chip bg | Icon stroke | Eyebrow text | Eyebrow color |
|---|---|---|---|---|---|
| `success` | `check-circle` | `bg-secondary-50` (`#EEF4E5`) | `#3D5E1B` (sage-600) | `SUCCESS` | `text-secondary-500` (`#4F7A24`) |
| `error` | `exclamation-circle` | `bg-red-50` (`#FFE3E3`) | `#C13030` | `ERROR` | `text-semantic-danger` (`#C13030`) |
| `info` | `info-circle` | `bg-blue-50` (`#DDE9F4`) | `#2E6FA8` | `INFO` | `text-semantic-info` (`#2E6FA8`) |
| `warning` | `warning` | `bg-amber-50` (`#FBE8C8`) | `#A35F00` | `WARNING` | `text-semantic-warning` (`#C77B0E`) |
| `default` | `bell` | `bg-paper-200` (`#EFE6D2`) | `#623418` (cinnamon-500) | `NOTICE` | `text-cinnamon-400` (`#8E4A23`) |

### Color rationale

- **Success** uses sage because the design system already uses sage-500 for "cash payment" — keeping the same hue for positive confirmations is consistent.
- **Error / Info / Warning** use semantic-* colors with a 50-tint background and a 700-tone stroke. High contrast, not garish.
- **Info / Warning** introduce `bg-blue-50` and `bg-amber-50` (Tailwind defaults). The design system does not have a dedicated info/warning ramp, and these standards read cleanly against the warm palette.
- **Default** uses paper / cinnamon — feels like a "house announcement," not a system alert.

## 6. Animation & motion

### Entrance

- Moti `from` → `animate` with `type: 'timing'`, `duration: 220ms`.
- Properties: `opacity 0 → 1`, `scale 0.96 → 1`, `translateY -8 → 0`.
- Easing: default ease-in-out. Calm, not snappy.

### Exit

- Moti `exit` with `type: 'timing'`, `duration: 160ms`.
- Properties: `opacity 1 → 0`, `scale 1 → 0.98`, `translateY 0 → -4`.
- Faster than entrance so the toast feels like it's "settling."

### Stacking

- Each toast's `translateY` is computed from its index: `index * 76` (toast height + 12 gap).
- Adding / removing a toast causes all visible toasts to animate to their new `translateY` over 220ms (Moti).
- Cap: 4 visible toasts. The 5th and beyond render at `translateY = -100` (off-screen above) and aren't laid out into the container. Prevents the toast column from covering half the screen.

### Haptics

Fired in `addToast` (one place, regardless of renderer):

| Variant | Haptic |
|---|---|
| `success` | `Haptics.notificationAsync(Success)` |
| `error` | `Haptics.notificationAsync(Error)` |
| `warning` | `Haptics.notificationAsync(Warning)` |
| `info` | none |
| `default` | none |

`expo-haptics` is already a dependency. No new packages.

### Reduced motion

`AccessibilityInfo.isReduceMotionEnabled` is checked on add. The result is stored as a non-enumerable flag on the toast (via `WeakMap`). The renderer reads it and short-circuits the Moti props: with reduced motion, both entrance and exit collapse to a 100ms opacity-only fade. No scale, no translate.

## 7. Types, store, and caller changes

### `types/ui/Toast.types.ts` (new)

```ts
export type ToastVariant = 'default' | 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;            // e.g. "UNDO", "RETRY"
  onPress: () => void;      // called when the action button is tapped
}

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;   // defaults to 'default'
  duration?: number;        // ms; 0 = sticky; default 4000
  action?: ToastAction;     // optional right-side action button
}
```

`position` is **dropped**. This is a TypeScript-level breaking change. The 6 call-site files all pass `position: 'top-center'` today; those lines are removed in this work (mechanical edit, see §4).

### `stores/ToastStore.ts` (rewrite)

```ts
import { Toast, ToastVariant } from '@/types/ui/Toast.types';
import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

const timerFor = new WeakMap<Toast, ReturnType<typeof setTimeout>>();

const hapticFor = (variant: ToastVariant) => {
  switch (variant) {
    case 'success': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'error':   return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    case 'warning': return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    default:        return Promise.resolve();
  }
};

interface State {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<State>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const variant = toast.variant || 'default';
    const duration = toast.duration ?? 4000;
    const newToast: Toast = { id, variant, duration, ...toast };

    set(s => ({ toasts: [...s.toasts, newToast] }));
    hapticFor(variant);

    if (duration > 0) {
      const t = setTimeout(() => get().removeToast(id), duration);
      timerFor.set(newToast, t);
    }

    return id;
  },

  removeToast: (id) => {
    set(s => {
      const t = s.toasts.find(x => x.id === id);
      if (t) {
        const pending = timerFor.get(t);
        if (pending) { clearTimeout(pending); timerFor.delete(t); }
      }
      return { toasts: s.toasts.filter(x => x.id !== id) };
    });
  },

  clearToasts: () => {
    for (const t of get().toasts) {
      const pending = timerFor.get(t);
      if (pending) { clearTimeout(pending); timerFor.delete(t); }
    }
    set({ toasts: [] });
  },
}));
```

### Caller updates (mechanical)

The 6 call-site files need only one change: remove the `position: 'top-center',` line from every `addToast({...})` invocation. ~40 sites, all the same pattern. No other call-site changes. Verified by the file table in §4.

## 8. Accessibility

- Container: `accessibilityLiveRegion="polite"`, `accessibilityRole="alert"`.
- Each toast: `accessibilityLabel` = `"<Variant>: <Message>"` (e.g. `"Success: Customer deleted successfully"`).
- Dismiss button: `accessibilityLabel="Dismiss notification"`.
- Action button: `accessibilityLabel={action.label}`.
- Reduced motion: honored as in §6.
- Touch targets: dismiss button is 24×24 with 8px hitSlop (40×40 effective). Action button is min 36px tall.

## 9. Testing

New file: `components/ui/__tests__/Toast.test.tsx`. Jest + `@testing-library/react-native` (existing in the test stack).

| # | Case | Asserts |
|---|---|---|
| 1 | Renders nothing when the store is empty | `<Toast />` returns `null` when `toasts.length === 0`. |
| 2 | Renders each variant with correct styling | 5 snapshot tests. Container bg = `paper-50`, chip bg matches variant, eyebrow text + color match variant. |
| 3 | `addToast` with no variant / duration uses defaults | Resulting toast has `variant: 'default'`, `duration: 4000`, eyebrow = "NOTICE". |
| 4 | Auto-dismisses after the duration | `addToast({ duration: 100 })` then `jest.advanceTimersByTime(150)` → toast removed from store. |
| 5 | Sticky toasts don't auto-dismiss | `addToast({ duration: 0 })` is still in the store after 10s of fake timers. |
| 6 | Manual dismiss clears the pending timer | `addToast({ duration: 1000 })` → `removeToast(id)` at 500ms → advance timers by another 1000ms → no errors, toast still gone. |
| 7 | Action button calls `onPress` and dismisses | Render toast with `action: { label: 'UNDO', onPress: mockFn }`, press action, assert `mockFn` called once, toast removed. |
| 8 | Action button error doesn't break dismissal | `onPress` throws → toast still removed, error logged, not surfaced. |
| 9 | Haptics fire on the right variants | Mock `expo-haptics`. Assert `notificationAsync(Success)` for success, `Error` for error, `Warning` for warning; not called for info / default. |
| 10 | Reduced motion collapses to opacity-only | Mock `isReduceMotionEnabled` → `true`. Rendered Moti props show `scale: 1`, `translateY: 0` from frame 0; only opacity animates. |
| 11 | Multiple toasts stack | `addToast` × 3 → all 3 in store, all 3 render. Container `zIndex: 9999` set. |
| 12 | A11y labels are correct | Container `accessibilityLiveRegion="polite"`, toast `accessibilityLabel="<Variant>: <Message>"`, dismiss `accessibilityLabel="Dismiss notification"`, action `accessibilityLabel={action.label}`. |
| 13 | `clearToasts` cancels all timers | `addToast` × 2, `clearToasts()`, advance timers past both durations → no errors. |

## 10. Persistence: explicitly out of scope

The store is in-memory. Toasts are not written to AsyncStorage. When the app comes back from background:

- **Normal app-switch (JS context alive):** Zustand state is preserved. Toasts that were visible stay visible; toasts that had already auto-expired stay gone. No replay of "missed" toasts.
- **Cold start (JS context killed):** Store is empty. Any toasts that would have fired during the killed period are lost.

This is intentional. Confirmation toasts are point-in-time feedback. Replaying a "Sale recorded" toast 30 seconds after the user saw it (because they took a phone call) is noise, not signal. Errors that need long-term visibility belong on a different surface (e.g. a sync-issues badge, a notification log), not in the toast system.

If a future feature needs toasts to survive backgrounding, the right move is to introduce a **persistent notification surface** (a "pending issues" list, a sync log), not to extend the toast. The toast is the wrong abstraction for that requirement.

**Future option (not implemented in this revamp):** sticky-when-action-is-set — error toasts with an `action` automatically get `duration: 0` so a RETRY button stays visible across normal app-switches. Documented here as a candidate, not a commitment.

## 11. Risks

| Risk | Mitigation |
|---|---|
| 6 call-site files need mechanical edits; easy to miss one | `pnpm tsc --noEmit` will surface any remaining `position:` field. Run as a CI gate before merging. |
| Existing test suite (if any) references `Sonner` or the old `position` field | Run full test suite; update imports. Expected to be small. |
| Moti version 0.30 may have API drift vs. examples online | Confirmed `moti` 0.30 is in `package.json`; the patterns in this spec (`from` / `animate` / `exit` / `transition`) match its current API. |
| `expo-haptics` not available in Expo Go (only in dev builds) | Confirmed by AGENTS.md: native modules like `expo-sqlite` already require dev builds. Adding `expo-haptics` follows the same pattern. No new constraint. |
| Stacking math (`index * 76`) breaks if toast heights vary | All toasts use the same internal padding + a 1-2 line message clamp. 76px is a safe upper bound. If we ever add long-message or with-image toasts, recompute. |
| `WeakMap<Toast, Timeout>` — toast object identity vs. re-renders | Verified: the toast object is *appended* to the array, not replaced, so its reference is stable across re-renders. The `WeakMap` key remains valid until the toast is removed. `removeToast` looks up the toast by id from `state.toasts`, retrieves the timer, and clears it. Safe. |

## 12. Out-of-scope follow-ups (not in this revamp)

- Sticky-when-action-is-set (see §10).
- Persistent notification surface for "errors that need attention later."
- Multi-position support if a future feature demands it.
- A toast "history" log accessible from a settings screen.
- Sonner-like stacking with collapse-on-overflow (this design caps at 4 and overflows above).
