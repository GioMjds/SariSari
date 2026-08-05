import { View } from 'react-native';
import { StyledText } from '@/components/elements';

interface Props {
  date: Date;
  netChange: number;
  in: number;
  out: number;
}

function fmt(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DayHeader({
  date,
  netChange,
  in: inCount,
  out: outCount,
}: Props) {
  const positive = netChange >= 0;
  return (
    <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
      <StyledText
        variant="extrabold"
        className="text-xs text-ink-600"
      >
        {fmt(date)}
      </StyledText>
      <StyledText
        variant="semibold"
        className={`text-xs ${positive ? 'text-sage-700' : 'text-rose-700'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {positive ? '+' : ''}
        {netChange} net · {inCount} in · {outCount} out
      </StyledText>
    </View>
  );
}
