import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Modal } from '@/components/ui';
import {
  EditActionButtons,
  EditBasicInfoCard,
  EditDangerZone,
  EditPricingCard,
  EditProductHeader,
  EditProductSkeleton,
  ProductMetaCard,
  ProductNotFound,
  useEditProductForm,
} from '@/components/inventory/edit-product';

/**
 * EditProduct — thin orchestrator for the Edit Product modal.
 *
 * Composes the focused sub-components under `components/inventory/edit-product/`
 * and delegates all form state, derived math, and submit/delete
 * pipelines to `useEditProductForm`. Mirrors the layered pattern
 * established by the add-product / add-sales / add-credit bundles
 * and the freshly-redesigned credit-details screen.
 *
 * Three render branches:
 *   1. `EditProductSkeleton` — while the product query is in flight.
 *   2. `ProductNotFound` — when the query resolves to nothing.
 *   3. The form — Header → BasicInfo → Pricing → Meta → Actions →
 *      Danger Zone, plus the discard and delete confirmation modals.
 */
export default function EditProduct() {
  const form = useEditProductForm();

  if (form.isLoading) return <EditProductSkeleton />;
  if (!form.product) return <ProductNotFound onBack={form.handleBack} />;

  const { product } = form;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <EditProductHeader onBack={form.handleBack} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <EditBasicInfoCard
            control={form.control}
            categories={form.categories}
            selectedCategory={form.category}
            onSelectCategory={form.selectCategory}
          />

          <View className="mt-3">
            <EditPricingCard
              control={form.control}
              profitPerPiece={form.profitPerPiece}
              markupPercent={form.markupPercent}
              isLossWarning={form.isLossWarning}
            />
          </View>

          <View className="mt-3">
            <ProductMetaCard
              createdAt={product.created_at}
              updatedAt={product.updated_at}
            />
          </View>

          <View className="mt-6">
            <EditActionButtons
              onSubmit={form.submit}
              onCancel={form.handleBack}
              isSubmitting={form.updateProductMutation.isPending}
            />
            <EditDangerZone onDelete={form.openDeleteModal} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Discard-changes confirmation */}
      <Modal
        visible={form.showDiscardModal}
        onClose={form.cancelDiscard}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        icon="exclamation-triangle"
        buttons={[
          { text: "Don't Leave", style: 'cancel', onPress: form.cancelDiscard },
          { text: 'Discard', style: 'destructive', onPress: form.confirmDiscard },
        ]}
      />

      {/* Delete-product confirmation */}
      <Modal
        visible={form.showDeleteModal}
        onClose={form.cancelDelete}
        variant="danger"
        title="Delete Product?"
        description={`Are you sure you want to delete "${product.name}"?\nThis action cannot be undone.`}
        buttons={[
          {
            text: 'Yes, Delete Product',
            style: 'destructive',
            onPress: form.confirmDelete,
          },
          { text: 'Cancel', style: 'cancel', onPress: form.cancelDelete },
        ]}
        loading={form.deleteProductMutation.isPending}
      />
    </SafeAreaView>
  );
}