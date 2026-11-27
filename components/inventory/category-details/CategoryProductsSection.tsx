import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { StyledText } from '@/components/elements';
import { MoneyText, ProductThumb, StockBadge } from '@/components/ui';
import { SariMascot } from '@/components/mascot';
import { formatPesos } from '@/lib/money';
import type {
  CategoryFilter,
  CategoryRow,
  CategorySort,
  CategorySummary,
} from './categoryInsights';

interface CategoryProductsSectionProps {
  rows: CategoryRow[];
  summary: CategorySummary;
  filter: CategoryFilter;
  sort: CategorySort;
  onFilter: (filter: CategoryFilter) => void;
  onSort: (sort: CategorySort) => void;
  onAddProduct: () => void;
  onOpenProduct: (productId: number) => void;
  onOpenInProducts: () => void;
}

const TABULAR = { fontVariant: ['tabular-nums' as const] };
// Two extra points above and below reach the 48dp Android target on 44pt controls.
const LINK_SLOP = { top: 2, bottom: 2, left: 10, right: 10 };

const SORTS: { key: CategorySort; labelKey: string }[] = [
  { key: 'priority', labelKey: 'category_sortPriority' },
  { key: 'sales', labelKey: 'category_sortSales' },
  { key: 'value', labelKey: 'category_sortValue' },
  { key: 'name', labelKey: 'category_sortName' },
];

const FILTERS: {
  key: CategoryFilter;
  labelKey: string;
  count: (s: CategorySummary) => number;
}[] = [
  { key: 'all', labelKey: 'category_filterAll', count: (s) => s.productCount },
  { key: 'out', labelKey: 'category_filterOut', count: (s) => s.out },
  { key: 'low', labelKey: 'category_filterLow', count: (s) => s.low },
  { key: 'slow', labelKey: 'category_filterSlow', count: (s) => s.slow },
  {
    key: 'nocost',
    labelKey: 'category_filterNoCost',
    count: (s) => s.missingCost,
  },
];

function movementLabel(row: CategoryRow, t: TFunction): string {
  if (row.soldUnits > 0)
    return t('category_moveSold', { count: row.soldUnits });
  if (row.utangUnits > 0)
    return t('category_moveUtang', { count: row.utangUnits });
  // In stock with no movement and not slow can only mean the product is under a week old.
  return row.isSlow || row.tone === 'out'
    ? t('category_moveNone')
    : t('category_moveNew');
}

function Chip({
  label,
  a11yLabel,
  selected,
  onPress,
  hint,
}: {
  label: string;
  a11yLabel: string;
  selected: boolean;
  onPress: () => void;
  hint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected }}
      accessibilityHint={hint}
      hitSlop={{ top: 4, bottom: 4 }}
      className={`rounded-pill px-3.5 min-h-[40px] justify-center border active:opacity-80 ${
        selected ? 'bg-ink-900 border-ink-900' : 'bg-paper-50 border-ink-200'
      }`}
    >
      <StyledText
        variant="semibold"
        className={`text-sm ${selected ? 'text-paper-50' : 'text-ink-700'}`}
        style={TABULAR}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

const ProductRow = memo(function ProductRow({
  row,
  isLast,
  onPress,
}: {
  row: CategoryRow;
  isLast: boolean;
  onPress: (productId: number) => void;
}) {
  const { t } = useTranslation('inventory');
  const { product } = row;
  const movement = movementLabel(row, t);

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      accessibilityRole="button"
      accessibilityLabel={t('category_rowA11y', {
        name: product.name,
        stock: product.quantity,
        movement,
      })}
      accessibilityHint={t('category_openProfileHint')}
      className={`flex-row items-center px-4 py-3.5 active:bg-paper-100 ${
        isLast ? '' : 'border-b border-dashed border-ink-200'
      }`}
    >
      <ProductThumb
        name={product.name}
        imageUri={product.image_uri}
        className="w-12 h-12 rounded-xl mr-3"
        initialsClassName="text-base"
      />
      <View className="flex-1 pr-3 min-w-0">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-base"
          numberOfLines={2}
        >
          {product.name}
        </StyledText>
        <View className="flex-row flex-wrap items-center mt-1 gap-x-2 gap-y-1">
          <StockBadge quantity={product.quantity} />
          <StyledText
            variant="medium"
            className={`text-[12px] ${row.isSlow ? 'text-cinnamon-600' : 'text-ink-500'}`}
            style={TABULAR}
          >
            {movement}
          </StyledText>
        </View>
      </View>
      <View className="items-end">
        <MoneyText
          value={product.price || 0}
          className="text-ink-900 text-base"
        />
        {row.stockValue > 0 ? (
          <StyledText
            variant="medium"
            className="text-ink-500 text-[12px] mt-0.5"
            style={TABULAR}
          >
            {t('category_onShelf', { value: formatPesos(row.stockValue) })}
          </StyledText>
        ) : null}
      </View>
    </Pressable>
  );
});

export function CategoryProductsSection({
  rows,
  summary,
  filter,
  sort,
  onFilter,
  onSort,
  onAddProduct,
  onOpenProduct,
  onOpenInProducts,
}: CategoryProductsSectionProps) {
  const { t } = useTranslation('inventory');

  if (summary.productCount === 0) {
    return (
      <View className="mx-4 mt-6 rounded-2xl bg-paper-50 border border-ink-100 items-center px-6 pt-6 pb-7">
        <SariMascot state="empty" size={140} />
        <StyledText
          variant="black"
          className="text-ink-900 text-xl mt-4 text-center"
        >
          {t('category_emptyTitle')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm mt-1.5 text-center"
        >
          {t('category_emptyBody')}
        </StyledText>
        <Pressable
          onPress={onAddProduct}
          accessibilityRole="button"
          accessibilityLabel={t('category_addProductA11y')}
          className="mt-5 bg-persimmon-600 rounded-pill px-7 min-h-[48px] flex-row items-center active:bg-persimmon-700"
        >
          <Ionicons name="add" size={18} className="text-paper-50" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-1.5"
          >
            {t('category_addProduct')}
          </StyledText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mx-4 mt-6">
      <View className="flex-row flex-wrap items-center justify-between mb-2 px-1 gap-x-3">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-base"
        >
          {t('category_productsTitle')}
        </StyledText>
        <Pressable
          onPress={onOpenInProducts}
          accessibilityRole="link"
          accessibilityHint={t('category_openInProductsHint')}
          hitSlop={LINK_SLOP}
          className="flex-row items-center min-h-[44px] active:opacity-70"
        >
          <StyledText
            variant="semibold"
            className="text-persimmon-700 text-sm mr-1"
          >
            {t('category_openInProducts')}
          </StyledText>
          <Ionicons
            name="open-outline"
            size={14}
            className="text-persimmon-700"
          />
        </Pressable>
      </View>

      {/* Filters: only issues that exist, so every chip leads somewhere. */}
      <View
        className="flex-row flex-wrap gap-2 px-1"
        accessibilityLabel={t('category_filterGroup')}
      >
        {FILTERS.map((f) => ({ ...f, n: f.count(summary) }))
          .filter((f) => f.key === 'all' || f.n > 0 || f.key === filter)
          .map((f) => {
            const label = t(f.labelKey);
            return (
              <Chip
                key={f.key}
                label={`${label} ${f.n}`}
                a11yLabel={t('category_filterChipA11y', { label, count: f.n })}
                selected={filter === f.key}
                onPress={() => onFilter(f.key)}
                hint={t('category_filterChipHint')}
              />
            );
          })}
      </View>

      <View
        className="flex-row items-center mt-3 mb-2 px-1"
        accessibilityLabel={t('category_sortGroup')}
      >
        <Ionicons
          name="swap-vertical"
          size={16}
          className="text-ink-600"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View className="flex-row ml-2 bg-paper-200 rounded-pill p-0.5 flex-1">
          {SORTS.map((s) => {
            const selected = sort === s.key;
            const label = t(s.labelKey);
            return (
              <Pressable
                key={s.key}
                onPress={() => onSort(s.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t('category_sortA11y', { label })}
                hitSlop={{ top: 4, bottom: 4 }}
                className={`flex-1 rounded-pill min-h-[40px] px-1 items-center justify-center ${
                  selected ? 'bg-paper-50 shadow-paper' : ''
                }`}
              >
                <StyledText
                  variant={selected ? 'extrabold' : 'medium'}
                  className={`text-[12px] ${selected ? 'text-ink-900' : 'text-ink-600'}`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
        {rows.length === 0 ? (
          <View className="items-center px-6 py-6">
            <StyledText
              variant="semibold"
              className="text-ink-700 text-sm text-center"
            >
              {t('category_noMatch')}
            </StyledText>
            <Pressable
              onPress={() => onFilter('all')}
              accessibilityRole="button"
              hitSlop={LINK_SLOP}
              className="mt-1 min-h-[44px] justify-center active:opacity-70"
            >
              <StyledText
                variant="extrabold"
                className="text-persimmon-700 text-sm"
              >
                {t('category_showAll')}
              </StyledText>
            </Pressable>
          </View>
        ) : (
          // shortcut: renders every row in a ScrollView, switch to a FlatList if a category passes ~100 products.
          rows.map((row, index) => (
            <ProductRow
              key={row.product.id}
              row={row}
              isLast={index === rows.length - 1}
              onPress={onOpenProduct}
            />
          ))
        )}
      </View>
    </View>
  );
}
