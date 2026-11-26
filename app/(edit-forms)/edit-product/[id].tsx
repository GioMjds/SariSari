import { withProf } from '@/utils/perf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { BarcodeScannerModal, Modal } from '@/components/ui';
import { RestockSheet } from '@/components/inventory/modals';
import { LogTransactionForm } from '@/components/inventory/ledger';
import {
  EditDangerZone,
  EditProductSkeleton,
  ProductMetaCard,
  ProductNotFound,
  useEditProductForm,
} from '@/components/inventory/edit-product';
import {
  ProductCodesSection,
  ProductDetailsSection,
  ProductFormFooter,
  ProductFormHeader,
  ProductPricingSection,
  ProductStockSection,
  FORM_CONTENT_STYLE,
} from '@/components/inventory/products/form';

function EditProduct() {
  const form = useEditProductForm();

  if (form.isLoading) return <EditProductSkeleton />;
  if (!form.product) return <ProductNotFound onBack={form.handleBack} />;

  const { product } = form;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ProductFormHeader
        title="Edit Product"
        subtitle={product.name}
        onBack={form.handleBack}
      />

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bottomOffset={96}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={FORM_CONTENT_STYLE}
      >
        <ProductDetailsSection control={form.control} />
        <ProductCodesSection
          control={form.control}
          onPressScan={() => form.openScanner('barcode')}
          conflictProduct={form.barcodeConflictProduct}
          onEditConflict={(id) =>
            router.push(`/(edit-forms)/edit-product/${id}` as Href)
          }
        />
        <ProductPricingSection
          control={form.control}
          setValue={form.setValue}
          onPressScanCase={() => form.openScanner('wholesaleBarcode')}
        />
        <ProductStockSection
          mode="edit"
          control={form.control}
          quantity={product.quantity}
          onRestock={() => form.setStockSheet('restock')}
          onAdjust={() => form.setStockSheet('adjust')}
        />

        <ProductMetaCard
          createdAt={product.created_at}
          updatedAt={product.updated_at}
        />
        <EditDangerZone onDelete={form.openDeleteModal} />
      </KeyboardAwareScrollView>

      <ProductFormFooter
        submitLabel="Save changes"
        pendingLabel="Saving…"
        blocker={form.blocker}
        isPending={form.updateProductMutation.isPending}
        onSubmit={form.submit}
        onCancel={form.handleBack}
      />

      <RestockSheet
        visible={form.stockSheet === 'restock'}
        initialProductId={product}
        onClose={() => form.setStockSheet(null)}
      />
      <LogTransactionForm
        product={product}
        initialType="adjustment"
        visible={form.stockSheet === 'adjust'}
        onClose={() => form.setStockSheet(null)}
        onSuccess={() => form.setStockSheet(null)}
      />

      <BarcodeScannerModal
        visible={form.isScannerOpen}
        mode="single"
        onClose={form.closeScanner}
        onScan={form.handleScannedBarcode}
      />

      <Modal
        visible={form.showDiscardModal}
        onClose={form.cancelDiscard}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        icon="exclamation-triangle"
        buttons={[
          { text: "Don't Leave", style: 'cancel', onPress: form.cancelDiscard },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: form.confirmDiscard,
          },
        ]}
      />

      <Modal
        visible={form.showDeleteModal}
        onClose={form.cancelDelete}
        variant="danger"
        mascot="delete"
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
    </SafeAreaView>
  );
}

export default withProf(EditProduct, 'edit-product/[id]');
