import StyledText from '@/components/elements/StyledText';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryScreen() {
	const { id } = useLocalSearchParams();

	const router = useRouter();
	const categoryId = id ? Number(id) : NaN;

	const { useGetCategory } = useCategories();
	const { getAllProductsQuery } = useProducts();

	const categoryQuery = useGetCategory(categoryId);
	const productsQuery = getAllProductsQuery();

	const loading = categoryQuery.isLoading || productsQuery.isLoading;

	const category = categoryQuery.data;
	const allProducts = productsQuery.data || [];

	const productsInCategory = useMemo(() => {
		if (!category) return [];
		return allProducts.filter((p: any) => p.category === category.name);
	}, [allProducts, category]);

	const renderItem = ({ item }: { item: any }) => (
		<Pressable
			onPress={() => router.push(`/(edit-forms)/edit-product/${item.id}`)}
			className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm active:opacity-70"
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-1">
					<StyledText
						variant="semibold"
						className="text-text-primary text-base"
					>
						{item.name}
					</StyledText>
					<StyledText
						variant="regular"
						className="text-text-secondary text-sm"
					>
						SKU: {item.sku} • {item.quantity} in stock
					</StyledText>
				</View>

				<View className="ml-3 items-end">
					<StyledText variant="semibold" className="text-primary">
						${item.price?.toFixed?.(2) ?? item.price}
					</StyledText>
				</View>
			</View>
		</Pressable>
	);

	if (loading) {
		return (
			<View className="items-center justify-center py-10">
				<ActivityIndicator size="small" color="#7A1CAC" />
			</View>
		);
	}

	if (!category) {
		return (
			<StyledText
				variant="extrabold"
				className="text-text-secondary text-center py-6"
			>
				Category not found.
			</StyledText>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View className="p-4">
				<View className="flex-row items-center justify-between mb-4">
					<View>
						<StyledText
							variant="extrabold"
							className="text-primary text-2xl"
						>
							{category.name}
						</StyledText>
						<StyledText className="text-text-secondary text-sm">
							{productsInCategory.length}{' '}
							{productsInCategory.length === 1
								? 'product'
								: 'products'}
						</StyledText>
					</View>
					<Pressable
						onPress={() => router.push('/(edit-forms)/add-product')}
						className="bg-secondary rounded-xl px-3 py-2 flex-row items-center gap-2"
						hitSlop={10}
					>
						<FontAwesome name="plus" size={14} color="#fff" />
						<StyledText
							variant="semibold"
							className="text-white text-sm"
						>
							Add
						</StyledText>
					</Pressable>
				</View>

				{productsInCategory.length === 0 ? (
					<View className="items-center py-10">
						<StyledText className="text-text-secondary">
							No products in this category yet.
						</StyledText>
					</View>
				) : (
					<FlatList
						data={productsInCategory}
						keyExtractor={(item) => String(item.id)}
						renderItem={renderItem}
						contentContainerStyle={{
							paddingBottom: 40,
						}}
					/>
				)}
			</View>
		</SafeAreaView>
	);
}
