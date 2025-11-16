import StyledText from '@/components/elements/StyledText';
import { initInventoryTable, insertInventoryTransaction } from '@/db/inventory';
import { Product, getAllProducts, initProductsTable } from '@/db/products';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
	Pressable,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

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
	const [showToast, setShowToast] = useState<string | null>(null);

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
		) as unknown as number;
	}, [search]);

	// Query products
	const {
		data: products,
		isLoading,
		isRefetching,
	} = useQuery<Product[]>({
		queryKey: ['products'],
		queryFn: getAllProducts,
	});

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
			setShowToast('Stock updated');
			setTimeout(() => setShowToast(null), 2000);
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
			setShowToast('Enter valid quantity');
			setTimeout(() => setShowToast(null), 1800);
			return;
		}
		// Prevent selling more than current quantity
		if (
			pendingAction.type === 'sale' &&
			qty > pendingAction.product.quantity
		) {
			setShowToast('Not enough stock');
			setTimeout(() => setShowToast(null), 1800);
			return;
		}
		transactionMutation.mutate({
			product: pendingAction.product,
			type: pendingAction.type,
			quantity: qty,
		});
		closeAction();
	}, [pendingAction, quantityInput, transactionMutation, closeAction]);

	const stockColorClass = (q: number) => {
		if (q < LOW_STOCK_THRESHOLD) return 'text-red-600';
		if (q < LOW_STOCK_THRESHOLD * 3) return 'text-yellow-600';
		return 'text-green-600';
	};

	const renderItem = ({ item }: { item: Product }) => (
		<View className="px-4 py-3 border-b border-gray-200 gap-1">
			<StyledText variant="semibold" style={{}}>
				{item.name}
			</StyledText>
			<StyledText variant="regular" style={{ fontSize: 12 }}>
				SKU: {item.sku}
			</StyledText>
			<View className="flex-row items-center justify-between mt-1">
				<StyledText variant="medium" style={{}}>
					<Text className={stockColorClass(item.quantity)}>
						Qty: {item.quantity}
					</Text>
					{`   ₱${item.price.toFixed(2)}`}
				</StyledText>
				<View className="flex-row gap-2">
					<Pressable
						onPress={() => openAction(item, 'restock')}
						className="px-3 py-1 rounded-md bg-primary"
					>
						<Text className="text-white text-xs">+ Restock</Text>
					</Pressable>
					<Pressable
						onPress={() => openAction(item, 'sale')}
						className="px-3 py-1 rounded-md bg-secondary"
					>
						<Text className="text-white text-xs">- Sale</Text>
					</Pressable>
				</View>
			</View>
			{item.quantity < LOW_STOCK_THRESHOLD && (
				<Text className="text-red-500 text-[11px] mt-1">Low stock</Text>
			)}
		</View>
	);

	// Summary footer stats
	const summary = useMemo(() => {
		if (!products) return { total: 0, low: 0, totalQty: 0 };
		return {
			total: products.length,
			low: products.filter((p) => p.quantity < LOW_STOCK_THRESHOLD)
				.length,
			totalQty: products.reduce((acc, p) => acc + p.quantity, 0),
		};
	}, [products]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			{/* Header */}
			<View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
				<StyledText variant="semibold" className='text-3xl'>
					My Inventory
				</StyledText>
			</View>

			{/* Search & Filters */}
			<View className="px-4 mb-2 gap-2">
				<TextInput
					placeholder="Search product name or SKU"
					value={search}
					onChangeText={setSearch}
					placeholderTextColor="#A0A0A0"
					className="border border-gray-300 rounded-md px-3 py-2 bg-white"
				/>
				<View className="flex-row items-center justify-between">
					<Pressable
						onPress={() => setShowLowOnly((prev) => !prev)}
						className={`px-3 py-2 rounded-md ${showLowOnly ? 'bg-red-500' : 'bg-gray-200'}`}
					>
						<Text
							className={`${showLowOnly ? 'text-white' : 'text-gray-700'} text-xs`}
						>
							Low Stock Only
						</Text>
					</Pressable>
					<Text className="text-[11px] text-gray-500">
						{filtered.length} shown
					</Text>
				</View>
			</View>

			{/* Inventory List */}
			{isLoading || isRefetching ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator />
				</View>
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(item) => item.id.toString()}
					renderItem={renderItem}
					contentContainerStyle={{ paddingBottom: 90 }}
					ListEmptyComponent={
						<Text className="text-center text-gray-500 mt-8">
							No products found.
						</Text>
					}
				/>
			)}

			{/* Action Modal (inline) */}
			{pendingAction && (
				<View className="absolute inset-0 bg-black/40 items-center justify-center px-6">
					<View className="w-full rounded-lg bg-white p-4 gap-3">
						<StyledText variant="semibold" style={{ fontSize: 16 }}>
							{pendingAction.type === 'restock'
								? 'Add Restock'
								: 'Record Sale'}
						</StyledText>
						<StyledText variant="regular" style={{ fontSize: 12 }}>
							{pendingAction.product.name} (Current:{' '}
							{pendingAction.product.quantity})
						</StyledText>
						<TextInput
							placeholder="Quantity"
							keyboardType="number-pad"
							value={quantityInput}
							onChangeText={setQuantityInput}
							className="border border-gray-300 rounded-md px-3 py-2"
						/>
						<View className="flex-row justify-end gap-3 mt-2">
							<Pressable
								onPress={closeAction}
								className="px-4 py-2 rounded-md bg-gray-200"
							>
								<Text className="text-gray-700 text-xs">
									Cancel
								</Text>
							</Pressable>
							<Pressable
								onPress={submitAction}
								className={`px-4 py-2 rounded-md ${pendingAction.type === 'restock' ? 'bg-primary' : 'bg-secondary'}`}
							>
								<Text className="text-white text-xs">Save</Text>
							</Pressable>
						</View>
					</View>
				</View>
			)}

			{/* Toast (temporary) */}
			{showToast && (
				<View className="absolute bottom-16 left-0 right-0 items-center">
					<View className="bg-primary px-4 py-2 rounded-full shadow-md">
						<Text className="text-white text-xs">{showToast}</Text>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
}
