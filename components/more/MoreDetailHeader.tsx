import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useScreenHeadingFocus } from './useScreenHeadingFocus';

export type MoreDetailHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  backAccessibilityLabel: string;
};

export function MoreDetailHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel,
}: MoreDetailHeaderProps) {
  const headingRef = useScreenHeadingFocus();

  return (
    <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
      <View className="flex-row items-start">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          hitSlop={8}
          style={{ minWidth: 48, minHeight: 48 }}
          className="items-center justify-center rounded-full bg-paper-50/15 active:opacity-70 mr-3"
        >
          <FontAwesome name="arrow-left" size={16} color="#FAFAF7" />
        </Pressable>
        <View
          ref={headingRef}
          accessible
          accessibilityRole="header"
          className="flex-1"
        >
          <StyledText
            variant="extrabold"
            className="text-h1 text-paper-50 text-3xl"
            style={{ letterSpacing: -0.28 }}
          >
            {title}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-sm text-paper-200 opacity-90 mt-1"
          >
            {subtitle}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
