import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { Href, useRouter, useSegments } from 'expo-router';
import { StyledText } from '@/components/elements';
import { SariWordmark } from '@/components/brand/SariWordmark';
import { SariMascot, type SariState } from '@/components/mascot';
import { NotificationSheet } from './NotificationSheet';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useSystemNotifications } from '@/hooks';

type SariTab = 'home' | 'sales' | 'inventory' | 'customers' | 'more';

/** Which Sari state acts out each tab. */
const SARI_TAB_STATE = {
  home: 'default',
  sales: 'sales',
  inventory: 'inventory',
  customers: 'customers',
  more: 'settings',
} satisfies Record<SariTab, SariState>;

// TODO: Must be with a En/Fil locale and a dynamic message depending on store's needs
const SARI_LINES = {
  home: 'Hello there! Here\'s your store today.',
  sales: 'Ring up a sale. Sari helps!',
  inventory: 'Count the shelves, keep stock in check.',
  customers: 'Your suki, your utang list.',
  more: 'Need anything? Sari is here.',
} satisfies Record<SariTab, string>;

const TABS = ['home', 'sales', 'inventory', 'customers', 'more'] satisfies SariTab[];

function useActiveTab(): SariTab {
  const segments = useSegments() as string[];
  return useMemo(
    () => segments.find((s): s is SariTab => TABS.includes(s as SariTab)) ?? 'home',
    [segments],
  );
}

export const StoreHeader = memo(function StoreHeader() {
  const router = useRouter();
  const { alertCount, alerts } = useHomeDashboardData();
  const tab = useActiveTab();

  useSystemNotifications(alerts);

  const [isSheetVisible, setSheetVisible] = useState(false);

  const handleNotificationSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSheetVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleAlertAction = useCallback(
    (alert: { targetPath: string }) => {
      setSheetVisible(false);
      router.push(alert.targetPath as Href);
    },
    [router],
  );

  return (
    <View className="bg-paper-200 px-4 pt-3 pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="mr-2">
            <SariMascot state={SARI_TAB_STATE[tab]} size={56} />
          </View>
          <View className="flex-1 items-start">
            <SariWordmark height={26} accessibilityLabel="SariSari" />
            <StyledText
              variant="medium"
              className="text-ink-500 text-sm mt-1.5"
              numberOfLines={1}
              accessibilityLiveRegion="polite"
            >
              {SARI_LINES[tab]}
            </StyledText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleNotificationSelect}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${alertCount} active alerts`}
            className="w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 relative shadow-sm"
          >
            <FontAwesome5 name="bell" size={16} color="#44403C" />
            {alertCount > 0 ? (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-cinnamon-500 border border-paper-50" />
            ) : null}
          </Pressable>
        </View>
      </View>

      <NotificationSheet
        visible={isSheetVisible}
        alerts={alerts}
        onClose={handleSheetClose}
        onAlertAction={handleAlertAction}
      />
    </View>
  );
});

StoreHeader.displayName = 'StoreHeader';
