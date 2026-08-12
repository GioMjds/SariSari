import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { HomeSubTab } from '@/constants/tabs';

export type { HomeSubTab };

export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
}

export function DashboardHeader({
  storeName,
  ownerInitials,
}: DashboardHeaderProps) {
  return (
    <View className="px-4 pt-2">
      <View className="flex-row items-center justify-between mb-1">
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
          </View>
        </View>
      </View>
    </View>
  );
}
