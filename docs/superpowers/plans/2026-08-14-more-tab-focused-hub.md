# More Tab Focused Hub Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for
> inline execution or `superpowers:subagent-driven-development` for delegated
> execution. Follow `superpowers:test-driven-development` for every production
> change and `superpowers:verification-before-completion` before claiming
> completion.

**Goal:** Replace the development-only, app-wide More shortcut directory with
a production-ready four-destination owner hub: Cash & expenses, Reports &
insights, Backup & restore, and Settings & security.

**Architecture:** Keep `MoreHomeScreen` as a thin composition layer. It reads
today's financial totals and local snapshot metadata through existing TanStack
Query hooks, maps those queries into presentation props, and renders small
accessible components. Navigation is centralized in a typed route contract
with rapid-press protection and a shared deep-link fallback to More. Existing
backup components move from Settings into a dedicated route without changing
backup behavior.

**Tech stack:** Expo Router 6 typed routes, React Native 0.81, React 19,
NativeWind/Tailwind tokens, TanStack Query 5, i18next, Jest 29, and
`@testing-library/react-native`.

**Approved design:**
`docs/superpowers/specs/2026-08-14-more-tab-focused-hub-design.md`

**Vault context:**
`obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` and
`obsidian-vault/CONTEXT.md`. The approved spec records the product decision to
use the active financial ledger rather than restoring legacy cash sessions.

## Global execution constraints

- Preserve the uncommitted user changes currently present in:
  - `app/(edit-forms)/cash-entry/index.tsx`
  - `app/(edit-forms)/cash-session/index.tsx`
  - `app/(edit-forms)/sale-details/[id].tsx`
  - `components/cash-session/OpenSessionView.tsx`
  - `obsidian-vault/01-roadmap/feature-implementation-status-and-ia.md`
  - `obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md`
  - `obsidian-vault/09-Marketing/calendar/2026-08-14-stocktake-build-story-linkedin.md`
- Never stage those files. Before every commit, run `git diff --cached
--name-only` and confirm it contains only files named by the current task.
- Do not modify SQLite schema, financial calculations, backup behavior, or
  legacy cash-session behavior.
- Use `getTodayDateString()` for the local business date,
  `useFinancialTotals(today, today)` for card totals, and
  `useLocalSnapshots()` for offline backup metadata.
- Use only current paper, ink, cinnamon, persimmon, and Stack Sans tokens.
  Vector-icon `color` props may use the exact matching Tailwind token value at
  that API boundary; do not introduce new colors.
- Keep `MORE_SUB_TABS` empty.
- Do not commit generated `.expo/` route declarations.

---

## Task 1: Lock the bilingual content contract

**Files:**

- Create: `tests/moreLocalization.test.ts`
- Modify: `locales/en/common.json`
- Modify: `locales/tl/common.json`

### Step 1: Write the failing localization contract test

Create a test that imports both JSON resources and defines the exact keys the
new hub and Backup route require:

```ts
import en from '@/locales/en/common.json';
import tl from '@/locales/tl/common.json';

const REQUIRED_MORE_KEYS = [
  'moreHomeEyebrow',
  'moreHomeTitle',
  'moreHomeSubtitle',
  'moreHomeCashLabel',
  'moreHomeCashLoading',
  'moreHomeCashEmpty',
  'moreHomeCashSummary',
  'moreHomeCashError',
  'moreHomeCashOpenAction',
  'moreHomeCashReviewAction',
  'moreHomeCashCheckAction',
  'moreHomeCashHint',
  'moreHomeReportsLabel',
  'moreHomeReportsSub',
  'moreHomeReportsHint',
  'moreHomeStoreDataSection',
  'moreHomeBackupLabel',
  'moreHomeBackupLoading',
  'moreHomeBackupEmpty',
  'moreHomeBackupLatest',
  'moreHomeBackupError',
  'moreHomeBackupHint',
  'moreHomeSettingsLabel',
  'moreHomeSettingsSub',
  'moreHomeSettingsHint',
  'moreBackA11y',
  'backupTitle',
  'backupSubtitle',
  'backupCloudSection',
  'backupCloudSectionSub',
  'backupLocalSection',
  'backupLocalSectionSub',
] as const;

describe('More localization contract', () => {
  it.each(REQUIRED_MORE_KEYS)('defines %s in English and Tagalog', (key) => {
    expect(en).toHaveProperty(key);
    expect(tl).toHaveProperty(key);
    expect(en[key]).not.toHaveLength(0);
    expect(tl[key]).not.toHaveLength(0);
  });

  it('keeps interpolation placeholders aligned', () => {
    expect(en.moreHomeCashSummary).toContain('{{expenses}}');
    expect(en.moreHomeCashSummary).toContain('{{drawings}}');
    expect(tl.moreHomeCashSummary).toContain('{{expenses}}');
    expect(tl.moreHomeCashSummary).toContain('{{drawings}}');
    expect(en.moreHomeBackupLatest).toContain('{{when}}');
    expect(tl.moreHomeBackupLatest).toContain('{{when}}');
  });
});
```

### Step 2: Run the test and verify RED

Run:

```powershell
pnpm test -- --runInBand tests/moreLocalization.test.ts
```

Expected: FAIL because the new keys do not exist yet.

### Step 3: Add the English copy

Update existing matching keys and add the missing keys in
`locales/en/common.json`; never create duplicate JSON properties. Use the
approved copy:

```json
"moreHomeEyebrow": "Store tools",
"moreHomeTitle": "More",
"moreHomeSubtitle": "Manage the day, understand the store, and keep your data safe.",
"moreHomeCashLabel": "Cash & expenses",
"moreHomeCashLoading": "Checking today's movements",
"moreHomeCashEmpty": "No expenses or owner drawings recorded today",
"moreHomeCashSummary": "Expenses {{expenses}} · Owner drawings {{drawings}}",
"moreHomeCashError": "Open to check today's expenses and owner drawings",
"moreHomeCashOpenAction": "Open cash",
"moreHomeCashReviewAction": "Review cash",
"moreHomeCashCheckAction": "Check cash",
"moreHomeCashHint": "Opens today's expenses and owner drawings",
"moreHomeReportsLabel": "Reports & insights",
"moreHomeReportsSub": "Sales, stock, suki, and cash trends",
"moreHomeReportsHint": "Opens consolidated store reports",
"moreHomeStoreDataSection": "Store & data",
"moreHomeBackupLabel": "Backup & restore",
"moreHomeBackupLoading": "Checking local backup",
"moreHomeBackupEmpty": "No backup yet",
"moreHomeBackupLatest": "Latest local backup: {{when}}",
"moreHomeBackupError": "Check backup status",
"moreHomeBackupHint": "Opens local and Google Drive backup tools",
"moreHomeSettingsLabel": "Settings & security",
"moreHomeSettingsSub": "Store, language, Owner PIN, and preferences",
"moreHomeSettingsHint": "Opens store settings and security",
"moreBackA11y": "Back to More",
"backupTitle": "Backup & restore",
"backupSubtitle": "Protect your store data on this device and in Google Drive.",
"backupCloudSection": "Google Drive",
"backupCloudSectionSub": "Link, sync, and manage your cloud copy",
"backupLocalSection": "This device",
"backupLocalSectionSub": "Create and restore rolling local snapshots"
```

Do not delete old More keys yet because the old screen still consumes them.

### Step 4: Add natural Tagalog copy

Update existing matching keys and add the missing keys in
`locales/tl/common.json`; never create duplicate JSON properties. Keep
interpolation tokens identical. Use natural, wrapping-friendly copy rather
than literal word order:

```json
"moreHomeEyebrow": "Mga gamit ng tindahan",
"moreHomeTitle": "Iba pa",
"moreHomeSubtitle": "Asikasuhin ang araw, unawain ang tindahan, at panatilihing ligtas ang iyong data.",
"moreHomeCashLabel": "Kaha at gastos",
"moreHomeCashLoading": "Tinitingnan ang galaw ngayong araw",
"moreHomeCashEmpty": "Walang gastos o kuha ng may-ari na naitala ngayong araw",
"moreHomeCashSummary": "Gastos {{expenses}} · Kuha ng may-ari {{drawings}}",
"moreHomeCashError": "Buksan para tingnan ang gastos at kuha ng may-ari ngayon",
"moreHomeCashOpenAction": "Buksan ang kaha",
"moreHomeCashReviewAction": "Suriin ang kaha",
"moreHomeCashCheckAction": "Tingnan ang kaha",
"moreHomeCashHint": "Binubuksan ang gastos at kuha ng may-ari ngayong araw",
"moreHomeReportsLabel": "Mga ulat at insight",
"moreHomeReportsSub": "Takbo ng benta, stock, suki, at kaha",
"moreHomeReportsHint": "Binubuksan ang pinagsamang ulat ng tindahan",
"moreHomeStoreDataSection": "Tindahan at data",
"moreHomeBackupLabel": "Backup at pag-restore",
"moreHomeBackupLoading": "Tinitingnan ang lokal na backup",
"moreHomeBackupEmpty": "Wala pang backup",
"moreHomeBackupLatest": "Pinakabagong lokal na backup: {{when}}",
"moreHomeBackupError": "Tingnan ang status ng backup",
"moreHomeBackupHint": "Binubuksan ang lokal at Google Drive na backup",
"moreHomeSettingsLabel": "Mga setting at seguridad",
"moreHomeSettingsSub": "Tindahan, wika, Owner PIN, at mga preference",
"moreHomeSettingsHint": "Binubuksan ang setting at seguridad ng tindahan",
"moreBackA11y": "Bumalik sa Iba pa",
"backupTitle": "Backup at pag-restore",
"backupSubtitle": "Protektahan ang data ng tindahan sa device na ito at sa Google Drive.",
"backupCloudSection": "Google Drive",
"backupCloudSectionSub": "I-link, i-sync, at pamahalaan ang cloud copy",
"backupLocalSection": "Device na ito",
"backupLocalSectionSub": "Gumawa at mag-restore ng mga lokal na snapshot"
```

### Step 5: Run the test and verify GREEN

Run:

```powershell
pnpm test -- --runInBand tests/moreLocalization.test.ts
```

Expected: PASS.

### Step 6: Commit only the localization contract

```powershell
git add -- tests/moreLocalization.test.ts locales/en/common.json locales/tl/common.json
git diff --cached --name-only
git diff --cached --check
git commit -m "test: define focused More tab copy"
```

---

## Task 2: Create the Backup route and shared More navigation

**Files:**

- Create: `components/more/moreNavigation.ts`
- Create: `components/more/useMoreDestinationNavigation.ts`
- Create: `components/more/useScreenHeadingFocus.ts`
- Create: `components/more/MoreDetailHeader.tsx`
- Create: `components/settings/SettingsPrimitives.tsx`
- Create: `app/(tabs)/more/backup.tsx`
- Create: `components/more/__tests__/moreNavigation.test.tsx`
- Create: `components/more/__tests__/MoreDetailHeader.test.tsx`
- Create: `app/(tabs)/more/__tests__/backupSettingsSplit.test.tsx`
- Modify: `app/(tabs)/more/settings.tsx`
- Modify: `components/more/index.ts`

### Step 1: Write failing navigation tests

Test the canonical typed destinations, deep-link fallback, and the rapid-press
lock. Mock the static Expo Router object locally:

```tsx
const mockRouter = {
  navigate: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

import { act, renderHook } from '@testing-library/react-native';
import { MORE_ROUTES, goBackToMore } from '@/components/more/moreNavigation';
import { useMoreDestinationNavigation } from '@/components/more/useMoreDestinationNavigation';

describe('More navigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => jest.useRealTimers());

  it('falls back to More when a deep link has no history', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    goBackToMore();
    expect(mockRouter.replace).toHaveBeenCalledWith(MORE_ROUTES.home);
  });

  it('uses normal back navigation when history exists', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    goBackToMore();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('ignores rapid duplicate destination presses', () => {
    const { result } = renderHook(() => useMoreDestinationNavigation());
    act(() => {
      result.current(MORE_ROUTES.reports);
      result.current(MORE_ROUTES.reports);
    });
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(500));
    act(() => result.current(MORE_ROUTES.reports));
    expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
  });
});
```

### Step 2: Run the navigation test and verify RED

```powershell
pnpm test -- --runInBand components/more/__tests__/moreNavigation.test.tsx
```

Expected: FAIL because the navigation modules do not exist.

### Step 3: Implement the typed route contract and fallback

In `components/more/moreNavigation.ts`:

```ts
import { type Href, router } from 'expo-router';

export const MORE_ROUTES = {
  home: '/(tabs)/more',
  cash: '/(tabs)/more/cash-entries',
  reports: '/(tabs)/more/reports',
  backup: '/(tabs)/more/backup',
  settings: '/(tabs)/more/settings',
} as const satisfies Record<string, Href>;

export type MoreDestination =
  | typeof MORE_ROUTES.cash
  | typeof MORE_ROUTES.reports
  | typeof MORE_ROUTES.backup
  | typeof MORE_ROUTES.settings;

export function goBackToMore(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(MORE_ROUTES.home);
}
```

In `components/more/useMoreDestinationNavigation.ts`, use a ref and a 500ms
fallback timer. Clear the timer on unmount:

```ts
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import type { MoreDestination } from './moreNavigation';

const NAVIGATION_LOCK_MS = 500;

export function useMoreDestinationNavigation() {
  const lockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback((destination: MoreDestination) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    router.navigate(destination);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      timerRef.current = null;
    }, NAVIGATION_LOCK_MS);
  }, []);
}
```

### Step 4: Write the failing Backup/Settings split test

In `backupSettingsSplit.test.tsx`, locally mock the backup sections, profile
hook, language dialog, Owner PIN card, and Expo Router. Render both routes and
assert separation:

```tsx
it('hosts both backup tools only on the Backup route', () => {
  const backup = render(<BackupScreen />);
  expect(backup.getByTestId('cloud-backup-section')).toBeTruthy();
  expect(backup.getByTestId('local-snapshots-section')).toBeTruthy();
  backup.unmount();

  const settings = render(<SettingsScreen />);
  expect(settings.queryByTestId('cloud-backup-section')).toBeNull();
  expect(settings.queryByTestId('local-snapshots-section')).toBeNull();
  expect(settings.getByTestId('owner-pin-settings')).toBeTruthy();
});
```

Initialize i18n in `beforeAll`. Return simple test-ID Views from the child
component mocks so the test does not exercise OAuth or snapshot I/O.

### Step 5: Run the split test and verify RED

```powershell
pnpm test -- --runInBand "app/(tabs)/more/__tests__/backupSettingsSplit.test.tsx"
```

Expected: FAIL because `backup.tsx` does not exist and Settings still renders
both backup sections.

### Step 6: Extract reusable Settings primitives

Move the current local `SettingsSection` and `SettingsRow` implementations from
`app/(tabs)/more/settings.tsx` into
`components/settings/SettingsPrimitives.tsx`. Preserve their current visual
behavior, but add button role, label, and optional hint to interactive rows:

```tsx
import type { ReactNode } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

export type SettingsSectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  subtitle,
  children,
}: SettingsSectionProps) {
  return (
    <View className="px-5 mt-6">
      {title ? (
        <StyledText
          variant="extrabold"
          className="text-xs uppercase text-ink-400 mb-1"
          style={{ letterSpacing: 1.2 }}
        >
          {title}
        </StyledText>
      ) : null}
      {subtitle ? (
        <StyledText variant="regular" className="text-xs text-ink-500 mb-2">
          {subtitle}
        </StyledText>
      ) : null}
      <View className="bg-paper-50 rounded-2xl border border-paper-300 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export type SettingsRowProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: keyof typeof FontAwesome.glyphMap;
  accessibilityHint?: string;
  interactive?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  label,
  value,
  subtitle,
  icon,
  accessibilityHint,
  interactive = false,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={interactive ? label : undefined}
      accessibilityHint={interactive ? accessibilityHint : undefined}
      style={{ minHeight: 48 }}
      className="px-4 py-3 border-b border-paper-300 last:border-b-0 flex-row items-center active:opacity-80"
    >
      {icon ? (
        <View className="w-10 h-10 rounded-full bg-paper-100 items-center justify-center mr-3">
          <FontAwesome name={icon} size={16} color="#564E45" />
        </View>
      ) : null}
      <View className="flex-1">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {label}
        </StyledText>
        <StyledText variant="regular" className="text-sm text-ink-500 mt-0.5">
          {value}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" className="text-xs text-ink-500 mt-1">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
      {interactive ? (
        <FontAwesome name="chevron-right" size={14} color="#7A7165" />
      ) : null}
    </Pressable>
  );
}
```

### Step 7: Add the shared detail header

Create `MoreDetailHeader.tsx` with title, subtitle, `onBack`, and
`backAccessibilityLabel` props. Always render the 48dp back control so a deep
link can use the fallback:

```tsx
<Pressable
  onPress={onBack}
  accessibilityRole="button"
  accessibilityLabel={backAccessibilityLabel}
  hitSlop={8}
  style={{ minWidth: 48, minHeight: 48 }}
  className="items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
>
  <FontAwesome name="arrow-left" size={16} color="#FAFAF7" />
</Pressable>
```

Keep title and subtitle containers flexible; do not set fixed heights or
`numberOfLines`.

Create `useScreenHeadingFocus.ts` so destination screens can focus their main
heading after route navigation:

```ts
import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  type View,
} from 'react-native';

export function useScreenHeadingFocus() {
  const headingRef = useRef<View>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reactTag = findNodeHandle(headingRef.current);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return headingRef;
}
```

Attach that ref to an `accessible` View wrapping the detail title and set
`accessibilityRole="header"`. Add `MoreDetailHeader.test.tsx` to verify the
header role, Back label/callback, wrapped subtitle, and a mocked
`AccessibilityInfo.setAccessibilityFocus` call after the animation frame.

### Step 8: Build the dedicated Backup route

Create `app/(tabs)/more/backup.tsx`:

```tsx
export default function BackupScreen() {
  const { t } = useTranslation();
  const bottomOffset = useTabBarBottomOffset();

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('common:backupTitle')}
        subtitle={t('common:backupSubtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection
          title={t('common:backupCloudSection')}
          subtitle={t('common:backupCloudSectionSub')}
        >
          <CloudBackupSection />
        </SettingsSection>
        <SettingsSection
          title={t('common:backupLocalSection')}
          subtitle={t('common:backupLocalSectionSub')}
        >
          <LocalSnapshotsSection />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
```

Import `useTabBarBottomOffset` from `@/components/layout`. Do not change either
backup child component or its hooks.

### Step 9: Remove Backup from Settings

Update `app/(tabs)/more/settings.tsx` to:

- import the extracted `SettingsSection` and `SettingsRow`;
- remove `CloudBackupSection` and `LocalSnapshotsSection` imports;
- remove the Database section;
- use `MoreDetailHeader` and `goBackToMore`;
- use `useTabBarBottomOffset() + 16` rather than a hard-coded 96px bottom
  padding;
- retain Store, Language, and Owner PIN content unchanged.

### Step 10: Regenerate the typed route declaration

Start Expo once after `backup.tsx` exists, wait until Metro reports ready, then
stop it:

```powershell
npm expo start --offline
```

Confirm `.expo/types/router.d.ts` contains `more/backup`. Do not stage `.expo`.

### Step 11: Run tests and typecheck for GREEN

```powershell
pnpm test -- --runInBand components/more/__tests__/moreNavigation.test.tsx components/more/__tests__/MoreDetailHeader.test.tsx "app/(tabs)/more/__tests__/backupSettingsSplit.test.tsx"
pnpm typecheck
```

Expected: PASS.

### Step 12: Commit only the route split and navigation foundation

```powershell
git add -- "app/(tabs)/more/backup.tsx" "app/(tabs)/more/settings.tsx" "app/(tabs)/more/__tests__/backupSettingsSplit.test.tsx" components/more/moreNavigation.ts components/more/useMoreDestinationNavigation.ts components/more/useScreenHeadingFocus.ts components/more/MoreDetailHeader.tsx components/more/__tests__/moreNavigation.test.tsx components/more/__tests__/MoreDetailHeader.test.tsx components/more/index.ts components/settings/SettingsPrimitives.tsx
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: split backup into More destination"
```

---

## Task 3: Build the accessible More presentation components

**Files:**

- Create: `components/more/CashSummaryFeatureCard.tsx`
- Create: `components/more/MoreDestinationRow.tsx`
- Create: `components/more/MoreScreenHeader.tsx`
- Create: `components/more/MoreSection.tsx`
- Create: `components/more/__tests__/CashSummaryFeatureCard.test.tsx`
- Create: `components/more/__tests__/MoreDestinationRow.test.tsx`
- Modify: `components/more/index.ts`

### Step 1: Write failing Cash card state tests

Define a discriminated state type in the component API:

```ts
export type CashSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      paidExpenses: Pesos;
      ownerDrawings: Pesos;
    };
```

The tests must cover:

- loading copy and `Open cash` action;
- ready with two zero totals and the valid empty copy;
- ready with expenses only;
- ready with owner drawings only;
- ready with both totals, including `formatPesos` output;
- query error copy and `Check cash` action;
- one semantic button with an accessible label containing the visible state and
  action;
- pressing anywhere on the card invokes `onPress` once.

Representative test:

```tsx
it('formats both populated financial totals', () => {
  const onPress = jest.fn();
  const { getByText, getByRole } = render(
    <CashSummaryFeatureCard
      state={{
        status: 'ready',
        paidExpenses: 1250.5 as Pesos,
        ownerDrawings: 500 as Pesos,
      }}
      onPress={onPress}
    />,
  );

  expect(
    getByText('Expenses ₱1,250.50 · Owner drawings ₱500.00'),
  ).toBeTruthy();
  fireEvent.press(getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

Call `initI18n()` in `beforeAll`. Do not snapshot the component.

### Step 2: Write failing destination-row tests

Test title/subtitle rendering, button role, accessibility label/hint, press
callback, chevron presence, and a minimum 48dp touch target. Do not assert
single-line truncation; the production component must omit `numberOfLines`.

### Step 3: Run the component tests and verify RED

```powershell
pnpm test -- --runInBand components/more/__tests__/CashSummaryFeatureCard.test.tsx components/more/__tests__/MoreDestinationRow.test.tsx
```

Expected: FAIL because the new components do not exist.

### Step 4: Implement `CashSummaryFeatureCard`

Map the discriminated state to translated supporting/action text:

```tsx
const isEmpty =
  state.status === 'ready' &&
  state.paidExpenses === 0 &&
  state.ownerDrawings === 0;

const supportingText =
  state.status === 'loading'
    ? t('common:moreHomeCashLoading')
    : state.status === 'error'
      ? t('common:moreHomeCashError')
      : isEmpty
        ? t('common:moreHomeCashEmpty')
        : t('common:moreHomeCashSummary', {
            expenses: formatPesos(state.paidExpenses),
            drawings: formatPesos(state.ownerDrawings),
          });

const actionText =
  state.status === 'loading'
    ? t('common:moreHomeCashOpenAction')
    : state.status === 'error'
      ? t('common:moreHomeCashCheckAction')
      : t('common:moreHomeCashReviewAction');
```

Render one `Pressable`:

- `bg-persimmon-600`, `rounded-[20px]`, and `paper-50` text;
- `minHeight: 164` with generous padding so every query state reserves the
  same baseline space while still expanding for Dynamic Type;
- one FontAwesome money icon and a trailing arrow;
- no shimmer, scale animation, fixed text height, or truncation;
- `active:opacity-80` for immediate, reduced-motion-safe feedback;
- accessible label assembled from title, supporting text, and action;
- hint from `moreHomeCashHint`.

The card must not import any hook or database module.

### Step 5: Implement `MoreDestinationRow`

Use this public interface:

```ts
export type MoreDestinationRowProps = {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  supportingText: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
};
```

Render one paper-surface `Pressable` with:

- `rounded-2xl`, `border-paper-300`, and `bg-paper-50`;
- `minHeight: 64` and at least a 48dp touch target;
- a consistent 40dp icon container and 20dp FontAwesome icon;
- `ink-500` supporting text and flexible text without `numberOfLines`;
- trailing chevron;
- `active:opacity-80` press feedback.

### Step 6: Implement the header and section wrappers

`MoreScreenHeader` accepts eyebrow, title, and supporting text. Use existing
`h1`/Stack Sans roles, `ink-500` supporting copy, natural wrapping, and no
fixed height. Wrap the title in an accessible View with
`accessibilityRole="header"` and `useScreenHeadingFocus()`.

`MoreSection` accepts an optional label and children. The label is uppercase
and uses `ink-500` for AA contrast; children remain a vertical stack with at
least 8dp between separate controls. Do not wrap the rows in an extra opaque
card because each row is already a distinct surface.

### Step 7: Export the focused components

Update `components/more/index.ts` to export the four new components and their
public types. Leave legacy exports temporarily; Task 6 removes them only after
the landing screen no longer consumes them.

### Step 8: Run tests and typecheck for GREEN

```powershell
pnpm test -- --runInBand components/more/__tests__/CashSummaryFeatureCard.test.tsx components/more/__tests__/MoreDestinationRow.test.tsx
pnpm typecheck
```

Expected: PASS.

### Step 9: Commit the presentation layer

```powershell
git add -- components/more/CashSummaryFeatureCard.tsx components/more/MoreDestinationRow.tsx components/more/MoreScreenHeader.tsx components/more/MoreSection.tsx components/more/__tests__/CashSummaryFeatureCard.test.tsx components/more/__tests__/MoreDestinationRow.test.tsx components/more/index.ts
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: add focused More hub components"
```

---

## Task 4: Rewrite the More landing screen around live local metadata

**Files:**

- Create: `components/more/formatLocalBackupTimestamp.ts`
- Create: `components/more/__tests__/MoreHomeScreen.test.tsx`
- Create: `app/(tabs)/more/__tests__/productionAvailability.test.tsx`
- Modify: `components/more/MoreHomeScreen.tsx`
- Modify: `app/(tabs)/more/_layout.tsx`
- Modify: `app/(tabs)/more/index.tsx`
- Modify: `components/more/index.ts`

### Step 1: Write failing landing-screen tests

Locally mock:

- `useFinancialTotals`;
- `useLocalSnapshots`;
- `getTodayDateString` to return `2026-08-14`;
- `useWindowDimensions` for phone and tablet cases;
- `useTabBarBottomOffset`;
- the static Expo Router `navigate` function.

Render with `initI18n()` and verify:

1. Exactly four destination buttons appear in this reading order:
   Cash, Reports, Backup, Settings.
2. POS, Receipts, Products, Customers, Help, About, and individual report
   shortcuts are absent.
3. `useFinancialTotals` receives `('2026-08-14', '2026-08-14')`.
4. Cash loading, empty, populated, and query-error states map correctly.
5. Snapshot loading, empty, newest-snapshot, and query-error helper text map
   correctly.
6. Only `snapshots[0]` is used for the latest timestamp.
7. Pressing each destination uses its canonical `MORE_ROUTES` value.
8. Two rapid presses call `router.navigate` once.
9. The content container has 16dp phone gutters, 24dp tablet gutters, a 640dp
   maximum width, and bottom padding derived from
   `useTabBarBottomOffset() + 16`.

Use `jest.useFakeTimers()` for the rapid-press case and restore real timers
afterward.

### Step 2: Write the failing production-availability test

Mock Expo Router's `Slot` and `MoreHomeScreen` with test-ID Views. Temporarily
set `global.__DEV__ = false` and render both route files:

```tsx
it('renders the More stack in production', () => {
  const runtime = global as typeof global & { __DEV__: boolean };
  const previous = runtime.__DEV__;
  try {
    runtime.__DEV__ = false;
    expect(render(<MoreLayout />).getByTestId('more-slot')).toBeTruthy();
    expect(render(<MoreIndex />).getByTestId('more-home')).toBeTruthy();
  } finally {
    runtime.__DEV__ = previous;
  }
});
```

Use `try/finally` in the real test so `__DEV__` is restored even on failure.

### Step 3: Run both tests and verify RED

```powershell
pnpm test -- --runInBand components/more/__tests__/MoreHomeScreen.test.tsx "app/(tabs)/more/__tests__/productionAvailability.test.tsx"
```

Expected: FAIL because the old directory, redirects, and feature guards remain.

### Step 4: Add a small local timestamp formatter

Create `formatLocalBackupTimestamp.ts`:

```ts
export function formatLocalBackupTimestamp(
  createdAt: number,
  language: string,
): string {
  const locale = language === 'tl' ? 'fil-PH' : 'en-PH';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(createdAt));
}
```

This is display-only. Do not parse filenames or query Google Drive.

### Step 5: Rewrite `MoreHomeScreen`

At the top of the component:

```tsx
const { t, i18n } = useTranslation();
const today = getTodayDateString();
const financialTotals = useFinancialTotals(today, today);
const snapshots = useLocalSnapshots();
const navigate = useMoreDestinationNavigation();
const bottomOffset = useTabBarBottomOffset();
const { width } = useWindowDimensions();
const horizontalPadding = width >= 768 ? 24 : 16;
```

Map financial query state without creating another data store:

```tsx
const cashState: CashSummaryState = financialTotals.isLoading
  ? { status: 'loading' }
  : financialTotals.isError || !financialTotals.data
    ? { status: 'error' }
    : {
        status: 'ready',
        paidExpenses: financialTotals.data.paidExpenses,
        ownerDrawings: financialTotals.data.ownerDrawings,
      };
```

Map snapshot metadata independently:

```tsx
const latestSnapshot = snapshots.data?.[0];
const backupSupportingText = snapshots.isLoading
  ? t('common:moreHomeBackupLoading')
  : snapshots.isError
    ? t('common:moreHomeBackupError')
    : latestSnapshot
      ? t('common:moreHomeBackupLatest', {
          when: formatLocalBackupTimestamp(
            latestSnapshot.createdAt,
            i18n.language,
          ),
        })
      : t('common:moreHomeBackupEmpty');
```

Compose only:

1. `MoreScreenHeader`;
2. `CashSummaryFeatureCard`;
3. Reports `MoreDestinationRow`;
4. `MoreSection` labeled Store & data;
5. Backup row;
6. Settings row.

Use an inner content View with:

```tsx
style={{
  width: '100%',
  maxWidth: 640,
  alignSelf: 'center',
  paddingHorizontal: horizontalPadding,
}}
```

Use `paddingBottom: bottomOffset + 16` on the ScrollView content container.
Set `showsVerticalScrollIndicator={false}`. Do not add a full-screen loader;
cash and backup metadata must degrade independently.

### Step 6: Remove all production guards

Replace `app/(tabs)/more/_layout.tsx` with:

```tsx
import { Slot } from 'expo-router';

export default function MoreLayout() {
  return <Slot />;
}
```

Replace `app/(tabs)/more/index.tsx` with the direct screen export:

```tsx
import { MoreHomeScreen } from '@/components/more';

export default function MoreTab() {
  return <MoreHomeScreen />;
}
```

Remove every `withFeatureGuard` import and wrapper from
`MoreHomeScreen.tsx`.

### Step 7: Run focused tests and typecheck for GREEN

```powershell
pnpm test -- --runInBand components/more/__tests__/MoreHomeScreen.test.tsx "app/(tabs)/more/__tests__/productionAvailability.test.tsx"
pnpm typecheck
```

Expected: PASS.

### Step 8: Commit the production landing screen

```powershell
git add -- "app/(tabs)/more/_layout.tsx" "app/(tabs)/more/index.tsx" "app/(tabs)/more/__tests__/productionAvailability.test.tsx" components/more/MoreHomeScreen.tsx components/more/formatLocalBackupTimestamp.ts components/more/__tests__/MoreHomeScreen.test.tsx components/more/index.ts
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: launch focused More tab hub"
```

---

## Task 5: Make every More destination return predictably

**Files:**

- Create: `components/reports/__tests__/AlmanacMasthead.test.tsx`
- Modify: `components/reports/AlmanacMasthead.tsx`
- Modify: `app/(tabs)/more/reports.tsx`
- Modify: `app/(tabs)/more/cash-entries.tsx`

### Step 1: Write the failing Reports masthead test

Render `AlmanacMasthead` with an `onBack` spy and assert:

- a Back-to-More semantic button exists;
- its accessible label is localized;
- pressing it invokes `onBack`;
- the existing refresh button still invokes `onRefresh`.

Representative API:

```tsx
<AlmanacMasthead
  dateRange={dateRange}
  onBack={onBack}
  onRefresh={onRefresh}
  isRefreshing={false}
/>
```

### Step 2: Run the test and verify RED

```powershell
pnpm test -- --runInBand components/reports/__tests__/AlmanacMasthead.test.tsx
```

Expected: FAIL because the masthead has no back action.

### Step 3: Add the Reports back action

Add required `onBack: () => void` to `AlmanacMasthead`. Use
`useTranslation()` for `moreBackA11y` and render a 48dp Back button before the
existing reports identity. Keep Refresh as the trailing action:

```tsx
<Pressable
  onPress={onBack}
  accessibilityRole="button"
  accessibilityLabel={t('common:moreBackA11y')}
  style={{ minWidth: 48, minHeight: 48 }}
  className="items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
>
  <FontAwesome name="arrow-left" size={16} color="#FAFAF7" />
</Pressable>
```

Pass `onBack={goBackToMore}` from `app/(tabs)/more/reports.tsx`. Do not alter
report queries, calculations, or section content.

Use `useScreenHeadingFocus()` on an accessible header View around the General
Reports title so screen-reader focus moves to the destination heading.

### Step 4: Reuse the same fallback in Cash Movements

In `app/(tabs)/more/cash-entries.tsx`:

- import `goBackToMore`;
- import `useTranslation`, call it once in the screen, and use
  `t('common:moreBackA11y')`;
- attach `useScreenHeadingFocus()` to an accessible header View around the
  Cash Movements title;
- delete the local `handleBack` function;
- set the header Back button to `onPress={goBackToMore}`;
- translate its accessibility label with `moreBackA11y`.

Do not touch `app/(edit-forms)/cash-entry/index.tsx` or any cash-session file.
Do not change financial entries, date presets, filters, modals, or mutation
logic.

### Step 5: Run the test and typecheck for GREEN

```powershell
pnpm test -- --runInBand components/reports/__tests__/AlmanacMasthead.test.tsx components/more/__tests__/moreNavigation.test.tsx components/more/__tests__/MoreDetailHeader.test.tsx
pnpm typecheck
```

Expected: PASS, including both history and deep-link fallback tests from Task
2.

### Step 6: Commit only the navigation integration

```powershell
git add -- "app/(tabs)/more/reports.tsx" "app/(tabs)/more/cash-entries.tsx" components/reports/AlmanacMasthead.tsx components/reports/__tests__/AlmanacMasthead.test.tsx
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: normalize More destination back behavior"
```

---

## Task 6: Remove the obsolete directory UI and dead cash-session route

**Files:**

- Delete: `app/(tabs)/more/cash-session.tsx`
- Delete: `components/more/MoreGroupSection.tsx`
- Delete: `components/more/MoreHeroStrip.tsx`
- Delete: `components/more/MoreIconSection.tsx`
- Delete: `components/more/MoreLinkRow.tsx`
- Delete: `components/more/MoreTile.tsx`
- Delete: `components/more/MoreTileGrid.tsx`
- Modify: `components/more/index.ts`
- Modify: `locales/en/common.json`
- Modify: `locales/tl/common.json`
- Modify: `tests/moreLocalization.test.ts`

### Step 1: Prove the old components have no consumers

Run:

```powershell
rg -n "More(GroupSection|HeroStrip|IconSection|LinkRow|Tile|TileGrid)" app components --glob "*.ts" --glob "*.tsx"
```

Expected: only the legacy files and stale barrel exports. If any other consumer
appears, migrate that consumer before deletion; do not blindly remove the
file.

### Step 2: Strengthen the localization cleanup test

Add a rejected-key list to `tests/moreLocalization.test.ts` containing the
dense directory-only keys:

```ts
const REMOVED_DIRECTORY_KEYS = [
  'moreHomeDailyOps',
  'moreHomeCustomers',
  'moreHomeReportsSection',
  'moreHomeCashFinances',
  'moreHomeStoreData',
  'moreHomeAboutHelp',
  'moreHomeHeroCashSession',
  'moreHomeHeroNewSale',
  'moreHomeHeroRecordExpense',
  'moreHomeTilePos',
  'moreHomeTileReceipts',
  'moreHomeTileProducts',
  'moreHomeTileStockMovements',
  'moreHomeTileRestock',
  'moreHomeTileDamaged',
  'moreHomeTileAllCustomers',
  'moreHomeTileUtang',
  'moreHomeTileCollection',
  'moreHomeTileInsights',
  'moreHomeTileAlmanac',
  'moreHomeTileSalesTrend',
  'moreHomeTileTopProducts',
  'moreHomeTileStockMovement',
  'moreHomeTileSukiAging',
  'moreHomeTileCashbook',
  'moreHomeTileCashMovements',
  'moreHomeTileGastos',
  'moreHomeTileStoreProfile',
  'moreHomeTileLanguage',
  'moreHomeTileBackup',
  'moreHomeTileDeveloperReset',
] as const;

it.each(REMOVED_DIRECTORY_KEYS)('removes obsolete key %s', (key) => {
  expect(en).not.toHaveProperty(key);
  expect(tl).not.toHaveProperty(key);
});
```

Also include the older unused grouping/help keys only after `rg` confirms zero
consumers:

- `moreHomeBusinessReviewSection`
- `moreHomeStoreSetupSection`
- `moreHomeDataSafetySection`
- `moreHomeAppSection`
- `moreHomeExpensesLabel`
- `moreHomeExpensesSub`
- `moreHomeStoreProfileLabel`
- `moreHomeStoreProfileSub`
- `moreHomeLanguageLabel`
- `moreHomeLanguageSub`
- `moreHomeHelpLabel`
- `moreHomeHelpSub`
- `moreHomeAboutLabel`
- `moreHomeAboutSub`

Do not remove retained keys such as `moreHomeTitle`,
`moreHomeReportsLabel`, `moreHomeReportsSub`, or `moreHomeBackupLabel`.

### Step 3: Run the cleanup test and verify RED

```powershell
pnpm test -- --runInBand tests/moreLocalization.test.ts
```

Expected: FAIL while obsolete keys still exist.

### Step 4: Delete the dead UI files and stale exports

Remove the seven legacy component files and the empty
`app/(tabs)/more/cash-session.tsx` stub. Update `components/more/index.ts` so
it exports only the new focused components, route/navigation helpers, and
`MoreHomeScreen`.

Do not delete the separate `/(edit-forms)/cash-session` route; it is outside
this plan and currently has user changes.

### Step 5: Remove only proven-unused localization keys

Search each candidate in `app`, `components`, `hooks`, and `tests`, then remove
it from both locale files. Keep English and Tagalog key sets aligned.

### Step 6: Regenerate typed routes after removing the stub

Start Expo offline, wait for Metro ready, then stop:

```powershell
pnpm exec expo start --offline
```

Confirm `.expo/types/router.d.ts` contains `more/backup` and no longer contains
`more/cash-session`. Do not stage `.expo`.

### Step 7: Run cleanup tests and static searches for GREEN

```powershell
pnpm test -- --runInBand tests/moreLocalization.test.ts
rg -n "More(GroupSection|HeroStrip|IconSection|LinkRow|Tile|TileGrid)" app components --glob "*.ts" --glob "*.tsx"
rg -n "moreHome(Tile|Hero|DailyOps|Customers|CashFinances|AboutHelp)" app components locales tests
pnpm typecheck
```

Expected: test and typecheck PASS; both `rg` commands return no matches.

### Step 8: Commit the targeted cleanup

```powershell
git add -- "app/(tabs)/more/cash-session.tsx" components/more/MoreGroupSection.tsx components/more/MoreHeroStrip.tsx components/more/MoreIconSection.tsx components/more/MoreLinkRow.tsx components/more/MoreTile.tsx components/more/MoreTileGrid.tsx components/more/index.ts locales/en/common.json locales/tl/common.json tests/moreLocalization.test.ts
git diff --cached --name-only
git diff --cached --check
git commit -m "refactor: remove obsolete More directory UI"
```

---

## Task 7: Verify the complete hub against the approved design

**Files:**

- Modify only files from Tasks 1-6 if verification exposes a defect.

### Step 1: Run all focused More tests together

```powershell
pnpm test -- --runInBand tests/moreLocalization.test.ts components/more/__tests__/moreNavigation.test.tsx components/more/__tests__/MoreDetailHeader.test.tsx components/more/__tests__/CashSummaryFeatureCard.test.tsx components/more/__tests__/MoreDestinationRow.test.tsx components/more/__tests__/MoreHomeScreen.test.tsx "app/(tabs)/more/__tests__/backupSettingsSplit.test.tsx" "app/(tabs)/more/__tests__/productionAvailability.test.tsx" components/reports/__tests__/AlmanacMasthead.test.tsx
```

Expected: PASS with no open handles or console errors.

### Step 2: Run project-wide verification

```powershell
pnpm lint
pnpm verify
git diff --check
```

Expected: lint, typecheck, and all tests PASS. If an existing unrelated test
fails, record its exact command and failure before deciding whether it is
pre-existing; do not change unrelated code to conceal it.

### Step 3: Audit architecture and route scope

Run:

```powershell
rg -n "__DEV__|withFeatureGuard|/unimplemented" "app/(tabs)/more" components/more --glob "!**/__tests__/**"
rg -n "useCurrentSession|useCashSessionSummary|database/|configs/sqlite|useCash" components/more
rg -n "/\(tabs\)/(sales|inventory|customers)|/gastos-kaha|home/today" components/more/MoreHomeScreen.tsx
rg -n "CloudBackupSection|LocalSnapshotsSection" "app/(tabs)/more/settings.tsx"
rg -n "useFinancialTotals|useLocalSnapshots|getTodayDateString" components/more/MoreHomeScreen.tsx
```

Expected:

- first four searches return no matches;
- final search shows only the approved hooks/helper;
- `MORE_SUB_TABS` remains an empty tuple in `constants/tabs.ts`.

### Step 4: Audit accessibility and layout in code

Confirm:

- exactly four landing-screen Pressables;
- all have button roles, labels, and hints;
- every touch target is at least 48dp;
- text has no fixed heights or `numberOfLines`;
- the card uses `persimmon-600` with `paper-50`;
- rows use `paper-50` and `paper-300`;
- phone/tablet gutters are 16/24dp;
- maximum content width is 640dp;
- bottom padding comes from `useTabBarBottomOffset()`;
- no shimmer or spatial animation was introduced.
- each destination's accessible main heading receives focus after navigation.

### Step 5: Perform manual device checks

Run the app and verify:

1. 375dp phone and a large phone.
2. Tablet portrait and landscape.
3. English and Tagalog.
4. Largest supported Dynamic Type.
5. VoiceOver/TalkBack reading order.
6. Reduced motion enabled.
7. Offline mode.
8. Cash totals: zero, expenses only, drawings only, both, and query failure.
9. Backups: loading, none, one, multiple, and query failure.
10. Direct deep links to Cash, Reports, Backup, and Settings, with Back
    returning to More when no history exists.
11. Scroll More, open a destination, and go Back; the More scroll position is
    preserved.
12. Rapid double taps do not stack destinations.
13. Last content remains above the floating tab bar and system gesture area.

### Step 6: Reconfirm user changes remain untouched

```powershell
git status --short
git diff -- "app/(edit-forms)/cash-entry/index.tsx" "app/(edit-forms)/cash-session/index.tsx" "app/(edit-forms)/sale-details/[id].tsx" components/cash-session/OpenSessionView.tsx "obsidian-vault/01-roadmap/feature-implementation-status-and-ia.md" "obsidian-vault/02-Features/11-owner-pin-for-sensitive-actions.md" "obsidian-vault/09-Marketing/calendar/2026-08-14-stocktake-build-story-linkedin.md"
```

Expected: the user's pre-existing diffs remain present and were not included in
any implementation commit.

### Step 7: Commit verification fixes only if needed

If verification required code changes, rerun the smallest failing test first,
then the full checks, stage only the corrected task files, and commit:

```powershell
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: finish More hub verification"
```

Do not create an empty verification commit.

---

## Definition of done

- More renders in production with no development guard or unimplemented
  redirect.
- The landing screen contains exactly Cash, Reports, Backup, and Settings.
- Cash shows local paid-expense and owner-drawing totals and opens
  `/(tabs)/more/cash-entries`.
- Backup helper text uses only newest local snapshot metadata; no Drive query
  runs from More.
- Backup has its own route; Settings retains Store, Language, Owner PIN, and
  preferences.
- All four destination routes support normal Back and deep-link fallback.
- English and Tagalog copy, accessibility, responsive layout, safe bottom
  inset, and reduced-motion requirements pass.
- Focused tests, `pnpm lint`, and `pnpm verify` pass.
- No user-authored dirty files are overwritten or committed.
