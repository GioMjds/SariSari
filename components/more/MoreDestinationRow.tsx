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
};

export function MoreDestinationRow({
  icon,
  title,
  supportingText,
  onPress,
  accessibilityLabel,
  accessibilityHint,
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

      <FontAwesome name="chevron-right" size={16} color="#7A7165" />
    </Pressable>
  );
}
