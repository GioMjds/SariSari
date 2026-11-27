import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import type { TopSeller } from '@/hooks/useHomeDashboardData';
import { DashboardSection } from './DashboardSection';

export interface DashboardTopSellersProps {
  sellers: TopSeller[];
  onSeeReport: () => void;
}

// Units only: per-product revenue includes utang checkouts, which are not sales.
export const DashboardTopSellers = memo(function DashboardTopSellers({
  sellers,
  onSeeReport,
}: DashboardTopSellersProps) {
  const { t } = useTranslation('common');
  if (sellers.length === 0) return null;

  return (
    <DashboardSection
      testID="home-top-sellers"
      title={t('dashboard.topSellers.title', {
        defaultValue: 'Top sellers today',
      })}
      actionLabel={t('dashboard.topSellers.action', { defaultValue: 'Report' })}
      onAction={onSeeReport}
    >
      {sellers.map((p, index) => {
        const units = t('dashboard.topSellers.units', { count: p.unitsSold });
        return (
          <View
            key={p.id}
            accessible
            accessibilityLabel={`${index + 1}. ${p.name}, ${units}`}
            className={`flex-row items-center px-4 py-3 ${
              index > 0 ? 'border-t border-ink-100' : ''
            }`}
          >
            <View
              className={`w-7 h-7 rounded-lg items-center justify-center mr-3 ${
                index === 0 ? 'bg-cinnamon-500' : 'bg-paper-300'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-caption ${index === 0 ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {index + 1}
              </StyledText>
            </View>
            <StyledText
              variant="semibold"
              className="flex-1 mr-2 text-sm text-ink-900"
              numberOfLines={1}
            >
              {p.name}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-sm text-ink-900"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {units}
            </StyledText>
          </View>
        );
      })}
    </DashboardSection>
  );
});
