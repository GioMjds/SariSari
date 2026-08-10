import { View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface MiniInsightsCardProps {
  topProductName?: string;
  unitsSold?: number;
}

export function MiniInsightsCard({
  topProductName = 'Palmolive 12ml',
  unitsSold = 18,
}: MiniInsightsCardProps) {
  return (
    <View className="px-4 mb-4">
      <View className="bg-[#1C140E] rounded-2xl p-4 flex-row items-center border border-[#261C14] shadow-sm">
        <View className="w-10 h-10 rounded-xl bg-cinnamon-500 items-center justify-center mr-3">
          <FontAwesome5 name="star" size={16} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-paper-100 text-sm uppercase tracking-widest"
          >
            TOP SELLER TODAY
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm mt-0.5"
          >
            {topProductName} leads with {unitsSold} units.
          </StyledText>
        </View>
      </View>
    </View>
  );
}
