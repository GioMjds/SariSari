import { memo } from 'react';
import { View } from 'react-native';
import { DayBucket } from './ledgerMath';

const HALF_HEIGHT = 22;

interface StockStripProps {
  buckets: DayBucket[];
  accessibilityLabel: string;
}

// Daily in and out as mirrored bars around a baseline, so busy days stand out at a glance.
export const StockStrip = memo(function StockStrip({
  buckets,
  accessibilityLabel,
}: StockStripProps) {
  let max = 1;
  for (const b of buckets) max = Math.max(max, b.added, b.removed);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className="flex-row items-center"
      style={{ height: HALF_HEIGHT * 2 + 1, gap: 2 }}
    >
      {buckets.map((b, i) => (
        <View key={i} className="flex-1 h-full">
          <View className="flex-1 justify-end">
            {b.added > 0 && (
              <View
                className="bg-sage-500 rounded-t-sm"
                style={{ height: Math.max(2, (b.added / max) * HALF_HEIGHT) }}
              />
            )}
          </View>
          <View className={i === buckets.length - 1 ? 'h-px bg-ink-700' : 'h-px bg-ink-200'} />
          <View className="flex-1">
            {b.removed > 0 && (
              <View
                className="bg-semantic-danger rounded-b-sm opacity-80"
                style={{ height: Math.max(2, (b.removed / max) * HALF_HEIGHT) }}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
});
