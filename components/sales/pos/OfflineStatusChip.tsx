import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

export function OfflineStatusChip({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      className={`px-3 py-1.5 rounded-full border ${
        isOnline ? 'bg-sage-50 border-sage-200' : 'bg-paper-100 border-ink-150'
      }`}
      accessibilityRole="text"
      accessibilityLabel={isOnline ? 'Online' : 'Offline Ready'}
    >
      <StyledText
        variant="semibold"
        className={`text-[11px] ${isOnline ? 'text-sage-700' : 'text-ink-600'}`}
      >
        {isOnline ? 'Online' : 'Offline Ready'}
      </StyledText>
    </View>
  );
}
