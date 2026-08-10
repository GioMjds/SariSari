import { useMemo, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';
import type { Category } from '@/types/categories.types';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ProductImagePicker } from '../ProductImagePicker';

interface ProductBasicInfoCardProps {
  mode: 'add' | 'edit';
  control: Control<any>;
  nameFieldName?: string;
  sku: string;
  autoGenerateSku?: boolean;
  onToggleAutoGenerateSku?: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
  onPressScan: () => void;
  barcode?: string;
  barcodeConflictProduct?: Product | null;
  onPressEditConflictingProduct?: (productId: number) => void;
  supplierFieldName?: string;
}

const CATEGORY_PILL_ACTIVE_CLASS =
  'press-scale px-4 py-2.5 rounded-pill border bg-persimmon-500 border-persimmon-500 active:opacity-80';
const CATEGORY_PILL_INACTIVE_CLASS =
  'press-scale px-4 py-2.5 rounded-pill border bg-paper-100 border-ink-200 active:opacity-80';

const CATEGORY_TEXT_ACTIVE_CLASS = 'text-sm text-paper-50';
const CATEGORY_TEXT_INACTIVE_CLASS = 'text-sm text-ink-700';

export function ProductBasicInfoCard({
  mode,
  control,
  nameFieldName = mode === 'add' ? 'productName' : 'name',
  sku,
  autoGenerateSku = false,
  onToggleAutoGenerateSku,
  categories,
  selectedCategory,
  onSelectCategory,
  onPressScan,
  barcode,
  barcodeConflictProduct,
  onPressEditConflictingProduct,
  supplierFieldName = mode === 'add' ? 'supplierId' : 'supplier_id',
}: ProductBasicInfoCardProps) {
  const { getAllSuppliersQuery } = useSuppliers();
  const suppliers = useMemo(
    () => getAllSuppliersQuery.data || [],
    [getAllSuppliersQuery.data],
  );
  const isDuplicate = !!barcodeConflictProduct;

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Basic Info
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          {mode === 'add'
            ? 'Name, SKU, and category — the identity of your item'
            : 'Edit name, category, and barcode'}
        </StyledText>
      </View>

      <Controller
        control={control}
        name="imageUri"
        render={({ field: { value, onChange } }) => (
          <ProductImagePicker imageUri={value} onImageChange={onChange} />
        )}
      />

      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Product Name{' '}
          <StyledText variant="regular" className="text-persimmon-500">
            *
          </StyledText>
        </StyledText>
        <Controller
          control={control}
          name={nameFieldName}
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

      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            SKU{' '}
            <StyledText variant="regular" className="text-persimmon-500">
              *
            </StyledText>
          </StyledText>
          {mode === 'add' && onToggleAutoGenerateSku ? (
            <Pressable
              onPress={onToggleAutoGenerateSku}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: autoGenerateSku }}
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
          ) : (
            <View className="flex-row items-center">
              <FontAwesome name="lock" size={10} color="#A89F90" />
              <StyledText
                variant="regular"
                className="text-ink-400 text-xs ml-1"
              >
                Read-only
              </StyledText>
            </View>
          )}
        </View>
        <Controller
          control={control}
          name="sku"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="e.g., PC-001"
              placeholderTextColor="#A89F90"
              value={mode === 'add' ? sku : value}
              onChangeText={onChange}
              editable={mode === 'add' && !autoGenerateSku}
              accessibilityLabel="Stock keeping unit"
              className={`bg-paper-100 text-ink-900 text-base border border-ink-200 rounded-xl px-4 py-3 ${
                mode === 'edit' || autoGenerateSku ? 'opacity-60' : ''
              }`}
            />
          )}
        />
      </View>

      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            Barcode
          </StyledText>
          <Pressable
            onPress={onPressScan}
            accessibilityRole="button"
            accessibilityLabel="Scan barcode"
            hitSlop={8}
            className="press-scale flex-row items-center active:opacity-70"
          >
            <FontAwesome name="barcode" size={14} color="#623418" />
            <StyledText
              variant="semibold"
              className="text-cinnamon-600 text-xs ml-1.5"
            >
              Scan Barcode
            </StyledText>
          </Pressable>
        </View>
        <Controller
          control={control}
          name="barcode"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Type or scan a barcode"
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

      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Category
        </StyledText>
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => onSelectCategory(cat.name)}
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
                    {cat.name}
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
              No categories yet.
            </StyledText>
          </View>
        )}
      </View>

      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Supplier
        </StyledText>
        <Controller
          control={control}
          name={supplierFieldName}
          render={({ field: { value, onChange } }) => (
            <SupplierPickerControl
              suppliers={suppliers}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </View>
    </View>
  );
}

function SupplierPickerControl({
  suppliers,
  value,
  onChange,
}: {
  suppliers: { id: string; name: string }[];
  value: any;
  onChange: (id: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
  const currentSupplier = suppliers.find((s) => s.id === numericValue);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
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

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          className="flex-1 bg-ink-900/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-paper-50 rounded-t-2xl p-5 max-h-[70%]"
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-ink-100 mb-3">
              <StyledText variant="extrabold" className="text-ink-900 text-lg">
                Select Supplier
              </StyledText>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <FontAwesome name="times" size={18} color="#78716C" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-80">
              <TouchableOpacity
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={`p-3.5 rounded-xl mb-1.5 flex-row items-center justify-between ${
                  value == null
                    ? 'bg-cinnamon-50 border border-cinnamon-200'
                    : 'bg-paper-100'
                }`}
              >
                <StyledText variant="medium" className="text-ink-700 text-sm">
                  None (No supplier)
                </StyledText>
                {value == null ? (
                  <FontAwesome name="check" size={14} color="#E85A1F" />
                ) : null}
              </TouchableOpacity>
              {suppliers.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                  className={`p-3.5 rounded-xl mb-1.5 flex-row items-center justify-between ${
                    numericValue === s.id
                      ? 'bg-cinnamon-50 border border-cinnamon-200'
                      : 'bg-paper-100'
                  }`}
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-base"
                  >
                    {s.name}
                  </StyledText>
                  {numericValue === s.id ? (
                    <FontAwesome name="check" size={14} color="#E85A1F" />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
