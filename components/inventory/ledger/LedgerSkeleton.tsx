import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * LedgerSkeleton — loading placeholder for the Inventory Ledger
 * screen. Mirrors the real layout (slim top bar + hero receipt +
 * toolbar block + day-separator + timeline rows) so the swap from
 * skeleton → live data is layout-shift-free.
 *
 * Renders inside its own SafeAreaView so the screen can early-return
 * this component without extra wrappers — same pattern as
 * `components/utang/credit-details/CreditDetailsSkeleton.tsx`.
 */
export function LedgerSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Slim top bar — back + eyebrow */}
      <View className="px-5 pt-3 pb-2 flex-row items-center">
        <Skeleton width={40} height={40} borderRadius={9999} />
        <View className="flex-1 ml-3">
          <Skeleton width={140} height={18} borderRadius={4} />
          <Skeleton
            width={90}
            height={10}
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      {/* Hero card placeholder — big rectangular block */}
      <View className="px-4 mt-3">
        <Skeleton width={'100%'} height={140} borderRadius={20} shimmer />
      </View>

      {/* Toolbar block placeholder — search + chip strip */}
      <View className="px-4 mt-4">
        <View className="bg-paper-50 border border-ink-100 rounded-2xl p-2">
          <Skeleton width={'100%'} height={40} borderRadius={12} />
          <View className="mt-2 bg-paper-100 rounded-xl p-2">
            <View className="flex-row gap-1">
              <Skeleton width={64} height={28} borderRadius={9999} />
              <Skeleton width={76} height={28} borderRadius={9999} />
              <Skeleton width={68} height={28} borderRadius={9999} />
              <Skeleton width={82} height={28} borderRadius={9999} />
            </View>
          </View>
        </View>
      </View>

      {/* Day separator + timeline row placeholders */}
      <View className="px-4 mt-4">
        <View className="flex-row items-center bg-paper-100 border border-ink-100 rounded-xl px-3 py-2 mb-2.5">
          <Skeleton width={6} height={6} borderRadius={3} />
          <Skeleton
            width={48}
            height={10}
            borderRadius={4}
            style={{ marginLeft: 8 }}
          />
        </View>

        <Skeleton width={'100%'} height={84} borderRadius={16} shimmer />
        <View className="h-2.5" />
        <Skeleton width={'100%'} height={84} borderRadius={16} shimmer />
      </View>
    </SafeAreaView>
  );
}
