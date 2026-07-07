import { useState } from 'react';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  AddSalesHeader,
  CartSummaryTray,
  CustomerPickerModal,
  ProductSearchCatalog,
  useAddSalesForm,
} from '@/components/sell/add-sales';
import { BarcodeScannerModal, Modal } from '@/components/ui';

/**
 * AddSales — POS checkout screen rendered as a modal form sheet.
 *
 * Composes the four pieces of `useAddSalesForm`:
 *   • AddSalesHeader — title + back button (which the dismiss guard
 *     below protects when the cart has items).
 *   • ProductSearchCatalog — search + scrollable product list with
 *     inline +/− steppers for cart lines.
 *   • CartSummaryTray — fixed-bottom tray with payment toggle,
 *     customer picker trigger, and Complete Sale CTA.
 *   • CustomerPickerModal — slide-up modal for picking a suki.
 *
 * The unsaved-cart dismiss guard uses `usePreventRemove`, which
 * intercepts every "leave the sheet" intent — the header back
 * button, the swipe-down gesture, and the Android hardware back
 * button — and prompts the user with a Cancel / Discard alert.
 * On confirm we dispatch `data.action` synchronously (deferring it
 * can leave the navigator in a bad state on iOS formSheet dismissals).
 */
export default function AddSales() {
  const form = useAddSalesForm();
  const navigation = useNavigation();
  const hasItems = form.cartItems.length > 0;

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);

  usePreventRemove(hasItems, ({ data }) => {
    setPendingAction(data.action);
    setShowDiscardModal(true);
  });

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    form.clearCart();
    if (pendingAction) navigation.dispatch(pendingAction);
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
    setPendingAction(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
      <View className="flex-1">
        <AddSalesHeader itemCount={form.itemCount} onBack={form.router.back} />

        <ProductSearchCatalog
          control={form.control}
          filteredProducts={form.filteredProducts}
          isLoading={form.isProductsLoading}
          getCartLine={form.getCartLine}
          onAdd={form.handleAddItem}
          onUpdateQuantity={form.handleUpdateQuantity}
          onPressScan={form.openScanner}
          pendingAddProductBarcode={form.pendingAddProductBarcode}
          onPressAddNewProduct={form.handlePressAddNewProduct}
          onDismissPendingAddProduct={form.dismissPendingAddProduct}
        />

        <CartSummaryTray
          itemCount={form.itemCount}
          total={form.total}
          paymentType={form.paymentType}
          selectedCustomer={form.selectedCustomer}
          isSubmitDisabled={form.isSubmitDisabled}
          isPending={form.insertSaleMutation.isPending}
          onPaymentTypeChange={form.handlePaymentTypeChange}
          onOpenCustomerPicker={() => form.setShowCustomerPicker(true)}
          onSubmit={form.submit}
        />
      </View>

      <CustomerPickerModal
        visible={form.showCustomerPicker}
        customers={form.customers}
        paymentType={form.paymentType}
        onClose={() => form.setShowCustomerPicker(false)}
        onSelect={form.handleSelectCustomer}
        onSelectOneOffName={form.handleSelectOneOffName}
      />

      <Modal
        visible={showDiscardModal}
        onClose={handleCancelDiscard}
        title="Discard Sale?"
        description="You have items in your cart. Leaving will empty your cart."
        variant="danger"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleCancelDiscard,
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: handleConfirmDiscard,
          },
        ]}
      >
        <View className="items-center mt-2 mb-1">
          <Image
            source={require('@/assets/images/sari-emotions/sari-delete-state.png')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <BarcodeScannerModal
        visible={form.isScannerOpen}
        mode="continuous"
        onClose={form.closeScanner}
        onScan={form.handleScannedBarcode}
        lastScanned={form.lastScanned}
        itemCount={form.itemCount}
        total={form.total}
      />
    </SafeAreaView>
  );
}
