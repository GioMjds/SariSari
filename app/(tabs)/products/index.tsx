import StyledText from '@/components/elements/StyledText';
import CategoriesTab from '@/components/products/CategoriesTab';
import ProductsTab from '@/components/products/ProductsTab';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'products' | 'categories';

export default function Products() {
	const [activeTab, setActiveTab] = useState<TabType>('products');
	const [showSortModal, setShowSortModal] = useState<boolean>(false);

	const params = useLocalSearchParams<{ filterCategory?: string }>();

	const router = useRouter();

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Header */}
			<View className="p-4 pb-2">
				<View className="flex-row justify-between items-center mb-3">
					<StyledText variant="extrabold" className="text-primary text-3xl">
						Your Products
					</StyledText>
					<View className="flex-row gap-2">
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

				{/* Tab Switcher */}
				<View className="flex-row bg-white rounded-xl p-3 shadow-sm">
					<Pressable
						onPress={() => setActiveTab('products')}
						className={`flex-1 py-3 rounded-lg items-center ${
							activeTab === 'products' ? 'bg-accent' : ''
						}`}
					>
						<StyledText
							variant="semibold"
							className={`text-sm ${
								activeTab === 'products'
									? 'text-white'
									: 'text-text-secondary'
							}`}
						>
							Products
						</StyledText>
					</Pressable>
					<Pressable
						onPress={() => setActiveTab('categories')}
						className={`flex-1 py-3 rounded-lg items-center ${
							activeTab === 'categories' ? 'bg-accent' : ''
						}`}
					>
						<StyledText
							variant="semibold"
							className={`text-sm ${
								activeTab === 'categories'
									? 'text-white'
									: 'text-text-secondary'
							}`}
						>
							Categories
						</StyledText>
					</Pressable>
				</View>
			</View>

			{/* Tab Content */}
			{activeTab === 'products' ? (
				<ProductsTab 
					filterCategory={params.filterCategory}
					showSortModal={showSortModal}
					setShowSortModal={setShowSortModal}
				/>
			) : (
				<CategoriesTab />
			)}
		</SafeAreaView>
	);
}
