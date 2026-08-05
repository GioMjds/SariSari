import { ScrollView, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';

export type ProductsFilter = 'all' | 'in_stock' | 'low' | 'out' | 'new';

type FilterOption = {
  key: ProductsFilter;
  label: string;
}

const OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low' },
  { key: 'out', label: 'Out' },
  { key: 'new', label: 'New' },
] satisfies FilterOption[];

export function ProductsFilterChips({
  value,
  onChange,
}: {
  value: ProductsFilter;
  onChange: (v: ProductsFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2 items-stretch"
      style={{ flexGrow: 0, minHeight: 44 }}
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label} filter`}
            className={`px-3 py-2 rounded-pill border min-h-[36px] justify-center ${
              isActive
                ? 'bg-cinnamon-500 border-cinnamon-500'
                : 'bg-paper-50 border-paper-300'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${isActive ? 'text-paper-50' : 'text-ink-700'}`}
            >
              {opt.label}
            </StyledText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
