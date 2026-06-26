import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';
import { Category } from '@/types/categories.types';
import { AddProductFormData } from './useAddProductForm';

interface BasicInfoCardProps {
  control: Control<AddProductFormData>;
  sku: string;
  autoGenerateSku: boolean;
  onToggleAutoGenerateSku: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
}

/**
 * BasicInfoCard — the first parchment card on the form.
 *
 * Holds:
 *   • Product Name (required, drives auto-SKU generation).
 *   • SKU with an "Auto-generate" checkbox at the top-right of the
 *     label row. When auto is on the input is dimmed and locked.
 *   • Category selector — horizontal scroll of pills. Active pill
 *     uses brand persimmon; inactive uses the parchment chip. When
 *     no categories exist yet, an info banner nudges the user to
 *     the catalog to create one.
 */
export function BasicInfoCard({
  control,
  sku,
  autoGenerateSku,
  onToggleAutoGenerateSku,
  categories,
  selectedCategory,
  onSelectCategory,
}: BasicInfoCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Basic Info
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Name, SKU, and category — the identity of your item
        </StyledText>
      </View>

      {/* Product Name */}
      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Product Name <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <Controller
          control={control}
          name="productName"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="e.g., Lucky Me Pancit Canton"
              placeholderTextColor="#A89F90"
              value={value}
              onChangeText={onChange}
              accessibilityLabel="Product name"
              className="bg-paper-100 text-ink-900 text-base border border-ink-200 rounded-xl px-4 py-3"
            />
          )}
        />
      </View>

      {/* SKU */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            SKU <StyledText className="text-persimmon-500">*</StyledText>
          </StyledText>
          <Pressable
            onPress={onToggleAutoGenerateSku}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: autoGenerateSku }}
            accessibilityLabel="Auto-generate SKU from product name"
            hitSlop={8}
            className="press-scale flex-row items-center active:opacity-70"
          >
            <View
              className={`w-4 h-4 rounded border-2 mr-2 items-center justify-center ${
                autoGenerateSku
                  ? 'bg-persimmon-500 border-persimmon-500'
                  : 'bg-paper-50 border-ink-300'
              }`}
            >
              {autoGenerateSku && (
                <FontAwesome name="check" size={10} color="#FBF7EE" />
              )}
            </View>
            <StyledText variant="regular" className="text-ink-500 text-xs">
              Auto-generate
            </StyledText>
          </Pressable>
        </View>
        <Controller
          control={control}
          name="sku"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="e.g., PC-001"
              placeholderTextColor="#A89F90"
              value={sku}
              onChangeText={onChange}
              editable={!autoGenerateSku}
              accessibilityLabel="Stock keeping unit"
              className={`bg-paper-100 text-ink-900 text-base border border-ink-200 rounded-xl px-4 py-3 ${
                autoGenerateSku ? 'opacity-60' : ''
              }`}
            />
          )}
        />
        {autoGenerateSku ? (
          <StyledText
            variant="regular"
            className="text-ink-400 text-xs mt-1"
          >
            Auto-generated from product name — toggle off to enter manually
          </StyledText>
        ) : (
          <StyledText
            variant="regular"
            className="text-ink-400 text-xs mt-1"
          >
            Scan a barcode or type a custom SKU
          </StyledText>
        )}
      </View>

      {/* Category */}
      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Category
        </StyledText>
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category.name;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => onSelectCategory(category.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select category ${category.name}`}
                  accessibilityState={{ selected: isActive }}
                  className={`press-scale px-4 py-2 rounded-pill border ${
                    isActive
                      ? 'bg-persimmon-500 border-persimmon-500'
                      : 'bg-paper-100 border-ink-200'
                  }`}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? isActive
                        ? '#C8460F'
                        : '#EFE6D2'
                      : isActive
                        ? '#E85A1F'
                        : '#F6F0E2',
                  })}
                >
                  <StyledText
                    variant="extrabold"
                    className={`text-sm ${
                      isActive ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {category.name}
                  </StyledText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View className="bg-semantic-info-50 border border-semantic-info-100 rounded-xl px-3 py-2.5 flex-row items-center">
            <FontAwesome name="info-circle" size={14} color="#2E6FA8" />
            <StyledText
              variant="medium"
              className="text-semantic-info text-xs ml-2 flex-1"
            >
              No categories yet — create one from the Products tab to
              organize this item.
            </StyledText>
          </View>
        )}
      </View>
    </View>
  );
}
