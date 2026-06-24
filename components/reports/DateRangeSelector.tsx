import { StyledText } from '@/components/elements';
import { DateRangeType } from '@/types';
import { ScrollView, TouchableOpacity, View } from 'react-native';

interface DateRangeSelectorProps {
	activeRange: DateRangeType;
	onRangeChange: (range: DateRangeType) => void;
}

const ranges: { type: DateRangeType; label: string }[] = [
	{ type: 'today', label: 'Today' },
	{ type: 'yesterday', label: 'Yesterday' },
	{ type: 'last7days', label: '7 Days' },
	{ type: 'thisMonth', label: 'This Month' },
];

/**
 * DateRangeSelector — Capsule date chips styled to match the
 * almanac aesthetic. Active chip uses a flat dark fill with a
 * small paper-color kicker; inactive chips are flat paper.
 */
export function DateRangeSelector({
	activeRange,
	onRangeChange,
}: DateRangeSelectorProps) {
	return (
		<View>
			<View className="flex-row items-center mb-2">
				<StyledText
					variant="extrabold"
					className="text-label text-ink-500"
					style={{ letterSpacing: 1.4 }}
				>
					ISSUE SCOPE
				</StyledText>
				<View className="h-px bg-ink-200 flex-1 ml-2" />
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingRight: 12 }}
			>
				{ranges.map((range) => {
					const isActive = activeRange === range.type;
					return (
						<TouchableOpacity
							key={range.type}
							activeOpacity={0.7}
							onPress={() => onRangeChange(range.type)}
							className={`mr-2 rounded-pill overflow-hidden border ${
								isActive
									? 'bg-ink-900 border-ink-900'
									: 'bg-paper-50 border-ink-200'
							}`}
						>
							<View className="px-4 py-2 flex-row items-center">
								{isActive && (
									<View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-1.5" />
								)}
								<StyledText
									variant={isActive ? 'extrabold' : 'semibold'}
									className={`text-xs ${
										isActive ? 'text-paper-50' : 'text-ink-700'
									}`}
									style={{ letterSpacing: 0.4 }}
								>
									{range.label}
								</StyledText>
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
		</View>
	);
}