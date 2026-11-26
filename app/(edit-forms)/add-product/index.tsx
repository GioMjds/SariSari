import { withProf } from '@/utils/perf';
import { router, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StatusBar } from 'expo-status-bar';
import { BarcodeScannerModal, Modal } from '@/components/ui';
import { useAddProductForm } from '@/components/inventory/products/add-product';
import {
  ProductCodesSection,
  ProductDetailsSection,
  ProductFormFooter,
  ProductFormHeader,
  ProductPricingSection,
  ProductStockSection,
  FORM_CONTENT_STYLE,
} from '@/components/inventory/products/form';

function AddProduct() {
  const form = useAddProductForm();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
      <ProductFormHeader title="Add Product" onBack={form.handleBack} />

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
          autoGenerateSku={form.autoGenerateSku}
          onToggleAutoGenerateSku={form.setAutoGenerateSku}
        />
        <ProductPricingSection
          control={form.control}
          setValue={form.setValue}
          priceInputRef={form.priceInputRef}
          onPressScanCase={() => form.openScanner('wholesaleBarcode')}
        />
        <ProductStockSection mode="add" control={form.control} />
      </KeyboardAwareScrollView>

      <ProductFormFooter
        submitLabel="Add product"
        pendingLabel="Saving…"
        blocker={form.blocker}
        isPending={form.insertProductMutation.isPending}
        onSubmit={form.submit}
        onCancel={form.handleBack}
      />

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
            onPress: form.discard,
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

export default withProf(AddProduct, 'add-product/index');
