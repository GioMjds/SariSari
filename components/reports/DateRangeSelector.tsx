import StyledText from '@/components/elements/StyledText';
import { DateRangeType } from '@/types/reports.types';
import { ScrollView, TouchableOpacity } from 'react-native';

interface DateRangeSelectorProps {
	activeRange: DateRangeType;
	onRangeChange: (range: DateRangeType) => void;
}

const ranges: { type: DateRangeType; label: string }[] = [
	{ type: 'today', label: 'Today' },
	{ type: 'yesterday', label: 'Yesterday' },
	{ type: 'last7days', label: 'Last 7 Days' },
	{ type: 'thisMonth', label: 'This Month' },
];

export default function DateRangeSelector({ activeRange, onRangeChange }: DateRangeSelectorProps) {
	const handlePress = (range: DateRangeType) => {
		onRangeChange(range);
	};

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			className="mb-4"
			contentContainerStyle={{ paddingHorizontal: 4 }}
		>
			{ranges.map((range) => {
				const isActive = activeRange === range.type;
				return (
					<TouchableOpacity
						key={range.type}
						activeOpacity={0.7}
						onPress={() => handlePress(range.type)}
						className={`px-4 py-2 rounded-full mr-2 ${
							isActive ? 'bg-secondary' : 'bg-white border border-gray-200'
						}`}
					>
						<StyledText
							variant={isActive ? 'semibold' : 'medium'}
							className={`text-sm ${isActive ? 'text-white' : 'text-gray-600'}`}
						>
							{range.label}
						</StyledText>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}
