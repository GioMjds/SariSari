import { ReceiptHero, Skeleton } from '@/components/ui';
import { View } from 'react-native';

const LINE_ROWS = [0, 1, 2];

// Receipt-shaped placeholder so the ticket appears in place without layout jump.
export function SaleDetailsSkeleton() {
  return (
    <View
      className="pt-4 w-full self-center"
      style={{ maxWidth: 480 }}
      accessible
      accessibilityLabel="Loading resibo"
      accessibilityState={{ busy: true }}
    >
      <ReceiptHero headerLabel="OFFICIAL RESIBO">
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row justify-between">
            <View>
              <Skeleton width={80} height={10} />
              <Skeleton width={190} height={44} borderRadius={8} style={{ marginTop: 8 }} />
            </View>
            <Skeleton width={72} height={34} borderRadius={6} />
          </View>
          <Skeleton width={150} height={14} style={{ marginTop: 14 }} />
          <Skeleton width={120} height={12} style={{ marginTop: 8 }} />
        </View>
        <View className="px-5 pt-2 pb-4 gap-3">
          <Skeleton width="100%" height={14} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="100%" height={14} />
        </View>
        <View className="px-5 pb-5 gap-4">
          {LINE_ROWS.map((i) => (
            <View key={i} className="flex-row justify-between">
              <View className="flex-row">
                <Skeleton width={24} height={16} />
                <View style={{ marginLeft: 16 }}>
                  <Skeleton width={140} height={16} />
                  <Skeleton width={90} height={12} style={{ marginTop: 8 }} />
                </View>
              </View>
              <Skeleton width={64} height={16} />
            </View>
          ))}
        </View>
        <View className="px-5 pb-5 flex-row justify-between">
          <Skeleton width={60} height={12} />
          <Skeleton width={110} height={24} borderRadius={6} />
        </View>
      </ReceiptHero>
    </View>
  );
}
