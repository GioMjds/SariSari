import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { CartSummaryTray, CustomerPickerModal } from '@/components/sales/add-sales';
import { useCart } from '@/components/sales/pos/useCart';
import { useTabBarBottomOffset } from '@/components/layout';
import { formatPesos } from '@/lib';

export default function CheckoutScreen() {
  const cart = useCart();
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const success = await cart.submit();
    if (success) setSaleCompleted(true);
  };

  const handleNewSale = () => {
    setSaleCompleted(false);
    router.push('/(tabs)/sales/pos');
  };

  const handleViewReceipts = () => {
    setSaleCompleted(false);
    router.push('/(tabs)/sales/receipts');
  };

  // Post-sale success state
  if (saleCompleted) {
    return (
      <View className="flex-1 bg-paper-200 items-center justify-center px-6">
        <StyledText variant="extrabold" className="text-ink-900 text-2xl text-center mb-2">
          Sale Completed!
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-center mb-8">
          The resibo has been saved.
        </StyledText>
        <View className="w-full gap-3">
          <Pressable
            onPress={handleNewSale}
            accessibilityRole="button"
            accessibilityLabel="Record new sale"
            className="bg-persimmon-500 rounded-2xl py-4 items-center shadow-persimmon-glow active:opacity-90"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              New Sale
            </StyledText>
          </Pressable>
          <Pressable
            onPress={handleViewReceipts}
            accessibilityRole="button"
            accessibilityLabel="View receipts"
            className="bg-paper-50 border border-ink-200 rounded-2xl py-4 items-center active:opacity-70"
          >
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              View Receipts
            </StyledText>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty cart state
  if (cart.cartItems.length === 0) {
    return (
      <View className="flex-1 bg-paper-200 items-center justify-center px-6">
        <FontAwesome
          name="shopping-basket"
          size={64}
          color="#623418"
          style={{ opacity: 0.25, marginBottom: 16 }}
        />
        <StyledText variant="extrabold" className="text-ink-900 text-xl text-center mb-2">
          Cart is Empty
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-center mb-6">
          Add products from the POS tab to checkout.
        </StyledText>
        <Pressable
          onPress={() => router.push('/(tabs)/sales/pos')}
          accessibilityRole="button"
          accessibilityLabel="Go to POS"
          className="bg-persimmon-500 rounded-2xl px-6 py-3 shadow-persimmon-glow active:opacity-90"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-base">
            Go to POS
          </StyledText>
        </Pressable>
      </View>
    );
  }

  const displayCustomerName =
    typeof cart.selectedCustomer === 'string'
      ? cart.selectedCustomer
      : cart.selectedCustomer?.name ?? null;

  return (
    <View className="flex-1 bg-paper-200">
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarBottomOffset + 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Summary Card */}
        <View className="mx-4 mb-4 bg-paper-50 rounded-3xl p-5 border border-ink-100 shadow-md">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-full bg-cinnamon-500/10 items-center justify-center mr-3">
              <FontAwesome name="file-text-o" size={18} color="#623418" />
            </View>
            <View>
              <StyledText variant="extrabold" className="text-ink-900 text-lg">
                Resibo Summary
              </StyledText>
              <StyledText variant="medium" className="text-ink-500 text-xs">
                {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
              </StyledText>
            </View>
          </View>

          {/* Items list */}
          <View className="mb-4">
            {cart.cartItems.map((item, idx) => (
              <View
                key={`${item.product_id}-${item.selected_unit}-${idx}`}
                className="flex-row items-start justify-between py-2 border-b border-dotted border-ink-200"
              >
                <View className="flex-1 mr-3">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    {item.product_name}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-500 text-xs mt-0.5">
                    {item.quantity}× {formatPesos(item.price)} {' • '}
                    {item.selected_unit === 'wholesale'
                      ? item.wholesale_unit_name || 'Case'
                      : item.retail_unit_name || 'Pc'}
                  </StyledText>
                </View>
                <MoneyText
                  value={item.price * item.quantity}
                  size="sm"
                  className="text-ink-900"
                />
              </View>
            ))}
          </View>

          {/* Total */}
          <View className="flex-row items-center justify-between pt-3 border-t-2 border-ink-200">
            <StyledText variant="extrabold" className="text-ink-900 text-lg">
              Total
            </StyledText>
            <MoneyText value={cart.total} size="xl" className="text-ink-900" />
          </View>

          {/* Payment type badge */}
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <FontAwesome
                name={cart.paymentType === 'cash' ? 'money' : 'book'}
                size={14}
                color={cart.paymentType === 'cash' ? '#4F7A24' : '#C77B0E'}
              />
              <StyledText
                variant="extrabold"
                className={`ml-2 text-sm ${
                  cart.paymentType === 'cash' ? 'text-sage-600' : 'text-semantic-warning'
                }`}
              >
                {cart.paymentType === 'cash' ? 'Cash' : 'Credit (Utang)'}
              </StyledText>
            </View>
            {displayCustomerName && (
              <View className="flex-row items-center">
                <FontAwesome name="user" size={12} color="#623418" />
                <StyledText variant="semibold" className="text-ink-700 text-xs ml-1.5">
                  {displayCustomerName}
                </StyledText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky checkout tray */}
      <View className="absolute bottom-0 left-0 right-0">
        <CartSummaryTray
          itemCount={cart.itemCount}
          total={cart.total}
          paymentType={cart.paymentType}
          selectedCustomer={cart.selectedCustomer}
          isSubmitDisabled={cart.isSubmitDisabled}
          isPending={cart.insertSaleMutation.isPending}
          onPaymentTypeChange={cart.setPaymentType}
          onOpenCustomerPicker={() => setShowCustomerPicker(true)}
          onSubmit={handleSubmit}
        />
      </View>

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
    </View>
  );
}
