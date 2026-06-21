import { StyledText } from '@/components/elements';
import { DateRangeSelector, InsightCard, ReportKPICard, SectionHeader, SimpleBarChart } from '@/components/reports';
import { MoneyText } from '@/components/ui';
import { useReports } from '@/hooks';
import { DateRange, DateRangeType } from '@/types';
import { formatCompactCurrency, getDateRangeFromType } from '@/utils';
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
	const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromType('today'));

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
		useProductProfitability,
		useReportInsights,
		invalidateReports,
	} = useReports();

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
	const productProfitabilityQuery = useProductProfitability(dateRange, 10);
	const insightsQuery = useReportInsights(dateRange);

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
		productProfitabilityQuery.isLoading ||
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
		productProfitabilityQuery.isFetching ||
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
	const productProfitability = productProfitabilityQuery.data ?? [];
	const insights = insightsQuery.data ?? [];

	const handleDateRangeChange = (type: DateRangeType) => {
		setDateRangeType(type);
		setDateRange(getDateRangeFromType(type));
	};

	const handleRefresh = async () => {
		await invalidateReports();
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#B45309" />
					<StyledText variant="medium" className="text-warm-600 mt-4">
						Loading reports...
					</StyledText>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View className="px-4 pt-4 pb-2 bg-background">
				<View className="flex-row items-center justify-between mb-4">
					<StyledText variant="extrabold" className="text-warm-900 text-3xl">
						Sales Reports
					</StyledText>
				</View>
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
						tintColor="#B45309"
					/>
				}
			>
				<View className="px-4 pb-32">
					{insights.length > 0 && (
						<View className="mb-6">
							<SectionHeader title="Key Insights" icon="lightbulb-o" />
							{insights.map((insight, index) => (
								<InsightCard
									key={index}
									{...insight}
									icon={insight.icon as keyof typeof FontAwesome.glyphMap}
								/>
							))}
						</View>
					)}

					<View className="mb-6">
						<SectionHeader title="Overview" icon="dashboard" />
						<View className="flex-row gap-3 mb-3">
							<ReportKPICard
								title="Total Sales"
								value={formatCompactCurrency(kpis.totalSales)}
								icon="shopping-cart"
								color="#65A30D"
							/>
							<ReportKPICard
								title="Total Profit"
								value={formatCompactCurrency(kpis.totalProfit)}
								icon="line-chart"
								color="#B45309"
							/>
						</View>
						<View className="flex-row gap-3">
							<ReportKPICard
								title="Credits Issued"
								value={formatCompactCurrency(kpis.totalCreditsIssued)}
								icon="credit-card"
								color="#f59e0b"
							/>
							<ReportKPICard
								title="Credits Collected"
								value={formatCompactCurrency(kpis.totalCreditsCollected)}
								icon="money"
								color="#65A30D"
							/>
						</View>
					</View>

					<View className="mb-6">
						<SectionHeader title="Sales Report" icon="bar-chart" />
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-4">
								Sales Trend
							</StyledText>
							<SimpleBarChart data={salesOverTime} height={180} />
						</View>

						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Payment Breakdown
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Cash Sales
								</StyledText>
								<MoneyText value={salesBreakdown.cashSales} fromPesos className="text-warm-900 text-sm" />
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Credit Sales
								</StyledText>
								<MoneyText value={salesBreakdown.creditSales} fromPesos className="text-warm-900 text-sm" />
							</View>
							<View className="border-t border-gray-200 my-2" />
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Total Transactions
								</StyledText>
								<StyledText variant="semibold" className="text-warm-900 text-sm">
									{salesBreakdown.totalTransactions}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Average Transaction
								</StyledText>
								<MoneyText value={salesBreakdown.averageTransactionValue} fromPesos className="text-warm-900 text-sm" />
							</View>
						</View>

						<View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Top Selling Products
							</StyledText>
							{topProducts.length > 0 ? (
								topProducts.map((product, index) => (
									<View key={product.id} className="mb-3">
										<View className="flex-row items-center justify-between mb-1">
											<View className="flex-row items-center flex-1">
												<View
													className="w-6 h-6 rounded-full items-center justify-center mr-2"
													style={{ backgroundColor: '#B4530920' }}
												>
													<StyledText variant="semibold" className="text-secondary-600 text-xs">
														{index + 1}
													</StyledText>
												</View>
												<StyledText variant="semibold" className="text-warm-900 text-sm flex-1">
													{product.name}
												</StyledText>
											</View>
											<MoneyText value={product.revenue} fromPesos className="text-secondary-600 text-sm" />
										</View>
										<StyledText variant="regular" className="text-gray-500 text-xs ml-8">
											{product.unitsSold} units sold
										</StyledText>
										{index < topProducts.length - 1 && <View className="border-t border-gray-100 mt-3" />}
									</View>
								))
							) : (
								<StyledText variant="medium" className="text-gray-400 text-center py-4">
									No sales data
								</StyledText>
							)}
						</View>
					</View>

					<View className="mb-6">
						<SectionHeader title="Inventory Report" icon="archive" />
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Movement Summary
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Items Sold
								</StyledText>
								<StyledText variant="semibold" className="text-warm-900 text-sm">
									{inventoryMovement.itemsSold} units
								</StyledText>
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Low Stock Items
								</StyledText>
								<StyledText variant="semibold" className="text-orange-600 text-sm">
									{inventoryMovement.lowStockCount}
								</StyledText>
							</View>
							<View className="flex-row justify-between">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Out of Stock
								</StyledText>
								<StyledText variant="semibold" className="text-red-600 text-sm">
									{inventoryMovement.outOfStockCount}
								</StyledText>
							</View>
						</View>

						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Inventory Value
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Current Stock Value
								</StyledText>
								<MoneyText value={inventoryValue.currentStockValue} fromPesos className="text-warm-900 text-sm" />
							</View>
							<View className="flex-row justify-between">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Potential Sales Value
								</StyledText>
								<MoneyText value={inventoryValue.potentialSalesValue} fromPesos className="text-green-600 text-sm" />
							</View>
						</View>

						<View className="flex-row gap-3 mb-4">
							<View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
								<View className="flex-row items-center mb-2">
									<FontAwesome name="bolt" size={14} color="#65A30D" />
									<StyledText variant="semibold" className="text-warm-900 text-xs ml-1">
										Fast Moving
									</StyledText>
								</View>
								{fastMovingProducts.slice(0, 3).map((product) => (
									<StyledText key={product.id} variant="regular" className="text-warm-600 text-xs mb-1">
										• {product.name}
									</StyledText>
								))}
							</View>
							<View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
								<View className="flex-row items-center mb-2">
									<FontAwesome name="hourglass-half" size={14} color="#f59e0b" />
									<StyledText variant="semibold" className="text-warm-900 text-xs ml-1">
										Slow Moving
									</StyledText>
								</View>
								{slowMovingProducts.slice(0, 3).map((product) => (
									<StyledText key={product.id} variant="regular" className="text-warm-600 text-xs mb-1">
										• {product.name}
									</StyledText>
								))}
							</View>
						</View>

						{lowStockItems.length > 0 && (
							<View
								className="rounded-xl p-4 mb-4"
								style={{
									backgroundColor: '#f59e0b20',
									borderLeftWidth: 4,
									borderLeftColor: '#f59e0b',
								}}
							>
								<StyledText variant="semibold" className="text-orange-700 text-sm mb-2">
									⚠️ Low Stock Alert
								</StyledText>
								{lowStockItems.slice(0, 3).map((item) => (
									<StyledText key={item.id} variant="regular" className="text-orange-700 text-xs mb-1">
										• {item.name} - {item.quantity} left
									</StyledText>
								))}
							</View>
						)}
					</View>

					<View className="mb-6">
						<SectionHeader title="Credits Report" icon="credit-card-alt" />
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Credits Overview
							</StyledText>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Credits Issued
								</StyledText>
								<MoneyText value={creditsOverview.issued} fromPesos className="text-red-600 text-sm" />
							</View>
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Credits Collected
								</StyledText>
								<MoneyText value={creditsOverview.collected} fromPesos className="text-green-600 text-sm" />
							</View>
							<View className="border-t border-gray-200 my-2" />
							<View className="flex-row justify-between mb-2">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Outstanding Balance
								</StyledText>
								<MoneyText value={creditsOverview.outstanding} fromPesos className="text-warm-900 text-sm" />
							</View>
							<View className="flex-row justify-between">
								<StyledText variant="medium" className="text-warm-600 text-sm">
									Active Accounts
								</StyledText>
								<StyledText variant="semibold" className="text-warm-900 text-sm">
									{creditsOverview.activeAccounts}
								</StyledText>
							</View>
						</View>

						<View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
							<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
								Credit Aging
							</StyledText>
							{agingBuckets.map((bucket, index) => (
								<View key={index} className="mb-2">
									<View className="flex-row justify-between items-center mb-1">
										<StyledText variant="medium" className="text-warm-600 text-sm">
											{bucket.range}
										</StyledText>
										<MoneyText value={bucket.amount} fromPesos className="text-warm-900 text-sm" />
									</View>
									<View className="flex-row items-center">
										<View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
											<View
												className="h-full rounded-full"
												style={{
													width: `${
														creditsOverview.outstanding > 0
															? (bucket.amount / creditsOverview.outstanding) * 100
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
										<StyledText variant="regular" className="text-gray-500 text-xs ml-2">
											{bucket.count}
										</StyledText>
									</View>
									{index < agingBuckets.length - 1 && <View className="border-t border-gray-100 mt-2" />}
								</View>
							))}
						</View>
					</View>

					<View className="mb-6">
						<SectionHeader title="Profitability" icon="dollar" />
						<View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-warm-100">
							<View className="flex-row justify-between mb-4">
								<View className="flex-1">
									<StyledText variant="medium" className="text-warm-600 text-sm mb-1">
										Total Profit
									</StyledText>
									<MoneyText value={profitability.totalProfit} fromPesos className="text-warm-900 text-2xl" />
								</View>
								<View className="items-end">
									<StyledText variant="medium" className="text-warm-600 text-sm mb-1">
										Margin
									</StyledText>
									<StyledText variant="extrabold" className="text-green-600 text-2xl">
										{profitability.marginPercent.toFixed(1)}%
									</StyledText>
								</View>
							</View>
							<View className="bg-blue-50 rounded-xl p-3">
								<StyledText variant="regular" className="text-blue-800 text-xs">
									💡 Profit margins are calculated using actual cost prices. Products without cost prices are not included.
								</StyledText>
							</View>
						</View>

						{productProfitability.length > 0 && (
							<View className="bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
								<StyledText variant="semibold" className="text-warm-900 text-sm mb-3">
									Most Profitable Products (Tubo)
								</StyledText>
								{productProfitability.map((product, index) => (
									<View key={product.id} className="mb-3">
										<View className="flex-row items-start justify-between mb-2">
											<View className="flex-row items-start flex-1">
												<View
													className="w-6 h-6 rounded-full items-center justify-center mr-2 mt-0.5"
													style={{ backgroundColor: '#10b98120' }}
												>
													<StyledText variant="semibold" className="text-green-600 text-xs">
														{index + 1}
													</StyledText>
												</View>
												<View className="flex-1">
													<StyledText variant="semibold" className="text-warm-900 text-sm mb-1">
														{product.name}
													</StyledText>
													<View className="flex-row items-center gap-3">
														<StyledText variant="regular" className="text-gray-500 text-xs">
															{product.unitsSold} units
														</StyledText>
														<StyledText variant="regular" className="text-gray-500 text-xs">•</StyledText>
														<MoneyText value={product.profitPerUnit} fromPesos className="text-green-600 text-xs" />
														<StyledText variant="regular" className="text-green-600 text-xs">/pc</StyledText>
													</View>
												</View>
											</View>
											<View className="items-end ml-2">
												<MoneyText value={product.totalProfit} fromPesos className="text-green-600 text-base" />
												<StyledText variant="regular" className="text-gray-500 text-xs">
													{product.marginPercent.toFixed(1)}% margin
												</StyledText>
											</View>
										</View>
										{index < productProfitability.length - 1 && <View className="border-t border-gray-100 mt-3" />}
									</View>
								))}
								<View className="bg-green-50 rounded-xl p-3 mt-2">
									<StyledText variant="regular" className="text-green-800 text-xs">
										🎯 Focus on stocking products with higher profit margins to maximize your &quot;tubo&quot;
									</StyledText>
								</View>
							</View>
						)}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
