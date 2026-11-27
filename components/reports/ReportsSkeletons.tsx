import { Skeleton } from '@/components/ui';
import { View } from 'react-native';

const card = 'bg-paper-50 rounded-2xl border border-ink-100/60 shadow-sm';
const tile = 'border border-ink-200 rounded-xl bg-paper-50';

function TileSkeleton() {
  return (
    <View className={`flex-1 p-4 gap-y-2 ${card}`}>
      <Skeleton width={90} height={10} borderRadius={4} />
      <Skeleton width={100} height={24} borderRadius={6} />
      <Skeleton width="80%" height={12} borderRadius={4} />
    </View>
  );
}

function RowsSkeleton({ rows, withAvatar }: { rows: number; withAvatar?: boolean }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center justify-between py-2 border-b border-ink-100/50"
        >
          <View className="flex-row items-center flex-1 mr-3 gap-2">
            {withAvatar && <Skeleton width={24} height={24} circle />}
            <Skeleton width="60%" height={14} borderRadius={4} />
          </View>
          <Skeleton width={70} height={16} borderRadius={4} />
        </View>
      ))}
    </>
  );
}

export function InsightsSkeleton() {
  return (
    <View className={`mt-3 p-4 gap-y-2 ${card}`}>
      <Skeleton width="40%" height={14} borderRadius={4} />
      <Skeleton width="90%" height={12} borderRadius={4} />
      <Skeleton width="70%" height={12} borderRadius={4} />
    </View>
  );
}

export function KpiSkeleton() {
  return (
    <View className="gap-y-3">
      <View className={`p-5 gap-y-3 ${card}`}>
        <Skeleton width={140} height={12} borderRadius={4} />
        <Skeleton width={180} height={40} borderRadius={6} />
        <Skeleton width="60%" height={14} borderRadius={4} />
        <Skeleton width="100%" height={12} borderRadius={6} />
      </View>
      <View className="flex-row gap-3">
        <TileSkeleton />
        <TileSkeleton />
      </View>
      <View className="flex-row gap-3">
        <TileSkeleton />
        <TileSkeleton />
      </View>
    </View>
  );
}

export function TrendSkeleton() {
  return (
    <View className="py-2 gap-y-4">
      <Skeleton width="100%" height={180} borderRadius={12} />
      <Skeleton width="100%" height={24} borderRadius={6} />
      <View className="flex-row justify-between">
        <Skeleton width={100} height={14} borderRadius={4} />
        <Skeleton width={100} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

export function TopProductsSkeleton() {
  return (
    <View className="py-2 gap-y-4">
      <Skeleton width={160} height={12} borderRadius={4} />
      <RowsSkeleton rows={3} withAvatar />
      <View className="my-2 h-px bg-ink-200" />
      <Skeleton width={180} height={12} borderRadius={4} />
      <RowsSkeleton rows={3} />
    </View>
  );
}

export function StockSkeleton() {
  return (
    <View className="py-2 gap-y-4">
      <View className="flex-row gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className={`flex-1 p-3 gap-y-1.5 ${tile}`}>
            <Skeleton width={50} height={10} borderRadius={4} />
            <Skeleton width={40} height={20} borderRadius={4} />
          </View>
        ))}
      </View>
      <View className={`flex-row p-3 gap-3 ${tile}`}>
        <View className="flex-1 gap-y-2">
          <Skeleton width={60} height={10} borderRadius={4} />
          <Skeleton width={80} height={16} borderRadius={4} />
        </View>
        <View className="flex-1 gap-y-2">
          <Skeleton width={60} height={10} borderRadius={4} />
          <Skeleton width={80} height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function AgingSkeleton() {
  return (
    <View className="py-2 gap-y-4">
      <Skeleton width="100%" height={140} borderRadius={12} />
      <View className="flex-row gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <View key={i} className={`flex-1 p-3 gap-y-2 ${tile}`}>
            <Skeleton width={60} height={10} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function SessionsSkeleton() {
  return (
    <View className="py-2 gap-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className={`p-4 gap-y-2 ${tile}`}>
          <View className="flex-row justify-between items-center">
            <Skeleton width={100} height={16} borderRadius={4} />
            <Skeleton width={50} height={18} borderRadius={10} />
          </View>
          <View className="flex-row gap-3">
            <Skeleton width={90} height={12} borderRadius={4} />
            <Skeleton width={90} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}
