import { withProf } from '@/utils/perf';
import { useCallback, useRef } from 'react';
import { View, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  CategoryActionSheet,
  CategoryFormSheet,
} from '@/components/inventory/category';
import {
  useCategoryDetailsState,
  CategoryHeroCard,
  CategoryAttentionCard,
  CategoryBestSellers,
  CategoryProductsSection,
  CategoryStickyBar,
  CategoryDetailsSkeleton,
} from '@/components/inventory/category-details';
import type { CategoryFilter } from '@/components/inventory/category-details/categoryInsights';

// Clears the sticky value bar so the last row is never hidden behind it.
const SCROLL_CONTENT_STYLE = { paddingTop: 12, paddingBottom: 150 } as const;

function TopBar({
  onBack,
  onMore,
}: {
  onBack: () => void;
  onMore?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to Inventory"
        className="w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 active:bg-paper-100"
      >
        <Ionicons name="arrow-back" size={18} color="#0E0C0A" />
      </Pressable>
      <StyledText variant="extrabold" className="text-ink-500 text-sm">
        Category
      </StyledText>
      {onMore ? (
        <Pressable
          onPress={onMore}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Category actions"
          accessibilityHint="Rename or delete this category"
          className="w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 active:bg-paper-100"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#0E0C0A" />
        </Pressable>
      ) : (
        <View className="w-11 h-11" />
      )}
    </View>
  );
}

function CategoryScreen() {
  const state = useCategoryDetailsState();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const productsY = useRef(0);

  const { handleFilter } = state;
  const showIssue = useCallback(
    (filter: CategoryFilter) => {
      handleFilter(filter);
      scrollRef.current?.scrollTo({
        y: Math.max(productsY.current - 12, 0),
        animated: !reducedMotion,
      });
    },
    [handleFilter, reducedMotion],
  );

  if (state.loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <TopBar onBack={state.handleBack} />
        <CategoryDetailsSkeleton />
      </SafeAreaView>
    );
  }

  if (!state.category) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <TopBar onBack={state.handleBack} />
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-paper-50 rounded-2xl p-6 border border-ink-100 items-center">
            <SariMascot state="empty" size={120} />
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
              It may have been renamed or deleted.
            </StyledText>
            <Pressable
              onPress={state.handleBack}
              accessibilityRole="button"
              className="mt-5 bg-persimmon-500 rounded-pill px-6 min-h-[48px] justify-center active:bg-persimmon-700"
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

  const { category, summary } = state;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopBar onBack={state.handleBack} onMore={state.openActions} />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={state.handleRefresh}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        <MotiView
          from={{
            opacity: reducedMotion ? 1 : 0,
            translateY: reducedMotion ? 0 : 10,
          }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: reducedMotion ? 0 : 220 }}
        >
          <CategoryHeroCard
            category={category}
            summary={summary}
            catalogShare={state.catalogShare}
            salesLoading={state.salesLoading}
          />
          <CategoryAttentionCard summary={summary} onSelect={showIssue} />
          <CategoryBestSellers
            sellers={state.bestSellers}
            hasProducts={summary.productCount > 0 && state.salesReady}
            onOpenProduct={state.handleOpenProduct}
          />
        </MotiView>

        <View onLayout={(e) => (productsY.current = e.nativeEvent.layout.y)}>
          <CategoryProductsSection
            rows={state.visibleRows}
            summary={summary}
            filter={state.filter}
            sort={state.sort}
            onFilter={state.handleFilter}
            onSort={state.handleSort}
            onAddProduct={state.handleAddProduct}
            onOpenProduct={state.handleOpenProduct}
            onOpenInProducts={state.handleOpenInProducts}
          />
        </View>

        {summary.productCount > 0 && (
          <View className="flex-row items-center justify-center mt-6 px-6">
            <FontAwesome name="hand-pointer-o" size={12} color="#7A7165" />
            <StyledText
              variant="regular"
              className="text-ink-500 text-[12px] ml-2 text-center"
            >
              Tap a product to restock, adjust, or edit it.
            </StyledText>
          </View>
        )}
      </ScrollView>

      <CategoryStickyBar
        totalValue={summary.stockValue}
        productCount={summary.productCount}
        onAddProduct={state.handleAddProduct}
      />

      <CategoryActionSheet
        visible={state.sheet === 'actions'}
        category={state.sheetCategory}
        totalProducts={state.catalogCount}
        deleting={state.deleting}
        onClose={state.closeSheet}
        onViewProducts={state.handleOpenInProducts}
        onRename={state.openRename}
        onDelete={state.handleDelete}
      />

      <CategoryFormSheet
        visible={state.sheet === 'rename'}
        mode="edit"
        initialName={category.name}
        takenNames={state.takenNames}
        saving={state.renaming}
        onSubmit={state.handleRename}
        onClose={state.closeSheet}
      />
    </SafeAreaView>
  );
}

export default withProf(CategoryScreen, 'category/[id]');
