import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { useCartStore } from '@/stores/CartStore';
import { useCart } from '@/components/sales/pos/useCart';
import { logger } from '@/lib/logger';
import { CustomerPickerModal } from './CustomerPickerModal';
import { CheckoutForm } from './checkout/CheckoutForm';
import { SaleSuccessState } from './checkout/SaleSuccessState';
import { calculateTotalPieces } from '@/lib';

export interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onParkCart?: () => void;
}

export function CheckoutModal({
  visible,
  onClose,
  onParkCart,
}: CheckoutModalProps) {
  const insets = useSafeAreaInsets();

  const cartItems = useCartStore((s) => s.cartItems);
  const paymentType = useCartStore((s) => s.paymentType);
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const setPaymentType = useCartStore((s) => s.setPaymentType);
  const setCustomer = useCartStore((s) => s.setCustomer);

  const cart = useCart();

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [recordedTotal, setRecordedTotal] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPaymentTypeRef = useRef(paymentType);

  const enterProgress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      enterProgress.value = withTiming(1, {
        duration: 320,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    } else {
      enterProgress.value = 0;
    }
  }, [visible, enterProgress]);

  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
      setIsSubmitting(false);
      setSubmitError(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [visible]);

  useEffect(() => {
    if (prevPaymentTypeRef.current !== paymentType) {
      logger.info(
        {
          event: 'checkout_payment_type_changed',
          feature: 'checkout',
          from: prevPaymentTypeRef.current,
          to: paymentType,
          customerWasString: typeof selectedCustomer === 'string',
          hasCustomer: selectedCustomer != null,
        },
        'payment type changed',
      );
      prevPaymentTypeRef.current = paymentType;
    }
  }, [paymentType, selectedCustomer]);

  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    logger.info(
      {
        event: 'checkout_inner_customer_picker_visibility',
        feature: 'checkout',
        visible: showCustomerPicker,
        paymentType,
      },
      'inner customer picker visibility changed',
    );
  }, [showCustomerPicker, paymentType]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: enterProgress.value,
    transform: [{ translateY: (1 - enterProgress.value) * 32 }],
  }));

  const totalPieces = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          calculateTotalPieces(
            item.quantity,
            item.selected_unit,
            item.conversion_factor,
          ),
        0,
      ),
    [cartItems],
  );

  const customerName =
    typeof selectedCustomer === 'string'
      ? selectedCustomer
      : selectedCustomer?.name;

  const customerInitial = (customerName ?? 'W').charAt(0).toUpperCase();
  const isCredit = paymentType === 'credit';
  const customerMissing = isCredit && !selectedCustomer;
  const isEmpty = cartItems.length === 0;
  const isSubmitDisabled = isSubmitting || cart.isSubmitDisabled || isEmpty;

  const itemCountLabel = useMemo(
    () =>
      cart.itemCount === 0
        ? '0 items'
        : cart.itemCount === 1
          ? '1 item'
          : `${cart.itemCount} items`,
    [cart.itemCount],
  );

  const piecesLabel = useMemo(
    () => (totalPieces === 1 ? '1 pc total' : `${totalPieces} pcs total`),
    [totalPieces],
  );

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    Haptics.impactAsync(style).catch(() => {});
  }, []);

  const handleDismissSuccess = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearCart();
    setIsSuccess(false);
    onClose();
  }, [clearCart, onClose]);

  const handleConfirmSubmit = useCallback(async () => {
    if (isSubmitDisabled) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    setSubmitError(null);
    setRecordedTotal(cart.total);
    try {
      const success = await cart.submit();
      if (success) {
        setIsSuccess(true);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      } else {
        setSubmitError('Sale was not recorded. Please try again.');
        triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while recording the sale.',
      );
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, isSubmitDisabled, triggerHaptic]);

  const handleViewReceipts = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/sales/receipts' as Href);
    handleDismissSuccess();
  }, [handleDismissSuccess, triggerHaptic]);

  const handleRetry = useCallback(() => {
    setSubmitError(null);
    void handleConfirmSubmit();
  }, [handleConfirmSubmit]);

  const handleRemoveItem = useCallback(
    (productId: number, selectedUnit?: 'retail' | 'wholesale') => {
      const line = cartItems.find(
        (item) =>
          item.product_id === productId &&
          (item.selected_unit || 'retail') === (selectedUnit || 'retail'),
      );
      if (line) {
        updateQuantity(productId, -line.quantity, selectedUnit);
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [cartItems, updateQuantity, triggerHaptic],
  );

  const handleClose = useCallback(() => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (isSuccess) handleDismissSuccess();
    else onClose();
  }, [isSuccess, handleDismissSuccess, onClose, triggerHaptic]);

  const handleBackdropPress = useCallback(() => {
    if (isSuccess) handleDismissSuccess();
    else onClose();
  }, [isSuccess, handleDismissSuccess, onClose]);

  const handlePark = useMemo(
    () =>
      onParkCart
        ? () => {
            handleClose();
            onParkCart();
          }
        : undefined,
    [onParkCart, handleClose],
  );

  return (
    <>
      <Modal
        visible={visible}
        // transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className="flex-1 justify-end bg-black/65">
            <Pressable
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no"
              onPress={handleBackdropPress}
              className="absolute inset-0"
            />
            <Animated.View
              accessibilityViewIsModal
              accessibilityRole="summary"
              accessibilityLabel={
                isSuccess
                  ? isCredit
                    ? 'Utang receipt'
                    : 'Sale receipt'
                  : 'Checkout summary'
              }
              style={[
                sheetStyle,
                isSuccess
                  ? { height: '100%', maxHeight: '100%' }
                  : { height: '90%', maxHeight: '90%' },
              ]}
              className={`w-full overflow-hidden bg-paper-50 ${
                isSuccess ? 'rounded-none' : 'rounded-t-2xl'
              }`}
            >
              {/* Header: title and count on the left, one close target on the right */}
              <View
                className="px-4 pb-3 bg-paper-50 border-b border-paper-300 flex-row items-center justify-between"
                style={{
                  paddingTop: isSuccess ? Math.max(insets.top, 16) : 16,
                }}
              >
                <View className="flex-1 mr-3 min-w-0">
                  <StyledText
                    variant="black"
                    className="text-ink-900 text-xl"
                    accessibilityRole="header"
                  >
                    {isSuccess ? 'Receipt' : 'Review order'}
                  </StyledText>
                  {!isSuccess && !isEmpty && (
                    <StyledText
                      variant="medium"
                      className="text-ink-500 text-[13px] mt-0.5"
                      numberOfLines={1}
                    >
                      {itemCountLabel} · {piecesLabel}
                    </StyledText>
                  )}
                </View>

                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Close checkout"
                  className="w-12 h-12 rounded-full bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-300"
                >
                  <FontAwesome name="times" size={20} color="#28231D" />
                </Pressable>
              </View>

              {isSuccess ? (
                <SaleSuccessState
                  recordedTotal={recordedTotal}
                  itemCountLabel={itemCountLabel}
                  piecesLabel={piecesLabel}
                  paymentType={paymentType}
                  customerName={customerName}
                  insets={insets}
                  onNewSale={handleDismissSuccess}
                  onViewReceipts={handleViewReceipts}
                />
              ) : (
                <CheckoutForm
                  cartItems={cartItems}
                  total={cart.total}
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  onPickCustomer={() => setShowCustomerPicker(true)}
                  customerName={customerName}
                  customerInitial={customerInitial}
                  customerMissing={customerMissing}
                  isEmpty={isEmpty}
                  isSubmitting={isSubmitting}
                  isSubmitDisabled={isSubmitDisabled}
                  submitError={submitError}
                  insets={insets}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onConfirmSubmit={handleConfirmSubmit}
                  onRetry={handleRetry}
                  onDismissError={() => setSubmitError(null)}
                  clearCart={clearCart}
                  onPark={handlePark}
                />
              )}
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      </Modal>

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
    </>
  );
}
