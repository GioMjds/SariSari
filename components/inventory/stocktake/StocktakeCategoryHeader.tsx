import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface StocktakeCategoryHeaderProps {
  categoryName: string;
  productCount: number;
  countedCount: number;
  expanded: boolean;
  onToggle: () => void;
}

// Tappable category header; the rows themselves are rendered by the screen's SectionList.
export function StocktakeCategoryHeader({
  categoryName,
  productCount,
  countedCount,
  expanded,
  onToggle,
}: StocktakeCategoryHeaderProps) {
  const { t } = useTranslation('stocktake');
  const done = productCount > 0 && countedCount >= productCount;
  const progress = t('categoryProgress', { counted: countedCount, total: productCount });

  return (
    <TouchableOpacity
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${categoryName}, ${progress}`}
      className={`min-h-[52px] px-3 py-2 rounded-xl border flex-row items-center gap-x-3 mb-2 mt-2 ${
        done ? 'bg-sage-50 border-sage-200' : 'bg-paper-100 border-paper-300'
      }`}
    >
      <FontAwesome
        name={done ? 'check-circle' : 'folder-o'}
        size={16}
        color={done ? '#4F7A24' : '#564E45'}
      />
      <View className="flex-1">
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          {categoryName}
        </StyledText>
        <StyledText
          variant="medium"
          className={`text-xs ${done ? 'text-sage-700' : 'text-ink-600'}`}
        >
          {done ? t('categoryDone') : progress}
        </StyledText>
      </View>
      <FontAwesome
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={12}
        color="#564E45"
      />
    </TouchableOpacity>
  );
}
