import { memo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface DashboardSectionProps {
  title: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  testID?: string;
  children: ReactNode;
}

// One heading style for every home section so the page scans top to bottom.
export const DashboardSection = memo(function DashboardSection({
  title,
  actionLabel,
  onAction,
  testID,
  children,
}: DashboardSectionProps) {
  return (
    <View testID={testID} className="px-4 mb-6">
      <View className="flex-row items-center justify-between mb-2 min-h-[44px]">
        <StyledText
          variant="extrabold"
          className="text-h3 text-ink-900"
          accessibilityRole="header"
        >
          {title}
        </StyledText>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
            className="flex-row items-center min-h-[44px] pl-3 active:opacity-60"
          >
            <StyledText
              variant="semibold"
              className="text-sm text-persimmon-700 mr-1"
            >
              {actionLabel}
            </StyledText>
            <FontAwesome name="chevron-right" size={10} color="#A1370C" />
          </Pressable>
        ) : null}
      </View>
      <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
        {children}
      </View>
    </View>
  );
});
