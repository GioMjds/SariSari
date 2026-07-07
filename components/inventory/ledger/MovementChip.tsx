import { StyledText } from "@/components/elements";
import { FontAwesome } from "@expo/vector-icons";
import { View } from "react-native";

type MovementTone = 'sage' | 'info' | 'danger';

const TONE_BG: Record<MovementTone, string> = {
  sage: 'bg-sage-50',
  info: 'bg-semantic-info-50',
  danger: 'bg-semantic-danger-50',
};
const TONE_TEXT: Record<MovementTone, string> = {
  sage: 'text-sage-700',
  info: 'text-semantic-info',
  danger: 'text-semantic-danger',
};
const TONE_BORDER: Record<MovementTone, string> = {
  sage: 'border-sage-500',
  info: 'border-semantic-info',
  danger: 'border-semantic-danger',
};
const TONE_ICON_COLOR: Record<MovementTone, string> = {
  sage: '#2F5C3E',
  info: '#2E6FA8',
  danger: '#C22D2D',
};

export function MovementChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: MovementTone;
  icon: 'arrow-up' | 'shopping-cart' | 'exclamation-triangle';
}) {
  return (
    <View
      className={`flex-1 ${TONE_BG[tone]} border ${TONE_BORDER[tone]} rounded-xl px-3 py-2.5`}
    >
      <View className="flex-row items-center mb-1">
        <FontAwesome name={icon} size={10} color={TONE_ICON_COLOR[tone]} />
        <StyledText
          variant="extrabold"
          className={`label-caps ${TONE_TEXT[tone]} ml-1.5`}
        >
          {label}
        </StyledText>
      </View>
      <StyledText
        variant="black"
        className={`${TONE_TEXT[tone]} text-xl`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </StyledText>
      <StyledText
        variant="medium"
        className="text-mono text-ink-500 mt-0.5"
        style={{ fontSize: 10 }}
      >
        pcs this period
      </StyledText>
    </View>
  );
}