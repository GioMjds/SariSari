import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';
import { View } from 'react-native';

export function DebtLimitBar({
  ratio,
  tone,
  surplusPesos,
  limit,
}: {
  ratio: number;
  tone: 'safe' | 'warning' | 'over-limit';
  surplusPesos: number;
  limit: number;
}) {
  const widthPct = Math.max(2, Math.min(100, ratio * 100));
  const trackBg =
    tone === 'over-limit'
      ? 'bg-semantic-danger-50'
      : tone === 'warning'
        ? 'bg-semantic-warning-50'
        : 'bg-paper-200';
  const fillBg =
    tone === 'over-limit'
      ? 'bg-semantic-danger'
      : tone === 'warning'
        ? 'bg-semantic-warning'
        : 'bg-sage-500';
  const label =
    tone === 'over-limit'
      ? `⚠️ Exceeded Credit Limit by ${formatPesos(surplusPesos)}`
      : tone === 'warning'
        ? 'Approaching credit limit'
        : 'Within credit limit';
  const labelTone =
    tone === 'over-limit'
      ? 'text-semantic-danger'
      : tone === 'warning'
        ? 'text-semantic-warning'
        : 'text-sage-700';

  return (
    <View className="px-5 pt-4 pb-1">
      <View className="flex-row items-baseline justify-between mb-1.5">
        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Credit Limit
        </StyledText>
        <StyledText variant="medium" className="text-mono text-ink-500">
          of {formatPesos(limit)}
        </StyledText>
      </View>
      <View className={`h-2 rounded-full ${trackBg} overflow-hidden`}>
        <View
          className={`h-full rounded-full ${fillBg}`}
          style={{ width: `${widthPct}%` }}
        />
      </View>
      <StyledText
        variant="extrabold"
        className={`text-mono mt-1.5 ${labelTone}`}
        style={{ fontSize: 11 }}
      >
        {label}
      </StyledText>
    </View>
  );
}
