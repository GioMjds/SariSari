import { View } from 'react-native';
import {
  CustomerInsightsTab,
  CustomerInsightsSkeleton,
} from '@/components/customers';
import { useCustomerInsights } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';

export default function CustomerInsightsScreen() {
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: insights, isLoading } = useCustomerInsights();

  // Must resolve the type casting invocation. Maybe this returns null and then the data
  if (!insights) return null;

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-paper-200"
        style={{ paddingBottom: tabBarBottomOffset }}
      >
        <CustomerInsightsSkeleton />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: tabBarBottomOffset }}
    >
      <CustomerInsightsTab insights={insights} />
    </View>
  );
}
