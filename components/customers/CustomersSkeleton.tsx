import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

export function CustomersSkeleton() {
  return (
    <View className="flex-1 bg-paper-200">
      {/* Search Input Bar Placeholder */}
      <View className="px-4 mt-1 mb-2">
        <Skeleton width="100%" height={44} borderRadius={12} />
      </View>

      {/* Filter Chips Placeholder */}
      <View className="px-4 py-1 flex-row gap-2 mb-2">
        <Skeleton width={60} height={28} borderRadius={14} />
        <Skeleton width={90} height={28} borderRadius={14} />
        <Skeleton width={70} height={28} borderRadius={14} />
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>

      {/* Directory Section Header Placeholder */}
      <View className="px-4 py-2 flex-row justify-between items-center mb-1">
        <Skeleton width={100} height={20} borderRadius={4} />
        <Skeleton width={60} height={16} borderRadius={4} />
      </View>

      {/* Customer List Card Placeholders */}
      <View className="px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={`cust-skeleton-${i}`}
            className="bg-paper-50 rounded-2xl p-4 mb-3 border border-ink-100/60 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <Skeleton width={44} height={44} circle />
              <View className="ml-3 flex-1">
                <Skeleton width="65%" height={16} borderRadius={4} />
                <View className="mt-2 flex-row items-center gap-2">
                  <Skeleton width="40%" height={12} borderRadius={4} />
                  <Skeleton width={50} height={16} borderRadius={8} />
                </View>
              </View>
            </View>

            <View className="items-end">
              <Skeleton width={72} height={24} borderRadius={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
