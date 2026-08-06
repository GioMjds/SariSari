import { useCallback, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (categoryName: string) => void;
}

export function AddCategoryModal({
  visible,
  onClose,
  onSuccess,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const { insertCategoryMutation } = useCategories();

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    insertCategoryMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName('');
          onClose();
          onSuccess?.(trimmed);
        },
      },
    );
  }, [name, insertCategoryMutation, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    setName('');
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
        <View className="w-full bg-paper-50 rounded-3xl p-5 border border-ink-100 shadow-xl">
          <View className="flex-row items-center justify-between mb-2">
            <StyledText
              variant="black"
              className="text-xl text-ink-900 font-stack-sans-bold"
            >
              New Category
            </StyledText>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-paper-100 items-center justify-center border border-ink-100"
            >
              <FontAwesome name="times" size={14} color="#564E45" />
            </Pressable>
          </View>

          <StyledText variant="regular" className="text-ink-500 text-xs mb-4">
            Create a category to group products for easier inventory tracking.
          </StyledText>

          <StyledText
            variant="extrabold"
            className="text-sm text-ink-900 mb-1.5"
          >
            Category Name{' '}
            <StyledText className="text-persimmon-500">*</StyledText>
          </StyledText>
          <View className="relative justify-center mb-6">
            <TextInput
              placeholder="e.g. Beverages, Snacks, Toiletries"
              value={name}
              onChangeText={setName}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans"
              placeholderTextColor="#A89F90"
              autoFocus
            />
            {name.length > 0 && (
              <Pressable
                onPress={() => setName('')}
                className="absolute right-4.5 p-1"
              >
                <FontAwesome name="times-circle" size={16} color="#A89F90" />
              </Pressable>
            )}
          </View>

          <View className="flex-row gap-x-3">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3.5 rounded-xl bg-paper-100 border border-ink-200 items-center"
            >
              <StyledText
                variant="extrabold"
                className="text-ink-700 text-base"
              >
                Cancel
              </StyledText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || insertCategoryMutation.isPending}
              className={`flex-1 py-3.5 rounded-xl items-center ${
                !name.trim() || insertCategoryMutation.isPending
                  ? 'bg-ink-100'
                  : 'bg-persimmon-500 shadow-persimmon-glow'
              }`}
            >
              <StyledText
                variant="black"
                className={!name.trim() ? 'text-ink-400' : 'text-paper-50'}
              >
                {insertCategoryMutation.isPending ? 'Saving…' : 'Save Category'}
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
