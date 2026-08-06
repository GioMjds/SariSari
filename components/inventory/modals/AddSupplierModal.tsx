import { useCallback, useState } from 'react';
import { Pressable, TextInput, View, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types/suppliers.types';

interface AddSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (supplier: Supplier) => void;
}

export function AddSupplierModal({
  visible,
  onClose,
  onSuccess,
}: AddSupplierModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const { insertSupplierMutation } = useSuppliers();

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    insertSupplierMutation.mutate(
      {
        name: trimmedName,
        contact: contact.trim(),
        notes: notes.trim(),
      },
      {
        onSuccess: (newSupplier) => {
          setName('');
          setContact('');
          setNotes('');
          onClose();
          if (newSupplier) onSuccess?.(newSupplier);
        },
      },
    );
  }, [name, contact, notes, insertSupplierMutation, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    setName('');
    setContact('');
    setNotes('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      useNativeModal={false}
      onClose={handleClose}
      showCloseButton={false}
    >
      <View className="flex-1 bg-ink-900/60 justify-center items-center px-5">
        <View className="w-full max-h-[85%] bg-paper-50 rounded-3xl p-5 border border-ink-100 shadow-xl">
          <View className="flex-row items-center justify-between mb-2">
            <StyledText
              variant="black"
              className="text-xl text-ink-900 font-stack-sans-bold"
            >
              New Supplier
            </StyledText>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-paper-100 items-center justify-center border border-ink-100"
            >
              <FontAwesome name="times" size={14} color="#564E45" />
            </Pressable>
          </View>

          <StyledText variant="regular" className="text-ink-500 text-xs mb-4">
            Record supplier details for stock reorders and delivery notes.
          </StyledText>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StyledText variant="extrabold" className="text-sm text-ink-900 mb-1.5">
              Supplier Name{' '}
              <StyledText className="text-persimmon-500">*</StyledText>
            </StyledText>
            <TextInput
              placeholder="e.g. San Miguel Corp, Local Distributor"
              value={name}
              onChangeText={setName}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-3"
              placeholderTextColor="#A89F90"
            />

            <StyledText variant="extrabold" className="text-sm text-ink-900 mb-1.5">
              Contact Info (Optional)
            </StyledText>
            <TextInput
              placeholder="Phone number, email, or agent name"
              value={contact}
              onChangeText={setContact}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-3"
              placeholderTextColor="#A89F90"
            />

            <StyledText variant="extrabold" className="text-sm text-ink-900 mb-1.5">
              Notes (Optional)
            </StyledText>
            <TextInput
              placeholder="Delivery schedule, payment terms"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-4 min-h-[80px]"
              placeholderTextColor="#A89F90"
              textAlignVertical="top"
            />
          </ScrollView>

          <View className="flex-row gap-x-3 pt-2 border-t border-ink-100">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3.5 rounded-xl bg-paper-100 border border-ink-200 items-center"
            >
              <StyledText variant="extrabold" className="text-ink-700 text-base">
                Cancel
              </StyledText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || insertSupplierMutation.isPending}
              className={`flex-1 py-3.5 rounded-xl items-center ${
                !name.trim() || insertSupplierMutation.isPending
                  ? 'bg-ink-100'
                  : 'bg-persimmon-500 shadow-persimmon-glow'
              }`}
            >
              <StyledText
                variant="black"
                className={!name.trim() ? 'text-ink-400' : 'text-paper-50'}
              >
                {insertSupplierMutation.isPending ? 'Saving…' : 'Save Supplier'}
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
