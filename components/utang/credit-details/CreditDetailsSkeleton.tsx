import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * Loading placeholder that mirrors the ledger layout (app bar, balance
 * card, tab strip, rows, action bar) so the swap to live data does not shift.
 */
export function CreditDetailsSkeleton() {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 40);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop }}>
      <View className="px-4 pt-2 pb-3 flex-row items-center border-b border-ink-100">
        <Skeleton width={44} height={44} borderRadius={22} />
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginLeft: 12 }} />
        <View className="ml-2.5 gap-1.5">
          <Skeleton width={140} height={16} borderRadius={6} />
          <Skeleton width={100} height={12} borderRadius={6} />
        </View>
      </View>

      <View className="px-4 mt-4 gap-3">
        <Skeleton width={'100%'} height={210} borderRadius={24} shimmer />
        <Skeleton width={'100%'} height={48} borderRadius={16} />
        <Skeleton width={'100%'} height={96} borderRadius={16} />
        <Skeleton width={'100%'} height={96} borderRadius={16} />
      </View>
    </View>
  );
}
