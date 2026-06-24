import { View } from 'react-native';
import { StyledText } from '../elements';

/**
 * EditorialEyebrow — a small kicker label used above each
 * major section. Mimics the "kicker" line on a magazine cover
 * story: a Roman numeral, a divider, and a small label.
 */
export function EditorialEyebrow({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center">
      <StyledText
        variant="black"
        className="text-persimmon-600 mr-2"
        style={{
          fontSize: 20,
          lineHeight: 22,
          letterSpacing: -0.4,
        }}
      >
        {number}
      </StyledText>
      <View className="h-px bg-ink-200 w-3 mr-2" />
      <StyledText
        variant="extrabold"
        className="text-label text-ink-500"
        style={{ letterSpacing: 1.6 }}
      >
        {label.toUpperCase()}
      </StyledText>
    </View>
  );
}
