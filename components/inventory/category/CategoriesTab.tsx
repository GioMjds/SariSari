import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { RefreshableFlatList } from '@/components/ui';
import { useTabBarBottomOffset } from '@/components/layout';
import { SariMascot } from '@/components/mascot';
import { useCategories } from '@/hooks';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CategoryWithCount } from '@/types';
import { CategoryActionSheet } from './CategoryActionSheet';
import { CATEGORY_TINTS, CategoryCard } from './CategoryCard';
import { CategoryFormSheet } from './CategoryFormSheet';
import { CategoriesSkeleton } from './CategoriesSkeleton';

type SheetMode = 'actions' | 'form' | null;

// Slightly longer than the Sheet exit so two native modals never present at once.
const SHEET_SWAP_MS = 200;
const MIX_SEGMENTS = 4;

function CategoriesTabComponent() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<SheetMode>(null);
  // Kept after close so the form title does not flip while it slides out.
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selected, setSelected] = useState<CategoryWithCount | null>(null);

  const {
    getCategoriesWithCountQuery,
    insertCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  } = useCategories();
  const { data: categories = [], isLoading, refetch } = getCategoriesWithCountQuery;

  const { maxCount, totalProducts } = useMemo(
    () => ({
      maxCount: Math.max(0, ...categories.map((c) => c.product_count)),
      totalProducts: categories.reduce((sum, c) => sum + c.product_count, 0),
    }),
    [categories],
  );

  const takenNames = useMemo(
    () =>
      categories
        .filter((c) => formMode !== 'edit' || c.id !== selected?.id)
        .map((c) => c.name.trim().toLowerCase()),
    [categories, formMode, selected?.id],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const closeSheet = useCallback(() => setMode(null), []);
  const openRename = () => {
    setMode(null);
    setFormMode('edit');
    setTimeout(() => setMode('form'), SHEET_SWAP_MS);
  };

  const openAdd = useCallback(() => {
    setFormMode('add');
    setMode('form');
  }, []);
  const openActions = useCallback((category: CategoryWithCount) => {
    setSelected(category);
    setMode('actions');
  }, []);
  const openCategory = useCallback(
    (category: CategoryWithCount) =>
      router.push(`/(edit-forms)/category/${category.id}` as Href),
    [router],
  );

  const handleViewProducts = (category: CategoryWithCount) => {
    setMode(null);
    openCategory(category);
  };

  const handleDelete = (category: CategoryWithCount) =>
    deleteCategoryMutation.mutate(category.id, { onSuccess: closeSheet });

  const handleSubmit = (name: string) => {
    if (formMode === 'edit' && selected) {
      updateCategoryMutation.mutate(
        { id: selected.id, name },
        { onSuccess: closeSheet },
      );
    } else {
      insertCategoryMutation.mutate({ name }, { onSuccess: closeSheet });
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: CategoryWithCount; index: number }) => (
      <MotiView
        from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: reducedMotion ? 0 : 240,
          delay: reducedMotion ? 0 : Math.min(index, 8) * 30,
        }}
      >
        <CategoryCard
          category={item}
          maxCount={maxCount}
          onPress={openCategory}
          onMore={openActions}
        />
      </MotiView>
    ),
    [reducedMotion, maxCount, openCategory, openActions],
  );

  if (isLoading) return <CategoriesSkeleton />;

  return (
    <View className="flex-1">
      <RefreshableFlatList<CategoryWithCount>
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: tabBarBottomOffset + 88 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          categories.length > 0 ? (
            <ShelfSummary
              categories={categories}
              totalProducts={totalProducts}
              onAdd={openAdd}
            />
          ) : null
        }
        ListEmptyComponent={<CategoriesEmpty onAdd={openAdd} />}
      />

      <CategoryActionSheet
        visible={mode === 'actions'}
        category={selected}
        totalProducts={totalProducts}
        deleting={deleteCategoryMutation.isPending}
        onClose={closeSheet}
        onViewProducts={handleViewProducts}
        onRename={openRename}
        onDelete={handleDelete}
      />

      <CategoryFormSheet
        visible={mode === 'form'}
        mode={formMode}
        initialName={formMode === 'edit' ? (selected?.name ?? '') : ''}
        takenNames={takenNames}
        saving={insertCategoryMutation.isPending || updateCategoryMutation.isPending}
        onSubmit={handleSubmit}
        onClose={closeSheet}
      />
    </View>
  );
}

interface ShelfSummaryProps {
  categories: CategoryWithCount[];
  totalProducts: number;
  onAdd: () => void;
}

/** Header card: shelf count, product total and a stacked bar of the biggest shelves. */
const ShelfSummary = memo(function ShelfSummary({
  categories,
  totalProducts,
  onAdd,
}: ShelfSummaryProps) {
  const mix = useMemo(() => {
    const sorted = categories
      .filter((c) => c.product_count > 0)
      .sort((a, b) => b.product_count - a.product_count);
    const top = sorted.slice(0, MIX_SEGMENTS).map((c) => ({
      key: String(c.id),
      name: c.name,
      count: c.product_count,
      bar: CATEGORY_TINTS[c.id % CATEGORY_TINTS.length]!.bar,
    }));
    const rest = sorted
      .slice(MIX_SEGMENTS)
      .reduce((sum, c) => sum + c.product_count, 0);
    return rest > 0
      ? [...top, { key: 'other', name: 'Other', count: rest, bar: 'bg-ink-300' }]
      : top;
  }, [categories]);

  const pct = (n: number) => Math.round((n / totalProducts) * 100);
  const mixLabel = mix.map((m) => `${m.name} ${pct(m.count)}%`).join(', ');
  const shelfWord = categories.length === 1 ? 'category' : 'categories';

  return (
    <View className="mx-4 mt-2 mb-3 p-4 rounded-card bg-paper-50 border border-ink-100">
      <View className="flex-row items-start justify-between gap-x-3">
        <View className="flex-1">
          <StyledText variant="medium" className="text-caption text-ink-500">
            Your shelves
          </StyledText>
          <View className="flex-row items-baseline gap-x-1.5">
            <StyledText
              variant="black"
              className="text-h1 text-ink-900"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {categories.length}
            </StyledText>
            <StyledText variant="semibold" className="text-body text-ink-600">
              {shelfWord}
            </StyledText>
          </View>
          <StyledText
            variant="regular"
            className="text-caption text-ink-500"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} sorted
          </StyledText>
        </View>
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add category"
          className="h-11 px-4 rounded-pill bg-persimmon-500 flex-row items-center gap-x-1.5 active:bg-persimmon-700 press-scale"
        >
          <Ionicons name="add" size={18} color="#FBF7EE" />
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            New
          </StyledText>
        </Pressable>
      </View>

      {totalProducts > 0 ? (
        <View
          accessible
          accessibilityLabel={`Product mix: ${mixLabel}`}
          className="mt-4 pt-3 border-t border-dashed border-paper-400"
        >
          <View className="flex-row h-2.5 rounded-pill overflow-hidden gap-x-0.5 bg-ink-100">
            {mix.map((m) => (
              <View key={m.key} className={m.bar} style={{ flex: m.count }} />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
            {mix.map((m) => (
              <View key={m.key} className="flex-row items-center gap-x-1.5 max-w-[46%]">
                <View className={`w-2 h-2 rounded-pill ${m.bar}`} />
                <StyledText
                  variant="medium"
                  numberOfLines={1}
                  className="text-caption text-ink-700 shrink"
                >
                  {m.name}
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-caption text-ink-900"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {pct(m.count)}%
                </StyledText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
});

function CategoriesEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="mx-4 mt-6 px-6 pt-6 pb-7 rounded-card bg-paper-50 border border-ink-100 items-center">
      <SariMascot state="inventory" size={150} defer />
      <StyledText
        variant="black"
        accessibilityRole="header"
        className="text-h2 text-ink-900 mt-3 text-center"
      >
        Wala pang kategorya
      </StyledText>
      <StyledText
        variant="regular"
        className="text-body text-ink-500 mt-1.5 text-center"
      >
        Group drinks, snacks and canned goods into shelves so every item is
        quicker to find.
      </StyledText>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add your first category"
        className="mt-5 min-h-[48px] px-6 rounded-pill bg-persimmon-500 flex-row items-center gap-x-2 shadow-persimmon-glow active:bg-persimmon-700 press-scale"
      >
        <FontAwesome name="plus" size={13} color="#FBF7EE" />
        <StyledText variant="extrabold" className="text-paper-50 text-[15px]">
          Add category
        </StyledText>
      </Pressable>
    </View>
  );
}

export const CategoriesTab = memo(CategoriesTabComponent);
