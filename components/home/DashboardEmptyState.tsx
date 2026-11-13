import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { useTranslation } from 'react-i18next';

interface DashboardEmptyStateProps {
  onAddProduct: () => void;
  onStartFirstSale?: () => void;
}

export const DashboardEmptyState = memo(function DashboardEmptyState({
  onAddProduct,
  onStartFirstSale,
}: DashboardEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <View className="bg-paper-50 mx-4 mb-4 rounded-2xl border border-ink-100 p-5 items-center">
      <SariMascot state="empty" size={120} style={{ marginBottom: 12 }} />
      <StyledText
        variant="extrabold"
        className="label-caps text-ink-400 mb-1 text-center"
      >
        {t('common:emptyEyebrow')}
      </StyledText>
      <StyledText
        variant="black"
        className="text-ink-900 text-lg mb-1 text-center"
      >
        {t('common:emptyTitle')}
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mb-4 text-center"
      >
        {t('common:emptyBody')}
      </StyledText>

      <View className="w-full">
        <TouchableOpacity
          onPress={onAddProduct}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('common:emptyAddProduct')}
          accessibilityHint="Navigates to product creation form"
          className="bg-persimmon-500 rounded-xl py-3.5 flex-row items-center justify-center press-scale"
        >
          <FontAwesome name="plus" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            {t('common:emptyAddProduct')}
          </StyledText>
        </TouchableOpacity>

        {onStartFirstSale && (
          <TouchableOpacity
            onPress={onStartFirstSale}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('common:emptyFirstSale')}
            accessibilityHint="Navigates to sales form"
            className="bg-paper-100 rounded-xl py-3.5 flex-row items-center justify-center border border-ink-200 press-scale mt-2.5"
          >
            <FontAwesome name="shopping-cart" size={14} color="#623418" />
            <StyledText
              variant="extrabold"
              className="text-cinnamon-700 text-sm ml-2"
            >
              {t('common:emptyFirstSale')}
            </StyledText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
