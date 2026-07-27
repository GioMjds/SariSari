import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { formatPesos } from '@/lib';

interface CustomerSummaryCardsProps {
  totalCustomers: number;
  totalCredit: number;
  loyalCount: number;
  activeThisWeek: number;
}

export const CustomerSummaryCards: React.FC<CustomerSummaryCardsProps> = ({
  totalCustomers,
  totalCredit,
  loyalCount,
  activeThisWeek,
}) => {
  return (
    <View className="px-4 py-2 flex-row flex-wrap justify-between gap-y-2">
      <View className="w-[48%] bg-paper-100 p-3 rounded-xl border border-paper-200 flex-row items-center">
        <View className="w-9 h-9 rounded-lg bg-cinnamon-100 items-center justify-center mr-2.5">
          <FontAwesome name="users" size={16} color="#E85A1F" />
        </View>
        <View>
          <StyledText variant="extrabold" className="text-ink-700 text-base">
            {totalCustomers}
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-[10px]">
            Customers
          </StyledText>
        </View>
      </View>

      <View className="w-[48%] bg-paper-100 p-3 rounded-xl border border-paper-200 flex-row items-center">
        <View className="w-9 h-9 rounded-lg bg-amber-100 items-center justify-center mr-2.5">
          <FontAwesome name="money" size={16} color="#D97706" />
        </View>
        <View>
          <StyledText variant="extrabold" className="text-ink-700 text-base">
            {formatPesos(totalCredit)}
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-[10px]">
            Credit
          </StyledText>
        </View>
      </View>

      <View className="w-[48%] bg-paper-100 p-3 rounded-xl border border-paper-200 flex-row items-center">
        <View className="w-9 h-9 rounded-lg bg-purple-100 items-center justify-center mr-2.5">
          <FontAwesome name="star" size={16} color="#7C3AED" />
        </View>
        <View>
          <StyledText variant="extrabold" className="text-ink-700 text-base">
            {loyalCount}
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-[10px]">
            Loyal
          </StyledText>
        </View>
      </View>

      <View className="w-[48%] bg-paper-100 p-3 rounded-xl border border-paper-200 flex-row items-center">
        <View className="w-9 h-9 rounded-lg bg-sage-100 items-center justify-center mr-2.5">
          <FontAwesome name="shopping-cart" size={16} color="#4F7A24" />
        </View>
        <View>
          <StyledText variant="extrabold" className="text-ink-700 text-base">
            {activeThisWeek}
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-[10px]">
            Active This Week
          </StyledText>
        </View>
      </View>
    </View>
  );
};
