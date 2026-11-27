import React, { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Skeleton from 'react-native-reanimated-skeleton';
import { useTabBarBottomOffset } from '@/components/layout/StyledTab';

const BONE_COLOR = '#EAE6DF';
const HIGHLIGHT_COLOR = '#FAFAF7';

type SkeletonLayout = NonNullable<ComponentProps<typeof Skeleton>['layout']>;

export function HomeOverviewSkeleton() {
  const tabBarBottomOffset = useTabBarBottomOffset();

  // Mirrors the live layout so content lands where the bones were.
  const layout = [
    {
      key: 'today-card',
      width: '100%',
      height: 270,
      borderRadius: 16,
      marginBottom: 16,
    },
    {
      key: 'new-sale',
      width: '100%',
      height: 64,
      borderRadius: 16,
      marginBottom: 12,
    },
    {
      key: 'shortcuts',
      width: '100%',
      height: 76,
      borderRadius: 16,
      marginBottom: 24,
    },
    {
      key: 'attention',
      width: '100%',
      height: 180,
      borderRadius: 16,
      marginBottom: 24,
    },
    {
      key: 'money',
      width: '100%',
      height: 220,
      borderRadius: 16,
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
