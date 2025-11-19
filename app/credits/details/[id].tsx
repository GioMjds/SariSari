import StyledText from '@/components/elements/StyledText';
import {
	deleteCustomer,
	getCreditHistory,
	getCustomerWithDetails,
	initCreditsTable,
	markAllCreditsAsPaid,
} from '@/db/credits';
import { useModalStore } from '@/stores/ModalStore';
import { useToastStore } from '@/stores/ToastStore';
import {
	CreditHistory,
	CreditTransaction,
	CustomerWithDetails,
} from '@/types/credits.types';
import { parseStoredTimestamp } from '@/utils/timezone';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'credits' | 'payments' | 'history';

export default function CustomerDetails() {
	const [activeTab, setActiveTab] = useState<TabType>('credits');

	const { id } = useLocalSearchParams<{ id: string }>();

	const queryClient = useQueryClient();

	const addToast = useToastStore((state) => state.addToast);
	const { openModal } = useModalStore();

	// Initialize database
	useEffect(() => {
		(async () => {
			try {
				await initCreditsTable();
			} catch (error) {
				console.error('Error initializing credits table:', error);
				addToast({
					message: 'Failed to initialize database',
					variant: 'error',
					duration: 5000,
					position: 'top-center',
				});
			}
		})();
	}, []);

	// Query customer details
	const {
		data: customer,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery<CustomerWithDetails | null>({
		queryKey: ['customer-details', id],
		queryFn: () => getCustomerWithDetails(parseInt(id)),
		enabled: !!id,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	// Query credit history
	const { data: history = [] } = useQuery<CreditHistory[]>({
		queryKey: ['credit-history', id],
		queryFn: () => getCreditHistory(parseInt(id)),
		enabled: !!id,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	// Refetch on focus
	useFocusEffect(
		useCallback(() => {
			refetch();
			queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
			queryClient.invalidateQueries({ queryKey: ['customers'] });
			queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
		}, [refetch, queryClient, id])
	);

	const handleRefresh = () => {
		refetch();
		queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
	};

	// Mark all as paid mutation
	const markAllPaidMutation = useMutation({
		mutationFn: (customerId: number) => markAllCreditsAsPaid(customerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customer-details', id] });
			queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
			queryClient.invalidateQueries({ queryKey: ['customers'] });
			queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
			addToast({
				message: 'All credits marked as paid',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to mark credits as paid',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	// Delete customer mutation
	const deleteCustomerMutation = useMutation({
		mutationFn: (customerId: number) => deleteCustomer(customerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['customers'] });
			queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
			addToast({
				message: 'Customer deleted successfully',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
			router.back();
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to delete customer',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	const handleMarkAllPaid = () => {
		if (!customer) return;

		openModal({
			title: 'Mark All as Paid',
			description: `Mark all credits for ${customer.name} as paid?`,
			variant: 'warning',
			icon: 'check-circle',
			buttons: [
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Confirm',
					style: 'default',
					onPress: () => {
						markAllPaidMutation.mutate(customer.id);
					},
				},
			],
		});
	};

	const handleDeleteCustomer = () => {
		if (!customer) return;

		openModal({
			title: 'Delete Customer',
			description: `Are you sure you want to delete ${customer.name}? This will delete all credits and payments.`,
			variant: 'danger',
			icon: 'trash',
			buttons: [
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						deleteCustomerMutation.mutate(customer.id);
					},
				},
			],
		});
	};

	const paymentMethod = (payment: string) => {
		switch (payment) {
			case 'cash':
				return 'Cash';
			case 'bank_transfer':
				return 'Bank Transfer';
			default: 
				return 'Other';
		}
	}

	const handleAddCredit = () => {
		if (!customer) return;
		router.push(`/credits/add-credit/${customer.id}` as any);
	};

	const handleAddPayment = () => {
		if (!customer) return;
		// Navigate to add payment with customer ID
		router.push(`/credits/add-payment/${customer.id}` as any);
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const getStatusColor = (status: CreditTransaction['status']) => {
		switch (status) {
			case 'paid':
				return 'text-green-600 bg-green-100';
			case 'partial':
				return 'text-yellow-600 bg-yellow-100';
			case 'unpaid':
				return 'text-red-600 bg-red-100';
		}
	};

	const getStatusLabel = (status: CreditTransaction['status']) => {
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#7A1CAC" />
					<StyledText variant="medium" className="text-secondary mt-4">
						Loading customer details...
					</StyledText>
				</View>
			</SafeAreaView>
		);
	}

	if (!customer) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center">
					<FontAwesome name="user-times" size={64} color="#d1d5db" />
					<StyledText variant="semibold" className="text-gray-500 text-lg mt-4">
						Customer not found
					</StyledText>
					<TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="bg-secondary rounded-xl px-6 py-3 mt-6">
						<StyledText variant="semibold" className="text-white">
							Go Back
						</StyledText>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Header */}
			<View className="px-4 pt-4 pb-2 bg-background">
				<View className="flex-row items-center justify-between mb-4">
					<TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
						<FontAwesome name="arrow-left" size={24} color="#2E073F" />
					</TouchableOpacity>

					<TouchableOpacity activeOpacity={0.7} onPress={handleDeleteCustomer}>
						<FontAwesome name="trash" size={20} color="#ef4444" />
					</TouchableOpacity>
				</View>

				{/* Customer Header */}
				<View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
					<View className="flex-row items-start justify-between mb-4">
						<View className="flex-1">
							<StyledText variant="extrabold" className="text-primary text-2xl mb-2">
								{customer.name}
							</StyledText>

							{customer.phone && (
								<View className="flex-row items-center mb-1">
									<FontAwesome name="phone" size={14} color="#7A1CAC" />
									<StyledText variant="regular" className="text-gray-600 ml-2">
										{customer.phone}
									</StyledText>
								</View>
							)}

							{customer.address && (
								<View className="flex-row items-center">
									<FontAwesome name="map-marker" size={14} color="#7A1CAC" />
									<StyledText variant="regular" className="text-gray-600 ml-2">
										{customer.address}
									</StyledText>
								</View>
							)}
						</View>

						<View className="items-end">
							<StyledText variant="medium" className="text-gray-500 text-xs mb-1">
								Outstanding
							</StyledText>
							<StyledText
								variant="extrabold"
								className={`text-2xl ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}
							>
								{formatCurrency(customer.outstanding_balance)}
							</StyledText>
						</View>
					</View>

					{customer.days_overdue && customer.days_overdue > 0 && (
						<View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
							<View className="flex-row items-center">
								<FontAwesome name="clock-o" size={16} color="#ef4444" />
								<StyledText variant="semibold" className="text-red-700 ml-2">
									{customer.days_overdue} days overdue
								</StyledText>
							</View>
						</View>
					)}

					{/* Action Buttons */}
					<View className="flex-row gap-3">
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleAddPayment}
							className="flex-1 bg-green-600 rounded-xl py-3 flex-row items-center justify-center"
						>
							<FontAwesome name="money" size={16} color="white" />
							<StyledText variant="semibold" className="text-white ml-2">
								Add Payment
							</StyledText>
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleAddCredit}
							className="flex-1 bg-secondary rounded-xl py-3 flex-row items-center justify-center"
						>
							<FontAwesome name="plus" size={16} color="white" />
							<StyledText variant="semibold" className="text-white ml-2">
								Add Credit
							</StyledText>
						</TouchableOpacity>
					</View>

					{customer.outstanding_balance > 0 && (
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleMarkAllPaid}
							className="bg-accent/10 border border-accent rounded-xl py-3 mt-3"
						>
							<StyledText variant="semibold" className="text-secondary text-center">
								Mark All as Paid
							</StyledText>
						</TouchableOpacity>
					)}
				</View>

				{/* Tabs */}
				<View className="flex-row bg-white rounded-xl p-1 shadow-sm border border-gray-100">
					{(['credits', 'payments', 'history'] as TabType[]).map((tab) => (
						<TouchableOpacity
							key={tab}
							activeOpacity={0.7}
							onPress={() => setActiveTab(tab)}
							className={`flex-1 py-2 rounded-lg ${activeTab === tab ? 'bg-secondary' : 'bg-transparent'}`}
						>
							<StyledText
								variant={activeTab === tab ? 'semibold' : 'medium'}
								className={`text-center ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</StyledText>
						</TouchableOpacity>
					))}
				</View>
			</View>

			<ScrollView
				className="flex-1 px-4"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={handleRefresh}
						tintColor="#7A1CAC"
					/>
				}
			>
				{/* Credits Tab */}
				{activeTab === 'credits' && (
					<View className="pb-32">
						{customer.credits.length === 0 ? (
							<View className="items-center justify-center py-12">
								<FontAwesome name="credit-card" size={48} color="#d1d5db" />
								<StyledText variant="semibold" className="text-gray-500 text-lg mt-4">
									No credits yet
								</StyledText>
								<StyledText variant="regular" className="text-gray-400 text-sm mt-2 text-center">
									Add the first credit transaction
								</StyledText>
							</View>
						) : (
							customer.credits.map((credit) => (
								<View key={credit.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
									<View className="flex-row items-start justify-between mb-3">
										<View className="flex-1">
											<StyledText variant="semibold" className="text-primary text-base mb-1">
												{credit.product_name || 'Credit'}
											</StyledText>
											<StyledText variant="regular" className="text-gray-500 text-xs">
												{format(parseStoredTimestamp(credit.date) || new Date(), 'MMM dd, yyyy h:mm a')}
											</StyledText>
											{credit.due_date && (
												<StyledText variant="regular" className="text-gray-500 text-xs">
													Due: {format(parseStoredTimestamp(credit.due_date) || new Date(), 'MMM dd, yyyy')}
												</StyledText>
											)}
										</View>

										<View className="items-end">
											<StyledText variant="extrabold" className="text-primary text-lg mb-1">
												{formatCurrency(credit.amount)}
											</StyledText>
											<View className={`px-2 py-1 rounded-full ${getStatusColor(credit.status)}`}>
												<StyledText
													variant="semibold"
													className={`text-xs ${getStatusColor(credit.status).split(' ')[0]}`}
												>
													{getStatusLabel(credit.status)}
												</StyledText>
											</View>
										</View>
									</View>

									{credit.status !== 'unpaid' && (
										<View className="pt-3 border-t border-gray-100">
											<StyledText variant="regular" className="text-gray-600 text-xs">
												Paid: {formatCurrency(credit.amount_paid)} of {formatCurrency(credit.amount)}
											</StyledText>
											<View className="bg-gray-200 rounded-full h-2 mt-2">
												<View
													className="bg-green-500 rounded-full h-2"
													style={{ width: `${(credit.amount_paid / credit.amount) * 100}%` }}
												/>
											</View>
										</View>
									)}

									{credit.notes && (
										<View className="mt-3 pt-3 border-t border-gray-100">
											<StyledText variant="regular" className="text-gray-600 text-xs">
												{credit.notes}
											</StyledText>
										</View>
									)}
								</View>
							))
						)}
					</View>
				)}

				{/* Payments Tab */}
				{activeTab === 'payments' && (
					<View className="pb-32">
						{customer.payments.length === 0 ? (
							<View className="items-center justify-center py-12">
								<FontAwesome name="money" size={48} color="#d1d5db" />
								<StyledText variant="semibold" className="text-gray-500 text-lg mt-4">
									No payments yet
								</StyledText>
								<StyledText variant="regular" className="text-gray-400 text-sm mt-2 text-center">
									Record the first payment
								</StyledText>
							</View>
						) : (
							customer.payments.map((payment) => (
								<View key={payment.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
									<View className="flex-row items-start justify-between">
										<View className="flex-1">
											<View className="flex-row items-center mb-2">
												<FontAwesome name="check-circle" size={16} color="#10b981" />
												<StyledText variant="semibold" className="text-primary text-base ml-2">
													Payment Received
												</StyledText>
											</View>
											<StyledText variant="regular" className="text-gray-500 text-xs mb-1">
												{format(parseStoredTimestamp(payment.date) || new Date(), 'MMM dd, yyyy h:mm a')}
											</StyledText>
											{payment.payment_method && (
												<View className="flex-row items-center">
													<FontAwesome name="credit-card" size={12} color="#7A1CAC" />
													<StyledText variant="regular" className="text-gray-500 text-sm ml-1">
														Method: {paymentMethod(payment.payment_method)}
													</StyledText>
												</View>
											)}
										</View>

										<StyledText variant="extrabold" className="text-green-600 text-lg">
											{formatCurrency(payment.amount)}
										</StyledText>
									</View>

									{payment.notes && (
										<View className="mt-3 pt-3 border-t border-gray-100">
											<StyledText variant="regular" className="text-gray-600 text-xs">
												{payment.notes}
											</StyledText>
										</View>
									)}
								</View>
							))
						)}
					</View>
				)}

				{/* History Tab */}
				{activeTab === 'history' && (
					<View className="pb-32">
						{history.length === 0 ? (
							<View className="items-center justify-center py-12">
								<FontAwesome name="history" size={48} color="#d1d5db" />
								<StyledText variant="semibold" className="text-gray-500 text-lg mt-4">
									No transaction history
								</StyledText>
							</View>
						) : (
							history.map((item) => (
								<View key={`${item.type}-${item.id}`} className="mb-3">
									<View className="flex-row">
										{/* Timeline */}
										<View className="items-center mr-4">
											<View
												className={`w-8 h-8 rounded-full items-center justify-center ${
													item.type === 'credit' ? 'bg-red-100' : 'bg-green-100'
												}`}
											>
												<FontAwesome
													name={item.type === 'credit' ? 'plus' : 'check'}
													size={14}
													color={item.type === 'credit' ? '#ef4444' : '#10b981'}
												/>
											</View>
										</View>

										{/* Content */}
										<View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
											<View className="flex-row items-start justify-between mb-2">
												<View className="flex-1">
													<StyledText variant="semibold" className="text-primary text-base mb-1">
														{item.description}
													</StyledText>
													<StyledText variant="regular" className="text-gray-500 text-xs">
														{format(parseStoredTimestamp(item.date) || new Date(), 'MMM dd, yyyy h:mm a')}
													</StyledText>
												</View>

												<StyledText
													variant="extrabold"
													className={`text-lg ${item.type === 'credit' ? 'text-red-600' : 'text-green-600'}`}
												>
													{item.type === 'credit' ? '+' : '-'}
													{formatCurrency(item.amount)}
												</StyledText>
											</View>

											<View className="pt-2 border-t border-gray-100">
												<StyledText variant="medium" className="text-gray-600 text-xs">
													Running Balance: {formatCurrency(item.running_balance)}
												</StyledText>
											</View>
										</View>
									</View>
								</View>
							))
						)}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
