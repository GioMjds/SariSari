import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

export function CategoriesSkeleton() {
  return (
    <View className="py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={`cat-skeleton-${i}`}
          className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-ink-100"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {/* Circular placeholder for folder icon */}
              <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-ink-50">
                <Skeleton width={20} height={20} circle />
              </View>

              {/* Category Info placeholder */}
              <View className="flex-1 pr-2">
                <Skeleton width="60%" height={16} borderRadius={4} />
                <View className="mt-2">
                  <Skeleton width="30%" height={12} borderRadius={4} />
                </View>
              </View>
            </View>

            {/* Circular actions button placeholder */}
            <Skeleton width={40} height={40} circle />
          </View>
        </View>
      ))}
    </View>
  );
}
