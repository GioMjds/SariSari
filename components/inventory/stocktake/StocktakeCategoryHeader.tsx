import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface StocktakeCategoryHeaderProps {
  categoryName: string;
  productCount: number;
  expanded: boolean;
  onToggle: () => void;
}

// Tappable category header; the rows themselves are rendered by the screen's SectionList.
export function StocktakeCategoryHeader({
  categoryName,
  productCount,
  expanded,
  onToggle,
}: StocktakeCategoryHeaderProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      className="bg-paper-100 p-3 rounded-xl border border-paper-300 flex-row items-center justify-between mb-2"
    >
      <StyledText variant="extrabold" className="text-ink-800 text-sm">
        {categoryName} ({productCount})
      </StyledText>
      <FontAwesome
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={12}
        color="#564E45"
      />
    </TouchableOpacity>
  );
}
