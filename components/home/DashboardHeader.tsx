import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { SubTabControl, SubTabItem } from '@/components/navigation';

export type HomeSubTab = 'overview' | 'today';

export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
  activeTab: HomeSubTab;
  showTopHeader: boolean;
  onTabPress: (tab: HomeSubTab) => void;
}

export function DashboardHeader({
  storeName,
  ownerInitials,
  activeTab,
  showTopHeader,
  onTabPress,
}: DashboardHeaderProps) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'today', label: 'Today' },
  ] satisfies SubTabItem<HomeSubTab>[];

  return (
    <View className="bg-paper-200 px-4 pt-1 pb-3">
      {showTopHeader && (
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3 shadow-sm">
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-base"
              >
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
            </View>
          </View>
        </View>
      )}
      <SubTabControl
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={onTabPress}
        containerClassName="mb-0"
      />
    </View>
  );
}
