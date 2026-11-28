import { Modal, Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface SoftWarnModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onRecordReason: () => void;
}

// Shown when a credit goes over the suki's limit and the limit does not block.
export function SoftWarnModal({
  visible,
  onClose,
  onContinue,
  onRecordReason,
}: SoftWarnModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View
          accessibilityViewIsModal
          className="bg-paper-50 rounded-2xl p-5 gap-4 w-full"
        >
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base"
            accessibilityRole="header"
          >
            Suki is over limit
          </StyledText>
          <StyledText variant="regular" className="text-ink-600 text-sm">
            You can continue without an override, or record a reason.
          </StyledText>
          <View className="gap-2">
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              className="bg-ink-200 rounded-xl px-4 py-3 min-h-[44px] items-center justify-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                Continue without override
              </StyledText>
            </Pressable>
            <Pressable
              onPress={onRecordReason}
              accessibilityRole="button"
              className="bg-primary-600 rounded-xl px-4 py-3 min-h-[44px] items-center justify-center"
            >
              <StyledText variant="semibold" className="text-white text-sm">
                Record override reason
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
