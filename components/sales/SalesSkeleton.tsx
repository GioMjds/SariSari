import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

function SkeletonRow() {
  return (
    <View className="mx-4 mb-2 rounded-card border border-ink-100 bg-paper-50 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Skeleton width={110} height={10} />
        <Skeleton width={80} height={18} borderRadius={4} />
      </View>
      <View className="flex-row items-center justify-between mt-1.5">
        <Skeleton width={130} height={12} />
        <Skeleton width={54} height={18} borderRadius={6} />
      </View>
      <Skeleton width={180} height={10} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * SalesSkeleton — a day header plus compact rows that match <SaleRow>,
 * so the list does not jump when real data lands.
 */
export function SalesSkeleton() {
  return (
    <View className="pt-1">
      <View className="mx-4 mt-3 mb-2 flex-row justify-between">
        <Skeleton width={100} height={12} />
        <Skeleton width={120} height={10} />
      </View>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}
