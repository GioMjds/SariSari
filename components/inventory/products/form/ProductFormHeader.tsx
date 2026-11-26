import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface ProductFormHeaderProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
}

export function ProductFormHeader({
  title,
  subtitle,
  onBack,
}: ProductFormHeaderProps) {
  return (
    // Matches the add-customer top bar: paper back button, centered title, mirrored spacer.
    <View className="bg-background border-b border-paper-300">
      <View className="flex-row items-center px-5 pt-3 pb-3">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-11 h-11 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>
        <View className="flex-1 items-center px-2">
          <StyledText
            variant="extrabold"
            accessibilityRole="header"
            numberOfLines={1}
            className="text-ink-900 text-h2"
          >
            {title}
          </StyledText>
          {subtitle ? (
            <StyledText
              variant="regular"
              numberOfLines={1}
              className="text-ink-500 text-xs mt-0.5"
            >
              {subtitle}
            </StyledText>
          ) : null}
        </View>
        <View className="w-11 h-11" />
      </View>
    </View>
  );
}
