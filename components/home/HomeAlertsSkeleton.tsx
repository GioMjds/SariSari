import React, { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Skeleton from 'react-native-reanimated-skeleton';
import { useTabBarBottomOffset } from '@/components/layout';

const BONE_COLOR = '#EAE6DF';
const HIGHLIGHT_COLOR = '#FAFAF7';

type SkeletonLayout = NonNullable<ComponentProps<typeof Skeleton>['layout']>;

export function HomeAlertsSkeleton() {
  const tabBarBottomOffset = useTabBarBottomOffset();

  const layout: SkeletonLayout = [
    {
      key: 'filter-pills-row',
      width: '100%',
      height: 38,
      borderRadius: 20,
      marginBottom: 16,
    },
    {
      key: 'alert-card-1',
      width: '100%',
      height: 84,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'alert-card-2',
      width: '100%',
      height: 84,
      borderRadius: 20,
      marginBottom: 12,
    },
    {
      key: 'alert-card-3',
      width: '100%',
      height: 84,
      borderRadius: 20,
      marginBottom: 12,
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
