import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Platform,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useGetSupplier, useSuppliers } from '@/hooks/useSuppliers';
import { useProducts, usePaginatedProducts } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';

interface SupplierFormData {
  name: string;
  contact: string;
  notes: string;
}

export default function EditSupplier() {
  const { t } = useTranslation('inventory');
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [focusedField, setFocusedField] = useState<
    'name' | 'contact' | 'notes' | null
  >(null);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [initialProductIds, setInitialProductIds] = useState<number[]>([]);

  const { updateSupplierMutation } = useSuppliers();
  const { data: supplier, isLoading } = useGetSupplier(id);
  const { getAllProductsQuery } = useProducts();
  const allProducts = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const productsAssignedToSupplier = useMemo(
    () => allProducts.filter((p) => p.supplier_id === id),
    [allProducts, id],
  );

  const productsQuery = usePaginatedProducts(productSearch);
  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<SupplierFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      contact: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        contact: supplier.contact || '',
        notes: supplier.notes || '',
      });
    }
  }, [supplier, reset]);

  useEffect(() => {
    if (productsAssignedToSupplier.length > 0 || initialProductIds.length === 0) {
      const ids = productsAssignedToSupplier.map((p) => p.id);
      setInitialProductIds(ids);
      setSelectedProductIds(ids);
    }
  }, [productsAssignedToSupplier, initialProductIds.length]);

  const productsChanged =
    initialProductIds.length !== selectedProductIds.length ||
    initialProductIds.some((pid) => !selectedProductIds.includes(pid));

  const confirmDiscard = () => {
    if (isDirty || productsChanged) {
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

  const onSubmit = (data: SupplierFormData) => {
    updateSupplierMutation.mutate(
      {
        id,
        patch: {
          name: data.name.trim(),
          contact: data.contact.trim() || null,
          notes: data.notes.trim() || null,
        },
        productIds: selectedProductIds,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  };

  if (isLoading || !supplier) {
    return (
      <SafeAreaView
        className="flex-1 bg-background justify-center items-center"
        edges={['top', 'bottom']}
      >
        <ActivityIndicator size="large" color="#E85A1F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Persistent Top Header */}
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
              {t('editSupplier', 'Edit Supplier')}
            </StyledText>
            <StyledText
              variant="medium"
              className="label-caps text-ink-400 mt-0.5"
            >
              Update Supplier Record
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      {/* Scrollable Content */}
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-4 mt-2">
          <ContextBanner t={t} />

          <View className="my-1 border-t border-dashed border-ink-300" />

          <BasicInfoCard
            control={control}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            t={t}
          />

          <View className="my-1 border-t border-dashed border-ink-300" />

          <NotesCard
            control={control}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            t={t}
          />

          <View className="my-1 border-t border-dashed border-ink-300" />

          {/* Assign Products Directly Section */}
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper mt-3 mb-4 space-y-3">
            <View className="flex-row items-center justify-between">
              <View>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base font-stack-sans-bold"
                >
                  Assign Products Directly
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-xs mt-0.5"
                >
                  Select products linked to this supplier (
                  {selectedProductIds.length} selected)
                </StyledText>
              </View>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3 py-2">
              <FontAwesome
                name="search"
                size={14}
                color="#A39C96"
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
                placeholder="Search products..."
                placeholderTextColor="#A39C96"
                value={productSearch}
                onChangeText={setProductSearch}
              />
              {productSearch.length > 0 && (
                <Pressable onPress={() => setProductSearch('')}>
                  <FontAwesome name="times-circle" size={14} color="#A39C96" />
                </Pressable>
              )}
            </View>

            {/* Products List */}
            <View className="mt-2">
              {products.length === 0 ? (
                productsQuery.isLoading ? (
                  <View className="py-6 items-center">
                    <ActivityIndicator size="small" color="#E85A1F" />
                    <StyledText variant="medium" className="text-ink-400 text-xs mt-2">
                      Loading products...
                    </StyledText>
                  </View>
                ) : (
                  <View className="py-4 items-center">
                    <FontAwesome
                      name="exclamation-circle"
                      size={20}
                      color="#A39C96"
                    />
                    <StyledText variant="medium" className="text-ink-400 text-xs mt-1">
                      No products found
                    </StyledText>
                  </View>
                )
              ) : (
                <View>
                  {products.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => toggleProductSelection(product.id)}
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
                            {formatPesos(product.price)}
                            {product.supplier_id === id && ' · Linked'}
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
                  })}
                  {productsQuery.hasNextPage && (
                    <Pressable
                      onPress={() => productsQuery.fetchNextPage()}
                      disabled={productsQuery.isFetchingNextPage}
                      className="py-2.5 items-center justify-center bg-paper-100 rounded-xl border border-ink-200 mt-1"
                    >
                      {productsQuery.isFetchingNextPage ? (
                        <ActivityIndicator size="small" color="#E85A1F" />
                      ) : (
                        <StyledText
                          variant="semibold"
                          className="text-persimmon-500 text-xs font-stack-sans-bold"
                        >
                          Load more products
                        </StyledText>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Persistent Bottom Action Bar */}
      <View className="p-4 bg-paper-50 border-t border-ink-100 shadow-paper">
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || updateSupplierMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Save supplier changes"
          accessibilityState={{
            disabled: !isValid,
            busy: updateSupplierMutation.isPending,
          }}
          className={`w-full py-4 rounded-xl items-center justify-center shadow-paper active:opacity-90 ${
            !isValid || updateSupplierMutation.isPending
              ? 'bg-ink-100 opacity-60 shadow-none'
              : 'bg-persimmon-500'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-base font-stack-sans-bold ${
              !isValid || updateSupplierMutation.isPending
                ? 'text-ink-400'
                : 'text-paper-50'
            }`}
          >
            {updateSupplierMutation.isPending ? 'Saving…' : 'Save Changes'}
          </StyledText>
        </Pressable>
      </View>

      {/* Discard Confirmation Modal */}
      <Modal
        visible={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        buttons={[
          {
            text: "Don't Leave",
            style: 'cancel',
            onPress: () => setShowDiscardDialog(false),
          },
          {
            text: 'Discard',
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

interface SubcomponentProps {
  control: any;
  focusedField: 'name' | 'contact' | 'notes' | null;
  setFocusedField: (field: 'name' | 'contact' | 'notes' | null) => void;
  t: any;
}

function ContextBanner({ t }: { t: any }) {
  return (
    <View className="rounded-2xl overflow-hidden shadow-paper bg-cinnamon-50 p-4 mb-4">
      <View className="flex-row items-center gap-3">
        <View className="bg-cinnamon-100 w-10 h-10 rounded-full items-center justify-center">
          <FontAwesome name="truck" size={16} color="#D49570" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-cinnamon-900 text-base"
          >
            {t('supplierProfile', 'Supplier Profile')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-cinnamon-700 text-xs mt-0.5 leading-relaxed"
          >
            {t(
              'supplierProfileSubtitle',
              'Keep your supplier details and notes offline. Linked during product restocking.',
            )}
          </StyledText>
        </View>
      </View>
    </View>
  );
}

function BasicInfoCard({
  control,
  focusedField,
  setFocusedField,
  t,
}: SubcomponentProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-4">
      <View className="mb-4">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          {t('supplierBasicInfo', 'Basic Info')}
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          {t('supplierBasicInfoDesc', 'Name and primary contact details')}
        </StyledText>
      </View>

      {/* Name Field */}
      <View className="mb-4">
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          {t('labelName', 'Supplier Name')}{' '}
          <StyledText variant="semibold" className="text-persimmon-500">*</StyledText>
        </StyledText>
        <Controller
          control={control}
          name="name"
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="relative justify-center">
              <View className="absolute left-4 z-10">
                <FontAwesome
                  name="user"
                  size={16}
                  color={focusedField === 'name' ? '#E85A1F' : '#564E45'}
                />
              </View>
              <TextInput
                placeholder="e.g. Coca-Cola Representative"
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => {
                  onBlur();
                  setFocusedField(null);
                }}
                className={`text-ink-900 text-base border rounded-xl pl-11 pr-11 py-3.5 font-stack-sans ${
                  focusedField === 'name'
                    ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                    : 'bg-paper-100 border-ink-200 shadow-none'
                }`}
                placeholderTextColor="#A89F90"
              />
              {value.length > 0 && (
                <Pressable
                  onPress={() => onChange('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear name field"
                  className="absolute right-4 z-10 p-1 active:opacity-70"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="times-circle" size={16} color="#A89F90" />
                </Pressable>
              )}
            </View>
          )}
        />
      </View>

      {/* Contact Field */}
      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          {t('labelContact', 'Contact Info')}
        </StyledText>
        <Controller
          control={control}
          name="contact"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="relative justify-center">
              <View className="absolute left-4 z-10">
                <FontAwesome
                  name="phone"
                  size={16}
                  color={focusedField === 'contact' ? '#E85A1F' : '#564E45'}
                />
              </View>
              <TextInput
                placeholder="e.g. Phone number, email, address"
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocusedField('contact')}
                onBlur={() => {
                  onBlur();
                  setFocusedField(null);
                }}
                className={`text-ink-900 text-base border rounded-xl pl-11 pr-11 py-3.5 font-stack-sans ${
                  focusedField === 'contact'
                    ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                    : 'bg-paper-100 border-ink-200 shadow-none'
                }`}
                placeholderTextColor="#A89F90"
              />
              {value.length > 0 && (
                <Pressable
                  onPress={() => onChange('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear contact field"
                  className="absolute right-4 z-10 p-1 active:opacity-70"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="times-circle" size={16} color="#A89F90" />
                </Pressable>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}

function NotesCard({
  control,
  focusedField,
  setFocusedField,
  t,
}: SubcomponentProps) {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mt-3 mb-4">
      <View className="mb-4">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          {t('labelNotes', 'Notes')}
        </StyledText>
        <StyledText variant="regular" className="text-ink-400 text-xs mt-0.5">
          {t(
            'supplierNotesDesc',
            'Schedule, delivery details, and instructions',
          )}
        </StyledText>
      </View>

      {/* Notes Field */}
      <View>
        <StyledText variant="semibold" className="text-ink-900 text-sm mb-2">
          {t('labelNotes', 'Notes')}
        </StyledText>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="relative">
              <View className="absolute left-4 top-3.5 z-10">
                <FontAwesome
                  name="file-text"
                  size={16}
                  color={focusedField === 'notes' ? '#E85A1F' : '#564E45'}
                />
              </View>
              <TextInput
                placeholder="e.g. Delivers every Tuesday morning"
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => {
                  onBlur();
                  setFocusedField(null);
                }}
                multiline
                numberOfLines={3}
                className={`text-ink-900 text-base border rounded-xl pl-11 pr-4 py-3.5 font-stack-sans min-h-[100px] ${
                  focusedField === 'notes'
                    ? 'bg-white border-persimmon-500 shadow-persimmon-glow'
                    : 'bg-paper-100 border-ink-200 shadow-none'
                }`}
                placeholderTextColor="#A89F90"
                textAlignVertical="top"
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}
