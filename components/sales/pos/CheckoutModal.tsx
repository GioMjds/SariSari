import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { useCartStore } from '@/stores/CartStore';
import { useCart } from '@/components/sales/pos/useCart';
import { CheckoutLineRow } from './CheckoutLineRow';
import { CustomerPickerModal } from './CustomerPickerModal';
import { calculateTotalPieces, formatPesos } from '@/lib';

export interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CheckoutModal({ visible, onClose }: CheckoutModalProps) {
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
      setIsSubmitting(false);
      setSubmitError(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [visible]);

  // Cleanup the auto-dismiss timer if the component unmounts mid-flight.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  const handleDismissSuccess = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearCart();
    setIsSuccess(false);
    onClose();
  }, [clearCart, onClose]);

  const handleConfirmSubmit = useCallback(async () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setRecordedTotal(cart.total);
    try {
      const success = await cart.submit();
      if (success) {
        setIsSuccess(true);
        timerRef.current = setTimeout(() => {
          handleDismissSuccess();
        }, 2500);
      } else {
        setSubmitError('Sale was not recorded. Please try again.');
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while recording the sale.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [handleDismissSuccess, cart, isSubmitDisabled]);

  const handleViewReceipts = useCallback(() => {
    router.push('/(tabs)/sales/receipts');
    handleDismissSuccess();
  }, [handleDismissSuccess]);

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
      }
    },
    [cartItems, updateQuantity],
  );

  const handleClose = useCallback(() => {
    if (isSuccess) handleDismissSuccess();
    else onClose();
  }, [isSuccess, handleDismissSuccess, onClose]);

  const handleBackdropPress = useCallback(() => {
    if (isSuccess) handleDismissSuccess();
    else onClose();
  }, [isSuccess, handleDismissSuccess, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(14, 12, 10, 0.55)' }}
      >
        <Pressable
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          onPress={handleBackdropPress}
          className="absolute inset-0"
        />
        <View
          accessibilityViewIsModal
          accessibilityRole="summary"
          accessibilityLabel="Checkout summary"
          className="w-full rounded-t-3xl overflow-hidden bg-paper-50 shadow-paper-deep"
          style={{ height: '85%', maxHeight: '85%' }}
        >
          {/* Perforated tear edge — visual seal at top of thermal receipt */}
          <View
            accessible={false}
            className="h-2.5 flex-row justify-between bg-paper-200 overflow-hidden"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={`perf-${i}`}
                className="w-2.5 h-2.5 rounded-full bg-paper-50 -mt-1.5"
              />
            ))}
          </View>

          {/* Header — title + item total + close affordance */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-4 border-b border-dashed border-paper-300 bg-paper-50">
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close checkout"
              className="w-10 h-10 items-center justify-center rounded-full active:bg-paper-200"
            >
              <FontAwesome name="chevron-left" size={16} color="`#0E0C0A`" />
            </Pressable>
            <View className="items-center flex-1 mx-2">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-h2 uppercase tracking-widest"
              >
                {isSuccess ? 'Sale Recorded' : 'Checkout'}
              </StyledText>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close checkout"
              className="w-10 h-10 rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
            >
              <FontAwesome name="times" size={14} color="`#0E0C0A`" />
            </Pressable>
          </View>

          {isSuccess ? (
            <SaleSuccessState
              recordedTotal={recordedTotal}
              itemCountLabel={itemCountLabel}
              piecesLabel={piecesLabel}
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
              onUpdateQuantity={updateQuantity}
              onRemoveItem={handleRemoveItem}
              onConfirmSubmit={handleConfirmSubmit}
              onRetry={handleRetry}
              onDismissError={() => setSubmitError(null)}
            />
          )}
        </View>
      </View>

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
  onUpdateQuantity: ReturnType<typeof useCartStore.getState>['updateQuantity'];
  onRemoveItem: (
    productId: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onConfirmSubmit: () => void;
  onRetry: () => void;
  onDismissError: () => void;
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
  onUpdateQuantity,
  onRemoveItem,
  onConfirmSubmit,
  onRetry,
  onDismissError,
}: CheckoutFormProps) {
  return (
    <View className="flex-1">
      {/* Payment + Customer Card */}
      <View className="px-5 pt-4 pb-4 bg-paper-100 border-b border-paper-300">
        <View className="flex-row items-center justify-between mb-3">
          <StyledText
            variant="extrabold"
            className="text-ink-500 text-label uppercase"
          >
            Customer
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-ink-500 text-label uppercase"
          >
            Payment
          </StyledText>
        </View>

        <View className="flex-row items-stretch gap-2">
          <CustomerPicker
            customerName={customerName}
            customerInitial={customerInitial}
            customerMissing={customerMissing}
            onPress={() => setShowCustomerPicker(true)}
          />

          <PaymentTypeToggle
            paymentType={paymentType}
            onChange={setPaymentType}
          />
        </View>

        {customerMissing && (
          <StyledText
            variant="semibold"
            className="text-semantic-warning text-caption mt-2.5"
            accessibilityLiveRegion="polite"
          >
            Credit sales need a customer to track on the ledger.
          </StyledText>
        )}
      </View>

      {/* Line items header */}
      <View className="px-5 py-2.5 flex-row justify-between items-center bg-paper-200 border-b border-paper-300">
        <StyledText
          variant="extrabold"
          className="text-ink-700 text-label uppercase"
        >
          Purchased Products
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-500 text-caption"
          numberOfLines={1}
        >
          {itemCountLabel} · {piecesLabel}
        </StyledText>
      </View>

      {/* Line items */}
      <ScrollView
        className="flex-1 bg-paper-50"
        showsVerticalScrollIndicator
        contentContainerStyle={
          isEmpty ? { flexGrow: 1, justifyContent: 'center' } : undefined
        }
      >
        {isEmpty ? (
          <EmptyCart />
        ) : (
          cartItems.map((item, index) => (
            <CheckoutLineRow
              key={`${item.product_id}-${item.selected_unit || 'retail'}-${index}`}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </ScrollView>

      {/* Footer — total + primary action */}
      <View className="px-5 pt-4 pb-5 border-t-2 border-dashed border-paper-300 bg-paper-50">
        {submitError && (
          <SubmitErrorBanner
            message={submitError}
            onDismiss={onDismissError}
            onRetry={onRetry}
          />
        )}

        <View
          className="flex-row items-end justify-between mb-4 bg-warm-100 px-4 py-3.5 rounded-2xl border border-warm-300"
          accessibilityRole="summary"
          accessibilityLabel="Order total"
        >
          <View className="flex-1 mr-3 min-w-0">
            <StyledText
              variant="extrabold"
              className="text-warm-700 text-label uppercase"
            >
              Total · {paymentType === 'cash' ? 'Cash' : 'Credit'}
            </StyledText>
            <StyledText
              variant="medium"
              className="text-ink-600 text-caption mt-0.5"
              numberOfLines={1}
            >
              {paymentType === 'credit' && customerName
                ? `Charging ${customerName}`
                : `${itemCountLabel} · ${piecesLabel}`}
            </StyledText>
          </View>
          <MoneyText
            value={cart.total}
            size="display"
            numberOfLines={1}
            className="text-ink-900"
          />
        </View>

        <Pressable
          onPress={onConfirmSubmit}
          disabled={isSubmitDisabled}
          accessibilityRole="button"
          accessibilityLabel={
            isEmpty
              ? 'Cart is empty'
              : customerMissing
                ? 'Select a customer to confirm credit sale'
                : `Confirm sale for ${formatPesos(cart.total)}`
          }
          accessibilityState={{
            disabled: isSubmitDisabled,
            busy: isSubmitting,
          }}
          className={`py-4 rounded-2xl items-center flex-row justify-center ${
            isSubmitDisabled
              ? 'bg-ink-300'
              : 'bg-persimmon-500 active:bg-persimmon-600 shadow-persimmon-glow'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome
                name="check"
                size={14}
                color={isSubmitDisabled ? '#7A7165' : '#FFFFFF'}
                style={{ marginRight: 8 }}
              />
              <StyledText
                variant="extrabold"
                className={`text-base ${
                  isSubmitDisabled ? 'text-ink-100' : 'text-white'
                }`}
                numberOfLines={1}
              >
                {isEmpty
                  ? 'Add items to checkout'
                  : customerMissing
                    ? 'Pick a customer'
                    : 'Confirm Sale'}
              </StyledText>
            </>
          )}
        </Pressable>
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
      className={`flex-1 flex-row items-center bg-paper-50 rounded-xl px-3.5 py-3 border min-w-0 active:bg-paper-200 ${
        customerMissing
          ? 'border-semantic-warning bg-semantic-warning-50/20'
          : customerName
            ? 'border-ink-300'
            : 'border-ink-200'
      }`}
    >
      <View
        className={`w-7 h-7 rounded-full items-center justify-center mr-2.5 ${
          customerMissing ? 'bg-semantic-warning-100' : 'bg-sage-500'
        }`}
      >
        <StyledText
          variant="extrabold"
          className={`text-caption ${
            customerMissing ? 'text-semantic-warning' : 'text-white'
          }`}
        >
          {customerMissing ? '!' : customerInitial}
        </StyledText>
      </View>
      <View className="flex-1 mr-1 min-w-0">
        <StyledText
          variant="semibold"
          className="text-ink-900 text-caption"
          numberOfLines={1}
        >
          {customerName ?? 'Walk-in customer'}
        </StyledText>
      </View>
      <FontAwesome name="chevron-down" size={10} color="#7A7165" />
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
      className="flex-row bg-paper-200 p-1 rounded-xl border border-ink-150"
      accessibilityRole="radiogroup"
    >
      <PaymentTypeButton
        label="Cash"
        icon="money"
        active={paymentType === 'cash'}
        onPress={() => onChange('cash')}
        accessibilityLabel="Pay with cash"
      />
      <PaymentTypeButton
        label="Credit"
        icon="book"
        active={paymentType === 'credit'}
        onPress={() => onChange('credit')}
        accessibilityLabel="Pay on credit (utang)"
      />
    </View>
  );
}

interface PaymentTypeButtonProps {
  label: string;
  icon: 'money' | 'book';
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function PaymentTypeButton({
  label,
  icon,
  active,
  onPress,
  accessibilityLabel,
}: PaymentTypeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      className={`px-3.5 py-2.5 rounded-lg flex-row items-center active:opacity-85 ${
        active ? 'bg-persimmon-500 shadow-sm' : 'active:bg-paper-300'
      }`}
    >
      <FontAwesome
        name={icon}
        size={11}
        color={active ? '#FFFFFF' : '#564E45'}
        style={{ marginRight: 6 }}
      />
      <StyledText
        variant="extrabold"
        className={`text-caption ${active ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}

function EmptyCart() {
  return (
    <View className="items-center justify-center px-8 py-12">
      <View className="w-14 h-14 rounded-full bg-paper-100 items-center justify-center mb-3 border border-paper-300">
        <FontAwesome name="shopping-basket" size={22} color="#7A7165" />
      </View>
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-h3 text-center"
      >
        No items yet
      </StyledText>
      <StyledText
        variant="medium"
        className="text-ink-500 text-caption text-center mt-1"
      >
        Add a product from the catalog to start a checkout.
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
      className="mb-3 px-4 py-3 rounded-2xl bg-semantic-danger-50 border border-semantic-danger/30 flex-row items-center justify-between"
    >
      <FontAwesome
        name="exclamation-circle"
        size={16}
        color="#C13030"
        style={{ marginRight: 8 }}
      />
      <View className="flex-1 mr-2 min-w-0">
        <StyledText
          variant="extrabold"
          className="text-semantic-danger text-caption"
        >
          Could not record sale
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-700 text-caption mt-0.5"
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
          <StyledText variant="extrabold" className="text-white text-caption">
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
  onNewSale: () => void;
  onViewReceipts: () => void;
}

function SaleSuccessState({
  recordedTotal,
  itemCountLabel,
  piecesLabel,
  onNewSale,
  onViewReceipts,
}: SaleSuccessStateProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="px-6 pt-8 pb-7 items-center"
    >
      <View
        className="w-16 h-16 rounded-full bg-sage-100 items-center justify-center mb-4 border-2 border-sage-500 shadow-sm"
        accessibilityElementsHidden
      >
        <FontAwesome name="check" size={28} color="#4F7A24" />
      </View>

      <StyledText variant="extrabold" className="text-ink-900 text-h1 mb-1">
        Sale Recorded
      </StyledText>

      <MoneyText
        value={recordedTotal}
        size="hero"
        numberOfLines={1}
        className="text-sage-700 mb-2"
      />

      <StyledText
        variant="medium"
        className="text-ink-500 text-caption mb-6"
        numberOfLines={1}
      >
        {itemCountLabel} · {piecesLabel}
      </StyledText>

      <View className="w-full flex-row gap-3">
        <Pressable
          onPress={onNewSale}
          accessibilityRole="button"
          accessibilityLabel="Start a new sale"
          className="flex-1 py-4 bg-paper-100 rounded-2xl items-center border border-ink-200 active:bg-paper-200"
        >
          <StyledText variant="extrabold" className="text-ink-900 text-caption">
            New Sale
          </StyledText>
        </Pressable>

        <Pressable
          onPress={onViewReceipts}
          accessibilityRole="button"
          accessibilityLabel="View saved receipts"
          className="flex-1 py-4 bg-persimmon-500 rounded-2xl items-center shadow-persimmon-glow active:bg-persimmon-600"
        >
          <StyledText variant="extrabold" className="text-white text-caption">
            View Receipts
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
