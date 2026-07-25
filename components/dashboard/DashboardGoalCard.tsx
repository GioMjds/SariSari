import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HomeRecommendation, HomeGoalKind } from './home-state';

export interface DashboardGoalCardProps {
  recommendation: HomeRecommendation;
  onPress: () => void;
}

const goalIcons: Record<HomeGoalKind, keyof typeof FontAwesome.glyphMap> = {
  setupCatalog: 'cubes',
  outOfStock: 'exclamation-circle',
  lowStock: 'warning',
  overdueCredits: 'clock-o',
  cashShortfall: 'money',
  openDrawer: 'key',
  reviewClose: 'check-square-o',
  firstSale: 'shopping-cart',
  continueSelling: 'line-chart',
};

export const DashboardGoalCard = memo(function DashboardGoalCard({
  recommendation,
  onPress,
}: DashboardGoalCardProps) {
  const { t } = useTranslation();
  const { kind, count } = recommendation;

  const iconName = goalIcons[kind] || 'star';
  const title = t(`common:goals.${kind}.title`, { defaultValue: 'Next Step' });
  const description = t(`common:goals.${kind}.description`, {
    count,
    defaultValue: 'Store assistant recommendation.',
  });
  const ctaText = t(`common:goals.${kind}.cta`, { defaultValue: 'Continue' });

  return (
    <View className="px-4 mt-3 mb-2">
      <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-sm">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-9 h-9 rounded-xl bg-persimmon-50 items-center justify-center mr-3 border border-persimmon-100">
              <FontAwesome name={iconName} size={18} color="#E85A1F" />
            </View>
            <View className="flex-1">
              <StyledText variant="extrabold" className="text-base text-ink-900">
                {title}
              </StyledText>
            </View>
          </View>

          {count !== undefined && count > 0 && (
            <View className="bg-persimmon-100 px-2.5 py-1 rounded-full border border-persimmon-200">
              <StyledText variant="extrabold" className="text-xs text-persimmon-800">
                {count}
              </StyledText>
            </View>
          )}
        </View>

        <StyledText variant="regular" className="text-sm text-ink-600 mb-4 leading-5">
          {description}
        </StyledText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaText}
          accessibilityHint="Executes primary store assistant recommendation"
          onPress={onPress}
          className="w-full bg-persimmon-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center active:opacity-90 press-scale"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm mr-2">
            {ctaText}
          </StyledText>
          <FontAwesome name="arrow-right" size={14} color="#FBF7EE" />
        </Pressable>
      </View>
    </View>
  );
});
