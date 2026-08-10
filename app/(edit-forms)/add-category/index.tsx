import { useState, useMemo } from 'react';
import { View, Platform, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';

interface CategoryFormData {
  name: string;
}

export default function AddCategoryScreen() {
  const { t } = useTranslation('inventory');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');

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

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const term = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(term));
  }, [allProducts, productSearch]);

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid, errors },
  } = useForm<CategoryFormData>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const confirmDiscard = () => {
    if (isDirty || selectedProductIds.length > 0) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const onSubmit = (data: CategoryFormData) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;

    insertCategoryMutation.mutate(
      {
        name: trimmedName,
        productIds: selectedProductIds,
      },
      {
        onSuccess: () => {
          router.replace({
            pathname: '/(tabs)/inventory/products',
            params: { category: trimmedName },
          });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Persistent Top Header Bar */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={confirmDiscard}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
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
              {t('addCategorySubtitle', 'Create Product Category')}
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Scrollable Form Content */}
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-4 mt-2">
          <ContextBanner t={t} />

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Category Name Section */}
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper mt-3 mb-4">
            <View className="mb-4">
              <StyledText
                variant="black"
                className="label-caps text-cinnamon-500"
              >
                {t('categoryBasicInfo', 'Category Info')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-400 text-xs mt-0.5"
              >
                {t(
                  'categoryBasicInfoDesc',
                  'Pick a clear, short name to group your products.',
                )}
              </StyledText>
            </View>

            <View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-sm mb-2"
              >
                {t('labelName', 'Category Name')}{' '}
                <StyledText variant="semibold" className="text-persimmon-500">*</StyledText>
              </StyledText>
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
                    <View
                      className={`flex-row items-center border rounded-xl pl-11 pr-4 py-3.5 ${
                        errors.name
                          ? 'bg-white border-persimmon-500'
                          : focusedField === 'name'
                            ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                            : 'bg-paper-100 border-ink-200 shadow-none'
                      }`}
                    >
                      <View className="absolute left-4 z-10">
                        <FontAwesome
                          name="tag"
                          size={16}
                          color={
                            focusedField === 'name' ? '#E85A1F' : '#564E45'
                          }
                        />
                      </View>
                      <TextInput
                        className="flex-1 text-base text-ink-900 font-stack-sans p-0"
                        placeholder={t(
                          'categoryNamePlaceholder',
                          'e.g. Beverages',
                        )}
                        placeholderTextColor="#A89F90"
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => {
                          onBlur();
                          setFocusedField(null);
                        }}
                        autoCapitalize="words"
                        returnKeyType="done"
                        accessibilityLabel={t('labelName', 'Category Name')}
                        accessibilityHint={t(
                          'categoryNameHint',
                          'Enter a short, unique name for this category.',
                        )}
                      />
                      {value.length > 0 && (
                        <Pressable
                          onPress={() => onChange('')}
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'clearField',
                            'Clear category name field',
                          )}
                          className="p-1 active:opacity-70"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <FontAwesome
                            name="times-circle"
                            size={16}
                            color="#A89F90"
                          />
                        </Pressable>
                      )}
                    </View>
                    {errors.name && (
                      <StyledText
                        variant="medium"
                        className="text-persimmon-500 text-xs mt-1.5 px-1"
                        accessibilityRole="alert"
                        accessibilityLiveRegion="polite"
                      >
                        {errors.name.message}
                      </StyledText>
                    )}
                  </View>
                )}
              />
            </View>
          </View>

          <View className="my-1 border-t border-dashed border-ink-300" />
        </View>

        {/* Add Products Directly Section */}
        <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper mt-3 mb-4 space-y-3">
          <View className="flex-row items-center justify-between">
            <View>
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-base font-stack-sans-bold"
              >
                {t('assignProductsTitle', 'Assign Products Directly')}
              </StyledText>
              <StyledText
                variant="medium"
                className="text-ink-400 text-xs mt-0.5"
              >
                {t(
                  'assignProductsSubtitle',
                  'Select existing products to sort into this category ({{count}} selected)',
                ).replace('{{count}}', String(selectedProductIds.length))}
              </StyledText>
            </View>
          </View>

          {/* Product Search Input */}
          <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3 py-2">
            <FontAwesome
              name="search"
              size={14}
              color="#A39C96"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
              placeholder={t('searchProducts', 'Search products...')}
              placeholderTextColor="#A39C96"
              value={productSearch}
              onChangeText={setProductSearch}
              accessibilityLabel={t('searchProducts', 'Search products')}
            />
            {productSearch.length > 0 && (
              <Pressable
                onPress={() => setProductSearch('')}
                accessibilityRole="button"
                accessibilityLabel={t('clearSearch', 'Clear search')}
                className="active:opacity-70"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="times-circle" size={14} color="#A39C96" />
              </Pressable>
            )}
          </View>

          {/* Products List */}
          <View className="max-h-72 mt-2">
            {filteredProducts.length === 0 ? (
              <View className="py-4 items-center">
                <StyledText variant="medium" className="text-ink-400 text-xs">
                  {t('noProductsFound', 'No products found')}
                </StyledText>
              </View>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => toggleProductSelection(product.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${product.name}, ₱${formatPesos(product.price)}`}
                    className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${
                      isSelected
                        ? 'bg-persimmon-50 border-persimmon-300'
                        : 'bg-paper-100 border-ink-100'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-sm"
                      >
                        {product.name}
                      </StyledText>
                      <StyledText
                        variant="medium"
                        className="text-ink-400 text-xs"
                      >
                        {product.category
                          ? `${t('currentCategory', 'Current: {{category}}').replace('{{category}}', product.category)}`
                          : t(
                              'currentCategoryUncategorized',
                              'Uncategorized',
                            )}{' '}
                        • ₱{formatPesos(product.price)}
                      </StyledText>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-md items-center justify-center border ${
                        isSelected
                          ? 'bg-persimmon-500 border-persimmon-500'
                          : 'border-ink-300 bg-paper-50'
                      }`}
                    >
                      {isSelected && (
                        <FontAwesome name="check" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Persistent Bottom Action Bar */}
      <View className="p-4 bg-paper-50 border-t border-ink-100 shadow-paper">
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || insertCategoryMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('saveCategory', 'Save category')}
          accessibilityState={{
            disabled: !isValid,
            busy: insertCategoryMutation.isPending,
          }}
          className={`w-full py-4 rounded-xl items-center justify-center shadow-paper active:opacity-90 ${
            !isValid || insertCategoryMutation.isPending
              ? 'bg-ink-100 opacity-60 shadow-none'
              : 'bg-persimmon-500'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-base font-stack-sans-bold ${
              !isValid || insertCategoryMutation.isPending
                ? 'text-ink-400'
                : 'text-paper-50'
            }`}
          >
            {insertCategoryMutation.isPending
              ? t('saving', 'Saving…')
              : t('saveCategory', 'Save Category')}
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

// `t` must invoke translation types
function ContextBanner({ t }: { t: any }) {
  return (
    <View className="rounded-2xl overflow-hidden shadow-paper bg-cinnamon-50 p-4 mb-4">
      <View className="flex-row items-center gap-3">
        <View className="bg-cinnamon-100 w-10 h-10 rounded-full items-center justify-center">
          <FontAwesome name="bookmark" size={16} color="#D49570" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-cinnamon-900 text-base"
          >
            {t('categoryBannerTitle', 'Organize Your Inventory')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-cinnamon-700 text-xs mt-0.5 leading-relaxed"
          >
            {t(
              'categoryBannerSubtitle',
              'Group products into categories so reports and filters stay easy to scan.',
            )}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
