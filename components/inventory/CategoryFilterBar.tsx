import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFilterBarProps {
  selectedCategory?: string;
  onSelectCategory: (categoryName: string | undefined) => void;
  onOpenAddCategory: () => void;
}

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  onOpenAddCategory,
}: CategoryFilterBarProps) {
  const { getCategoriesWithCountQuery } = useCategories();
  const categories = getCategoriesWithCountQuery.data ?? [];

  const handleSelect = useCallback(
    (name: string | undefined) => {
      if (selectedCategory === name) {
        onSelectCategory(undefined);
      } else {
        onSelectCategory(name);
      }
    },
    [selectedCategory, onSelectCategory],
  );

  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          alignItems: 'center',
        }}
      >
        {/* "All" Pill */}
        <Pressable
          onPress={() => handleSelect(undefined)}
          className={`px-3.5 py-1.5 rounded-full border ${
            !selectedCategory
              ? 'bg-ink-900 border-ink-900'
              : 'bg-paper-50 border-ink-200'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-xs ${!selectedCategory ? 'text-paper-50' : 'text-ink-700'}`}
          >
            All
          </StyledText>
        </Pressable>

        {/* Dynamic Category Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleSelect(cat.name)}
              className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-x-1.5 ${
                isSelected
                  ? 'bg-ink-900 border-ink-900'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {cat.name}
              </StyledText>
              <View
                className={`px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-ink-700' : 'bg-paper-200'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-500'}`}
                >
                  {cat.product_count}
                </StyledText>
              </View>
            </Pressable>
          );
        })}

        {/* Add Category Pill */}
        <Pressable
          onPress={onOpenAddCategory}
          className="px-3 py-1.5 rounded-full border border-dashed border-persimmon-400 bg-persimmon-50/50 flex-row items-center gap-x-1 active:opacity-70"
        >
          <FontAwesome name="plus" size={10} color="#E85A1F" />
          <StyledText
            variant="extrabold"
            className="text-xs text-persimmon-600"
          >
            Add Category
          </StyledText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
