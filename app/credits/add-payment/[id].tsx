import StyledText from '@/components/elements/StyledText';
import {
	getCreditTransactionsByCustomer,
	getCustomer,
	initCreditsTable,
	insertPayment,
} from '@/db/credits';
import { useToastStore } from '@/stores/ToastStore';
import { CreditTransaction, Customer, NewPayment } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PaymentFormData {
	amount: string;
	paymentMethod: 'cash' | 'bank_transfer' | 'other';
	notes: string;
}

export default function AddPaymentTransaction() {
	const [selectedCredit, setSelectedCredit] =
		useState<CreditTransaction | null>(null);
	const [showCreditList, setShowCreditList] = useState<boolean>(false);

	const { id } = useLocalSearchParams<{ id: string }>();
	const queryClient = useQueryClient();
	const addToast = useToastStore((state) => state.addToast);

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

	// React Hook Form
	const {
		control,
		handleSubmit,
		formState: { errors },
		setValue,
		watch,
	} = useForm<PaymentFormData>({
		defaultValues: {
			amount: '',
			paymentMethod: 'cash',
			notes: '',
		},
	});

	const amount = watch('amount');
	const paymentMethod = watch('paymentMethod');

	// Query customer
	const { data: customer } = useQuery<Customer | null>({
		queryKey: ['customer', id],
		queryFn: () => getCustomer(parseInt(id)),
		enabled: !!id,
	});

	// Query unpaid credits
	const { data: allCredits = [] } = useQuery<CreditTransaction[]>({
		queryKey: ['customer-credits', id],
		queryFn: () => getCreditTransactionsByCustomer(parseInt(id)),
		enabled: !!id,
	});

	const unpaidCredits = useMemo(
		() => allCredits.filter((c) => c.status !== 'paid'),
		[allCredits]
	);

	// Refetch on focus
	useFocusEffect(
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: ['customer', id] });
			queryClient.invalidateQueries({
				queryKey: ['customer-credits', id],
			});
		}, [queryClient, id])
	);

	// Add payment mutation
	const addPaymentMutation = useMutation({
		mutationFn: async (data: PaymentFormData) => {
			if (!customer) {
				throw new Error('Customer not found');
			}

			if (!data.amount || parseFloat(data.amount) <= 0) {
				throw new Error('Please enter a valid payment amount');
			}

			const paymentAmount = parseFloat(data.amount);
			if (paymentAmount > customer.outstanding_balance) {
				throw new Error(
					`Payment amount (${formatCurrency(paymentAmount)}) exceeds outstanding balance (${formatCurrency(customer.outstanding_balance)})`
				);
			}

			const newPayment: NewPayment = {
				customer_id: customer.id,
				credit_transaction_id: selectedCredit?.id,
				amount: paymentAmount,
				payment_method: data.paymentMethod,
				notes: data.notes.trim() || undefined,
			};

			await insertPayment(newPayment);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['customer-details', id],
			});
			queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
			queryClient.invalidateQueries({ queryKey: ['customers'] });
			queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
			addToast({
				message: 'Payment recorded successfully',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
			router.back();
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to record payment',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	const handleCreditSelect = (credit: CreditTransaction) => {
		setSelectedCredit(credit);
		const remaining = credit.amount - credit.amount_paid;
		setValue('amount', remaining.toString());
		setShowCreditList(false);
	};

	const onSubmit = (data: PaymentFormData) => {
		addPaymentMutation.mutate(data);
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const getRemainingBalance = () => {
		if (!customer || !amount) return customer?.outstanding_balance || 0;
		return customer.outstanding_balance - parseFloat(amount);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAwareScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				enableAutomaticScroll
				enableOnAndroid
				extraScrollHeight={100}
				contentContainerStyle={{ paddingBottom: 32 }}
			>
				{/* Header */}
				<View className="px-4 pt-4 pb-2 bg-background">
					<View className="flex-row items-center justify-between mb-4">
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={() => router.back()}
						>
							<FontAwesome
								name="arrow-left"
								size={24}
								color="#2E073F"
							/>
						</TouchableOpacity>

						<StyledText
							variant="extrabold"
							className="text-primary text-xl"
						>
							Add Payment
						</StyledText>

						<View className="w-6" />
					</View>

					{customer && (
						<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-base mb-2"
							>
								{customer.name}
							</StyledText>
							<View className="flex-row items-center justify-between">
								<StyledText
									variant="regular"
									className="text-gray-500 text-sm"
								>
									Outstanding Balance
								</StyledText>
								<StyledText
									variant="extrabold"
									className="text-red-600 text-lg"
								>
									{formatCurrency(
										customer.outstanding_balance
									)}
								</StyledText>
							</View>
						</View>
					)}
				</View>

				<View className="flex-1 px-4 pt-4">
					<View className="pb-8">
						{/* Payment Amount */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Payment Amount *
							</StyledText>
							<Controller
								control={control}
								name="amount"
								render={({ field: { onChange, value } }) => (
									<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
										<StyledText
											variant="medium"
											className="text-secondary"
										>
											₱
										</StyledText>
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="0.00"
											placeholderTextColor="#9ca3af"
											keyboardType="decimal-pad"
											className="flex-1 ml-2 text-primary font-stack-sans text-base"
										/>
									</View>
								)}
							/>
							{customer && (
								<TouchableOpacity
									activeOpacity={0.7}
									onPress={() =>
										setValue(
											'amount',
											customer.outstanding_balance.toString()
										)
									}
									className="mt-2"
								>
									<StyledText
										variant="medium"
										className="text-secondary text-sm"
									>
										Pay full balance:{' '}
										{formatCurrency(
											customer.outstanding_balance
										)}
									</StyledText>
								</TouchableOpacity>
							)}
						</View>

						{/* Remaining Balance */}
						{amount && customer && (
							<View
								className={`rounded-xl p-4 mb-4 ${
									getRemainingBalance() === 0
										? 'bg-green-50 border border-green-200'
										: 'bg-accent/10 border border-accent'
								}`}
							>
								<View className="flex-row items-center justify-between">
									<StyledText
										variant="semibold"
										className={
											getRemainingBalance() === 0
												? 'text-green-700'
												: 'text-secondary'
										}
									>
										Remaining Balance
									</StyledText>
									<StyledText
										variant="extrabold"
										className={`text-lg ${getRemainingBalance() === 0 ? 'text-green-700' : 'text-secondary'}`}
									>
										{formatCurrency(getRemainingBalance())}
									</StyledText>
								</View>
								{getRemainingBalance() === 0 && (
									<View className="flex-row items-center mt-2">
										<FontAwesome
											name="check-circle"
											size={14}
											color="#10b981"
										/>
										<StyledText
											variant="medium"
											className="text-green-700 text-xs ml-1"
										>
											This payment will clear all
											outstanding balance
										</StyledText>
									</View>
								)}
							</View>
						)}

						{/* Apply to Specific Credit */}
						{unpaidCredits.length > 0 && (
							<View className="mb-4">
								<StyledText
									variant="semibold"
									className="text-primary text-sm mb-2"
								>
									Apply to Specific Credit (Optional)
								</StyledText>

								{selectedCredit ? (
									<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
										<View className="flex-row items-start justify-between mb-2">
											<View className="flex-1">
												<StyledText
													variant="semibold"
													className="text-primary"
												>
													{selectedCredit.product_name ||
														'Credit'}
												</StyledText>
												<StyledText
													variant="regular"
													className="text-gray-500 text-xs"
												>
													{format(
														new Date(
															selectedCredit.date
														),
														'MMM dd, yyyy'
													)}
												</StyledText>
											</View>
											<StyledText
												variant="semibold"
												className="text-red-600"
											>
												{formatCurrency(
													selectedCredit.amount -
														selectedCredit.amount_paid
												)}
											</StyledText>
										</View>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() =>
												setSelectedCredit(null)
											}
											className="mt-2 pt-2 border-t border-gray-100"
										>
											<StyledText
												variant="medium"
												className="text-secondary text-center text-sm"
											>
												Clear Selection
											</StyledText>
										</TouchableOpacity>
									</View>
								) : (
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() => setShowCreditList(true)}
										className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center justify-between"
									>
										<StyledText
											variant="medium"
											className="text-gray-500"
										>
											Select a credit transaction
										</StyledText>
										<FontAwesome
											name="chevron-right"
											size={14}
											color="#7A1CAC"
										/>
									</TouchableOpacity>
								)}

								{showCreditList && (
									<View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2">
										{unpaidCredits.map((credit) => (
											<TouchableOpacity
												key={credit.id}
												activeOpacity={0.7}
												onPress={() =>
													handleCreditSelect(credit)
												}
												className="p-4 border-b border-gray-100 flex-row items-center justify-between"
											>
												<View className="flex-1">
													<StyledText
														variant="semibold"
														className="text-primary"
													>
														{credit.product_name ||
															'Credit'}
													</StyledText>
													<StyledText
														variant="regular"
														className="text-gray-500 text-xs"
													>
														{format(
															new Date(
																credit.date
															),
															'MMM dd, yyyy'
														)}
													</StyledText>
												</View>
												<StyledText
													variant="semibold"
													className="text-red-600"
												>
													{formatCurrency(
														credit.amount -
															credit.amount_paid
													)}
												</StyledText>
											</TouchableOpacity>
										))}
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() =>
												setShowCreditList(false)
											}
											className="p-3 bg-gray-50"
										>
											<StyledText
												variant="medium"
												className="text-secondary text-center"
											>
												Cancel
											</StyledText>
										</TouchableOpacity>
									</View>
								)}
							</View>
						)}

						{/* Payment Method */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Payment Method
							</StyledText>
							<Controller
								control={control}
								name="paymentMethod"
								render={({ field: { onChange, value } }) => (
									<View className="flex-row gap-2">
										{(
											[
												'cash',
												'bank_transfer',
												'other',
											] as const
										).map((method) => (
											<TouchableOpacity
												key={method}
												activeOpacity={0.7}
												onPress={() => onChange(method)}
												className={`flex-1 py-3 rounded-xl ${
													value === method
														? 'bg-secondary'
														: 'bg-white border border-gray-200'
												}`}
											>
												<StyledText
													variant={
														value === method
															? 'semibold'
															: 'medium'
													}
													className={`text-center ${
														value === method
															? 'text-white'
															: 'text-gray-700'
													}`}
												>
													{method === 'bank_transfer'
														? 'Bank'
														: method
																.charAt(0)
																.toUpperCase() +
															method.slice(1)}
												</StyledText>
											</TouchableOpacity>
										))}
									</View>
								)}
							/>
						</View>
						<View className="mb-6">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Notes
							</StyledText>
							<Controller
								control={control}
								name="notes"
								render={({ field: { onChange, value } }) => (
									<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="Add any notes..."
											placeholderTextColor="#9ca3af"
											multiline
											numberOfLines={3}
											textAlignVertical="top"
											className="text-primary font-stack-sans text-base"
										/>
									</View>
								)}
							/>
						</View>
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleSubmit(onSubmit)}
							disabled={addPaymentMutation.isPending || !amount}
							className={`rounded-xl py-4 ${addPaymentMutation.isPending || !amount ? 'bg-gray-300' : 'bg-green-600'}`}
						>
							<StyledText
								variant="semibold"
								className="text-white text-center text-base"
							>
								{addPaymentMutation.isPending
									? 'Recording Payment...'
									: 'Record Payment'}
							</StyledText>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAwareScrollView>
		</SafeAreaView>
	);
}
