import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

export function CustomerInsightsSkeleton() {
  return (
    <View className="flex-1 p-4 bg-paper-200">
      {/* Top Spenders Card Placeholder */}
      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 mb-4 shadow-sm">
        <Skeleton width={110} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={`top-spender-skel-${i}`}
            className="flex-row justify-between items-center py-2.5 border-b border-paper-200 last:border-b-0"
          >
            <Skeleton width="45%" height={14} borderRadius={4} />
            <Skeleton width="25%" height={14} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Credit Recovery Rate Card Placeholder */}
      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 mb-4 shadow-sm">
        <Skeleton width={150} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={36} borderRadius={6} style={{ marginVertical: 6 }} />
        <Skeleton width="85%" height={12} borderRadius={4} />
      </View>

      {/* Average Order Value Card Placeholder */}
      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 shadow-sm">
        <Skeleton width={160} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={36} borderRadius={6} style={{ marginVertical: 6 }} />
      </View>
    </View>
  );
}
