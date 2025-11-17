import StyledText from '@/components/elements/StyledText';
import { initInventoryTable, insertInventoryTransaction } from '@/db/inventory';
import { Product, getAllProducts, initProductsTable } from '@/db/products';
import { useToastStore } from '@/stores/ToastStore';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	ActivityIndicator,
	FlatList,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOW_STOCK_THRESHOLD = 5;

interface PendingAction {
	product: Product;
	type: 'restock' | 'sale';
}

export default function Inventory() {
	const queryClient = useQueryClient();

	const [search, setSearch] = useState<string>('');
	const [debouncedSearch, setDebouncedSearch] = useState<string>('');
	const [showLowOnly, setShowLowOnly] = useState<boolean>(false);
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(
		null
	);
	const [quantityInput, setQuantityInput] = useState<string>('');
	const addToast = useToastStore((state) => state.addToast);

	const debounceRef = useRef<number | null>(null);

    const router = useRouter();

	useEffect(() => {
		(async () => {
			await initProductsTable();
			await initInventoryTable();
		})();
	}, []);

	// Debounce search input
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(
			() => setDebouncedSearch(search.trim()),
			300
		);
	}, [search]);

	// Query products
	const {
		data: products,
		isLoading,
		isRefetching,
		refetch,
	} = useQuery<Product[]>({
		queryKey: ['products'],
		queryFn: getAllProducts,
	});

	useFocusEffect(
		useCallback(() => {
			refetch();
		}, [refetch])
	);

	// Mutation for inventory transaction
	const transactionMutation = useMutation({
		mutationFn: async ({
			product,
			type,
			quantity,
		}: {
			product: Product;
			type: 'restock' | 'sale';
			quantity: number;
		}) => {
			await insertInventoryTransaction(product.id, type, quantity);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			addToast({
				message: 'Stock updated successfully',
				variant: 'success',
				duration: 2000,
			});
		},
	});

	const filtered = useMemo(() => {
		if (!products) return [];
		let list = products;
		if (debouncedSearch) {
			const term = debouncedSearch.toLowerCase();
			list = list.filter(
				(p) =>
					p.name.toLowerCase().includes(term) ||
					p.sku.toLowerCase().includes(term)
			);
		}
		if (showLowOnly)
			list = list.filter((p) => p.quantity < LOW_STOCK_THRESHOLD);
		return list;
	}, [products, debouncedSearch, showLowOnly]);

	const openAction = useCallback(
		(product: Product, type: 'restock' | 'sale') => {
			setPendingAction({ product, type });
			setQuantityInput('');
		},
		[]
	);

	const closeAction = useCallback(() => {
		setPendingAction(null);
		setQuantityInput('');
	}, []);

	const submitAction = useCallback(() => {
		if (!pendingAction) return;
		const qty = parseInt(quantityInput, 10);
		if (isNaN(qty) || qty <= 0) {
			addToast({
				message: 'Please enter a valid quantity',
				variant: 'error',
				duration: 1800,
			});
			return;
		}
		// Prevent selling more than current quantity
		if (
			pendingAction.type === 'sale' &&
			qty > pendingAction.product.quantity
		) {
			addToast({
				message: 'Not enough stock available',
				variant: 'error',
				duration: 1800,
			});
			return;
		}
		transactionMutation.mutate({
			product: pendingAction.product,
			type: pendingAction.type,
			quantity: qty,
		});
		closeAction();
	}, [pendingAction, quantityInput, transactionMutation, closeAction, addToast]);

	const getStockStatus = (quantity: number) => {
		if (quantity === 0) return { color: 'text-red-600', label: 'Out of Stock', bg: 'bg-red-50' };
		if (quantity < LOW_STOCK_THRESHOLD) return { color: 'text-red-600', label: 'Low Stock', bg: 'bg-red-50' };
		if (quantity < LOW_STOCK_THRESHOLD * 3) return { color: 'text-yellow-600', label: 'Medium Stock', bg: 'bg-yellow-50' };
		return { color: 'text-green-600', label: 'In Stock', bg: 'bg-green-50' };
	};

	const renderItem = ({ item }: { item: Product }) => {
		const stockStatus = getStockStatus(item.quantity);
		
		return (
			<View className="mx-4 my-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				<View className="p-4">
					<View className="flex-row justify-between items-start mb-2">
						<View className="flex-1 mr-3">
							<StyledText variant="semibold" className="text-lg text-text-primary mb-1">
								{item.name}
							</StyledText>
							<StyledText variant="regular" className="text-sm text-text-muted mb-2">
								SKU: {item.sku}
							</StyledText>
						</View>
						<View className={`px-2 py-1 rounded-full ${stockStatus.bg}`}>
							<StyledText variant="medium" className={`text-xs ${stockStatus.color}`}>
								{stockStatus.label}
							</StyledText>
						</View>
					</View>

					<View className="flex-row justify-between items-center">
						<View className="flex-row items-baseline gap-3">
							<View>
								<StyledText variant="regular" className="text-xs text-text-muted">
									Quantity
								</StyledText>
								<StyledText variant="extrabold" className={`text-xl ${stockStatus.color}`}>
									{item.quantity}
								</StyledText>
							</View>
							<View className="h-8 w-px bg-gray-200" />
							<View>
								<StyledText variant="regular" className="text-xs text-text-muted">
									Price
								</StyledText>
								<StyledText variant="semibold" className="text-lg text-text-primary">
									₱{item.price.toFixed(2)}
								</StyledText>
							</View>
						</View>

						<View className="flex-row gap-2">
							<TouchableOpacity
								onPress={() => openAction(item, 'restock')}
								className="w-10 h-10 rounded-full bg-primary items-center justify-center shadow-sm"
							>
								<FontAwesome name="plus" size={16} color="#ffffff" />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => openAction(item, 'sale')}
								className="w-10 h-10 rounded-full bg-secondary items-center justify-center shadow-sm"
								disabled={item.quantity === 0}
								style={{ opacity: item.quantity === 0 ? 0.5 : 1 }}
							>
								<FontAwesome name="minus" size={16} color="#ffffff" />
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		);
	};

	// Summary footer stats
	const summary = useMemo(() => {
		if (!products) return { total: 0, low: 0, totalQty: 0 };
		const lowStockCount = products.filter((p) => p.quantity < LOW_STOCK_THRESHOLD).length;
		const outOfStockCount = products.filter((p) => p.quantity === 0).length;
		
		return {
			total: products.length,
			low: lowStockCount,
			outOfStock: outOfStockCount,
			totalQty: products.reduce((acc, p) => acc + p.quantity, 0),
		};
	}, [products]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="px-6 pt-6 pb-4 bg-background">
				<View className="flex-row items-center justify-between mb-4">
					<StyledText variant="extrabold" className="text-3xl text-text-primary">
						Inventory
					</StyledText>
					<TouchableOpacity 
						onPress={() => router.push('/products/add')}
						className="w-10 h-10 rounded-full bg-accent items-center justify-center shadow-sm"
					>
						<FontAwesome name="plus" size={18} color="#ffffff" />
					</TouchableOpacity>
				</View>

				{/* Search */}
				<View className="relative mb-3">
					<TextInput
						placeholder="Search products or SKU..."
						value={search}
						onChangeText={setSearch}
						placeholderTextColor="#9CA3AF"
						className="bg-white border border-gray-200 rounded-xl px-4 py-3 pl-11 text-text-primary shadow-sm"
					/>
					<View className="absolute left-3 top-3.5">
						<FontAwesome name="search" size={18} color="#9CA3AF" />
					</View>
					{search.length > 0 && (
						<TouchableOpacity 
							onPress={() => setSearch('')}
							className="absolute right-3 top-3.5"
						>
							<FontAwesome name="times-circle" size={18} color="#9CA3AF" />
						</TouchableOpacity>
					)}
				</View>

				{/* Filters & Stats */}
				<View className="flex-row items-center justify-between">
					<TouchableOpacity
						onPress={() => setShowLowOnly((prev) => !prev)}
						className={`flex-row items-center px-4 py-2 rounded-full ${showLowOnly ? 'bg-red-500' : 'bg-white border border-gray-200'}`}
					>
						<FontAwesome 
							name="exclamation-triangle" 
							size={14} 
							color={showLowOnly ? '#ffffff' : '#EF4444'} 
							style={{ marginRight: 6 }}
						/>
						<StyledText 
							variant="medium" 
							className={`text-xs ${showLowOnly ? 'text-white' : 'text-red-500'}`}
						>
							Low Stock
						</StyledText>
					</TouchableOpacity>

					<View className="flex-row items-center gap-4">
						<View className="items-center">
							<StyledText variant="black" className="text-lg text-text-primary">
								{summary.total}
							</StyledText>
							<StyledText variant="light" className="text-xs text-text-muted">
								Total
							</StyledText>
						</View>
						<View className="items-center">
							<StyledText variant="black" className="text-lg text-red-500">
								{summary.low}
							</StyledText>
							<StyledText variant="light" className="text-xs text-text-muted">
								Low
							</StyledText>
						</View>
						<View className="items-center">
							<StyledText variant="black" className="text-lg text-text-primary">
								{summary.totalQty}
							</StyledText>
							<StyledText variant="light" className="text-xs text-text-muted">
								Items
							</StyledText>
						</View>
					</View>
				</View>
			</View>

			{/* Inventory List */}
			{isLoading || isRefetching ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#7A1CAC" />
					<StyledText variant="medium" className="text-text-muted mt-3">
						Loading inventory...
					</StyledText>
				</View>
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderItem}
					contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View className="items-center justify-center py-12 px-6">
							<FontAwesome name="inbox" size={48} color="#E5E7EB" />
							<StyledText variant="semibold" className="text-text-primary text-lg mt-4 mb-2">
								No products found
							</StyledText>
							<StyledText variant="regular" className="text-text-muted text-center text-sm">
								{showLowOnly 
									? "No low stock items. Great job!" 
									: "Add your first product to get started"
								}
							</StyledText>
							{!showLowOnly && (
								<TouchableOpacity 
									onPress={() => router.push('/products/add')}
									className="mt-4 bg-accent px-6 py-3 rounded-full"
								>
									<StyledText variant="semibold" className="text-white text-sm">
										Add Product
									</StyledText>
								</TouchableOpacity>
							)}
						</View>
					}
				/>
			)}

			{/* Action Modal */}
			{pendingAction && (
				<View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
					<View className="w-full bg-white rounded-2xl p-6 shadow-xl">
						<View className="flex-row items-center justify-between mb-4">
							<StyledText variant="extrabold" className="text-xl text-text-primary">
								{pendingAction.type === 'restock' ? 'Restock Product' : 'Record Sale'}
							</StyledText>
							<TouchableOpacity onPress={closeAction} className="p-1">
								<FontAwesome name="times" size={20} color="#9CA3AF" />
							</TouchableOpacity>
						</View>

						<View className="bg-gray-50 rounded-xl p-4 mb-4">
							<StyledText variant="semibold" className="text-text-primary text-base mb-1">
								{pendingAction.product.name}
							</StyledText>
							<StyledText variant="regular" className="text-text-muted text-sm">
								SKU: {pendingAction.product.sku}
							</StyledText>
							<View className="flex-row gap-6 mt-2">
								<View>
									<StyledText variant="regular" className="text-text-muted text-xs">
										Current Stock
									</StyledText>
									<StyledText variant="semibold" className="text-text-primary text-lg">
										{pendingAction.product.quantity}
									</StyledText>
								</View>
								<View>
									<StyledText variant="regular" className="text-text-muted text-xs">
										Price
									</StyledText>
									<StyledText variant="semibold" className="text-text-primary text-lg">
										₱{pendingAction.product.price.toFixed(2)}
									</StyledText>
								</View>
							</View>
						</View>

						<View className="mb-6">
							<StyledText variant="medium" className="text-text-primary mb-2">
								Quantity
							</StyledText>
							<TextInput
								placeholder="Enter quantity"
								keyboardType="number-pad"
								value={quantityInput}
								onChangeText={setQuantityInput}
								className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-text-primary text-lg text-center"
							/>
						</View>

						<View className="flex-row gap-3">
							<TouchableOpacity
								onPress={closeAction}
								className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
							>
								<StyledText variant="medium" className="text-text-muted">
									Cancel
								</StyledText>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={submitAction}
								className={`flex-1 rounded-xl py-3 items-center ${pendingAction.type === 'restock' ? 'bg-primary' : 'bg-secondary'}`}
							>
								<StyledText variant="semibold" className="text-white">
									Confirm
								</StyledText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
}