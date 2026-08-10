import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeStartCardProps {
  lastSession: StocktakeSession | null;
  onStart: () => void;
  isStarting?: boolean;
}

export function StocktakeStartCard({
  lastSession,
  onStart,
  isStarting = false,
}: StocktakeStartCardProps) {
  const { t } = useTranslation('stocktake');

  return (
    <View className="bg-paper-50 rounded-2xl p-5 border border-paper-300 shadow-sm gap-y-4">
      <View className="flex-row items-center gap-x-3">
        <View className="w-10 h-10 rounded-full bg-persimmon-100 items-center justify-center">
          <FontAwesome name="clipboard" size={18} color="#E85A1F" />
        </View>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-lg">
            {t('title')}
          </StyledText>
          {lastSession ? (
            <StyledText
              variant="medium"
              className="text-ink-500 text-xs mt-0.5"
            >
              {new Date(lastSession.createdAt).toLocaleDateString()} ·{' '}
              {lastSession.totalProductsCounted} counted
            </StyledText>
          ) : (
            <StyledText
              variant="medium"
              className="text-ink-500 text-xs mt-0.5"
            >
              No recent counts
            </StyledText>
          )}
        </View>
      </View>

      {lastSession ? (
        <View className="bg-paper-100 rounded-xl p-3 flex-row items-center justify-between border border-paper-200">
          <StyledText variant="semibold" className="text-ink-600 text-xs">
            Net Variance:
          </StyledText>
          <MoneyText
            value={lastSession.totalVariancePesos}
            className={`text-sm font-bold ${
              lastSession.totalVariancePesos < 0
                ? 'text-semantic-danger'
                : 'text-sage-700'
            }`}
          />
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onStart}
        disabled={isStarting}
        accessibilityRole="button"
        accessibilityLabel={t('startCta')}
        className="w-full bg-persimmon-500 rounded-xl py-3.5 items-center justify-center flex-row gap-x-2 active:bg-persimmon-600"
      >
        <FontAwesome name="play" size={14} color="#FFFFFF" />
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          {t('startCta')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
