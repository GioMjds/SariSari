import React, { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Skeleton from 'react-native-reanimated-skeleton';
import { useTabBarBottomOffset } from '@/components/layout/StyledTab';

const BONE_COLOR = '#EAE6DF';
const HIGHLIGHT_COLOR = '#FAFAF7';

type SkeletonLayout = NonNullable<ComponentProps<typeof Skeleton>['layout']>;

export function TodaySnapshotSkeleton() {
  const tabBarBottomOffset = useTabBarBottomOffset();

  const layout: SkeletonLayout = [
    {
      key: 'sales-target-card',
      width: '100%',
      height: 130,
      borderRadius: 24,
      marginBottom: 16,
    },
    {
      key: 'cash-session-card',
      width: '100%',
      height: 150,
      borderRadius: 24,
      marginBottom: 16,
    },
    {
      key: 'hourly-timeline-card',
      width: '100%',
      height: 160,
      borderRadius: 24,
      marginBottom: 16,
    },
    {
      key: 'transaction-log-card',
      width: '100%',
      height: 180,
      borderRadius: 24,
      marginBottom: 16,
    },
  ];

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
