import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

type MoreLinkRowProps = {
  label: string;
  subtitle?: string;
  icon: keyof typeof FontAwesome.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function MoreLinkRow({
  label,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
}: MoreLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      className="px-4 py-3 border-b border-warm-100 last:border-b-0 flex-row items-center active:opacity-80"
    >
      <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
        <FontAwesome name={icon} size={15} color="#623418" />
      </View>
      <View className="flex-1">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {label}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" className="text-xs text-ink-400 mt-0.5">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
      <FontAwesome name="chevron-right" size={14} color="#9C8E7E" />
    </Pressable>
  );
}
