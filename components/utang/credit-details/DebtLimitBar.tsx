import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';
import type { DebtLimitState } from '@/lib/creditDetails';

const TONE = {
  safe: { track: 'bg-paper-200', fill: 'bg-sage-500', text: 'text-sage-700' },
  warning: {
    track: 'bg-semantic-warning-50',
    fill: 'bg-semantic-warning',
    text: 'text-semantic-warning',
  },
  'over-limit': {
    track: 'bg-semantic-danger-50',
    fill: 'bg-semantic-danger',
    text: 'text-semantic-danger',
  },
} as const;

export function DebtLimitBar({
  state,
  balance,
  limit,
}: {
  state: DebtLimitState;
  balance: number;
  limit: number;
}) {
  const { t } = useTranslation('utang');
  const tone = TONE[state.tone];
  const widthPct = Math.max(2, Math.min(100, state.ratio * 100));
  const left = formatPesos(Math.max(0, limit - balance));
  const message =
    state.tone === 'over-limit'
      ? t('detailLimitOver', { amount: formatPesos(state.surplusPesos) })
      : state.tone === 'warning'
        ? t('detailLimitNear', { amount: left })
        : t('detailLimitSafe', { amount: left });

  return (
    <View
      accessible
      accessibilityLabel={`${t('detailLimitLabel')}: ${message}`}
    >
      <View className="flex-row items-baseline justify-between mb-1.5">
        <StyledText variant="semibold" className="text-ink-600 text-xs">
          {t('detailLimitLabel')}
        </StyledText>
        <StyledText variant="medium" className="text-mono text-ink-500">
          {t('detailLimitOf', {
            used: formatPesos(balance),
            limit: formatPesos(limit),
          })}
        </StyledText>
      </View>
      <View className={`h-2 rounded-full ${tone.track} overflow-hidden`}>
        <View
          className={`h-full rounded-full ${tone.fill}`}
          style={{ width: `${widthPct}%` }}
        />
      </View>
      <StyledText variant="semibold" className={`text-xs mt-1.5 ${tone.text}`}>
        {message}
      </StyledText>
    </View>
  );
}
