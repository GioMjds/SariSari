import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { SubTabControl, SubTabItem } from '@/components/navigation';

export type HomeSubTab = 'index' | 'today' | 'alerts';

export interface DashboardHeaderProps {
  storeName?: string;
  branchName?: string;
  ownerInitials?: string;
  isOnline?: boolean;
  activeTab: HomeSubTab;
  alertCount?: number;
  showTopHeader?: boolean;
  onTabPress: (tab: HomeSubTab) => void;
  onNotificationPress?: () => void;
}

export function DashboardHeader({
  storeName = "Aling Nena's",
  branchName = 'Main Branch - Calauan',
  ownerInitials = 'AN',
  isOnline = true,
  activeTab,
  alertCount = 2,
  showTopHeader = false,
  onTabPress,
  onNotificationPress,
}: DashboardHeaderProps) {
  const tabs: SubTabItem<HomeSubTab>[] = [
    { key: 'index', label: 'Overview', icon: 'th-large' },
    { key: 'today', label: 'Today', icon: 'calendar' },
    { key: 'alerts', label: 'Alerts', icon: 'bell', badgeCount: alertCount },
  ];

  const handleNotificationSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNotificationPress?.();
  };

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-3">
      {/* Top Header Row: Owner Avatar + Store Title/Branch + Status Pill + Notification Bell */}
      {showTopHeader && (
        <View className="flex-row items-center justify-between mb-3">
          {/* Left Group: Avatar & Store Info */}
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3 shadow-sm">
              <StyledText variant="extrabold" className="text-paper-50 text-base">
                {ownerInitials}
              </StyledText>
            </View>
            <View className="flex-1">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-lg"
                numberOfLines={1}
              >
                {storeName}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs"
                numberOfLines={1}
              >
                {branchName}
              </StyledText>
            </View>
          </View>

          {/* Right Group: Online Pill Badge + Notification Bell */}
          <View className="flex-row items-center gap-2">
            <View className="bg-emerald-100/80 px-2.5 py-1 rounded-full flex-row items-center border border-emerald-200">
              <View className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5" />
              <StyledText
                variant="extrabold"
                className="text-emerald-800 text-[10px] tracking-wider uppercase"
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </StyledText>
            </View>

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
      )}

      {/* Segmented Sub-Tab Control Container */}
      <SubTabControl
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={onTabPress}
        containerClassName="mb-0"
      />
    </View>
  );
}

