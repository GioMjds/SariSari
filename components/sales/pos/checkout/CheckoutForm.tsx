import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { logger } from '@/lib/logger';
import type { useCartStore } from '@/stores/CartStore';
import { CheckoutLineRow } from '../CheckoutLineRow';
import { CustomerPicker } from './CustomerPicker';
import { PaymentTypeToggle } from './PaymentTypeToggle';
import { EmptyCart } from './EmptyCart';
import { SubmitErrorBanner } from './SubmitErrorBanner';
import { SwipeConfirmButton } from './SwipeConfirmButton';

type CartLines = ReturnType<typeof useCartStore.getState>['cartItems'];

export interface CheckoutFormProps {
  cartItems: CartLines;
  total: number;
  paymentType: 'cash' | 'credit';
  setPaymentType: (type: 'cash' | 'credit') => void;
  onPickCustomer: () => void;
  customerName: string | undefined;
  customerInitial: string;
  customerMissing: boolean;
  isEmpty: boolean;
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
  onPark: (() => void) | undefined;
}

export function CheckoutForm({
  cartItems,
  total,
  paymentType,
  setPaymentType,
  onPickCustomer,
  customerName,
  customerInitial,
  customerMissing,
  isEmpty,
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
  onPark,
}: CheckoutFormProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalHint =
    paymentType === 'credit'
      ? `Utang for ${customerName ?? 'a suki'}`
      : 'Paid in cash';

  return (
    <View className="flex-1 bg-paper-50">
      {/* Payment type first, then the suki it applies to */}
      <View className="px-4 pt-4 gap-3">
        <PaymentTypeToggle paymentType={paymentType} onChange={setPaymentType} />
        <CustomerPicker
          customerName={customerName}
          customerInitial={customerInitial}
          customerMissing={customerMissing}
          onPress={onPickCustomer}
        />
        {customerMissing && (
          <StyledText
            variant="semibold"
            className="text-ink-800 text-[13px]"
            accessibilityLiveRegion="polite"
          >
            Choose a suki to record this on the utang ledger.
          </StyledText>
        )}
      </View>

      {/* Items header with inline clear confirm */}
      <View className="px-4 pt-5 pb-2 flex-row items-center justify-between min-h-[44px]">
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          Items
        </StyledText>
        {showClearConfirm ? (
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowClearConfirm(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel clear all"
              className="px-4 min-h-[40px] items-center justify-center bg-paper-100 border border-paper-300 rounded-full active:bg-paper-200"
              hitSlop={4}
            >
              <StyledText variant="extrabold" className="text-ink-700 text-[13px]">
                Keep
              </StyledText>
            </Pressable>
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
              className="px-4 min-h-[40px] items-center justify-center bg-semantic-danger rounded-full active:opacity-80"
              hitSlop={4}
            >
              <StyledText variant="extrabold" className="text-white text-[13px]">
                Clear all
              </StyledText>
            </Pressable>
          </View>
        ) : (
          !isEmpty && (
            <Pressable
              onPress={() => setShowClearConfirm(true)}
              accessibilityRole="button"
              accessibilityLabel="Clear all cart items"
              className="flex-row items-center px-3 min-h-[40px] rounded-full active:bg-semantic-danger-50"
              hitSlop={4}
            >
              <FontAwesome
                name="trash"
                size={13}
                color="#C13030"
                style={{ marginRight: 6 }}
              />
              <StyledText
                variant="extrabold"
                className="text-semantic-danger text-[13px]"
              >
                Clear
              </StyledText>
            </Pressable>
          )
        )}
      </View>

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
            <View className="mx-4 rounded-2xl bg-white border border-paper-300 overflow-hidden">
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
                    <View className="mx-4 h-px bg-paper-200" />
                  )}
                </View>
              ))}
            </View>
          )}
          <View className="h-4" />
        </ScrollView>
      </View>

      {/* Footer: total + Park on one row, one primary action below */}
      <View
        className="px-4 pt-3 bg-paper-50 border-t border-paper-300"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {submitError && (
          <SubmitErrorBanner
            message={submitError}
            onDismiss={onDismissError}
            onRetry={onRetry}
          />
        )}

        <View
          className="flex-row items-center justify-between gap-3 mb-3"
          accessibilityRole="summary"
          accessibilityLabel="Order total"
        >
          <View className="flex-1 min-w-0">
            <StyledText variant="medium" className="text-ink-500 text-[13px]">
              Total · {totalHint}
            </StyledText>
            <MoneyText
              value={total}
              size="display"
              numberOfLines={1}
              className="text-ink-900"
            />
          </View>
          {onPark && !isEmpty && (
            <Pressable
              onPress={onPark}
              accessibilityRole="button"
              accessibilityLabel="Park current cart"
              accessibilityHint="Saves this cart so you can serve the next customer"
              className="px-4 min-h-[52px] rounded-2xl bg-paper-100 border border-paper-400 flex-row items-center justify-center active:bg-paper-300"
            >
              <FontAwesome name="inbox" size={15} color="#3D372F" />
              <StyledText variant="extrabold" className="text-ink-800 text-[14px] ml-2">
                Park
              </StyledText>
            </Pressable>
          )}
        </View>

        <SwipeConfirmButton
          onConfirm={onConfirmSubmit}
          disabled={isSubmitDisabled}
          isSubmitting={isSubmitting}
          isEmpty={isEmpty}
          customerMissing={customerMissing}
          total={total}
        />
      </View>
    </View>
  );
}
