import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useViewModeStore } from '@/stores/useViewModeStore';

export function ProductsSkeleton() {
  const isGrid = useViewModeStore((s) => s.modes.inventory === 'grid');

  if (isGrid) {
    return (
      <View className="mt-3 px-4 flex-row flex-wrap justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            className="w-[48.5%] mb-3 rounded-2xl bg-paper-50 border border-ink-100 overflow-hidden"
          >
            <Skeleton width="100%" height={96} borderRadius={0} />
            <View className="p-2.5 gap-y-1.5">
              <Skeleton width="90%" height={13} />
              <Skeleton width="70%" height={13} />
              <Skeleton width={56} height={16} />
              <Skeleton width="50%" height={10} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-y-2 mt-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          className="bg-paper-50 mx-4 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3"
        >
          <Skeleton width={68} height={68} borderRadius={12} />
          <View className="flex-1 gap-y-1.5">
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} />
            <Skeleton width={84} height={18} borderRadius={9} />
          </View>
          <Skeleton width={56} height={16} />
        </View>
      ))}
    </View>
  );
}
