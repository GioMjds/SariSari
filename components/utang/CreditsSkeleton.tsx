import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

/**
 * CreditsSkeleton — paper-ledger loading placeholders. Mirrors the
 * real layout so the transition from skeleton → live data is
 * layout-shift-free.
 */
export function CreditsSkeleton() {
  return (
    <View className="py-2">
      {/* Hero placeholder — receipt-shaped card */}
      <View
        className="bg-paper-50 rounded-3xl mx-4 mb-4 border border-ink-100"
        style={{
          shadowColor: '#564E45',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Cinnamon header strip placeholder */}
        <View className="bg-cinnamon-500 rounded-t-3xl px-5 pt-5 pb-4">
          <View className="flex-row justify-between items-center">
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={50} height={12} borderRadius={4} />
          </View>
        </View>

        <View className="px-5 pt-4 pb-5">
          <View className="mb-3">
            <Skeleton width={140} height={24} borderRadius={6} />
          </View>
          <View className="mt-3 mb-3">
            <Skeleton width={'100%'} height={1} borderRadius={0} />
          </View>
          <View className="bg-paper-100 rounded-xl py-5 items-center border-y border-dashed border-ink-200">
            <Skeleton width={120} height={14} borderRadius={4} />
            <View className="mt-3">
              <Skeleton width={180} height={42} borderRadius={6} />
            </View>
          </View>

          {/* Two action button placeholders */}
          <View className="flex-row gap-2 mt-4">
            <Skeleton width={'50%'} height={42} borderRadius={10} />
            <Skeleton width={'50%'} height={42} borderRadius={10} />
          </View>
        </View>
      </View>

      {/* Compact metrics placeholder */}
      <View
        className="bg-paper-50 rounded-2xl mx-4 mb-4 border border-ink-100 p-3 flex-row items-center"
        style={{
          shadowColor: '#564E45',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`metric-${i}`} className="flex-1 items-center px-2">
            <Skeleton width={50} height={9} borderRadius={3} />
            <View className="mt-2">
              <Skeleton width={42} height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* Card placeholders */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={`card-${i}`}
          className="bg-paper-50 rounded-2xl mx-4 mb-3 border border-ink-100 p-4"
          style={{
            shadowColor: '#564E45',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <Skeleton width="60%" height={18} borderRadius={4} />
              <View className="mt-2">
                <Skeleton width="45%" height={12} borderRadius={4} />
              </View>
            </View>
            <View className="items-end">
              <Skeleton width={70} height={18} borderRadius={4} />
            </View>
          </View>

          <View className="border-t border-dashed border-ink-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Skeleton width={100} height={12} borderRadius={4} />
            <View className="flex-row gap-1.5">
              <Skeleton width={70} height={26} borderRadius={999} />
              <Skeleton width={60} height={26} borderRadius={999} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}