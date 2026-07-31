import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export function AnalyticsSkeleton() {
  return (
    <View className="p-4 gap-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          className="bg-paper-50 rounded-3xl p-4 border border-paper-300 gap-y-3"
        >
          <Skeleton width={140} height={14} />
          <Skeleton width="100%" height={120} />
        </View>
      ))}
    </View>
  );
}
