import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusPill } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeHistoryListProps {
  sessions: StocktakeSession[];
}

export function StocktakeHistoryList({ sessions }: StocktakeHistoryListProps) {
  const { t } = useTranslation('stocktake');
  if (sessions.length === 0) return null;

  return (
    <View className="gap-y-2 mt-4">
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="text-ink-900 text-base px-1"
      >
        {t('recentCounts')}
      </StyledText>
      {sessions.map((s) => (
        <View
          key={s.id}
          className="bg-paper-50 rounded-xl p-4 border border-paper-200 flex-row items-center justify-between"
        >
          <View className="gap-y-1 flex-1">
            <StyledText variant="semibold" className="text-ink-900 text-sm">
              {new Date(s.createdAt).toLocaleDateString()}
            </StyledText>
            <StyledText variant="medium" className="text-ink-600 text-sm">
              {s.totalProductsCounted} {t('countedSuffix')}
            </StyledText>
          </View>
          <View className="items-end gap-y-1">
            <StatusPill
              variant={s.status === 'completed' ? 'success' : 'neutral'}
            >
              {t(`status.${s.status}`)}
            </StatusPill>
            {s.status === 'completed' && (
              <MoneyText
                value={s.totalVariancePesos}
                size="sm"
                variant={s.totalVariancePesos < 0 ? 'danger' : 'default'}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
