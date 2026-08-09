import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

export interface DashboardStockAlertProps {
  lowStockCount: number;
  onRestock: () => void;
}

export const DashboardStockAlert = memo(function DashboardStockAlert({
  lowStockCount,
  onRestock,
}: DashboardStockAlertProps) {
  const { t } = useTranslation();

  if (lowStockCount === 0) return null;

  const message = t('common:dashboard.stockAlert.message', {
    defaultValue_one: '{{count}} item running low',
    defaultValue_other: '{{count}} items running low',
    defaultValue: '{{count}} items running low',
    count: lowStockCount,
  });
  const sub = t('common:dashboard.stockAlert.sub', {
    defaultValue: 'Restock before you run out',
  });
  const cta = t('common:dashboard.stockAlert.cta', { defaultValue: 'Restock' });

  return (
    <View className="px-4 mb-3">
      <Pressable
        onPress={onRestock}
        accessibilityRole="button"
        accessibilityLabel={`${message}. ${cta}`}
        className="flex-row items-center justify-between bg-paper-50 rounded-xl px-4 py-3 border border-ink-100 active:opacity-80"
      >
        <View className="flex-row items-center flex-1 mr-3">
          <FontAwesome
            name="exclamation-triangle"
            size={14}
            color="#C77B0E"
            style={{ marginRight: 10 }}
          />
          <View className="flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-900">
              {message}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-xs text-ink-500 mt-0.5"
            >
              {sub}
            </StyledText>
          </View>
        </View>
        <View className="flex-row items-center">
          <StyledText
            variant="extrabold"
            className="text-sm text-persimmon-500 mr-1"
          >
            {cta}
          </StyledText>
          <FontAwesome name="arrow-right" size={11} color="#E85A1F" />
        </View>
      </Pressable>
    </View>
  );
});
