import { useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { StyledText } from '@/components/elements';
import { Category } from '@/types/categories.types';
import { Supplier } from '@/types/suppliers.types';
import type { EditProductFormData } from './useEditProductForm';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ProductImagePicker } from '../products/ProductImagePicker';

interface EditBasicInfoCardProps {
  control: Control<EditProductFormData>;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
}

const EDIT_CATEGORY_PILL_ACTIVE_CLASS =
  'press-scale px-4 py-3 min-h-[44px] justify-center rounded-pill border bg-persimmon-500 border-persimmon-500 active:opacity-80';
const EDIT_CATEGORY_PILL_INACTIVE_CLASS =
  'press-scale px-4 py-3 min-h-[44px] justify-center rounded-pill border bg-paper-100 border-ink-200 active:opacity-80';

const CATEGORY_TEXT_ACTIVE_CLASS = 'text-sm text-paper-50';
const CATEGORY_TEXT_INACTIVE_CLASS = 'text-sm text-ink-700';

export function EditBasicInfoCard({
  control,
  categories,
  selectedCategory,
  onSelectCategory,
}: EditBasicInfoCardProps) {
  const { getAllSuppliersQuery } = useSuppliers();
  const suppliers: Supplier[] = getAllSuppliersQuery.data || [];

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
            SKU{' '}
            <StyledText variant="regular" className="text-persimmon-500">
              *
            </StyledText>
          </StyledText>
          <View className="flex-row items-center">
            <FontAwesome name="lock" size={10} color="#A89F90" />
            <StyledText variant="regular" className="text-ink-400 text-xs ml-1">
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
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => onSelectCategory(cat.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select category ${cat.name}`}
                  accessibilityState={{ selected: isActive }}
                  className={
                    isActive
                      ? EDIT_CATEGORY_PILL_ACTIVE_CLASS
                      : EDIT_CATEGORY_PILL_INACTIVE_CLASS
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
              No categories yet — go to Products → Categories tab to add one.
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
          name="supplier_id"
          render={({ field: { value, onChange } }) => {
            const currentSupplier = suppliers.find((s) => s.id === value);
            return (
              <SupplierPickerControl
                suppliers={suppliers}
                value={value}
                currentSupplier={currentSupplier}
                onChange={(id) => onChange(id ?? '')}
              />
            );
          }}
        />
      </View>
    </View>
  );
}

function SupplierPickerControl({
  suppliers,
  value,
  currentSupplier,
  onChange,
}: {
  suppliers: Supplier[];
  value: string | null | undefined;
  currentSupplier: Supplier | undefined;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={
          currentSupplier
            ? `Supplier: ${currentSupplier.name}. Tap to change`
            : 'Select a supplier. Tap to open picker'
        }
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
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
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
                  !value
                    ? 'bg-cinnamon-50 border border-cinnamon-200'
                    : 'bg-paper-100'
                }`}
              >
                <StyledText variant="medium" className="text-ink-700 text-sm">
                  None (No supplier)
                </StyledText>
                {!value ? (
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
                    value === s.id
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
                  {value === s.id ? (
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
