import StyledText from '@/components/elements/StyledText';
import {
  getCreditTransactionsByCustomer,
  getCustomer,
  initCreditsTable,
  insertPayment,
} from '@/db/credits';
import { CreditTransaction, Customer, NewPayment } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddPaymentTransaction() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [customer, setCustomer] = useState<Customer | null>(null);
	const [unpaidCredits, setUnpaidCredits] = useState<CreditTransaction[]>([]);
	const [selectedCredit, setSelectedCredit] = useState<CreditTransaction | null>(null);
	const [amount, setAmount] = useState('');
	const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'other'>('cash');
	const [notes, setNotes] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showCreditList, setShowCreditList] = useState(false);

	useEffect(() => {
		loadData();
	}, [id]);

	const loadData = async () => {
		try {
			await initCreditsTable();
			if (id) {
				const [customerData, credits] = await Promise.all([
					getCustomer(parseInt(id)),
					getCreditTransactionsByCustomer(parseInt(id)),
				]);
				setCustomer(customerData);
				const unpaid = credits.filter((c) => c.status !== 'paid');
				setUnpaidCredits(unpaid);
			}
		} catch (error) {
			console.error('Error loading data:', error);
		}
	};

	const handleCreditSelect = (credit: CreditTransaction) => {
		setSelectedCredit(credit);
		const remaining = credit.amount - credit.amount_paid;
		setAmount(remaining.toString());
		setShowCreditList(false);
	};

	const handleSubmit = async () => {
		if (!customer) {
			Alert.alert('Error', 'Customer not found');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Validation Error', 'Please enter a valid payment amount');
			return;
		}

		const paymentAmount = parseFloat(amount);
		if (paymentAmount > customer.outstanding_balance) {
			Alert.alert(
				'Validation Error',
				`Payment amount (${formatCurrency(paymentAmount)}) exceeds outstanding balance (${formatCurrency(customer.outstanding_balance)})`
			);
			return;
		}

		try {
			setIsSubmitting(true);

			const newPayment: NewPayment = {
				customer_id: customer.id,
				credit_transaction_id: selectedCredit?.id,
				amount: paymentAmount,
				payment_method: paymentMethod,
				notes: notes.trim() || undefined,
			};

			await insertPayment(newPayment);

			Alert.alert('Success', 'Payment recorded successfully', [
				{
					text: 'OK',
					onPress: () => router.back(),
				},
			]);
		} catch (error) {
			console.error('Error adding payment:', error);
			Alert.alert('Error', 'Failed to record payment. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
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
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				{/* Header */}
				<View className="px-4 pt-4 pb-2 bg-background">
					<View className="flex-row items-center justify-between mb-4">
						<TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
							<FontAwesome name="arrow-left" size={24} color="#2E073F" />
						</TouchableOpacity>

						<StyledText variant="extrabold" className="text-primary text-xl">
							Add Payment
						</StyledText>

						<View className="w-6" />
					</View>

					{customer && (
						<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
							<StyledText variant="semibold" className="text-primary text-base mb-2">
								{customer.name}
							</StyledText>
							<View className="flex-row items-center justify-between">
								<StyledText variant="regular" className="text-gray-500 text-sm">
									Outstanding Balance
								</StyledText>
								<StyledText variant="extrabold" className="text-red-600 text-lg">
									{formatCurrency(customer.outstanding_balance)}
								</StyledText>
							</View>
						</View>
					)}
				</View>

				<ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
					<View className="pb-32 pt-4">
						{/* Payment Amount */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Payment Amount *
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
								<StyledText variant="medium" className="text-secondary">
									₱
								</StyledText>
								<TextInput
									value={amount}
									onChangeText={setAmount}
									placeholder="0.00"
									placeholderTextColor="#9ca3af"
									keyboardType="decimal-pad"
									className="flex-1 ml-2 text-primary font-stack-sans text-base"
								/>
							</View>
							{customer && (
								<TouchableOpacity
									activeOpacity={0.7}
									onPress={() => setAmount(customer.outstanding_balance.toString())}
									className="mt-2"
								>
									<StyledText variant="medium" className="text-secondary text-sm">
										Pay full balance: {formatCurrency(customer.outstanding_balance)}
									</StyledText>
								</TouchableOpacity>
							)}
						</View>

						{/* Remaining Balance */}
						{amount && customer && (
							<View
								className={`rounded-xl p-4 mb-4 ${
									getRemainingBalance() === 0 ? 'bg-green-50 border border-green-200' : 'bg-accent/10 border border-accent'
								}`}
							>
								<View className="flex-row items-center justify-between">
									<StyledText
										variant="semibold"
										className={getRemainingBalance() === 0 ? 'text-green-700' : 'text-secondary'}
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
										<FontAwesome name="check-circle" size={14} color="#10b981" />
										<StyledText variant="medium" className="text-green-700 text-xs ml-1">
											This payment will clear all outstanding balance
										</StyledText>
									</View>
								)}
							</View>
						)}

						{/* Apply to Specific Credit */}
						{unpaidCredits.length > 0 && (
							<View className="mb-4">
								<StyledText variant="semibold" className="text-primary text-sm mb-2">
									Apply to Specific Credit (Optional)
								</StyledText>

								{selectedCredit ? (
									<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
										<View className="flex-row items-start justify-between mb-2">
											<View className="flex-1">
												<StyledText variant="semibold" className="text-primary">
													{selectedCredit.product_name || 'Credit'}
												</StyledText>
												<StyledText variant="regular" className="text-gray-500 text-xs">
													{format(new Date(selectedCredit.date), 'MMM dd, yyyy')}
												</StyledText>
											</View>
											<StyledText variant="semibold" className="text-red-600">
												{formatCurrency(selectedCredit.amount - selectedCredit.amount_paid)}
											</StyledText>
										</View>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() => setSelectedCredit(null)}
											className="mt-2 pt-2 border-t border-gray-100"
										>
											<StyledText variant="medium" className="text-secondary text-center text-sm">
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
										<StyledText variant="medium" className="text-gray-500">
											Select a credit transaction
										</StyledText>
										<FontAwesome name="chevron-right" size={14} color="#7A1CAC" />
									</TouchableOpacity>
								)}

								{showCreditList && (
									<View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-2">
										{unpaidCredits.map((credit) => (
											<TouchableOpacity
												key={credit.id}
												activeOpacity={0.7}
												onPress={() => handleCreditSelect(credit)}
												className="p-4 border-b border-gray-100 flex-row items-center justify-between"
											>
												<View className="flex-1">
													<StyledText variant="semibold" className="text-primary">
														{credit.product_name || 'Credit'}
													</StyledText>
													<StyledText variant="regular" className="text-gray-500 text-xs">
														{format(new Date(credit.date), 'MMM dd, yyyy')}
													</StyledText>
												</View>
												<StyledText variant="semibold" className="text-red-600">
													{formatCurrency(credit.amount - credit.amount_paid)}
												</StyledText>
											</TouchableOpacity>
										))}
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() => setShowCreditList(false)}
											className="p-3 bg-gray-50"
										>
											<StyledText variant="medium" className="text-secondary text-center">
												Cancel
											</StyledText>
										</TouchableOpacity>
									</View>
								)}
							</View>
						)}

						{/* Payment Method */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Payment Method
							</StyledText>
							<View className="flex-row gap-2">
								{(['cash', 'bank_transfer', 'other'] as const).map((method) => (
									<TouchableOpacity
										key={method}
										activeOpacity={0.7}
										onPress={() => setPaymentMethod(method)}
										className={`flex-1 py-3 rounded-xl ${
											paymentMethod === method ? 'bg-secondary' : 'bg-white border border-gray-200'
										}`}
									>
										<StyledText
											variant={paymentMethod === method ? 'semibold' : 'medium'}
											className={`text-center ${paymentMethod === method ? 'text-white' : 'text-gray-700'}`}
										>
											{method === 'bank_transfer' ? 'Bank' : method.charAt(0).toUpperCase() + method.slice(1)}
										</StyledText>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{/* Notes */}
						<View className="mb-6">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Notes
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
								<TextInput
									value={notes}
									onChangeText={setNotes}
									placeholder="Add any notes..."
									placeholderTextColor="#9ca3af"
									multiline
									numberOfLines={3}
									textAlignVertical="top"
									className="text-primary font-stack-sans text-base"
								/>
							</View>
						</View>

						{/* Submit Button */}
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleSubmit}
							disabled={isSubmitting || !amount}
							className={`rounded-xl py-4 ${isSubmitting || !amount ? 'bg-gray-300' : 'bg-green-600'}`}
						>
							<StyledText variant="semibold" className="text-white text-center text-base">
								{isSubmitting ? 'Recording Payment...' : 'Record Payment'}
							</StyledText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
