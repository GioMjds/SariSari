import React from 'react';
import { View } from 'react-native';
import Skeleton from '../ui/Skeleton';

export default function InventorySkeleton() {
  return (
    <View className="py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={`skeleton-${i}`}
          className="bg-paper-50 rounded-2xl p-4 mx-4 mb-3 border border-ink-100 shadow-paper"
        >
          {/* Top row: Name & status placeholder */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-3">
              <Skeleton width="60%" height={18} borderRadius={4} />
              <View className="mt-2">
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
            </View>
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>

          {/* Bottom row: Price & Stock placeholder */}
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row gap-6">
              <View>
                <Skeleton width={40} height={10} borderRadius={2} />
                <View className="mt-1.5">
                  <Skeleton width={60} height={16} borderRadius={4} />
                </View>
              </View>
              <View>
                <Skeleton width={40} height={10} borderRadius={2} />
                <View className="mt-1.5">
                  <Skeleton width={60} height={16} borderRadius={4} />
                </View>
              </View>
            </View>
            {/* Circular button placeholder */}
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>
        </View>
      ))}
    </View>
  );
}
