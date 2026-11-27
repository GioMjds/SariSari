import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

// Mirrors the ledger layout (top bar, hero, toolbar, grouped rows) so the swap to data does not shift.
export function LedgerSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
    >
      <View className="px-4 pt-2 pb-2 flex-row items-center">
        <Skeleton width={44} height={44} borderRadius={9999} />
        <Skeleton width={120} height={18} borderRadius={4} style={{ marginLeft: 12 }} />
      </View>

      <View className="px-4 mt-2">
        <Skeleton width={'100%'} height={300} borderRadius={24} shimmer />
      </View>

      <View className="px-4 mt-4">
        <Skeleton width={'100%'} height={44} borderRadius={12} />
        <View className="flex-row gap-2 mt-2.5">
          <Skeleton width={64} height={44} borderRadius={9999} />
          <Skeleton width={84} height={44} borderRadius={9999} />
          <Skeleton width={72} height={44} borderRadius={9999} />
          <Skeleton width={88} height={44} borderRadius={9999} />
        </View>
      </View>

      <LedgerRowsSkeleton />
    </View>
  );
}

// Day label plus a grouped row block, shared by the full ledger skeleton and the movements list.
export function LedgerRowsSkeleton() {
  return (
    <View className="px-4 mt-5" accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      <Skeleton width={72} height={14} borderRadius={4} style={{ marginLeft: 8, marginBottom: 10 }} />
      <Skeleton width={'100%'} height={192} borderRadius={16} shimmer />
    </View>
  );
}
