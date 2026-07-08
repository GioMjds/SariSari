import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

export function ProductsSkeleton() {
  return (
    <View className="py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={`skeleton-${i}`}
          className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm border border-ink-100"
        >
          {/* Top row: Name & status pill placeholder */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <Skeleton width="70%" height={16} borderRadius={4} />
              <View className="mt-2">
                <Skeleton width="45%" height={12} borderRadius={4} />
              </View>
            </View>
            <Skeleton width={50} height={20} borderRadius={10} />
          </View>

          {/* Dotted Divider */}
          <View className="border-t border-dashed border-ink-200 my-3" />

          {/* Bottom row: Three-column stats placeholder */}
          <View className="flex-row justify-between items-center">
            {/* Price Column */}
            <View className="flex-1">
              <Skeleton width="40%" height={10} borderRadius={2} />
              <View className="mt-1.5">
                <Skeleton width="60%" height={14} borderRadius={4} />
              </View>
            </View>

            {/* Stock Column */}
            <View className="flex-1 items-center">
              <Skeleton width="40%" height={10} borderRadius={2} />
              <View className="mt-1.5">
                <Skeleton width="30%" height={14} borderRadius={4} />
              </View>
            </View>

            {/* Profit Column */}
            <View className="flex-1 items-end">
              <Skeleton width="40%" height={10} borderRadius={2} />
              <View className="mt-1.5">
                <Skeleton width="50%" height={14} borderRadius={4} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
