import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

export type MoreTileAccent =
  | 'paper'
  | 'warm'
  | 'sage'
  | 'cinnamon'
  | 'persimmon';

export type MoreTileProps = {
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  onPress: () => void;
  accent?: MoreTileAccent;
  subtitle?: string;
  accessibilityLabel?: string;
};

const ACCENT_BG: Record<MoreTileAccent, string> = {
  paper: 'bg-paper-100',
  warm: 'bg-warm-100',
  sage: 'bg-sage-50',
  cinnamon: 'bg-cinnamon-50',
  persimmon: 'bg-persimmon-50',
};

const ACCENT_ICON: Record<MoreTileAccent, string> = {
  paper: '#564E45',
  warm: '#623418',
  sage: '#3D5E1B',
  cinnamon: '#391C0A',
  persimmon: '#A1370C',
};

export function MoreTile({
  label,
  icon,
  onPress,
  accent = 'warm',
  subtitle,
  accessibilityLabel,
}: MoreTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      className="active:opacity-70"
    >
      <View
        className={`aspect-square rounded-2xl ${ACCENT_BG[accent]} items-center justify-center px-3`}
      >
        <FontAwesome name={icon} size={28} color={ACCENT_ICON[accent]} />
      </View>
      <StyledText
        variant="semibold"
        numberOfLines={1}
        className="text-xs text-ink-700 text-center mt-2"
      >
        {label}
      </StyledText>
      {subtitle ? (
        <StyledText
          variant="regular"
          numberOfLines={1}
          className="text-[10px] text-ink-400 text-center mt-0.5"
        >
          {subtitle}
        </StyledText>
      ) : null}
    </Pressable>
  );
}
