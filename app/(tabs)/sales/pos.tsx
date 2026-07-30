import { useState, useMemo } from 'react';
import { View, FlatList, Pressable, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import {
  ProductSearchCatalog,
  CustomerPickerModal,
  FloatingCheckoutButton,
  CheckoutModal,
} from '@/components/sales/pos';
import { BarcodeScannerModal, MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { useCart } from '@/components/sales/pos/useCart';
import { useTabBarBottomOffset } from '@/components/layout';
import type { Product } from '@/types';

interface SearchFormData {
  search: string;
}

export default function POSScreen() {
  const cart = useCart();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { control, watch } = useForm<SearchFormData>({
    defaultValues: { search: '' },
  });

  const search = watch('search') || '';

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cart.products;
    return cart.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [cart.products, search]);

  const quickProducts = useMemo(() => {
    return cart.products.filter((p) => p.quantity > 0).slice(0, 8);
  }, [cart.products]);

  const handleQuickAdd = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    cart.addItem(product);
  };

  return (
    <View className="flex-1 bg-paper-200">
      <FlatList
        ListHeaderComponent={
          <>
            {/* Quick Product Grid */}
            {search.trim() === '' && quickProducts.length > 0 && (
              <View className="px-4 pt-2 pb-1">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-sm mb-2 label-caps"
                >
                  Quick Add
                </StyledText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  {quickProducts.map((product) => {
                    const cartLine = cart.getCartLine(product.id);
                    const inCart = !!cartLine;
                    return (
                      <Pressable
                        key={product.id}
                        onPress={() => handleQuickAdd(product)}
                        className="mr-3 bg-paper-50 rounded-2xl p-3 border border-ink-100 w-28 active:opacity-70"
                        style={{
                          shadowColor: '#564E45',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <View className="items-center">
                          <View className="w-12 h-12 rounded-xl bg-persimmon-50 items-center justify-center mb-2">
                            <StyledText
                              variant="black"
                              className="text-persimmon-600 text-base"
                            >
                              {product.name.charAt(0).toUpperCase()}
                            </StyledText>
                          </View>
                          <StyledText
                            variant="extrabold"
                            className="text-ink-900 text-xs text-center"
                            numberOfLines={2}
                          >
                            {product.name}
                          </StyledText>
                          <MoneyText
                            value={product.price}
                            size="sm"
                            className="text-ink-700 mt-1"
                          />
                          {inCart && (
                            <View className="mt-1 bg-sage-500 rounded-full px-2 py-0.5">
                              <StyledText
                                variant="extrabold"
                                className="text-paper-50 text-[10px]"
                              >
                                {cartLine!.quantity}
                              </StyledText>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        }
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={null}
        contentContainerStyle={{ paddingBottom: tabBarBottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Product Search Catalog */}
      <View
        className="absolute inset-x-0"
        style={{
          top: search.trim() === '' && quickProducts.length > 0 ? 140 : 0,
          bottom: 0,
        }}
      >
        <ProductSearchCatalog
          control={control}
          filteredProducts={filteredProducts}
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
        />
      </View>

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton
        itemCount={cart.itemCount}
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
