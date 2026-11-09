import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { useScreenHeadingFocus } from './useScreenHeadingFocus';

export type MoreDetailHeaderProps = {
  title: string;
  subtitle?: string;
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
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-paper-200 px-5 pb-3 flex-row items-center border-b border-paper-300"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
        hitSlop={8}
        style={{ minWidth: 48, minHeight: 48 }}
        className="items-center justify-center rounded-full bg-paper-50 border border-paper-300 active:opacity-70 mr-3"
      >
        <FontAwesome name="arrow-left" size={16} color="#2A1A0E" />
      </Pressable>
      <View
        ref={headingRef}
        accessible
        accessibilityRole="header"
        className="flex-1"
      >
        <StyledText
          variant="extrabold"
          className="text-2xl text-ink-900"
          style={{ letterSpacing: -0.28 }}
        >
          {title}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" className="text-sm text-ink-600 mt-0.5">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
    </View>
  );
}
