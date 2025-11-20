import StyledText from '@/components/elements/StyledText';
import { insertInventoryTransaction } from '@/db/inventory';
import { useProductsMutation } from '@/hooks/useProductsMutation';
import { useToastStore } from '@/stores/ToastStore';
import { Alert } from '@/utils/alert';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	BackHandler,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	TextInput,
	TouchableOpacity,
	View
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

interface AddProductForm {
	productName: string;
	sku: string;
	price: string;
	initialStock: string;
	category: string;
}

export default function AddProduct() {
	const router = useRouter();
	const addToast = useToastStore((state) => state.addToast);
	const { insertProductMutation } = useProductsMutation();

	const [autoGenerateSku, setAutoGenerateSku] = useState<boolean>(true);

	const {
		handleSubmit,
		control,
		setValue,
		formState: { isDirty },
	} = useForm<AddProductForm>({
		mode: 'onSubmit',
		defaultValues: {
			productName: '',
			sku: '',
			price: '',
			initialStock: '',
			category: '',
		},
	});

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
		if (autoGenerateSku) {
			setValue('sku', generateSku(text));
		}
	};

	// Handle back navigation
	const handleBackPress = () => {
		if (isDirty) {
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
			if (isDirty) {
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
	}, [isDirty]);

	const onSubmit = async (data: AddProductForm) => {
		try {
			if (!data.productName.trim()) {
				throw new Error('Product name is required');
			}
			if (!data.sku.trim()) {
				throw new Error('SKU is required');
			}
			if (!data.price || parseFloat(data.price) <= 0) {
				throw new Error('Valid price is required');
			}

			const priceValue = parseFloat(data.price);
			const stockValue = data.initialStock ? parseInt(data.initialStock, 10) : 0;

			// Insert product
			const productId = await insertProductMutation.mutateAsync({
				name: data.productName.trim(),
				sku: data.sku.trim(),
				price: priceValue,
				quantity: stockValue
			});

			// If initial stock > 0, create an inventory transaction
			if (stockValue > 0) {
				await insertInventoryTransaction(
					productId,
					'restock',
					stockValue
				);
			}

			router.push('/');
		} catch (error) {
			// Error already handled by mutation
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				{/* Header */}
				<View className="bg-primary px-4 py-6 flex-row items-center">
					<TouchableOpacity
						hitSlop={20}
						activeOpacity={0.2}
						onPress={handleBackPress}
						className="mr-3"
					>
						<FontAwesome name="arrow-left" size={20} color="#fff" />
					</TouchableOpacity>
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
						<Controller
							control={control}
							name="productName"
							render={({ field: { value, onChange } }) => (
								<TextInput
									placeholder="e.g., Lucky Me Pancit Canton"
									value={value}
									onChangeText={(text) => {
										onChange(text);
										handleNameChange(text);
									}}
									className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
									placeholderTextColor="#9ca3af"
								/>
							)}
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
						<Controller
							control={control}
							name="sku"
							render={({ field: { value, onChange } }) => (
								<TextInput
									placeholder="e.g., PC-001"
									value={value}
									onChangeText={onChange}
									className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
									placeholderTextColor="#9ca3af"
									editable={!autoGenerateSku}
									style={{
										opacity: autoGenerateSku ? 0.6 : 1,
									}}
								/>
							)}
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
							<Controller
								control={control}
								name="price"
								render={({ field: { value, onChange } }) => (
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

					{/* Initial Stock */}
					<View className="mb-4">
						<StyledText
							variant="semibold"
							className="text-text-primary text-sm mb-2"
						>
							Initial Stock Quantity
						</StyledText>
						<Controller
							control={control}
							name="initialStock"
							render={({ field: { value, onChange } }) => (
								<TextInput
									placeholder="0"
									value={value}
									onChangeText={onChange}
									keyboardType="number-pad"
									className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
									placeholderTextColor="#9ca3af"
								/>
							)}
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
									<Controller
										key={category}
										control={control}
										name="category"
										render={({ field: { value, onChange } }) => (
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
					onPress={handleSubmit(onSubmit)}
					disabled={insertProductMutation.isPending}
					className={`bg-accent rounded-xl py-4 items-center shadow-md active:opacity-70 ${
						insertProductMutation.isPending ? 'opacity-50' : ''
					}`}
				>
					{insertProductMutation.isPending ? (
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
					<TouchableOpacity
						onPress={handleBackPress}
						className="bg-gray-200 rounded-xl py-4 items-center mt-3 active:opacity-70"
					>
						<StyledText
							variant="semibold"
							className="text-text-primary text-base"
						>
							Cancel
						</StyledText>
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
