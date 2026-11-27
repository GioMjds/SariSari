import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

export interface DashboardQuickActionsProps {
  onNewSale: () => void;
  onAddProduct: () => void;
  onRestock: () => void;
  onOpenUtang: () => void;
  onOpenReports: () => void;
  overdueCount?: number;
}

type Glyph = keyof typeof FontAwesome.glyphMap;

export const DashboardQuickActions = memo(function DashboardQuickActions({
  onNewSale,
  onAddProduct,
  onRestock,
  onOpenUtang,
  onOpenReports,
  overdueCount = 0,
}: DashboardQuickActionsProps) {
  const { t } = useTranslation('common');
  const newSale = t('dashboard.quickActions.newSale');
  const utang = t('dashboard.quickActions.utang', { defaultValue: 'Utang' });

  return (
    <View className="px-4 mb-6">
      <Pressable
        onPress={onNewSale}
        accessibilityRole="button"
        accessibilityLabel={newSale}
        className="bg-persimmon-600 rounded-2xl px-4 flex-row items-center active:bg-persimmon-700"
        style={{ minHeight: 64 }}
      >
        <View className="w-10 h-10 rounded-xl bg-persimmon-700 items-center justify-center mr-3">
          <FontAwesome name="plus" size={18} color="#FAFAF7" />
        </View>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-base text-paper-50">
            {newSale}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-caption text-paper-50 mt-0.5"
            numberOfLines={2}
          >
            {t('dashboard.quickActions.newSaleSub', {
              defaultValue: 'Ring up cash or utang',
            })}
          </StyledText>
        </View>
        <FontAwesome name="chevron-right" size={13} color="#FFE0D1" />
      </Pressable>

      <View className="flex-row gap-2 mt-3">
        <Shortcut
          icon="plus-square"
          label={t('dashboard.quickActions.addShort', {
            defaultValue: 'Add Product',
          })}
          onPress={onAddProduct}
        />
        <Shortcut
          icon="truck"
          label={t('dashboard.quickActions.restock', {
            defaultValue: 'Restock',
          })}
          onPress={onRestock}
        />
        <Shortcut
          icon="book"
          label={utang}
          badge={overdueCount}
          a11yLabel={
            overdueCount > 0
              ? `${utang}, ${t('dashboard.quickActions.overdueCount', {
                  count: overdueCount,
                })}`
              : utang
          }
          onPress={onOpenUtang}
        />
        <Shortcut
          icon="bar-chart"
          label={t('dashboard.quickActions.reports')}
          onPress={onOpenReports}
        />
      </View>
    </View>
  );
});

function Shortcut({
  icon,
  label,
  badge = 0,
  a11yLabel,
  onPress,
}: {
  icon: Glyph;
  label: string;
  badge?: number;
  a11yLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      className="flex-1 items-center bg-paper-50 rounded-2xl border border-ink-100 py-3 px-1 active:bg-paper-100"
      style={{ minHeight: 76 }}
    >
      <View className="w-10 h-10 rounded-xl bg-persimmon-50 items-center justify-center">
        <FontAwesome name={icon} size={17} color="#C8460F" />
        {badge > 0 ? (
          <View
            className="absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-semantic-danger border-2 border-paper-50 items-center justify-center"
            importantForAccessibility="no-hide-descendants"
          >
            <StyledText
              variant="extrabold"
              className="text-[11px] text-white"
              maxFontSizeMultiplier={1.2}
            >
              {badge > 9 ? '9+' : badge}
            </StyledText>
          </View>
        ) : null}
      </View>
      <StyledText
        variant="semibold"
        className="text-caption text-ink-900 mt-1.5 text-center"
        numberOfLines={2}
      >
        {label}
      </StyledText>
    </Pressable>
  );
}
