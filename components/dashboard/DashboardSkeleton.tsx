import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * DashboardSkeleton — layout-shift-free loading placeholder.
 */
export function DashboardSkeleton() {
  return (
    <View className="pt-3">
      {/* Context Header skeleton */}
      <View className="px-5 pb-4 bg-cinnamon-500">
        <View className="flex-row items-center justify-between">
          <Skeleton width={120} height={20} borderRadius={4} />
          <Skeleton width={36} height={36} borderRadius={18} />
        </View>
      </View>

      {/* Goal Card placeholder */}
      <View className="px-4 mt-3 mb-2">
        <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100">
          <Skeleton width={180} height={20} borderRadius={4} />
          <View className="mt-2">
            <Skeleton width="90%" height={14} borderRadius={4} />
          </View>
          <View className="mt-4">
            <Skeleton width="100%" height={44} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Quick Actions placeholder */}
      <View className="px-4 mb-4">
        <Skeleton width="100%" height={52} borderRadius={12} />
        <View className="flex-row gap-2.5 mt-2.5">
          <View className="flex-1">
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          <View className="flex-1">
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
        </View>
        <View className="flex-row gap-2.5 mt-2.5">
          <View className="flex-1">
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          <View className="flex-1">
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
        </View>
      </View>

      {/* Daily Pulse placeholder */}
      <View className="px-4 mb-4">
        <View className="flex-row gap-2.5">
          <Skeleton width={'50%'} height={72} borderRadius={16} />
          <Skeleton width={'50%'} height={72} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}