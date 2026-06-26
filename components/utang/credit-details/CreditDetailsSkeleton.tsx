import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * CreditDetailsSkeleton — paper-ledger loading placeholder for the
 * Suki Ledger screen. Mirrors the real layout (slim top bar + hero +
 * tab strip + two card placeholders) so the swap from skeleton →
 * live data is layout-shift-free.
 *
 * Renders inside its own SafeAreaView so the screen can early-return
 * this component without extra wrappers.
 */
export function CreditDetailsSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Slim top bar — three skeleton slots */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View className="w-10 h-10" />
        <Skeleton width={120} height={20} borderRadius={6} />
        <View className="w-10 h-10" />
      </View>

      <View className="px-4 mt-4">
        {/* Hero card placeholder */}
        <Skeleton width={'100%'} height={120} borderRadius={20} shimmer />

        {/* Tab strip placeholder */}
        <View className="mt-3">
          <Skeleton width={'100%'} height={44} borderRadius={16} />
        </View>

        {/* Two card placeholders */}
        <View className="mt-4">
          <Skeleton width={'100%'} height={80} borderRadius={16} />
        </View>
        <View className="mt-3">
          <Skeleton width={'100%'} height={80} borderRadius={16} />
        </View>
      </View>
    </SafeAreaView>
  );
}
