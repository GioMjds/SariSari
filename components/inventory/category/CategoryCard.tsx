import { StyledText } from '@/components/elements';
import { CategoryWithCount } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View, TouchableOpacity } from 'react-native';

interface CategoryCardProps {
  category: CategoryWithCount;
  onPress: (category: CategoryWithCount) => void;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
}

export function CategoryCard({
  category,
  onPress,
  onEdit,
  onDelete,
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

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          {/* Edit Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="w-10 h-10 rounded-lg bg-ink-50 border border-ink-100 items-center justify-center"
          >
            <FontAwesome name="edit" size={16} color="#E85A1F" />
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 items-center justify-center"
          >
            <FontAwesome name="trash" size={16} color="#C13030" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}
