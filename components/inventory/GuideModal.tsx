import React from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { GUIDE_TIPS } from '@/constants';

interface GuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function GuideModal({ visible, onClose }: GuideModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-paper-50 rounded-2xl p-6 shadow-xl border border-ink-100">
          <View className="flex-row justify-between items-center mb-4">
            <StyledText
              variant="extrabold"
              className="text-xl text-ink-900"
            >
              Quick guide
            </StyledText>
            <TouchableOpacity onPress={onClose} className="p-1">
              <FontAwesome name="times" size={20} color="#7A7165" />
            </TouchableOpacity>
          </View>

          <View className="space-y-3 mb-6">
            {GUIDE_TIPS.map((tip) => (
              <View
                key={tip.title}
                className="bg-paper-100 rounded-xl p-3 flex-row gap-3 border border-ink-50"
              >
                <View className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center border border-ink-100">
                  <FontAwesome
                    name={tip.icon as any}
                    size={18}
                    color="#E85A1F"
                  />
                </View>
                <View className="flex-1">
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-base"
                  >
                    {tip.title}
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-ink-600 text-sm leading-5"
                  >
                    {tip.description}
                  </StyledText>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="bg-persimmon-500 rounded-xl py-3 items-center shadow-persimmon-glow"
          >
            <StyledText variant="semibold" className="text-paper-50">
              Got it
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
