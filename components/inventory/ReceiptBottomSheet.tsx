import React from 'react';
import { Modal, Pressable, View } from 'react-native';

const SHEET_PERFORATION_COUNT = 22;
const SHEET_PERFORATION_BG = '#EFE6D2'; // paper-200 — the page bg

interface ReceiptBottomSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number;
}

export function ReceiptBottomSheet({
  visible,
  onRequestClose,
  children,
  maxHeightPct = 80,
}: ReceiptBottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end"
        onPress={onRequestClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      >
        <Pressable
          className="rounded-t-3xl overflow-hidden border-t border-dashed border-ink-200"
          style={{
            backgroundColor: '#FBF7EE', // paper-50
            maxHeight: `${maxHeightPct}%`,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/*
           * Receipt-perforation edge: a row of paper-200 circles
           * straddles the seam between the scrim and the sheet so
           * the sheet feels torn off the receipt, not pasted onto
           * the overlay.
           */}
          <View
            className="relative h-3 flex-row justify-between"
            style={{ backgroundColor: SHEET_PERFORATION_BG }}
          >
            {Array.from({ length: SHEET_PERFORATION_COUNT }).map((_, i) => (
              <View
                key={`perf-${i}`}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: SHEET_PERFORATION_BG }}
              />
            ))}
          </View>
          <View className="paper-texture">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
