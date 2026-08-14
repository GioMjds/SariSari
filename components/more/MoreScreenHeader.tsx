import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useScreenHeadingFocus } from './useScreenHeadingFocus';

export type MoreScreenHeaderProps = {
  eyebrow: string;
  title: string;
  supportingText: string;
};

export function MoreScreenHeader({
  eyebrow,
  title,
  supportingText,
}: MoreScreenHeaderProps) {
  const headingRef = useScreenHeadingFocus();

  return (
    <View className="pb-2 pt-2">
      <StyledText
        variant="extrabold"
        className="mb-2 text-xs uppercase text-persimmon-600"
        style={{ letterSpacing: 1.2 }}
      >
        {eyebrow}
      </StyledText>
      <View ref={headingRef} accessible accessibilityRole="header">
        <StyledText
          variant="extrabold"
          className="text-h1 text-3xl text-ink-900"
          style={{ letterSpacing: -0.28 }}
        >
          {title}
        </StyledText>
      </View>
      <StyledText variant="regular" className="mt-2 text-sm text-ink-500">
        {supportingText}
      </StyledText>
    </View>
  );
}
