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
      <View className="px-4 mb-4">
        {/* New Sale — full-width persimmon hero */}
        <TouchableOpacity
          onPress={onNewSale}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={t('common:dashboard.quickActions.newSale', { defaultValue: 'New Sale' })}
          accessibilityHint="Navigates directly to sale checkout screen"
          className="bg-persimmon-500 rounded-xl py-4 px-5 flex-row items-center justify-between press-scale mb-3"
        >
          <View className="flex-row items-center">
            <FontAwesome name="plus-circle" size={20} color="#FBF7EE" />
            <StyledText
              variant="black"
              className="text-paper-50 text-lg ml-2.5"
              style={{ letterSpacing: 0.2 }}
            >
              {t('common:dashboard.quickActions.newSale', { defaultValue: 'New Sale' })}
            </StyledText>
          </View>
          <FontAwesome name="arrow-right" size={16} color="#FBF7EE" />
        </TouchableOpacity>

        {/* 2x2 Action grid */}
        <View className="flex-row gap-2.5 mb-2.5">
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

        <View className="flex-row gap-2.5">
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
            badge={overdueCount > 0 ? overdueCount : undefined}
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
      className="flex-1 bg-paper-50 rounded-xl p-3.5 border border-ink-100 press-scale"
      style={{ minHeight: 96 }}
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
