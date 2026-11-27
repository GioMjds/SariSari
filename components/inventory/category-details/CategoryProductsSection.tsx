import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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

const SORTS: { key: CategorySort; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'sales', label: 'Best selling' },
  { key: 'value', label: 'Value' },
  { key: 'name', label: 'A–Z' },
];

function Chip({
  label,
  selected,
  onPress,
  hint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  hint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityHint={hint}
      hitSlop={{ top: 4, bottom: 4 }}
      className={`rounded-pill px-3.5 min-h-[36px] justify-center border active:opacity-80 ${
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
  const { product } = row;
  // In stock with no movement and not slow can only mean the product is under a week old.
  const movement =
    row.soldUnits > 0
      ? `${row.soldUnits} sold in 28 days`
      : row.utangUnits > 0
        ? `${row.utangUnits} on utang in 28 days`
        : row.isSlow || row.tone === 'out'
          ? 'No sales in 28 days'
          : 'New this week';

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.quantity} in stock, ${movement}`}
      accessibilityHint="Opens the product profile"
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
            {formatPesos(row.stockValue)} on shelf
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
  if (summary.productCount === 0) {
    return (
      <View className="mx-4 mt-6 rounded-2xl bg-paper-50 border border-ink-100 items-center px-6 pt-6 pb-7">
        <SariMascot state="empty" size={140} />
        <StyledText
          variant="black"
          className="text-ink-900 text-xl mt-4 text-center"
        >
          No products yet
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-500 text-sm mt-1.5 text-center"
        >
          Add a product to this category to start tracking its stock and sales.
        </StyledText>
        <Pressable
          onPress={onAddProduct}
          accessibilityRole="button"
          className="mt-5 bg-persimmon-500 rounded-pill px-7 min-h-[48px] flex-row items-center active:bg-persimmon-700"
        >
          <FontAwesome name="plus" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            Add Product
          </StyledText>
        </Pressable>
      </View>
    );
  }

  const filters: { key: CategoryFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: summary.productCount },
    { key: 'out', label: 'Out', count: summary.out },
    { key: 'low', label: 'Low', count: summary.low },
    { key: 'slow', label: 'Not moving', count: summary.slow },
    { key: 'nocost', label: 'No cost', count: summary.missingCost },
  ];

  return (
    <View className="mx-4 mt-6">
      <View className="flex-row items-baseline justify-between mb-2 px-1">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-base"
        >
          Products
        </StyledText>
        <Pressable
          onPress={onOpenInProducts}
          accessibilityRole="link"
          accessibilityHint="Opens the Products tab filtered to this category"
          hitSlop={{ left: 10, right: 10 }}
          className="flex-row items-center min-h-[44px] active:opacity-70"
        >
          <StyledText
            variant="semibold"
            className="text-persimmon-600 text-sm mr-1"
          >
            Open in Products
          </StyledText>
          <FontAwesome name="external-link" size={11} color="#C8460F" />
        </Pressable>
      </View>

      {/* Filters: only issues that exist, so every chip leads somewhere. */}
      <View
        className="flex-row flex-wrap gap-2 px-1"
        accessibilityLabel="Filter products"
      >
        {filters
          .filter((f) => f.key === 'all' || f.count > 0 || f.key === filter)
          .map((f) => (
            <Chip
              key={f.key}
              label={`${f.label} ${f.count}`}
              selected={filter === f.key}
              onPress={() => onFilter(f.key)}
              hint={`Shows ${f.label.toLowerCase()} products`}
            />
          ))}
      </View>

      <View
        className="flex-row items-center mt-3 mb-2 px-1"
        accessibilityLabel="Sort products"
      >
        <FontAwesome name="sort-amount-desc" size={12} color="#564E45" />
        <View className="flex-row ml-2 bg-paper-200 rounded-pill p-0.5 flex-1">
          {SORTS.map((s) => {
            const selected = sort === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => onSort(s.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Sort by ${s.label}`}
                hitSlop={{ top: 4, bottom: 4 }}
                className={`flex-1 rounded-pill min-h-[40px] items-center justify-center ${
                  selected ? 'bg-paper-50 shadow-paper' : ''
                }`}
              >
                <StyledText
                  variant={selected ? 'extrabold' : 'medium'}
                  className={`text-[12px] ${selected ? 'text-ink-900' : 'text-ink-500'}`}
                  numberOfLines={1}
                >
                  {s.label}
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
              No products match this filter.
            </StyledText>
            <Pressable
              onPress={() => onFilter('all')}
              accessibilityRole="button"
              hitSlop={{ left: 12, right: 12 }}
              className="mt-1 min-h-[44px] justify-center active:opacity-70"
            >
              <StyledText
                variant="extrabold"
                className="text-persimmon-600 text-sm"
              >
                Show all
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
