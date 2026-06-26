import { StyledText } from '@/components/elements';
import { TouchableOpacity, View } from 'react-native';

interface ChipProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function Chip({
  label,
  count,
  active,
  onPress,
  accessibilityLabel,
}: ChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      className={`px-4 py-2 rounded-pill flex-row items-center ${
        active
          ? 'bg-persimmon-500 shadow-sm'
          : 'bg-paper-50 border border-ink-200'
      }`}
    >
      <StyledText
        variant={active ? 'extrabold' : 'semibold'}
        className={`text-xs ${active ? 'text-paper-50' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
      <View
        className={`ml-1.5 px-1.5 rounded-pill ${
          active ? 'bg-paper-50/25' : 'bg-paper-200'
        }`}
      >
        <StyledText
          variant="extrabold"
          className={`text-[10px] ${active ? 'text-paper-50' : 'text-ink-700'}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {count}
        </StyledText>
      </View>
    </TouchableOpacity>
  );
}
