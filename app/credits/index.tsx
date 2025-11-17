import CustomerListItem from '@/components/credits/CustomerListItem';
import FilterBar from '@/components/credits/FilterBar';
import KPICard from '@/components/credits/KPICard';
import SortDropdown from '@/components/credits/SortDropdown';
import StyledText from '@/components/elements/StyledText';
import {
    getAllCustomers,
    getCreditKPIs,
    initCreditsTable,
    searchCustomers
} from '@/db/credits';
import { CreditFilter, CreditKPIs, CreditSort, Customer } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Credits() {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
	const [kpis, setKPIs] = useState<CreditKPIs>({
		totalOutstanding: 0,
		totalCustomersWithBalance: 0,
		mostOwedCustomer: null,
		totalCollectedToday: 0,
		totalCreditsToday: 0,
		overdueCount: 0,
	});
	const [activeFilter, setActiveFilter] = useState<CreditFilter>('all');
	const [activeSort, setActiveSort] = useState<CreditSort>('balance_desc');
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const loadData = useCallback(async () => {
		try {
			await initCreditsTable();
			const [customersData, kpisData] = await Promise.all([
				getAllCustomers(activeFilter, activeSort),
				getCreditKPIs(),
			]);
			setCustomers(customersData);
			setFilteredCustomers(customersData);
			setKPIs(kpisData);
		} catch (error) {
			console.error('Error loading credits data:', error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [activeFilter, activeSort]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		const handleSearch = async () => {
			if (searchQuery.trim()) {
				const results = await searchCustomers(searchQuery);
				setFilteredCustomers(results);
			} else {
				setFilteredCustomers(customers);
			}
		};

		const debounce = setTimeout(handleSearch, 300);
		return () => clearTimeout(debounce);
	}, [searchQuery, customers]);

	const handleRefresh = () => {
		setIsRefreshing(true);
		loadData();
	};

	const handleFilterChange = (filter: CreditFilter) => {
		setActiveFilter(filter);
	};

	const handleSortChange = (sort: CreditSort) => {
		setActiveSort(sort);
	};

	const handleCustomerPress = async (customer: Customer) => {
		// Navigate to customer details (we'll implement this modal next)
		router.push(`/credits/details/${customer.id}` as any);
	};

	const handleAddCustomer = () => {
		router.push('/credits/add');
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const getFilterCounts = () => {
		return {
			all: customers.length,
			with_balance: customers.filter((c) => c.outstanding_balance > 0).length,
			paid: customers.filter((c) => c.outstanding_balance === 0).length,
			overdue: kpis.overdueCount,
		};
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#7A1CAC" />
					<StyledText variant="medium" className="text-secondary mt-4">
						Loading credits...
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
					<View>
						<StyledText variant="extrabold" className="text-primary text-3xl">
							Credits
						</StyledText>
						<StyledText variant="regular" className="text-gray-500 text-sm mt-0.5">
							Manage customer utang
						</StyledText>
					</View>

					<TouchableOpacity
						activeOpacity={0.7}
						onPress={handleAddCustomer}
						className="bg-secondary rounded-full w-12 h-12 items-center justify-center shadow-md"
					>
						<FontAwesome name="user-plus" size={20} color="white" />
					</TouchableOpacity>
				</View>

				{/* Search Bar */}
				<View className="bg-white rounded-xl px-4 py-3 mb-4 flex-row items-center shadow-sm border border-gray-100">
					<FontAwesome name="search" size={16} color="#9ca3af" />
					<TextInput
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search customers..."
						placeholderTextColor="#9ca3af"
						className="flex-1 ml-3 text-primary font-stack-sans text-sm"
					/>
					{searchQuery.length > 0 && (
						<TouchableOpacity onPress={() => setSearchQuery('')}>
							<FontAwesome name="times-circle" size={16} color="#9ca3af" />
						</TouchableOpacity>
					)}
				</View>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#7A1CAC" />}
			>
				{/* KPI Cards */}
				<View className="px-4 mb-4">
					<View className="flex-row mb-3 gap-3">
						<View className="flex-1">
							<KPICard
								title="Total Outstanding"
								value={formatCurrency(kpis.totalOutstanding)}
								icon="credit-card"
								iconColor="#ef4444"
							/>
						</View>
						<View className="flex-1">
							<KPICard
								title="Customers"
								value={kpis.totalCustomersWithBalance}
								icon="users"
								iconColor="#7A1CAC"
							/>
						</View>
					</View>

					<View className="flex-row gap-3">
						<View className="flex-1">
							<KPICard
								title="Collected Today"
								value={formatCurrency(kpis.totalCollectedToday)}
								icon="money"
								iconColor="#10b981"
								trend={kpis.totalCollectedToday > 0 ? 'up' : 'neutral'}
							/>
						</View>
						<View className="flex-1">
							<KPICard
								title="Credits Today"
								value={formatCurrency(kpis.totalCreditsToday)}
								icon="plus-circle"
								iconColor="#f59e0b"
							/>
						</View>
					</View>

					{kpis.mostOwedCustomer && (
						<View className="mt-3">
							<KPICard
								title="Most Owed Customer"
								value={formatCurrency(kpis.mostOwedCustomer.amount)}
								subtitle={kpis.mostOwedCustomer.name}
								icon="exclamation-triangle"
								iconColor="#f59e0b"
							/>
						</View>
					)}

					{kpis.overdueCount > 0 && (
						<View className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center">
							<FontAwesome name="warning" size={20} color="#ef4444" />
							<View className="ml-3 flex-1">
								<StyledText variant="semibold" className="text-red-700">
									{kpis.overdueCount} Overdue {kpis.overdueCount === 1 ? 'Customer' : 'Customers'}
								</StyledText>
								<StyledText variant="regular" className="text-red-600 text-xs">
									Requires immediate attention
								</StyledText>
							</View>
						</View>
					)}
				</View>

				{/* Filter & Sort */}
				<FilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} counts={getFilterCounts()} />

				<View className="px-4 mb-4 flex-row items-center justify-between">
					<StyledText variant="medium" className="text-gray-600">
						{filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
					</StyledText>
					<SortDropdown activeSort={activeSort} onSortChange={handleSortChange} />
				</View>

				{/* Customer List */}
				<View className="px-4 pb-32">
					{filteredCustomers.length === 0 ? (
						<View className="items-center justify-center py-12">
							<FontAwesome name="users" size={48} color="#7A1CAC" />
							<StyledText variant="semibold" className="text-gray-700 text-lg mt-4">
								No customers found
							</StyledText>
							<StyledText variant="regular" className="text-gray-600 text-sm mt-2 text-center">
								{searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
							</StyledText>
							{!searchQuery && (
								<TouchableOpacity
									activeOpacity={0.7}
									onPress={handleAddCustomer}
									className="bg-secondary rounded-xl px-6 py-3 mt-6"
								>
									<StyledText variant="semibold" className="text-white">
										Add Customer
									</StyledText>
								</TouchableOpacity>
							)}
						</View>
					) : (
						filteredCustomers.map((customer) => (
							<CustomerListItem key={customer.id} customer={customer} onPress={handleCustomerPress} />
						))
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}