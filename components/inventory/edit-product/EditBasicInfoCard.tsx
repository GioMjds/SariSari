import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller, useFormState } from 'react-hook-form';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Category } from '@/types/categories.types';
import type { EditProductFormData } from './useEditProductForm';

interface EditBasicInfoCardProps {
  control: Control<EditProductFormData>;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
}

/**
 * EditBasicInfoCard — the first parchment card on the Edit Product
 * screen.
 *
 * Holds:
 *   • Product Name (required, fully editable).
 *   • SKU — read-only. SKUs are server-managed identities; the
 *     original screen already locks this field and surfaces a faint
 *     "PC-001" placeholder tone to make that obvious.
 *   • Category selector — horizontal scroll of pills. Same visual
 *     pattern as add-product; tapping a pill toggles it off if
 *     already selected (so the user can clear the assignment).
 *
 * The auto-generate-SKU checkbox is intentionally absent — that
 * concern only applies at creation time.
 */
export function EditBasicInfoCard({
  control,
  categories,
  selectedCategory,
  onSelectCategory,
}: EditBasicInfoCardProps) {
  // useFormState just to keep the linter happy if we add per-field
  // error rendering later — for now we don't surface errors, mirroring
  // the original screen.
  useFormState({ control });

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Basic Info
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Edit name and category — the identity of your item
        </StyledText>
      </View>

      {/* Product Name */}
      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Product Name{' '}
          <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <Controller
          control={control}
          name="name"
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

      {/* SKU — read-only */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            SKU <StyledText className="text-persimmon-500">*</StyledText>
          </StyledText>
          <View className="flex-row items-center">
            <FontAwesome name="lock" size={10} color="#A89F90" />
            <StyledText
              variant="regular"
              className="text-ink-400 text-xs ml-1"
            >
              Read-only
            </StyledText>
          </View>
        </View>
        <Controller
          control={control}
          name="sku"
          render={({ field: { value } }) => (
            <TextInput
              placeholder="e.g., PC-001"
              placeholderTextColor="#A89F90"
              value={value}
              editable={false}
              accessibilityLabel="Stock keeping unit (read-only)"
              className="bg-paper-100 text-ink-900/40 text-base border border-ink-200 rounded-xl px-4 py-3"
            />
          )}
        />
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
              No categories yet — go to Products → Categories tab to add one.
            </StyledText>
          </View>
        )}
      </View>
    </View>
  );
}