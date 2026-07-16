import React from 'react';
import { ActivityIndicator, Modal, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Supplier } from '@/types';

interface SupplierDeleteModalProps {
  supplier: Supplier | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function SupplierDeleteModal({
  supplier,
  visible,
  onClose,
  onConfirm,
  isPending,
}: SupplierDeleteModalProps) {
  const { t } = useTranslation('inventory');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      >
        <View className="bg-paper-50 rounded-2xl p-6 w-full max-w-sm border border-ink-200 shadow-paper-lift">
          <View className="items-center mb-4">
            <View className="bg-semantic-danger-50 rounded-full p-4 mb-3">
              <FontAwesome
                name="exclamation-triangle"
                size={32}
                color="#C13030"
              />
            </View>
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-xl mb-2 text-center"
            >
              {t('deleteSupplierTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm text-center"
            >
              {t('deleteSupplierBody', {
                name: supplier?.name || '',
              })}
            </StyledText>
            <StyledText
              variant="semibold"
              className="text-semantic-danger text-sm mt-2 text-center"
            >
              {t('deleteSupplierWarning')}
            </StyledText>
          </View>
          <View className="gap-3">
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isPending}
              className="bg-semantic-danger rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <StyledText
                  variant="extrabold"
                  className="text-white text-center text-base"
                >
                  {t('deleteSupplierConfirm')}
                </StyledText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="bg-ink-100 rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
            >
              <StyledText
                variant="semibold"
                className="text-ink-700 text-center text-base"
              >
                {t('common:cancel')}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
