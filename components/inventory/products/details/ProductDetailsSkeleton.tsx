import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

// Mirrors the hero, tab strip and first card so the swap to data does not shift.
export function ProductDetailsSkeleton() {
  return (
    <View className="flex-1" accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      <View className="mx-4 mt-2 p-5 bg-paper-50 rounded-3xl border border-ink-100">
        <View className="flex-row items-center">
          <Skeleton width={64} height={64} borderRadius={12} />
          <View className="ml-4 flex-1">
            <Skeleton width="70%" height={22} borderRadius={4} />
            <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>
        <View className="flex-row mt-6">
          <View className="flex-1">
            <Skeleton width={60} height={10} borderRadius={4} />
            <Skeleton width={90} height={36} borderRadius={6} style={{ marginTop: 8 }} />
          </View>
          <View className="flex-1 ml-4">
            <Skeleton width={80} height={10} borderRadius={4} />
            <Skeleton width={110} height={30} borderRadius={6} style={{ marginTop: 8 }} />
          </View>
        </View>
        <Skeleton height={52} borderRadius={12} style={{ marginTop: 20 }} />
      </View>
      <View className="mx-4 mt-4">
        <Skeleton height={56} borderRadius={16} />
      </View>
      <View className="mx-4 mt-4">
        <Skeleton height={120} borderRadius={16} />
      </View>
    </View>
  );
}
