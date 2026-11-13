import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

export type MoreDestinationRowProps = {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  supportingText: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Shows a count pill before the chevron when above zero. */
  badgeCount?: number;
};

export function MoreDestinationRow({
  icon,
  title,
  supportingText,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  badgeCount,
}: MoreDestinationRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={{ minHeight: 64 }}
      className="flex-row items-center rounded-2xl border border-paper-300 bg-paper-50 px-4 py-3 active:opacity-80"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-paper-100">
        <FontAwesome name={icon} size={20} color="#564E45" />
      </View>

      <View className="mr-3 flex-1">
        <StyledText variant="semibold" className="text-base text-ink-800">
          {title}
        </StyledText>
        <StyledText variant="regular" className="mt-1 text-sm text-ink-500">
          {supportingText}
        </StyledText>
      </View>

      {badgeCount !== undefined && badgeCount > 0 ? (
        <View
          testID="more-row-badge"
          className="mr-3 min-w-[24px] items-center justify-center rounded-full bg-persimmon-500 px-2 py-0.5"
        >
          <StyledText variant="extrabold" className="text-xs text-paper-50">
            {badgeCount > 99 ? '99+' : String(badgeCount)}
          </StyledText>
        </View>
      ) : null}

      <FontAwesome name="chevron-right" size={16} color="#7A7165" />
    </Pressable>
  );
}
