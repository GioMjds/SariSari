import React from 'react';
import { View } from 'react-native';
import { CustomerInsightsTab } from '@/components/customers';
import { useCustomerInsights } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';

export default function CustomerInsightsScreen() {
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: insights } = useCustomerInsights();

  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: tabBarBottomOffset }}
    >
      <CustomerInsightsTab insights={insights} />
    </View>
  );
}
