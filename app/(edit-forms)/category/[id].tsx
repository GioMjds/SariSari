import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import {
  useCategoryDetailsState,
  CategoryHeroCard,
  CategoryProductsSection,
  CategoryStickyBar,
} from '@/components/inventory/category-details';

export default function CategoryScreen() {
  const {
    category,
    loading,
    productsInCategory,
    totalValue,
    totalUnits,
    lowStockCount,
    stampTone,
    stampLabel,
    stampRotate,
    handleBack,
    handleAddProduct,
    handleOpenProduct,
  } = useCategoryDetailsState();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-12 h-12 rounded-full border-2 border-ink-200"
            style={{ borderTopColor: '#E85A1F' }}
          />
          <StyledText variant="medium" className="text-ink-500 mt-4 label-caps">
            Loading category…
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={20}
            className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 border border-ink-100 items-center">
            <FontAwesome name="folder-open" size={42} color="#C77B0E" />
            <StyledText
              variant="black"
              className="text-ink-900 text-xl mt-3 text-center"
            >
              Category not found
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm mt-1 text-center"
            >
              It may have been deleted on another device.
            </StyledText>
            <Pressable
              onPress={() => handleBack()}
              className="mt-5 bg-persimmon-500 rounded-pill px-6 py-3 shadow-persimmon-glow"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Back to Inventory
              </StyledText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Slim top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={handleBack}
          hitSlop={20}
          accessibilityRole="button"
          accessibilityLabel="Back to Inventory"
          className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <CategoryHeroCard
          category={category}
          productsInCategory={productsInCategory}
          totalValue={totalValue}
          totalUnits={totalUnits}
          lowStockCount={lowStockCount}
          stampLabel={stampLabel}
          stampTone={stampTone}
          stampRotate={stampRotate}
        />

        <CategoryProductsSection
          productsInCategory={productsInCategory}
          totalUnits={totalUnits}
          onAddProduct={handleAddProduct}
          onOpenProduct={handleOpenProduct}
        />
      </ScrollView>

      <CategoryStickyBar
        totalValue={totalValue}
        onAddProduct={handleAddProduct}
      />
    </SafeAreaView>
  );
}
