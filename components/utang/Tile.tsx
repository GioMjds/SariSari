import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { StyledText } from '../elements';

type Tone = 'danger' | 'success' | 'warning' | 'ink';

const TONE_TEXT: Record<Tone, string> = {
  danger: '#C13030',
  success: '#4F7A24',
  warning: '#C77B0E',
  ink: '#564E45',
};

export function Tile({
  label,
  tone,
  icon,
  children,
}: {
  label: string;
  tone: Tone;
  icon: keyof typeof FontAwesome.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1 px-2 py-2 items-center">
      <View className="flex-row items-center mb-1">
        <FontAwesome name={icon} size={9} color={TONE_TEXT[tone]} />
        <StyledText
          variant="extrabold"
          className="label-caps ml-1 text-ink-400"
          style={{ fontSize: 9 }}
        >
          {label}
        </StyledText>
      </View>
      {children}
    </View>
  );
}
