import StyledText from '@/components/elements/StyledText';
import { Product, deleteProduct, getAllProducts, initProductsTable } from '@/db/products';
import { FontAwesome } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortOption = 'name' | 'price' | 'stock' | 'sku';
type SortDirection = 'asc' | 'desc';

const CATEGORIES = ['All', 'Snacks', 'Drinks', 'Household', 'Frozen', 'Cigarettes', 'Other'];
const LOW_STOCK_THRESHOLD = 5;

export default function Products() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [sortBy, setSortBy] = useState<SortOption>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [showSortModal, setShowSortModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [showContextMenu, setShowContextMenu] = useState<number | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	const debounceRef = useRef<number | null>(null);

	// Initialize database
	useEffect(() => {
		initProductsTable();
	}, []);

	// Debounce search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => setDebouncedSearch(search.trim()), 300) as unknown as number;
	}, [search]);

	// Fetch products
	const {
		data: products = [],
		isLoading,
		refetch,
	} = useQuery<Product[]>({
		queryKey: ['products'],
		queryFn: getAllProducts,
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: deleteProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			setShowDeleteModal(false);
			setSelectedProduct(null);
		},
	});

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let result = [...products];

		// Search filter
		if (debouncedSearch) {
			const term = debouncedSearch.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(term) ||
					p.sku.toLowerCase().includes(term)
			);
		}

		// Category filter (future enhancement - requires category field in DB)
		// if (selectedCategory !== 'All') {
		//   result = result.filter((p) => p.category === selectedCategory);
		// }

		// Sort
		result.sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'price':
					comparison = a.price - b.price;
					break;
				case 'stock':
					comparison = a.quantity - b.quantity;
					break;
				case 'sku':
					comparison = a.sku.localeCompare(b.sku);
					break;
			}
			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return result;
	}, [products, debouncedSearch, selectedCategory, sortBy, sortDirection]);

	// Stats
	const stats = useMemo(() => {
		return {
			total: products.length,
			lowStock: products.filter((p) => p.quantity < LOW_STOCK_THRESHOLD).length,
			totalValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
		};
	}, [products]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const handleSort = (option: SortOption) => {
		if (sortBy === option) {
			setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortBy(option);
			setSortDirection('asc');
		}
		setShowSortModal(false);
	};

	const handleDelete = useCallback((product: Product) => {
		setSelectedProduct(product);
		setShowDeleteModal(true);
		setShowContextMenu(null);
	}, []);

	const confirmDelete = () => {
		if (selectedProduct) {
			deleteMutation.mutate(selectedProduct.id);
		}
	};

	const getStockColor = (quantity: number) => {
		if (quantity === 0) return 'text-red-600';
		if (quantity < LOW_STOCK_THRESHOLD) return 'text-yellow-600';
		return 'text-green-600';
	};

	const renderProduct = ({ item }: { item: Product }) => {
		const isMenuOpen = showContextMenu === item.id;

		return (
			<View className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm">
				<View className="flex-row justify-between items-start">
					<View className="flex-1 pr-3">
						<StyledText variant="semibold" className="text-text-primary text-base mb-1">
							{item.name}
						</StyledText>
						<StyledText variant="regular" className="text-text-secondary text-xs mb-2">
							SKU: {item.sku}
						</StyledText>
						<View className="flex-row items-center gap-4">
							<View>
								<StyledText variant="extrabold" className="text-primary text-lg">
									₱{item.price.toFixed(2)}
								</StyledText>
							</View>
							<View>
								<Text className={`${getStockColor(item.quantity)} font-stack-sans-medium text-sm`}>
									Stock: {item.quantity}
								</Text>
							</View>
						</View>
						{item.quantity < LOW_STOCK_THRESHOLD && item.quantity > 0 && (
							<View className="bg-yellow-100 px-2 py-1 rounded-md mt-2 self-start">
								<StyledText variant="medium" className="text-yellow-700 text-xs">
									⚠️ Low Stock
								</StyledText>
							</View>
						)}
						{item.quantity === 0 && (
							<View className="bg-red-100 px-2 py-1 rounded-md mt-2 self-start">
								<StyledText variant="medium" className="text-red-700 text-xs">
									❌ Out of Stock
								</StyledText>
							</View>
						)}
					</View>

					{/* Three-dot menu */}
					<View>
						<Pressable
							hitSlop={20}
							onPress={() => setShowContextMenu(isMenuOpen ? null : item.id)}
							className="p-2 active:opacity-50"
						>
							<FontAwesome name="ellipsis-v" size={18} color="#7A1CAC" />
						</Pressable>

						{isMenuOpen && (
							<View className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[150px] z-50">
								<Pressable
									onPress={() => {
										router.push(`/products/edit/${item.id}`);
										setShowContextMenu(null);
									}}
									hitSlop={20}
									className="flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-background"
								>
									<FontAwesome name="edit" size={16} color="#7A1CAC" />
									<StyledText variant="medium" className="text-text-primary ml-3 text-sm">
										Edit Product
									</StyledText>
								</Pressable>
								<Pressable
									onPress={() => {
										router.push('/inventory');
										setShowContextMenu(null);
									}}
									hitSlop={20}
									className="flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-background"
								>
									<FontAwesome name="history" size={16} color="#7A1CAC" />
									<StyledText variant="medium" className="text-text-primary ml-3 text-sm">
										View History
									</StyledText>
								</Pressable>
								<Pressable
									onPress={() => handleDelete(item)}
									hitSlop={20}
									className="flex-row items-center px-4 py-3 active:bg-red-50"
								>
									<FontAwesome name="trash" size={16} color="#dc2626" />
									<StyledText variant="medium" className="text-red-600 ml-3 text-sm">
										Delete
									</StyledText>
								</Pressable>
							</View>
						)}
					</View>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Header */}
			<View className="bg-primary px-4 py-4 pb-6">
				<View className="flex-row justify-between items-center">
					<StyledText variant="extrabold" className="text-white text-3xl">
						Your Products
					</StyledText>
					<View className="flex-row gap-2">
						<Pressable
							onPress={() => setShowSortModal(true)}
							className="bg-secondary/30 rounded-xl px-4 py-2 active:opacity-70"
						>
							<FontAwesome name="sort" size={18} color="#fff" />
						</Pressable>
						<Pressable
							onPress={() => router.push('/products/add')}
							className="bg-accent rounded-xl px-4 py-2 flex-row items-center gap-2 active:opacity-70"
						>
							<FontAwesome name="plus" size={18} color="#fff" />
							<StyledText variant="semibold" className="text-white text-sm">
								Add Product
							</StyledText>
						</Pressable>
					</View>
				</View>

				{/* Stats Cards */}
				<View className="flex-row justify-between mt-4 gap-3">
					<View className="flex-1 bg-white/10 rounded-xl p-3">
						<StyledText variant="regular" className="text-white/70 text-xs mb-1">
							Total Products
						</StyledText>
						<StyledText variant="extrabold" className="text-white text-lg">
							{stats.total}
						</StyledText>
					</View>
					<View className="flex-1 bg-white/10 rounded-xl p-3">
						<StyledText variant="regular" className="text-white/70 text-xs mb-1">
							Low Stock
						</StyledText>
						<StyledText variant="extrabold" className="text-white text-lg">
							{stats.lowStock}
						</StyledText>
					</View>
					<View className="flex-1 bg-white/10 rounded-xl p-3">
						<StyledText variant="regular" className="text-white/70 text-xs mb-1">
							Total Value
						</StyledText>
						<StyledText variant="extrabold" className="text-white text-lg">
							₱{stats.totalValue.toFixed(0)}
						</StyledText>
					</View>
				</View>
			</View>

			{/* Search Bar */}
			<View className="px-4 py-3">
				<View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
					<FontAwesome name="search" size={16} color="#9ca3af" />
					<TextInput
						placeholder="Search by name or SKU..."
						value={search}
						onChangeText={setSearch}
						className="flex-1 ml-3 font-stack-sans text-base text-text-primary"
						placeholderTextColor="#9ca3af"
					/>
					{search.length > 0 && (
						<Pressable onPress={() => setSearch('')} className="p-1">
							<FontAwesome name="times-circle" size={16} color="#9ca3af" />
						</Pressable>
					)}
				</View>
			</View>

			{/* Products List */}
			{isLoading ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#7A1CAC" />
				</View>
			) : filteredProducts.length === 0 ? (
				<View className="flex-1 justify-center items-center px-8">
					<FontAwesome name="cube" size={64} color="#AD49E1" style={{ opacity: 0.3 }} />
					<StyledText variant="semibold" className="text-text-secondary text-lg mt-4 text-center">
						{search ? 'No products found' : 'No products yet'}
					</StyledText>
					<StyledText variant="regular" className="text-text-muted text-sm mt-2 text-center">
						{search ? 'Try a different search term' : 'Start by adding your first product'}
					</StyledText>
					{!search && (
						<Pressable
							onPress={() => router.push('/products/add')}
							className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-70"
						>
							<StyledText variant="semibold" className="text-white text-base">
								Add Product
							</StyledText>
						</Pressable>
					)}
				</View>
			) : (
				<FlatList
					data={filteredProducts}
					renderItem={renderProduct}
					keyExtractor={(item) => item.id.toString()}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7A1CAC" />}
				/>
			)}

			{/* Sort Modal */}
			<Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
				<Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setShowSortModal(false)}>
					<Pressable className="bg-white rounded-t-3xl p-6" onPress={(e) => e.stopPropagation()}>
						<StyledText variant="extrabold" className="text-text-primary text-xl mb-4">
							Sort By
						</StyledText>
						{[
							{ key: 'name' as SortOption, label: 'Name', icon: 'font' },
							{ key: 'price' as SortOption, label: 'Price', icon: 'money' },
							{ key: 'stock' as SortOption, label: 'Stock Level', icon: 'cubes' },
							{ key: 'sku' as SortOption, label: 'SKU', icon: 'barcode' },
						].map((option) => (
							<Pressable
								key={option.key}
								onPress={() => handleSort(option.key)}
								className="flex-row items-center justify-between py-4 border-b border-gray-100 active:bg-background"
							>
								<View className="flex-row items-center">
									<FontAwesome name={option.icon as any} size={18} color="#7A1CAC" />
									<StyledText variant="medium" className="text-text-primary ml-4 text-base">
										{option.label}
									</StyledText>
								</View>
								{sortBy === option.key && (
									<FontAwesome
										name={sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'}
										size={18}
										color="#7A1CAC"
									/>
								)}
							</Pressable>
						))}
						<Pressable
							onPress={() => setShowSortModal(false)}
							className="bg-gray-200 rounded-xl py-3 mt-4 active:opacity-70"
						>
							<StyledText variant="semibold" className="text-text-primary text-center text-base">
								Close
							</StyledText>
						</Pressable>
					</Pressable>
				</Pressable>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				visible={showDeleteModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDeleteModal(false)}
			>
				<View className="flex-1 bg-black/40 justify-center items-center px-6">
					<View className="bg-white rounded-2xl p-6 w-full max-w-sm">
						<StyledText variant="extrabold" className="text-text-primary text-xl mb-2">
							Delete Product?
						</StyledText>
						<StyledText variant="regular" className="text-text-secondary text-sm mb-4">
							Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
						</StyledText>
						<View className="flex-row gap-3">
							<Pressable
								onPress={() => setShowDeleteModal(false)}
								className="flex-1 bg-gray-200 rounded-xl py-3 active:opacity-70"
							>
								<StyledText variant="semibold" className="text-text-primary text-center text-base">
									Cancel
								</StyledText>
							</Pressable>
							<Pressable
								onPress={confirmDelete}
								className="flex-1 bg-red-600 rounded-xl py-3 active:opacity-70"
								disabled={deleteMutation.isPending}
							>
								<StyledText variant="semibold" className="text-white text-center text-base">
									{deleteMutation.isPending ? 'Deleting...' : 'Delete'}
								</StyledText>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>

			{/* Overlay to close context menu */}
			{showContextMenu !== null && (
				<Pressable
					onPress={() => setShowContextMenu(null)}
					className="absolute inset-0"
					style={{ backgroundColor: 'transparent' }}
				/>
			)}
		</SafeAreaView>
	);
}