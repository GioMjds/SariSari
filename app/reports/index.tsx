import StyledText from '@/components/elements/StyledText';
import DateRangeSelector from '@/components/reports/DateRangeSelector';
import InsightCard from '@/components/reports/InsightCard';
import ReportKPICard from '@/components/reports/ReportKPICard';
import SectionHeader from '@/components/reports/SectionHeader';
import SimpleBarChart from '@/components/reports/SimpleBarChart';
import { useReports } from '@/hooks/useReports';
import { DateRange, DateRangeType } from '@/types/reports.types';
import { getDateRangeFromType } from '@/utils/formatters';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Reports() {
	const [dateRangeType, setDateRangeType] = useState<DateRangeType>('today');
	const [dateRange, setDateRange] = useState<DateRange>(
		getDateRangeFromType('today')
	);

	// Get all report hooks
	const {
		useReportKPIs,
		useSalesOverTime,
		useTopSellingProducts,
		useSalesBreakdown,
		useInventoryMovement,
		useInventoryValue,
		useLowStockItems,
		useOutOfStockItems,
		useFastMovingProducts,
		useSlowMovingProducts,
		useCreditsOverview,
		useAgingBuckets,
		useProfitability,
		useReportInsights,
		invalidateReports,
	} = useReports();

	// Fetch all data using TanStack Query
	const kpisQuery = useReportKPIs(dateRange);
	const salesOverTimeQuery = useSalesOverTime(dateRange);
	const topProductsQuery = useTopSellingProducts(dateRange, 5);
	const salesBreakdownQuery = useSalesBreakdown(dateRange);
	const inventoryMovementQuery = useInventoryMovement(dateRange);
	const inventoryValueQuery = useInventoryValue();
	const lowStockItemsQuery = useLowStockItems(10);
	const outOfStockItemsQuery = useOutOfStockItems();
	const fastMovingProductsQuery = useFastMovingProducts(dateRange, 5);
	const slowMovingProductsQuery = useSlowMovingProducts(dateRange, 5);
	const creditsOverviewQuery = useCreditsOverview(dateRange);
	const agingBucketsQuery = useAgingBuckets();
	const profitabilityQuery = useProfitability(dateRange);
	const insightsQuery = useReportInsights(dateRange);

	// Determine loading states
	const isLoading =
		kpisQuery.isLoading ||
		salesOverTimeQuery.isLoading ||
		topProductsQuery.isLoading ||
		salesBreakdownQuery.isLoading ||
		inventoryMovementQuery.isLoading ||
		inventoryValueQuery.isLoading ||
		lowStockItemsQuery.isLoading ||
		outOfStockItemsQuery.isLoading ||
		fastMovingProductsQuery.isLoading ||
		slowMovingProductsQuery.isLoading ||
		creditsOverviewQuery.isLoading ||
		agingBucketsQuery.isLoading ||
		profitabilityQuery.isLoading ||
		insightsQuery.isLoading;

	const isRefreshing =
		kpisQuery.isFetching ||
		salesOverTimeQuery.isFetching ||
		topProductsQuery.isFetching ||
		salesBreakdownQuery.isFetching ||
		inventoryMovementQuery.isFetching ||
		inventoryValueQuery.isFetching ||
		lowStockItemsQuery.isFetching ||
		outOfStockItemsQuery.isFetching ||
		fastMovingProductsQuery.isFetching ||
		slowMovingProductsQuery.isFetching ||
		creditsOverviewQuery.isFetching ||
		agingBucketsQuery.isFetching ||
		profitabilityQuery.isFetching ||
		insightsQuery.isFetching;

	const kpis = kpisQuery.data ?? {
		totalSales: 0,
		totalProfit: 0,
		totalCreditsIssued: 0,
		totalCreditsCollected: 0,
		totalExpenses: 0,
		inventoryCostOut: 0,
	};
	const salesOverTime = salesOverTimeQuery.data ?? [];
	const topProducts = topProductsQuery.data ?? [];
	const salesBreakdown = salesBreakdownQuery.data ?? {
		cashSales: 0,
		creditSales: 0,
		averageTransactionValue: 0,
		totalTransactions: 0,
	};
	const inventoryMovement = inventoryMovementQuery.data ?? {
		itemsSold: 0,
		lowStockCount: 0,
		outOfStockCount: 0,
	};
	const inventoryValue = inventoryValueQuery.data ?? {
		currentStockValue: 0,
		potentialSalesValue: 0,
	};
	const lowStockItems = lowStockItemsQuery.data ?? [];
	const fastMovingProducts = fastMovingProductsQuery.data ?? [];
	const slowMovingProducts = slowMovingProductsQuery.data ?? [];
	const creditsOverview = creditsOverviewQuery.data ?? {
		issued: 0,
		collected: 0,
		outstanding: 0,
		activeAccounts: 0,
	};
	const agingBuckets = agingBucketsQuery.data ?? [];
	const profitability = profitabilityQuery.data ?? {
		totalProfit: 0,
		marginPercent: 0,
	};
	const insights = insightsQuery.data ?? [];

	const handleDateRangeChange = (type: DateRangeType) => {
		setDateRangeType(type);
		setDateRange(getDateRangeFromType(type));
	};

	const handleRefresh = async () => {
		await invalidateReports();
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	const formatCompactCurrency = (amount: number) => {
		if (amount >= 1000000) {
			return `₱${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `₱${(amount / 1000).toFixed(1)}k`;
		}
		return `₱${amount.toFixed(0)}`;
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#7A1CAC" />
					<StyledText variant="medium" className="text-gray-500 mt-4">
						Loading reports...
					</StyledText>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Header */}
			<View className="px-4 pt-4 pb-2 bg-background">
				<View className="flex-row items-center justify-between mb-4">
					<StyledText
						variant="extrabold"
						className="text-primary text-3xl"
					>
						Sales Reports
					</StyledText>
				</View>

				{/* Date Range Selector */}
				<DateRangeSelector
					activeRange={dateRangeType}
					onRangeChange={handleDateRangeChange}
				/>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor="#7A1CAC"
					/>
				}
			>
				<View className="px-4 pb-32">
					{/* Insights Section */}
					{insights.length > 0 && (
						<View className="mb-6">
							<SectionHeader
								title="Key Insights"
								icon="lightbulb-o"
							/>
							{insights.map((insight, index) => (
								<InsightCard
									key={index}
									{...insight}
									icon={insight.icon as keyof typeof FontAwesome.glyphMap}
								/>
							))}
						</View>
					)}

					{/* KPI Cards */}
					<View className="mb-6">
						<SectionHeader title="Overview" icon="dashboard" />
						<View className="flex-row gap-3 mb-3">
							<ReportKPICard
								title="Total Sales"
								value={formatCompactCurrency(kpis.totalSales)}
								icon="shopping-cart"
								color="#10b981"
							/>
							<ReportKPICard
								title="Total Profit"
								value={formatCompactCurrency(kpis.totalProfit)}
								icon="line-chart"
								color="#7A1CAC"
							/>
						</View>
						<View className="flex-row gap-3">
							<ReportKPICard
								title="Credits Issued"
								value={formatCompactCurrency(
									kpis.totalCreditsIssued
								)}
								icon="credit-card"
								color="#f59e0b"
							/>
							<ReportKPICard
								title="Credits Collected"
								value={formatCompactCurrency(
									kpis.totalCreditsCollected
								)}
								icon="money"
								color="#3b82f6"
							/>
						</View>
					</View>

					{/* Sales Section */}
					<View className="mb-6">
						<SectionHeader title="Sales Report" icon="bar-chart" />

						{/* Sales Over Time Chart */}
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-4"
							>
								Sales Trend
							</StyledText>
							<SimpleBarChart data={salesOverTime} height={180} />
						</View>

						{/* Sales Breakdown */}
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Payment Breakdown
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Cash Sales
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{formatCurrency(salesBreakdown.cashSales)}
								</StyledText>
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Credit Sales
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{formatCurrency(salesBreakdown.creditSales)}
								</StyledText>
							</View>
							<View className="border-t border-gray-200 my-2" />
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Total Transactions
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{salesBreakdown.totalTransactions}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Average Transaction
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{formatCurrency(
										salesBreakdown.averageTransactionValue
									)}
								</StyledText>
							</View>
						</View>

						{/* Top Selling Products */}
						<View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Top Selling Products
							</StyledText>
							{topProducts.length > 0 ? (
								topProducts.map((product, index) => (
									<View key={product.id} className="mb-3">
										<View className="flex-row items-center justify-between mb-1">
											<View className="flex-row items-center flex-1">
												<View
													className="w-6 h-6 rounded-full items-center justify-center mr-2"
													style={{
														backgroundColor:
															'#7A1CAC20',
													}}
												>
													<StyledText
														variant="semibold"
														className="text-secondary text-xs"
													>
														{index + 1}
													</StyledText>
												</View>
												<StyledText
													variant="semibold"
													className="text-primary text-sm flex-1"
												>
													{product.name}
												</StyledText>
											</View>
											<StyledText
												variant="semibold"
												className="text-secondary text-sm"
											>
												{formatCurrency(
													product.revenue
												)}
											</StyledText>
										</View>
										<StyledText
											variant="regular"
											className="text-gray-500 text-xs ml-8"
										>
											{product.unitsSold} units sold
										</StyledText>
										{index < topProducts.length - 1 && (
											<View className="border-t border-gray-100 mt-3" />
										)}
									</View>
								))
							) : (
								<StyledText
									variant="medium"
									className="text-gray-400 text-center py-4"
								>
									No sales data
								</StyledText>
							)}
						</View>
					</View>

					{/* Inventory Section */}
					<View className="mb-6">
						<SectionHeader
							title="Inventory Report"
							icon="archive"
						/>

						{/* Inventory Movement */}
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Movement Summary
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Items Sold
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{inventoryMovement.itemsSold} units
								</StyledText>
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Low Stock Items
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-orange-600 text-sm"
								>
									{inventoryMovement.lowStockCount}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Out of Stock
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-red-600 text-sm"
								>
									{inventoryMovement.outOfStockCount}
								</StyledText>
							</View>
						</View>

						{/* Inventory Value */}
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Inventory Value
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Current Stock Value
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{formatCurrency(
										inventoryValue.currentStockValue
									)}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Potential Sales Value
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-green-600 text-sm"
								>
									{formatCurrency(
										inventoryValue.potentialSalesValue
									)}
								</StyledText>
							</View>
						</View>

						{/* Fast/Slow Moving Products */}
						<View className="flex-row gap-3 mb-4">
							<View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
								<View className="flex-row items-center mb-2">
									<FontAwesome
										name="bolt"
										size={14}
										color="#10b981"
									/>
									<StyledText
										variant="semibold"
										className="text-primary text-xs ml-1"
									>
										Fast Moving
									</StyledText>
								</View>
								{fastMovingProducts
									.slice(0, 3)
									.map((product) => (
										<StyledText
											key={product.id}
											variant="regular"
											className="text-gray-600 text-xs mb-1"
										>
											• {product.name}
										</StyledText>
									))}
							</View>
							<View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
								<View className="flex-row items-center mb-2">
									<FontAwesome
										name="hourglass-half"
										size={14}
										color="#f59e0b"
									/>
									<StyledText
										variant="semibold"
										className="text-primary text-xs ml-1"
									>
										Slow Moving
									</StyledText>
								</View>
								{slowMovingProducts
									.slice(0, 3)
									.map((product) => (
										<StyledText
											key={product.id}
											variant="regular"
											className="text-gray-600 text-xs mb-1"
										>
											• {product.name}
										</StyledText>
									))}
							</View>
						</View>

						{/* Low Stock Alert */}
						{lowStockItems.length > 0 && (
							<View
								className="rounded-xl p-4 mb-4"
								style={{
									backgroundColor: '#f59e0b20',
									borderLeftWidth: 4,
									borderLeftColor: '#f59e0b',
								}}
							>
								<StyledText
									variant="semibold"
									className="text-orange-700 text-sm mb-2"
								>
									⚠️ Low Stock Alert
								</StyledText>
								{lowStockItems.slice(0, 3).map((item) => (
									<StyledText
										key={item.id}
										variant="regular"
										className="text-orange-700 text-xs mb-1"
									>
										• {item.name} - {item.quantity} left
									</StyledText>
								))}
							</View>
						)}
					</View>

					{/* Credits Section */}
					<View className="mb-6">
						<SectionHeader
							title="Credits Report"
							icon="credit-card-alt"
						/>

						{/* Credits Overview */}
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Credits Overview
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Credits Issued
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-red-600 text-sm"
								>
									{formatCurrency(creditsOverview.issued)}
								</StyledText>
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Credits Collected
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-green-600 text-sm"
								>
									{formatCurrency(creditsOverview.collected)}
								</StyledText>
							</View>
							<View className="border-t border-gray-200 my-2" />
							<View className="flex-row justify-between mb-2">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Outstanding Balance
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{formatCurrency(
										creditsOverview.outstanding
									)}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText
									variant="medium"
									className="text-gray-600 text-sm"
								>
									Active Accounts
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-primary text-sm"
								>
									{creditsOverview.activeAccounts}
								</StyledText>
							</View>
						</View>

						{/* Aging Buckets */}
						<View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-3"
							>
								Credit Aging
							</StyledText>
							{agingBuckets.map((bucket, index) => (
								<View key={index} className="mb-2">
									<View className="flex-row justify-between items-center mb-1">
										<StyledText
											variant="medium"
											className="text-gray-600 text-sm"
										>
											{bucket.range}
										</StyledText>
										<StyledText
											variant="semibold"
											className="text-primary text-sm"
										>
											{formatCurrency(bucket.amount)}
										</StyledText>
									</View>
									<View className="flex-row items-center">
										<View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
											<View
												className="h-full rounded-full"
												style={{
													width: `${
														creditsOverview.outstanding >
														0
															? (bucket.amount /
																	creditsOverview.outstanding) *
																100
															: 0
													}%`,
													backgroundColor:
														index === 0
															? '#10b981'
															: index === 1
																? '#3b82f6'
																: index === 2
																	? '#f59e0b'
																	: '#ef4444',
												}}
											/>
										</View>
										<StyledText
											variant="regular"
											className="text-gray-500 text-xs ml-2"
										>
											{bucket.count}
										</StyledText>
									</View>
									{index < agingBuckets.length - 1 && (
										<View className="border-t border-gray-100 mt-2" />
									)}
								</View>
							))}
						</View>
					</View>

					{/* Profitability Section */}
					<View className="mb-6">
						<SectionHeader title="Profitability" icon="dollar" />

						<View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
							<View className="flex-row justify-between mb-4">
								<View className="flex-1">
									<StyledText
										variant="medium"
										className="text-gray-600 text-sm mb-1"
									>
										Total Profit
									</StyledText>
									<StyledText
										variant="extrabold"
										className="text-primary text-2xl"
									>
										{formatCurrency(
											profitability.totalProfit
										)}
									</StyledText>
								</View>
								<View className="items-end">
									<StyledText
										variant="medium"
										className="text-gray-600 text-sm mb-1"
									>
										Margin
									</StyledText>
									<StyledText
										variant="extrabold"
										className="text-green-600 text-2xl"
									>
										{profitability.marginPercent.toFixed(1)}
										%
									</StyledText>
								</View>
							</View>

							<View className="bg-green-50 rounded-xl p-3">
								<StyledText
									variant="regular"
									className="text-green-800 text-xs"
								>
									💡 Your profit margin is calculated from
									sales revenue minus estimated cost of goods
									sold.
								</StyledText>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
