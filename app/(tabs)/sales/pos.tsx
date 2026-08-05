import { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import {
  ProductSearchCatalog,
  CustomerPickerModal,
  FloatingCheckoutButton,
  CheckoutModal,
} from '@/components/sales/pos';
import { BarcodeScannerModal } from '@/components/ui';
import { useCart } from '@/components/sales/pos/useCart';

interface SearchFormData {
  search: string;
}

export default function POSScreen() {
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { control, watch } = useForm<SearchFormData>({
    defaultValues: { search: '' },
  });

  const search = watch('search') || '';
  const cart = useCart(search);

  return (
    <View className="flex-1 bg-paper-200">
      <ProductSearchCatalog
        control={control}
        filteredProducts={cart.products}
        isLoading={cart.isProductsLoading}
        getCartLine={cart.getCartLine}
        onAdd={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        onToggleUnit={(productId) => {
          const idx = cart.cartItems.findIndex(
            (item) => item.product_id === productId,
          );
          if (idx !== -1) cart.toggleUnit(idx);
        }}
        onPressScan={cart.openScanner}
        pendingAddProductBarcode={cart.pendingAddProductBarcode}
        onPressAddNewProduct={cart.handlePressAddNewProduct}
        onDismissPendingAddProduct={cart.dismissPendingAddProduct}
        isFetchingNextPage={cart.isFetchingNextPage}
        hasNextPage={cart.hasNextPage}
        onEndReached={() => {
          if (!cart.isFetchingNextPage && cart.hasNextPage) {
            cart.fetchNextPage();
          }
        }}
        onRetryFetchNext={() => cart.fetchNextPage()}
      />

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton
        itemCount={cart.itemCount}
        total={cart.total}
        onPress={() => setCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />

      <CustomerPickerModal
        visible={showCustomerPicker}
        customers={cart.customers}
        paymentType={cart.paymentType}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={(customer) => {
          cart.setCustomer(customer);
          setShowCustomerPicker(false);
        }}
        onSelectOneOffName={(name) => {
          cart.setCustomer(name);
          setShowCustomerPicker(false);
        }}
      />

      <BarcodeScannerModal
        visible={cart.isScannerOpen}
        mode="continuous"
        onClose={cart.closeScanner}
        onScan={cart.handleScannedBarcode}
        lastScanned={cart.lastScanned}
        itemCount={cart.itemCount}
        total={cart.total}
      />
    </View>
  );
}
