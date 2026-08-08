import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { useCartStore } from '@/stores/CartStore';
import { useCart } from '@/components/sales/pos/useCart';
import { useRenderCounter } from '@/hooks/useRenderCounter';
import { logger } from '@/lib/logger';
import { CheckoutLineRow } from './CheckoutLineRow';
import { CustomerPickerModal } from './CustomerPickerModal';
import { calculateTotalPieces, formatPesos } from '@/lib';

export interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CheckoutModal({ visible, onClose }: CheckoutModalProps) {
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

  useRenderCounter('CheckoutModal', { feature: 'checkout' });

  const enterProgress = useSharedValue(0);
  const successProgress = useSharedValue(0);

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
    if (isSuccess) {
      successProgress.value = withSpring(1, { damping: 18, stiffness: 180 });
    } else {
      successProgress.value = withTiming(0, { duration: 120 });
    }
  }, [isSuccess, successProgress]);

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

  const checkRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + successProgress.value * 0.6 }],
    opacity: successProgress.value,
  }));

  const checkMarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.5 + successProgress.value * 0.5 }],
    opacity: successProgress.value,
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
    router.push('/(tabs)/sales/receipts');
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

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
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
            accessibilityLabel={isSuccess ? 'Sale receipt' : 'Checkout summary'}
            style={[
              sheetStyle,
              isSuccess
                ? { height: '100%', maxHeight: '100%' }
                : { height: '90%', maxHeight: '90%' },
            ]}
            className={`w-full overflow-hidden bg-paper-50 ${
              isSuccess
                ? 'rounded-none h-full'
                : 'rounded-t-[28px] shadow-paper-deep'
            }`}
          >
            {/* Drag handle — shown only in modal review mode */}
            {!isSuccess && (
              <View className="items-center pt-3 pb-1 bg-paper-50">
                <View className="w-10 h-1 rounded-full bg-paper-300" />
              </View>
            )}

            {/* Header — clean parchment style, matching light app design */}
            <View
              className="px-5 pb-4 bg-paper-50 border-b border-paper-200"
              style={{ paddingTop: isSuccess ? Math.max(insets.top, 16) : 4 }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-10 h-10 items-center justify-center" />
                <View className="items-center flex-1 mx-3">
                  <StyledText
                    variant="extrabold"
                    className="text-[10px] uppercase tracking-[0.22em] text-persimmon-600"
                  >
                    {isSuccess ? 'Receipt Confirmed' : 'Checkout'}
                  </StyledText>
                  <StyledText
                    variant="black"
                    className="text-ink-900 text-xl mt-0.5"
                  >
                    {isSuccess ? 'Sale Recorded' : 'Review Order'}
                  </StyledText>
                </View>

                <Pressable
                  onPress={handleClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close checkout"
                  className="w-14 h-14 rounded-full bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
                >
                  <FontAwesome name="times" size={24} color="#E85A1F" />
                </Pressable>
              </View>

              {!isSuccess && !isEmpty && (
                <View className="flex-row items-center justify-center gap-2 mt-1">
                  <View className="px-2.5 py-1 rounded-full bg-paper-100 border border-paper-300">
                    <StyledText
                      variant="semibold"
                      className="text-ink-700 text-[11px]"
                    >
                      {itemCountLabel}
                    </StyledText>
                  </View>
                  <View className="w-1 h-1 rounded-full bg-persimmon-500" />
                  <View className="px-2.5 py-1 rounded-full bg-paper-100 border border-paper-300">
                    <StyledText
                      variant="semibold"
                      className="text-ink-700 text-[11px]"
                    >
                      {piecesLabel}
                    </StyledText>
                  </View>
                </View>
              )}
            </View>

            {isSuccess ? (
              <SaleSuccessState
                recordedTotal={recordedTotal}
                itemCountLabel={itemCountLabel}
                piecesLabel={piecesLabel}
                paymentType={paymentType}
                customerName={customerName}
                checkRingStyle={checkRingStyle}
                checkMarkStyle={checkMarkStyle}
                insets={insets}
                onNewSale={handleDismissSuccess}
                onViewReceipts={handleViewReceipts}
              />
            ) : (
              <CheckoutForm
                cartItems={cartItems}
                cart={cart}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                setShowCustomerPicker={setShowCustomerPicker}
                customerName={customerName}
                customerInitial={customerInitial}
                customerMissing={customerMissing}
                isEmpty={isEmpty}
                itemCountLabel={itemCountLabel}
                piecesLabel={piecesLabel}
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
              />
            )}
          </Animated.View>
        </View>
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

interface CheckoutFormProps {
  cartItems: ReturnType<typeof useCartStore.getState>['cartItems'];
  cart: ReturnType<typeof useCart>;
  paymentType: 'cash' | 'credit';
  setPaymentType: (type: 'cash' | 'credit') => void;
  setShowCustomerPicker: (visible: boolean) => void;
  customerName: string | undefined;
  customerInitial: string;
  customerMissing: boolean;
  isEmpty: boolean;
  itemCountLabel: string;
  piecesLabel: string;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  submitError: string | null;
  insets: { top: number; bottom: number; left: number; right: number };
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  onRemoveItem: (
    productId: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onConfirmSubmit: () => void;
  onRetry: () => void;
  onDismissError: () => void;
  clearCart: () => void;
}

function CheckoutForm({
  cartItems,
  cart,
  paymentType,
  setPaymentType,
  setShowCustomerPicker,
  customerName,
  customerInitial,
  customerMissing,
  isEmpty,
  itemCountLabel,
  piecesLabel,
  isSubmitting,
  isSubmitDisabled,
  submitError,
  insets,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmSubmit,
  onRetry,
  onDismissError,
  clearCart,
}: CheckoutFormProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  return (
    <View className="flex-1 bg-paper-50">
      {/* Buyer + Payment section — single elevated card */}
      <View className="px-4 pt-4 pb-3 bg-paper-50">
        <View
          className="rounded-3xl bg-white border border-paper-300 p-4"
          style={{
            shadowColor: '#564E45',
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="px-2 py-0.5 rounded-md bg-paper-100 border border-paper-300">
                <StyledText
                  variant="black"
                  className="text-[9px] uppercase tracking-[0.18em] text-ink-600"
                >
                  Step 01
                </StyledText>
              </View>
              <StyledText variant="extrabold" className="text-ink-900 text-sm">
                Buyer & Payment
              </StyledText>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full flex-row items-center ${
                paymentType === 'cash'
                  ? 'bg-sage-50 border border-sage-300'
                  : 'bg-amber-50 border border-amber-300'
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  paymentType === 'cash' ? 'bg-sage-500' : 'bg-semantic-warning'
                }`}
              />
              <StyledText
                variant="extrabold"
                className={`text-[10px] uppercase tracking-wider ${
                  paymentType === 'cash' ? 'text-sage-700' : 'text-amber-800'
                }`}
              >
                {paymentType === 'cash' ? 'Cash' : 'Utang'}
              </StyledText>
            </View>
          </View>

          <View className="flex-row items-stretch gap-2.5">
            <View className="flex-1">
              <CustomerPicker
                customerName={customerName}
                customerInitial={customerInitial}
                customerMissing={customerMissing}
                onPress={() => setShowCustomerPicker(true)}
              />
            </View>
            <View className="flex-shrink-0">
              <PaymentTypeToggle
                paymentType={paymentType}
                onChange={setPaymentType}
              />
            </View>
          </View>

          {customerMissing && (
            <View className="mt-3 px-3 py-2.5 rounded-2xl bg-semantic-warning-50 border border-semantic-warning/30 flex-row items-center">
              <View className="w-7 h-7 rounded-full bg-semantic-warning items-center justify-center mr-2.5">
                <FontAwesome name="exclamation" size={12} color="#FAFAF7" />
              </View>
              <StyledText
                variant="semibold"
                className="text-ink-900 text-caption flex-1"
                accessibilityLiveRegion="polite"
              >
                Add a suki to record this on the credit ledger.
              </StyledText>
            </View>
          )}
        </View>
      </View>

      {/* Line items section — editorial header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="px-2 py-0.5 rounded-md bg-paper-100 border border-paper-300">
            <StyledText
              variant="black"
              className="text-[9px] uppercase tracking-[0.18em] text-ink-600"
            >
              Step 02
            </StyledText>
          </View>
          <StyledText variant="extrabold" className="text-ink-900 text-sm">
            Order Items
          </StyledText>
        </View>
        {showClearConfirm ? (
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => {
                logger.info(
                  {
                    event: 'checkout_clear_all',
                    feature: 'checkout',
                    itemCount: cartItems.length,
                  },
                  'checkout clear all triggered',
                );
                clearCart();
                setShowClearConfirm(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Confirm clear all cart items"
              className="flex-row items-center bg-semantic-danger px-2.5 py-1 rounded-full active:opacity-80"
              hitSlop={4}
            >
              <StyledText
                variant="extrabold"
                className="text-white text-[11px]"
              >
                Confirm?
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setShowClearConfirm(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel clear all"
              className="flex-row items-center bg-paper-200 border border-paper-300 px-2.5 py-1 rounded-full active:opacity-80"
              hitSlop={4}
            >
              <StyledText
                variant="extrabold"
                className="text-ink-700 text-[11px]"
              >
                Cancel
              </StyledText>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <StyledText
              variant="medium"
              className="text-ink-500 text-[11px]"
              numberOfLines={1}
            >
              {itemCountLabel} · {piecesLabel}
            </StyledText>
            {!isEmpty && (
              <Pressable
                onPress={() => setShowClearConfirm(true)}
                accessibilityRole="button"
                accessibilityLabel="Clear all cart items"
                className="flex-row items-center bg-semantic-danger-50 border border-semantic-danger/30 px-2.5 py-1 rounded-full active:opacity-80"
                hitSlop={4}
              >
                <FontAwesome
                  name="trash"
                  size={10}
                  color="#C13030"
                  style={{ marginRight: 4 }}
                />
                <StyledText
                  variant="extrabold"
                  className="text-semantic-danger text-[11px]"
                >
                  Clear
                </StyledText>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Line items list — clean dividers */}
      <View className="flex-1 bg-paper-50">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            isEmpty ? { flexGrow: 1, justifyContent: 'center' } : undefined
          }
        >
          {isEmpty ? (
            <EmptyCart />
          ) : (
            <View className="mx-4 rounded-3xl bg-white border border-paper-300 overflow-hidden">
              {cartItems.map((item, index) => (
                <View
                  key={`${item.product_id}-${item.selected_unit || 'retail'}-${index}`}
                >
                  <CheckoutLineRow
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemoveItem}
                  />
                  {index < cartItems.length - 1 && (
                    <View className="ml-5 mr-5 h-px bg-paper-200" />
                  )}
                </View>
              ))}
            </View>
          )}
          <View className="h-4" />
        </ScrollView>
      </View>

      {/* Footer — total + CTA */}
      <View
        className="px-4 pt-3 bg-paper-50"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {submitError && (
          <SubmitErrorBanner
            message={submitError}
            onDismiss={onDismissError}
            onRetry={onRetry}
          />
        )}

        {/* Total receipt card — clean elevated parchment style, matching light app design */}
        <View
          className={`rounded-3xl p-4 mb-3 overflow-hidden bg-white border ${
            paymentType === 'cash'
              ? 'border-sage-200 bg-sage-50/20'
              : 'border-amber-200 bg-amber-50/20'
          }`}
          style={{
            shadowColor: '#564E45',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
          accessibilityRole="summary"
          accessibilityLabel="Order total"
        >
          <View className="flex-row items-end justify-between mb-2">
            <View className="flex-1 mr-3 min-w-0">
              <StyledText
                variant="black"
                className={`text-[10px] uppercase tracking-[0.24em] ${
                  paymentType === 'cash' ? 'text-sage-700' : 'text-amber-800'
                }`}
              >
                Amount Due
              </StyledText>
              <StyledText
                variant="medium"
                className="text-ink-500 text-[11px] mt-1"
                numberOfLines={1}
              >
                {paymentType === 'credit' && customerName
                  ? `Charging to ${customerName}`
                  : `${itemCountLabel} · ${piecesLabel}`}
              </StyledText>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full border ${
                paymentType === 'cash'
                  ? 'bg-sage-50 border-sage-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] uppercase tracking-wider ${
                  paymentType === 'cash' ? 'text-sage-700' : 'text-amber-800'
                }`}
              >
                {paymentType === 'cash' ? 'Cash Sale' : 'Credit'}
              </StyledText>
            </View>
          </View>

          <View className="flex-row items-baseline">
            <MoneyText
              value={cart.total}
              size="display"
              numberOfLines={1}
              className="text-ink-900 flex-1"
            />
            <StyledText
              variant="black"
              className="text-ink-400 text-xs ml-2 mb-1 uppercase tracking-widest"
            >
              PHP
            </StyledText>
          </View>
        </View>

        <SwipeConfirmButton
          onConfirm={onConfirmSubmit}
          disabled={isSubmitDisabled}
          isSubmitting={isSubmitting}
          isEmpty={isEmpty}
          customerMissing={customerMissing}
          paymentType={paymentType}
          total={cart.total}
        />
      </View>
    </View>
  );
}

interface CustomerPickerProps {
  customerName: string | undefined;
  customerInitial: string;
  customerMissing: boolean;
  onPress: () => void;
}

function CustomerPicker({
  customerName,
  customerInitial,
  customerMissing,
  onPress,
}: CustomerPickerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        customerName ? `Customer: ${customerName}` : 'Select customer'
      }
      accessibilityHint="Opens customer selection dialog"
      className={`min-h-[48px] flex-row items-center rounded-2xl px-3 py-2 border active:opacity-80 ${
        customerMissing
          ? 'border-semantic-warning bg-semantic-warning-50/70'
          : customerName
            ? 'border-cinnamon-200/80 bg-cinnamon-50/30'
            : 'border-paper-300 bg-paper-50'
      }`}
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${
          customerMissing
            ? 'bg-semantic-warning'
            : customerName
              ? 'bg-cinnamon-500'
              : 'bg-paper-200 border border-paper-300'
        }`}
      >
        <StyledText
          variant="black"
          className={`text-sm ${
            customerMissing || customerName ? 'text-white' : 'text-ink-700'
          }`}
        >
          {customerMissing ? '!' : customerInitial}
        </StyledText>
      </View>
      <View className="flex-1 mr-1 min-w-0">
        <StyledText
          variant="black"
          className="text-[10px] uppercase tracking-[0.18em] text-ink-500"
        >
          Suki
        </StyledText>
        <StyledText
          variant="semibold"
          className="text-ink-900 text-[13px] mt-0.5"
          numberOfLines={1}
        >
          {customerName ?? 'Walk-in buyer'}
        </StyledText>
      </View>
      <FontAwesome name="chevron-down" size={11} color="#7A7165" />
    </Pressable>
  );
}

interface PaymentTypeToggleProps {
  paymentType: 'cash' | 'credit';
  onChange: (type: 'cash' | 'credit') => void;
}

function PaymentTypeToggle({ paymentType, onChange }: PaymentTypeToggleProps) {
  return (
    <View
      className="flex-row bg-paper-100 rounded-2xl p-1 border border-paper-300"
      accessibilityRole="radiogroup"
    >
      <PaymentTypeButton
        type="cash"
        label="Cash"
        icon="money"
        active={paymentType === 'cash'}
        onPress={() => onChange('cash')}
        accessibilityLabel="Pay with cash"
      />
      <PaymentTypeButton
        type="credit"
        label="Utang"
        icon="book"
        active={paymentType === 'credit'}
        onPress={() => onChange('credit')}
        accessibilityLabel="Pay on credit (utang)"
      />
    </View>
  );
}

interface PaymentTypeButtonProps {
  type: 'cash' | 'credit';
  label: string;
  icon: 'money' | 'book';
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function PaymentTypeButton({
  type,
  label,
  icon,
  active,
  onPress,
  accessibilityLabel,
}: PaymentTypeButtonProps) {
  const activeBg = type === 'cash' ? 'bg-sage-600' : 'bg-amber-600';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      className={`min-w-[58px] min-h-[40px] px-2.5 rounded-xl flex-row items-center justify-center active:opacity-80 ${
        active ? activeBg : 'active:bg-paper-200'
      }`}
    >
      <FontAwesome
        name={icon}
        size={11}
        color={active ? '#FFFFFF' : '#564E45'}
        style={{ marginRight: 5 }}
      />
      <StyledText
        variant="extrabold"
        className={`text-[12px] ${active ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

function EmptyCart() {
  return (
    <View className="items-center justify-center px-8 py-10 mx-4 my-auto rounded-3xl bg-persimmon-50/40 border border-persimmon-200/50">
      <View className="w-16 h-16 rounded-2xl bg-persimmon-100/80 items-center justify-center mb-3 border border-persimmon-200">
        <FontAwesome name="shopping-basket" size={24} color="#E85A1F" />
      </View>
      <StyledText
        variant="black"
        className="text-ink-900 text-base text-center"
      >
        Your cart is empty
      </StyledText>
      <StyledText
        variant="medium"
        className="text-ink-600 text-[13px] text-center mt-1 max-w-[240px]"
      >
        Pick items from the catalog to start building your order.
      </StyledText>
    </View>
  );
}

interface SubmitErrorBannerProps {
  message: string;
  onDismiss: () => void;
  onRetry: () => void;
}

function SubmitErrorBanner({
  message,
  onDismiss,
  onRetry,
}: SubmitErrorBannerProps) {
  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      className="mb-3 px-4 py-3 rounded-2xl bg-semantic-danger-50 border border-semantic-danger/30 flex-row items-center"
    >
      <View className="w-9 h-9 rounded-xl bg-semantic-danger items-center justify-center mr-3">
        <FontAwesome name="exclamation-circle" size={16} color="#FFFFFF" />
      </View>
      <View className="flex-1 mr-2 min-w-0">
        <StyledText
          variant="black"
          className="text-semantic-danger text-[11px] uppercase tracking-wider"
        >
          Recording Failed
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-700 text-[12px] mt-0.5"
          numberOfLines={2}
        >
          {message}
        </StyledText>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry recording sale"
          className="px-3 py-2 rounded-xl bg-semantic-danger active:opacity-80"
          hitSlop={6}
        >
          <StyledText variant="extrabold" className="text-white text-[12px]">
            Retry
          </StyledText>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          hitSlop={8}
          className="w-8 h-8 rounded-full items-center justify-center active:bg-semantic-danger-100"
        >
          <FontAwesome name="times" size={12} color="#C13030" />
        </Pressable>
      </View>
    </View>
  );
}

interface SaleSuccessStateProps {
  recordedTotal: number;
  itemCountLabel: string;
  piecesLabel: string;
  paymentType: 'cash' | 'credit';
  customerName: string | undefined;
  checkRingStyle: any;
  checkMarkStyle: any;
  insets: { top: number; bottom: number; left: number; right: number };
  onNewSale: () => void;
  onViewReceipts: () => void;
}

function SaleSuccessState({
  recordedTotal,
  itemCountLabel,
  piecesLabel,
  paymentType,
  customerName,
  checkRingStyle,
  checkMarkStyle,
  insets,
  onNewSale,
  onViewReceipts,
}: SaleSuccessStateProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="flex-1 bg-paper-50 justify-between"
    >
      {/* Receipt header & details */}
      <View className="items-center pt-6 pb-4 px-6 bg-paper-50">
        <Animated.View
          style={[
            checkRingStyle,
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#EEF4E5',
              borderWidth: 1,
              borderColor: '#D7E5BF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            },
          ]}
        >
          <Animated.View
            style={[
              checkMarkStyle,
              {
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#4F7A24',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <FontAwesome name="check" size={24} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        <StyledText
          variant="black"
          className="text-[10px] uppercase tracking-[0.24em] text-sage-700"
        >
          Receipt Confirmed
        </StyledText>
        <StyledText variant="black" className="text-ink-900 text-[24px] mt-1">
          Sale Recorded
        </StyledText>

        <View className="mt-4 w-full">
          <View
            className="rounded-3xl p-5 bg-white border border-paper-300"
            style={{
              shadowColor: '#564E45',
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <View className="flex-row items-end justify-between mb-2">
              <View className="flex-1 mr-2">
                <StyledText
                  variant="black"
                  className="text-[10px] uppercase tracking-[0.22em] text-persimmon-600"
                >
                  Total Recorded
                </StyledText>
              </View>
              <View
                className={`px-2.5 py-1 rounded-full border ${
                  paymentType === 'cash'
                    ? 'bg-sage-50 border-sage-300'
                    : 'bg-amber-50 border-amber-300'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-[10px] uppercase tracking-wider ${
                    paymentType === 'cash' ? 'text-sage-700' : 'text-amber-800'
                  }`}
                >
                  {paymentType === 'cash' ? 'Paid' : 'Charged'}
                </StyledText>
              </View>
            </View>

            <View className="flex-row items-baseline">
              <MoneyText
                value={recordedTotal}
                size="hero"
                numberOfLines={1}
                className="text-ink-900 flex-1"
              />
              <StyledText
                variant="black"
                className="text-ink-400 text-xs ml-2 mb-1.5 uppercase tracking-widest"
              >
                PHP
              </StyledText>
            </View>

            <View className="flex-row items-center gap-2 mt-4">
              <View className="flex-1 px-3 py-2 rounded-xl bg-paper-100 border border-paper-300">
                <StyledText
                  variant="black"
                  className="text-[9px] uppercase tracking-widest text-ink-500"
                >
                  Items
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-[12px] mt-0.5"
                >
                  {itemCountLabel}
                </StyledText>
              </View>
              <View className="flex-1 px-3 py-2 rounded-xl bg-paper-100 border border-paper-300">
                <StyledText
                  variant="black"
                  className="text-[9px] uppercase tracking-widest text-ink-500"
                >
                  Pieces
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-[12px] mt-0.5"
                >
                  {piecesLabel}
                </StyledText>
              </View>
              <View className="flex-1 px-3 py-2 rounded-xl bg-paper-100 border border-paper-300">
                <StyledText
                  variant="black"
                  className="text-[9px] uppercase tracking-widest text-ink-500"
                >
                  Type
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-[12px] mt-0.5"
                  numberOfLines={1}
                >
                  {paymentType === 'cash' ? 'Cash' : 'Utang'}
                </StyledText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Receipt perforation line */}
      <View className="flex-row items-center px-6 py-3 bg-paper-50">
        <View className="flex-1 h-px border-t border-dashed border-paper-300" />
        <StyledText
          variant="black"
          className="text-[9px] uppercase tracking-[0.3em] text-ink-400 mx-3"
        >
          End of Receipt
        </StyledText>
        <View className="flex-1 h-px border-t border-dashed border-paper-300" />
      </View>

      {/* Actions */}
      <View
        className="px-5 bg-paper-50"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={onNewSale}
            accessibilityRole="button"
            accessibilityLabel="Start a new sale"
            className="flex-1 min-h-[52px] py-3.5 bg-paper-100 rounded-2xl items-center justify-center border border-paper-300 active:bg-paper-200 flex-row"
          >
            <FontAwesome
              name="plus"
              size={12}
              color="#0E0C0A"
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-[13px]"
            >
              New Sale
            </StyledText>
          </Pressable>

          <Pressable
            onPress={onViewReceipts}
            accessibilityRole="button"
            accessibilityLabel="View saved receipts"
            className="flex-1 min-h-[52px] py-3.5 bg-persimmon-500 rounded-2xl items-center justify-center shadow-persimmon-glow active:bg-persimmon-600 flex-row"
          >
            <FontAwesome
              name="list-alt"
              size={12}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <StyledText variant="extrabold" className="text-white text-[13px]">
              View Receipts
            </StyledText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

interface SwipeConfirmButtonProps {
  onConfirm: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  isEmpty: boolean;
  customerMissing: boolean;
  paymentType: 'cash' | 'credit';
  total: number;
}

function SwipeConfirmButton({
  onConfirm,
  disabled,
  isSubmitting,
  isEmpty,
  customerMissing,
  paymentType,
  total,
}: SwipeConfirmButtonProps) {
  const translateX = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const confirmed = useSharedValue(false);

  const THUMB_SIZE = 52;
  const PADDING = 4;

  const pan = Gesture.Pan()
    .enabled(!disabled && !isSubmitting)
    .onUpdate((e) => {
      const maxTranslate = containerWidth.value - THUMB_SIZE - PADDING * 2;
      translateX.value = Math.max(0, Math.min(e.translationX, maxTranslate));
      if (translateX.value >= maxTranslate * 0.8 && !confirmed.value) {
        confirmed.value = true;
        runOnJS(onConfirm)();
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
      confirmed.value = false;
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelOpacity = useAnimatedStyle(() => ({
    opacity:
      1 -
      translateX.value /
        Math.max(containerWidth.value - THUMB_SIZE - PADDING * 2, 1),
  }));

  if (disabled) {
    const icon = isEmpty
      ? 'shopping-cart'
      : customerMissing
        ? 'user-plus'
        : 'check';
    const label = isEmpty
      ? 'Add Items'
      : customerMissing
        ? 'Select Customer'
        : `Confirm · ${formatPesos(total)}`;
    return (
      <View className="h-[60px] rounded-[30px] flex-row items-center justify-center bg-paper-300 border border-paper-400">
        <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5 bg-ink-400">
          <FontAwesome name={icon} size={12} color="#FAFAF7" />
        </View>
        <StyledText
          variant="black"
          className="text-[15px] uppercase tracking-wider text-ink-600"
          numberOfLines={1}
        >
          {label}
        </StyledText>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View
        className={`h-[60px] rounded-[30px] flex-row items-center justify-center ${
          paymentType === 'cash' ? 'bg-persimmon-500' : 'bg-amber-600'
        }`}
      >
        <ActivityIndicator color="#FFFFFF" size="small" />
        <StyledText variant="extrabold" className="text-white text-base ml-2.5">
          Recording sale...
        </StyledText>
      </View>
    );
  }

  const activeBg = paymentType === 'cash' ? 'bg-persimmon-500' : 'bg-amber-600';

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        className={`h-[60px] rounded-[30px] overflow-hidden ${activeBg}`}
        onLayout={(e) => {
          containerWidth.value = e.nativeEvent.layout.width;
        }}
        accessibilityRole="button"
        accessibilityLabel={`Slide to confirm sale for ${formatPesos(total)}`}
      >
        {/* Track label */}
        <Animated.View
          className="absolute inset-0 items-center justify-center"
          style={labelOpacity}
        >
          <StyledText
            variant="black"
            className="text-white text-[14px] uppercase tracking-wider"
            numberOfLines={1}
          >
            Slide to Confirm · {formatPesos(total)}
          </StyledText>
        </Animated.View>

        {/* Thumb knob */}
        <Animated.View
          className="absolute top-[4px] left-[4px] w-[52px] h-[52px] rounded-full bg-white/25 items-center justify-center"
          style={thumbStyle}
        >
          <FontAwesome name="chevron-right" size={16} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
