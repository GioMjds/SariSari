import { StyledText } from '@/components/elements';
import { View, Modal, Pressable } from 'react-native';

interface ActiveCartConflictModalProps {
  visible: boolean;
  onClose: () => void;
  onParkCurrentAndSwitch: () => void;
  onReplaceCurrent: () => void;
}

export function ActiveCartConflictModal({
  visible,
  onClose,
  onParkCurrentAndSwitch,
  onReplaceCurrent,
}: ActiveCartConflictModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-paper-100 w-full max-w-sm rounded-2xl p-5 shadow-lg border border-paper-300">
          <StyledText variant="extrabold" className="text-lg text-ink-900 mb-1">
            Active Cart Has Items
          </StyledText>
          <StyledText variant="regular" className="text-sm text-ink-600 mb-5">
            You currently have items in your POS cart. What would you like to do
            before resuming?
          </StyledText>

          <View className="space-y-2.5 gap-2">
            <Pressable
              onPress={onParkCurrentAndSwitch}
              className="p-3.5 rounded-xl bg-cinnamon-500 active:bg-cinnamon-600 items-center justify-center min-h-[44px] shadow-persimmon-glow"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Park Current Cart & Switch
              </StyledText>
            </Pressable>

            <Pressable
              onPress={onReplaceCurrent}
              className="p-3.5 rounded-xl bg-semantic-danger-50 border border-semantic-danger/20 active:bg-semantic-danger-100 items-center justify-center min-h-[44px]"
            >
              <StyledText variant="bold" className="text-semantic-danger text-sm">
                Replace Current Cart (Discard)
              </StyledText>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="p-3 rounded-xl bg-paper-200 active:bg-paper-300 items-center justify-center min-h-[44px]"
            >
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                Cancel
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
