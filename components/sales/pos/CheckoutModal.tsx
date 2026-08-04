import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { useCartStore } from '@/stores/CartStore';
import { useCart } from '@/components/sales/pos/useCart';
import { CheckoutLineRow } from './CheckoutLineRow';
import { CustomerPickerModal } from './CustomerPickerModal';
import { formatPesos, calculateTotalPieces } from '@/lib';

export interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CheckoutModal({ visible, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const cart = useCart();
  const {
    cartItems,
    paymentType,
    selectedCustomer,
    updateQuantity,
    clearCart,
    setPaymentType,
    setCustomer,
  } = useCartStore();

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [recordedTotal, setRecordedTotal] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
      setIsSubmitting(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [visible]);

  const totalPieces = cartItems.reduce(
    (sum, item) =>
      sum +
      calculateTotalPieces(
        item.quantity,
        item.selected_unit,
        item.conversion_factor,
      ),
    0,
  );

  const customerName =
    typeof selectedCustomer === 'string'
      ? selectedCustomer
      : selectedCustomer?.name;

  const isCredit = paymentType === 'credit';
  const isSubmitDisabled =
    isSubmitting || cart.isSubmitDisabled || (isCredit && !selectedCustomer);

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setRecordedTotal(cart.total);
    const success = await cart.submit();
    setIsSubmitting(false);

    if (success) {
      setIsSuccess(true);
      timerRef.current = setTimeout(() => {
        handleDismissSuccess();
      }, 2500);
    }
  };

  const handleDismissSuccess = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearCart();
    setIsSuccess(false);
    onClose();
  };

  const handleViewReceipts = () => {
    handleDismissSuccess();
    router.push('/(tabs)/sales/receipts');
  };

  const handleRemoveItem = (
    productId: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => {
    const line = cartItems.find(
      (item) =>
        item.product_id === productId &&
        (item.selected_unit || 'retail') === (selectedUnit || 'retail'),
    );
    if (line) {
      updateQuantity(productId, -line.quantity, selectedUnit);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end"
        onPress={isSuccess ? handleDismissSuccess : onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      >
        <Pressable
          className="rounded-t-3xl overflow-hidden bg-paper-50"
          style={{ maxHeight: '92%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Perforation Header */}
          <View className="h-3 flex-row justify-between bg-paper-200">
            {Array.from({ length: 22 }).map((_, i) => (
              <View
                key={`perf-${i}`}
                className="w-3 h-3 rounded-full bg-paper-200"
              />
            ))}
          </View>

          {/* Sticky Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-paper-200 bg-paper-50">
            <Pressable
              onPress={isSuccess ? handleDismissSuccess : onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back chevron"
            >
              <FontAwesome name="chevron-left" size={16} color="#0E0C0A" />
            </Pressable>

            <View className="items-center">
              <StyledText variant="extrabold" className="text-ink-900 text-lg">
                {isSuccess ? 'Sale Success' : 'Checkout'}
              </StyledText>
              {!isSuccess && (
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs mt-0.5"
                >
                  {cart.itemCount} items · {formatPesos(cart.total)}
                </StyledText>
              )}
            </View>

            <Pressable
              onPress={isSuccess ? handleDismissSuccess : onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close checkout modal"
              className="w-8 h-8 rounded-full bg-paper-200 items-center justify-center"
            >
              <FontAwesome name="times" size={14} color="#0E0C0A" />
            </Pressable>
          </View>

          {isSuccess ? (
            /* Inline Success Hero State */
            <Pressable
              onPress={handleDismissSuccess}
              className="p-6 items-center"
            >
              <View className="w-16 h-16 rounded-full bg-sage-100 items-center justify-center mb-4 border-2 border-sage-500">
                <FontAwesome name="check" size={28} color="#4F7A24" />
              </View>

              <StyledText
                variant="extrabold"
                className="text-ink-900 text-2xl mb-1"
              >
                Sale Recorded!
              </StyledText>

              <MoneyText
                value={recordedTotal}
                size="xl"
                className="text-sage-700 font-black mb-4"
              />

              <View className="w-full flex-row justify-between space-x-3 mt-4">
                <Pressable
                  onPress={handleDismissSuccess}
                  className="flex-1 py-3 bg-paper-200 rounded-xl items-center border border-ink-150"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-ink-900 text-sm"
                  >
                    New Sale
                  </StyledText>
                </Pressable>

                <Pressable
                  onPress={handleViewReceipts}
                  className="flex-1 py-3 bg-persimmon-500 rounded-xl items-center shadow-persimmon-glow"
                >
                  <StyledText
                    variant="extrabold"
                    className="text-white text-sm"
                  >
                    View Receipts
                  </StyledText>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            /* Default Checkout Form State */
            <>
              {/* Customer & Payment Bar */}
              <View className="px-4 py-3 bg-paper-100 border-b border-paper-200">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <StyledText
                      variant="extrabold"
                      className="text-ink-500 text-[10px] uppercase tracking-wider"
                    >
                      SUKI / CUSTOMER
                    </StyledText>
                    {isCredit && !selectedCustomer && (
                      <View className="bg-persimmon-500 rounded-md px-1.5 py-0.5 ml-2">
                        <StyledText
                          variant="extrabold"
                          className="text-white text-[9px]"
                        >
                          Required
                        </StyledText>
                      </View>
                    )}
                  </View>

                  <StyledText
                    variant="extrabold"
                    className="text-ink-500 text-[10px] uppercase tracking-wider"
                  >
                    PAYMENT TYPE
                  </StyledText>
                </View>

                <View className="flex-row items-center justify-between space-x-2">
                  {/* Customer Picker Button */}
                  <Pressable
                    onPress={() => setShowCustomerPicker(true)}
                    className="flex-1 flex-row items-center bg-paper-50 rounded-xl px-3 py-2 border border-ink-150"
                  >
                    <View className="w-6 h-6 rounded-full bg-sage-500 items-center justify-center mr-2">
                      <StyledText
                        variant="extrabold"
                        className="text-white text-xs"
                      >
                        {customerName
                          ? customerName.charAt(0).toUpperCase()
                          : 'S'}
                      </StyledText>
                    </View>
                    <View className="flex-1 mr-1">
                      <StyledText
                        variant="semibold"
                        className="text-ink-900 text-xs"
                        numberOfLines={1}
                      >
                        {customerName || 'Walk-in Customer'}
                      </StyledText>
                    </View>
                    <FontAwesome
                      name="chevron-down"
                      size={10}
                      color="#7A7165"
                    />
                  </Pressable>

                  {/* Payment Type Toggle */}
                  <View className="flex-row bg-paper-200 p-1 rounded-xl border border-ink-150">
                    <Pressable
                      onPress={() => setPaymentType('cash')}
                      className={`px-3 py-1.5 rounded-lg ${
                        paymentType === 'cash' ? 'bg-persimmon-500' : ''
                      }`}
                    >
                      <StyledText
                        variant="extrabold"
                        className={`text-xs ${
                          paymentType === 'cash' ? 'text-white' : 'text-ink-700'
                        }`}
                      >
                        Cash
                      </StyledText>
                    </Pressable>
                    <Pressable
                      onPress={() => setPaymentType('credit')}
                      className={`px-3 py-1.5 rounded-lg ${
                        paymentType === 'credit' ? 'bg-persimmon-500' : ''
                      }`}
                    >
                      <StyledText
                        variant="extrabold"
                        className={`text-xs ${
                          paymentType === 'credit'
                            ? 'text-white'
                            : 'text-ink-700'
                        }`}
                      >
                        Credit
                      </StyledText>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Line Items Header */}
              <View className="px-4 py-2 flex-row justify-between items-center bg-paper-200 border-b border-paper-300">
                <StyledText
                  variant="extrabold"
                  className="text-ink-700 text-[11px] uppercase tracking-wider"
                >
                  PURCHASED PRODUCTS ({cart.itemCount})
                </StyledText>
                <StyledText variant="medium" className="text-ink-500 text-xs">
                  {totalPieces} pcs total
                </StyledText>
              </View>

              {/* Line Items List - Front and Center */}
              <ScrollView
                className="flex-1 bg-paper-50"
                showsVerticalScrollIndicator={true}
              >
                {cartItems.map((item, index) => (
                  <CheckoutLineRow
                    key={`${item.product_id}-${item.selected_unit || 'retail'}-${index}`}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </ScrollView>

              {/* Sticky Footer with Receipt Summary */}
              <View className="p-4 border-t border-paper-200 bg-paper-50">
                <View className="flex-row items-center justify-between mb-3 bg-warm-100 p-3.5 rounded-2xl border border-dashed border-warm-300">
                  <View>
                    <StyledText
                      variant="extrabold"
                      className="text-warm-700 text-[10px] tracking-wider uppercase"
                    >
                      TOTAL AMOUNT ({paymentType.toUpperCase()})
                    </StyledText>
                    <StyledText
                      variant="medium"
                      className="text-ink-600 text-xs mt-0.5"
                    >
                      {isCredit && customerName
                        ? `Credit sale for ${customerName}`
                        : `${cart.itemCount} items · ${totalPieces} pcs`}
                    </StyledText>
                  </View>

                  <MoneyText
                    value={cart.total}
                    size="xl"
                    className="text-ink-900 font-extrabold"
                  />
                </View>

                <Pressable
                  onPress={handleConfirmSubmit}
                  disabled={isSubmitDisabled}
                  className={`py-4 rounded-2xl items-center shadow-persimmon-glow ${
                    isSubmitDisabled
                      ? 'bg-ink-300 opacity-50'
                      : 'bg-persimmon-500'
                  }`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-base"
                    >
                      Confirm Sale ({formatPesos(cart.total)})
                    </StyledText>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>

      <CustomerPickerModal
        visible={showCustomerPicker}
        customers={cart.customers}
        paymentType={paymentType}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={(customer) => {
          setCustomer(customer);
          setShowCustomerPicker(false);
        }}
        onSelectOneOffName={(name) => {
          setCustomer(name);
          setShowCustomerPicker(false);
        }}
      />
    </Modal>
  );
}
