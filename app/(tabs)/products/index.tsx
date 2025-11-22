import StyledText from '@/components/elements/StyledText';
import ProductItem from '@/components/products/ProductItem';
import Pagination from '@/components/ui/Pagination';
import { SortOption, sortOption } from '@/constants/sort-option';
import { ITEMS_PER_PAGE, LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/products.types';
import { getStockColor } from '@/utils/formatters';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	RefreshControl,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortDirection = 'asc' | 'desc';

export default function Products() {
	const [search, setSearch] = useState<string>('');
	const [debouncedSearch, setDebouncedSearch] = useState<string>('');
	const [sortBy, setSortBy] = useState<SortOption>('name');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [showSortModal, setShowSortModal] = useState<boolean>(false);
	const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [showContextMenu, setShowContextMenu] = useState<number | null>(null);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState<number>(1);

	const router = useRouter();

	const { getAllProductsQuery, deleteProductMutation } = useProducts();

	const debounceRef = useRef<number | null>(null);

	// Debounce search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(
			() => setDebouncedSearch(search.trim()),
			300
		) as unknown as number;
	}, [search]);

	// Reset to first page when search or sort changes
	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearch, sortBy, sortDirection]);

	// Fetch products
	const {
		data: products = [],
		isLoading,
		refetch,
	} = getAllProductsQuery();

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let result = [...products];

		if (debouncedSearch) {
			const term = debouncedSearch.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(term) ||
					p.sku.toLowerCase().includes(term)
			);
		}

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
	}, [products, debouncedSearch, sortBy, sortDirection]);

	// Paginated products
	const paginatedProducts = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		return filteredProducts.slice(startIndex, endIndex);
	}, [filteredProducts, currentPage]);

	const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

	// Stats
	const stats = useMemo(() => {
		return {
			total: products.length,
			lowStock: products.filter((p) => p.quantity < LOW_STOCK_THRESHOLD).length,
			totalValue: products.reduce(
				(sum, p) => sum + p.price * p.quantity,
				0
			),
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
			deleteProductMutation.mutate(selectedProduct.id);
			setShowDeleteModal(false);
			setSelectedProduct(null);
		}
	};

	if (isLoading) {
		<View className="flex-1 justify-center items-center">
			<ActivityIndicator size="large" color="#7A1CAC" />
		</View>;
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Header */}
			<View className="px-4 py-4 pb-2">
				<View className="flex-row justify-between items-center">
					<StyledText
						variant="extrabold"
						className="text-primary text-3xl"
					>
						Your Products
					</StyledText>
					<View className="flex-row gap-2">
						<TouchableOpacity
							onPress={() => setShowSortModal(true)}
							hitSlop={20}
							activeOpacity={0.2}
							className="bg-secondary rounded-xl px-4 py-2"
						>
							<FontAwesome name="sort" size={18} color="#fff" />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => router.push('/(edit-forms)/add-product')}
							hitSlop={20}
							activeOpacity={0.2}
							className="bg-secondary rounded-xl px-4 py-2 flex-row items-center gap-2"
						>
							<FontAwesome name="plus" size={18} color="#fff" />
							<StyledText
								variant="semibold"
								className="text-white text-sm"
							>
								Add Product
							</StyledText>
						</TouchableOpacity>
					</View>
				</View>

				{/* Search Bar */}
				<View className="py-3">
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
							<Pressable
								onPress={() => setSearch('')}
								className="p-1"
							>
								<FontAwesome
									name="times-circle"
									size={16}
									color="#9ca3af"
								/>
							</Pressable>
						)}
					</View>
				</View>

				{/* Stats Cards */}
				<View className="flex-row justify-between mt-2 gap-3">
					<View className="flex-1 bg-white rounded-xl p-3">
						<StyledText
							variant="regular"
							className="text-secondary text-sm mb-1"
						>
							Total Products
						</StyledText>
						<StyledText
							variant="extrabold"
							className="text-secondary text-xl"
						>
							{stats.total}
						</StyledText>
					</View>
					<View className="flex-1 bg-white rounded-xl p-3">
						<StyledText
							variant="regular"
							className="text-secondary text-sm mb-1"
						>
							Low Stock
						</StyledText>
						<StyledText
							variant="extrabold"
							className="text-secondary text-xl"
						>
							{stats.lowStock}
						</StyledText>
					</View>
					<View className="flex-1 bg-white rounded-xl p-3">
						<StyledText
							variant="regular"
							className="text-secondary text-sm mb-1"
						>
							Total Value
						</StyledText>
						<StyledText
							variant="extrabold"
							className="text-secondary text-xl"
						>
							₱
							{stats.totalValue.toLocaleString('en-PH', {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</StyledText>
					</View>
				</View>
			</View>

			{/* Products List */}
			<FlatList
				data={paginatedProducts}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<ProductItem
						item={item}
						onEdit={(id) => router.push(`/products/edit/${id}`)}
						onDelete={handleDelete}
						getStockColor={getStockColor}
						lowStockThreshold={LOW_STOCK_THRESHOLD}
					/>
				)}
				contentContainerStyle={{
					paddingTop: 8,
					paddingBottom: 100,
				}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#7A1CAC"
					/>
				}
				ListEmptyComponent={
					<View className="flex-1 justify-center items-center px-8 mt-56">
						<FontAwesome
							name="cube"
							size={64}
							color="#AD49E1"
							style={{ opacity: 0.3 }}
						/>
						<StyledText
							variant="semibold"
							className="text-text-secondary text-lg mt-4 text-center"
						>
							{search ? 'No products found' : 'No products yet'}
						</StyledText>
						<StyledText
							variant="regular"
							className="text-text-muted text-sm mt-2 text-center"
						>
							{search
								? 'Try a different search term'
								: 'Start by adding your first product'}
						</StyledText>
						{!search && (
							<TouchableOpacity
								hitSlop={20}
								activeOpacity={0.2}
								onPress={() => router.push('/(edit-forms)/add-product')}
								className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-70"
							>
								<StyledText
									variant="semibold"
									className="text-white text-base"
								>
									Add Product
								</StyledText>
							</TouchableOpacity>
						)}
					</View>
				}
			/>

			{/* Pagination */}
			{filteredProducts.length > 0 && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
					totalItems={filteredProducts.length}
					itemsPerPage={ITEMS_PER_PAGE}
				/>
			)}

			{/* Sort Modal */}
			<Modal
				visible={showSortModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowSortModal(false)}
			>
				<Pressable
					className="flex-1 bg-black/60 justify-end"
					onPress={() => setShowSortModal(false)}
				>
					<Pressable
						className="bg-white rounded-t-3xl p-6"
						onPress={(e) => e.stopPropagation()}
					>
						<StyledText
							variant="extrabold"
							className="text-text-primary text-xl mb-4"
						>
							Sort By
						</StyledText>
						{sortOption.map((option) => (
							<TouchableOpacity
								key={option.key}
								hitSlop={20}
								onPress={() => handleSort(option.key)}
								activeOpacity={0.2}
								className="flex-row items-center justify-between py-4 border-b border-gray-100"
							>
								<View className="flex-row items-center">
									<FontAwesome
										name={option.icon as any}
										size={18}
										color="#7A1CAC"
									/>
									<StyledText
										variant="medium"
										className="text-text-primary ml-4 text-base"
									>
										{option.label}
									</StyledText>
								</View>
								{sortBy === option.key && (
									<FontAwesome
										name={
											sortDirection === 'asc'
												? 'sort-asc'
												: 'sort-desc'
										}
										size={18}
										color="#7A1CAC"
									/>
								)}
							</TouchableOpacity>
						))}
						<Pressable
							onPress={() => setShowSortModal(false)}
							className="bg-gray-200 rounded-xl py-3 mt-4 active:opacity-70"
						>
							<StyledText
								variant="semibold"
								className="text-text-primary text-center text-base"
							>
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
						<View className="items-center mb-4">
							<View className="bg-red-100 rounded-full p-4 mb-3">
								<FontAwesome
									name="exclamation-triangle"
									size={32}
									color="#dc2626"
								/>
							</View>
							<StyledText
								variant="extrabold"
								className="text-text-primary text-xl mb-2 text-center"
							>
								Delete Product?
							</StyledText>
							<StyledText
								variant="regular"
								className="text-text-secondary text-sm text-center"
							>
								Are you sure you want to delete "
								{selectedProduct?.name}
								"?
							</StyledText>
							<StyledText
								variant="semibold"
								className="text-red-600 text-sm mt-2 text-center"
							>
								This action cannot be undone.
							</StyledText>
						</View>
						<View className="gap-3">
							<Pressable
								onPress={confirmDelete}
								disabled={deleteProductMutation.isPending}
								className="bg-red-600 rounded-xl py-3 active:opacity-70"
							>
								{deleteProductMutation.isPending ? (
									<ActivityIndicator color="#fff" />
								) : (
									<StyledText
										variant="extrabold"
										className="text-white text-center text-base"
									>
										Yes, Delete Product
									</StyledText>
								)}
							</Pressable>
							<Pressable
								onPress={() => setShowDeleteModal(false)}
								className="bg-gray-200 rounded-xl py-3 active:opacity-70"
							>
								<StyledText
									variant="semibold"
									className="text-text-primary text-center text-base"
								>
									Cancel
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
					style={{ backgroundColor: 'transparent', zIndex: 50 }}
				/>
			)}
		</SafeAreaView>
	);
}
