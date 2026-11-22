import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

// Mirrors the shelf summary card and category rows so content lands without a jump.
export function CategoriesSkeleton() {
  return (
    <View className="pt-2">
      <View className="mx-4 mb-3 p-4 rounded-card bg-paper-50 border border-ink-100">
        <View className="flex-row items-start justify-between">
          <View className="gap-y-2">
            <Skeleton width={72} height={10} borderRadius={4} />
            <Skeleton width={110} height={26} borderRadius={6} />
            <Skeleton width={96} height={10} borderRadius={4} />
          </View>
          <Skeleton width={76} height={44} borderRadius={22} />
        </View>
        <View className="mt-4 pt-3 border-t border-dashed border-paper-400 gap-y-2.5">
          <Skeleton width="100%" height={10} borderRadius={5} />
          <Skeleton width="70%" height={10} borderRadius={4} />
        </View>
      </View>

      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={`cat-skeleton-${i}`}
          className="bg-paper-50 rounded-2xl p-3 mb-2 mx-4 border border-ink-100 flex-row items-center"
        >
          <Skeleton width={48} height={48} borderRadius={12} />
          <View className="flex-1 px-3 gap-y-2">
            <Skeleton width="55%" height={14} borderRadius={4} />
            <Skeleton width="30%" height={10} borderRadius={4} />
            <Skeleton width="100%" height={4} borderRadius={2} />
          </View>
          <Skeleton width={32} height={32} circle />
        </View>
      ))}
    </View>
  );
}
