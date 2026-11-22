import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProductsSkeleton() {
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
