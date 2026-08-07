# Product Form Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create unified shared product form components (`ProductBasicInfoCard`, `ProductPricingCard`, `ProductStockCard`, `ProductFormActionButtons`, `ProductFormHeader`) and align `/add-product` and `/edit-product` screens to full UI design and feature parity.

**Architecture:** Shared components placed in `components/inventory/products/form/` consuming typed React Hook Form controllers. Custom hooks (`useAddProductForm` and `useEditProductForm`) aligned to expose consistent field state and handlers.

**Tech Stack:** Expo SDK 54, React Native 0.81, React Hook Form v7, NativeWind v4 (Tailwind CSS), TypeScript strict mode, FontAwesome vector icons.

## Global Constraints

- Money calculations and formatting must use `lib/money.ts` (`parsePesosInput`, `tryParsePesosInput`, `formatPesos`).
- Component styling uses NativeWind `className` strings with theme colors (`paper-50`, `paper-100`, `ink-900`, `persimmon-500`, `cinnamon-500`, `border-dashed border-ink-300`).
- No emojis in code or comments.

---

### Task 1: Create Shared Product Form Header & Action Buttons

**Files:**

- Create: `components/inventory/products/form/ProductFormHeader.tsx`
- Create: `components/inventory/products/form/ProductFormActionButtons.tsx`
- Create: `components/inventory/products/form/index.ts`

**Interfaces:**

- Consumes: `FontAwesome` icons, `StyledText` component, React Native primitives.
- Produces: `ProductFormHeader` and `ProductFormActionButtons` components.

- [ ] **Step 1: Create `ProductFormHeader.tsx`**

```tsx
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ProductFormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export function ProductFormHeader({
  title,
  subtitle = 'Item Registry',
  onBack,
}: ProductFormHeaderProps) {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="items-center">
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            {title}
          </StyledText>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mt-0.5"
          >
            {subtitle}
          </StyledText>
        </View>

        <View className="w-10 h-10" />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create `ProductFormActionButtons.tsx`**

```tsx
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ProductFormActionButtonsProps {
  submitLabel?: string;
  disabled: boolean;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ProductFormActionButtons({
  submitLabel = 'Save Product',
  disabled,
  isPending,
  onSubmit,
  onCancel,
}: ProductFormActionButtonsProps) {
  return (
    <View className="mt-5">
      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled, busy: isPending }}
        className={`rounded-2xl py-4 flex-row items-center justify-center ${
          disabled
            ? 'bg-ink-100 shadow-none'
            : 'bg-persimmon-500 shadow-persimmon-glow'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: !disabled && pressed ? 0.98 : 1 }],
        })}
      >
        <FontAwesome
          name={isPending ? 'spinner' : 'check'}
          size={16}
          color={disabled ? '#7A7165' : '#FBF7EE'}
        />
        <StyledText
          variant="extrabold"
          className={`text-base ml-2 ${
            disabled ? 'text-ink-400' : 'text-paper-50'
          }`}
        >
          {isPending ? 'Saving Product...' : submitLabel}
        </StyledText>
      </Pressable>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel and go back"
        className="press-scale mt-3 rounded-2xl py-4 items-center justify-center bg-paper-100 border border-ink-200 active:opacity-70"
      >
        <StyledText variant="semibold" className="text-ink-700 text-base">
          Cancel
        </StyledText>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Create `components/inventory/products/form/index.ts`**

```ts
export * from './ProductFormHeader';
export * from './ProductFormActionButtons';
```

---

### Task 2: Create Shared Product Basic Info & Stock Cards

**Files:**

- Create: `components/inventory/products/form/ProductBasicInfoCard.tsx`
- Create: `components/inventory/products/form/ProductStockCard.tsx`
- Modify: `components/inventory/products/form/index.ts`

**Interfaces:**

- Consumes: React Hook Form `Control`, `Controller`, `Category`, `Product`, `useSuppliers`.
- Produces: `ProductBasicInfoCard` (with barcode scanner and working supplier picker modal) and `ProductStockCard`.

- [ ] **Step 1: Create `ProductBasicInfoCard.tsx`**

```tsx
import { useState } from 'react';
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
  const suppliers = getAllSuppliersQuery.data || [];
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
          Product Name <StyledText className="text-persimmon-500">*</StyledText>
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
            SKU <StyledText className="text-persimmon-500">*</StyledText>
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
                  className={`press-scale px-4 py-2.5 rounded-pill border ${
                    isActive
                      ? 'bg-persimmon-500 border-persimmon-500'
                      : 'bg-paper-100 border-ink-200'
                  }`}
                >
                  <StyledText
                    variant="extrabold"
                    className={`text-sm ${
                      isActive ? 'text-paper-50' : 'text-ink-700'
                    }`}
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
  suppliers: Array<{ id: number; name: string }>;
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
              <StyledText variant="bold" className="text-ink-900 text-lg">
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
```

- [ ] **Step 2: Create `ProductStockCard.tsx`**

```tsx
import { FontAwesome } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';

const STOCK_PRESETS = [5, 10, 20] as const;

interface ProductStockCardProps {
  control: Control<any>;
  stockValue: string;
  onBumpStock: (delta: number) => void;
  fieldName?: string;
}

export function ProductStockCard({
  control,
  stockValue,
  onBumpStock,
  fieldName = 'initialStock',
}: ProductStockCardProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
      <View className="mb-3">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Stock & Inventory
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          Track starting quantity on hand
        </StyledText>
      </View>

      <View className="mb-3">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Stock Quantity
        </StyledText>
        <Controller
          control={control}
          name={fieldName}
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="0"
              placeholderTextColor="#A89F90"
              value={value ?? stockValue}
              onChangeText={onChange}
              keyboardType="number-pad"
              accessibilityLabel="Stock quantity"
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-base"
            />
          )}
        />
      </View>

      <View className="flex-row flex-wrap gap-2">
        {STOCK_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onBumpStock(preset)}
            className="press-scale bg-paper-100 border border-ink-200 rounded-pill px-3.5 py-1.5 active:bg-paper-200 flex-row items-center"
          >
            <FontAwesome name="plus" size={10} color="#623418" />
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-xs ml-1"
            >
              {preset}
            </StyledText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Update `components/inventory/products/form/index.ts`**

```ts
export * from './ProductFormHeader';
export * from './ProductFormActionButtons';
export * from './ProductBasicInfoCard';
export * from './ProductStockCard';
```

---

### Task 3: Create Shared Product Pricing Card

**Files:**

- Create: `components/inventory/products/form/ProductPricingCard.tsx`
- Modify: `components/inventory/products/form/index.ts`

**Interfaces:**

- Consumes: React Hook Form `Control`, `tryParsePesosInput`, `calculateWholesaleSavings`, `formatPesos`.
- Produces: `ProductPricingCard`.

- [ ] **Step 1: Create `ProductPricingCard.tsx`**

```tsx
import { FontAwesome } from '@expo/vector-icons';
import type { RefObject } from 'react';
import { Control, Controller } from 'react-hook-form';
import { Pressable, TextInput, View } from 'react-native';
import { StyledText } from '@/components/elements';
import {
  calculateWholesaleSavings,
  formatPesos,
  tryParsePesosInput,
} from '@/lib';

export const MARKUP_PRESETS = [0.1, 0.2, 0.3, 0.5] as const;
export type MarkupPreset = (typeof MARKUP_PRESETS)[number];

interface ProductPricingCardProps {
  control: Control<any>;
  costPerPiece: string;
  price: string;
  useBundlePricing?: boolean;
  onToggleBundlePricing?: () => void;
  onApplyMarkupPreset: (markup: MarkupPreset) => void;
  profitPerPiece: number;
  markupPercent: number;
  isLossWarning: boolean;
  priceInputRef?: RefObject<TextInput | null>;
  enableWholesale?: boolean;
  onToggleWholesale?: () => void;
  retailUnitName?: string;
  wholesaleUnitName?: string;
  conversionFactor?: string;
  wholesalePrice?: string;
  wholesaleCostPrice?: string;
}

export function ProductPricingCard({
  control,
  costPerPiece,
  price,
  useBundlePricing = false,
  onToggleBundlePricing,
  onApplyMarkupPreset,
  profitPerPiece,
  markupPercent,
  isLossWarning,
  priceInputRef,
  enableWholesale = false,
  onToggleWholesale,
  retailUnitName = 'Pc',
  wholesaleUnitName = 'Case',
  conversionFactor = '12',
  wholesalePrice = '',
  wholesaleCostPrice = '',
}: ProductPricingCardProps) {
  const hasCost = !!costPerPiece && costPerPiece !== '0.00';
  const hasPrice = !!price && price !== '0.00';

  const retailPriceVal = tryParsePesosInput(price);
  const wholesalePriceVal = wholesalePrice
    ? tryParsePesosInput(wholesalePrice)
    : 0;
  const conversionFactorNum = conversionFactor
    ? parseInt(conversionFactor, 10)
    : 0;
  const savings = calculateWholesaleSavings(
    retailPriceVal,
    wholesalePriceVal,
    conversionFactorNum,
  );

  return (
    <View className="bg-paper-50 rounded-2xl border border-dashed border-ink-300 p-4">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <StyledText variant="black" className="label-caps text-cinnamon-500">
            Pricing & Profit
          </StyledText>
          <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
            Set your cost, choose a markup, lock in the price
          </StyledText>
        </View>

        {onToggleBundlePricing && (
          <Pressable
            onPress={onToggleBundlePricing}
            accessibilityRole="switch"
            accessibilityState={{ checked: useBundlePricing }}
            hitSlop={8}
            className="press-scale flex-row items-center bg-paper-100 border border-ink-200 rounded-pill px-3 py-1.5 active:opacity-70"
          >
            <FontAwesome
              name={useBundlePricing ? 'cube' : 'tag'}
              size={11}
              color="#564E45"
            />
            <StyledText
              variant="extrabold"
              className="label-caps text-ink-700 ml-1.5"
            >
              {useBundlePricing ? 'Bundle' : 'Single'}
            </StyledText>
          </Pressable>
        )}
      </View>

      {useBundlePricing ? (
        <>
          <View className="mb-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Total Bundle Cost
            </StyledText>
            <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-700 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="bundleCost"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#A89F90"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    className="flex-1 text-ink-900 text-base"
                  />
                )}
              />
            </View>
          </View>

          <View className="mb-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Pieces per Bundle
            </StyledText>
            <Controller
              control={control}
              name="piecesPerBundle"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="10"
                  placeholderTextColor="#A89F90"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 text-ink-900 text-base"
                />
              )}
            />
          </View>

          <View className="mb-3">
            <StyledText
              variant="semibold"
              className="text-ink-900 text-sm mb-2"
            >
              Cost per Piece
            </StyledText>
            <View className="bg-paper-100/60 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center opacity-70">
              <StyledText
                variant="extrabold"
                className="text-ink-500 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="costPerPiece"
                render={({ field: { value } }) => (
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#A89F90"
                    value={value ?? costPerPiece}
                    editable={false}
                    className="flex-1 text-ink-700 text-base"
                  />
                )}
              />
            </View>
          </View>
        </>
      ) : (
        <View className="mb-3">
          <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
            Cost Price (per piece)
          </StyledText>
          <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
            <StyledText
              variant="extrabold"
              className="text-ink-700 text-base mr-2"
            >
              ₱
            </StyledText>
            <Controller
              control={control}
              name="costPerPiece"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#A89F90"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="decimal-pad"
                  className="flex-1 text-ink-900 text-base"
                />
              )}
            />
          </View>
        </View>
      )}

      <View className="mb-4">
        <StyledText variant="medium" className="text-ink-400 text-xs mb-2">
          QUICK MARKUP
        </StyledText>
        <View className="flex-row flex-wrap gap-2">
          {MARKUP_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => onApplyMarkupPreset(preset)}
              className="press-scale bg-paper-100 border border-ink-200 rounded-pill px-3 py-1.5 active:bg-paper-200"
            >
              <StyledText
                variant="extrabold"
                className="text-cinnamon-600 text-xs"
              >
                +{(preset * 100).toFixed(0)}%
              </StyledText>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-1">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          Selling Price (per piece){' '}
          <StyledText className="text-persimmon-500">*</StyledText>
        </StyledText>
        <View className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3 flex-row items-center">
          <StyledText
            variant="extrabold"
            className="text-ink-700 text-base mr-2"
          >
            ₱
          </StyledText>
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange } }) => (
              <TextInput
                ref={priceInputRef}
                placeholder="0.00"
                placeholderTextColor="#A89F90"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                className="flex-1 text-ink-900 text-base"
              />
            )}
          />
        </View>

        {isLossWarning && (
          <View className="mt-2 flex-row items-center bg-semantic-warning/10 rounded-xl px-3 py-2 border border-semantic-warning/20">
            <FontAwesome
              name="exclamation-triangle"
              size={12}
              color="#C77B0E"
            />
            <StyledText
              variant="semibold"
              className="text-semantic-warning text-xs ml-2 flex-1"
            >
              Selling price is below or equal to cost price
            </StyledText>
          </View>
        )}
      </View>

      {hasCost && hasPrice && (
        <View className="mt-4 bg-sage-50 border border-sage-100 rounded-xl px-4 py-3">
          <StyledText variant="black" className="label-caps text-sage-600">
            Profit Receipt
          </StyledText>
          <View className="flex-row items-end justify-between mt-2">
            <View>
              <StyledText
                variant="medium"
                className="text-sage-600 text-xs mb-0.5"
              >
                Profit per piece
              </StyledText>
              <StyledText variant="extrabold" className="text-sage-600 text-h2">
                ₱
                {profitPerPiece.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </StyledText>
            </View>
            <View className="items-end">
              <StyledText
                variant="medium"
                className="text-sage-600 text-xs mb-0.5"
              >
                Markup
              </StyledText>
              <StyledText variant="extrabold" className="text-sage-600 text-h2">
                {markupPercent.toFixed(1)}%
              </StyledText>
            </View>
          </View>
        </View>
      )}

      <View className="mt-6 pt-4 border-t border-ink-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-3">
            <StyledText
              variant="black"
              className="label-caps text-cinnamon-500"
            >
              Wholesale (Pakyaw) Tier
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-400 text-xs mt-0.5"
            >
              Offer bulk pricing for suki & bulk buyers
            </StyledText>
          </View>
          {onToggleWholesale && (
            <Pressable
              onPress={onToggleWholesale}
              className={`press-scale flex-row items-center border rounded-pill px-3 py-1.5 ${
                enableWholesale
                  ? 'bg-cinnamon-500 border-cinnamon-600'
                  : 'bg-paper-100 border-ink-200'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`label-caps ${enableWholesale ? 'text-white' : 'text-ink-700'}`}
              >
                {enableWholesale ? 'Enabled' : 'Disabled'}
              </StyledText>
            </Pressable>
          )}
        </View>

        {enableWholesale && (
          <View className="mt-2 space-y-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-xs mb-1"
                >
                  Tingi Unit (Retail)
                </StyledText>
                <Controller
                  control={control}
                  name="retailUnitName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      placeholder="Pc, Pack"
                      placeholderTextColor="#A89F90"
                      value={value}
                      onChangeText={onChange}
                      className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-xs mb-1"
                >
                  Pakyaw Unit (Bulk)
                </StyledText>
                <Controller
                  control={control}
                  name="wholesaleUnitName"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      placeholder="Case, Box"
                      placeholderTextColor="#A89F90"
                      value={value}
                      onChangeText={onChange}
                      className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                    />
                  )}
                />
              </View>
            </View>

            <View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-xs mb-1"
              >
                Pieces per Pakyaw Unit
              </StyledText>
              <Controller
                control={control}
                name="conversionFactor"
                render={({ field: { value, onChange } }) => (
                  <TextInput
                    placeholder="12, 24, etc."
                    placeholderTextColor="#A89F90"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 text-ink-900 text-sm"
                  />
                )}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-xs mb-1"
                >
                  Pakyaw Selling Price
                </StyledText>
                <View className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 flex-row items-center">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-700 text-sm mr-1"
                  >
                    ₱
                  </StyledText>
                  <Controller
                    control={control}
                    name="wholesalePrice"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#A89F90"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                        className="flex-1 text-ink-900 text-sm"
                      />
                    )}
                  />
                </View>
              </View>

              <View className="flex-1">
                <StyledText
                  variant="semibold"
                  className="text-ink-900 text-xs mb-1"
                >
                  Pakyaw Cost Price
                </StyledText>
                <View className="bg-paper-100 border border-ink-200 rounded-xl px-3 py-2.5 flex-row items-center">
                  <StyledText
                    variant="extrabold"
                    className="text-ink-700 text-sm mr-1"
                  >
                    ₱
                  </StyledText>
                  <Controller
                    control={control}
                    name="wholesaleCostPrice"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#A89F90"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="decimal-pad"
                        className="flex-1 text-ink-900 text-sm"
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            {savings && (
              <View className="mt-3 rounded-xl bg-cinnamon-50 dark:bg-cinnamon-950/30 p-3.5 border border-cinnamon-200/50">
                <StyledText
                  variant="medium"
                  className="text-cinnamon-800 dark:text-cinnamon-200 text-xs"
                >
                  Selling at wholesale price ({formatPesos(wholesalePriceVal)}/
                  {wholesaleUnitName}) is equivalent to{' '}
                  {formatPesos(savings.equivalentRetailPrice)} per{' '}
                  {retailUnitName} (saving customer{' '}
                  {formatPesos(savings.savingsPerPiece)} or{' '}
                  {savings.savingsPercent}%).
                </StyledText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Update `components/inventory/products/form/index.ts`**

```ts
export * from './ProductFormHeader';
export * from './ProductFormActionButtons';
export * from './ProductBasicInfoCard';
export * from './ProductStockCard';
export * from './ProductPricingCard';
```

---

### Task 4: Upgrade `useEditProductForm.ts`

**Files:**

- Modify: `components/inventory/edit-product/useEditProductForm.ts`

**Interfaces:**

- Consumes: `useBarcodeResolver`, `useProducts`, `useCategories`, `useGetProduct`.
- Produces: Complete form state for barcode scanner, barcode conflict detection, bundle cost mode, quick markup presets, stock adjustment, and non-blocking loss validation.

- [ ] **Step 1: Update `useEditProductForm.ts`**

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import {
  useBarcodeResolver,
  useCategories,
  useGetProduct,
  useProducts,
} from '@/hooks';
import {
  applyBarcodeToAddProductForm,
  parsePesosInput,
  tryParsePesosInput,
} from '@/lib';
import { useToastStore } from '@/stores';
import {
  MARKUP_PRESETS,
  MarkupPreset,
} from '../products/form/ProductPricingCard';

export interface EditProductFormData {
  name: string;
  sku: string;
  barcode: string;
  costPerPiece: string;
  price: string;
  initialStock: string;
  category: string;
  supplier_id: string;
  imageUri: string;
  bundleCost: string;
  piecesPerBundle: string;
  enableWholesale: boolean;
  retailUnitName: string;
  wholesaleUnitName: string;
  conversionFactor: string;
  wholesalePrice: string;
  wholesaleCostPrice: string;
  wholesaleBarcode: string;
}

const safeTrim = (s?: string) => (s ?? '').trim();

export function useEditProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id, 10);

  const { updateProductMutation, deleteProductMutation, getAllProductsQuery } =
    useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;
  const { data: product, isLoading } = useGetProduct(productId);
  const addToast = useToastStore((state) => state.addToast);
  const { resolve } = useBarcodeResolver();

  const [useBundlePricing, setUseBundlePricing] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isDirty },
  } = useForm<EditProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      costPerPiece: '',
      price: '',
      initialStock: '',
      category: '',
      supplier_id: '',
      imageUri: '',
      bundleCost: '',
      piecesPerBundle: '',
      enableWholesale: false,
      retailUnitName: 'Pc',
      wholesaleUnitName: 'Case',
      conversionFactor: '12',
      wholesalePrice: '',
      wholesaleCostPrice: '',
      wholesaleBarcode: '',
    },
    values: product
      ? {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || '',
          costPerPiece: product.cost_price ? product.cost_price.toString() : '',
          price: product.price.toString(),
          initialStock: product.quantity.toString(),
          category: product.category || '',
          supplier_id: product.supplier_id || '',
          imageUri: product.image_uri || '',
          bundleCost: '',
          piecesPerBundle: '',
          enableWholesale: !!(
            product.wholesale_unit_name &&
            product.conversion_factor &&
            product.conversion_factor > 1
          ),
          retailUnitName: product.retail_unit_name || 'Pc',
          wholesaleUnitName: product.wholesale_unit_name || 'Case',
          conversionFactor: product.conversion_factor
            ? product.conversion_factor.toString()
            : '12',
          wholesalePrice: product.wholesale_price
            ? product.wholesale_price.toString()
            : '',
          wholesaleCostPrice: product.wholesale_cost_price
            ? product.wholesale_cost_price.toString()
            : '',
          wholesaleBarcode: product.wholesale_barcode || '',
        }
      : undefined,
  });

  const name = useWatch({ control, name: 'name' });
  const sku = useWatch({ control, name: 'sku' });
  const barcode = useWatch({ control, name: 'barcode' });
  const costPerPiece = useWatch({ control, name: 'costPerPiece' });
  const price = useWatch({ control, name: 'price' });
  const initialStock = useWatch({ control, name: 'initialStock' });
  const category = useWatch({ control, name: 'category' });
  const supplierId = useWatch({ control, name: 'supplier_id' });
  const imageUri = useWatch({ control, name: 'imageUri' });
  const bundleCost = useWatch({ control, name: 'bundleCost' });
  const piecesPerBundle = useWatch({ control, name: 'piecesPerBundle' });
  const enableWholesale = useWatch({ control, name: 'enableWholesale' });
  const retailUnitName = useWatch({ control, name: 'retailUnitName' });
  const wholesaleUnitName = useWatch({ control, name: 'wholesaleUnitName' });
  const conversionFactor = useWatch({ control, name: 'conversionFactor' });
  const wholesalePrice = useWatch({ control, name: 'wholesalePrice' });
  const wholesaleCostPrice = useWatch({ control, name: 'wholesaleCostPrice' });
  const wholesaleBarcode = useWatch({ control, name: 'wholesaleBarcode' });

  const existingProducts = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const trimmedBarcode = safeTrim(barcode);
  const barcodeConflictProduct = useMemo(() => {
    if (!trimmedBarcode) return null;
    return (
      existingProducts.find(
        (p) =>
          p.id !== productId &&
          ((p.barcode != null && p.barcode === trimmedBarcode) ||
            (p.wholesale_barcode != null &&
              p.wholesale_barcode === trimmedBarcode) ||
            p.sku === trimmedBarcode),
      ) ?? null
    );
  }, [trimmedBarcode, existingProducts, productId]);

  const isBarcodeDuplicate = barcodeConflictProduct != null;

  const parsedCost = costPerPiece ? tryParsePesosInput(costPerPiece) : 0;
  const parsedPrice = price ? tryParsePesosInput(price) : 0;
  const profitPerPiece = parsedPrice - parsedCost;
  const markupPercent =
    parsedCost > 0 && parsedPrice > 0
      ? ((parsedPrice - parsedCost) / parsedCost) * 100
      : 0;
  const isLossWarning =
    parsedCost > 0 && parsedPrice > 0 && parsedPrice <= parsedCost;

  const isSubmitDisabled =
    updateProductMutation.isPending ||
    !safeTrim(name) ||
    !price ||
    parsedPrice <= 0 ||
    isBarcodeDuplicate;

  const applyMarkupPreset = useCallback(
    (markup: MarkupPreset) => {
      if (parsedCost <= 0) return;
      const calculated = parsedCost * (1 + markup);
      setValue('price', calculated.toFixed(2), { shouldDirty: true });
    },
    [parsedCost, setValue],
  );

  const bumpStock = useCallback(
    (delta: number) => {
      const current = parseInt(initialStock ?? '0', 10);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + delta);
      setValue('initialStock', String(next), { shouldDirty: true });
    },
    [initialStock, setValue],
  );

  const selectCategory = useCallback(
    (next: string) => {
      setValue('category', category === next ? '' : next, {
        shouldDirty: true,
      });
    },
    [category, setValue],
  );

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);

  const handleScannedBarcode = useCallback(
    async (barcodeValue: string) => {
      const result = await resolve(barcodeValue);
      setValue('barcode', safeTrim(barcodeValue), { shouldDirty: true });
      setIsScannerOpen(false);
    },
    [resolve, setValue],
  );

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardModal(false);
    router.back();
  }, []);

  const submit = handleSubmit(async (data) => {
    const priceValue = parsePesosInput(data.price);
    const stockValue = data.initialStock
      ? parseInt(data.initialStock, 10)
      : product?.quantity || 0;
    const costPriceValue = data.costPerPiece
      ? parsePesosInput(data.costPerPiece)
      : undefined;
    const barcodeVal = safeTrim(data.barcode);

    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        name: safeTrim(data.name),
        sku: safeTrim(data.sku),
        price: priceValue,
        quantity: Number.isFinite(stockValue)
          ? stockValue
          : product?.quantity || 0,
        cost_price: costPriceValue,
        category: safeTrim(data.category) || undefined,
        barcode: barcodeVal || null,
        supplier_id: data.supplier_id ? data.supplier_id : null,
        image_uri: data.imageUri ? safeTrim(data.imageUri) : null,
        retail_unit_name: safeTrim(data.retailUnitName) || 'Pc',
        wholesale_unit_name: data.enableWholesale
          ? safeTrim(data.wholesaleUnitName) || null
          : null,
        wholesale_price:
          data.enableWholesale && data.wholesalePrice
            ? parsePesosInput(data.wholesalePrice)
            : null,
        wholesale_cost_price:
          data.enableWholesale && data.wholesaleCostPrice
            ? parsePesosInput(data.wholesaleCostPrice)
            : null,
        conversion_factor:
          data.enableWholesale && data.conversionFactor
            ? parseInt(data.conversionFactor, 10)
            : null,
        wholesale_barcode:
          data.enableWholesale && safeTrim(data.wholesaleBarcode)
            ? safeTrim(data.wholesaleBarcode)
            : null,
      });
      router.back();
    } catch {
      // Surfaced by mutation state
    }
  });

  return {
    product,
    isLoading,
    categories,
    control,
    setValue,
    name,
    sku,
    barcode,
    costPerPiece,
    price,
    initialStock,
    category,
    supplierId,
    enableWholesale,
    retailUnitName,
    wholesaleUnitName,
    conversionFactor,
    wholesalePrice,
    wholesaleCostPrice,
    wholesaleBarcode,
    useBundlePricing,
    setUseBundlePricing,
    showDiscardModal,
    setShowDiscardModal,
    showDeleteModal,
    openDeleteModal: () => setShowDeleteModal(true),
    cancelDelete: () => setShowDeleteModal(false),
    confirmDelete: async () => {
      setShowDeleteModal(false);
      await deleteProductMutation.mutateAsync(productId);
      router.replace('/inventory');
    },
    isScannerOpen,
    openScanner,
    closeScanner,
    handleScannedBarcode,
    profitPerPiece,
    markupPercent,
    isLossWarning,
    isBarcodeDuplicate,
    barcodeConflictProduct,
    isSubmitDisabled,
    applyMarkupPreset,
    bumpStock,
    selectCategory,
    handleBack,
    confirmDiscard,
    submit,
    updateProductMutation,
    deleteProductMutation,
  };
}
```

---

### Task 5: Refactor `/add-product/index.tsx` and `/edit-product/[id].tsx`

**Files:**

- Modify: `app/(edit-forms)/add-product/index.tsx`
- Modify: `app/(edit-forms)/edit-product/[id].tsx`

**Interfaces:**

- Consumes: Shared components from `components/inventory/products/form/`.
- Produces: Unified Add & Edit product screens matching UI design and feature set.

- [ ] **Step 1: Refactor `app/(edit-forms)/add-product/index.tsx`**

```tsx
import { View, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import { BarcodeScannerModal, Modal } from '@/components/ui';
import {
  ProductFormHeader,
  ProductBasicInfoCard,
  ProductPricingCard,
  ProductStockCard,
  ProductFormActionButtons,
} from '@/components/inventory/products/form';
import { useAddProductForm } from '@/components/inventory/products/add-product';

export default function AddProduct() {
  const form = useAddProductForm();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ProductFormHeader
          title="Add Product"
          subtitle="Item Registry"
          onBack={form.confirmDiscard}
        />

        <View className="px-4">
          <ProductBasicInfoCard
            mode="add"
            control={form.control}
            sku={form.sku}
            autoGenerateSku={form.autoGenerateSku}
            onToggleAutoGenerateSku={() =>
              form.setAutoGenerateSku(!form.autoGenerateSku)
            }
            categories={form.categories}
            selectedCategory={form.category}
            onSelectCategory={form.selectCategory}
            onPressScan={form.openScanner}
            barcode={form.barcode}
            barcodeConflictProduct={form.barcodeConflictProduct}
            onPressEditConflictingProduct={(productId) =>
              router.push(`/(edit-forms)/edit-product/${productId}` as any)
            }
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <ProductPricingCard
            control={form.control as any}
            costPerPiece={form.costPerPiece}
            price={form.price}
            useBundlePricing={form.useBundlePricing}
            onToggleBundlePricing={() =>
              form.setUseBundlePricing(!form.useBundlePricing)
            }
            onApplyMarkupPreset={form.applyMarkupPreset}
            profitPerPiece={form.profitPerPiece}
            markupPercent={form.markupPercent}
            isLossWarning={form.isLossWarning}
            priceInputRef={form.priceInputRef}
            enableWholesale={form.enableWholesale}
            onToggleWholesale={() =>
              form.setValue('enableWholesale', !form.enableWholesale, {
                shouldDirty: true,
              })
            }
            retailUnitName={form.retailUnitName}
            wholesaleUnitName={form.wholesaleUnitName}
            conversionFactor={form.conversionFactor}
            wholesalePrice={form.wholesalePrice}
            wholesaleCostPrice={form.wholesaleCostPrice}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <ProductStockCard
            control={form.control}
            stockValue={form.initialStock}
            onBumpStock={form.bumpStock}
          />

          <ProductFormActionButtons
            submitLabel="Add Product"
            disabled={form.isSubmitDisabled}
            isPending={form.insertProductMutation.isPending}
            onSubmit={form.submit}
            onCancel={form.confirmDiscard}
          />
        </View>
      </KeyboardAwareScrollView>

      <Modal
        visible={form.showDialog}
        onClose={() => form.setShowDialog(false)}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        buttons={[
          {
            text: "Don't Leave",
            style: 'cancel',
            onPress: () => form.setShowDialog(false),
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              form.setShowDialog(false);
              router.back();
            },
          },
        ]}
      />

      <BarcodeScannerModal
        visible={form.isScannerOpen}
        mode="single"
        onClose={form.closeScanner}
        onScan={form.handleScannedBarcode}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Refactor `app/(edit-forms)/edit-product/[id].tsx`**

```tsx
import { View, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import { BarcodeScannerModal, Modal } from '@/components/ui';
import {
  ProductFormHeader,
  ProductBasicInfoCard,
  ProductPricingCard,
  ProductStockCard,
  ProductFormActionButtons,
} from '@/components/inventory/products/form';
import {
  EditDangerZone,
  EditProductSkeleton,
  ProductMetaCard,
  ProductNotFound,
  useEditProductForm,
} from '@/components/inventory/edit-product';

export default function EditProduct() {
  const form = useEditProductForm();

  if (form.isLoading) return <EditProductSkeleton />;
  if (!form.product) return <ProductNotFound onBack={form.handleBack} />;

  const { product } = form;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ProductFormHeader
          title="Edit Product"
          subtitle="Inventory"
          onBack={form.handleBack}
        />

        <View className="px-4">
          <ProductBasicInfoCard
            mode="edit"
            control={form.control}
            sku={form.sku}
            categories={form.categories}
            selectedCategory={form.category}
            onSelectCategory={form.selectCategory}
            onPressScan={form.openScanner}
            barcode={form.barcode}
            barcodeConflictProduct={form.barcodeConflictProduct}
            onPressEditConflictingProduct={(productId) =>
              router.push(`/(edit-forms)/edit-product/${productId}` as any)
            }
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <ProductPricingCard
            control={form.control as any}
            costPerPiece={form.costPerPiece}
            price={form.price}
            useBundlePricing={form.useBundlePricing}
            onToggleBundlePricing={() =>
              form.setUseBundlePricing(!form.useBundlePricing)
            }
            onApplyMarkupPreset={form.applyMarkupPreset}
            profitPerPiece={form.profitPerPiece}
            markupPercent={form.markupPercent}
            isLossWarning={form.isLossWarning}
            enableWholesale={form.enableWholesale}
            onToggleWholesale={() =>
              form.setValue('enableWholesale', !form.enableWholesale, {
                shouldDirty: true,
              })
            }
            retailUnitName={form.retailUnitName}
            wholesaleUnitName={form.wholesaleUnitName}
            conversionFactor={form.conversionFactor}
            wholesalePrice={form.wholesalePrice}
            wholesaleCostPrice={form.wholesaleCostPrice}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <ProductStockCard
            control={form.control}
            stockValue={form.initialStock}
            onBumpStock={form.bumpStock}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <ProductMetaCard
            createdAt={product.created_at}
            updatedAt={product.updated_at}
          />

          <View className="mt-6 mb-2">
            <EditDangerZone onDelete={form.openDeleteModal} />
          </View>

          <ProductFormActionButtons
            submitLabel="Save Changes"
            disabled={form.isSubmitDisabled}
            isPending={form.updateProductMutation.isPending}
            onSubmit={form.submit}
            onCancel={form.handleBack}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Discard confirmation */}
      <Modal
        visible={form.showDiscardModal}
        onClose={() => form.setShowDiscardModal(false)}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        buttons={[
          {
            text: "Don't Leave",
            style: 'cancel',
            onPress: () => form.setShowDiscardModal(false),
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: form.confirmDiscard,
          },
        ]}
      />

      {/* Delete confirmation */}
      <Modal
        visible={form.showDeleteModal}
        onClose={form.cancelDelete}
        variant="danger"
        title="Delete Product?"
        description={`Are you sure you want to delete "${product.name}"?\nThis action cannot be undone.`}
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: form.cancelDelete },
          {
            text: 'Yes, Delete Product',
            style: 'destructive',
            onPress: form.confirmDelete,
          },
        ]}
        loading={form.deleteProductMutation.isPending}
      />

      <BarcodeScannerModal
        visible={form.isScannerOpen}
        mode="single"
        onClose={form.closeScanner}
        onScan={form.handleScannedBarcode}
      />
    </SafeAreaView>
  );
}
```

---

### Task 6: Verification & Cleanup

**Files:**

- Run: `npm run typecheck`
- Run: `npm test`

- [ ] **Step 1: Execute typecheck**

Run `npx tsc --noEmit` and ensure zero errors introduced in product forms.

- [ ] **Step 2: Execute unit tests**

Run `npm test` and verify test suite passes cleanly.
