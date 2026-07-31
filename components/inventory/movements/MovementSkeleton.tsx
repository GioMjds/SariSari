import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function MovementSkeleton() {
  return (
    <View className="gap-y-2 mt-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          className="bg-paper-50 mx-4 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3"
        >
          <Skeleton width={32} height={32} borderRadius={20} />
          <View className="flex-1 gap-y-1">
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={10} />
          </View>
          <Skeleton width={40} height={14} />
        </View>
      ))}
    </View>
  );
}
