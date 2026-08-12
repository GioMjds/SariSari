import { useState, useMemo, useRef, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import type { Product } from '@/types/products.types';

interface CategoryFormData {
  name: string;
}

type ProductFilterType = 'all' | 'uncategorized' | 'categorized';

export default function AddCategoryScreen() {
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilterType>('all');
  const [isNameFocused, setIsNameFocused] = useState(false);

  const nameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const searchInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const { insertCategoryMutation, getAllCategoriesQuery } = useCategories();
  const existingCategories = useMemo(
    () => getAllCategoriesQuery.data ?? [],
    [getAllCategoriesQuery.data],
  );
  const { getAllProductsQuery } = useProducts();
  const allProducts = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );
  const isProductsLoading = getAllProductsQuery.isLoading;
  const isProductsError = getAllProductsQuery.isError;
  const isSubmitting = insertCategoryMutation.isPending;

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (productFilter === 'uncategorized') {
      result = result.filter((p) => !p.category);
    } else if (productFilter === 'categorized') {
      result = result.filter((p) => Boolean(p.category));
    }

    if (!productSearch.trim()) return result;
    const term = productSearch.trim().toLowerCase();
    return result.filter((p) => p.name.toLowerCase().includes(term));
  }, [allProducts, productSearch, productFilter]);

  const uncategorizedProducts = useMemo(
    () => allProducts.filter((p) => !p.category),
    [allProducts],
  );

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid, errors },
  } = useForm<CategoryFormData>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const confirmDiscard = useCallback(() => {
    if (isDirty || selectedProductIds.length > 0) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  }, [isDirty, selectedProductIds.length]);

  const toggleProductSelection = useCallback(
    (productId: number) => {
      if (isSubmitting) return;
      setSelectedProductIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId],
      );
    },
    [isSubmitting],
  );

  const handleSelectAllUncategorized = useCallback(() => {
    if (isSubmitting) return;
    const uncategorizedIds = uncategorizedProducts.map((p) => p.id);
    const allSelected = uncategorizedIds.every((id) =>
      selectedProductIds.includes(id),
    );

    if (allSelected) {
      setSelectedProductIds((prev) =>
        prev.filter((id) => !uncategorizedIds.includes(id)),
      );
    } else {
      setSelectedProductIds((prev) =>
        Array.from(new Set([...prev, ...uncategorizedIds])),
      );
    }
  }, [isSubmitting, uncategorizedProducts, selectedProductIds]);

  const onSubmit = (data: CategoryFormData) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;

    insertCategoryMutation.mutate({
      name: trimmedName,
      productIds: selectedProductIds,
    });
  };

  const bottomInsetBuffer = Math.max(insets.bottom + 8, 16);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header Card */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={confirmDiscard}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={t('goBack', 'Go back')}
            hitSlop={12}
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70 disabled:opacity-50"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>

          <View className="items-center">
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-h2 font-stack-sans-bold"
            >
              {t('addCategory', 'Add Category')}
            </StyledText>
            <StyledText
              variant="medium"
              className="label-caps text-ink-400 mt-0.5"
            >
              Category Registry
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Scrollable form content */}
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-4 mt-2">
          {/* Context Banner */}
          <View className="rounded-2xl overflow-hidden shadow-paper bg-cinnamon-50 p-4 mb-3 border border-cinnamon-100">
            <View className="flex-row items-center gap-3">
              <View className="bg-cinnamon-100 w-10 h-10 rounded-full items-center justify-center">
                <FontAwesome name="tags" size={16} color="#D49570" />
              </View>
              <View className="flex-1">
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-900 text-base font-stack-sans-bold"
                >
                  {t('categoryContextTitle', 'Category Grouping')}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-cinnamon-700 text-xs mt-0.5 leading-relaxed"
                >
                  {t(
                    'addCategoryLead',
                    'Group products together so reports and inventory stay easy to scan.',
                  )}
                </StyledText>
              </View>
            </View>
          </View>

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Basic Category Info Card */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 my-2">
            <View className="mb-3">
              <StyledText
                variant="black"
                className="label-caps text-cinnamon-500"
              >
                {t('categoryBasicInfo', 'Category Info')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs mt-0.5"
              >
                {t(
                  'categoryBasicInfoDesc',
                  'Name and primary details for this category',
                )}
              </StyledText>
            </View>

            <Controller
              control={control}
              rules={{
                required: t(
                  'categoryNameRequired',
                  'Category name is required',
                ),
                validate: {
                  notBlank: (val) =>
                    val.trim().length > 0 ||
                    t('categoryNameBlank', 'Category name cannot be blank'),
                  uniqueName: (val) => {
                    const trimmed = val.trim().toLowerCase();
                    const exists = existingCategories.some(
                      (c) => c.name.toLowerCase() === trimmed,
                    );
                    return (
                      !exists ||
                      t(
                        'categoryNameDuplicate',
                        'A category with this name already exists',
                      )
                    );
                  },
                },
              }}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-sm mb-2 font-stack-sans-semibold"
                  >
                    {t('labelName', 'Category Name')}{' '}
                    <StyledText
                      variant="semibold"
                      className="text-persimmon-500"
                    >
                      *
                    </StyledText>
                  </StyledText>

                  <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                      <FontAwesome
                        name="folder"
                        size={16}
                        color={
                          errors.name
                            ? '#E85A1F'
                            : isNameFocused
                              ? '#E85A1F'
                              : '#564E45'
                        }
                      />
                    </View>
                    <TextInput
                      ref={nameInputRef}
                      placeholder={t(
                        'categoryNamePlaceholder',
                        'e.g. Beverages',
                      )}
                      placeholderTextColor="#7A7165"
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => {
                        onBlur();
                        setIsNameFocused(false);
                      }}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                      returnKeyType="done"
                      accessibilityLabel={t('labelName', 'Category Name')}
                      accessibilityHint={t(
                        'categoryNameHint',
                        'Enter a short, unique name for this category.',
                      )}
                      className={`text-ink-900 text-base border rounded-xl pl-11 pr-11 py-3.5 font-stack-sans ${
                        errors.name
                          ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                          : isNameFocused
                            ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                            : 'bg-paper-100 border-ink-200 shadow-none'
                      }`}
                    />
                    {value.length > 0 && (
                      <Pressable
                        onPress={() => onChange('')}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          'clearField',
                          'Clear category name field',
                        )}
                        className="absolute right-4 z-10 p-1 active:opacity-70 disabled:opacity-50"
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                      >
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color="#7A7165"
                        />
                      </Pressable>
                    )}
                  </View>

                  {errors.name ? (
                    <StyledText
                      variant="medium"
                      className="text-persimmon-500 text-xs mt-1.5 px-1"
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                    >
                      {errors.name.message}
                    </StyledText>
                  ) : (
                    <StyledText
                      variant="regular"
                      className="text-ink-500 text-xs mt-1.5 px-1"
                    >
                      {t(
                        'categoryNameHelper',
                        'Use a short, clear name your team will recognize.',
                      )}
                    </StyledText>
                  )}
                </View>
              )}
            />
          </View>

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Assign Products Card */}
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 my-2">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <StyledText
                  variant="black"
                  className="label-caps text-cinnamon-500"
                >
                  {t('assignProductsTitle', 'Assign Products')}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs mt-0.5"
                >
                  {t('assignProductsMeta', '{{count}} selected').replace(
                    '{{count}}',
                    String(selectedProductIds.length),
                  )}
                </StyledText>
              </View>
            </View>

            {/* Quick Action: Select Uncategorized */}
            {uncategorizedProducts.length > 0 && (
              <View className="flex-row items-center justify-between mb-3 p-2.5 bg-paper-100 rounded-xl border border-paper-200">
                <StyledText
                  variant="regular"
                  className="text-ink-700 text-xs font-stack-sans-medium"
                >
                  {t(
                    'uncategorizedCount',
                    '{{count}} uncategorized products',
                  ).replace('{{count}}', String(uncategorizedProducts.length))}
                </StyledText>
                <Pressable
                  onPress={handleSelectAllUncategorized}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    'toggleUncategorized',
                    'Select or deselect all uncategorized products',
                  )}
                  className="px-3 py-1.5 rounded-lg bg-persimmon-50 border border-persimmon-200 active:bg-persimmon-100"
                >
                  <StyledText
                    variant="semibold"
                    className="text-persimmon-600 text-xs font-stack-sans-semibold"
                  >
                    {uncategorizedProducts.every((p) =>
                      selectedProductIds.includes(p.id),
                    )
                      ? t('deselectUncategorized', 'Deselect Uncategorized')
                      : t('selectUncategorized', 'Select Uncategorized')}
                  </StyledText>
                </Pressable>
              </View>
            )}

            {/* Product search input */}
            <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3.5 py-2.5 mb-3">
              <FontAwesome
                name="search"
                size={14}
                color="#7A7165"
                style={{ marginRight: 8 }}
              />
              <TextInput
                ref={searchInputRef}
                className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
                placeholder={t('searchProducts', 'Search products…')}
                placeholderTextColor="#7A7165"
                value={productSearch}
                onChangeText={setProductSearch}
                editable={!isSubmitting}
                returnKeyType="search"
                blurOnSubmit={true}
                accessibilityLabel={t('searchProducts', 'Search products')}
              />
              {productSearch.length > 0 && (
                <Pressable
                  onPress={() => setProductSearch('')}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={t('clearSearch', 'Clear search')}
                  className="active:opacity-60 disabled:opacity-50"
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <FontAwesome name="times-circle" size={14} color="#7A7165" />
                </Pressable>
              )}
            </View>

            {/* Quick Filter Chips */}
            <View className="flex-row items-center gap-2 mb-3">
              <FilterChip
                label={t('filterAll', 'All')}
                active={productFilter === 'all'}
                onPress={() => setProductFilter('all')}
              />
              <FilterChip
                label={t('filterUncategorized', 'Uncategorized')}
                active={productFilter === 'uncategorized'}
                onPress={() => setProductFilter('uncategorized')}
              />
              <FilterChip
                label={t('filterCategorized', 'Categorized')}
                active={productFilter === 'categorized'}
                onPress={() => setProductFilter('categorized')}
              />
            </View>

            {/* Products List */}
            <View>
              {isProductsLoading ? (
                <View className="py-8 items-center gap-2">
                  <ActivityIndicator size="small" color="#E85A1F" />
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs"
                  >
                    {t('loadingProducts', 'Loading products…')}
                  </StyledText>
                </View>
              ) : isProductsError ? (
                <View className="py-6 items-center gap-3 bg-paper-100 rounded-xl p-4 border border-paper-300">
                  <StyledText
                    variant="medium"
                    className="text-persimmon-500 text-xs text-center"
                    accessibilityRole="alert"
                  >
                    {t(
                      'errorLoadingProducts',
                      'Could not load products. Please check connection and try again.',
                    )}
                  </StyledText>
                  <Pressable
                    onPress={() => getAllProductsQuery.refetch()}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      'retryLoadingProducts',
                      'Retry loading products',
                    )}
                    className="px-4 py-2 rounded-lg bg-persimmon-50 border border-persimmon-200 active:bg-persimmon-100"
                  >
                    <StyledText
                      variant="semibold"
                      className="text-persimmon-600 text-xs font-stack-sans-semibold"
                    >
                      {t('retry', 'Retry')}
                    </StyledText>
                  </Pressable>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View className="py-6 items-center">
                  <FontAwesome name="info-circle" size={18} color="#7A7165" />
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-xs text-center mt-1.5"
                  >
                    {allProducts.length === 0
                      ? t(
                          'noProductsAvailable',
                          'No products yet — you can add products after creating this category.',
                        )
                      : t('noProductsFound', 'No matching products found')}
                  </StyledText>
                </View>
              ) : (
                <View className="gap-1.5">
                  {filteredProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isSelected={selectedProductIds.includes(product.id)}
                      onToggle={toggleProductSelection}
                      disabled={isSubmitting}
                      t={t}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Raised Floating Bottom Action Dock — Clears System Navigation (3-button / swipe gesture bar) */}
      <View
        style={{ paddingBottom: bottomInsetBuffer }}
        className="px-4 pt-3 bg-paper-50 border-t border-ink-100 shadow-paper flex-row items-center gap-3 z-10"
      >
        <Pressable
          onPress={confirmDiscard}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('cancel', 'Cancel')}
          className="flex-1 py-3.5 rounded-xl items-center justify-center bg-paper-100 border border-ink-200 active:opacity-70 disabled:opacity-50"
        >
          <StyledText
            variant="semibold"
            className="text-ink-700 text-sm font-stack-sans-semibold"
          >
            {t('cancel', 'Cancel')}
          </StyledText>
        </Pressable>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('saveCategory', 'Save category')}
          accessibilityState={{
            disabled: !isValid || isSubmitting,
            busy: isSubmitting,
          }}
          className={`flex-[2] py-3.5 rounded-xl flex-row items-center justify-center ${
            !isValid || isSubmitting
              ? 'bg-ink-100 opacity-60 shadow-none'
              : 'bg-persimmon-500 shadow-persimmon-glow'
          }`}
          style={({ pressed }) => ({
            transform: [
              { scale: !isValid || isSubmitting ? 1 : pressed ? 0.98 : 1 },
            ],
          })}
        >
          <FontAwesome
            name={isSubmitting ? 'spinner' : 'plus'}
            size={14}
            color={!isValid || isSubmitting ? '#7A7165' : '#FBF7EE'}
          />
          <StyledText
            variant="extrabold"
            className={`text-sm font-stack-sans-bold ml-2 ${
              !isValid || isSubmitting ? 'text-ink-400' : 'text-paper-50'
            }`}
          >
            {isSubmitting
              ? t('saving', 'Saving Category…')
              : t('saveCategory', 'Add Category')}
          </StyledText>
        </Pressable>
      </View>

      {/* Discard Changes Dialog */}
      <Modal
        visible={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title={t('discardDialogTitle', 'Discard changes?')}
        description={t(
          'discardDialogDesc',
          'Are you sure you want to leave? Your unsaved category changes will be lost.',
        )}
        variant="warning"
        buttons={[
          {
            text: t('keepEditing', 'Keep Editing'),
            style: 'cancel',
            onPress: () => setShowDiscardDialog(false),
          },
          {
            text: t('discard', 'Discard'),
            style: 'destructive',
            onPress: () => {
              setShowDiscardDialog(false);
              router.back();
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}

// Filter chip component
const FilterChip = memo(function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`px-3.5 py-1.5 rounded-full border ${
        active
          ? 'bg-persimmon-500 border-persimmon-500'
          : 'bg-paper-100 border-ink-200 active:bg-paper-200'
      }`}
    >
      <StyledText
        variant="medium"
        className={`text-xs font-stack-sans-medium ${
          active ? 'text-paper-50 font-stack-sans-semibold' : 'text-ink-700'
        }`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
});

// Memoized Product Row Component
interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  onToggle: (id: number) => void;
  disabled?: boolean;
  t: (key: string, fallback: string) => string;
}

const ProductRow = memo(function ProductRow({
  product,
  isSelected,
  onToggle,
  disabled = false,
  t,
}: ProductRowProps) {
  const categoryText = product.category
    ? t('currentCategory', 'Current: {{category}}').replace(
        '{{category}}',
        product.category,
      )
    : t('currentCategoryUncategorized', 'Uncategorized');

  const priceText = formatPesos(product.price);

  return (
    <Pressable
      onPress={() => onToggle(product.id)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected, disabled }}
      accessibilityLabel={`${product.name}, ${priceText}, ${categoryText}`}
      accessibilityHint={t(
        'toggleProductHint',
        'Double tap to select or deselect this product for the category',
      )}
      className={`flex-row items-center justify-between p-3.5 rounded-xl border active:opacity-70 ${
        isSelected
          ? 'bg-persimmon-50 border-persimmon-300'
          : 'bg-paper-100 border-ink-100 active:bg-paper-200'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="flex-1 mr-3">
        <StyledText
          variant="semibold"
          className={`text-sm ${
            isSelected
              ? 'text-ink-900 font-stack-sans-bold'
              : 'text-ink-800 font-stack-sans-semibold'
          }`}
        >
          {product.name}
        </StyledText>
        <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5">
          {categoryText}
          {'  •  '}
          {priceText}
        </StyledText>
      </View>

      <View
        className={`w-6 h-6 rounded-md items-center justify-center border ${
          isSelected
            ? 'bg-persimmon-500 border-persimmon-500'
            : 'border-ink-300 bg-paper-50'
        }`}
      >
        {isSelected && <FontAwesome name="check" size={12} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
});
