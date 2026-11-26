import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { formatPesos } from '@/lib/money';
import type { AlertSummary } from './summary';

interface NotificationsHeroProps {
  total: number;
  summary: AlertSummary;
  isLoading: boolean;
}

function NotificationsHeroComponent({
  total,
  summary,
  isLoading,
}: NotificationsHeroProps) {
  const { t } = useTranslation('notifications');

  const facts = [
    summary.out > 0 && t('factOut', { count: summary.out }),
    summary.overdueCount > 0 &&
      t('factOverdue', { amount: formatPesos(summary.overdueAmount) }),
    summary.low > 0 && t('factLow', { count: summary.low }),
    summary.nearLimit > 0 && t('factNearLimit', { count: summary.nearLimit }),
  ].filter(Boolean) as string[];

  const title = isLoading
    ? t('heroLoading')
    : total === 0
      ? t('heroClearTitle')
      : t('heroTitle', { count: total });
  const body = total === 0 ? t('heroClearBody') : facts.join(' · ');

  return (
    <View
      accessible
      accessibilityLabel={isLoading ? title : `${title}. ${body}`}
      className="mx-4 mt-3 mb-1 p-4 rounded-2xl border border-paper-300 bg-paper-50 flex-row items-center"
    >
      <SariMascot state={isLoading ? 'loading' : summary.mood} size={88} />
      <View className="flex-1 min-w-0 ml-3">
        <StyledText variant="black" className="text-lg text-ink-900">
          {title}
        </StyledText>
        {!isLoading ? (
          <StyledText variant="medium" className="text-sm text-ink-500 mt-1">
            {body}
          </StyledText>
        ) : null}
      </View>
    </View>
  );
}

export const NotificationsHero = memo(NotificationsHeroComponent);
