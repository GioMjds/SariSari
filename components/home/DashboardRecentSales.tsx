import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import { SaleWithItems } from '@/types/sales.types';
import { DashboardSection } from './DashboardSection';

export interface DashboardRecentSalesProps {
  sales: SaleWithItems[];
  onOpenSale: (saleId: number) => void;
  onSeeAll?: () => void;
}

function timeAgo(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return '';
  const diff = Date.now() - parsed.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SALE_ROW_CLASS_PRESETS = {
  last: 'flex-row items-center justify-between px-4 py-3 min-h-[60px] active:bg-paper-100',
  notLast:
    'flex-row items-center justify-between px-4 py-3 min-h-[60px] active:bg-paper-100 border-b border-ink-100',
} as const;

export const DashboardRecentSales = memo(function DashboardRecentSales({
  sales,
  onOpenSale,
  onSeeAll,
}: DashboardRecentSalesProps) {
  const { t } = useTranslation();

  if (!sales || sales.length === 0) {
    return null;
  }

  const title = t('common:dashboard.recentActivity.title', {
    defaultValue: 'Recent Activity',
  });
  const viewAllSales = t('common:dashboard.recentActivity.seeAll');

  return (
    <DashboardSection
      testID="recent-sales"
      title={title}
      actionLabel={onSeeAll ? viewAllSales : undefined}
      onAction={onSeeAll}
    >
      <View>
        {sales.slice(0, 3).map((sale, index) => {
          const itemCount = sale.items_count || sale.items?.length || 0;
          const isLast = index === Math.min(sales.length, 3) - 1;
          const isCash = sale.payment_type?.toLowerCase() === 'cash';
          const ago = sale.timestamp ? timeAgo(sale.timestamp) : '';

          return (
            <Pressable
              key={sale.id}
              onPress={() => onOpenSale(sale.id)}
              accessibilityRole="button"
              accessibilityLabel={t(
                'common:dashboard.recentActivity.saleAccessibilityLabel',
                {
                  defaultValue: 'Sale #{{id}}, {{total}}',
                  id: sale.id,
                  total: formatPesos(sale.total),
                },
              )}
              className={
                isLast
                  ? SALE_ROW_CLASS_PRESETS.last
                  : SALE_ROW_CLASS_PRESETS.notLast
              }
            >
              {/* Receipt icon */}
              <View className="w-9 h-9 rounded-xl bg-paper-100 items-center justify-center mr-3 border border-ink-100">
                <FontAwesome name="file-text-o" size={14} color="#623418" />
              </View>

              {/* Sale info */}
              <View className="flex-1 mr-2">
                <StyledText variant="semibold" className="text-sm text-ink-900">
                  {t('common:dashboard.recentActivity.saleLabel', {
                    defaultValue: 'Sale #{{id}}',
                    id: sale.id,
                  })}
                </StyledText>
                <View className="flex-row items-center mt-0.5">
                  <StyledText
                    variant="regular"
                    className="text-xs text-ink-500"
                  >
                    {t('common:dashboard.recentActivity.itemCount', {
                      defaultValue_one: '{{count}} item',
                      defaultValue_other: '{{count}} items',
                      defaultValue: '{{count}} items',
                      count: itemCount,
                    })}{' '}
                    ·{' '}
                  </StyledText>
                  <StyledText
                    variant="extrabold"
                    style={{ fontSize: 10, letterSpacing: 0.6 }}
                    className={isCash ? 'text-sage-500' : 'text-persimmon-600'}
                  >
                    {t(
                      isCash
                        ? 'common:dashboard.recentActivity.cash'
                        : 'common:dashboard.recentActivity.utang',
                    ).toUpperCase()}
                  </StyledText>
                </View>
              </View>

              {/* Amount + time + chevron */}
              <View className="flex-row items-center">
                <View className="items-end mr-2">
                  <StyledText variant="black" className="text-sm text-ink-900">
                    {formatPesos(sale.total)}
                  </StyledText>
                  {ago ? (
                    <StyledText
                      variant="regular"
                      className="text-xs text-ink-400 mt-0.5"
                    >
                      {ago}
                    </StyledText>
                  ) : null}
                </View>
                <FontAwesome name="chevron-right" size={11} color="#A89F90" />
              </View>
            </Pressable>
          );
        })}
      </View>
    </DashboardSection>
  );
});
