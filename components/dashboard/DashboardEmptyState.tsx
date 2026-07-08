import { memo } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';

const sariImage = require('@/assets/images/sari-emotions/sari-empty-state.png');

interface DashboardEmptyStateProps {
  onAddProduct: () => void;
  onStartFirstSale: () => void;
}

/**
 * DashboardEmptyState — setup nudges for a brand-new store.
 *
 * Renders inside the attention-queue slot when there are no products
 * and no sales yet. Two big paper buttons: Add Product starts the
 * catalog, Start First Sale routes to the POS so the owner can begin
 * recording transactions immediately.
 */
export const DashboardEmptyState = memo(function DashboardEmptyState({
  onAddProduct,
  onStartFirstSale,
}: DashboardEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <View
      className="bg-paper-50 mx-4 mb-4 rounded-xl border border-ink-100 p-5 items-center"
    >
      <Image
        source={sariImage}
        style={{ width: 120, height: 120, marginBottom: 12 }}
        resizeMode="contain"
      />
      <StyledText variant="extrabold" className="label-caps text-ink-400 mb-1 text-center">
        {t('common:emptyEyebrow')}
      </StyledText>
      <StyledText variant="black" className="text-ink-900 text-lg mb-1 text-center">
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
          className="bg-persimmon-500 rounded-pill py-3 flex-row items-center justify-center mb-2.5 press-scale"
        >
          <FontAwesome name="plus" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-paper-50 text-sm ml-2"
          >
            {t('common:emptyAddProduct')}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onStartFirstSale}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('common:emptyFirstSale')}
          className="bg-paper-100 rounded-pill py-3 flex-row items-center justify-center border border-ink-200 press-scale"
        >
          <FontAwesome name="shopping-cart" size={14} color="#623418" />
          <StyledText
            variant="extrabold"
            className="text-cinnamon-700 text-sm ml-2"
          >
            {t('common:emptyFirstSale')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
});