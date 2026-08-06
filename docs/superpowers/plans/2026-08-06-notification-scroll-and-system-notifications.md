# Notification Sheet Infinite Scroll & System Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `NotificationSheet.tsx` to support virtualized scrolling of all alerts (removing the 3-item cap), and implement local device system notifications using `expo-notifications` for status bar alerts, app icon badges, and deep-linking navigation.

**Architecture:** `NotificationSheet.tsx` is updated to use a gesture-aware `FlatList` with fixed Header/Footer boundaries. `lib/notifications.ts` encapsulates `expo-notifications` permissions, channels, badge count syncing, and local notification triggers. `hooks/useSystemNotifications.ts` connects store alert data to system notification APIs and handles deep linking taps via Expo Router.

**Tech Stack:** React Native 0.81, Expo SDK 54 (`expo-notifications`), React Native Reanimated, React Native Gesture Handler, TanStack Query v5, Jest.

## Global Constraints

- **Strict TypeScript Mode**: All new types must compile cleanly with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.
- **Path Alias**: `@/*` maps to repository root.
- **Money Handling**: Whole pesos formatted via `lib/money.ts` (`formatPesos`).
- **No Direct SQLite Calls in Screens**: UI elements access data strictly via custom hooks.
- **No Ad-Hoc Libraries**: `expo-notifications` is already installed (`~0.32.12`).

---

### Task 1: Refactor `NotificationSheet.tsx` for Virtualized Infinite Scroll

**Files:**
- Modify: `components/layout/NotificationSheet.tsx`
- Create: `tests/components/NotificationSheet.test.tsx`

**Interfaces:**
- Consumes: `DynamicHomeAlert` from `@/hooks/useHomeDashboardData`
- Produces: `NotificationSheet` component that renders a virtualized `FlatList` for all alerts without capping at 3.

- [ ] **Step 1: Write the unit test for `NotificationSheet` rendering all alerts**

Create `tests/components/NotificationSheet.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationSheet } from '@/components/layout/NotificationSheet';
import { DynamicHomeAlert } from '@/hooks/useHomeDashboardData';

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => children || null,
}));

jest.mock('moti', () => ({
  MotiView: ({ children }: { children?: React.ReactNode }) => children || null,
}));

describe('NotificationSheet', () => {
  const mockAlerts: DynamicHomeAlert[] = Array.from({ length: 10 }, (_, i) => ({
    id: `alert-${i}`,
    type: i % 2 === 0 ? 'low_stock' : 'overdue_debts',
    title: `Item ${i}`,
    subtitle: `Subtitle ${i}`,
    actionLabel: i % 2 === 0 ? 'Restock' : 'Collect',
    targetPath: i % 2 === 0 ? '/inventory' : '/(tabs)/customers/credit',
  }));

  it('renders all alerts in list instead of capping at 3', () => {
    const { getByText } = render(
      <NotificationSheet
        visible={true}
        alerts={mockAlerts}
        onClose={jest.fn()}
        onAlertAction={jest.fn()}
        onSeeAll={jest.fn()}
      />
    );

    expect(getByText('10 active alerts')).toBeTruthy();
    expect(getByText('Item 0')).toBeTruthy();
    expect(getByText('Item 9')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/NotificationSheet.test.tsx`
Expected: FAIL due to `Item 9` not found (because `visibleAlerts` currently slices alerts to 3).

- [ ] **Step 3: Refactor `NotificationSheet.tsx` to use FlatList**

In `components/layout/NotificationSheet.tsx`:
1. Remove `const MAX_ALERTS = 3;`.
2. Remove `const visibleAlerts = useMemo(() => alerts.slice(0, MAX_ALERTS), [alerts]);`. Use `alerts` directly.
3. Import `FlatList` from `react-native-gesture-handler` (or React Native `FlatList`).
4. Replace the static `visibleAlerts.map(...)` view block with `FlatList`:
```tsx
<FlatList
  data={alerts}
  keyExtractor={(item) => String(item.id)}
  style={{ maxHeight: SCREEN_HEIGHT * 0.45 }}
  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}
  showsVerticalScrollIndicator={true}
  renderItem={({ item }) => (
    <AlertCardItem
      type={item.type}
      title={item.title}
      subtitle={item.subtitle}
      actionLabel={item.actionLabel}
      onAction={() => {
        console.log(`${TAG} alert action tapped: id=${item.id}`);
        onAlertAction(item);
      }}
    />
  )}
  ListEmptyComponent={
    <View className="px-4 py-6 items-center">
      <StyledText variant="medium" className="text-ink-400 text-sm text-center">
        Store is operating smoothly. No alerts right now.
      </StyledText>
    </View>
  }
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/NotificationSheet.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add components/layout/NotificationSheet.tsx tests/components/NotificationSheet.test.tsx
git commit -m "feat: refactor NotificationSheet to use FlatList for unlimited alert scrolling"
```

---

### Task 2: System Notifications Helper (`lib/notifications.ts`)

**Files:**
- Create: `lib/notifications.ts`
- Create: `tests/lib/notifications.test.ts`

**Interfaces:**
- Consumes: `expo-notifications` module
- Produces: `requestNotificationPermissions`, `getNotificationPermissionStatus`, `setupNotificationChannels`, `updateAppIconBadge`, `triggerLowStockNotification`, `triggerOverdueDebtNotification`

- [ ] **Step 1: Write failing tests for `lib/notifications.ts`**

Create `tests/lib/notifications.test.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import {
  updateAppIconBadge,
  triggerLowStockNotification,
  triggerOverdueDebtNotification,
} from '@/lib/notifications';

jest.mock('expo-notifications', () => ({
  setBadgeCountAsync: jest.fn().mockResolvedValue(true),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-123'),
  setNotificationChannelAsync: jest.fn().mockResolvedValue({}),
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
}));

describe('lib/notifications', () => {
  beforeEach(() => {
    jest.clearMocks();
  });

  it('updates app icon badge count correctly', async () => {
    await updateAppIconBadge(5);
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
  });

  it('schedules low stock system notification with correct payload', async () => {
    await triggerLowStockNotification('Instant Noodle', 2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Low Stock Alert: Instant Noodle',
          body: 'Only 2 items remaining in inventory. Tap to restock.',
          data: expect.objectContaining({ targetPath: '/inventory' }),
        }),
      })
    );
  });

  it('schedules overdue debt notification with correct payload', async () => {
    await triggerOverdueDebtNotification('Juan Dela Cruz', '₱250.00');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Overdue Credit: Juan Dela Cruz',
          body: 'Outstanding balance of ₱250.00 requires collection.',
          data: expect.objectContaining({ targetPath: '/(tabs)/customers/credit' }),
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/notifications.test.ts`
Expected: FAIL ("Cannot find module '@/lib/notifications'")

- [ ] **Step 3: Implement `lib/notifications.ts`**

Create `lib/notifications.ts`:
```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const TAG = '[Notifications]';

// Configure foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error(`${TAG} Error requesting notification permissions:`, error);
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error(`${TAG} Error checking notification status:`, error);
    return false;
  }
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('low-stock-channel', {
      name: 'Low Stock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });

    await Notifications.setNotificationChannelAsync('overdue-debt-channel', {
      name: 'Overdue Credit Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#E53E3E',
    });
  }
}

export async function updateAppIconBadge(count: number): Promise<void> {
  try {
    const validCount = Math.max(0, count);
    await Notifications.setBadgeCountAsync(validCount);
  } catch (error) {
    console.error(`${TAG} Error setting badge count:`, error);
  }
}

export async function triggerLowStockNotification(
  productName: string,
  quantity: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Low Stock Alert: ${productName}`,
        body: `Only ${quantity} item${quantity === 1 ? '' : 's'} remaining in inventory. Tap to restock.`,
        sound: 'default',
        data: { targetPath: '/inventory', type: 'low_stock' },
      },
      trigger: null, // trigger immediately
    });
    return notificationId;
  } catch (error) {
    console.error(`${TAG} Error triggering low stock notification:`, error);
    return null;
  }
}

export async function triggerOverdueDebtNotification(
  customerName: string,
  amountFormatted: string
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Overdue Credit: ${customerName}`,
        body: `Outstanding balance of ${amountFormatted} requires collection.`,
        sound: 'default',
        data: { targetPath: '/(tabs)/customers/credit', type: 'overdue_debts' },
      },
      trigger: null, // trigger immediately
    });
    return notificationId;
  } catch (error) {
    console.error(`${TAG} Error triggering overdue debt notification:`, error);
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/notifications.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add lib/notifications.ts tests/lib/notifications.test.ts
git commit -m "feat: add lib/notifications.ts for permissions, channels, badge count, and local triggers"
```

---

### Task 3: Integration Hook & Navigation Listener (`hooks/useSystemNotifications.ts`)

**Files:**
- Create: `hooks/useSystemNotifications.ts`
- Modify: `hooks/index.ts`
- Create: `tests/hooks/useSystemNotifications.test.ts`

**Interfaces:**
- Consumes: `useHomeDashboardData`, `lib/notifications`, `expo-router`
- Produces: `useSystemNotifications` hook syncs total alert count to system badge and sets up notification tap listener for deep linking navigation.

- [ ] **Step 1: Write failing test for `useSystemNotifications`**

Create `tests/hooks/useSystemNotifications.test.ts`:
```typescript
import { renderHook } from '@testing-library/react-native';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import * as notificationsLib from '@/lib/notifications';

jest.mock('@/lib/notifications', () => ({
  updateAppIconBadge: jest.fn().mockResolvedValue(undefined),
  setupNotificationChannels: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({
    remove: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('useSystemNotifications', () => {
  it('syncs total active alerts count to badge', () => {
    renderHook(() => useSystemNotifications(4));
    expect(notificationsLib.updateAppIconBadge).toHaveBeenCalledWith(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hooks/useSystemNotifications.test.ts`
Expected: FAIL ("Cannot find module '@/hooks/useSystemNotifications'")

- [ ] **Step 3: Implement `useSystemNotifications`**

Create `hooks/useSystemNotifications.ts`:
```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { setupNotificationChannels, updateAppIconBadge } from '@/lib/notifications';

const TAG = '[useSystemNotifications]';

export function useSystemNotifications(activeAlertCount: number) {
  const router = useRouter();

  // Initialize channels
  useEffect(() => {
    setupNotificationChannels().catch((err) => {
      console.error(`${TAG} Failed setting up notification channels:`, err);
    });
  }, []);

  // Sync active alert count to device app icon badge
  useEffect(() => {
    updateAppIconBadge(activeAlertCount);
  }, [activeAlertCount]);

  // Set up deep linking listener on notification interaction
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data['targetPath'] === 'string') {
        const targetPath = data['targetPath'];
        console.log(`${TAG} Notification tapped -> navigating to: ${targetPath}`);
        router.push(targetPath as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);
}
```

Re-export in `hooks/index.ts`:
```typescript
export * from './useSystemNotifications';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hooks/useSystemNotifications.test.ts`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add hooks/useSystemNotifications.ts hooks/index.ts tests/hooks/useSystemNotifications.test.ts
git commit -m "feat: add useSystemNotifications hook for badge syncing and deep link navigation"
```

---

### Task 4: Connect Hook in Layout / Home & Run Verification

**Files:**
- Modify: `app/(tabs)/_layout.tsx` (or `app/(tabs)/index.tsx`)
- Verification: Entire test suite & TypeScript check

**Interfaces:**
- Consumes: `useSystemNotifications`, `useHomeDashboardData`
- Produces: Fully integrated notification system and virtualized sheet across the app.

- [ ] **Step 1: Integrate `useSystemNotifications` into `(tabs)/_layout.tsx` or `StoreHeader`**

In `app/(tabs)/_layout.tsx` (or top-level tabs container):
```tsx
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';

// Inside TabLayout / main root:
const { alerts } = useHomeDashboardData();
useSystemNotifications(alerts.length);
```

- [ ] **Step 2: Run verification command**

Run: `npm run verify`
Expected: `typecheck` passes cleanly with 0 errors and all Jest tests pass.

- [ ] **Step 3: Commit integration**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat: integrate system notification sync into tab layout"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-08-06-notification-scroll-and-system-notifications.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
