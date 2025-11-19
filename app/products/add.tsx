import StyledText from '@/components/elements/StyledText';
import { insertInventoryTransaction } from '@/db/inventory';
import { insertProduct } from '@/db/products';
import { useToastStore } from '@/stores/ToastStore';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
	'Snacks',
	'Drinks',
	'Household',
	'Frozen',
	'Cigarettes',
	'Other',
];

export default function AddProduct() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const addToast = useToastStore((state) => state.addToast);

	const [productName, setProductName] = useState('');
	const [sku, setSku] = useState('');
	const [price, setPrice] = useState('');
	const [initialStock, setInitialStock] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [autoGenerateSku, setAutoGenerateSku] = useState(true);

	// Generate SKU from product name
	const generateSku = (name: string) => {
		if (!name) return '';
		const parts = name.trim().split(' ');
		const prefix = parts
			.slice(0, 2)
			.map((p) => p.charAt(0).toUpperCase())
			.join('');
		const timestamp = Date.now().toString().slice(-4);
		return `${prefix}-${timestamp}`;
	};

	// Auto-generate SKU when product name changes
	const handleNameChange = (text: string) => {
		setProductName(text);
		if (autoGenerateSku) {
			setSku(generateSku(text));
		}
	};

	// Add product mutation
	const addProductMutation = useMutation({
		mutationFn: async () => {
			// Validation
			if (!productName.trim()) {
				throw new Error('Product name is required');
			}
			if (!sku.trim()) {
				throw new Error('SKU is required');
			}
			if (!price || parseFloat(price) <= 0) {
				throw new Error('Valid price is required');
			}

			const priceValue = parseFloat(price);
			const stockValue = initialStock ? parseInt(initialStock, 10) : 0;

			// Insert product
			const productId = await insertProduct(
				productName.trim(),
				sku.trim(),
				priceValue,
				stockValue
			);

			// If initial stock > 0, create an inventory transaction
			if (stockValue > 0) {
				await insertInventoryTransaction(
					productId,
					'restock',
					stockValue
				);
			}

			return productId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			addToast({
				message: 'Product added successfully!',
				variant: 'success',
				duration: 2000,
			});
			router.push('/inventory');
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to add product',
				variant: 'error',
				duration: 2000,
			});
		},
	});

	const handleSubmit = () => {
		addProductMutation.mutate();
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				{/* Header */}
				<View className="bg-primary px-4 py-6 flex-row items-center">
					<Pressable
						onPress={() => router.back()}
						className="mr-3 active:opacity-50"
					>
						<FontAwesome name="arrow-left" size={20} color="#fff" />
					</Pressable>
					<StyledText
						variant="extrabold"
						className="text-white text-2xl"
					>
						Add Product
					</StyledText>
				</View>

				<ScrollView
					className="flex-1"
					contentContainerStyle={{ padding: 16 }}
				>
					{/* Product Name */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							Product Name *
						</StyledText>
						<TextInput
							placeholder="e.g., Lucky Me Pancit Canton"
							value={productName}
							onChangeText={handleNameChange}
							className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
							placeholderTextColor="#9ca3af"
							autoFocus
						/>
					</View>

					{/* SKU */}
					<View className="mb-4">
						<View className="flex-row justify-between items-center mb-2">
							<StyledText
								variant="semibold"
								className="text-text-primary text-sm"
							>
								SKU (Stock Keeping Unit) *
							</StyledText>
							<Pressable
								onPress={() =>
									setAutoGenerateSku(!autoGenerateSku)
								}
								className="flex-row items-center active:opacity-50"
							>
								<View
									className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
										autoGenerateSku
											? 'bg-accent border-accent'
											: 'border-gray-300'
									}`}
								>
									{autoGenerateSku && (
										<FontAwesome
											name="check"
											size={12}
											color="#fff"
										/>
									)}
								</View>
								<StyledText
									variant="regular"
									className="text-text-secondary text-xs"
								>
									Auto-generate
								</StyledText>
							</Pressable>
						</View>
						<TextInput
							placeholder="e.g., PC-001"
							value={sku}
							onChangeText={setSku}
							className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
							placeholderTextColor="#9ca3af"
							editable={!autoGenerateSku}
							style={{
								opacity: autoGenerateSku ? 0.6 : 1,
							}}
						/>
						{autoGenerateSku && (
							<StyledText
								variant="regular"
								className="text-text-muted text-xs mt-1"
							>
								SKU will be auto-generated based on product name
							</StyledText>
						)}
					</View>

					{/* Price */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							Price (₱) *
						</StyledText>
						<View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
							<StyledText
								variant="medium"
								className="text-text-secondary text-base mr-2"
							>
								₱
							</StyledText>
							<TextInput
								placeholder="0.00"
								value={price}
								onChangeText={setPrice}
								keyboardType="decimal-pad"
								className="flex-1 font-stack-sans text-base text-text-primary"
								placeholderTextColor="#9ca3af"
							/>
						</View>
					</View>

					{/* Initial Stock */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							Initial Stock Quantity
						</StyledText>
						<TextInput
							placeholder="0"
							value={initialStock}
							onChangeText={setInitialStock}
							keyboardType="number-pad"
							className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
							placeholderTextColor="#9ca3af"
						/>
						<StyledText
							variant="regular"
							className="text-text-muted text-xs mt-1"
						>
							You can leave this as 0 and add stock later via
							Inventory
						</StyledText>
					</View>

					{/* Category (Optional - UI only for now) */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							Category (Optional)
						</StyledText>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
						>
							<View className="flex-row gap-2">
								{CATEGORIES.map((category) => (
									<Pressable
										key={category}
										onPress={() =>
											setSelectedCategory(
												selectedCategory === category
													? ''
													: category
											)
										}
										className={`px-4 py-2 rounded-xl ${
											selectedCategory === category
												? 'bg-accent'
												: 'bg-white border border-gray-200'
										} active:opacity-70`}
									>
										<StyledText
											variant="medium"
											className={`text-sm ${
												selectedCategory === category
													? 'text-white'
													: 'text-text-secondary'
											}`}
										>
											{category}
										</StyledText>
									</Pressable>
								))}
							</View>
						</ScrollView>
					</View>

					{/* Info Box */}
					<View className="bg-blue-50 rounded-xl p-4 flex-row mb-6">
						<FontAwesome
							name="info-circle"
							size={20}
							color="#3b82f6"
							style={{ marginRight: 12 }}
						/>
						<View className="flex-1">
							<StyledText
								variant="semibold"
								className="text-blue-700 text-sm mb-1"
							>
								Quick Tip
							</StyledText>
							<StyledText
								variant="regular"
								className="text-blue-600 text-xs leading-5"
							>
								Fields marked with * are required. You can
								update product details anytime from the Products
								screen.
							</StyledText>
						</View>
					</View>

					{/* Submit Button */}
					<Pressable
						onPress={handleSubmit}
						disabled={addProductMutation.isPending}
						className={`bg-accent rounded-xl py-4 items-center shadow-md active:opacity-70 ${
							addProductMutation.isPending ? 'opacity-50' : ''
						}`}
					>
						{addProductMutation.isPending ? (
							<ActivityIndicator color="#fff" />
						) : (
							<StyledText
								variant="extrabold"
								className="text-white text-base"
							>
								Add Product
							</StyledText>
						)}
					</Pressable>

					{/* Cancel Button */}
					<Pressable
						onPress={() => router.back()}
						className="bg-gray-200 rounded-xl py-4 items-center mt-3 active:opacity-70"
					>
						<StyledText
							variant="semibold"
							className="text-text-primary text-base"
						>
							Cancel
						</StyledText>
					</Pressable>

					{/* Bottom Spacing */}
					<View className="h-8" />
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
