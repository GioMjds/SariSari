import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useCategories, useProducts } from '@/hooks';
import { Alert } from '@/utils';
import { parsePesosInput, tryParsePesosInput } from '@/lib/money';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditProductForm {
  name: string;
  sku: string;
  costPerPiece: string;
  price: string;
  category: string;
}

export default function EditProduct() {
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { useGetProduct, updateProductMutation, deleteProductMutation } =
    useProducts();
  const { getAllCategoriesQuery } = useCategories();
  const { data: categories = [] } = getAllCategoriesQuery;

  const { data: product, isLoading } = useGetProduct(parseInt(id, 10));

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<EditProductForm>({
    defaultValues: {
      name: '',
      sku: '',
      costPerPiece: '',
      price: '',
      category: '',
    },
    values: product
      ? {
          name: product.name,
          sku: product.sku,
          costPerPiece: product.cost_price ? product.cost_price.toString() : '',
          price: product.price.toString(),
          category: product.category || '',
        }
      : undefined,
  });

  // Watch all fields to check if user actually changed something meaningful
  const formValues = watch();

  const hasUnsavedChanges =
    product &&
    isDirty &&
    (formValues.name !== product.name ||
      formValues.costPerPiece !==
        (product.cost_price ? product.cost_price.toString() : '') ||
      formValues.price !== product.price.toString() ||
      formValues.category !== (product.category || ''));

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: "Don't Leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  // Handle hardware back button only while screen is focused
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Are you sure you want to discard them?',
            [
              {
                text: "Don't Leave",
                style: 'cancel',
                onPress: () => {},
              },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => router.back(),
              },
            ],
          );
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => backHandler.remove();
    }, [hasUnsavedChanges, router]),
  );

  const onSubmit = async (data: EditProductForm) => {
    try {
      if (!data.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!data.sku.trim()) {
        throw new Error('SKU is required');
      }
      if (!data.price || tryParsePesosInput(data.price) <= 0) {
        throw new Error('Valid price is required');
      }

      const priceValue = parsePesosInput(data.price);
      const costPriceValue = data.costPerPiece
        ? parsePesosInput(data.costPerPiece)
        : undefined;

      // Validate that cost price is less than selling price
      if (costPriceValue !== undefined && costPriceValue >= priceValue) {
        throw new Error('Cost price must be less than selling price');
      }

      await updateProductMutation.mutateAsync({
        id: parseInt(id, 10),
        name: data.name.trim(),
        sku: data.sku.trim(),
        price: priceValue,
        quantity: product?.quantity || 0,
        cost_price: costPriceValue,
        category: data.category || undefined,
      });

      router.back();
    } catch {
      // Error already handled by mutation
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    await deleteProductMutation.mutateAsync(parseInt(id, 10));
    router.replace('/inventory');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#B45309" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <FontAwesome
          name="exclamation-circle"
          size={64}
          color="#dc2626"
          style={{ opacity: 0.5 }}
        />
        <StyledText
          variant="semibold"
          className="text-warm-900 text-xl mt-4 text-center"
        >
          Product Not Found
        </StyledText>
        <Pressable
          onPress={() => router.back()}
          className="bg-secondary-500 rounded-xl px-6 py-3 mt-6 active:opacity-70"
        >
          <StyledText variant="semibold" className="text-white text-base">
            Go Back
          </StyledText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-primary-500 px-4 py-6 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={handleBackPress}
              className="mr-3 active:opacity-50"
            >
              <FontAwesome name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <StyledText variant="extrabold" className="text-white text-2xl">
              Edit Product
            </StyledText>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Product Name */}
          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-warm-900 text-sm mb-2"
            >
              Product Name *
            </StyledText>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="e.g., Lucky Me Pancit Canton"
                  value={value}
                  onChangeText={onChange}
                  className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-warm-900 shadow-sm"
                  placeholderTextColor="#9ca3af"
                />
              )}
            />
          </View>
          {/* SKU */}
          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-warm-900 text-sm mb-2"
            >
              SKU (Stock Keeping Unit)
            </StyledText>
            <Controller
              control={control}
              name="sku"
              render={({ field: { value } }) => (
                <TextInput
                  placeholder="e.g., PC-001"
                  value={value}
                  editable={false}
                  className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-warm-900/40 shadow-sm"
                  placeholderTextColor="#9ca3af"
                />
              )}
            />
          </View>

          {/* Cost Price */}
          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-warm-900 text-sm mb-2"
            >
              Cost Price per Piece (₱)
            </StyledText>
            <View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
              <StyledText
                variant="medium"
                className="text-warm-600 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="costPerPiece"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="5.00"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    className="flex-1 font-stack-sans text-base text-warm-900"
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
            </View>
            <StyledText
              variant="regular"
              className="text-warm-500 text-xs mt-1"
            >
              The price you paid when buying this product. Used to calculate
              profit.
            </StyledText>
          </View>
          {/* Price */}
          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-warm-900 text-sm mb-2"
            >
              Selling Price (₱) *
            </StyledText>
            <View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
              <StyledText
                variant="medium"
                className="text-warm-600 text-base mr-2"
              >
                ₱
              </StyledText>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="0.00"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    className="flex-1 font-stack-sans text-base text-warm-900"
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
            </View>

            {/* Profit Preview */}
            {formValues.costPerPiece &&
              formValues.price &&
              tryParsePesosInput(formValues.costPerPiece) > 0 &&
              tryParsePesosInput(formValues.price) > 0 && (
                <View className="bg-secondary-50 rounded-lg p-3 mt-2 flex-row items-center justify-between">
                  <View>
                    <StyledText
                      variant="regular"
                      className="text-secondary-700 text-xs mb-1"
                    >
                      Profit per Piece (Tubo)
                    </StyledText>
                    <StyledText
                      variant="extrabold"
                      className="text-secondary-700 text-lg"
                    >
                      ₱
                      {(
                        tryParsePesosInput(formValues.price) -
                        tryParsePesosInput(formValues.costPerPiece)
                      ).toFixed(2)}
                    </StyledText>
                  </View>
                  <View className="items-end">
                    <StyledText
                      variant="regular"
                      className="text-secondary-700 text-xs mb-1"
                    >
                      Markup
                    </StyledText>
                    <StyledText
                      variant="extrabold"
                      className="text-secondary-700 text-lg"
                    >
                      {(
                        ((tryParsePesosInput(formValues.price) -
                          tryParsePesosInput(formValues.costPerPiece)) /
                          tryParsePesosInput(formValues.costPerPiece)) *
                        100
                      ).toFixed(1)}
                      %
                    </StyledText>
                  </View>
                </View>
              )}
          </View>

          {/* Category (Optional - UI only for now) */}
          <View className="mb-4">
            <StyledText
              variant="semibold"
              className="text-warm-900 text-sm mb-2"
            >
              Category (Optional)
            </StyledText>
            {categories.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {categories.map((category) => (
                    <Controller
                      key={category.id}
                      control={control}
                      name="category"
                      render={({ field: { onChange, value } }) => (
                        <Pressable
                          onPress={() =>
                            onChange(
                              value === category.name ? '' : category.name,
                            )
                          }
                          className={`px-4 py-2 rounded-xl active:opacity-70 ${
                            value === category.name
                              ? 'bg-secondary-500 border-0'
                              : 'bg-white border border-warm-200'
                          }`}
                        >
                          <StyledText
                            variant="medium"
                            className={`text-sm ${
                              value === category.name
                                ? 'text-white'
                                : 'text-warm-600'
                            }`}
                          >
                            {category.name}
                          </StyledText>
                        </Pressable>
                      )}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="bg-gray-50 rounded-xl p-4 flex-row items-center">
                <FontAwesome
                  name="info-circle"
                  size={16}
                  color="#6b7280"
                  style={{ marginRight: 8 }}
                />
                <StyledText
                  variant="regular"
                  className="text-gray-600 text-xs flex-1"
                >
                  No categories yet. Go to Products → Categories tab to add one.
                </StyledText>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View className="bg-blue-50 rounded-xl p-4 flex-row mb-6">
            <FontAwesome
              name="info-circle"
              size={20}
              color="#3b82f6"
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <StyledText
                variant="semibold"
                className="text-blue-700 text-sm mb-1"
              >
                Product Information
              </StyledText>
              <StyledText
                variant="regular"
                className="text-blue-600 text-xs leading-5 mb-2"
              >
                Created: {new Date(product.created_at).toLocaleDateString()}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-blue-600 text-xs leading-5"
              >
                Last Updated:{' '}
                {new Date(product.updated_at).toLocaleDateString()}
              </StyledText>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mb-8">
            {/* Save Changes */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={updateProductMutation.isPending}
              className={`bg-secondary-500 rounded-xl py-4 items-center shadow-md ${
                updateProductMutation.isPending ? 'opacity-50' : ''
              }`}
            >
              {updateProductMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <StyledText
                  variant="extrabold"
                  className="text-white text-base"
                >
                  Save Changes
                </StyledText>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={handleBackPress}
              className="bg-gray-100 rounded-xl py-4 items-center"
            >
              <StyledText
                variant="semibold"
                className="text-warm-900 text-base"
              >
                Cancel
              </StyledText>
            </TouchableOpacity>

            {/* Delete Product (Danger Zone) */}
            <View className="mt-4 border-t border-gray-200 pt-4">
              <StyledText
                variant="semibold"
                className="text-warm-600 text-xs mb-2"
              >
                DANGER ZONE
              </StyledText>
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-red-600 rounded-xl py-4 items-center"
              >
                <View className="flex-row items-center">
                  <FontAwesome
                    name="trash"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <StyledText
                    variant="extrabold"
                    className="text-white text-base"
                  >
                    Delete Product
                  </StyledText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        variant="danger"
        title="Delete Product?"
        description={`Are you sure you want to delete "${product.name}"?\nThis action cannot be undone.`}
        buttons={[
          {
            text: 'Yes, Delete Product',
            style: 'destructive',
            onPress: confirmDelete,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowDeleteModal(false),
          },
        ]}
        onClose={() => setShowDeleteModal(false)}
        loading={deleteProductMutation.isPending}
      />
    </SafeAreaView>
  );
}
