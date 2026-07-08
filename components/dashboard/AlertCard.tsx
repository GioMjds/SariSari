import { FontAwesome } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { StyledText } from "../elements";
import { MoneyText } from "../ui";

type AlertTone = 'warning' | 'danger';

const TONE_ACCENT: Record<AlertTone, string> = {
  warning: '#C77B0E',
  danger: '#C13030',
};

const TONE_LABEL: Record<AlertTone, string> = {
  warning: 'text-semantic-warning',
  danger: 'text-semantic-danger',
};

export function AlertCard({
  tone,
  icon,
  eyebrow,
  valueText,
  valueKind,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  tone: AlertTone;
  icon: keyof typeof FontAwesome.glyphMap;
  eyebrow: string;
  valueText: string;
  valueKind: 'count' | 'money';
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-1 active:opacity-80"
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        className={`rounded-xl p-3 border ${
          tone === 'warning'
            ? 'bg-semantic-warning-50 border-semantic-warning-100'
            : 'bg-semantic-danger-50 border-semantic-danger-100'
        }`}
      >
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center">
            <FontAwesome name={icon} size={11} color={TONE_ACCENT[tone]} />
            <StyledText
              variant="extrabold"
              className={`label-caps ml-1.5 ${TONE_LABEL[tone]}`}
              style={{ fontSize: 10 }}
            >
              {eyebrow}
            </StyledText>
          </View>
          <FontAwesome
            name="chevron-right"
            size={11}
            color={TONE_ACCENT[tone]}
            style={{ opacity: 0.6 }}
          />
        </View>

        {valueKind === 'money' ? (
          <MoneyText
            value={Number(valueText)}
            size="lg"
            variant="danger"
            className="text-lg"
          />
        ) : (
          <StyledText variant="black" className={`text-xl ${TONE_LABEL[tone]}`}>
            {valueText}
          </StyledText>
        )}

        <StyledText
          variant="medium"
          className="text-caption text-ink-600 mt-0.5"
          numberOfLines={1}
        >
          {subtitle}
        </StyledText>
      </View>
    </Pressable>
  );
}
