import { ScrollView, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';

export type StockFilter =
  'all' | 'critical' | 'low' | 'out' | 'overstock' | 'near_expiry';

type FilterOption = {
  key: StockFilter;
  label: string;
};

const OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'low', label: 'Low' },
  { key: 'out', label: 'Out' },
  { key: 'overstock', label: 'Overstock' },
  { key: 'near_expiry', label: 'Near Expiry' },
] satisfies FilterOption[];

export function StockFilterChips({
  value,
  onChange,
}: {
  value: StockFilter;
  onChange: (v: StockFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label} filter`}
            className={`px-3 py-2 rounded-pill border min-h-[36px] ${
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
