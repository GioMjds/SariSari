import { StyledText } from "@/components/elements";
import { FontAwesome } from "@expo/vector-icons";
import { Pressable } from "react-native";

export function ContactLink({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: 'phone' | 'comment';
  label: string;
  tone: 'sage' | 'persimmon';
  onPress: () => void;
}) {
  const active = tone === 'sage';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`press-scale flex-1 rounded-xl py-2.5 flex-row items-center justify-center border ${
        active
          ? 'bg-sage-50 border-sage-500'
          : 'bg-persimmon-50 border-persimmon-300'
      }`}
    >
      <FontAwesome
        name={icon}
        size={12}
        color={active ? '#4F7A24' : '#C8460F'}
      />
      <StyledText
        variant="extrabold"
        className={`text-xs ml-1.5 ${
          active ? 'text-sage-700' : 'text-persimmon-700'
        }`}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}