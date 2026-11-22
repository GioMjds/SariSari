import { Modal, Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface RestockAdjustModalProps {
  productName: string | null;
  value: string;
  error: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

// Lets the owner override the suggested buy quantity for one product.
export function RestockAdjustModal({
  productName,
  value,
  error,
  onChange,
  onSave,
  onClose,
}: RestockAdjustModalProps) {
  const { t } = useTranslation('inventory');

  return (
    <Modal
      visible={productName !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={onClose}
        >
          <Pressable
            className="bg-paper-50 rounded-2xl p-5 w-full max-w-sm border border-paper-300 shadow-modal"
            onPress={(e) => e.stopPropagation()}
          >
            <StyledText variant="extrabold" className="text-lg text-ink-900 mb-1">
              {t('restockAdjustTitle')}
            </StyledText>
            <StyledText variant="regular" className="text-sm text-ink-700 mb-4">
              {t('restockAdjustBody', { name: productName ?? '' })}
            </StyledText>

            <StyledText variant="semibold" className="text-xs text-ink-700 mb-1">
              {t('quantity')}
            </StyledText>
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              accessibilityLabel={t('quantity')}
              className="bg-paper-100 border border-ink-200 rounded-xl px-3 min-h-[48px] font-stack-sans text-ink-900 text-lg mb-2"
              autoFocus
              selectTextOnFocus
            />

            {error ? (
              <StyledText
                variant="semibold"
                accessibilityRole="alert"
                className="text-sm text-semantic-danger mb-2"
              >
                {error}
              </StyledText>
            ) : null}

            <View className="flex-row justify-end gap-3 mt-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                accessibilityRole="button"
                className="min-h-[44px] px-4 justify-center bg-paper-200 rounded-xl"
              >
                <StyledText variant="semibold" className="text-sm text-ink-700">
                  {t('cancel')}
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onSave}
                accessibilityRole="button"
                className="min-h-[44px] px-5 justify-center bg-persimmon-500 rounded-xl active:bg-persimmon-600"
              >
                <StyledText variant="extrabold" className="text-sm text-paper-50">
                  {t('save')}
                </StyledText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
