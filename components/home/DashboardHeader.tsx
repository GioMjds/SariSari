import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export type HomeSubTab = 'index' | 'today' | 'alerts';

export interface DashboardHeaderProps {
  storeName?: string;
  branchName?: string;
  ownerInitials?: string;
  isOnline?: boolean;
  activeTab: HomeSubTab;
  alertCount?: number;
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
  onTabPress,
  onNotificationPress,
}: DashboardHeaderProps) {
  const tabs: { key: HomeSubTab; label: string }[] = [
    { key: 'index', label: 'Overview' },
    { key: 'today', label: 'Today' },
    { key: 'alerts', label: 'Alerts' },
  ];

  const handleTabSelect = (tab: HomeSubTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(tab);
  };

  const handleNotificationSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNotificationPress?.();
  };

  return (
    <View className="bg-paper-200 px-4 pt-3 pb-3">
      {/* Top Header Row: Owner Avatar + Store Title/Branch + Status Pill + Notification Bell */}
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
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center border border-ink-100 relative shadow-sm"
          >
            <FontAwesome5 name="bell" size={16} color="#44403C" />
            {alertCount > 0 ? (
              <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-cinnamon-500 border border-paper-50" />
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Segmented Sub-Tab Control Container */}
      <View className="flex-row bg-paper-100 p-1 rounded-2xl border border-ink-100">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabSelect(tab.key)}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center border ${
                isActive
                  ? 'bg-paper-50 shadow-sm border-ink-100/50'
                  : 'bg-transparent border-transparent shadow-none'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'medium'}
                className={`text-sm ${isActive ? 'text-ink-900' : 'text-ink-500'}`}
              >
                {tab.label}
              </StyledText>
              {tab.key === 'alerts' && alertCount > 0 ? (
                <View className="ml-1.5 bg-cinnamon-500 rounded-full w-4 h-4 items-center justify-center">
                  <StyledText
                    variant="extrabold"
                    className="text-paper-50 text-[10px]"
                  >
                    {alertCount}
                  </StyledText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
