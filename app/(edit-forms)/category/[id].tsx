import { withProf } from '@/utils/perf';
import { useCallback, useRef, useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { InventoryErrorState } from '@/components/inventory';
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
  CATEGORY_FRAME_STYLE,
} from '@/components/inventory/category-details';
import type { CategoryFilter } from '@/components/inventory/category-details/categoryInsights';

// Scroll distance after which the hero's category name has left the screen.
const TITLE_SWAP_OFFSET = 96;
// Used until the sticky bar reports its real height.
const FALLBACK_BAR_HEIGHT = 130;

function IconButton({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(hint ? { accessibilityHint: hint } : {})}
      className="w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 active:bg-paper-100"
    >
      <Ionicons name={icon} size={20} className="text-ink-900" />
    </Pressable>
  );
}

function TopBar({
  title,
  onBack,
  onMore,
}: {
  title: string;
  onBack: () => void;
  onMore?: () => void;
}) {
  const { t } = useTranslation('inventory');
  return (
    <View
      className="flex-row items-center justify-between px-4 pt-2 pb-2"
      style={CATEGORY_FRAME_STYLE}
    >
      <IconButton
        icon="arrow-back"
        label={t('category_back')}
        onPress={onBack}
      />
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="flex-1 mx-3 text-center text-ink-900 text-base"
        numberOfLines={1}
      >
        {title}
      </StyledText>
      {onMore ? (
        <IconButton
          icon="ellipsis-horizontal"
          label={t('category_actions')}
          hint={t('category_actionsHint')}
          onPress={onMore}
        />
      ) : (
        <View className="w-11 h-11" />
      )}
    </View>
  );
}

function CategoryScreen() {
  const { t } = useTranslation('inventory');
  const state = useCategoryDetailsState();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const productsY = useRef(0);
  const [barHeight, setBarHeight] = useState(FALLBACK_BAR_HEIGHT);
  const [showTitle, setShowTitle] = useState(false);
  const showTitleRef = useRef(false);

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

  // Re-renders only when the threshold is crossed, not on every scroll frame.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = e.nativeEvent.contentOffset.y > TITLE_SWAP_OFFSET;
      if (next !== showTitleRef.current) {
        showTitleRef.current = next;
        setShowTitle(next);
      }
    },
    [],
  );

  const frame = {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
  const title =
    showTitle && state.category ? state.category.name : t('category_title');

  let body: React.ReactNode;
  if (state.loading) {
    body = <CategoryDetailsSkeleton />;
  } else if (state.loadError) {
    body = (
      <View style={CATEGORY_FRAME_STYLE}>
        <InventoryErrorState
          title={t('category_loadErrorTitle')}
          message={t('category_loadErrorBody')}
          onRetry={state.handleRefresh}
        />
      </View>
    );
  } else if (!state.category) {
    body = (
      <View className="flex-1 justify-center items-center px-6">
        <View className="bg-paper-50 rounded-2xl p-6 border border-ink-100 items-center">
          <SariMascot state="empty" size={120} />
          <StyledText
            variant="black"
            accessibilityRole="header"
            className="text-ink-900 text-xl mt-3 text-center"
          >
            {t('category_notFoundTitle')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-sm mt-1 text-center"
          >
            {t('category_notFoundBody')}
          </StyledText>
          <Pressable
            onPress={state.handleBack}
            accessibilityRole="button"
            className="mt-5 bg-persimmon-600 rounded-pill px-6 min-h-[48px] justify-center active:bg-persimmon-700"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              {t('category_back')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (body || !state.category) {
    return (
      <View className="flex-1 bg-background" style={frame}>
        <TopBar title={t('category_title')} onBack={state.handleBack} />
        {body}
      </View>
    );
  }

  const { category, summary } = state;

  return (
    <View className="flex-1 bg-background" style={frame}>
      <TopBar
        title={title}
        onBack={state.handleBack}
        onMore={state.openActions}
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={[
          CATEGORY_FRAME_STYLE,
          { paddingTop: 12, paddingBottom: barHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={state.handleRefresh}
            tintColor="#623418"
            colors={['#C8460F']}
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
            <Ionicons
              name="information-circle-outline"
              size={16}
              className="text-ink-500"
            />
            <StyledText
              variant="regular"
              className="text-ink-500 text-[12px] ml-1.5 text-center"
            >
              {t('category_tapHint')}
            </StyledText>
          </View>
        )}
      </ScrollView>

      <CategoryStickyBar
        totalValue={summary.stockValue}
        productCount={summary.productCount}
        onAddProduct={state.handleAddProduct}
        onHeight={setBarHeight}
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
    </View>
  );
}

export default withProf(CategoryScreen, 'category/[id]');
