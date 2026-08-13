import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';
import { Category } from '@/types/categories.types';
import { AddProductFormData } from './useAddProductForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ProductImagePicker } from '../ProductImagePicker';

interface BasicInfoCardProps {
  control: Control<AddProductFormData>;
  sku: string;
  autoGenerateSku: boolean;
  onToggleAutoGenerateSku: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
  onPressScan: () => void;
  barcode?: string;
  barcodeConflictProduct?: Product | null;
  onPressEditConflictingProduct?: (productId: number) => void;
}

const CATEGORY_PILL_ACTIVE_CLASS =
  'press-scale px-4 py-2 rounded-pill border bg-persimmon-500 border-persimmon-500 active:opacity-80';
const CATEGORY_PILL_INACTIVE_CLASS =
  'press-scale px-4 py-2 rounded-pill border bg-paper-100 border-ink-200 active:opacity-80';

const CATEGORY_TEXT_ACTIVE_CLASS = 'text-sm text-paper-50';
const CATEGORY_TEXT_INACTIVE_CLASS = 'text-sm text-ink-700';

export function BasicInfoCard({
  control,
  sku,
  autoGenerateSku,
  onToggleAutoGenerateSku,
  categories,
  selectedCategory,
  onSelectCategory,
  onPressScan,
  barcode,
  barcodeConflictProduct,
  onPressEditConflictingProduct,
}: BasicInfoCardProps) {
  const { getAllSuppliersQuery } = useSuppliers();
  const suppliers = getAllSuppliersQuery.data || [];

  const hasBarcode = !!barcode && barcode.length > 0;
  const isDuplicate = !!barcodeConflictProduct;
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

      {/* Product Image Picker */}
      <Controller
        control={control}
        name="imageUri"
        render={({ field: { value, onChange } }) => (
          <ProductImagePicker imageUri={value} onImageChange={onChange} />
        )}
      />

      {/* Product Name */}
      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Product Name{' '}
          <StyledText variant="regular" className="text-persimmon-500">
            *
          </StyledText>
        </StyledText>
        <Controller
          control={control}
          name="productName"
          rules={{
            required: 'Product name is required',
            validate: (val) =>
              val.trim().length > 0 || 'Product name cannot be blank',
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <View>
              <TextInput
                placeholder="e.g., Lucky Me Pancit Canton"
                placeholderTextColor="#A89F90"
                value={value}
                onChangeText={onChange}
                accessibilityLabel="Product name"
                className={`bg-paper-100 text-ink-900 text-base border rounded-xl px-4 py-3 ${
                  error
                    ? 'border-semantic-danger bg-white shadow-persimmon-glow'
                    : 'border-ink-200'
                }`}
              />
              {error && (
                <StyledText
                  variant="medium"
                  className="text-semantic-danger text-xs mt-1.5 px-1"
                  accessibilityRole="alert"
                >
                  {error.message}
                </StyledText>
              )}
            </View>
          )}
        />
      </View>

      {/* SKU */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            SKU{' '}
            <StyledText variant="regular" className="text-persimmon-500">
              *
            </StyledText>
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
          render={({ field: { onChange } }) => (
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
          <StyledText variant="regular" className="text-ink-400 text-xs mt-1">
            Auto-generated from product name — toggle off or scan a barcode
          </StyledText>
        ) : (
          <Pressable
            onPress={onPressScan}
            accessibilityRole="button"
            accessibilityLabel="Scan barcode"
            hitSlop={8}
            className="press-scale flex-row items-center mt-1 active:opacity-70"
          >
            <FontAwesome name="barcode" size={14} color="#623418" />
            <StyledText
              variant="semibold"
              className="text-cinnamon-600 text-xs ml-2"
            >
              Scan barcode
            </StyledText>
            <StyledText variant="regular" className="text-ink-400 text-xs ml-2">
              or type a custom SKU
            </StyledText>
          </Pressable>
        )}
      </View>

      {hasBarcode ? (
        <View className="mb-4">
          <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
            Barcode
          </StyledText>
          <Controller
            control={control}
            name="barcode"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Type a barcode"
                placeholderTextColor="#A89F90"
                accessibilityLabel="Barcode"
                keyboardType="number-pad"
                className={`bg-paper-100 text-ink-900 text-base border rounded-xl px-4 py-3 ${
                  isDuplicate ? 'border-semantic-danger' : 'border-ink-200'
                }`}
              />
            )}
          />
          {isDuplicate && barcodeConflictProduct ? (
            <View className="mt-2 bg-semantic-danger-50 border border-semantic-danger/30 rounded-xl px-3 py-2.5 flex-row items-start">
              <FontAwesome
                name="exclamation-triangle"
                size={14}
                color="#C22D2D"
                style={{ marginTop: 2 }}
              />
              <View className="flex-1 ml-2">
                <StyledText
                  variant="semibold"
                  className="text-semantic-danger text-xs"
                >
                  Barcode {barcode} is already used by{' '}
                  <StyledText variant="extrabold">
                    {barcodeConflictProduct.name}
                  </StyledText>
                  .
                </StyledText>
                {barcodeConflictProduct.id != null &&
                onPressEditConflictingProduct ? (
                  <Pressable
                    onPress={() =>
                      onPressEditConflictingProduct(barcodeConflictProduct.id)
                    }
                    accessibilityRole="link"
                    accessibilityLabel={`Edit product ${barcodeConflictProduct.name}`}
                    hitSlop={6}
                    className="mt-1.5 active:opacity-70"
                  >
                    <StyledText
                      variant="semibold"
                      className="text-cinnamon-600 text-xs underline"
                    >
                      Edit that product
                    </StyledText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

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
                  className={
                    isActive
                      ? CATEGORY_PILL_ACTIVE_CLASS
                      : CATEGORY_PILL_INACTIVE_CLASS
                  }
                >
                  <StyledText
                    variant="extrabold"
                    className={
                      isActive
                        ? CATEGORY_TEXT_ACTIVE_CLASS
                        : CATEGORY_TEXT_INACTIVE_CLASS
                    }
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
              No categories yet — create one from the Products tab to organize
              this item.
            </StyledText>
          </View>
        )}
      </View>

      {/* Supplier */}
      <View className="mt-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Supplier
        </StyledText>
        <Controller
          control={control}
          name="supplierId"
          render={({ field: { value } }) => {
            const currentSupplier = suppliers.find((s) => s.id === value);
            return (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <StyledText
                    variant={currentSupplier ? 'semibold' : 'regular'}
                    className={
                      currentSupplier
                        ? 'text-ink-900 text-base'
                        : 'text-ink-400 text-base'
                    }
                  >
                    {currentSupplier ? currentSupplier.name : 'Select Supplier'}
                  </StyledText>
                  <FontAwesome name="chevron-down" size={14} color="#7A7165" />
                </TouchableOpacity>
              </>
            );
          }}
        />
      </View>
    </View>
  );
}
