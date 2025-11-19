import StyledText from '@/components/elements/StyledText';
import { Alert } from '@/utils/alert';
import { getCustomer, initCreditsTable, insertCreditTransaction } from '@/db/credits';
import { getAllProducts, Product } from '@/db/products';
import { Customer, NewCredit } from '@/types/credits.types';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddCreditTransaction() {
    const [customer, setCustomer] = useState<Customer | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [productName, setProductName] = useState('');
	const [quantity, setQuantity] = useState('');
	const [amount, setAmount] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [notes, setNotes] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [useProductList, setUseProductList] = useState(false);

    const { id } = useLocalSearchParams<{ id: string }>();

	useEffect(() => {
		loadData();
	}, [id]);

	const loadData = async () => {
		try {
			await initCreditsTable();
			if (id) {
				const customerData = await getCustomer(parseInt(id));
				setCustomer(customerData);
			}
			const productsData = await getAllProducts();
			setProducts(productsData);
		} catch (error) {
			console.error('Error loading data:', error);
		}
	};

	const handleProductSelect = (product: Product) => {
		setSelectedProduct(product);
		setProductName(product.name);
		setAmount(product.price.toString());
		setUseProductList(false);
	};

	const handleSubmit = async () => {
		if (!customer) {
			Alert.alert('Error', 'Customer not found');
			return;
		}

		if (!productName.trim() && !amount) {
			Alert.alert('Validation Error', 'Please enter product name or amount');
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Validation Error', 'Please enter a valid amount');
			return;
		}

		try {
			setIsSubmitting(true);

			const newCredit: NewCredit = {
				customer_id: customer.id,
				product_id: selectedProduct?.id,
				product_name: productName.trim() || undefined,
				quantity: quantity ? parseInt(quantity) : undefined,
				amount: parseFloat(amount),
				due_date: dueDate || undefined,
				notes: notes.trim() || undefined,
			};

			await insertCreditTransaction(newCredit);

			Alert.alert('Success', 'Credit added successfully', [
				{
					text: 'OK',
					onPress: () => router.back(),
				},
			]);
		} catch (error) {
			console.error('Error adding credit:', error);
			Alert.alert('Error', 'Failed to add credit. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
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
						<TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
							<FontAwesome name="arrow-left" size={24} color="#2E073F" />
						</TouchableOpacity>

						<StyledText variant="extrabold" className="text-primary text-xl">
							Add Credit
						</StyledText>

						<View className="w-6" />
					</View>

					{customer && (
						<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
							<StyledText variant="semibold" className="text-primary text-base">
								{customer.name}
							</StyledText>
							<StyledText variant="regular" className="text-gray-500 text-sm mt-1">
								Outstanding: {formatCurrency(customer.outstanding_balance)}
							</StyledText>
						</View>
					)}
				</View>

				<ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
					<View className="pb-32 pt-4">
						{/* Product Selection */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Product/Item
							</StyledText>

							{!useProductList ? (
								<>
									<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
										<TextInput
											value={productName}
											onChangeText={setProductName}
											placeholder="Enter product name"
											placeholderTextColor="#9ca3af"
											className="text-primary font-stack-sans text-base"
										/>
									</View>
									{products.length > 0 && (
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={() => setUseProductList(true)}
											className="mt-2"
										>
											<StyledText variant="medium" className="text-secondary text-sm text-center">
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
											onPress={() => handleProductSelect(product)}
											className="p-4 border-b border-gray-100 flex-row items-center justify-between"
										>
											<View className="flex-1">
												<StyledText variant="semibold" className="text-primary">
													{product.name}
												</StyledText>
												<StyledText variant="regular" className="text-gray-500 text-xs">
													Stock: {product.quantity}
												</StyledText>
											</View>
											<StyledText variant="semibold" className="text-secondary">
												{formatCurrency(product.price)}
											</StyledText>
										</TouchableOpacity>
									))}
									<TouchableOpacity
										activeOpacity={0.7}
										onPress={() => setUseProductList(false)}
										className="p-3 bg-gray-50"
									>
										<StyledText variant="medium" className="text-secondary text-center">
											Cancel
										</StyledText>
									</TouchableOpacity>
								</View>
							)}
						</View>

						{/* Quantity */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Quantity (Optional)
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
								<TextInput
									value={quantity}
									onChangeText={setQuantity}
									placeholder="1"
									placeholderTextColor="#9ca3af"
									keyboardType="number-pad"
									className="text-primary font-stack-sans text-base"
								/>
							</View>
						</View>

						{/* Price/Amount */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Price/Amount *
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
						</View>

						{/* Total Calculation */}
						{quantity && amount && (
							<View className="bg-accent/10 border border-accent rounded-xl p-4 mb-4">
								<View className="flex-row items-center justify-between">
									<StyledText variant="semibold" className="text-secondary">
										Total Credit Amount
									</StyledText>
									<StyledText variant="extrabold" className="text-secondary text-lg">
										{formatCurrency(calculateTotal())}
									</StyledText>
								</View>
								<StyledText variant="regular" className="text-gray-600 text-xs mt-1">
									{quantity} × {formatCurrency(parseFloat(amount))}
								</StyledText>
							</View>
						)}

						{/* Due Date */}
						<View className="mb-4">
							<StyledText variant="semibold" className="text-primary text-sm mb-2">
								Due Date (Optional)
							</StyledText>
							<View className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 flex-row items-center">
								<FontAwesome name="calendar" size={16} color="#7A1CAC" />
								<TextInput
									value={dueDate}
									onChangeText={setDueDate}
									placeholder="YYYY-MM-DD"
									placeholderTextColor="#9ca3af"
									className="flex-1 ml-3 text-primary font-stack-sans text-base"
								/>
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
							className={`rounded-xl py-4 ${isSubmitting || !amount ? 'bg-gray-300' : 'bg-secondary'}`}
						>
							<StyledText variant="semibold" className="text-white text-center text-base">
								{isSubmitting ? 'Adding Credit...' : 'Add Credit'}
							</StyledText>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
