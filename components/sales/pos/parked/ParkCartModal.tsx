import React, { useState, useEffect } from 'react';
import { View, TextInput, Modal, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';
import type { Customer, NewSaleItem } from '@/types';

interface ParkCartModalProps {
  visible: boolean;
  cartItems: NewSaleItem[];
  selectedCustomer: Customer | string | null;
  paymentType: 'cash' | 'credit';
  onClose: () => void;
  onConfirm: (label: string) => void;
}

export function ParkCartModal({
  visible,
  cartItems,
  selectedCustomer,
  paymentType,
  onClose,
  onConfirm,
}: ParkCartModalProps) {
  const [note, setNote] = useState('');

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const customerDisplayName =
    typeof selectedCustomer === 'string'
      ? selectedCustomer
      : (selectedCustomer?.name ?? null);

  const defaultLabel = customerDisplayName
    ? customerDisplayName
    : `Cart • ${itemCount} ${itemCount === 1 ? 'item' : 'items'} (${formatPesos(total)})`;

  useEffect(() => {
    if (visible) {
      setNote('');
    }
  }, [visible]);

  const handleConfirm = () => {
    const finalLabel = note.trim() !== '' ? note.trim() : defaultLabel;
    onConfirm(finalLabel);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-paper-100 w-full max-w-sm rounded-2xl p-5 shadow-lg border border-paper-300">
          <StyledText variant="extrabold" className="text-xl text-ink-900 mb-1">
            Park Active Cart
          </StyledText>
          <StyledText variant="regular" className="text-sm text-ink-600 mb-4">
            Hold this cart so you can serve another suki.
          </StyledText>

          <View className="bg-paper-200 p-3 rounded-xl mb-4 border border-paper-300">
            <StyledText variant="extrabold" className="text-xs text-ink-500 uppercase tracking-wider mb-1">
              Summary
            </StyledText>
            <StyledText variant="extrabold" className="text-base text-ink-900">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} •{' '}
              {formatPesos(total)}
            </StyledText>
            {customerDisplayName && (
              <StyledText variant="semibold" className="text-sm text-cinnamon-700 mt-1">
                Suki: {customerDisplayName} ({paymentType === 'credit' ? 'Utang' : 'Cash'})
              </StyledText>
            )}
          </View>

          <StyledText variant="semibold" className="text-sm text-ink-800 mb-1.5">
            Note / Label (Optional)
          </StyledText>
          <TextInput
            className="bg-paper-50 border border-paper-300 rounded-xl p-3 text-base text-ink-900 font-stack-sans-medium mb-5 min-h-[44px]"
            placeholder={defaultLabel}
            placeholderTextColor="#7A7165"
            value={note}
            onChangeText={setNote}
            autoFocus
          />

          <View className="flex-row justify-end space-x-3 gap-2">
            <Pressable
              onPress={onClose}
              className="px-4 py-3 rounded-xl bg-paper-300 active:bg-paper-400 min-h-[44px] justify-center items-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                Cancel
              </StyledText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="px-5 py-3 rounded-xl bg-cinnamon-500 active:bg-cinnamon-600 min-h-[44px] justify-center items-center shadow-persimmon-glow"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Park Cart
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
