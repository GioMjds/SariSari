import React, { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Skeleton from 'react-native-reanimated-skeleton';
import { useTabBarBottomOffset } from '@/components/layout';

const BONE_COLOR = '#EAE6DF';
const HIGHLIGHT_COLOR = '#FAFAF7';

type SkeletonLayout = NonNullable<ComponentProps<typeof Skeleton>['layout']>;

export function HomeOverviewSkeleton() {
  const tabBarBottomOffset = useTabBarBottomOffset();

  const layout = [
    {
      key: 'hero-kpi-card',
      width: '100%',
      height: 110,
      borderRadius: 16,
      marginBottom: 12,
    },
    {
      key: 'kpi-grid',
      width: '100%',
      height: 220,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'goal-card',
      width: '100%',
      height: 160,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'quick-actions-card',
      width: '100%',
      height: 180,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'suggestions-card',
      width: '100%',
      height: 56,
      borderRadius: 14,
      marginBottom: 12,
    },
    {
      key: 'recent-sales-card',
      width: '100%',
      height: 220,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'mini-insights-card',
      width: '100%',
      height: 76,
      borderRadius: 20,
      marginBottom: 16,
    },
  ] satisfies SkeletonLayout;

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        <Skeleton
          isLoading={true}
          boneColor={BONE_COLOR}
          highlightColor={HIGHLIGHT_COLOR}
          animationType="pulse"
          containerStyle={{ flex: 1, width: '100%' }}
          layout={layout}
        />
      </View>
    </ScrollView>
  );
}
