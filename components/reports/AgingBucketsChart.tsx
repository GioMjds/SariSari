import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { AgingBucket, StockItem } from '@/types';
import { MotiView } from 'moti';
import { memo, useRef } from 'react';
import { View } from 'react-native';

/**
 * CreditAgingChart — Suki debt aging rendered as four "postage
 * stamps" arranged in a row. Each stamp is a rotated, double-bordered
 * card with a day range label, amount, and count. The visual is
 * intentionally busy — like a stack of debt notices on a corkboard.
 */
type CreditAgingChartProps = {
	buckets: AgingBucket[];
	totalOutstanding: number;
};

const STAMP_BG: { bg: string; border: string; text: string; tone: string }[] = [
	{ bg: 'bg-sage-50', border: 'border-sage-500', text: 'text-sage-700', tone: 'sage' },
	{ bg: 'bg-semantic-info-50', border: 'border-semantic-info', text: 'text-semantic-info', tone: 'info' },
	{ bg: 'bg-semantic-warning-50', border: 'border-semantic-warning', text: 'text-semantic-warning', tone: 'warning' },
	{ bg: 'bg-semantic-danger-50', border: 'border-semantic-danger', text: 'text-semantic-danger', tone: 'danger' },
];

export const CreditAgingChart = memo(function CreditAgingChart({ buckets, totalOutstanding }: CreditAgingChartProps) {
	// Track whether this is the very first render. On first paint we skip
	// the entrance animation; subsequent data changes (date-range/refresh)
	// flip `hasMounted` to true so the stamp-pop animation plays.
	const hasMounted = useRef(false);
	const animationKey = buckets.map((b) => `${b.range}:${b.amount}`).join('|');

	if (buckets.length === 0) {
		return (
			<View className="py-4 items-center">
				<StyledText
					variant="extrabold"
					className="text-label text-ink-300 mb-1"
					style={{ letterSpacing: 1.6 }}
				>
					NO OUTSTANDING DEBT
				</StyledText>
				<StyledText variant="medium" className="text-ink-400 text-xs">
					All suki accounts are settled.
				</StyledText>
			</View>
		);
	}

	// After the empty-state guard so we only flip once real buckets are shown.
	const shouldAnimate = hasMounted.current;
	if (!hasMounted.current) hasMounted.current = true;

	return (
		<View>
			{/* Stack of postage stamps */}
			<View className="flex-row flex-wrap justify-between gap-2">
				{buckets.map((bucket, index) => {
					const stamp = STAMP_BG[index % STAMP_BG.length];
					const pct =
						totalOutstanding > 0
						? (bucket.amount / totalOutstanding) * 100
						: 0;
					const rotate = index % 2 === 0 ? -1.5 : 1.5;

					return (
						<MotiView
							key={`bucket-${animationKey}-${index}`}
							from={shouldAnimate ? { opacity: 0, scale: 0.92, rotate: '0deg' } : undefined}
							animate={{ opacity: 1, scale: 1, rotate: `${rotate}deg` }}
							transition={{
								type: 'spring',
								damping: 14,
								stiffness: 180,
								delay: shouldAnimate ? 80 * index : 0,
							}}
							className={`flex-1 min-w-[45%] rounded-md ${stamp.bg} ${stamp.border} border-2 border-dashed p-3 shadow-paper`}
						>
							<StyledText
								variant="extrabold"
								className={`text-label ${stamp.text}`}
								style={{ letterSpacing: 1.4 }}
							>
								{bucket.range.toUpperCase()}
							</StyledText>

							<View className="mt-2">
								<MoneyText
									value={bucket.amount}
									size="md"
									variant="default"
									className={`${stamp.text} text-base`}
								/>
							</View>

							<View className="mt-2 flex-row items-baseline justify-between">
								<StyledText
									variant="medium"
									className="text-ink-500 text-[10px] uppercase"
									style={{ letterSpacing: 0.6 }}
								>
									{bucket.count} {bucket.count === 1 ? 'suki' : 'sukis'}
								</StyledText>
								<StyledText
									variant="extrabold"
									className={`text-[10px] ${stamp.text}`}
									style={{ letterSpacing: 0.4 }}
								>
									{Math.round(pct)}%
								</StyledText>
							</View>

							{/* Stamp bar */}
							<View className="mt-1.5 h-1 bg-paper-50/50 rounded-full overflow-hidden">
								<View
									className="h-full"
									style={{
										width: `${pct}%`,
										backgroundColor:
										stamp.tone === 'sage'
										? '#4F7A24'
										: stamp.tone === 'info'
										? '#2E6FA8'
										: stamp.tone === 'warning'
										? '#C77B0E'
										: '#C13030',
									}}
								/>
							</View>
						</MotiView>
					);
				})}
			</View>
		</View>
	);
});

/**
 * StockMovementDetails — A small "stock ticker" style row showing
 * the day's inventory movement (sold, low, out). Designed to read
 * at a glance — like the side data table in a financial report.
 */
type StockMovementDetailsProps = {
	itemsSold: number;
	lowStockCount: number;
	outOfStockCount: number;
	fastMoving: StockItem[];
	slowMoving: StockItem[];
};

export const StockMovementDetails = memo(function StockMovementDetails({
	itemsSold,
	lowStockCount,
	outOfStockCount,
	fastMoving,
	slowMoving,
}: StockMovementDetailsProps) {
	return (
		<View>
			{/* Ticker row */}
			<View className="flex-row items-stretch rounded-md border border-ink-200 overflow-hidden">
				<View className="flex-1 p-3 border-r border-dashed border-ink-200">
					<StyledText
						variant="extrabold"
						className="text-label text-sage-600 mb-1"
						style={{ letterSpacing: 1.2 }}
					>
						SOLD
					</StyledText>
					<StyledText
						variant="black"
						className="text-ink-900"
						style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
					>
						{itemsSold}
					</StyledText>
					<StyledText variant="medium" className="text-ink-500 text-[10px]">
						units out the door
					</StyledText>
				</View>
				<View className="flex-1 p-3 border-r border-dashed border-ink-200">
					<StyledText
						variant="extrabold"
						className="text-label text-semantic-warning mb-1"
						style={{ letterSpacing: 1.2 }}
					>
						LOW
					</StyledText>
					<StyledText
						variant="black"
						className="text-ink-900"
						style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
					>
						{lowStockCount}
					</StyledText>
					<StyledText variant="medium" className="text-ink-500 text-[10px]">
						items need restock
					</StyledText>
				</View>
				<View className="flex-1 p-3">
					<StyledText
						variant="extrabold"
						className="text-label text-semantic-danger mb-1"
						style={{ letterSpacing: 1.2 }}
					>
						OUT
					</StyledText>
					<StyledText
						variant="black"
						className="text-ink-900"
						style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
					>
						{outOfStockCount}
					</StyledText>
					<StyledText variant="medium" className="text-ink-500 text-[10px]">
						empty shelves
					</StyledText>
				</View>
			</View>

			{/* Fast / Slow comparison */}
			<View className="mt-3 flex-row gap-3">
				<View className="flex-1 rounded-md border border-ink-200 p-3 bg-sage-50/50">
					<View className="flex-row items-center mb-2">
						<View className="w-1.5 h-1.5 rounded-full bg-sage-500 mr-1.5" />
						<StyledText
							variant="extrabold"
							className="text-label text-sage-700"
							style={{ letterSpacing: 1.4 }}
						>
							FAST MOVERS
						</StyledText>
					</View>
					{fastMoving.length === 0 ? (
						<StyledText variant="medium" className="text-ink-400 text-[10px]">
							None yet
						</StyledText>
					) : (
						fastMoving.slice(0, 4).map((item) => (
							<StyledText
								key={item.id}
								variant="medium"
								className="text-ink-700 text-[10px] mt-1"
								numberOfLines={1}
							>
								· {item.name}
							</StyledText>
						))
					)}
				</View>

				<View className="flex-1 rounded-md border border-ink-200 p-3 bg-semantic-warning-50/40">
					<View className="flex-row items-center mb-2">
						<View className="w-1.5 h-1.5 rounded-full bg-semantic-warning mr-1.5" />
						<StyledText
							variant="extrabold"
							className="text-label text-semantic-warning"
							style={{ letterSpacing: 1.4 }}
						>
							SLOW MOVERS
						</StyledText>
					</View>
					{slowMoving.length === 0 ? (
						<StyledText variant="medium" className="text-ink-400 text-[10px]">
							None yet
						</StyledText>
					) : (
						slowMoving.slice(0, 4).map((item) => (
							<StyledText
								key={item.id}
								variant="medium"
								className="text-ink-700 text-[10px] mt-1"
								numberOfLines={1}
							>
								· {item.name}
							</StyledText>
						))
					)}
				</View>
			</View>
		</View>
	);
});