import { View, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BarcodeScannerModal, Modal } from '@/components/ui';
import {
  AddProductHeader,
  BasicInfoCard,
  PricingProfitCard,
  StockCard,
  ActionButtons,
  useAddProductForm,
} from '@/components/inventory/products/add-product';

export default function AddProduct() {
  const form = useAddProductForm();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AddProductHeader onBack={form.confirmDiscard} />

        <View className="px-4">
          <BasicInfoCard
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

          <PricingProfitCard
            control={form.control}
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
            hasCost={!!form.costPerPiece && form.costPerPiece !== '0.00'}
            hasPrice={!!form.price && form.price !== '0.00'}
            priceInputRef={form.priceInputRef}
          />

          <View className="my-3 border-t border-dashed border-ink-300" />

          <StockCard
            control={form.control}
            initialStock={form.initialStock}
            onBumpStock={form.bumpStock}
          />

          <ActionButtons
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
        useNativeModal={false}
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