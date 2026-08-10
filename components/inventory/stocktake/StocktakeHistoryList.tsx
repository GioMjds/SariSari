import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusPill } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeHistoryListProps {
  sessions: StocktakeSession[];
}

export function StocktakeHistoryList({ sessions }: StocktakeHistoryListProps) {
  if (sessions.length === 0) return null;

  return (
    <View className="gap-y-2 mt-4">
      <StyledText
        variant="extrabold"
        className="text-ink-800 text-sm uppercase px-1"
      >
        Recent Stocktakes
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
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {s.totalProductsCounted} products counted
            </StyledText>
          </View>
          <View className="items-end gap-y-1">
            <StatusPill
              variant={s.status === 'completed' ? 'success' : 'neutral'}
            >
              {s.status}
            </StatusPill>
            {s.status === 'completed' && (
              <MoneyText
                value={s.totalVariancePesos}
                className={`text-xs font-semibold ${
                  s.totalVariancePesos < 0
                    ? 'text-semantic-danger'
                    : 'text-sage-700'
                }`}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
