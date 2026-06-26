import { StyledText } from '@/components/elements';
import { CategoryWithCount } from '@/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface CategoryCardProps {
  category: CategoryWithCount;
  onPress: (category: CategoryWithCount) => void;
  onMore: (category: CategoryWithCount) => void;
}

export function CategoryCard({
  category,
  onPress,
  onMore,
}: CategoryCardProps) {
  return (
    <Pressable
      onPress={() => onPress(category)}
      className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-ink-100 active:opacity-90"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: '#E85A1F', // Persimmon Left Stripe
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Rebranded folder icon in persimmon */}
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-persimmon-50">
            <FontAwesome name="folder" size={20} color="#E85A1F" />
          </View>

          {/* Category Info */}
          <View className="flex-1 pr-2">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-base"
            >
              {category.name}
            </StyledText>
            <StyledText variant="regular" className="text-ink-500 text-caption mt-1">
              {category.product_count}{' '}
              {category.product_count === 1 ? 'product' : 'products'}
            </StyledText>
          </View>
        </View>

        {/* Overflow (⋮) options button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onMore(category);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`More actions for ${category.name}`}
          className="w-10 h-10 rounded-full bg-ink-50 border border-ink-100 items-center justify-center active:opacity-70"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#4A2610" />
        </Pressable>
      </View>
    </Pressable>
  );
}