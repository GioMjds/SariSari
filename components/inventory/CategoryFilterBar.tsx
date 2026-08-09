import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';
import { useRenderCounter } from '@/hooks/useRenderCounter';

interface CategoryFilterBarProps {
  selectedCategory?: string;
  onSelectCategory: (categoryName: string | undefined) => void;
  onOpenAddCategory: () => void;
}

const CHIP_ACTIVE_CLASS =
  'px-3.5 py-1.5 rounded-full border flex-row items-center gap-x-1.5 bg-ink-900 border-ink-900 active:opacity-80';
const CHIP_INACTIVE_CLASS =
  'px-3.5 py-1.5 rounded-full border flex-row items-center gap-x-1.5 bg-paper-50 border-ink-200 active:opacity-80';

const CHIP_TEXT_ACTIVE_CLASS = 'text-xs text-paper-50';
const CHIP_TEXT_INACTIVE_CLASS = 'text-xs text-ink-700';

const CHIP_COUNT_BADGE_ACTIVE = 'px-1.5 py-0.5 rounded-full bg-ink-700';
const CHIP_COUNT_BADGE_INACTIVE = 'px-1.5 py-0.5 rounded-full bg-paper-200';

const CHIP_COUNT_TEXT_ACTIVE = 'text-[10px] text-paper-50';
const CHIP_COUNT_TEXT_INACTIVE = 'text-[10px] text-ink-500';

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  onOpenAddCategory,
}: CategoryFilterBarProps) {
  useRenderCounter('CategoryFilterBar', { feature: 'inventory_catalog' });

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
          className={
            !selectedCategory
              ? 'px-3.5 py-1.5 rounded-full border bg-ink-900 border-ink-900 active:opacity-80'
              : 'px-3.5 py-1.5 rounded-full border bg-paper-50 border-ink-200 active:opacity-80'
          }
        >
          <StyledText
            variant="extrabold"
            className={
              !selectedCategory
                ? 'text-xs text-paper-50'
                : 'text-xs text-ink-700'
            }
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
              className={isSelected ? CHIP_ACTIVE_CLASS : CHIP_INACTIVE_CLASS}
            >
              <StyledText
                variant="extrabold"
                className={
                  isSelected ? CHIP_TEXT_ACTIVE_CLASS : CHIP_TEXT_INACTIVE_CLASS
                }
              >
                {cat.name}
              </StyledText>
              <View
                className={
                  isSelected
                    ? CHIP_COUNT_BADGE_ACTIVE
                    : CHIP_COUNT_BADGE_INACTIVE
                }
              >
                <StyledText
                  variant="extrabold"
                  className={
                    isSelected
                      ? CHIP_COUNT_TEXT_ACTIVE
                      : CHIP_COUNT_TEXT_INACTIVE
                  }
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
