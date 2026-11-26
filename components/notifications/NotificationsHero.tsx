import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { formatPesos } from '@/lib/money';
import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { AlertSummary } from './summary';

interface NotificationsHeroProps {
  total: number;
  summary: AlertSummary;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function NotificationsHeroComponent({
  total,
  summary,
  isLoading,
  isError,
  onRetry,
}: NotificationsHeroProps) {
  const { t } = useTranslation('notifications');

  const facts = [
    summary.out > 0 && t('factOut', { count: summary.out }),
    summary.overdueCount > 0 &&
      t('factOverdue', { amount: formatPesos(summary.overdueAmount) }),
    summary.low > 0 && t('factLow', { count: summary.low }),
    summary.nearLimit > 0 && t('factNearLimit', { count: summary.nearLimit }),
  ].filter(Boolean) as string[];

  // Error wins over loading and empty, so a failed read never reads as "all clear".
  const state = isError
    ? {
        mood: 'error' as const,
        title: t('heroErrorTitle'),
        body: t('heroErrorBody'),
      }
    : isLoading
      ? { mood: 'loading' as const, title: t('heroLoading'), body: null }
      : total === 0
        ? {
            mood: summary.mood,
            title: t('heroClearTitle'),
            body: t('heroClearBody'),
          }
        : {
            mood: summary.mood,
            title: t('heroTitle', { count: total }),
            body: facts.join(' · '),
          };

  return (
    <View className="mx-4 mt-3 mb-1 p-4 rounded-2xl border border-paper-300 bg-paper-50">
      <View
        accessible
        accessibilityRole={isError ? 'alert' : 'summary'}
        accessibilityLabel={[state.title, state.body]
          .filter(Boolean)
          .join('. ')}
        className="flex-row items-center"
      >
        <SariMascot state={state.mood} size={88} animated={false} />
        <View className="flex-1 min-w-0 ml-3">
          <StyledText variant="black" className="text-lg text-ink-900">
            {state.title}
          </StyledText>
          {state.body ? (
            <StyledText variant="medium" className="text-sm text-ink-500 mt-1">
              {state.body}
            </StyledText>
          ) : null}
        </View>
      </View>
      {isError ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-3 min-h-12 rounded-xl bg-persimmon-600 active:bg-persimmon-700 flex-row items-center justify-center"
        >
          <FontAwesome name="refresh" size={14} className="text-white" />
          <StyledText variant="extrabold" className="ml-2 text-sm text-white">
            {t('retry')}
          </StyledText>
        </Pressable>
      ) : null}
    </View>
  );
}

export const NotificationsHero = memo(NotificationsHeroComponent);
