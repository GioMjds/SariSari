import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * DashboardSkeleton — placeholder for the four dashboard zones:
 * hero, quick actions, alert row, and the attention queue. Mirrors
 * the final hierarchy so the transition from skeleton to live data
 * is layout-shift-free.
 */
export function DashboardSkeleton() {
  return (
    <View className="pt-3">
      {/* Hero placeholder */}
      <View
        className="bg-paper-50 rounded-3xl mx-4 mb-4 border border-ink-100"
      >
        {/* Cinnamon header strip */}
        <View className="bg-cinnamon-500 rounded-t-3xl px-5 pt-5 pb-4">
          <View className="flex-row justify-between items-center">
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={50} height={12} borderRadius={4} />
          </View>
        </View>
        <View className="px-5 pt-4 pb-5">
          <View className="bg-paper-100 rounded-xl py-5 border-y border-dashed border-ink-200 items-center">
            <Skeleton width={180} height={42} borderRadius={6} />
          </View>
          <View className="mt-3">
            <Skeleton width="100%" height={14} borderRadius={4} />
          </View>
          <View className="mt-2">
            <Skeleton width="80%" height={14} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Quick actions placeholder */}
      <View className="px-4 mb-4">
        <Skeleton width="100%" height={56} borderRadius={16} />
        <View className="flex-row gap-2.5 mt-2.5">
          <Skeleton width={'50%'} height={56} borderRadius={16} />
          <Skeleton width={'50%'} height={56} borderRadius={16} />
        </View>
      </View>

      {/* Attention-queue placeholder */}
      <View className="px-4">
        <View
          className="bg-paper-50 rounded-xl border border-ink-100 mb-3"
        >
          <View className="px-4 pt-3 pb-3 flex-row justify-between border-b border-dashed border-ink-200">
            <Skeleton width={90} height={14} borderRadius={4} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
          <View className="px-4 py-3">
            {[0, 1, 2].map((i) => (
              <View
                key={`row-${i}`}
                className={`flex-row justify-between items-center py-4 ${
                  i < 2 ? 'border-b border-dashed border-ink-200' : ''
                }`}
              >
                <Skeleton width={'55%'} height={14} borderRadius={4} />
                <Skeleton width={60} height={14} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}