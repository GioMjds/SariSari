import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

export interface DashboardQuickActionsProps {
  onNewSale: () => void;
  onAddProduct: () => void;
  onAddStock: () => void;
  onOpenCredits: () => void;
  onOpenReports: () => void;
  overdueCount?: number;
}

/**
 * DashboardQuickActions — "New Sale" hero row + 2x2 secondary action grid.
 * Layout matches HTML reference: icon top-left, label + subtitle bottom-left, chevron right.
 */
export const DashboardQuickActions = memo(function DashboardQuickActions({
  onNewSale,
  onAddProduct,
  onAddStock,
  onOpenCredits,
  onOpenReports,
  overdueCount = 0,
}: DashboardQuickActionsProps) {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: 100 }}
    >
      <View className="px-4 mb-6">
        {/* Hero New Sale CTA */}
        <NewSaleHero onPress={onNewSale} />

        {/* Section header for secondary actions */}
        <View className="flex-row items-center justify-between mb-3">
          <StyledText
            variant="extrabold"
            className="text-ink-500 text-xs tracking-wider uppercase"
          >
            QUICK ACTIONS
          </StyledText>
        </View>

        {/* 2x2 secondary action grid */}
        <View className="flex-row gap-3 mb-3">
          <ActionCard
            label={t('common:dashboard.quickActions.addProduct', { defaultValue: 'Add Product' })}
            subtitle={t('common:dashboard.quickActions.addProductSub', { defaultValue: 'New catalog item' })}
            icon="plus-square"
            iconColor="#E85A1F"
            iconBg="bg-persimmon-50"
            onPress={onAddProduct}
            accessibilityLabel={t('common:dashboard.quickActions.addProduct', { defaultValue: 'Add Product' })}
          />
          <ActionCard
            label={t('common:dashboard.quickActions.addStock', { defaultValue: 'Add Stock' })}
            subtitle={t('common:dashboard.quickActions.addStockSub', { defaultValue: 'Update inventory' })}
            icon="database"
            iconColor="#4F7A24"
            iconBg="bg-sage-50"
            onPress={onAddStock}
            accessibilityLabel={t('common:dashboard.quickActions.addStock', { defaultValue: 'Add Stock' })}
          />
        </View>

        <View className="flex-row gap-3">
          <ActionCard
            label={t('common:dashboard.quickActions.credits', { defaultValue: 'Utang / Credits' })}
            subtitle={
              overdueCount > 0
                ? t('common:dashboard.quickActions.overdueCount', {
                    defaultValue: '{{count}} overdue',
                    count: overdueCount,
                  })
                : t('common:dashboard.quickActions.creditsSub', { defaultValue: 'Customer ledger' })
            }
            icon="credit-card"
            iconColor="#C8460F"
            iconBg="bg-persimmon-50"
            {...(overdueCount > 0 ? { badge: overdueCount } : {})}
            onPress={onOpenCredits}
            accessibilityLabel={
              overdueCount > 0
                ? `${t('common:dashboard.quickActions.credits', { defaultValue: 'Utang / Credits' })} - ${t('common:dashboard.quickActions.overdueCount', {
                    defaultValue: '{{count}} overdue',
                    count: overdueCount,
                  })}`
                : t('common:dashboard.quickActions.credits', { defaultValue: 'Utang / Credits' })
            }
          />
          <ActionCard
            label={t('common:dashboard.quickActions.reports', { defaultValue: 'Reports' })}
            subtitle={t('common:dashboard.quickActions.reportsSub', { defaultValue: 'Sales & trends' })}
            icon="bar-chart"
            iconColor="#2E6FA8"
            iconBg="bg-semantic-info-50"
            onPress={onOpenReports}
            accessibilityLabel={t('common:dashboard.quickActions.reports', { defaultValue: 'Reports' })}
          />
        </View>
      </View>
    </MotiView>
  );
});

function NewSaleHero({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const label = t('common:dashboard.quickActions.newSale', {
    defaultValue: 'New Sale',
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="bg-persimmon-500 rounded-2xl p-4 mb-5 flex-row items-center border border-persimmon-600 press-scale"
      style={{ minHeight: 64 }}
    >
      <View className="w-10 h-10 rounded-xl bg-persimmon-600 items-center justify-center mr-3">
        <FontAwesome name="plus" size={18} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <StyledText
          variant="extrabold"
          className="text-paper-50 text-base uppercase tracking-wider"
        >
          {label}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-persimmon-100 text-xs mt-0.5"
          numberOfLines={1}
        >
          Start a new transaction
        </StyledText>
      </View>
      <FontAwesome name="chevron-right" size={13} color="#FFE0D1" />
    </TouchableOpacity>
  );
}

function ActionCard({
  label,
  subtitle,
  icon,
  iconColor,
  iconBg,
  badge,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  subtitle: string;
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor: string;
  iconBg: string;
  badge?: number;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="flex-1 bg-paper-50 rounded-2xl p-3 border border-ink-100 press-scale"
      style={{ minHeight: 92 }}
    >
      {/* Icon row with optional badge */}
      <View className="flex-row items-start justify-between mb-3">
        <View className={`w-8 h-8 rounded-lg items-center justify-center ${iconBg}`}>
          <FontAwesome name={icon} size={15} color={iconColor} />
        </View>
        {badge !== undefined && (
          <View className="w-5 h-5 rounded-full bg-persimmon-500 items-center justify-center">
            <StyledText variant="extrabold" className="text-paper-50" style={{ fontSize: 10 }}>
              {badge > 9 ? '9+' : badge}
            </StyledText>
          </View>
        )}
      </View>

      {/* Label + subtitle + chevron */}
      <View className="flex-row items-end justify-between">
        <View className="flex-1 mr-1">
          <StyledText variant="extrabold" className="text-sm text-ink-900" numberOfLines={1}>
            {label}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-500 mt-0.5" numberOfLines={1}>
            {subtitle}
          </StyledText>
        </View>
        <FontAwesome name="chevron-right" size={11} color="#A89F90" />
      </View>
    </TouchableOpacity>
  );
}
