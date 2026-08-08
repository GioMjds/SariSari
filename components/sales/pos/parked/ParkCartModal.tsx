import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, Pressable } from 'react-native';
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

  const defaultLabel =
    typeof selectedCustomer === 'string'
      ? selectedCustomer
      : (selectedCustomer?.name ??
        `Cart • ${itemCount} items (${formatPesos(total)})`);

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
        <View className="bg-paper-100 w-full max-w-sm rounded-2xl p-5 shadow-lg">
          <Text className="text-xl font-bold text-ink-900 mb-1">
            Park Active Cart
          </Text>
          <Text className="text-sm text-ink-600 mb-4">
            Snapshot this cart so you can serve another suki.
          </Text>

          <View className="bg-paper-200 p-3 rounded-xl mb-4">
            <Text className="text-xs text-ink-500 uppercase font-semibold mb-1">
              Summary
            </Text>
            <Text className="text-base font-semibold text-ink-900">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} •{' '}
              {formatPesos(total)}
            </Text>
            {selectedCustomer && (
              <Text className="text-sm text-brand-600 font-medium mt-0.5">
                Suki: {defaultLabel}
              </Text>
            )}
          </View>

          <Text className="text-sm font-semibold text-ink-800 mb-1">
            Note / Label (Optional)
          </Text>
          <TextInput
            className="bg-white border border-paper-300 rounded-xl p-3 text-base text-ink-900 mb-5"
            placeholder={defaultLabel}
            placeholderTextColor="#9CA3AF"
            value={note}
            onChangeText={setNote}
            autoFocus
          />

          <View className="flex-row justify-end space-x-3">
            <Pressable
              onPress={onClose}
              className="px-4 py-3 rounded-xl bg-paper-300 active:bg-paper-400"
            >
              <Text className="text-ink-700 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="px-5 py-3 rounded-xl bg-brand-600 active:bg-brand-700"
            >
              <Text className="text-white font-bold">Park Cart</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
