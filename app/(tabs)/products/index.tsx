import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { CategoriesTab, ProductsTab } from '@/components/products';

type TabType = 'products' | 'categories';

export default function Products() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const params = useLocalSearchParams<{ filterCategory?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Cinnamon-styled Tab Switcher */}
      <View className="bg-cinnamon-500 px-5 pt-3 pb-2">
        <View className="flex-row bg-cinnamon-700/50 rounded-xl p-1 border border-cinnamon-600">
          <Pressable
            onPress={() => setActiveTab('products')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'products' ? 'bg-persimmon-500' : ''
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-sm ${
                activeTab === 'products' ? 'text-white' : 'text-paper-300'
              }`}
            >
              Products
            </StyledText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'categories' ? 'bg-persimmon-500' : ''
            }`}
          >
            <StyledText
              variant="semibold"
              className={`text-sm ${
                activeTab === 'categories' ? 'text-white' : 'text-paper-300'
              }`}
            >
              Categories
            </StyledText>
          </Pressable>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'products' ? (
        <ProductsTab filterCategory={params.filterCategory} />
      ) : (
        <CategoriesTab />
      )}
    </SafeAreaView>
  );
}
