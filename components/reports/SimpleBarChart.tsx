import StyledText from '@/components/elements/StyledText';
import { SalesDataPoint } from '@/types/reports.types';
import { View } from 'react-native';

interface SimpleBarChartProps {
	data: SalesDataPoint[];
	height?: number;
	barColor?: string;
}

export default function SimpleBarChart({ data, height = 200, barColor = '#7A1CAC' }: SimpleBarChartProps) {
	if (data.length === 0) {
		return (
			<View className="items-center justify-center" style={{ height }}>
				<StyledText variant="medium" className="text-gray-400">
					No data available
				</StyledText>
			</View>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.amount), 1);
	const barWidth = Math.min(40, 280 / data.length - 8);

	return (
		<View>
			{/* Chart Area */}
			<View className="flex-row items-end justify-around px-2" style={{ height }}>
				{data.map((point, index) => {
					const barHeight = (point.amount / maxValue) * (height - 40);

					return (
						<View key={index} className="items-center flex-1 mx-1">
							<View className="flex-1 justify-end mb-1">
								<StyledText variant="medium" className="text-gray-600 text-xs mb-1 text-center">
									₱{point.amount >= 1000 ? (point.amount / 1000).toFixed(1) + 'k' : point.amount.toFixed(0)}
								</StyledText>
								<View
									className="rounded-t-lg"
									style={{
										height: Math.max(barHeight, 4),
										backgroundColor: barColor,
										width: barWidth,
									}}
								/>
							</View>
							<StyledText variant="regular" className="text-gray-500 text-xs mt-1 text-center" numberOfLines={1}>
								{new Date(point.date).getDate()}
							</StyledText>
						</View>
					);
				})}
			</View>
		</View>
	);
}
