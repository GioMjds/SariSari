import { memo } from 'react';
import { StyledText } from '@/components/elements';
import { CategoryWithCount } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface CategoryCardProps {
  category: CategoryWithCount;
  maxCount: number;
  onPress: (category: CategoryWithCount) => void;
  onMore: (category: CategoryWithCount) => void;
}

// Tile and bar tints cycle by id so neighbours look distinct; the name still carries the meaning.
const TINTS = [
  { tile: 'bg-persimmon-50', text: 'text-persimmon-600', bar: 'bg-persimmon-400' },
  { tile: 'bg-sage-50', text: 'text-sage-600', bar: 'bg-sage-300' },
  { tile: 'bg-semantic-info-50', text: 'text-semantic-info', bar: 'bg-semantic-info' },
  { tile: 'bg-semantic-warning-50', text: 'text-semantic-warning', bar: 'bg-semantic-warning' },
  { tile: 'bg-cinnamon-50', text: 'text-cinnamon-500', bar: 'bg-cinnamon-300' },
] as const;

export const CategoryCard = memo(function CategoryCard({
  category,
  maxCount,
  onPress,
  onMore,
}: CategoryCardProps) {
  const tint = TINTS[category.id % TINTS.length]!;
  const count = category.product_count;
  const share = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 6 : 0) : 0;
  const countLabel = `${count} ${count === 1 ? 'product' : 'products'}`;

  return (
    <Pressable
      onPress={() => onPress(category)}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${countLabel}`}
      accessibilityHint="Opens products in this category"
      className="bg-paper-50 rounded-2xl p-3 mb-2 mx-4 border border-ink-100 active:bg-paper-100"
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${tint.tile}`}
        >
          <StyledText variant="extrabold" className={`text-xl ${tint.text}`}>
            {category.name.trim().charAt(0).toUpperCase()}
          </StyledText>
        </View>

        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base"
            numberOfLines={1}
          >
            {category.name}
          </StyledText>
          <StyledText
            variant="regular"
            className={`text-caption mt-0.5 ${count === 0 ? 'text-ink-400' : 'text-ink-500'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {count === 0 ? 'No products yet' : countLabel}
          </StyledText>
          <View className="h-1 rounded-full bg-ink-100 mt-2 overflow-hidden">
            <View
              className={`h-1 rounded-full ${tint.bar}`}
              style={{ width: `${share}%` }}
            />
          </View>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onMore(category);
          }}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`More actions for ${category.name}`}
          className="w-11 h-11 rounded-full items-center justify-center active:bg-ink-100"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#564E45" />
        </Pressable>
      </View>
    </Pressable>
  );
});
