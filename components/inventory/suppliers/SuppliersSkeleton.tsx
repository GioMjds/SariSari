import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

// Mirrors the search bar and supplier rows so content lands without a jump.
export function SuppliersSkeleton() {
  return (
    <View className="pt-2">
      <View className="px-4 mb-3">
        <Skeleton width="100%" height={48} borderRadius={24} />
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={`supplier-skeleton-${i}`}
          className="bg-paper-50 rounded-2xl p-3 mb-2 mx-4 border border-ink-100 flex-row items-center"
        >
          <Skeleton width={48} height={48} borderRadius={12} />
          <View className="flex-1 px-3 gap-y-2">
            <Skeleton width="55%" height={14} borderRadius={4} />
            <Skeleton width="40%" height={10} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}
