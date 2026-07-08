import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

export function SuppliersSkeleton() {
  return (
    <View className="py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={`supplier-skeleton-${i}`}
          className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-ink-100 flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            {/* Supplier Name placeholder */}
            <Skeleton width="50%" height={16} borderRadius={4} />

            {/* Contact info placeholder */}
            <View className="flex-row items-center mt-2">
              <Skeleton width="30%" height={12} borderRadius={4} />
            </View>

            {/* Notes placeholder */}
            <View className="mt-2">
              <Skeleton width="80%" height={12} borderRadius={4} />
            </View>
          </View>

          {/* Ellipsis button placeholder */}
          <Skeleton width={40} height={40} circle />
        </View>
      ))}
    </View>
  );
}
