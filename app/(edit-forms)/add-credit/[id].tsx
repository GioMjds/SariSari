import StyledText from '@/components/elements/StyledText';
import { NewCredit } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useCredits } from '@/hooks/useCredits';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Product } from '@/types/products.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useProducts';

interface CreditFormData {
	productName: string;
	quantity: string;
	amount: string;
	dueDate: string;
	notes: string;
}

export default function AddCreditTransaction() {
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [useProductList, setUseProductList] = useState<boolean>(false);

	const { id } = useLocalSearchParams<{ id: string }>();
	const queryClient = useQueryClient();

	const { useCustomer, useInsertCredit } = useCredits();
	const { getAllProductsQuery } = useProducts();

	// React Hook Form
	const {
		control,
		handleSubmit,
		setValue,
		watch,
	} = useForm<CreditFormData>({
		defaultValues: {
			productName: '',
			quantity: '',
			amount: '',
			dueDate: '',
			notes: '',
		},
	});

	const quantity = watch('quantity');
	const amount = watch('amount');

	// Query customer
	const { data: customer } = useCustomer(Number(id));

	// Query products
	const { data: products = [] } = getAllProductsQuery();

	// Refetch on focus
	useFocusEffect(
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: ['customer', id] });
			queryClient.invalidateQueries({ queryKey: ['products'] });
		}, [queryClient, id])
	);

	// Add credit mutation
	const addCreditMutation = useInsertCredit();

	const handleProductSelect = (product: Product) => {
		setSelectedProduct(product);
		setValue('productName', product.name);
		setValue('amount', product.price.toString());
		setUseProductList(false);
	};

	const onSubmit = (data: CreditFormData) => {
		const payload: NewCredit = {
			customer_id: Number(id),
			product_id: selectedProduct?.id,
			product_name: selectedProduct ? selectedProduct.name : data.productName?.trim() || undefined,
			quantity: data.quantity ? parseInt(data.quantity, 10) : undefined,
			amount: parseFloat(data.amount),
			due_date: data.dueDate?.trim() || undefined,
			notes: data.notes?.trim() || undefined,
		};

		addCreditMutation.mutate(payload);
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const calculateTotal = () => {
		const qty = quantity ? parseInt(quantity) : 1;
		const amt = amount ? parseFloat(amount) : 0;
		return qty * amt;
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
							Add Credit
						</StyledText>

						<View className="w-6" />
					</View>

					{customer && (
						<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
							<StyledText
								variant="semibold"
								className="text-primary text-base"
							>
								{customer.name}
							</StyledText>
							<StyledText
								variant="regular"
								className="text-gray-500 text-sm mt-1"
							>
								Outstanding:{' '}
								{formatCurrency(customer.outstanding_balance)}
							</StyledText>
						</View>
					)}
				</View>

				<ScrollView
					className="flex-1 px-4"
					showsVerticalScrollIndicator={false}
				>
					<View className="pb-32 pt-4">
						{/* Product Selection */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Product/Item
							</StyledText>

							{!useProductList ? (
								<>
									<Controller
										control={control}
										name="productName"
										render={({
											field: { onChange, value },
										}) => (
											<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
												<TextInput
													value={value}
													onChangeText={onChange}
													placeholder="Enter product name"
													placeholderTextColor="#9ca3af"
													className="text-primary font-stack-sans text-base"
												/>
											</View>
										)}
									/>
									{products.length > 0 && (
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() =>
												setUseProductList(true)
											}
											className="mt-2"
										>
											<StyledText
												variant="medium"
												className="text-secondary text-sm text-center"
											>
												Or select from product list
											</StyledText>
										</TouchableOpacity>
									)}
								</>
							) : (
								<View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
									{products.map((product) => (
										<TouchableOpacity
											key={product.id}
											activeOpacity={0.7}
											onPress={() =>
												handleProductSelect(product)
											}
											className="p-4 border-b border-gray-100 flex-row items-center justify-between"
										>
											<View className="flex-1">
												<StyledText
													variant="semibold"
													className="text-primary"
												>
													{product.name}
												</StyledText>
												<StyledText
													variant="regular"
													className="text-gray-500 text-xs"
												>
													Stock: {product.quantity}
												</StyledText>
											</View>
											<StyledText
												variant="semibold"
												className="text-secondary"
											>
												{formatCurrency(product.price)}
											</StyledText>
										</TouchableOpacity>
									))}
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() => setUseProductList(false)}
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

						{/* Quantity */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Quantity (Optional)
							</StyledText>
							<Controller
								control={control}
								name="quantity"
								render={({ field: { onChange, value } }) => (
									<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="1"
											placeholderTextColor="#9ca3af"
											keyboardType="number-pad"
											className="text-primary font-stack-sans text-base"
										/>
									</View>
								)}
							/>
						</View>

						{/* Price/Amount */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Price/Amount *
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
						</View>

						{/* Total Calculation */}
						{quantity && amount && (
							<View className="bg-accent/10 border border-accent rounded-xl p-4 mb-4">
								<View className="flex-row items-center justify-between">
									<StyledText
										variant="semibold"
										className="text-secondary"
									>
										Total Credit Amount
									</StyledText>
									<StyledText
										variant="extrabold"
										className="text-secondary text-lg"
									>
										{formatCurrency(calculateTotal())}
									</StyledText>
								</View>
								<StyledText
									variant="regular"
									className="text-gray-600 text-xs mt-1"
								>
									{quantity} ×{' '}
									{formatCurrency(parseFloat(amount))}
								</StyledText>
							</View>
						)}

						{/* Due Date */}
						<View className="mb-4">
							<StyledText
								variant="semibold"
								className="text-primary text-sm mb-2"
							>
								Due Date (Optional)
							</StyledText>
							<Controller
								control={control}
								name="dueDate"
								render={({ field: { onChange, value } }) => (
									<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
										<FontAwesome
											name="calendar"
											size={16}
											color="#7A1CAC"
										/>
										<TextInput
											value={value}
											onChangeText={onChange}
											placeholder="YYYY-MM-DD"
											placeholderTextColor="#9ca3af"
											className="flex-1 ml-3 text-primary font-stack-sans text-base"
										/>
									</View>
								)}
							/>
						</View>

						{/* Notes */}
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

						{/* Submit Button */}
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={handleSubmit(onSubmit)}
							disabled={addCreditMutation.isPending || !amount}
							className={`rounded-xl py-4 ${addCreditMutation.isPending || !amount ? 'bg-gray-300' : 'bg-secondary'}`}
						>
							<StyledText
								variant="semibold"
								className="text-white text-center text-base"
							>
								{addCreditMutation.isPending
									? 'Adding Credit...'
									: 'Add Credit'}
							</StyledText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
