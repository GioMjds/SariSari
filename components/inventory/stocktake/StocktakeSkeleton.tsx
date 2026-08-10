import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * StocktakeSkeleton — layout-shift-free loading placeholder for the Idle
 * state of the Stocktake screen. Mirrors the vertical structure of
 * <StocktakeStartCard /> followed by 2 <StocktakeHistoryList /> rows so the
 * real content slots in without jumping once the session query resolves.
 */
export function StocktakeSkeleton() {
  return (
    <View className="flex-1 bg-paper-200 p-4">
      {/* Start card placeholder (matches StocktakeStartCard layout) */}
      <View className="bg-paper-50 rounded-2xl p-5 border border-paper-300 shadow-sm gap-y-4">
        <View className="flex-row items-center gap-x-3">
          <Skeleton width={40} height={40} circle />
          <View className="flex-1 gap-y-1.5">
            <Skeleton width="45%" height={18} />
            <Skeleton width="65%" height={11} />
          </View>
        </View>

        <View className="bg-paper-100 rounded-xl p-3 flex-row items-center justify-between border border-paper-200">
          <Skeleton width={90} height={11} />
          <Skeleton width={70} height={14} />
        </View>

        <Skeleton width="100%" height={48} borderRadius={12} />
      </View>

      {/* History list placeholder (matches StocktakeHistoryList layout) */}
      <View className="gap-y-2 mt-4">
        <View className="px-1">
          <Skeleton width={140} height={12} />
        </View>
        {Array.from({ length: 2 }).map((_, i) => (
          <View
            key={i}
            className="bg-paper-50 rounded-xl p-4 border border-paper-200 flex-row items-center justify-between"
          >
            <View className="gap-y-1.5 flex-1 pr-3">
              <Skeleton width="55%" height={14} />
              <Skeleton width="40%" height={11} />
            </View>
            <View className="items-end gap-y-1.5">
              <Skeleton width={64} height={16} borderRadius={8} />
              <Skeleton width={50} height={11} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
