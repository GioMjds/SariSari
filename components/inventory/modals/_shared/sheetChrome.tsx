import React from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable onPress={onClose} className="flex-1" />
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          className="bg-paper-50 rounded-t-2xl p-5 border-t border-paper-300 gap-y-4"
        >
          {children}
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
