import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { type Control, Controller, useController } from 'react-hook-form';
import { useCategories } from '@/hooks';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ProductImagePicker } from '../ProductImagePicker';
import { Field, INPUT_TEXT_CLASS, PLACEHOLDER_COLOR, SectionCard, inputClass } from './FormPrimitives';
import { OptionPickerSheet, SelectRow } from './OptionPickerSheet';
import type { ProductFormData } from './types';

interface ProductDetailsSectionProps {
  control: Control<ProductFormData>;
}

/** Photo, name, and where the item belongs (category and supplier). */
export function ProductDetailsSection({ control }: ProductDetailsSectionProps) {
  const { getAllCategoriesQuery, insertCategoryMutation } = useCategories();
  const { getAllSuppliersQuery, insertSupplierMutation } = useSuppliers();
  const [picker, setPicker] = useState<'category' | 'supplier' | null>(null);

  const category = useController({ control, name: 'category' });
  const supplier = useController({ control, name: 'supplierId' });

  // Categories are stored on the product by name, so the name doubles as the option id.
  const categoryOptions = useMemo(
    () => (getAllCategoriesQuery.data ?? []).map((c) => ({ id: c.name, label: c.name })),
    [getAllCategoriesQuery.data],
  );
  const supplierOptions = useMemo(
    () => (getAllSuppliersQuery.data ?? []).map((s) => ({ id: s.id, label: s.name })),
    [getAllSuppliersQuery.data],
  );
  const supplierName = supplierOptions.find((s) => s.id === supplier.field.value)?.label;

  return (
    <SectionCard title="Details" hint="What shoppers ask for at the counter">
      <View className="flex-row gap-x-3">
        <Controller
          control={control}
          name="imageUri"
          render={({ field: { value, onChange } }) => (
            <ProductImagePicker imageUri={value} onImageChange={(uri) => onChange(uri ?? '')} />
          )}
        />
        <View className="flex-1">
          <Controller
            control={control}
            name="productName"
            rules={{
              validate: (v) => v.trim().length > 0 || 'Enter a product name',
            }}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <Field label="Product name" required error={error?.message}>
                <View className={inputClass(!!error)}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Lucky Me Pancit Canton"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    accessibilityLabel="Product name, required"
                    autoCapitalize="words"
                    multiline
                    blurOnSubmit
                    returnKeyType="done"
                    className={INPUT_TEXT_CLASS}
                  />
                </View>
              </Field>
            )}
          />
        </View>
      </View>

      <View className="gap-y-2">
        <SelectRow
          label="Category"
          icon="tags"
          value={category.field.value || undefined}
          placeholder="Choose a category"
          onPress={() => setPicker('category')}
        />
        <SelectRow
          label="Supplier"
          icon="truck"
          value={supplierName}
          placeholder="Who you buy this from"
          onPress={() => setPicker('supplier')}
        />
      </View>

      <OptionPickerSheet
        visible={picker === 'category'}
        title="Category"
        noun="category"
        options={categoryOptions}
        selectedId={category.field.value}
        onSelect={category.field.onChange}
        onClose={() => setPicker(null)}
        onCreate={async (name) => {
          try {
            await insertCategoryMutation.mutateAsync({ name });
            return name;
          } catch {
            return null; // Toast already raised by the mutation.
          }
        }}
      />
      <OptionPickerSheet
        visible={picker === 'supplier'}
        title="Supplier"
        noun="supplier"
        options={supplierOptions}
        selectedId={supplier.field.value}
        onSelect={supplier.field.onChange}
        onClose={() => setPicker(null)}
        onCreate={async (name) => {
          try {
            return (await insertSupplierMutation.mutateAsync({ name })).id;
          } catch {
            return null;
          }
        }}
      />
    </SectionCard>
  );
}
