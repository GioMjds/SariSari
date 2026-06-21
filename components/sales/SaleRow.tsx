import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusStamp } from '@/components/ui';

/**
 * SaleRow — a perforated paper-receipt row in the resibo book.
 * No business logic, no animation — kept pure so the parent FlatList
 * can wrap it in MotiView with a per-row stagger.
 */

interface SaleRowProps {
	sale: SaleWithItems;
	onPress: (id: number) => void;
}

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#EFE6D2'; // page bg = paper-200, so circles look bitten out

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

function padRef(id: number): string {
	return `№ ${String(id).padStart(5, '0')}`;
}

export default function SaleRow({ sale, onPress }: SaleRowProps) {
	const isCredit = sale.payment_type === 'credit';
	const stampTone: 'persimmon' | 'sage' = isCredit ? 'persimmon' : 'sage';
	const stampLabel = isCredit ? 'UTANG' : 'CASH';
	const stampRotate = isCredit ? -8 : 6;
	const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();
	const itemsLabel = `${sale.items_count} ${sale.items_count === 1 ? 'item' : 'items'}`;

	return (
		<TouchableOpacity
			onPress={() => onPress(sale.id)}
			activeOpacity={0.85}
			className="mx-4 mb-4 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
			style={{
				shadowColor: '#564E45',
				shadowOffset: { width: 0, height: 6 },
				shadowOpacity: 0.10,
				shadowRadius: 16,
				elevation: 4,
			}}
		>
			<PerforationRow side="top" />

			<View className="paper-texture px-5 pt-4 pb-5">
				{/* Top row — ref + stamp */}
				<View className="flex-row items-start justify-between mb-1">
					<View className="flex-1 mr-3">
						<StyledText
							variant="medium"
							className="text-mono text-ink-400"
						>
							{padRef(sale.id)}
						</StyledText>
						<StyledText
							variant="semibold"
							className="text-ink-900 text-base mt-0.5"
						>
							{format(timestamp, 'MMM dd, yyyy')}
						</StyledText>
						<StyledText
							variant="regular"
							className="text-ink-500 text-xs mt-0.5"
						>
							{format(timestamp, 'hh:mm a')}
						</StyledText>
					</View>

					<StatusStamp
						label={stampLabel}
						tone={stampTone}
						size="sm"
						rotate={stampRotate}
					/>
				</View>

				{/* Customer chip — credit only */}
				{isCredit && sale.customer_name && (
					<View className="self-start flex-row items-center bg-paper-200 rounded-pill px-3 py-1 mt-2">
						<FontAwesome name="user" size={11} color="#564E45" />
						<StyledText
							variant="medium"
							className="text-ink-700 text-xs ml-1.5"
						>
							{sale.customer_name}
						</StyledText>
					</View>
				)}

				{/* Dotted divider */}
				<View className="divider-dotted-thin my-4" />

				{/* Total + items */}
				<View className="flex-row items-end justify-between">
					<View className="flex-row items-baseline">
						<StyledText
							variant="medium"
							className="text-mono text-ink-500 mr-1.5 text-sm"
						>
							₱
						</StyledText>
						<MoneyText
							value={sale.total}
							fromPesos
							size="xl"
							className="text-ink-900"
						/>
					</View>

					<View className="items-end">
						<StyledText
							variant="extrabold"
							className="label-caps text-ink-400"
						>
							Qty
						</StyledText>
						<StyledText
							variant="semibold"
							className="text-mono text-ink-700 mt-0.5"
						>
							{itemsLabel}
						</StyledText>
					</View>
				</View>
			</View>

			<PerforationRow side="bottom" />
			<View className="h-3" />
		</TouchableOpacity>
	);
}