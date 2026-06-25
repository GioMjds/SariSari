import { StyledText } from '@/components/elements';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { formatCompactCurrency } from '@/utils';

interface SimpleBarChartProps {
	data: { date: string; amount: number }[];
	height?: number;
	barColor?: string;
	/** Highlight color for the maximum bar */
	accentColor?: string;
}

/**
 * AlmanacBarChart — A "newspaper column" chart styled like the
 * financial pages of an almanac. Bars are tall, inked rectangles
 * with a tick-mark top and a price label above. The tallest bar
 * is rendered in the accent color (ink) to call out the peak day.
 *
 * Renders an empty-state plate when there is no data so the layout
 * doesn't collapse.
 */
export function AlmanacBarChart({
	data,
	height = 200,
	barColor = '#623418', // cinnamon-500
	accentColor = '#E85A1F', // persimmon-500
}: SimpleBarChartProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	if (data.length === 0) {
		return (
			<View
				className="items-center justify-center border border-dashed border-ink-200 rounded-md"
				style={{ height }}
			>
				<StyledText
					variant="extrabold"
					className="text-label text-ink-300 mb-1"
					style={{ letterSpacing: 1.6 }}
				>
					NO DATA RECORDED
				</StyledText>
				<StyledText variant="medium" className="text-ink-400 text-xs">
					Try a wider date range.
				</StyledText>
			</View>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.amount), 1);
	const maxIndex = data.reduce(
		(maxIdx, p, i, arr) => (p.amount > arr[maxIdx].amount ? i : maxIdx),
		0,
	);
	const todayIndex = data.length - 1;

	const formatLabel = (v: number) => {
		return formatCompactCurrency(v);
	};

	return (
		<View>
			{/* Headline row */}
			<View className="flex-row items-baseline justify-between mb-3">
				<StyledText
					variant="extrabold"
					className="text-label text-ink-400"
					style={{ letterSpacing: 1.4 }}
				>
					DAILY SALES · ₱ PESOS
				</StyledText>
				<StyledText
					variant="medium"
					className="text-mono text-ink-500"
				>
					PEAK {formatLabel(maxValue)}
				</StyledText>
			</View>

			{/* Chart area */}
			<View
				className="flex-row items-end justify-between px-1"
				style={{ height }}
			>
				{data.map((point, index) => {
					const barHeight = (point.amount / maxValue) * (height - 56);
					const isPeak = index === maxIndex;
					const isToday = index === todayIndex;
					const isSelected = selectedIndex === index;
					const fill = isPeak
						? accentColor
						: isSelected
							? '#623418'
							: barColor;

					return (
						<Pressable
							key={`bar-${index}`}
							onPress={() => setSelectedIndex(isSelected ? null : index)}
							className="flex-1 items-center justify-end mx-0.5"
						>
							{/* Value label (only on peak or selected for clarity) */}
							<MotiView
								from={{ opacity: 0 }}
								animate={{ opacity: isPeak || isSelected ? 1 : 0 }}
								transition={{ type: 'timing', duration: 220 }}
								className="mb-1"
							>
								<StyledText
									variant="extrabold"
									className="text-[10px] text-ink-900"
									style={{ letterSpacing: 0.4 }}
								>
									{formatLabel(point.amount)}
								</StyledText>
							</MotiView>

							{/* Inked column */}
							<View className="w-full items-center">
								<View
									className="w-full"
									style={{
										height: Math.max(barHeight, 6),
										backgroundColor: fill,
									}}
								/>
								{/* Tick mark base (a 1px dark line under the bar) */}
								<View className="w-full h-[2px] bg-ink-900 mt-0" />
							</View>

							{/* Day label */}
							<View className="mt-2 items-center">
								<StyledText
									variant="semibold"
									className={`text-[11px] ${
										isToday ? 'text-persimmon-600' : 'text-ink-700'
									}`}
									style={{ letterSpacing: 0.3 }}
								>
									{new Date(point.date).getDate()}
								</StyledText>
								<StyledText
									variant="medium"
									className="text-[8px] text-ink-400 uppercase"
									style={{ letterSpacing: 1 }}
								>
									{new Date(point.date).toLocaleString('en', { weekday: 'short' }).slice(0, 3)}
								</StyledText>
							</View>
						</Pressable>
					);
				})}
			</View>

			{/* Baseline rule */}
			<View className="h-px bg-ink-900 mt-2 mx-1" />
		</View>
	);
}

/**
 * Small re-export so existing callers don't break — the original
 * `SimpleBarChart` is now an almanac-styled chart but the name is
 * preserved for backwards compatibility.
 */
export { AlmanacBarChart as SimpleBarChart };