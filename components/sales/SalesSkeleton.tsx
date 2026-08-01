import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { PerforationRow } from './PerforationRow';

function SkeletonRow() {
  return (
    <View className="mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100 shadow-paper-lift opacity-70">
      <PerforationRow side="top" />

      <View className="px-5 pt-4 pb-5">
        {/* Top row — ref + stamp */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Skeleton width={70} height={10} />
            <Skeleton width={120} height={14} style={{ marginTop: 6 }} />
            <Skeleton width={60} height={10} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={64} height={26} borderRadius={6} />
        </View>

        {/* Spacer where dotted divider would sit */}
        <View className="my-4">
          <Skeleton width={'100%'} height={1} borderRadius={0} />
        </View>

        {/* Total + items */}
        <View className="flex-row items-end justify-between">
          <Skeleton width={140} height={28} borderRadius={6} />
          <View className="items-end">
            <Skeleton width={30} height={10} />
            <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      <PerforationRow side="bottom" />
      <View className="h-3" />
    </View>
  );
}

/**
 * SalesSkeleton — three phantom paper-receipt shells that match the
 * chrome of <SaleRow> so the layout doesn't shift when real data lands.
 * Uses the same perforation pattern and shadow stack as the real rows.
 */
export function SalesSkeleton() {
  return (
    <View className="pt-2">
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}
