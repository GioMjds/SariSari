---
title: Unified Sub-Tab Screen Shell
description: Consolidate the four per-tab layout scaffolds (Home, Sales, Inventory, Customers) behind one shared shell component, fix the RECOMMENDATIONS label cutout via horizontal scroll, and audit swipe-gesture parity.
type: design-spec
status: ready-for-review
date: 2026-08-12
---

## 1. Goal

Four tab layouts (`home`, `sales`, `inventory`, `customers`) currently duplicate the same scaffold — header component on top, sub-tab bar from `SubTabControl`, `TopTabs` (react-native-pager-view) below with `swipeEnabled: true`. The duplication invites drift (e.g., `inventory/_layout.tsx:79-83` vs `home/_layout.tsx:50-57` already have subtly different `TopTabs` configs) and makes the cutout / overflow class of bugs recur tab by tab.

This spec introduces one shared shell that owns the scaffold and a content slot, then migrates the four layouts to use it. It also fixes the **RECOMMENDATIONS** label cutout visible on the Inventory tab (the 5th label overflows the viewport because `SubTabControl` uses `flex-row gap-4` with no scroll fallback), and audits swipe-gesture parity across all four tabs.

The four existing `*Header.tsx` files stay untouched — they become the slot content. This is a shell-only unification, not a content-merge refactor.

## 2. Non-goals

- Merging the four `*Header.tsx` components into one. Each has tab-unique content (today's sales total, credit KPIs, store name + avatar, inventory banner) that benefits from per-file readability.
- Hoisting sub-tab navigation to `app/(tabs)/_layout.tsx`. Different tabs have different sub-tab sets; a global hoisted bar would need context-based config and over-couples the IA.
- Removing `app/(tabs)/inventory/analytics.tsx`. The IA roadmap flags it for deletion (`obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md:373`), but that's a separate refactor. We note the divergence and leave the file in place.
- Building a new gesture system. `react-native-pager-view` already powers `TopTabs` swipe with `swipeEnabled: true`; we only audit parity.

## 3. Architecture

```folder
components/
  layout/
    SubTabScreenShell.tsx       [NEW]
  navigation/
    SubTabControl.tsx           [MODIFIED — horizontal scroll]
  home/
    DashboardHeader.tsx         [MODIFIED — drop embedded SubTabControl]
  sales/
    SalesHeader.tsx             [MODIFIED — drop embedded SubTabControl]
  inventory/
    InventoryHeader.tsx         [DELETED — replaced by shell-owned bar]
  customers/
    CustomersHeader.tsx         [MODIFIED — drop embedded SubTabControl]
app/(tabs)/
  home/_layout.tsx              [MODIFIED — use shell]
  sales/_layout.tsx             [MODIFIED — use shell]
  inventory/_layout.tsx         [MODIFIED — use shell, remove InventoryHeader import]
  customers/_layout.tsx         [MODIFIED — use shell]
tests/
  components/layout/
    SubTabScreenShell.test.tsx  [NEW]
  components/navigation/
    SubTabControl.test.tsx      [NEW — assert scroll wraps]
```

The four `*Header.tsx` files become **content-only** presentation components rendered inside the shell's `topSlot`. Each currently embeds its own `<SubTabControl>` (`DashboardHeader.tsx:56`, `SalesHeader.tsx:43`, `CustomersHeader.tsx:42`). The shell becomes the sole owner of `<SubTabControl>`, so each header must drop its embedded bar and the `progress`, `onTabPress`, `activeTab`, `tabs`, and `SubTabItem`-related imports/props. The shell passes the active tab and progress to the bar. The `*Header` components keep their hero card / KPI / store-name content but no longer own navigation. `InventoryHeader.tsx` is a special case — it is currently a thin wrapper around `<SubTabControl>` with no other content. After this change it has no remaining responsibility, so the file is **deleted** and `inventory/_layout.tsx` mounts the bar through the shell directly.

## 4. Component shape

### 4.1 `SubTabScreenShell` (new)

```ts
// components/layout/SubTabScreenShell.tsx
import { ReactNode } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SharedValue } from 'react-native-reanimated';
import { SubTabControl, SubTabItem } from '@/components/navigation';

export interface SubTabScreenShellProps<T extends string> {
  /** Sub-tab definitions rendered in the top bar (left to right). */
  tabs: SubTabItem<T>[];
  /** Currently active sub-tab key. */
  activeTab: T;
  /** Called when the user taps a different sub-tab. */
  onTabPress: (tab: T) => void;
  /** Shared progress value from `useTabProgress` driving the underline tween. */
  progress: SharedValue<number>;
  /**
   * Header content rendered above the sub-tab bar. Pass `null` to suppress
   * the header entirely (e.g., detail screens where the per-tab header
   * is hidden). Accepts any ReactNode — typically the per-tab `*Header.tsx`
   * component or a fragment composing header + banner.
   */
  topSlot?: ReactNode;
  /** The TopTabs navigator with screens mounted as children. */
  children: ReactNode;
  /**
   * Tailwind className applied to the outermost container.
   * Default: `'flex-1 bg-paper-200'`.
   */
  containerClassName?: string;
}

export function SubTabScreenShell<T extends string>({
  tabs,
  activeTab,
  onTabPress,
  progress,
  topSlot,
  children,
  containerClassName = 'flex-1 bg-paper-200',
}: SubTabScreenShellProps<T>) {
  return (
    <View className={containerClassName}>
      <Stack.Screen options={{ headerShown: false }} />
      {topSlot}
      {tabs.length > 0 ? (
        <View className="bg-paper-200 px-4 pt-1 pb-2">
          <SubTabControl
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={onTabPress}
            progress={progress}
          />
        </View>
      ) : null}
      <View className="flex-1 bg-paper-200 relative">
        {children}
      </View>
    </View>
  );
}
```

**Why a `View` wrapper around `SubTabControl`:** Today each header brings its own padding (`pt-1 pb-2`, `pt-1 pb-3`, etc.). The shell standardizes to `bg-paper-200 px-4 pt-1 pb-2` and lets each `*Header` strip its own outer padding when migrated (one-line edit per header).

**Why `Stack.Screen options={{ headerShown: false }}`:** Currently set per-layout (e.g., `inventory/_layout.tsx:64`). Centralizing avoids each layout re-asserting it.

### 4.2 `SubTabControl` horizontal scroll (modified)

Today: `components/navigation/SubTabControl.tsx:190` renders `<View className="flex-row gap-4">` with each tab `flex-row items-center py-2.5`.

Change to:

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
>
  {tabs.map((tab, index) => { ... })}
</ScrollView>
```

Each tab's outer `Pressable` becomes `flex-shrink: 0` so labels render at natural width (no shrinking). The `onLayout` measurement pass (`SubTabControl.tsx:132-155`) already supports arbitrary widths — no change there. The underline's `interpolate` over `widths` and `xs` SharedValues continues to work for any number of tabs.

**Trade-off:** horizontal scroll trades "all tabs visible at once" for "no truncation." On a 5-tab Inventory bar on a narrow phone, tabs 1-3 fit and 4-5 are reachable by scroll. Users get a haptic-free hint that there's more (the indicator is hidden via `showsHorizontalScrollIndicator={false}`, but the visual cue of partial labels is preserved per platform convention).

### 4.3 Layout migrations

Each layout keeps its own data hooks and pathname → active-tab derivation. The render section collapses to a shell call.

**`app/(tabs)/home/_layout.tsx`:**

```tsx
return (
  <SubTabScreenShell<HomeSubTab>
    tabs={HOME_TAB_DEFS}
    activeTab={activeTab}
    onTabPress={handleTabPress}
    progress={progress}
    topSlot={
      <DashboardHeader
        storeName={storeName ?? ''}
        ownerInitials={ownerInitials ?? ''}
        showTopHeader={false}
      />
    }
  >
    <TopTabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        swipeEnabled: true,
        lazy: true,
        lazyPreloadDistance: 0,
      }}
      initialRouteName="overview"
    >
      <TopTabs.Screen name="overview" />
      <TopTabs.Screen name="today" />
    </TopTabs>
  </SubTabScreenShell>
);
```

`DashboardHeader` no longer accepts `activeTab`, `onTabPress`, or `progress` — those are owned by the shell.

**`app/(tabs)/sales/_layout.tsx`** — same shape, passes `<SalesHeader todayTotal={...} />` as `topSlot`, mounts `pos` and `receipts` screens. `SalesHeader` no longer accepts `activeTab`, `onTabPress`, `progress`.

**`app/(tabs)/inventory/_layout.tsx`** — passes `<StocktakeBanner />` as `topSlot` (the only inventory header content). `InventoryHeader.tsx` is deleted in this migration. The bar comes from the shell.

**`app/(tabs)/customers/_layout.tsx`** — passes `<CustomersHeader totalCustomers={...} />` as `topSlot`; the existing `TouchableOpacity` FAB stays outside the shell (it sits over the TopTabs area). `CustomersHeader` no longer accepts `activeTab`, `onTabPress`, `progress`.

### 4.4 Why the existing `*Header` files are passed in as `topSlot`

The four headers are 65, 115, 41, 145 lines respectively. Each owns tab-specific data (sales totals, credit KPIs, store name) and visual identity. Merging them into one would force a configuration object large enough to recreate them inline, with no readability win. Keeping them as discrete components and rendering inside the shell preserves their boundaries.

**Header content-only refactor:** each `*Header.tsx` currently embeds its own `<SubTabControl>` (`DashboardHeader.tsx:56`, `SalesHeader.tsx:43`, `CustomersHeader.tsx:42`). The shell becomes the sole owner, so each header must drop its embedded bar and the now-unused `SubTabItem`, `progress`, `activeTab`, `onTabPress`, `tabs` props. `InventoryHeader.tsx` becomes a no-op (it only renders the bar); the file is deleted and the shell-owned bar replaces it.

## 5. Data flow

```folder
SubTabScreenShell (props)
  ├── tabs          ← per-layout array of SubTabItem<T>
  ├── activeTab     ← derived from pathname (stays in each layout)
  ├── onTabPress    ← router.push handler (stays in each layout)
  ├── progress      ← useTabProgress(activeTab, tabs) — unchanged
  ├── topSlot       ← <DashboardHeader | SalesHeader | InventoryHeader | CustomersHeader>
  └── children      ← <TopTabs> with screens mounted
```

No state moves into the shell. The shell is purely structural. Each layout remains the owner of:

- which hooks it calls
- how `pathname` maps to `activeTab`
- which TopTabs screens to mount

This is the minimum coupling that still removes the scaffold duplication.

## 6. Swipe-gesture parity audit

Per `components/navigation/top-tabs.tsx` and the four layout files:

| Layout    | `swipeEnabled` | `lazy` | `lazyPreloadDistance` | `tabBarStyle`         | `initialRouteName` |
| --------- | -------------- | ------ | --------------------- | --------------------- | ------------------ |
| home      | true           | true   | 0                     | `{ display: 'none' }` | `overview`         |
| sales     | true           | true   | 0                     | `{ display: 'none' }` | `pos`              |
| inventory | true           | true   | 0                     | `{ display: 'none' }` | `products`         |
| customers | true           | true   | 0                     | `{ display: 'none' }` | `all`              |

All four match. **No parity changes needed.** The shell does not enforce a single `screenOptions` — each layout passes its own — but we document this audit here so future migrations don't accidentally regress any tab.

**Known crash:** `obsidian-vault/05-Bugs-Issues/inventory-navigation.md` documents an Android crash when swiping FROM the `Analytics` sub-tab. The IA roadmap flags `analytics.tsx` for deletion (`feature-implementation-status-and-ia.md:373`). Until that refactor lands, the crash surface remains — but it's pre-existing and not caused by this spec.

## 7. Error handling & edge cases

| Case                                | Behavior                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detail screens (no header)          | Pass `topSlot={null}`. Shell renders without header content.                                                                                                                                                                                                                                                              |
| Tab group with zero sub-tabs        | `tabs.length === 0` → shell renders no `SubTabControl`.                                                                                                                                                                                                                                                                   |
| `progress` SharedValue not provided | `SubTabControl` falls back to its internal animation (`SubTabControl.tsx:113-119`). Unchanged.                                                                                                                                                                                                                            |
| Header padding double-count         | **Optional polish (not required by this spec):** each `*Header.tsx` may strip its outer `bg-paper-200 px-4 pt-* pb-*` classes so the shell is the sole owner of background/padding. Leaving them in place is visually identical at the cost of one redundant style application. Follow-up if any visual artifact appears. |
| Horizontal scroll on RTL locales    | `ScrollView horizontal` flips automatically. The underline animation continues to read layout-derived `xs` values — no RTL regression.                                                                                                                                                                                    |

## 8. Testing

### 8.1 New: `tests/components/layout/SubTabScreenShell.test.tsx`

Renders the shell with a mocked `tabs` array and asserts:

- `topSlot` content appears above the sub-tab bar
- `SubTabControl` receives `tabs`, `activeTab`, `onTabPress`, `progress` props
- `children` (a `View` placeholder) appears below the sub-tab bar
- `containerClassName` is applied to the outer container
- When `topSlot` is `null`, no header element is rendered
- When `tabs` is empty, no sub-tab bar is rendered

### 8.2 New: `tests/components/navigation/SubTabControl.test.tsx`

(No existing test file for this component.) Add a test that renders with 5 long-label tabs in a viewport that overflows, asserts the outer container is a `ScrollView` with `horizontal` prop, and verifies all 5 tab labels render (none truncated).

### 8.3 Manual on-device

- Inventory tab: confirm all 5 sub-tabs render — `PRODUCTS`, `MOVEMENTS`, `STOCKTAKE`, `DAMAGED`, `RECOMMENDATIONS` — with the 5th reachable by horizontal scroll.
- Home, Sales, Customers tabs: confirm sub-tab bar still appears as before (no visual regression).
- All four tabs: confirm left/right swipe gestures still switch sub-tabs without crash.

## 9. Migration checklist

- [ ] Create `components/layout/SubTabScreenShell.tsx`.
- [ ] Modify `components/navigation/SubTabControl.tsx` — wrap `flex-row` in `ScrollView horizontal`.
- [ ] Delete `components/inventory/InventoryHeader.tsx` (its sole responsibility was the sub-tab bar).
- [ ] Modify `components/home/DashboardHeader.tsx` — drop embedded `SubTabControl` and `activeTab`/`onTabPress`/`progress`/`tabs` props.
- [ ] Modify `components/sales/SalesHeader.tsx` — drop embedded `SubTabControl` and `activeTab`/`onTabPress`/`progress` props.
- [ ] Modify `components/customers/CustomersHeader.tsx` — drop embedded `SubTabControl` and `activeTab`/`onTabPress`/`progress` props.
- [ ] Migrate `app/(tabs)/home/_layout.tsx` to use shell.
- [ ] Migrate `app/(tabs)/sales/_layout.tsx` to use shell.
- [ ] Migrate `app/(tabs)/inventory/_layout.tsx` to use shell (preserve `StocktakeBanner` as `topSlot`, remove `InventoryHeader` import).
- [ ] Migrate `app/(tabs)/customers/_layout.tsx` to use shell (preserve FAB).
- [ ] Add `tests/components/layout/SubTabScreenShell.test.tsx`.
- [ ] Add `tests/components/navigation/SubTabControl.test.tsx`.
- [ ] Manual on-device smoke across all four tabs.

## 10. Vault references

- IA roadmap: `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` (sections 5 and 7.2) — informs that `analytics.tsx` is on the IA delete list but stays in scope for this spec.
- Known crash: `obsidian-vault/05-Bugs-Issues/inventory-navigation.md` — referenced in §6.
- Sub-tab constants: `constants/tabs.ts:45-55` (`HOME_SUB_TABS`, `SALES_SUB_TABS`, `INVENTORY_SUB_TABS`, `CUSTOMERS_SUB_TABS`).
- Existing hook: `hooks/useTabProgress.ts`.
- Existing primitives: `components/navigation/SubTabControl.tsx`, `components/navigation/top-tabs.tsx`.
