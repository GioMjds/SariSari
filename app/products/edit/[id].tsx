import StyledText from '@/components/elements/StyledText';
import { deleteProduct, getProduct, updateProduct } from '@/db/products';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['Snacks', 'Drinks', 'Household', 'Frozen', 'Cigarettes', 'Other'];

export default function EditProduct() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [productName, setProductName] = useState('');
	const [sku, setSku] = useState('');
	const [price, setPrice] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('');
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	// Fetch product data
	const { data: product, isLoading } = useQuery({
		queryKey: ['product', id],
		queryFn: () => getProduct(parseInt(id, 10)),
		enabled: !!id,
	});

	// Populate form when product data loads
	useEffect(() => {
		if (product) {
			setProductName(product.name);
			setSku(product.sku);
			setPrice(product.price.toString());
		}
	}, [product]);

	// Update product mutation
	const updateMutation = useMutation({
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

			// Note: We don't update quantity here - that's handled via Inventory
			await updateProduct(
				parseInt(id, 10),
				productName.trim(),
				sku.trim(),
				priceValue,
				product?.quantity || 0
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.invalidateQueries({ queryKey: ['product', id] });
			Alert.alert('Success', 'Product updated successfully!', [
				{
					text: 'OK',
					onPress: () => router.back(),
				},
			]);
		},
		onError: (error: Error) => {
			Alert.alert('Error', error.message || 'Failed to update product');
		},
	});

	// Delete product mutation
	const deleteMutation = useMutation({
		mutationFn: () => deleteProduct(parseInt(id, 10)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			Alert.alert('Deleted', 'Product deleted successfully', [
				{
					text: 'OK',
					onPress: () => router.replace('/products'),
				},
			]);
		},
		onError: (error: Error) => {
			Alert.alert('Error', error.message || 'Failed to delete product');
		},
	});

	const handleUpdate = () => {
		updateMutation.mutate();
	};

	const handleDelete = () => {
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		setShowDeleteModal(false);
		deleteMutation.mutate();
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator size="large" color="#7A1CAC" />
			</SafeAreaView>
		);
	}

	if (!product) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
				<FontAwesome name="exclamation-circle" size={64} color="#dc2626" style={{ opacity: 0.5 }} />
				<StyledText variant="semibold" className="text-text-primary text-xl mt-4 text-center">
					Product Not Found
				</StyledText>
				<Pressable
					onPress={() => router.back()}
					className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-70"
				>
					<StyledText variant="semibold" className="text-white text-base">
						Go Back
					</StyledText>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
				{/* Header */}
				<View className="bg-primary px-4 py-4 flex-row items-center justify-between">
					<View className="flex-row items-center flex-1">
						<Pressable onPress={() => router.back()} className="mr-3 active:opacity-50">
							<FontAwesome name="arrow-left" size={20} color="#fff" />
						</Pressable>
						<StyledText variant="extrabold" className="text-white text-2xl">
							Edit Product
						</StyledText>
					</View>
					<Pressable onPress={handleDelete} className="p-2 active:opacity-50">
						<FontAwesome name="trash" size={20} color="#fff" />
					</Pressable>
				</View>

				<ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
					{/* Current Stock Info (Read-only) */}
					<View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
						<StyledText variant="semibold" className="text-text-secondary text-xs mb-2">
							CURRENT STOCK
						</StyledText>
						<View className="flex-row items-center justify-between">
							<StyledText variant="extrabold" className="text-primary text-2xl">
								{product.quantity}
							</StyledText>
							<Pressable
								onPress={() => router.push('/inventory')}
								className="bg-accent rounded-lg px-4 py-2 active:opacity-70"
							>
								<StyledText variant="semibold" className="text-white text-xs">
									Manage Stock →
								</StyledText>
							</Pressable>
						</View>
						<StyledText variant="regular" className="text-text-muted text-xs mt-2">
							To update stock quantity, use the Inventory screen
						</StyledText>
					</View>

					{/* Product Name */}
					<View className="mb-4">
						<StyledText variant="semibold" className="text-text-primary text-sm mb-2">
							Product Name *
						</StyledText>
						<TextInput
							placeholder="e.g., Lucky Me Pancit Canton"
							value={productName}
							onChangeText={setProductName}
							className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
							placeholderTextColor="#9ca3af"
						/>
					</View>

					{/* SKU */}
					<View className="mb-4">
						<StyledText variant="semibold" className="text-text-primary text-sm mb-2">
							SKU (Stock Keeping Unit) *
						</StyledText>
						<TextInput
							placeholder="e.g., PC-001"
							value={sku}
							onChangeText={setSku}
							className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
							placeholderTextColor="#9ca3af"
						/>
						<StyledText variant="regular" className="text-text-muted text-xs mt-1">
							⚠️ Changing SKU may affect inventory tracking
						</StyledText>
					</View>

					{/* Price */}
					<View className="mb-4">
						<StyledText variant="semibold" className="text-text-primary text-sm mb-2">
							Price (₱) *
						</StyledText>
						<View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
							<StyledText variant="medium" className="text-text-secondary text-base mr-2">
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

					{/* Category (Optional - UI only for now) */}
					<View className="mb-4">
						<StyledText variant="semibold" className="text-text-primary text-sm mb-2">
							Category (Optional)
						</StyledText>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							<View className="flex-row gap-2">
								{CATEGORIES.map((category) => (
									<Pressable
										key={category}
										onPress={() =>
											setSelectedCategory(selectedCategory === category ? '' : category)
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
												selectedCategory === category ? 'text-white' : 'text-text-secondary'
											}`}
										>
											{category}
										</StyledText>
									</Pressable>
								))}
							</View>
						</ScrollView>
					</View>

					{/* Product Info */}
					<View className="bg-blue-50 rounded-xl p-4 flex-row mb-6">
						<FontAwesome name="info-circle" size={20} color="#3b82f6" style={{ marginRight: 12 }} />
						<View className="flex-1">
							<StyledText variant="semibold" className="text-blue-700 text-sm mb-1">
								Product Information
							</StyledText>
							<StyledText variant="regular" className="text-blue-600 text-xs leading-5 mb-2">
								Created: {new Date(product.created_at).toLocaleDateString()}
							</StyledText>
							<StyledText variant="regular" className="text-blue-600 text-xs leading-5">
								Last Updated: {new Date(product.updated_at).toLocaleDateString()}
							</StyledText>
						</View>
					</View>

					{/* Action Buttons */}
					<View className="gap-3 mb-8">
						{/* Save Changes */}
						<Pressable
							onPress={handleUpdate}
							disabled={updateMutation.isPending}
							className={`bg-accent rounded-xl py-4 items-center shadow-md active:opacity-70 ${
								updateMutation.isPending ? 'opacity-50' : ''
							}`}
						>
							{updateMutation.isPending ? (
								<ActivityIndicator color="#fff" />
							) : (
								<StyledText variant="extrabold" className="text-white text-base">
									Save Changes
								</StyledText>
							)}
						</Pressable>

						{/* View in Inventory */}
						<Pressable
							onPress={() => router.push('/inventory')}
							className="bg-secondary rounded-xl py-4 items-center active:opacity-70"
						>
							<StyledText variant="semibold" className="text-white text-base">
								View Inventory History
							</StyledText>
						</Pressable>

						{/* Cancel */}
						<Pressable
							onPress={() => router.back()}
							className="bg-gray-200 rounded-xl py-4 items-center active:opacity-70"
						>
							<StyledText variant="semibold" className="text-text-primary text-base">
								Cancel
							</StyledText>
						</Pressable>

						{/* Delete Product (Danger Zone) */}
						<View className="mt-4 border-t border-gray-200 pt-4">
							<StyledText variant="semibold" className="text-text-secondary text-xs mb-2">
								DANGER ZONE
							</StyledText>
							<Pressable
								onPress={handleDelete}
								className="bg-red-600 rounded-xl py-4 items-center active:opacity-70"
							>
								<View className="flex-row items-center">
									<FontAwesome name="trash" size={16} color="#fff" style={{ marginRight: 8 }} />
									<StyledText variant="extrabold" className="text-white text-base">
										Delete Product
									</StyledText>
								</View>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Delete Confirmation Modal */}
			<Modal
				visible={showDeleteModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDeleteModal(false)}
			>
				<View className="flex-1 bg-black/40 justify-center items-center px-6">
					<View className="bg-white rounded-2xl p-6 w-full max-w-sm">
						<View className="items-center mb-4">
							<View className="bg-red-100 rounded-full p-4 mb-3">
								<FontAwesome name="exclamation-triangle" size={32} color="#dc2626" />
							</View>
							<StyledText variant="extrabold" className="text-text-primary text-xl mb-2 text-center">
								Delete Product?
							</StyledText>
							<StyledText variant="regular" className="text-text-secondary text-sm text-center">
								Are you sure you want to delete "{product.name}"?
							</StyledText>
							<StyledText variant="semibold" className="text-red-600 text-sm mt-2 text-center">
								This action cannot be undone.
							</StyledText>
						</View>
						<View className="gap-3">
							<Pressable
								onPress={confirmDelete}
								disabled={deleteMutation.isPending}
								className="bg-red-600 rounded-xl py-3 active:opacity-70"
							>
								{deleteMutation.isPending ? (
									<ActivityIndicator color="#fff" />
								) : (
									<StyledText variant="extrabold" className="text-white text-center text-base">
										Yes, Delete Product
									</StyledText>
								)}
							</Pressable>
							<Pressable
								onPress={() => setShowDeleteModal(false)}
								className="bg-gray-200 rounded-xl py-3 active:opacity-70"
							>
								<StyledText variant="semibold" className="text-text-primary text-center text-base">
									Cancel
								</StyledText>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}