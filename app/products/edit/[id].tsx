import StyledText from '@/components/elements/StyledText';
import Modal from '@/components/ui/Modal';
import { useProducts } from '@/hooks/useProducts';
import { useToastStore } from '@/stores/ToastStore';
import { Alert } from '@/utils/alert';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	BackHandler,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	TextInput, TouchableOpacity, View
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

interface EditProductForm {
	name: string;
	sku: string;
	price: string;
	category: string;
}

export default function EditProduct() {
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	const { useGetProduct, updateProductMutation, deleteProductMutation } = useProducts();

	const { data: product, isLoading } = useGetProduct(parseInt(id, 10));

	const {
		control,
		handleSubmit,
		formState: { isDirty },
	} = useForm<EditProductForm>({
		defaultValues: {
			name: '',
			sku: '',
			price: '',
			category: '',
		},
		values: product
			? {
				name: product.name,
				sku: product.sku,
				price: product.price.toString(),
				category: '',
			} : undefined,
	});

	// Check for unsaved changes
	const hasUnsavedChanges = isDirty;

	const handleBackPress = () => {
		if (hasUnsavedChanges) {
			Alert.alert(
				'Unsaved Changes',
				'You have unsaved changes. Are you sure you want to discard them?',
				[
					{ text: "Don't Leave", style: 'cancel', onPress: () => {} },
					{
						text: 'Discard',
						style: 'destructive',
						onPress: () => router.back(),
					},
				]
			);
		} else {
			router.back();
		}
	};

	// Handle hardware back button
	useEffect(() => {
		const onBackPress = () => {
			if (hasUnsavedChanges) {
				Alert.alert(
					'Unsaved Changes',
					'You have unsaved changes. Are you sure you want to discard them?',
					[
						{
							text: "Don't Leave",
							style: 'cancel',
							onPress: () => {},
						},
						{
							text: 'Discard',
							style: 'destructive',
							onPress: () => router.back(),
						},
					]
				);
				return true;
			}
			return false;
		};

		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			onBackPress
		);

		return () => backHandler.remove();
	}, [hasUnsavedChanges]);

	const onSubmit = async (data: EditProductForm) => {
		try {
			if (!data.name.trim()) {
				throw new Error('Product name is required');
			}
			if (!data.sku.trim()) {
				throw new Error('SKU is required');
			}
			if (!data.price || parseFloat(data.price) <= 0) {
				throw new Error('Valid price is required');
			}

			const priceValue = parseFloat(data.price);

			await updateProductMutation.mutateAsync({
				id: parseInt(id, 10),
				name: data.name.trim(),
				sku: data.sku.trim(),
				price: priceValue,
				quantity: product?.quantity || 0
			});

			router.back();
		} catch (error) {
			// Error already handled by mutation
		}
	};

	const handleDelete = () => {
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		setShowDeleteModal(false);
		try {
			await deleteProductMutation.mutateAsync(parseInt(id, 10));
			router.replace('/products');
		} catch (error) {
			// Error already handled by mutation
		}
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
				<FontAwesome
					name="exclamation-circle"
					size={64}
					color="#dc2626"
					style={{ opacity: 0.5 }}
				/>
				<StyledText
					variant="semibold"
					className="text-text-primary text-xl mt-4 text-center"
				>
					Product Not Found
				</StyledText>
				<Pressable
					onPress={() => router.back()}
					className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-70"
				>
					<StyledText
						variant="semibold"
						className="text-white text-base"
					>
						Go Back
					</StyledText>
				</Pressable>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				{/* Header */}
				<View className="bg-primary px-4 py-6 flex-row items-center justify-between">
					<View className="flex-row items-center flex-1">
						<Pressable
							onPress={handleBackPress}
							className="mr-3 active:opacity-50"
						>
							<FontAwesome
								name="arrow-left"
								size={20}
								color="#fff"
							/>
						</Pressable>
						<StyledText
							variant="extrabold"
							className="text-white text-2xl"
						>
							Edit Product
						</StyledText>
					</View>
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
						<Controller
							control={control}
							name="name"
							render={({ field: { onChange, value } }) => (
								<TextInput
									placeholder="e.g., Lucky Me Pancit Canton"
									value={value}
									onChangeText={onChange}
									className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
									placeholderTextColor="#9ca3af"
								/>
							)}
						/>
					</View>
					{/* SKU */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							SKU (Stock Keeping Unit)
						</StyledText>
						<Controller
							control={control}
							name="sku"
							render={({ field: { value } }) => (
								<TextInput
									placeholder="e.g., PC-001"
									value={value}
									editable={false}
									className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary/40 shadow-sm"
									placeholderTextColor="#9ca3af"
								/>
							)}
						/>
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
							<Controller
								control={control}
								name="price"
								render={({ field: { onChange, value } }) => (
									<TextInput
										placeholder="0.00"
										value={value}
										onChangeText={onChange}
										keyboardType="decimal-pad"
										className="flex-1 font-stack-sans text-base text-text-primary"
										placeholderTextColor="#9ca3af"
									/>
								)}
							/>
						</View>
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
									<Controller
										key={category}
										control={control}
										name="category"
										render={({
											field: { onChange, value },
										}) => (
											<Pressable
												onPress={() =>
													onChange(
														value === category
															? ''
															: category
													)
												}
												className={`px-4 py-2 rounded-xl ${
													value === category
														? 'bg-accent'
														: 'bg-white border border-gray-200'
												} active:opacity-70`}
											>
												<StyledText
													variant="medium"
													className={`text-sm ${
														value === category
															? 'text-white'
															: 'text-text-secondary'
													}`}
												>
													{category}
												</StyledText>
											</Pressable>
										)}
									/>
								))}
							</View>
						</ScrollView>
					</View>

					{/* Product Info */}
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
								Product Information
							</StyledText>
							<StyledText
								variant="regular"
								className="text-blue-600 text-xs leading-5 mb-2"
							>
								Created:{' '}
								{new Date(
									product.created_at
								).toLocaleDateString()}
							</StyledText>
							<StyledText
								variant="regular"
								className="text-blue-600 text-xs leading-5"
							>
								Last Updated:{' '}
								{new Date(
									product.updated_at
								).toLocaleDateString()}
							</StyledText>
						</View>
					</View>

					{/* Action Buttons */}
					<View className="gap-3 mb-8">
						{/* Save Changes */}
						<TouchableOpacity
							onPress={handleSubmit(onSubmit)}
							disabled={updateProductMutation.isPending}
							className={`bg-accent rounded-xl py-4 items-center shadow-md ${
								updateProductMutation.isPending ? 'opacity-50' : ''
							}`}
						>
							{updateProductMutation.isPending ? (
								<ActivityIndicator color="#fff" />
							) : (
								<StyledText
									variant="extrabold"
									className="text-white text-base"
								>
									Save Changes
								</StyledText>
							)}
						</TouchableOpacity>

						{/* Cancel */}
						<TouchableOpacity
							onPress={handleBackPress}
							className="bg-gray-100 rounded-xl py-4 items-center"
						>
							<StyledText
								variant="semibold"
								className="text-text-primary text-base"
							>
								Cancel
							</StyledText>
						</TouchableOpacity>

						{/* Delete Product (Danger Zone) */}
						<View className="mt-4 border-t border-gray-200 pt-4">
							<StyledText
								variant="semibold"
								className="text-text-secondary text-xs mb-2"
							>
								DANGER ZONE
							</StyledText>
							<TouchableOpacity
								onPress={handleDelete}
								className="bg-red-600 rounded-xl py-4 items-center"
							>
								<View className="flex-row items-center">
									<FontAwesome
										name="trash"
										size={16}
										color="#fff"
										style={{ marginRight: 8 }}
									/>
									<StyledText
										variant="extrabold"
										className="text-white text-base"
									>
										Delete Product
									</StyledText>
								</View>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Delete Confirmation Modal */}
			<Modal
				visible={showDeleteModal}
				variant="danger"
				title="Delete Product?"
				description={`Are you sure you want to delete "${product.name}"?\nThis action cannot be undone.`}
				buttons={[
					{
						text: 'Yes, Delete Product',
						style: 'destructive',
						onPress: confirmDelete,
					},
					{
						text: 'Cancel',
						style: 'cancel',
						onPress: () => setShowDeleteModal(false),
					},
				]}
				onClose={() => setShowDeleteModal(false)}
				loading={deleteProductMutation.isPending}
			/>
		</SafeAreaView>
	);
}
