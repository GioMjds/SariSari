import { useState, useRef } from 'react';
import { View, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AddSalesHeader,
  CartSummaryTray,
  CustomerPickerModal,
  ProductSearchCatalog,
  useAddSalesForm,
} from '@/components/sales/add-sales';
import { StyledText } from '@/components/elements';
import {
  SukiPanel,
  OverrideReasonModal,
} from '@/components/utang/credit-guardrails';
import { BarcodeScannerModal, Modal } from '@/components/ui';

export default function AddSales() {
  const form = useAddSalesForm();
  const router = useRouter();
  const hasItems = form.cartItems.length > 0;

  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const pendingLeaveRef = useRef<boolean>(false);

  usePreventRemove(hasItems, () => {
    pendingLeaveRef.current = true;
    setShowDiscardModal(true);
  });

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    form.clearCart();
    if (pendingLeaveRef.current) {
      router.back();
    }
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
    pendingLeaveRef.current = false;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style={form.isScannerOpen ? 'light' : 'dark'} />
      <View className="flex-1">
        <AddSalesHeader itemCount={form.itemCount} onBack={form.router.back} />

        <ProductSearchCatalog
          filteredProducts={form.filteredProducts}
          isLoading={form.isProductsLoading}
          getCartLine={form.getCartLine}
          onAdd={form.handleAddItem}
          onUpdateQuantity={form.handleUpdateQuantity}
          onToggleUnit={(productId) => {
            const idx = form.cartItems.findIndex(
              (item) => item.product_id === productId,
            );
            if (idx !== -1) form.toggleCartItemUnit(idx);
          }}
          onPressScan={form.openScanner}
          pendingAddProductBarcode={form.pendingAddProductBarcode}
          onPressAddNewProduct={form.handlePressAddNewProduct}
          onDismissPendingAddProduct={form.dismissPendingAddProduct}
          searchText={form.search}
          onSearchTextChange={(text) => form.setValue('search', text)}
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

        {form.paymentType === 'credit' &&
          form.creditSummary &&
          typeof form.selectedCustomer === 'object' &&
          form.selectedCustomer !== null && (
            <View className="px-4 pb-2">
              <SukiPanel
                summary={form.creditSummary}
                pendingTotal={form.total}
                mode="compact"
                onRequestOverride={() => form.setShowOverrideModal(true)}
              />
            </View>
          )}
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

      <Modal
        visible={form.showSoftWarnModal}
        transparent
        animationType="fade"
        onClose={() => form.setShowSoftWarnModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 gap-4 w-full">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              Suki is over limit
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm">
              You can continue or record a reason.
            </StyledText>
            <View className="gap-2">
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.submit();
                }}
                className="bg-ink-200 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-ink-700 text-sm">
                  Continue without override
                </StyledText>
              </Pressable>
              <Pressable
                onPress={() => {
                  form.setShowSoftWarnModal(false);
                  form.setShowOverrideModal(true);
                }}
                className="bg-primary-600 rounded-xl px-4 py-3 items-center"
              >
                <StyledText variant="semibold" className="text-white text-sm">
                  Record override reason
                </StyledText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OverrideReasonModal
        visible={form.showOverrideModal}
        onClose={() => form.setShowOverrideModal(false)}
        onSubmit={(result) => {
          form.setOverrideReason(result);
          form.setShowOverrideModal(false);
          form.submit();
        }}
      />

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
