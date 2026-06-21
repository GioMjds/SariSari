import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2';

/**
 * SalesSkeleton — three phantom paper-receipt shells that match the
 * chrome of <SaleRow> so the layout doesn't shift when real data lands.
 * Uses the same perforation pattern and shadow stack as the real rows.
 */

function PerforationRow({ side }: { side: 'top' | 'bottom' }) {
	return (
		<View className="relative h-0">
			<View
				className="absolute left-0 right-0 h-3 flex-row justify-between"
				style={side === 'top' ? { bottom: -6 } : { top: -6 }}
			>
				{Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
					<View
						key={`${side}-${i}`}
						className="w-3 h-3 rounded-full"
						style={{ backgroundColor: PERFORATION_BG }}
					/>
				))}
			</View>
		</View>
	);
}

function SkeletonRow() {
	return (
		<View className="mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100 shadow-paper-lift opacity-70">
			<PerforationRow side="top" />

			<View className="px-5 pt-4 pb-5">
				{/* Top row — ref + stamp */}
				<View className="flex-row items-start justify-between">
					<View className="flex-1 mr-3">
						<Skeleton width={70} height={10} />
						<Skeleton
							width={120}
							height={14}
							style={{ marginTop: 6 }}
						/>
						<Skeleton
							width={60}
							height={10}
							style={{ marginTop: 6 }}
						/>
					</View>
					<Skeleton width={64} height={26} borderRadius={6} />
				</View>

				{/* Spacer where dotted divider would sit */}
				<View className="my-4">
					<Skeleton width={'100%'} height={1} borderRadius={0} />
				</View>

				{/* Total + items */}
				<View className="flex-row items-end justify-between">
					<Skeleton width={140} height={28} borderRadius={6} />
					<View className="items-end">
						<Skeleton width={30} height={10} />
						<Skeleton
							width={50}
							height={12}
							style={{ marginTop: 4 }}
						/>
					</View>
				</View>
			</View>

			<PerforationRow side="bottom" />
			<View className="h-3" />
		</View>
	);
}

export function SalesSkeleton() {
	return (
		<View className="pt-2">
			<SkeletonRow />
			<SkeletonRow />
			<SkeletonRow />
		</View>
	);
}