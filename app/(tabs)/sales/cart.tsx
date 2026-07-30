import { useState } from 'react';
import { View, FlatList, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { StepperStamp } from '@/components/sales/add-sales';
import { CustomerPickerModal } from '@/components/sales/add-sales';
import { SalesEmptyState } from '@/components/sales';
import { useCart } from '@/components/sales/pos/useCart';
import { useTabBarBottomOffset } from '@/components/layout';
import type { NewSaleItem } from '@/types';

export default function CartScreen() {
  const cart = useCart();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [notes, setNotes] = useState('');

  const handleRemove = (productId: number, selectedUnit?: 'retail' | 'wholesale') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Decrement to zero removes the line
    const item = cart.cartItems.find(
      (i) => i.product_id === productId && (i.selected_unit || 'retail') === (selectedUnit || 'retail'),
    );
    if (item) {
      cart.updateQuantity(productId, -item.quantity, selectedUnit);
    }
  };

  const renderCartItem = ({ item, index }: { item: NewSaleItem; index: number }) => {
    const activeUnit = item.selected_unit || 'retail';
    const canToggle =
      item.wholesale_price != null &&
      item.conversion_factor != null &&
      item.conversion_factor >= 2;

    return (
      <View className="mx-4 mb-3 bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-sm">
        {/* Header row: name + remove */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <StyledText variant="extrabold" className="text-ink-900 text-base">
              {item.product_name}
            </StyledText>
            <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5">
              {activeUnit === 'wholesale'
                ? `${item.wholesale_unit_name || 'Case'} (Pakyaw)`
                : `${item.retail_unit_name || 'Pc'} (Tingi)`}
            </StyledText>
          </View>
          <Pressable
            onPress={() => handleRemove(item.product_id, item.selected_unit)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Remove item"
            className="w-8 h-8 rounded-full bg-semantic-danger-50 items-center justify-center border border-semantic-danger/20 active:opacity-70"
          >
            <FontAwesome name="trash-o" size={14} color="#C22D2D" />
          </Pressable>
        </View>

        {/* Unit toggle (if wholesale available) */}
        {canToggle && (
          <View className="flex-row items-center mb-3 bg-paper-100 rounded-xl p-1 border border-ink-100">
            <Pressable
              onPress={() => {
                if (item.selected_unit !== 'retail') {
                  cart.toggleUnit(index);
                }
              }}
              className={`flex-1 py-1.5 rounded-lg items-center ${
                item.selected_unit !== 'wholesale'
                  ? 'bg-cinnamon-500 border border-cinnamon-600'
                  : ''
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-xs ${
                  item.selected_unit !== 'wholesale'
                    ? 'text-paper-50'
                    : 'text-ink-700'
                }`}
              >
                Tingi ({item.retail_unit_name || 'Pc'})
              </StyledText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (item.selected_unit !== 'wholesale') {
                  cart.toggleUnit(index);
                }
              }}
              className={`flex-1 py-1.5 rounded-lg items-center ${
                item.selected_unit === 'wholesale'
                  ? 'bg-cinnamon-500 border border-cinnamon-600'
                  : ''
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-xs ${
                  item.selected_unit === 'wholesale'
                    ? 'text-paper-50'
                    : 'text-ink-700'
                }`}
              >
                Pakyaw ({item.wholesale_unit_name || 'Case'})
              </StyledText>
            </Pressable>
          </View>
        )}

        {/* Bottom row: price + stepper */}
        <View className="flex-row items-center justify-between">
          <MoneyText value={item.price} size="lg" className="text-ink-700" />
          <StepperStamp
            quantity={item.quantity}
            onDecrement={() => cart.updateQuantity(item.product_id, -1, activeUnit)}
            onIncrement={() => cart.updateQuantity(item.product_id, 1, activeUnit)}
            max={
              activeUnit === 'wholesale' && item.conversion_factor
                ? Math.floor(item.stock / item.conversion_factor)
                : item.stock
            }
          />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-paper-200">
      <FlatList
        data={cart.cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, idx) => `${item.product_id}-${item.selected_unit}-${idx}`}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: tabBarBottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="px-4 py-12">
            <SalesEmptyState
              onNewSale={() => {}}
              hasSales={false}
            />
          </View>
        }
        ListFooterComponent={
          cart.cartItems.length > 0 ? (
            <View className="px-4 mb-3">
              {/* Customer Picker */}
              <Pressable
                onPress={() => setShowCustomerPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Select customer"
                className="flex-row items-center justify-between bg-paper-50 rounded-2xl px-4 py-3 mb-3 border border-ink-100 active:opacity-70"
              >
                <View className="flex-row items-center flex-1">
                  <FontAwesome
                    name={cart.selectedCustomer ? 'user' : 'user-o'}
                    size={14}
                    color="#623418"
                  />
                  <View className="ml-3 flex-1">
                    <StyledText variant="medium" className="text-ink-400 text-xs label-caps">
                      {cart.paymentType === 'credit' ? 'Suki (Required)' : 'Buyer (Optional)'}
                    </StyledText>
                    <StyledText
                      variant="extrabold"
                      className="text-ink-900 text-sm"
                      numberOfLines={1}
                    >
                      {typeof cart.selectedCustomer === 'string'
                        ? cart.selectedCustomer
                        : cart.selectedCustomer?.name ?? 'Add buyer name'}
                    </StyledText>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#623418" />
              </Pressable>

              {/* Notes (light placeholder) */}
              <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100">
                <StyledText variant="extrabold" className="text-ink-900 text-sm mb-2">
                  Notes (Optional)
                </StyledText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes for this sale..."
                  placeholderTextColor="#7A7165"
                  multiline
                  numberOfLines={3}
                  className="bg-white border border-ink-100 rounded-xl px-3 py-2 text-ink-900 font-stack-sans"
                  style={{ minHeight: 80 }}
                />
              </View>
            </View>
          ) : null
        }
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
    </View>
  );
}
