import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { Href, useRouter, useSegments } from 'expo-router';
import { StyledText } from '@/components/elements';
import { SariWordmark } from '@/components/brand/SariWordmark';
import { SariMascot, type SariState } from '@/components/mascot';
import { useHomeAlerts, useSystemNotifications } from '@/hooks';
import { useChangeLog } from '@/utils/perf';

type SariTab = 'home' | 'sales' | 'inventory' | 'customers' | 'more';

const SARI_TAB_STATE = {
  home: 'default',
  sales: 'sales',
  inventory: 'inventory',
  customers: 'customers',
  more: 'settings',
} satisfies Record<SariTab, SariState>;

const SARI_LINES = {
  home: "Hello there! Here's your store today.",
  sales: 'Ring up a sale. Sari helps!',
  inventory: 'Count the shelves, keep stock in check.',
  customers: 'Your suki, your utang list.',
  more: 'Need anything? Sari is here.',
} satisfies Record<SariTab, string>;

const TABS = [
  'home',
  'sales',
  'inventory',
  'customers',
  'more',
] satisfies SariTab[];

const SARI_SIZE = 56;

function useActiveTab(): SariTab {
  const segments = useSegments() as string[];
  const current = segments.find((s): s is SariTab =>
    TABS.includes(s as SariTab),
  );
  const [lastTab, setLastTab] = useState<SariTab>(current ?? 'home');
  if (current && current !== lastTab) setLastTab(current);
  return current ?? lastTab;
}

export const StoreHeader = memo(function StoreHeader() {
  const router = useRouter();
  // Narrow subscription: does NOT trigger every sales/cash/report query.
  const { alerts, alertCount } = useHomeAlerts();
  const tab = useActiveTab();

  useSystemNotifications(alerts);

  const [builtTabs, setBuiltTabs] = useState<SariTab[]>([tab]);
  if (!builtTabs.includes(tab)) setBuiltTabs([...builtTabs, tab]);

  // Stable payload — alerts is memoized in useHomeAlerts, tab is primitive.
  const changeLogPayload = useMemo(
    () => ({ tab, alertCount, alerts }),
    [tab, alertCount, alerts],
  );
  useChangeLog('StoreHeader', changeLogPayload);

  const handleNotificationSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/notifications' as Href);
  }, [router]);

  return (
    <View className="bg-paper-200 px-4 pt-3 pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="mr-2" style={styles.sariSlot}>
            {builtTabs.map((key) => (
              <View
                key={key}
                style={key === tab ? styles.pose : styles.hiddenPose}
              >
                <SariMascot
                  state={SARI_TAB_STATE[key]}
                  size={SARI_SIZE}
                  animated={false}
                />
              </View>
            ))}
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
              <View
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-semantic-danger border-2 border-paper-200 items-center justify-center"
                importantForAccessibility="no-hide-descendants"
              >
                <StyledText
                  variant="extrabold"
                  className="text-white text-[10px]"
                  maxFontSizeMultiplier={1.2}
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </StyledText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
});

StoreHeader.displayName = 'StoreHeader';

const styles = StyleSheet.create({
  sariSlot: { width: SARI_SIZE, height: SARI_SIZE },
  pose: { ...StyleSheet.absoluteFillObject },
  hiddenPose: { ...StyleSheet.absoluteFillObject, display: 'none' },
});
